// ============================================================
//  Renderizador do mundo — pixel art com profundidade,
//  iluminação, vida ambiental e interiores detalhados.
// ============================================================
import {
  game, npcPos, customBuildingsList, screenToWorld, tileAt, currentRegion,
  currentRegionDef, currentTiles, currentBuildings, currentNpcs,
  INTERIOR_W, INTERIOR_H, INTERIOR_DEFS,
} from "./state.js";
import { TILE_SIZE, TILE, CROPS, BUILDINGS, BUILD_OPTIONS, PLAYER_SKINS, npcPosition, ALL_NPCS } from "../../shared/constants.js";
import { SEASON_ART, PIX, C, shade, alpha, mix } from "./art/palette.js";
import { mkCanvas, hash, cached, inkText } from "./art/pixel.js";
import { characterFrames, actionFrames, specForSkin, NPC_SPECS, drawCharacter, feetAnchor, CHAR_W, CHAR_H, seasonSpec, isPremiumNpc, premiumReady, drawPremiumNpc } from "./art/characters.js";
import { buildCustomSpec } from "../../shared/constants.js";
import { sanitizeLook } from "../../shared/looks.js";
import { buildGround, drawWaterTile, drawMapBorder } from "./art/ground.js";
import { buildingSprite, buildingNightLights } from "./art/buildings.js";
import {
  treeParts, treeSprite, bushSprite, rockSprite, flowerSprite, grassTuftSprite, fenceSprite,
  lampSprite, lampGlow, benchSprite, signSprite, mailboxSprite, barrelSprite,
  crateSprite, potSprite, wellSprite, fountainSprite, statueSprite, flagSprite,
  logPileSprite, haySprite, scarecrowSprite, pierSprite, palmSprite,
  stalagmiteSprite, pebbleSprite, bonesSprite,
} from "./art/props.js";
import { critterSprites, catSprites, birdSprites, butterflySprites, fishSprite } from "./art/critters.js";
import { drawAmbient, drawWindParticles } from "./art/ambient.js";
import { applyDaylight, lightState, glow, sunRays } from "./art/lighting.js";
import { renderInterior } from "./art/interior.js";

const TS = TILE_SIZE * 2.35; // zoom Stardew forte: user disse POV muito aberto, precisa ver muito menos (comparado com Stardew screenshot)
const HALF = TS / 2;

// ------------------------------------------------------------------
//  Cache do chão
// ------------------------------------------------------------------
const groundCache = new Map();
function tilesSignature(tiles, region, season) {
  let sum = 0;
  for (let y = 0; y < tiles.length; y += 3) {
    const row = tiles[y];
    for (let x = 0; x < row.length; x += 3) sum = (sum * 31 + row[x]) >>> 0;
  }
  return `${region}:${season}:${tiles.length}x${tiles[0]?.length}:${sum}`;
}
function blockedFor(buildings) {
  const set = new Set();
  for (const b of buildings) {
    for (let y = b.y - 1; y < b.y + b.h + 1; y++)
      for (let x = b.x - 1; x < b.x + b.w + 1; x++) set.add(`${x},${y}`);
  }
  return set;
}
function groundFor(region, season) {
  const tiles = currentTiles();
  if (!tiles?.length) return null;
  const sig = tilesSignature(tiles, region, season);
  let entry = groundCache.get(sig);
  if (!entry) {
    const blocked = blockedFor(currentBuildings());
    const canvas = buildGround(region, tiles, season, blocked);
    entry = { canvas, sig };
    groundCache.set(sig, entry);
    if (groundCache.size > 4) groundCache.delete(groundCache.keys().next().value);
  }
  return entry.canvas;
}

/** Props da caverna: estalagmites, pedras soltas e ossadas. */
function propsForCave(region, tiles, list) {
  const H = tiles.length, W = tiles[0]?.length || 0;
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      if (tiles[y][x] !== TILE.CAVE_FLOOR) continue;
      const h = hash(x, y, 441);
      // só encosta em parede ou no meio de salões grandes
      const wallNear =
        tiles[y - 1]?.[x] === TILE.CAVE_WALL || tiles[y + 1]?.[x] === TILE.CAVE_WALL ||
        tiles[y]?.[x - 1] === TILE.CAVE_WALL || tiles[y]?.[x + 1] === TILE.CAVE_WALL;
      if (wallNear && h > 0.80) {
        list.push({ kind: "stalagmite", x: x + 0.5, y: y + 0.9, seed: x * 17 + y * 31 });
      } else if (!wallNear && h > 0.965) {
        list.push({ kind: "pebble", x: x + 0.4 + h * 0.2, y: y + 0.8, seed: x + y * 7 });
      } else if (h > 0.995) {
        list.push({ kind: "bones", x: x + 0.5, y: y + 0.85, seed: x * 3 + y });
      }
    }
  }
}

// ------------------------------------------------------------------
//  Props determinísticos (visual, sem colisão)
// ------------------------------------------------------------------
const propCache = new Map();
function propsFor(region, season, tiles) {
  const key = `${region}:${season}:${tiles.length}x${tiles[0]?.length}`;
  if (propCache.has(key)) return propCache.get(key);
  const list = [];
  // caverna tem props próprios (estalagmites, ossos) — nada de grama lá dentro
  if (String(region).startsWith("caverna")) {
    propsForCave(region, tiles, list);
    propCache.set(key, list);
    return list;
  }
  const H = tiles.length, W = tiles[0].length;
  const nearBuilding = (x, y, pad = 0) => currentBuildings().some(
    (b) => x >= b.x - pad && x < b.x + b.w + pad && y >= b.y - pad && y < b.y + b.h + pad
  );
  const isPathish = (t) => t === TILE.PATH || t === TILE.STONE || t === TILE.BRIDGE || t === TILE.WOOD;
  // distância até a floresta (1..3), usada para "vazar" árvores na borda
  const nearForest = (x, y, tl) => {
    for (let r = 1; r <= 2; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
          const nt = tl[y + dy]?.[x + dx];
          if (nt === TILE.DARK_GRASS) {
            // mais perto = mais chance
            return hash(x, y, 130 + r) > 0.35 + (r - 1) * 0.3;
          }
        }
      }
    }
    return false;
  };

  // árvores na floresta e bosques
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const t = tiles[y][x];
      const h = hash(x, y, 101);
      if (t === TILE.DARK_GRASS) {
        // floresta densa: árvores grandes ordenadas por profundidade
        const n = hash(x * 0.35 | 0, y * 0.35 | 0, 111);
        if (h > 0.62) {
          list.push({
            kind: "tree",
            x: x + 0.35 + hash(x, y, 112) * 0.4,
            y: y + 0.85 + hash(y, x, 113) * 0.2,
            variant: (x * 7 + y * 5 + (n > 0.72 ? 1 : 0)) % 3,
            seed: x * 31 + y * 17,
          });
        }
        if (h > 0.9) list.push({ kind: "bush", x: x + 0.2 + h * 0.4, y: y + 0.75, seed: x + y * 3 });
        if (hash(x, y, 102) > 0.95) list.push({ kind: "rock", x: x + 0.35, y: y + 0.7, seed: x * 5 + y });
      } else if (t === TILE.GRASS && !nearBuilding(x, y, 2) && nearForest(x, y, tiles) && hash(x, y, 103) > 0.86) {
        // árvores "vazando" da floresta: quebra a linha reta da borda
        list.push({
          kind: "tree",
          x: x + 0.35 + hash(x, y, 121) * 0.4,
          y: y + 0.8 + hash(y, x, 122) * 0.25,
          variant: (x * 5 + y * 7) % 3,
          seed: x * 23 + y * 41,
        });
      } else if (t === TILE.GRASS && !nearBuilding(x, y, 1) && hash(x, y, 103) > 0.988) {
        // raras árvores soltas no campo, fora dos caminhos
        list.push({ kind: "tree", x: x + 0.5, y: y + 0.92, variant: (x + y) % 4, seed: x * 13 + y * 29 });
      }
      // flores e arbustos decorativos perto de caminhos
      if (t === TILE.GRASS && !nearBuilding(x, y, 0)) {
        const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => isPathish(tiles[y + dy]?.[x + dx]));
        if (near && hash(x, y, 104) > 0.72) {
          list.push({ kind: hash(x, y, 105) > 0.5 ? "tuft" : "flower", x: x + 0.15 + hash(x, y, 106) * 0.6, y: y + 0.55 + hash(y, x, 107) * 0.3, variant: Math.floor(hash(x, y, 108) * 4) });
        }
      }
    }
  }

  // Farm enhancements to mirror Stardew farm screenshot (bottom farm)
  const addFarmDecor = (region, tiles) => {
    // barrel stacks like in screenshot (4 barrels clustered)
    for (const [bx,by] of [[19.5,38.4],[20.1,38.4],[19.5,39.0],[20.2,39.0]]) list.push({ kind: "barrel", x: bx, y: by });
    // stone brazier lamps with warm glow
    for (const [lx,ly] of [[14.2,38.2],[26.4,38.4],[14.6,43.8],[26.2,43.6]]) list.push({ kind: "lamp", x: lx, y: ly });
    // scattered logs/woodpile
    list.push({ kind: "logs", x: 15.2, y: 44.2 }); list.push({ kind: "logs", x: 24.8, y: 44.6 });
    // fence lining farm beds (short wood fences as in screenshot)
    for (let x=13; x<=27; x++) { if (x!=19 && x!=20) list.push({ kind: "fence", x: x+0.3, y: 37.8 }); list.push({ kind: "fence", x: x+0.3, y: 44.2 }); }
    for (let y=38; y<=44; y++) { list.push({ kind: "fence", x: 13.2, y: y }); list.push({ kind: "fence", x: 27.4, y: y }); }
  };

  // ---------------- cenário urbano curado ----------------
  if (region === "vale") {
    // praça central: fonte + bancos + postes + canteiros
    list.push({ kind: "fountain", x: 37.6, y: 24.2 });
    for (const [bx, by] of [[35.2, 24.0], [39.8, 24.0], [37.6, 22.2], [37.6, 26.0]]) {
      list.push({ kind: "bench", x: bx, y: by, rot: bx === 37.6 ? 1 : 0 });
    }
    for (const [lx, ly] of [[34.6, 22.4], [40.8, 22.4], [34.6, 26.2], [40.8, 26.2]]) list.push({ kind: "lamp", x: lx, y: ly });
    for (const [px, py] of [[35.6, 23.0], [39.4, 23.0], [35.6, 25.4], [39.4, 25.4]]) list.push({ kind: "flowerbed", x: px, y: py });

    // rua principal: postes e vasos
    for (let x = 27; x <= 52; x += 6) list.push({ kind: "lamp", x: x + 0.4, y: 15.6 });
    for (let x = 26; x <= 50; x += 8) list.push({ kind: "lamp", x: x + 0.4, y: 27.4 });
    list.push({ kind: "signpost", x: 25.2, y: 20.5 });
    list.push({ kind: "signpost", x: 53.0, y: 27.6 });
    list.push({ kind: "well", x: 23.4, y: 24.6 });
    list.push({ kind: "statue", x: 31.4, y: 27.2 });
    list.push({ kind: "mailbox", x: 19.2, y: 19.4 });
    list.push({ kind: "mailbox", x: 42.6, y: 26.2 });
    list.push({ kind: "flag", x: 29.4, y: 13.0 });
    // ferraria: barril, bigorna, carvão
    list.push({ kind: "barrel", x: 46.4, y: 22.6 });
    list.push({ kind: "crate", x: 53.2, y: 22.4 });
    // taverna: barris, mesas externas
    list.push({ kind: "barrel", x: 37.2, y: 22.6 });
    list.push({ kind: "barrel", x: 38.0, y: 22.6 });
    list.push({ kind: "bench", x: 36.0, y: 22.2 });
    // mercado: caixas de produtos
    list.push({ kind: "crate", x: 28.3, y: 22.4 });
    list.push({ kind: "crate", x: 29.0, y: 22.5 });
    list.push({ kind: "pot", x: 33.4, y: 22.2, variant: 1 });
    // carpintaria: lenha
    list.push({ kind: "logs", x: 47.2, y: 14.2 });
    list.push({ kind: "logs", x: 52.0, y: 14.2 });
    list.push({ kind: "logs", x: 52.4, y: 13.6 });
    // celeiro: feno e espantalho
    list.push({ kind: "hay", x: 14.6, y: 35.6 });
    list.push({ kind: "hay", x: 15.8, y: 35.8 });
    list.push({ kind: "scarecrow", x: 22.4, y: 34.2 });
    // fazenda: cerca do jardim
    for (let x = 14; x <= 19; x++) list.push({ kind: "fence", x, y: 20.4 });
    for (let y = 21; y <= 23; y++) list.push({ kind: "fence", x: 14, y: y });
    // costa: píer e barcos
    list.push({ kind: "pier", x: 28.2, y: 45.6 });
    list.push({ kind: "pier", x: 33.0, y: 45.6 });
    list.push({ kind: "crate", x: 30.2, y: 47.2 });
    // campo de flores perto da casa
    for (const [fx, fy] of [[12.4, 18.4], [13.2, 18.8], [11.8, 19.6], [21.6, 18.4], [22.4, 19.0]]) {
      list.push({ kind: "flowerbed", x: fx, y: fy });
    }
    addFarmDecor(region, tiles);
    // Árvores ao redor da casa isolada (história: casa abandonada precisa limpar)
    // casa em 8,38 — anel de árvores e tocos para quebrar
    for(const [tx,ty] of [[6,36],[7,36],[9,36],[10,36],[6,37],[11,37],[6,38],[12,38],[6,39],[12,39],[6,40],[7,40],[11,40],[8,41],[9,41],[10,41]]){
      if (hash(tx,ty,200) > 0.15) list.push({ kind:"tree", x: tx+0.5, y: ty+0.9, variant: (tx+ty)%3, seed: tx*31+ty*17 });
    }
    // arbustos e pedras espalhados
    for(const [bx,by] of [[7,37.5],[10,37.5],[7,39.5],[10,39.5]]) list.push({ kind:"bush", x:bx, y:by, seed: bx*5+by });
  } else if (region === "vila") {
    for (const [lx, ly] of [[8, 8], [20, 8], [8, 20], [22, 20], [15, 26]]) list.push({ kind: "lamp", x: lx, y: ly });
    for (const [bx, by] of [[10, 10], [19, 10], [10, 19], [19, 19]]) list.push({ kind: "bench", x: bx, y: by });
    for (const [cx, cy] of [[6.4, 6.6], [21.2, 7.2], [7.2, 22.4]]) list.push({ kind: "crate", x: cx, y: cy });
    list.push({ kind: "barrel", x: 18.4, y: 18.2 });
    list.push({ kind: "signpost", x: 12.2, y: 23.4 });
  } else if (region === "ilha") {
    for (let i = 0; i < 14; i++) {
      const x = 4 + (hash(i, 3, 9) * 24) | 0;
      const y = 4 + (hash(3, i, 9) * 20) | 0;
      if (tiles[y]?.[x] === TILE.GRASS) list.push({ kind: "palm", x: x + 0.5, y: y + 0.9, seed: i });
    }
    list.push({ kind: "signpost", x: 9.4, y: 13.4 });
    list.push({ kind: "crate", x: 15.4, y: 16.6 });
    for (const [bx, by] of [[11, 15], [13, 15]]) list.push({ kind: "bench", x: bx, y: by });
  } else if (region === "cidade") {
    for (let x = 4; x < 30; x += 5) list.push({ kind: "lamp", x: x + 0.4, y: 9.4 });
    for (let x = 6; x < 30; x += 7) list.push({ kind: "bench", x: x + 0.3, y: 16.4 });
    for (const [tx, ty] of [[8.4, 5.4], [20.4, 5.4], [26.4, 13.4]]) list.push({ kind: "crate", x: tx, y: ty });
    list.push({ kind: "signpost", x: 12.4, y: 12.4 });
  }

  list.sort((a, b) => a.y - b.y);
  propCache.set(key, list);
  return list;
}

function propSprite(p, season) {
  switch (p.kind) {
    case "tree": return treeSprite(season, p.variant, p.seed);
    case "palm": return palmSprite(season, p.seed);
    case "bush": return bushSprite(season, p.seed);
    case "rock": return rockSprite(p.seed);
    case "stalagmite": return stalagmiteSprite(p.seed);
    case "pebble": return pebbleSprite(p.seed);
    case "bones": return bonesSprite(p.seed);
    case "flower": return flowerSprite(season, p.variant);
    case "tuft": return grassTuftSprite(season, p.variant);
    case "fence": return fenceSprite(season, 0b1111);
    case "lamp": return lampSprite();
    case "bench": return benchSprite();
    case "signpost": return signSprite();
    case "mailbox": return mailboxSprite();
    case "barrel": return barrelSprite();
    case "crate": return crateSprite();
    case "pot": return potSprite(season);
    case "well": return wellSprite();
    case "fountain": return fountainSprite();
    case "statue": return statueSprite();
    case "flag": return flagSprite();
    case "logs": return logPileSprite();
    case "hay": return haySprite();
    case "scarecrow": return scarecrowSprite();
    case "pier": return pierSprite();
    case "flowerbed": return flowerSprite(season, (p.x * 3 + p.y) % 4 | 0);
    default: return null;
  }
}

// ------------------------------------------------------------------
//  Efeitos
// ------------------------------------------------------------------
export function spawnEffect(x, y, type) {
  game.effects.push({ x, y, type, t: 0 });
}
export function spawnFloatingText(x, y, text, color = "#fff") {
  game.floatingTexts.push({ x, y, text, color, t: 0 });
}
export function updateEffects(dt) {
  for (const e of game.effects) e.t += dt;
  game.effects = game.effects.filter((e) => e.t < (e.life || 0.9));
  for (const f of game.floatingTexts) { f.t += dt; f.y -= dt * 1.1; }
  game.floatingTexts = game.floatingTexts.filter((f) => f.t < 1.4);
}

// ------------------------------------------------------------------
//  Desenho de culturas
// ------------------------------------------------------------------
function drawCrop(ctx, x, y, plot, px, py, time, season) {
  const def = CROPS[plot.crop];
  if (!def) return;
  const cx = px + HALF, cy = py + TS - 4;
  const ready = plot.stage >= def.daysToGrow;
  const t = Math.sin(time * 2 + x * 3 + y) * 0.5;
  ctx.save();
  // canteiro com borda marrom escura como foto
  ctx.fillStyle = "rgba(90,60,30,.28)";
  ctx.fillRect(px+1, py+TS-8, TS-2, 10);
  ctx.fillStyle = "rgba(60,40,20,.18)";
  ctx.beginPath(); ctx.ellipse(cx, cy + 3, 10, 4, 0, 0, 6.3); ctx.fill();
  if (plot.watered) {
    ctx.fillStyle = "rgba(90,160,210,.16)";
    ctx.fillRect(px + 1, py + 1, TS - 2, TS - 2);
  }
  // estaca para culturas trepadeiras (foto tem tutores verticais)
  const trellis = ["tomate","milho","abobora","morango"].includes(plot.crop);
  if (trellis) {
    ctx.fillStyle = "#6b4a2f";
    ctx.fillRect(cx-1, cy-14, 2, 16);
    ctx.fillStyle = "#8a6a3a";
    ctx.fillRect(cx, cy-14, 1, 16);
    // travessa
    ctx.fillRect(cx-6, cy-12, 12, 2);
  }
  if (plot.stage <= 0) {
    ctx.fillStyle = "#7fa84f";
    ctx.fillRect(cx - 1, cy - 6, 2, 6);
    ctx.fillStyle = "#a8d06a";
    ctx.fillRect(cx - 4, cy - 9, 3, 3);
    ctx.fillRect(cx + 2, cy - 8, 3, 3);
    // broto duplo como foto
    ctx.fillStyle = "#5fa93e";
    ctx.fillRect(cx+3, cy-7, 2, 4);
  } else if (!ready) {
    const k = plot.stage / def.daysToGrow;
    const hgt = 6 + k * 20;
    ctx.strokeStyle = "#4f8f37";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy - hgt); ctx.stroke();
    for (let i = 0; i < 3; i++) {
      const ly = cy - 4 - i * (hgt / 4);
      ctx.fillStyle = i % 2 ? "#7ac74f" : "#5fa93e";
      ctx.beginPath();
      ctx.ellipse(cx - 5, ly, 6 + k * 2, 3, -0.35 + t * 0.02, 0, 6.3); ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx + 5, ly - 1, 6 + k * 2, 3, 0.35 - t * 0.02, 0, 6.3); ctx.fill();
    }
    ctx.fillStyle = "#a8d06a";
    ctx.fillRect(cx - 1, cy - hgt - 2, 2, 3);
  } else {
    // planta pronta: fruto + brilho
    ctx.strokeStyle = "#4f8f37"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy - 18); ctx.stroke();
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = i % 2 ? "#7ac74f" : "#5fa93e";
      ctx.beginPath(); ctx.ellipse(cx - 7, cy - 6 - i * 5, 7, 3, -0.4, 0, 6.3); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx + 7, cy - 7 - i * 5, 7, 3, 0.4, 0, 6.3); ctx.fill();
    }
    const bob = Math.sin(time * 2.4 + x) * 1;
    // Stardew-like crop specifics
    if (plot.crop === "abobora") {
      // large pumpkin with ridges, vine leaves
      ctx.fillStyle = "#d35400";
      ctx.beginPath(); ctx.ellipse(cx, cy-14+bob, 11, 9, 0, 0, 6.3); ctx.fill();
      ctx.fillStyle = "#e67e22";
      ctx.beginPath(); ctx.ellipse(cx-4, cy-15+bob, 6, 7, -0.2, 0, 6.3); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx+4, cy-15+bob, 6, 7, 0.2, 0, 6.3); ctx.fill();
      ctx.fillStyle = "#a04000";
      ctx.fillRect(cx-8, cy-18+bob, 2, 12); ctx.fillRect(cx-1, cy-18+bob, 2, 12); ctx.fillRect(cx+6, cy-18+bob, 2, 12);
      ctx.fillStyle = "#7ac74f"; ctx.fillRect(cx, cy-23+bob, 3, 4); // stem
      ctx.fillStyle = "#4a7c37";
      ctx.beginPath(); ctx.ellipse(cx-9, cy-8+bob, 7, 4, -0.4, 0, 6.3); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx+9, cy-8+bob, 7, 4, 0.4, 0, 6.3); ctx.fill();
      // shine
      ctx.fillStyle = "rgba(255,255,255,0.45)"; ctx.beginPath(); ctx.arc(cx-3, cy-18+bob, 2.2, 0, 6.3); ctx.fill();
    } else if (plot.crop === "tomate") {
      ctx.fillStyle = "#2e7d32";
      ctx.fillRect(cx-2, cy-18+bob, 4, 14);
      for (let i=0;i<2;i++) {
        ctx.fillStyle = i%2 ? "#4caf50" : "#388e3c";
        ctx.beginPath(); ctx.ellipse(cx-6, cy-12-i*5+bob, 7, 4, -0.3, 0, 6.3); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx+6, cy-10-i*5+bob, 7, 4, 0.3, 0, 6.3); ctx.fill();
        ctx.fillStyle = "#c62828";
        ctx.beginPath(); ctx.arc(cx - (i?4:-4), cy-14-i*4+bob, 4.2, 0, 6.3); ctx.fill();
        ctx.fillStyle = "#ff6b6b"; ctx.beginPath(); ctx.arc(cx - (i?4:-4)-1, cy-15-i*4+bob, 1.2, 0, 6.3); ctx.fill();
      }
    } else if (plot.crop === "morango") {
      ctx.fillStyle = "#388e3c";
      ctx.fillRect(cx-1, cy-12+bob, 2, 10);
      ctx.fillStyle = "#e91e63";
      for (let i=0;i<3;i++) {
        const ox = (i-1)*5;
        ctx.beginPath(); ctx.arc(cx+ox, cy-16+bob+i%2*2, 3.8, 0, 6.3); ctx.fill();
        ctx.fillStyle = "#4caf50"; ctx.fillRect(cx+ox-1, cy-19+bob, 2, 2); ctx.fillStyle = "#e91e63";
      }
    } else if (plot.crop === "milho") {
      // tall corn
      ctx.fillStyle = "#8bc34a";
      ctx.fillRect(cx-3, cy-22+bob, 6, 18);
      ctx.fillStyle = "#558b2f";
      ctx.fillRect(cx-1, cy-22+bob, 2, 18);
      // leaves
      ctx.fillStyle = "#7cb342"; ctx.beginPath(); ctx.ellipse(cx-7, cy-14+bob, 8, 3, -0.5, 0, 6.3); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx+7, cy-12+bob, 8, 3, 0.5, 0, 6.3); ctx.fill();
      ctx.fillStyle = "#fdd835"; ctx.beginPath(); ctx.ellipse(cx, cy-10+bob, 4, 6, 0, 0, 6.3); ctx.fill();
      ctx.fillStyle = "#fff9c4"; for(let i=0;i<3;i++) ctx.fillRect(cx-2+i*2, cy-11+bob+i, 1, 3);
    } else if (plot.crop === "batata") {
      ctx.fillStyle = "#5d4037";
      ctx.beginPath(); ctx.ellipse(cx, cy-6+bob, 8, 5, 0, 0, 6.3); ctx.fill();
      ctx.fillStyle = "#8d6e63"; ctx.beginPath(); ctx.ellipse(cx-2, cy-8+bob, 4, 3, 0, 0, 6.3); ctx.fill();
      ctx.fillStyle = "#3e2723"; ctx.fillRect(cx-2, cy-6+bob, 2,1);
    } else if (plot.crop === "repolho") {
      ctx.fillStyle = "#66bb6a";
      ctx.beginPath(); ctx.ellipse(cx, cy-10+bob, 9, 7, 0, 0, 6.3); ctx.fill();
      ctx.fillStyle = "#aed581"; ctx.beginPath(); ctx.ellipse(cx-3, cy-12+bob, 5, 4, -0.3, 0, 6.3); ctx.fill();
      ctx.fillStyle = "#2e7d32"; ctx.beginPath(); ctx.ellipse(cx+4, cy-8+bob, 3, 3, 0, 0, 6.3); ctx.fill();
    } else if (plot.crop === "nabo") {
      ctx.fillStyle = "#fafafa";
      ctx.beginPath(); ctx.ellipse(cx, cy-10+bob, 6, 8, 0, 0, 6.3); ctx.fill();
      ctx.fillStyle = "#e53935"; ctx.beginPath(); ctx.ellipse(cx, cy-8+bob, 5, 5, 0, 0, 6.3); ctx.fill();
      ctx.fillStyle = "#4caf50"; ctx.fillRect(cx-1, cy-18+bob, 2, 7);
      ctx.fillRect(cx-4, cy-16+bob, 3, 3); ctx.fillRect(cx+2, cy-15+bob, 3,3);
    } else if (plot.crop === "trigo") {
      ctx.fillStyle = "#f9a825";
      for(let i=0;i<3;i++) {
        const ox = (i-1)*4;
        ctx.fillRect(cx+ox, cy-18+bob, 2, 14);
        ctx.fillStyle = "#fdd835"; ctx.fillRect(cx+ox-2, cy-16+bob-i*2, 4,2); ctx.fillStyle = "#f9a825";
      }
    } else {
      ctx.fillStyle = def.color;
      ctx.beginPath(); ctx.arc(cx, cy - 19 + bob, 7.5, 0, 6.3); ctx.fill();
      ctx.fillStyle = alpha("#ffffff", 0.35);
      ctx.beginPath(); ctx.arc(cx - 2.5, cy - 22 + bob, 2.6, 0, 6.3); ctx.fill();
      ctx.fillStyle = "#4f8f37";
      ctx.fillRect(cx - 1, cy - 27 + bob, 2, 3);
    }
    // brilho de pronto
    const a = 0.4 + Math.sin(time * 3 + x) * 0.3;
    ctx.fillStyle = `rgba(255,246,190,${a})`;
    ctx.fillRect(cx + 8, cy - 26 + bob, 2, 2);
    ctx.fillRect(cx + 11, cy - 22 + bob, 1, 1);
  }
  ctx.restore();
}

// ------------------------------------------------------------------
//  Construções do jogador (celeiro, estufa, cerca...)
// ------------------------------------------------------------------
function drawCustomBuilding(ctx, b, sx, sy, season) {
  const px = sx(b.x), py = sy(b.y);
  const w = b.def.w * TS, h = b.def.h * TS;
  const id = b.buildingId;
  ctx.save();
  if (id === "cerca") {
    ctx.drawImage(fenceSprite(season, 0b1111), px, py);
  } else if (id === "estufa") {
    ctx.fillStyle = "rgba(28,34,22,.16)";
    ctx.beginPath(); ctx.ellipse(px + w / 2, py + h - 2, w / 2, 8, 0, 0, 6.3); ctx.fill();
    // estrutura
    ctx.fillStyle = "#7fb8a8";
    ctx.fillRect(px + 4, py + 14, w - 8, h - 20);
    const grd = ctx.createLinearGradient(0, py, 0, py + h);
    grd.addColorStop(0, "rgba(210,245,255,.75)");
    grd.addColorStop(1, "rgba(150,220,215,.55)");
    ctx.fillStyle = grd;
    ctx.fillRect(px + 6, py + 16, w - 12, h - 24);
    // telhado curvo
    ctx.fillStyle = "#8fc4b4";
    ctx.beginPath();
    ctx.moveTo(px + 2, py + 16);
    ctx.quadraticCurveTo(px + w / 2, py - 10, px + w - 2, py + 16);
    ctx.lineTo(px + w - 2, py + 8);
    ctx.quadraticCurveTo(px + w / 2, py - 18, px + 2, py + 8);
    ctx.fill();
    // caixilhos
    ctx.strokeStyle = "rgba(120,170,160,.9)";
    ctx.lineWidth = 2;
    for (let i = 1; i < b.def.w; i++) {
      ctx.beginPath(); ctx.moveTo(px + i * TS, py + 16); ctx.lineTo(px + (i * TS), py + h - 6); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(px + 6, py + h - 16); ctx.lineTo(px + w - 6, py + h - 16); ctx.stroke();
    // plantas dentro
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = i % 2 ? "#7ac74f" : "#5fa93e";
      ctx.beginPath(); ctx.ellipse(px + 18 + i * 26, py + h - 22, 10, 6, 0, 0, 6.3); ctx.fill();
    }
    ctx.fillStyle = C.wood3; ctx.fillRect(px + w / 2 - 10, py + h - 22, 20, 18);
  } else if (id === "celeiro" || id === "pocilga") {
    ctx.fillStyle = "rgba(28,34,22,.16)";
    ctx.fillRect(px + 4, py + h - 6, w - 8, 6);
    ctx.fillStyle = id === "pocilga" ? "#c98a96" : "#c0503f";
    ctx.fillRect(px + 4, py + 16, w - 8, h - 20);
    ctx.fillStyle = id === "pocilga" ? "#d9a4ae" : "#a8453a";
    for (let i = 0; i < w - 8; i += 14) ctx.fillRect(px + 4 + i, py + 16, 2, h - 20);
    // telhado
    for (let i = 0; i < 10; i++) {
      const inset = i * 2;
      ctx.fillStyle = i < 4 ? "#8f3129" : "#7d2c25";
      ctx.fillRect(px + 2 + inset, py + 6 + i, w - 4 - inset * 2, 2);
    }
    ctx.fillStyle = "#f2ead6";
    ctx.fillRect(px + w / 2 - 12, py + h - 26, 24, 22);
    ctx.fillStyle = "#8f3129";
    ctx.fillRect(px + w / 2 - 10, py + h - 24, 20, 20);
    ctx.strokeStyle = "#f2ead6"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(px + w / 2 - 10, py + h - 24); ctx.lineTo(px + w / 2 + 10, py + h - 4); ctx.stroke();
  } else {
    ctx.fillStyle = "#c99a63";
    ctx.fillRect(px + 4, py + 12, w - 8, h - 16);
    for (let i = 0; i < 10; i++) {
      const inset = i;
      ctx.fillStyle = i < 3 ? "#a06840" : "#84502f";
      ctx.fillRect(px + 4 + inset, py + 4 + i, w - 8 - inset * 2, 2);
    }
    ctx.fillStyle = C.wood4;
    ctx.fillRect(px + w / 2 - 8, py + h - 18, 16, 14);
    ctx.fillStyle = "#e8c15c";
    ctx.fillRect(px + w / 2 + 4, py + h - 12, 2, 2);
  }
  ctx.restore();
  // plaquinha do dono
  inkText(ctx, b.owner || "", px + w / 2, py - 6, { size: 10, fill: "#fff8e7", stroke: "rgba(30,20,12,.8)" });
}

// ------------------------------------------------------------------
//  Jogador / NPC
// ------------------------------------------------------------------
/** Idade/apresentação de cada morador (a vila tem todas as gerações). */
const NPC_BODY = {
  maria: "elder_B", joao: "adult_A", ana: "adult_B", carlos: "elder_A", luna: "teen_B",
  pedro: "adult_A", bia: "adult_B", tai: "adult_A", rita: "elder_B", duda: "teen_A",
  sofia: "adult_B", marcos: "adult_A", helena: "adult_B", rafael: "adult_A",
  clara: "teen_B", edu: "teen_A", paulo: "adult_A", larissa: "adult_B",
  roberto: "elder_A", fernanda: "adult_B",
};

/** Constrói a aparência a partir do look validado (ou dos skins antigos). */
export function specForLook(look, fallbackSkin = "s1") {
  if (!look) return specForSkin(fallbackSkin);
  const l = sanitizeLook(look);
  return buildCustomSpec(
    fallbackSkin, l.hat, l.shirt, l.necklace, l.bracelet,
    l.skin, l.hair, l.hairColor, l.pants, l.eye, l.body,
  );
}

function atlasForPlayer(p, isSelf) {
  const look = isSelf ? (game.look || p.look) : p.look;
  return characterFrames(specForLook(look, p.skin || "s1"));
}
function atlasForNpc(npc, season) {
  const base = { ...(NPC_SPECS[npc.id] || {
    shirt: npc.color || "#7cb98a", shirtDark: shade(npc.color || "#7cb98a", -0.25),
    pants: "#44506b", skin: C.skin1, skinShade: "#dba97e",
    hair: npc.accent || "#4a3020", hairDark: shade(npc.accent || "#4a3020", -0.3), hairStyle: "short",
    hat: { type: "none" },
  }), bodyId: NPC_BODY[npc.id] || "adult_A" };
  if (season != null && typeof seasonSpec === "function") {
    try { return characterFrames(seasonSpec(npc.id, season, base)); } catch {}
  }
  return characterFrames(base);
}

function drawPlayerSprite(ctx, p, sx, sy, isSelf, time, action) {
  const px = sx(p.renderX ?? p.x), py = sy(p.renderY ?? p.y);
  const atlas = atlasForPlayer(p, isSelf);
  const footY = py + 51;
  // pose de ação (ferramenta) quando o jogador acabou de usar um item
  const acting = isSelf && game.actionUntil && performance.now() < game.actionUntil;
  if (acting) action = true;
  const moving = isSelf ? game.moving : (Math.abs((p.renderX ?? p.x) - (p.x ?? 0)) > 0.01 || (p.rcv || 0) > 0);
  if (acting) {
    const tool = game.actionTool || "enxada";
    // animação em 3 fases: erguer -> golpear -> recolher
    const elapsed = performance.now() - (game.actionUntil - 420);
    const k = Math.max(0, Math.min(1, elapsed / 420));
    // bob suave durante ação
    const lift = k < 0.4 ? -k * 6 : k < 0.7 ? -2.4 + (k - 0.4) * 8 : -2;
    const img = actionFrames(specForLook(isSelf ? game.look : p.look, p.skin || "s1"), tool, p.dir || "down");
    ctx.save();
    ctx.fillStyle = "rgba(28,34,22,.22)";
    ctx.beginPath(); ctx.ellipse(px, footY - 2, CHAR_W * 0.26, 3, 0, 0, 6.3); ctx.fill();
    // leve tremor no impacto
    const shake = (k > 0.45 && k < 0.6) ? (Math.sin(k * 80) * 1.2) : 0;
    ctx.drawImage(img, Math.round(px - CHAR_W / 2 + shake), Math.round(footY - 99 + lift), CHAR_W, CHAR_H);
    // partículas extras por ferramenta
    if (tool === "enxada" && k > 0.5 && k < 0.65) {
      ctx.fillStyle = "#8b7355";
      for (let i=0;i<3;i++) ctx.fillRect(px + (Math.random()*12-6), py - 8 + Math.random()*4, 2,2);
    } else if (tool === "regador" && k > 0.3) {
      ctx.fillStyle = "rgba(126,200,227,.75)";
      for(let i=0;i<4;i++) ctx.fillRect(px + (p.dir==="right"?14:-14) + Math.random()*6, py + Math.random()*4, 2,2);
    }
    ctx.restore();
  } else {
    drawCharacter(ctx, atlas, p.dir || "down", {
      ...feetAnchor(px, footY), moving: isSelf ? game.moving : !!p.moving, action, time: time + (p.id?.length || 0),
    });
  }
  // nome
  const name = p.username || "";
  inkText(ctx, name, px, footY - CHAR_H - 4, {
    size: 11, fill: isSelf ? "#ffe9a8" : "#eafff0", stroke: "rgba(28,20,12,.85)", lw: 3.5,
  });
  if (isSelf && game.pendingBuild) {
    ctx.save();
    ctx.strokeStyle = "rgba(255,240,190,.35)";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(px, py + 4, 13, 5, 0, 0, 6.3); ctx.stroke();
    ctx.restore();
  }
  if (p.account) inkText(ctx, "★", px + 24, py - 44, { size: 11, fill: "#ffd166" });
}

// ------------------------------------------------------------------
//  Render principal
// ------------------------------------------------------------------
// qualidade adaptativa: se o PC não aguentar, reduz detalhes secundários
export const quality = { level: 2, slowFrames: 0, lastCheck: 0 };
export function tickQuality(dt) {
  if (dt > 0.034) quality.slowFrames++;
  else quality.slowFrames = Math.max(0, quality.slowFrames - 0.5);
  if (quality.slowFrames > 90 && quality.level > 0) { quality.level--; quality.slowFrames = 0; }
  else if (quality.slowFrames === 0 && quality.level < 2) { /* mantém, evita oscilar */ }
}

export function render(canvas, ctx) {
  const W = canvas.width, H = canvas.height;
  const season = (window.__seasonOverride != null) ? window.__seasonOverride : (game.world.seasonIndex || 0);
  const time = performance.now() / 1000;
  ctx.imageSmoothingEnabled = false;
  if (game.indoors) {
    renderInterior(ctx, { W, H, time, season, game, characterFrames, specForLook, drawCharacter, feetAnchor });
    return;
  }
  renderOverworld(canvas, ctx, W, H, season, time);
}

/**
 * Escuridão da caverna com um halo de lanterna em volta do jogador.
 * Quanto mais fundo o andar, menor o halo.
 */
function applyCaveLight(ctx, W, H, { px, py, time, depth = 1 }) {
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  const dark = Math.min(0.86, 0.66 + depth * 0.06);
  const rInner = Math.max(90, 190 - depth * 30);
  const rOuter = rInner + 230;
  const flicker = 1 + Math.sin(time * 3.1) * 0.02 + Math.sin(time * 7.7) * 0.012;
  const grad = ctx.createRadialGradient(px, py, rInner * 0.35, px, py, rOuter * flicker);
  grad.addColorStop(0, `rgba(10,8,6,0)`);
  grad.addColorStop(0.55, `rgba(10,8,6,${(dark * 0.35).toFixed(3)})`);
  grad.addColorStop(1, `rgba(8,6,5,${dark.toFixed(3)})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  // leve tom azulado nas bordas, como se a luz viesse de cima
  ctx.fillStyle = `rgba(120,160,210,${(0.03 + 0.01 * depth).toFixed(3)})`;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  return { lamp: 0.55, cave: true };
}

/** Fora do mapa na caverna: rocha maciça com veios, sem mar. */
function drawCaveBorder(ctx, { sx, sy, MAP_W, MAP_H, W, H, time }) {
  const x0 = sx(0), y0 = sy(0), x1 = sx(MAP_W), y1 = sy(MAP_H);
  ctx.fillStyle = "#1d1815";
  if (x0 > 0) ctx.fillRect(0, 0, x0, H);
  if (x1 < W) ctx.fillRect(x1, 0, W - x1, H);
  if (y0 > 0) ctx.fillRect(Math.max(0, x0), 0, Math.max(0, Math.min(W, x1) - Math.max(0, x0)), y0);
  if (y1 < H) ctx.fillRect(Math.max(0, x0), y1, Math.max(0, Math.min(W, x1) - Math.max(0, x0)), H - y1);
  // sombra interna: a parede parece mais alta perto da borda do mapa
  const grad = 26;
  ctx.fillStyle = "rgba(0,0,0,.45)";
  if (x0 > -grad) ctx.fillRect(Math.max(0, x0), y0, grad, y1 - y0);
  if (x1 < W + grad) ctx.fillRect(x1 - grad, y0, grad, y1 - y0);
  ctx.fillStyle = "rgba(0,0,0,.35)";
  ctx.fillRect(x0, Math.max(0, y0), x1 - x0, grad);
}

function renderOverworld(canvas, ctx, W, H, season, time) {
  const t = game.world.time;
  const weather = game.world.weather;
  const region = currentRegion();
  const tiles = currentTiles();
  const th = SEASON_ART[season] || SEASON_ART[0];

  // fundo (fora do mapa) — cor chapada coerente com o mundo
  if (String(region).startsWith("caverna")) {
    ctx.fillStyle = "#191512";
    ctx.fillRect(0, 0, W, H);
  } else {
    ctx.fillStyle = mix(th.grass[3], "#1d3a4a", 0.55);
    ctx.fillRect(0, 0, W, H);
  }

  if (!tiles || !tiles.length) {
    ctx.fillStyle = "#2b3a2a";
    ctx.font = "600 20px Trebuchet MS, Segoe UI, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Carregando o Vale…", W / 2, H / 2);
    return;
  }

  const camX = game.camera.x, camY = game.camera.y;
  const halfW = W / 2, halfH = H / 2;
  // mesma transformação para desenhar e para converter cliques/hover
  game.view = { ox: halfW - camX * TS, oy: halfH - camY * TS, scale: TS };
  const sx = (x) => (x - camX) * TS + halfW;
  const sy = (y) => (y - camY) * TS + halfH;
  const { w: MAP_W, h: MAP_H } = currentRegionDef().size || { w: 70, h: 50 };
  const startX = Math.max(0, Math.floor(camX - halfW / TS) - 1);
  const endX = Math.min(MAP_W, Math.ceil(camX + halfW / TS) + 1);
  const startY = Math.max(0, Math.floor(camY - halfH / TS) - 2);
  const endY = Math.min(MAP_H, Math.ceil(camY + halfH / TS) + 3);

  // ---------------- CHÃO (cache) ----------------
  // O chão é pré-renderizado a GROUND_T px por tile; a tela desenha a TS px
  // por tile. Recortar em pixels do canvas e escalar no destino é o que
  // mantém o chão alinhado com personagens, construções e colisão.
  const GROUND_T = 32;
  const ground = groundFor(region, season);
  if (ground) {
    const gx = Math.max(0, startX) * GROUND_T;
    const gy = Math.max(0, startY) * GROUND_T;
    const gw = Math.min(ground.width - gx, (endX - startX + 1) * GROUND_T);
    const gh = Math.min(ground.height - gy, (endY - startY + 1) * GROUND_T);
    if (gw > 0 && gh > 0) {
      ctx.drawImage(
        ground, gx, gy, gw, gh,
        sx(gx / GROUND_T), sy(gy / GROUND_T),
        (gw / GROUND_T) * TS, (gh / GROUND_T) * TS,
      );
    }
  }

  // ---------------- BORDA DO MAPA ----------------
  if (String(region).startsWith("caverna")) {
    // caverna não tem mar: o que fica fora do mapa é rocha maciça
    drawCaveBorder(ctx, { sx, sy, MAP_W, MAP_H, W, H, time });
  } else {
    drawMapBorder(ctx, { sx, sy, MAP_W, MAP_H, W, H, season, time });
  }

  // ---------------- ÁGUA ANIMADA ----------------
  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      if (tiles[y]?.[x] !== TILE.WATER) continue;
      const isWater = (xx, yy) => tiles[yy]?.[xx] === TILE.WATER;
      let mask = 0;
      if (isWater(x, y - 1)) mask |= 1;
      if (isWater(x + 1, y)) mask |= 2;
      if (isWater(x, y + 1)) mask |= 4;
      if (isWater(x - 1, y)) mask |= 8;
      drawWaterTile(ctx, x, y, sx(x), sy(y), season, time, mask);
    }
  }

  // ---------------- PLANTAS ----------------
  for (const key in game.world.plots) {
    const plot = game.world.plots[key];
    if (!plot?.crop) continue;
    const [x, y] = key.split(",").map(Number);
    if (x < startX - 1 || x > endX + 1 || y < startY - 1 || y > endY + 1) continue;
    drawCrop(ctx, x, y, plot, sx(x), sy(y), time, season);
  }

  // ---------------- COLETA DE CAMADAS (ordenação por Y) ----------------
  const drawables = [];

  // construções fixas
  for (const b of currentBuildings()) {
    if (b.x + b.w < startX - 2 || b.x > endX + 2 || b.y + b.h < startY - 4 || b.y > endY + 3) continue;
    const spr = buildingSprite(b, season);
    const bx = sx(b.x) - 4;
    const by = sy(b.y) - spr.extraTop;
    drawables.push({
      y: b.y + b.h * 0.92,
      painter: () => {
        ctx.drawImage(spr.canvas, Math.round(bx), Math.round(by));
        // placa com nome
        const name = b.name;
        const cx = bx + (b.w * TS) / 2;
        const plaqueY = by + b.h * TS - 8;
        const tw = Math.max(46, ctx.measureText(name).width + 18);
        ctx.save();
        ctx.globalAlpha = 0.94;
        ctx.fillStyle = "#5a3d28";
        roundRect(ctx, cx - tw / 2 - 1, plaqueY - 1, tw + 2, 18, 4);
        ctx.fill();
        ctx.fillStyle = "#c9a06a";
        roundRect(ctx, cx - tw / 2, plaqueY, tw, 16, 3);
        ctx.fill();
        ctx.fillStyle = "#3a2416";
        ctx.font = "700 10px Trebuchet MS, Segoe UI, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(name, cx, plaqueY + 11);
        ctx.restore();
      },
    });
  }

  // construções do jogador
  for (const b of customBuildingsList()) {
    if (b.x + b.def.w < startX - 2 || b.x > endX + 2 || b.y + b.def.h < startY - 2 || b.y > endY + 2) continue;
    drawables.push({ y: b.y + b.def.h * 0.9, painter: () => drawCustomBuilding(ctx, b, sx, sy, season) });
  }

  // props
  for (const p of propsFor(region, season, tiles)) {
    if (p.x < startX - 2 || p.x > endX + 3 || p.y < startY - 4 || p.y > endY + 3) continue;
    if (p.kind === "tree") {
      const tp = treeParts(season, p.variant, p.seed);
      const bx = sx(p.x), by = sy(p.y);
      drawables.push({
        y: p.y,
        painter: () => {
          // tronco
          ctx.drawImage(tp.trunk, Math.round(bx - tp.trunkW / 2), Math.round(by - tp.trunkH + 10));
          // copa com balanço suave
          const sway = Math.sin(time * 0.9 + p.x * 1.7 + p.y * 1.3) * 1.8 * tp.sway;
          ctx.drawImage(tp.canopy, Math.round(bx - tp.canopyW / 2 + sway), Math.round(by + tp.canopyOffsetY + 6));
        },
      });
      continue;
    }
    const spr = propSprite(p, season);
    if (!spr) continue;
    const px = sx(p.x) - spr.width / 2;
    const py = sy(p.y) - spr.height + 10;
    drawables.push({
      y: p.y,
      painter: () => {
        ctx.drawImage(spr, Math.round(px), Math.round(py));
        if (p.kind === "palm") {
          const sway = Math.sin(time * 1.1 + p.x * 2 + p.y) * 1.2;
          ctx.save();
          ctx.globalAlpha = 0.0;
          ctx.restore();
        }
      },
    });
  }

  // animais do jogo (galinhas, vacas, ovelhas)
  for (const a of game.world.animals || []) {
    if (a.x < startX - 2 || a.x > endX + 2 || a.y < startY - 2 || a.y > endY + 2) continue;
    const spr = critterSprites(a.type);
    if (!spr) continue;
    const wob = Math.sin(time * 1.7 + a.x * 3 + a.y) * 0.35;
    const frame = Math.floor(time * 3 + a.x) % 2;
    const px = sx(a.x + wob), py = sy(a.y);
    drawables.push({
      y: a.y + 0.4,
      painter: () => {
        ctx.save();
        ctx.fillStyle = "rgba(28,34,22,.2)";
        ctx.beginPath(); ctx.ellipse(px, py + 6, spr.w * 1.4, 4, 0, 0, 6.3); ctx.fill();
        const dirRight = Math.sin(time * 0.4 + a.x) > 0;
        ctx.translate(px, py - spr.h * 2 + 8);
        if (!dirRight) ctx.scale(-1, 1);
        ctx.drawImage(spr.frames[frame], -spr.w, 0);
        ctx.restore();
        inkText(ctx, a.owner || "", px, py - spr.h * 2 - 4, { size: 9, fill: "#f7f3e6", stroke: "rgba(30,20,12,.7)", lw: 2.5 });
      },
    });
  }

  // NPCs (andando de verdade conforme a rotina)
  for (const npc of currentNpcs()) {
    const pos = npcPos(npc);
    const ahead = npcPosition(npc, Math.min(26 * 60, game.world.time + 0.35));
    const vx = ahead.x - pos.x, vy = ahead.y - pos.y;
    const moving = Math.hypot(vx, vy) > 0.004;
    const dir = Math.abs(vx) > Math.abs(vy) ? (vx > 0 ? "right" : "left") : (vy > 0 ? "down" : "up");
    const near = Math.hypot(pos.x - game.x, pos.y - game.y) < 2.4;
    const px = sx(pos.x), py = sy(pos.y);
    const isPrem = isPremiumNpc(npc.id) && premiumReady(npc.id);
    const atlas = isPrem ? null : atlasForNpc(npc, season);
    drawables.push({
      y: pos.y + 0.5,
      painter: () => {
        if(isPrem){
          const ok = drawPremiumNpc(ctx, npc.id, { x: px - 16, y: py - 40, dir, moving, time: time + npc.id.length * 0.7 });
          if(ok){ inkText(ctx, npc.name, px, py - 44, { size: 10.5, fill: "#fff8e7", stroke: "rgba(28,20,12,.85)", lw: 3.2 });
                  if (near) {
                    const bobI = Math.sin(time * 4) * 2;
                    ctx.save();
                    ctx.translate(px + 16, py - 116 + bobI);
                    ctx.fillStyle = "rgba(255,250,235,.96)";
                    roundRect(ctx, -11, -10, 22, 18, 6); ctx.fill();
                    ctx.strokeStyle = "rgba(70,50,30,.5)"; ctx.lineWidth = 1.5; ctx.stroke();
                    ctx.fillStyle = "#4a3524";
                    ctx.font = "900 12px Trebuchet MS, sans-serif";
                    ctx.textAlign = "center";
                    ctx.fillText("…", 0, 3);
                    ctx.beginPath(); ctx.moveTo(-3, 8); ctx.lineTo(0, 12); ctx.lineTo(3, 8); ctx.fillStyle = "rgba(255,250,235,.96)"; ctx.fill();
                    ctx.restore();
                  }
                  return;
          }
        }
        const nFoot = py + 51;
        drawCharacter(ctx, atlas, dir, { ...feetAnchor(px, nFoot), moving, time: time + npc.id.length * 0.7 });
        inkText(ctx, npc.name, px, nFoot - CHAR_H - 4, { size: 10.5, fill: "#fff8e7", stroke: "rgba(28,20,12,.85)", lw: 3.2 });
        if (near) {
          const bobI = Math.sin(time * 4) * 2;
          ctx.save();
          ctx.translate(px + 16, py - 116 + bobI);
          ctx.fillStyle = "rgba(255,250,235,.96)";
          roundRect(ctx, -11, -10, 22, 18, 6); ctx.fill();
          ctx.strokeStyle = "rgba(70,50,30,.5)"; ctx.lineWidth = 1.5; ctx.stroke();
          ctx.fillStyle = "#4a3524";
          ctx.font = "900 12px Trebuchet MS, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("…", 0, 3);
          ctx.beginPath(); ctx.moveTo(-3, 8); ctx.lineTo(0, 12); ctx.lineTo(3, 8); ctx.fillStyle = "rgba(255,250,235,.96)"; ctx.fill();
          ctx.restore();
        }
      },
    });
  }

  // outros jogadores
  for (const p of game.players.values()) {
    if (p.id === game.selfId) continue;
    if ((p.region || "vale") !== region) continue;
    if ((p.indoors || null) !== (game.indoors || null)) continue;
    drawables.push({ y: (p.renderY ?? p.y ?? 0) + 0.5, painter: () => drawPlayerSprite(ctx, p, sx, sy, false, time) });
  }

  // jogador local
  drawables.push({
    y: game.y + 0.55,
    painter: () => {
      drawPlayerSprite(ctx, { ...game, renderX: game.x, renderY: game.y, username: game.username, skin: game.skin, dir: game.dir, level: game.self.level, id: game.selfId }, sx, sy, true, time);
      drawTargetHighlight(ctx, sx, sy, time);
    },
  });

  drawables.sort((a, b) => a.y - b.y);
  for (const d of drawables) d.painter();

  // ---------------- POEIRA AO CAMINHAR ----------------
  if (game.moving) {
    if (!game._dustT || time - game._dustT > 0.16) {
      game._dustT = time;
      const hit = (game.mouse.x, game.mouse.y);
      const tx = Math.floor(game.x), ty = Math.floor(game.y + 0.6);
      const t = tileAt(tx, ty);
      const onPath = t === TILE.PATH || t === TILE.STONE || t === TILE.SAND;
      game.effects.push({
        x: game.x + (Math.random() - 0.5) * 0.3,
        y: game.y + 0.55,
        type: onPath ? "dust_path" : "dust_grass",
        t: 0,
        life: 0.55,
        vx: (Math.random() - 0.5) * 18,
      });
    }
  }
  for (const e of game.effects) {
    if (e.type !== "dust_path" && e.type !== "dust_grass") continue;
    const px = sx(e.x) + HALF + (e.vx || 0) * e.t;
    const py = sy(e.y) + 2 - e.t * 8;
    const k = e.t / (e.life || 0.55);
    ctx.save();
    ctx.globalAlpha = (1 - k) * 0.45;
    ctx.fillStyle = e.type === "dust_path" ? "#e8d9b4" : "#c8e0a0";
    const sz = 2 + k * 3;
    ctx.fillRect(px - sz / 2, py, sz, sz * 0.7);
    ctx.restore();
  }

  // ---------------- PARTÍCULAS DE AÇÃO ----------------
  for (const e of game.effects) {
    const px = sx(e.x) + HALF, py = sy(e.y) + 4;
    const k = e.t / 0.9;
    ctx.save();
    ctx.globalAlpha = 1 - k;
    if (e.type === "fish_wait") {
      for (let i = 0; i < 3; i++) {
        ctx.strokeStyle = "rgba(180,235,250,.8)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(px, py + 6, (i + 1) * 6 + k * 8, 2.5, 0, 0, 6.3);
        ctx.stroke();
      }
    } else if (e.type === "chop" || e.type === "mine") {
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * 6.28 + e.t * 3;
        ctx.fillStyle = e.type === "chop" ? "#d9a86c" : "#b8b3a2";
        ctx.fillRect(px + Math.cos(a) * (10 + k * 24), py - 8 + Math.sin(a) * (8 + k * 18), 3, 3);
      }
    } else if (e.type === "fishing") {
      ctx.drawImage(fishSprite(), px - 8, py - 22 - k * 12);
    } else {
      const icon = e.type === "harvest" ? "harvest" : "spark";
      ctx.fillStyle = icon === "harvest" ? "#ffe9a8" : "#dff5c0";
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * 6.28;
        const r = 8 + k * 22;
        ctx.fillRect(px + Math.cos(a) * r, py - 12 + Math.sin(a) * r * 0.6, 3, 3);
      }
    }
    ctx.restore();
  }

  // ---------------- TEXTOS FLUTUANTES ----------------
  for (const f of game.floatingTexts) {
    const px = sx(f.x) + HALF, py = sy(f.y) - 10;
    const k = f.t / 1.4;
    ctx.save();
    ctx.globalAlpha = 1 - k * k;
    ctx.font = "900 14px Trebuchet MS, Segoe UI, sans-serif";
    ctx.textAlign = "center";
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(30,20,12,.8)";
    ctx.strokeText(f.text, px, py);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, px, py);
    ctx.restore();
  }

  // ---------------- CURSOR / PRÉVIA DE CONSTRUÇÃO ----------------
  const worldPos = screenToWorld(game.mouse.x, game.mouse.y, canvas);
  const tx = Math.floor(worldPos.x), ty = Math.floor(worldPos.y);
  const inMap = tx >= 0 && tx < MAP_W && ty >= 0 && ty < MAP_H;
  if (inMap) {
    if (game.pendingBuild) {
      const def = BUILD_OPTIONS[game.pendingBuild];
      const valid = isValidPlacement(tx, ty, def);
      ctx.save();
      ctx.globalAlpha = 0.55;
      if (def?.icon && CROPS[game.pendingBuild]) { /* noop */ }
      ctx.fillStyle = valid ? "rgba(120,220,140,.35)" : "rgba(235,90,80,.35)";
      ctx.fillRect(sx(tx), sy(ty), (def?.w || 1) * TS, (def?.h || 1) * TS);
      ctx.strokeStyle = valid ? "#8ef0a8" : "#ff8a7a";
      ctx.lineWidth = 2;
      ctx.strokeRect(sx(tx) + 1, sy(ty) + 1, (def?.w || 1) * TS - 2, (def?.h || 1) * TS - 2);
      ctx.restore();
    } else {
      // realce sutil de tile sob o mouse
      const t = tileAt(tx, ty);
      if (t !== TILE.WATER) {
        ctx.save();
        ctx.strokeStyle = "rgba(255,250,220,.45)";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(sx(tx) + 2, sy(ty) + 2, TS - 4, TS - 4);
        ctx.fillStyle = "rgba(255,255,235,.06)";
        ctx.fillRect(sx(tx), sy(ty), TS, TS);
        ctx.restore();
      }
    }
  }

  // ---------------- VIDA AMBIENTAL ----------------
  // dentro da caverna não há pássaros nem borboletas: só vaga-lumes e poeira
  if (!String(region).startsWith("caverna")) {
    drawAmbient(ctx, {
      regionKey: region, season, minutes: t, weather, sx, sy, player: game, buildings: currentBuildings(),
      time, dt: 1 / 60, viewW: W, viewH: H,
    });
  }

  // ---------------- LUZ / CLIMA ----------------
  const isCave = String(region).startsWith("caverna");
  const L = isCave
    ? applyCaveLight(ctx, W, H, { sx: (x) => sx(x), sy: (y) => sy(y), px: sx(game.x), py: sy(game.y), time, depth: Number(region.replace("caverna", "")) || 1 })
    : applyDaylight(ctx, W, H, t, weather, false);
  if (L.lamp > 0.05) {
    // janelas iluminadas dos prédios
    for (const b of currentBuildings()) {
      if (b.x + b.w < startX - 2 || b.x > endX + 2 || b.y + b.h < startY - 2 || b.y > endY + 2) continue;
      const spr = buildingSprite(b, season);
      const night = buildingNightLights(b, season);
      const bx = sx(b.x) - 4, by = sy(b.y) - spr.extraTop;
      ctx.save();
      ctx.globalAlpha = L.lamp * 0.85;
      ctx.drawImage(night.canvas, bx, by + (b.h * TS - night.canvas.height));
      ctx.restore();
      for (const l of night.lights) {
        glow(ctx, bx + l.x + l.w / 2, by + (b.h * TS - night.canvas.height) + l.y + l.h / 2, 46, "255,200,120", 0.22 * L.lamp);
      }
    }
    // postes
    const lg = lampGlow();
    for (const p of propsFor(region, season, tiles)) {
      if (p.kind !== "lamp") continue;
      if (p.x < startX - 2 || p.x > endX + 2 || p.y < startY - 2 || p.y > endY + 2) continue;
      const px = sx(p.x), py = sy(p.y) - 44;
      ctx.save();
      ctx.globalAlpha = L.lamp;
      ctx.drawImage(lg, px - 64, py - 64, 128, 128);
      ctx.restore();
      glow(ctx, px, py + 4, 34, "255,220,150", 0.35 * L.lamp);
    }
  }
  if (L.night) {
    // luar suave
    ctx.save();
    ctx.globalCompositeOperation = "soft-light";
    const grd = ctx.createLinearGradient(0, 0, W, H);
    grd.addColorStop(0, "rgba(120,150,210,.25)");
    grd.addColorStop(1, "rgba(60,80,150,.35)");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  } else {
    sunRays(ctx, W, H, t, time);
  }

  drawWeather(ctx, W, H, t, weather, time);
  if (quality.level > 0 && !String(region).startsWith("caverna")) drawWindParticles(ctx, { season, minutes: t, weather, W, H, time, dt: 1 / 60 });

  // ---------------- FESTIVAL ----------------
  if (game.world.festival && region === "vale") drawFestival(ctx, sx, sy, time);
}

function drawTargetHighlight(ctx, sx, sy, time) {
  const canvas = ctx.canvas;
  const worldPos = screenToWorld(game.mouse.x, game.mouse.y, canvas);
  const tx = Math.floor(worldPos.x), ty = Math.floor(worldPos.y);
  if (tx < 0 || ty < 0) return;
  const dist = Math.hypot(tx + 0.5 - game.x, ty + 0.5 - game.y);
  if (dist > 4.5) return;
  const t = tileAt(tx, ty);
  if (t === undefined || t === TILE.WATER) return;
  const px = sx(tx), py = sy(ty);
  const pulse = 0.35 + Math.sin(time * 4) * 0.18;
  ctx.save();
  ctx.strokeStyle = `rgba(255,246,200,${pulse})`;
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 4]);
  ctx.strokeRect(px + 2, py + 2, TS - 4, TS - 4);
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawWeather(ctx, W, H, minutes, weather, time) {
  if (weather === "Chuvoso") {
    ctx.save();
    ctx.strokeStyle = "rgba(180,210,235,.55)";
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 130; i++) {
      const x = ((i * 137 + time * 520) % (W + 60)) - 30;
      const y = (i * 83 + time * 900) % H;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 3, y + 11); ctx.stroke();
    }
    ctx.fillStyle = "rgba(60,85,120,.10)";
    ctx.fillRect(0, 0, W, H);
    // respingos
    ctx.fillStyle = "rgba(200,230,245,.35)";
    for (let i = 0; i < 26; i++) {
      const x = (i * 211 + time * 90) % W;
      const y = (i * 157 + time * 300) % H;
      ctx.fillRect(x, y, 3, 1);
    }
    ctx.restore();
  } else if (weather === "Neve") {
    for (let i = 0; i < 110; i++) {
      const x = ((i * 151 + Math.sin(time * 0.6 + i) * 50) % W + W) % W;
      const y = (i * 71 + time * 42) % H;
      const r = 1.2 + (i % 3) * 0.8;
      ctx.fillStyle = `rgba(255,255,255,${0.55 + (i % 3) * 0.15})`;
      ctx.beginPath(); ctx.arc(x, y, r, 0, 6.3); ctx.fill();
    }
  } else if (weather === "Nevoa") {
    ctx.save();
    const grd = ctx.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, "rgba(220,230,240,.28)");
    grd.addColorStop(1, "rgba(210,222,235,.12)");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  } else if (weather === "Nublado") {
    ctx.fillStyle = "rgba(150,170,195,.08)";
    ctx.fillRect(0, 0, W, H);
  }
}

function drawFestival(ctx, sx, sy, time) {
  const y = sy(22.4);
  for (let i = 0; i < 8; i++) {
    const x = sx(34 + i * 1.05);
    ctx.strokeStyle = "rgba(120,90,60,.6)";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x, y - 10); ctx.lineTo(x, y + 14); ctx.stroke();
    const wob = Math.sin(time * 2 + i) * 2;
    ctx.fillStyle = i % 2 ? "#e2695e" : "#f2c34f";
    ctx.beginPath();
    ctx.moveTo(x, y + 2); ctx.lineTo(x + 14, y + 6 + wob); ctx.lineTo(x, y + 10);
    ctx.closePath(); ctx.fill();
  }
  for (let i = 0; i < 4; i++) {
    const x = sx(35 + i * 2.1) + Math.sin(time * 0.8 + i) * 4;
    const yy = sy(21.9) - Math.abs(Math.sin(time + i * 1.7)) * 8;
    ctx.fillStyle = ["#e2695e", "#f2c34f", "#5b9bd5", "#7cb98a"][i];
    ctx.beginPath(); ctx.arc(x, yy, 6, 0, 6.3); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.5)";
    ctx.fillRect(x - 1, yy - 3, 2, 2);
    ctx.strokeStyle = "rgba(255,255,255,.45)";
    ctx.beginPath(); ctx.moveTo(x, yy + 6); ctx.lineTo(x, yy + 16); ctx.stroke();
  }
}

function isValidPlacement(x, y, def) {
  if (!def) return false;
  const { w: MAP_W, h: MAP_H } = currentRegionDef().size || { w: 70, h: 50 };
  for (let yy = y; yy < y + def.h; yy++) {
    for (let xx = x; xx < x + def.w; xx++) {
      if (xx < 0 || yy < 0 || xx >= MAP_W || yy >= MAP_H) return false;
      const t = tileAt(xx, yy);
      if (t !== TILE.GRASS && t !== TILE.DARK_GRASS) return false;
      if (game.world.plots[`${xx},${yy}`]) return false;
      for (const b of currentBuildings()) {
        if (xx >= b.x && xx < b.x + b.w && yy >= b.y && yy < b.y + b.h) return false;
      }
      for (const b of customBuildingsList()) {
        if (xx >= b.x && xx < b.x + b.def.w && yy >= b.y && yy < b.y + b.def.h) return false;
      }
    }
  }
  return true;
}

// ------------------------------------------------------------------
//  Minimapa
// ------------------------------------------------------------------
export function renderMiniMap(canvas) {
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  const regionDef = currentRegionDef();
  const MAP_W = regionDef.size?.w || 70, MAP_H = regionDef.size?.h || 50;
  const scaleX = W / MAP_W, scaleY = H / MAP_H;
  const season = game.world.seasonIndex || 0;
  const th = SEASON_ART[season];
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = th.grass[1];
  ctx.fillRect(0, 0, W, H);
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const t = tileAt(x, y);
      let col = th.grass[1];
      if (t === TILE.DARK_GRASS) col = th.grassDark[0];
      else if (t === TILE.TILLED || t === TILE.TILLED_WATERED) col = "#b99a6b";
      else if (t === TILE.WATER) col = th.water[1];
      else if (t === TILE.PATH) col = th.path[0];
      else if (t === TILE.SAND) col = "#f0dca8";
      else if (t === TILE.STONE) col = C.stone2;
      else if (t === TILE.BRIDGE) col = C.wood2;
      ctx.fillStyle = col;
      ctx.fillRect(x * scaleX, y * scaleY, Math.ceil(scaleX), Math.ceil(scaleY));
    }
  }
  // --- Casas/prédios detalhados no minimapa com ícone e nome ---
  for (const b of currentBuildings()) {
    ctx.fillStyle = "rgba(90,60,40,.82)";
    ctx.fillRect(b.x * scaleX, b.y * scaleY, b.w * scaleX, b.h * scaleY);
    ctx.fillStyle = "rgba(240,200,150,.92)";
    ctx.fillRect(b.x * scaleX + 1, b.y * scaleY + 1, b.w * scaleX - 2, Math.max(1, b.h * scaleY * 0.4));
    // ícone central
    ctx.save();
    ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.font = `${Math.max(8, Math.min(12, b.w*scaleX*0.6))}px serif`;
    ctx.fillStyle="#1a120c";
    const cx = (b.x + b.w/2) * scaleX;
    const cy = (b.y + b.h/2) * scaleY;
    // sombra do ícone
    ctx.fillText(b.icon || "🏠", cx, cy);
    // nome pequeno abaixo se espaço
    if (b.w*scaleX > 18){
      ctx.font="700 6px Trebuchet MS, sans-serif";
      ctx.fillStyle="rgba(40,30,20,.95)";
      // fundo do nome
      const name=b.name.split(" ")[0];
      const tw=ctx.measureText(name).width+6;
      ctx.fillStyle="rgba(255,248,220,.92)";
      ctx.fillRect(cx-tw/2, cy+ b.h*scaleY*0.45, tw, 8);
      ctx.fillStyle="#3a2416"; ctx.fillText(name, cx, cy+ b.h*scaleY*0.45+4);
    }
    ctx.restore();
  }
  // --- Rios e lagos nomeados ---
  ctx.save();
  ctx.textAlign="center";
  ctx.font="700 7px Trebuchet MS, sans-serif";
  // Rio do Vale (horizontal na parte sul)
  const riverLabels=[
    {x:32, y:46, name:"Rio do Vale"},
    {x:12, y:34, name:"Lago da Mina"},
    {x:52, y:10, name:"Floresta Norte"},
    {x:8, y:12, name:"Bosque"},
  ];
  for(const lb of riverLabels){
    const px=lb.x*scaleX, py=lb.y*scaleY;
    // só desenha se dentro do mapa
    if(px<0||px>W||py<0||py>H) continue;
    const tw=ctx.measureText(lb.name).width+8;
    ctx.fillStyle="rgba(70,120,180,.85)";
    // pill background
    ctx.beginPath();
    if(ctx.roundRect) ctx.roundRect(px-tw/2, py-5, tw, 10, 5); else ctx.rect(px-tw/2, py-5, tw, 10);
    ctx.fill();
    ctx.fillStyle="#e8f7ff"; ctx.fillText(lb.name, px, py);
  }
  ctx.restore()
  for (const b of customBuildingsList()) {
    ctx.fillStyle = "#a97a48";
    ctx.fillRect(b.x * scaleX, b.y * scaleY, b.def.w * scaleX, b.def.h * scaleY);
  }
  for (const npc of currentNpcs()) {
    const pos = npcPosition(npc, game.world.time);
    ctx.fillStyle = "#fff8e7";
    ctx.beginPath(); ctx.arc(pos.x * scaleX, pos.y * scaleY, 3, 0, 6.3); ctx.fill();
    ctx.fillStyle = "#e2695e";
    ctx.beginPath(); ctx.arc(pos.x * scaleX, pos.y * scaleY, 1.6, 0, 6.3); ctx.fill();
  }
  for (const p of game.players.values()) {
    if ((p.region || "vale") !== currentRegion()) continue;
    const px = p.id === game.selfId ? game.x : p.x;
    const py = p.id === game.selfId ? game.y : p.y;
    ctx.fillStyle = p.id === game.selfId ? "#ffe066" : "#7cf0a4";
    ctx.beginPath(); ctx.arc(px * scaleX, py * scaleY, p.id === game.selfId ? 5 : 4, 0, 6.3); ctx.fill();
    ctx.strokeStyle = "rgba(40,30,20,.7)"; ctx.lineWidth = 1.5; ctx.stroke();
  }
  ctx.strokeStyle = "rgba(255,255,255,.85)";
  ctx.lineWidth = 2;
  const viewW = (canvas.clientWidth || W) / 32, viewH = (canvas.clientHeight || H) / 32;
  ctx.strokeRect((game.camera.x - viewW / 2) * scaleX, (game.camera.y - viewH / 2) * scaleY, viewW * scaleX, viewH * scaleY);
}
