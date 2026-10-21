import fs from "node:fs";
import path from "node:path";
import { MAP_W, MAP_H, TILE, CROPS, GAME_START_MINUTES, BUILD_OPTIONS, ANIMALS } from "../shared/constants.js";
import { REGION_DEFS, JOBS, isVacationDay, jobShiftHours, weekdayIndex } from "../shared/careers.js";

const WORLDS_DIR = () => process.env.DATA_DIR || path.join("server", "data", "worlds");

// PRNG determinístico: o mapa é igual para todo mundo, mesmo recarregado.
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createEmptyMap() {
  const rand = mulberry32(20261019);
  const tiles = [];
  for (let y = 0; y < MAP_H; y++) {
    tiles[y] = [];
    for (let x = 0; x < MAP_W; x++) tiles[y][x] = TILE.GRASS;
  }

  // Caminhos principais
  for (let x = 8; x <= 56; x++) tiles[26][x] = TILE.PATH;
  for (let y = 10; y <= 42; y++) tiles[y][24] = TILE.PATH;
  for (let x = 28; x <= 52; x++) tiles[14][x] = TILE.PATH;
  for (let y = 10; y <= 30; y++) tiles[y][44] = TILE.PATH;
  // Praça
  for (let y = 22; y <= 25; y++) for (let x = 34; x <= 41; x++) tiles[y][x] = TILE.PATH;

  // Lago (formato orgânico)
  for (let y = 35; y <= 46; y++) {
    for (let x = 8; x <= 28; x++) {
      const dx = (x - 18) / 9.5, dy = (y - 40.5) / 5.2;
      const edge = rand() * 0.18;
      if (dx * dx + dy * dy < 1 - edge) tiles[y][x] = TILE.WATER;
    }
  }
  // areia ao redor do lago
  for (let y = 33; y <= 48; y++) for (let x = 6; x <= 30; x++) {
    if (tiles[y][x] !== TILE.WATER && (tiles[y - 1]?.[x] === TILE.WATER || tiles[y + 1]?.[x] === TILE.WATER || tiles[y]?.[x - 1] === TILE.WATER || tiles[y]?.[x + 1] === TILE.WATER)) {
      tiles[y][x] = TILE.SAND;
    }
  }
  // Praia ao sul
  for (let y = 47; y < MAP_H; y++) for (let x = 2; x <= 34; x++) tiles[y][x] = TILE.SAND;

  // Rio a leste
  for (let y = 3; y <= 35; y++) {
    for (let x = 58; x <= 61; x++) {
      tiles[y][x] = TILE.WATER;
    }
  }
  // margens do rio
  for (let y = 3; y <= 35; y++) {
    if (tiles[y][57] !== TILE.WATER) tiles[y][57] = TILE.SAND;
    if (tiles[y][62] !== TILE.WATER) tiles[y][62] = TILE.SAND;
  }

  // Floresta densa a noroeste
  for (let y = 2; y <= 12; y++) for (let x = 2; x <= 14; x++) {
    if (rand() < 0.9) tiles[y][x] = TILE.DARK_GRASS;
  }
  // Área da mina a nordeste
  for (let y = 2; y <= 11; y++) for (let x = 52; x <= 67; x++) {
    if (rand() < 0.75) tiles[y][x] = TILE.STONE;
  }
  // clareira da mina
  for (let y = 8; y <= 12; y++) for (let x = 52; x <= 60; x++) tiles[y][x] = TILE.GRASS;
  // entrada de pedra
  for (let y = 3; y <= 7; y++) for (let x = 53; x <= 58; x++) tiles[y][x] = TILE.STONE;

  // Árvores espalhadas (dark grass) na borda oeste
  for (let y = 12; y <= 44; y++) {
    if (rand() < 0.35) tiles[y][2] = TILE.DARK_GRASS;
    if (rand() < 0.35) tiles[y][3] = TILE.DARK_GRASS;
  }
  for (let x = 2; x <= 12; x++) if (rand() < 0.5) tiles[13][x] = TILE.DARK_GRASS;

  // Divisão fazenda x cidade (estilo Stardew: faixa de árvores/cerca separando áreas)
  // hedge natural em y=28 (comporta divisória)
  for (let x = 10; x <= 50; x++) {
    if (x >= 23 && x <= 25) continue; // portão no caminho central
    if (x >= 43 && x <= 45) continue; // portão leste
    if (rand() < 0.92) tiles[28][x] = TILE.DARK_GRASS;
  }
  // fileira de cerca visual será gerada como props, mas deixamos caminho de terra na divisória
  for (let x = 10; x <= 50; x++) if (tiles[28][x] === TILE.DARK_GRASS && rand() < 0.4) tiles[27][x] = TILE.DARK_GRASS;

  // Pequena horta comunitária perto do celeiro
  for (let y = 33; y <= 35; y++) for (let x = 15; x <= 21; x++) tiles[y][x] = TILE.GRASS;

  return tiles;
}


// ---------- Mapas das regiões de transporte ----------
function fillGrid(w, h, tile) {
  return Array.from({ length: h }, () => Array.from({ length: w }, () => tile));
}

export function createRegionMap(regionId) {
  const def = REGION_DEFS[regionId];
  if (!def) return null;
  const { w, h } = def.size;
  const rand = mulberry32(regionId.split("").reduce((a, c) => a + c.charCodeAt(0), 7919));

  if (regionId === "vila") {
    const tiles = fillGrid(w, h, TILE.GRASS);
    // mar ao sul
    for (let y = 20; y < h; y++) for (let x = 0; x < w; x++) tiles[y][x] = TILE.WATER;
    // faixa de areia
    for (let y = 17; y < 20; y++) for (let x = 0; x < w; x++) tiles[y][x] = TILE.SAND;
    // caminhos
    for (let x = 6; x < 40; x++) tiles[15][x] = TILE.PATH;
    for (let y = 10; y < 18; y++) tiles[y][22] = TILE.PATH;
    for (let y = 11; y < 16; y++) tiles[y][15] = TILE.PATH;
    // praça
    for (let y = 13; y < 16; y++) for (let x = 28; x < 33; x++) tiles[y][x] = TILE.PATH;
    // palmeiras e arbustos
    for (let i = 0; i < 26; i++) {
      const x = 2 + Math.floor(rand() * 42);
      const y = 2 + Math.floor(rand() * 13);
      if (tiles[y][x] === TILE.GRASS) tiles[y][x] = TILE.DARK_GRASS;
    }
    // cais sobre a água
    for (let x = 19; x <= 25; x++) { tiles[20][x] = TILE.BRIDGE; tiles[21][x] = TILE.BRIDGE; }
    return tiles;
  }

  if (regionId === "ilha") {
    const tiles = fillGrid(w, h, TILE.WATER);
    // forma orgânica da ilha
    for (let y = 2; y < h - 2; y++) {
      for (let x = 2; x < w - 2; x++) {
        const dx = (x - w / 2) / (w / 2 - 2);
        const dy = (y - h / 2) / (h / 2 - 3);
        const d = dx * dx + dy * dy;
        if (d < 0.72 + rand() * 0.12) tiles[y][x] = TILE.SAND;
        if (d < 0.5 + rand() * 0.1) tiles[y][x] = TILE.GRASS;
        if (d < 0.26) tiles[y][x] = TILE.DARK_GRASS;
      }
    }
    // clareira central
    for (let y = 9; y < 15; y++) for (let x = 15; x < 26; x++) {
      if (tiles[y][x] !== TILE.WATER) tiles[y][x] = TILE.GRASS;
    }
    // caminho até o píer
    for (let y = 15; y < 21; y++) tiles[y][20] = TILE.PATH;
    // cais
    for (let x = 18; x <= 24; x++) { tiles[21][x] = TILE.BRIDGE; tiles[22][x] = TILE.BRIDGE; }
    // ruínas (pedra)
    for (let y = 4; y <= 8; y++) for (let x = 30; x <= 37; x++) tiles[y][x] = TILE.STONE;
    return tiles;
  }

  if (regionId === "cidade") {
    const tiles = fillGrid(w, h, TILE.PATH);
    // quarteirões de grama
    for (let y = 2; y < 12; y++) for (let x = 2; x < 8; x++) tiles[y][x] = TILE.GRASS;
    for (let y = 2; y < 12; y++) for (let x = 40; x < 46; x++) tiles[y][x] = TILE.GRASS;
    for (let y = 12; y < 24; y++) for (let x = 2; x < 10; x++) tiles[y][x] = TILE.GRASS;
    for (let y = 12; y < 24; y++) for (let x = 38; x < 46; x++) tiles[y][x] = TILE.GRASS;
    // praça central com fonte
    for (let y = 12; y < 19; y++) for (let x = 19; x < 30; x++) tiles[y][x] = TILE.STONE;
    for (let y = 14; y < 17; y++) for (let x = 22; x < 27; x++) tiles[y][x] = TILE.WATER;
    // calçadas de pedestre
    for (let x = 0; x < w; x++) { tiles[5][x] = TILE.STONE; tiles[18][x] = TILE.STONE; }
    // pista do aeroporto
    for (let y = 21; y <= 24; y++) for (let x = 8; x <= 38; x++) tiles[y][x] = TILE.STONE;
    return tiles;
  }

  return fillGrid(w, h, TILE.GRASS);
}

export function ensureRegions(world) {
  world.regions ||= {};
  for (const id of ["vila", "ilha", "cidade"]) {
    if (!world.regions[id]?.tiles?.length) {
      world.regions[id] = { tiles: createRegionMap(id) };
    }
  }
  return world.regions;
}

export function createWorldState(roomCode) {
  return {
    roomCode,
    day: 1,
    seasonIndex: 0,
    weather: "Ensolarado",
    time: GAME_START_MINUTES,
    tiles: createEmptyMap(),
    plots: {},
    buildings: {},
    animals: [],
    communityProgress: { praca: 0, biblioteca: 0, ponte: 0, estrada: 0, porto: 0, estacao: 0 },
    playerStates: {},
    regions: {
      vila: { tiles: createRegionMap("vila") },
      ilha: { tiles: createRegionMap("ilha") },
      cidade: { tiles: createRegionMap("cidade") },
    },
    coop: { week: 0, progress: {}, completed: [] },
    festival: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function saveWorldToDisk(roomCode, world) {
  try {
    const dir = WORLDS_DIR();
    fs.mkdirSync(dir, { recursive: true });
    world.updatedAt = Date.now();
    const target = path.join(dir, `${roomCode}.json`);
    const tmp = target + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(world));
    fs.renameSync(tmp, target);
  } catch (e) {
    console.error("Erro ao salvar mundo", roomCode, e.message);
  }
}

export function loadWorldFromDisk(roomCode) {
  try {
    const p = path.join(WORLDS_DIR(), `${roomCode}.json`);
    if (fs.existsSync(p)) {
      const world = JSON.parse(fs.readFileSync(p, "utf-8"));
      // migração defensiva
      world.playerStates ||= {};
      world.animals ||= [];
      world.buildings ||= {};
      world.communityProgress ||= { praca: 0, biblioteca: 0, ponte: 0, estrada: 0 };
      for (const k of ["praca", "biblioteca", "ponte", "estrada", "porto", "estacao"]) world.communityProgress[k] ??= 0;
      if (!world.tiles || !world.tiles.length) world.tiles = createEmptyMap();
      ensureRegions(world);
      world.coop ||= { week: 0, progress: {}, completed: [] };
      // migração: garante que o rio só seja atravessável com a ponte comunitária
      const hasBridge = (world.communityProgress?.ponte || 0) >= 1000;
      for (let x = 58; x <= 61; x++) {
        if (world.tiles[26] && world.tiles[26][x] !== undefined) {
          world.tiles[26][x] = hasBridge ? TILE.BRIDGE : TILE.WATER;
        }
      }
      return world;
    }
  } catch (e) {
    console.error("Erro ao carregar mundo", roomCode, e.message);
  }
  return null;
}

export function isEstufaAt(world, x, y) {
  for (const key in world.buildings) {
    const b = world.buildings[key];
    if (b.buildingId !== "estufa") continue;
    const def = BUILD_OPTIONS[b.buildingId];
    if (!def) continue;
    if (x >= b.x && x < b.x + def.w && y >= b.y && y < b.y + def.h) return true;
  }
  return false;
}

export function isTileFreeForBuilding(world, x, y, w, h) {
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) {
      if (xx < 0 || yy < 0 || xx >= MAP_W || yy >= MAP_H) return false;
      const t = world.tiles[yy]?.[xx];
      if (t !== TILE.GRASS && t !== TILE.DARK_GRASS) return false;
      if (world.plots[`${xx},${yy}`]) return false;
      for (const key in world.buildings) {
        const b = world.buildings[key];
        const bd = BUILD_OPTIONS[b.buildingId];
        if (!bd) continue;
        if (xx >= b.x && xx < b.x + bd.w && yy >= b.y && yy < b.y + bd.h) return false;
      }
    }
  }
  return true;
}

function chooseWeather(seasonIndex, rand) {
  const r = rand();
  if (seasonIndex === 3) {
    if (r < 0.45) return "Ensolarado";
    if (r < 0.62) return "Nublado";
    if (r < 0.74) return "Nevoa";
    if (r < 0.9) return "Neve";
    return "Chuvoso";
  }
  if (r < 0.68) return "Ensolarado";
  if (r < 0.84) return "Nublado";
  if (r < 0.96) return "Chuvoso";
  return "Nevoa";
}

/**
 * Avança o dia: clima, crescimento, animais, festival, reset de água.
 * Retorna uma lista de avisos para os jogadores.
 */
export function advanceDay(world) {
  world.day += 1;
  if (world.day > 28) {
    world.day = 1;
    world.seasonIndex = (world.seasonIndex + 1) % 4;
  }
  world.weather = chooseWeather(world.seasonIndex, Math.random);
  const rainy = world.weather === "Chuvoso";
  const snowing = world.weather === "Neve";
  const notes = [];

  // Cresce apenas o que foi regado (chuva/neve regam tudo)
  for (const key in world.plots) {
    const plot = world.plots[key];
    if (!plot.crop) continue;
    const cropDef = CROPS[plot.crop];
    if (!cropDef) { delete world.plots[key]; continue; }
    const [x, y] = key.split(",").map(Number);
    const greenhouse = isEstufaAt(world, x, y);
    // fora de estação a planta seca (estufa protege)
    if (!greenhouse && cropDef.season !== world.seasonIndex) {
      delete world.plots[key];
      continue;
    }
    if (rainy || snowing) plot.watered = true;
    if (plot.watered) plot.stage = Math.min(plot.stage + 1, cropDef.daysToGrow);
    plot.watered = false;
    // volta o tile molhado para terra normal
    if (world.tiles[y]?.[x] === TILE.TILLED_WATERED) world.tiles[y][x] = TILE.TILLED;
  }

  // Animais produzem para o dono
  for (const animal of world.animals) {
    const def = ANIMALS[animal.type];
    if (!def) continue;
    if (Math.random() > def.productChance) continue;
    const st = world.playerStates[animal.owner];
    if (st) {
      st.inventory[def.product] = (st.inventory[def.product] || 0) + 1;
    }
    animal.lastProduct = world.day;
  }

  // Evolução familiar simples (baby -> child após 4 dias, child -> youth após 14)
  for (const st of Object.values(world.playerStates||{})) {
    if (!st.family) continue;
    const age = world.day - (st.family.sinceDay||world.day) + (world.seasonIndex*28);
    if (st.family.stage==="baby" && age>=4) { st.family.stage="child"; }
    if (st.family.stage==="child" && age>=14) { st.family.stage="kid"; }
  }
  for (const p of []){} // placeholder to keep syntax

  // Festival no último dia de cada estação
  if (world.day === 28) {
    world.festival = { name: "Festival da Colheita", season: world.seasonIndex, day: 28 };
    notes.push("🎉 Hoje é o Festival da Colheita! A praça está em festa.");
  } else {
    world.festival = null;
  }
  if (world.day === 1) {
    notes.push(`🍃 Uma nova estação começa: ${["Primavera", "Verão", "Outono", "Inverno"][world.seasonIndex]}!`);
  }

  // juros de empréstimos: a cada virada de estação, 6% sobre o saldo
  const newSeason = world.day===1;
  if (newSeason) {
    for (const st of Object.values(world.playerStates||{})) {
      if (st.loan && st.loan.balance>0) {
        const j = Math.ceil(st.loan.balance * 0.06);
        st.loan.balance += j;
        st.bankHistory ||= [];
        st.bankHistory.push({ at: Date.now(), text: `+ Juros empréstimo $${j} → saldo $${st.loan.balance}` });
      }
    }
  }
  world.time = GAME_START_MINUTES;
  world.updatedAt = Date.now();
  return notes;
}

export { WORLDS_DIR };
