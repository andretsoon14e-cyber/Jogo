// ============================================================
//  Chão: texturas de grama, terra, pedra, areia e água, com
//  auto-tiling de caminhos e detalhes naturais espalhados.
//  O chão é pré-renderizado num canvas (cache) para performance.
// ============================================================
import { mkCanvas, hash, cached } from "./pixel.js";
import { C, SEASON_ART, PIX, shade, alpha, mix } from "./palette.js";

const T = 32;

function valueNoise(x, y, seed) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi, seed), b = hash(xi + 1, yi, seed);
  const c = hash(xi, yi + 1, seed), d = hash(xi + 1, yi + 1, seed);
  return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
}

function grassTile(g, x, y, th) {
  // base com variação sutil (foto tem grama viva com manchas mais escuras)
  const h = hash(x, y, 101);
  const baseIdx = h > 0.72 ? 2 : h > 0.35 ? 1 : 0;
  g.fillStyle = th.grass[baseIdx];
  g.fillRect(x, y, T, T);
  // xadrez sutil 4x4 igual Stardew (alternância de tom nas quinas)
  if (((x/T|0)+(y/T|0))%2===0 && hash(x,y,202)>0.66) {
    g.fillStyle = alpha(th.grass[3], 0.10);
    g.fillRect(x, y, T, T);
  }
  g.fillStyle = alpha("#000000", 0.03);
  g.fillRect(x+T-1, y, 1, T); g.fillRect(x, y+T-1, T, 1);
  // mancha orgânica clara
  if (h > 0.82) {
    g.fillStyle = alpha(th.grass[2], 0.22);
    g.fillRect(x + 4, y + 6, 12, 8);
  }
  if (h < 0.18) {
    g.fillStyle = alpha(th.grass[3], 0.18);
    g.fillRect(x + 2, y + 18, 14, 6);
  }
  // lâminas espalhadas - mais densas como na foto (bordas com moitas)
  const n = 4 + ((hash(x, y, 1) * 4) | 0);
  for (let i = 0; i < n; i++) {
    const bx = x + 1 + (hash(x * 3 + i, y * 5, 5) * (T - 3) | 0);
    const by = y + 2 + (hash(x * 7, y * 3 + i, 6) * (T - 5) | 0);
    g.fillStyle = i % 2 ? th.tuft[0] : th.tuft[1];
    g.fillRect(bx, by, 1, 4);
    g.fillRect(bx + 1, by + 1, 1, 3);
    if (i % 3 === 0) g.fillRect(bx - 1, by + 2, 1, 1);
    // brilho
    if (i % 4 === 0) {
      g.fillStyle = alpha(th.leafLight || "#b9e783", 0.35);
      g.fillRect(bx + 2, by - 1, 1, 1);
    }
  }
  // pedrinhas raras na grama (como foto)
  if (hash(x, y, 77) > 0.96) {
    g.fillStyle = "#9aa79c";
    g.fillRect(x+14, y+20, 4, 3);
    g.fillStyle = "#c9c8bd";
    g.fillRect(x+14, y+20, 3, 1);
  }
}

function pathTile(g, x, y, th, mask) {
  // base de grama por baixo, depois terra batida
  grassTile(g, x, y, th);
  const p1 = th.path[0], p2 = th.path[1];
  g.fillStyle = p1;
  const pad = 0;
  g.fillRect(x + pad, y + pad, T - pad * 2, T - pad * 2);
  // variação de tom
  const h = hash(x, y, 9);
  g.fillStyle = alpha(p2, 0.6);
  g.fillRect(x + (h * 16 | 0), y + (hash(y, x, 10) * 16 | 0), 11, 8);
  // pedrinhas
  for (let i = 0; i < 3; i++) {
    const px = x + 3 + (hash(x + i, y, 11) * 24 | 0);
    const py = y + 3 + (hash(x, y + i, 12) * 24 | 0);
    g.fillStyle = i % 2 ? alpha("#fff6de", 0.55) : alpha(th.pathEdge, 0.6);
    g.fillRect(px, py, 2, 2);
    g.fillRect(px + 2, py + 1, 1, 1);
  }
  // bordas: transição suave com a grama (sem linha reta de célula)
  const edge = th.pathEdge;
  if (!(mask & 1)) {
    g.fillStyle = alpha(edge, 0.30); g.fillRect(x, y, T, 3);
    g.fillStyle = alpha(edge, 0.16); g.fillRect(x, y + 3, T, 2);
    g.fillStyle = th.tuft[1];
    for (let i = 0; i < 5; i++) g.fillRect(x + i * 7 + (h * 5 | 0), y - 2, 1, 3);
  }
  if (!(mask & 4)) {
    g.fillStyle = alpha(edge, 0.30); g.fillRect(x, y + T - 3, T, 3);
    g.fillStyle = alpha(edge, 0.16); g.fillRect(x, y + T - 5, T, 2);
    g.fillStyle = th.tuft[1];
    for (let i = 0; i < 5; i++) g.fillRect(x + i * 7 + 2, y + T - 1, 1, 3);
  }
  if (!(mask & 8)) {
    g.fillStyle = alpha(edge, 0.30); g.fillRect(x, y, 3, T);
    g.fillStyle = alpha(edge, 0.16); g.fillRect(x + 3, y, 2, T);
    g.fillStyle = th.tuft[1];
    for (let i = 0; i < 4; i++) g.fillRect(x - 1, y + i * 9 + 3, 3, 1);
  }
  if (!(mask & 2)) {
    g.fillStyle = alpha(edge, 0.30); g.fillRect(x + T - 3, y, 3, T);
    g.fillStyle = alpha(edge, 0.16); g.fillRect(x + T - 5, y, 2, T);
    g.fillStyle = th.tuft[1];
    for (let i = 0; i < 4; i++) g.fillRect(x + T - 1, y + i * 9 + 5, 3, 1);
  }
}

function plazaTile(g, x, y) {
  grassTile(g, x, y, SEASON_ART[0]);
  g.fillStyle = C.stone2;
  g.fillRect(x, y, T, T);
  const rowH = 8;
  for (let r = 0; r < 4; r++) {
    const off = r % 2 ? 8 : 0;
    for (let cIdx = -1; cIdx < 5; cIdx++) {
      const bx = x + off + cIdx * 16, by = y + r * rowH;
      const h = hash(bx, by, 3);
      g.fillStyle = h > 0.5 ? C.stone1 : C.stone2;
      g.fillRect(bx + 1, by + 1, 14, rowH - 2);
      g.fillStyle = alpha(C.stone0, 0.5);
      g.fillRect(bx + 1, by + 1, 14, 1);
      g.fillStyle = alpha(C.stone4, 0.35);
      g.fillRect(bx + 1, by + rowH - 2, 14, 1);
    }
  }
  g.fillStyle = alpha(C.stone3, 0.55);
  g.fillRect(x, y, T, 1);
  g.fillRect(x, y, 1, T);
}

function sandTile(g, x, y, th) {
  const h = hash(x, y, 21);
  g.fillStyle = th.path[0];
  g.fillRect(x, y, T, T);
  g.fillStyle = alpha("#fff8e0", 0.5);
  g.fillRect(x, y + (h * 20 | 0), T, 3);
  g.fillStyle = alpha(th.pathEdge, 0.35);
  for (let i = 0; i < 3; i++) g.fillRect(x + (hash(i, x, y) * 28 | 0), y + (hash(x, i, y) * 28 | 0), 2, 1);
}


function farmDirtTile(g, x, y) {
  // Stardew farm dirt: warm tan #d2a679 with subtle variation and pebbles
  const base = "#d8b070";
  g.fillStyle = base;
  g.fillRect(x, y, T, T);
  // splotches
  const h = hash(x, y, 91);
  if (h > 0.6) {
    g.fillStyle = "rgba(180,130,70,0.18)";
    g.fillRect(x+4, y+6, 10, 8);
    g.fillRect(x+18, y+12, 8, 6);
  }
  if (h < 0.25) {
    g.fillStyle = "rgba(255,235,180,0.22)";
    g.fillRect(x+2, y+18, 12, 5);
  }
  // tiny pebbles scattered (like Stardew farm ground)
  for (let i=0;i<4;i++) {
    const px = x + 3 + (hash(x+i, y, 93+i)*24|0);
    const py = y + 4 + (hash(y+i, x, 94+i)*24|0);
    g.fillStyle = i%2 ? "#8c7a5b" : "#5a4a3a";
    g.fillRect(px, py, 2, 2);
    if (i%3==0) {
      g.fillStyle = "#c9b896";
      g.fillRect(px+1, py, 1,1);
    }
  }
  // faint till lines
  g.fillStyle = "rgba(90,60,30,0.07)";
  for (let r=0;r<3;r++) g.fillRect(x, y+8+r*9, T, 1);
}

function stoneWallTile(g, x, y, th, mask) {
  // Stone wall border for farm beds (Stardew style)
  const dx = x % T
  // Actually draw wall centered on edge; for simplicity draw full tile with wall pattern if needed
  // Use only when called as overlay
  g.fillStyle = C.stone3;
  g.fillRect(x, y, T, T);
  // mortar lines
  g.fillStyle = C.stone4;
  g.fillRect(x, y, T, 2);
  g.fillRect(x, y+T-2, T, 2);
  for (let i=0;i<T;i+=8) {
    g.fillRect(x+i, y+2, 2, T-4);
  }
  // highlight top
  g.fillStyle = C.stone1;
  g.fillRect(x, y, T, 2);
  g.fillRect(x+1, y+2, T-2, 1);
}

function woodTile(g, x, y) {
  g.fillStyle = C.wood2;
  g.fillRect(x, y, T, T);
  for (let i = 0; i < 4; i++) {
    g.fillStyle = i % 2 ? C.wood1 : C.wood3;
    g.fillRect(x + i * 8, y, 1, T);
    g.fillStyle = alpha(C.wood0, 0.25);
    g.fillRect(x + i * 8 + 1, y, 1, T);
  }
  g.fillStyle = alpha(C.wood4, 0.4);
  g.fillRect(x, y + 15, T, 1);
}

function bridgeTile(g, x, y) {
  g.fillStyle = C.wood3;
  g.fillRect(x, y, T, T);
  for (let r = 0; r < 4; r++) {
    g.fillStyle = r % 2 ? C.wood2 : C.wood1;
    g.fillRect(x + 1, y + r * 8 + 1, T - 2, 6);
    g.fillStyle = alpha(C.wood0, 0.3);
    g.fillRect(x + 1, y + r * 8 + 1, T - 2, 1);
    g.fillStyle = alpha(C.wood4, 0.45);
    g.fillRect(x + 1, y + r * 8 + 6, T - 2, 1);
  }
  g.fillStyle = C.wood4;
  g.fillRect(x, y, 2, T); g.fillRect(x + T - 2, y, 2, T);
}

function tilledTile(g, x, y, watered) {
  // canteiro arado estilo foto: marrom avermelhado, sulcos verticais profundos
  g.fillStyle = watered ? "#6b4a2e" : "#9c6a2d";
  g.fillRect(x, y, T, T);
  // borda do canteiro (sombra leve)
  g.fillStyle = watered ? "#4f3620" : "#7a4a20";
  g.fillRect(x, y, T, 2);
  g.fillRect(x, y + T - 2, T, 2);
  g.fillRect(x, y, 2, T);
  g.fillRect(x + T - 2, y, 2, T);
  // sulcos arados
  for (let r = 0; r < 4; r++) {
    g.fillStyle = watered ? "#5a3d24" : "#7a4a20";
    g.fillRect(x + 2, y + 4 + r * 8, T - 4, 3);
    g.fillStyle = watered ? "#8b6a3e" : "#c99a4a";
    g.fillRect(x + 2, y + 7 + r * 8, T - 4, 1);
    // crista clara
    g.fillStyle = alpha("#e8d2a0", watered ? 0.14 : 0.22);
    g.fillRect(x + 2, y + 3 + r * 8, T - 4, 1);
  }
  if (watered) {
    // água brilhante nos sulcos
    g.fillStyle = "rgba(90,160,210,.22)";
    for (let r = 0; r < 4; r++) g.fillRect(x + 4, y + 5 + r * 8, T-8, 2);
    g.fillStyle = "rgba(150,210,255,.20)";
    g.fillRect(x + 8, y + 6, 10, 1);
    g.fillRect(x + 18, y + 14, 8, 1);
  } else {
    // pedrinhas secas
    g.fillStyle = alpha("#d8c4a0", 0.35);
    g.fillRect(x+6, y+10, 3,2); g.fillRect(x+20, y+22, 2,2);
  }
}

function forestFloor(g, x, y, th) {
  g.fillStyle = mix(th.grass[3], th.grassDark[0], 0.55);
  g.fillRect(x, y, T, T);
  // serrapilheira: folhas secas espalhadas nas juntas dos tiles
  for (let i = 0; i < 5; i++) {
    const fx = x + (hash(i, x, y, 54) * (T - 4) | 0);
    const fy = y + (hash(x, i, y, 55) * (T - 3) | 0);
    g.fillStyle = i % 2 ? alpha(th.leaf[3], 0.55) : alpha(th.grassDark[1], 0.45);
    g.fillRect(fx, fy, 4, 2);
    if (i === 0) g.fillRect(fx + 1, fy + 2, 2, 1);
  }
  // tufos baixos
  g.fillStyle = th.grassDark[1];
  for (let i = 0; i < 3; i++) {
    const bx = x + 3 + (hash(x, y + i, 56) * (T - 6) | 0);
    const by = y + 4 + (hash(y, x + i, 57) * (T - 8) | 0);
    g.fillRect(bx, by, 1, 3); g.fillRect(bx + 2, by - 1, 1, 4);
  }
}

function pathMask(tiles, x, y, maxW, maxH) {
  const isP = (xx, yy) => {
    if (xx < 0 || yy < 0 || xx >= maxW || yy >= maxH) return true; // fora = conecta
    const t = tiles[yy]?.[xx];
    return t === 3 || t === 6; // PATH | STONE
  };
  let m = 0;
  if (isP(x, y - 1)) m |= 1;
  if (isP(x + 1, y)) m |= 2;
  if (isP(x, y + 1)) m |= 4;
  if (isP(x - 1, y)) m |= 8;
  return m;
}

/**
 * Constrói o canvas de chão da região.
 * @param {Array<Array<number>>} tiles
 * @param {number} season
 * @param {Set<string>} blocked tiles "x,y" ocupados por construções
 */
export function buildGround(regionKey, tiles, season, blocked = new Set(), opts = {}) {
  const th = SEASON_ART[season] || SEASON_ART[0];
  const H = tiles.length, W = tiles[0]?.length || 0;
  const c = mkCanvas(W * T, H * T);
  const g = c.getContext("2d");
  g.imageSmoothingEnabled = false;
  // Farm zone: southern farm area (sandy dirt like Stardew)
  const isFarmArea = (x, y) => x >= 10 && x <= 34 && y >= 29 && y <= 48;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const t = tiles[y][x];
      const px = x * T, py = y * T;
      if (t === 3) pathTile(g, px, py, th, pathMask(tiles, x, y, W, H));
      else if (t === 6) plazaTile(g, px, py);
      else if (t === 4) sandTile(g, px, py, th);
      else if (t === 5) woodTile(g, px, py);
      else if (t === 9) bridgeTile(g, px, py);
      else if (t === 1 || t === 7) tilledTile(g, px, py, t === 7);
      else if (t === 8) forestFloor(g, px, py, th);
      else if (t === 2) { /* água desenhada dinamicamente */ }
      else {
        if (isFarmArea(x, y)) farmDirtTile(g, px, py);
        else grassTile(g, px, py, th);
      }
    }
  }
  // Stone wall borders around tilled farm beds (Stardew raised beds)
  g.fillStyle = C.stone2;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const t = tiles[y][x];
      if (t !== 1 && t !== 7) continue;
      const px = x * T, py = y * T;
      const isTilled = (xx,yy) => tiles[yy]?.[xx] === 1 || tiles[yy]?.[xx] === 7;
      // top edge
      if (!isTilled(x, y-1)) {
        g.fillStyle = C.stone1; g.fillRect(px, py, T, 4);
        g.fillStyle = C.stone2; g.fillRect(px, py+2, T, 2);
        g.fillStyle = C.stone4; g.fillRect(px, py+4, T, 1);
        // cap stones
        for (let i=0;i<T;i+=8) { g.fillStyle = C.stone3; g.fillRect(px+i, py, 2, 4); }
      }
      // bottom
      if (!isTilled(x, y+1)) {
        g.fillStyle = C.stone4; g.fillRect(px, py+T-4, T, 4);
        g.fillStyle = C.stone2; g.fillRect(px, py+T-4, T, 2);
        g.fillStyle = "rgba(30,24,16,0.22)"; g.fillRect(px, py+T, T, 2);
      }
      // left
      if (!isTilled(x-1, y)) {
        g.fillStyle = C.stone3; g.fillRect(px, py, 4, T);
        g.fillStyle = C.stone1; g.fillRect(px, py, 2, T);
      }
      // right
      if (!isTilled(x+1, y)) {
        g.fillStyle = C.stone3; g.fillRect(px+T-4, py, 4, T);
        g.fillStyle = C.stone4; g.fillRect(px+T-2, py, 2, T);
      }
      // corners: pillar
      if (!isTilled(x-1, y) && !isTilled(x, y-1)) {
        g.fillStyle = C.stone1; g.fillRect(px-2, py-2, 8, 8);
        g.fillStyle = C.stone2; g.fillRect(px, py, 6, 6);
        g.fillStyle = C.stone4; g.fillRect(px+4, py, 2, 6);
      }
    }
  }

  // transição orgânica grama <-> floresta (blocos de 2px nas bordas)
  const forestCol = mix(th.grass[3], th.grassDark[0], 0.55);
  const grassCol = th.grass[1];
  const isForestTile = (tx, ty) => tiles[ty]?.[tx] === 8;
  const BS = 2;
  for (let ty = 0; ty < H; ty++) {
    for (let tx = 0; tx < W; tx++) {
      const isF = isForestTile(tx, ty);
      if (!isF && tiles[ty][tx] !== 0) continue;
      let nearOpposite = false;
      for (let dy = -2; dy <= 2 && !nearOpposite; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const nx = tx + dx, ny = ty + dy;
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
          const nt = tiles[ny][nx];
          if ((nt === 8 || nt === 0) && ((nt === 8) !== isF)) { nearOpposite = true; break; }
        }
      }
      if (!nearOpposite) continue;
      for (let dy = 0; dy < T; dy += BS) {
        for (let dx = 0; dx < T; dx += BS) {
          const wx = tx * T + dx, wy = ty * T + dy;
          const n = valueNoise(wx * 0.085, wy * 0.085, isF ? 61 : 62);
          const swap = isF ? n < 0.50 : n > 0.50;
          if (!swap) continue;
          g.fillStyle = isF ? grassCol : forestCol;
          g.fillRect(wx, wy, BS, BS);
          if (!isF && hash(wx, wy, 63) > 0.7) {
            g.fillStyle = alpha(th.leaf[3], 0.35);
            g.fillRect(wx, wy, 2, 1);
          }
        }
      }
    }
  }

  // ---------- manchas orgânicas (independem das bordas dos tiles) ----------
  const dither = 4;
  for (let py = 0; py < c.height; py += dither) {
    for (let px = 0; px < c.width; px += dither) {
      const tx = px / T, ty = py / T;
      const t0 = tiles[Math.floor(ty)]?.[Math.floor(tx)];
      if (t0 !== 0 && t0 !== 8) continue;             // só grama/floresta
      const isForest = t0 === 8;
      const n = valueNoise(px * 0.0075, py * 0.0075, isForest ? 71 : 70);
      const n2 = valueNoise(px * 0.028, py * 0.028, isForest ? 73 : 72);
      let col = null;
      if (n > 0.62) col = isForest ? alpha(th.grass[1], 0.20) : alpha(th.grass[2], 0.24);
      else if (n < 0.34) col = isForest ? alpha(th.grassDark[0], 0.18) : alpha(th.grass[3], 0.19);
      else if (n2 > 0.78) col = isForest ? alpha(th.grassDark[1], 0.13) : alpha(th.grass[2], 0.11);
      else if (n2 < 0.20) col = isForest ? alpha(th.grass[0], 0.10) : alpha(th.grassDark[1], 0.08);
      if (col) { g.fillStyle = col; g.fillRect(px, py, dither, dither); }
    }
  }

  // ---------- detalhes espalhados ----------
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const t = tiles[y][x];
      if (t === 2 || t === 3 || t === 5 || t === 6 || t === 9 || t === 1 || t === 7) continue;
      if (blocked.has(`${x},${y}`)) continue;
      const px = x * T, py = y * T;
      const h = hash(x, y, 77);
      const isForest = t === 8;
      if (isForest) {
        if (h > 0.86) {
          const gx = px + (hash(x, y, 91) * 24 | 0), gy = py + (hash(y, x, 92) * 24 | 0);
          g.fillStyle = hash(x, y, 93) > 0.5 ? "#c9564a" : "#e8dcc4";
          g.fillRect(gx, gy + 2, 2, 3);
          g.fillStyle = hash(x, y, 93) > 0.5 ? "#e8746a" : "#c9b898";
          g.fillRect(gx - 1, gy, 4, 2);
        }
        if (h > 0.55 && h < 0.6) {
          const gx = px + (hash(x, y, 94) * 26 | 0), gy = py + (hash(y, x, 95) * 26 | 0);
          g.fillStyle = alpha(th.leaf[3], 0.55);
          g.fillRect(gx, gy, 4, 2); g.fillRect(gx + 2, gy + 2, 3, 1);
        }
        continue;
      }
      if (h > 0.90) {
        const col = th.flowers[Math.floor(hash(x, y, 78) * th.flowers.length)];
        const fx = px + 6 + (hash(x, y, 79) * 18 | 0);
        const fy = py + 7 + (hash(y, x, 80) * 16 | 0);
        g.fillStyle = th.tuft[1]; g.fillRect(fx, fy + 3, 1, 4);
        g.fillStyle = col; g.fillRect(fx - 1, fy, 3, 3);
        g.fillStyle = "#f0b24a"; g.fillRect(fx, fy + 1, 1, 1);
        g.fillStyle = alpha("#ffffff", 0.35); g.fillRect(fx, fy, 1, 1);
      }
      if (h > 0.58 && h < 0.66) {
        const gx = px + 4 + (hash(x, y, 81) * 20 | 0), gy = py + 8 + (hash(y, x, 82) * 14 | 0);
        g.fillStyle = th.tuft[0];
        g.fillRect(gx, gy, 1, 5); g.fillRect(gx + 2, gy + 1, 1, 4); g.fillRect(gx + 4, gy - 1, 1, 6);
        g.fillStyle = th.tuft[1];
        g.fillRect(gx + 1, gy + 2, 1, 3); g.fillRect(gx + 5, gy + 1, 1, 3);
      }
      if (h > 0.30 && h < 0.33) {
        const gx = px + 10 + (hash(x, y, 83) * 12 | 0), gy = py + 12 + (hash(y, x, 84) * 10 | 0);
        g.fillStyle = C.stone3; g.fillRect(gx, gy, 5, 3);
        g.fillStyle = C.stone1; g.fillRect(gx, gy, 4, 1);
      }
    }
  }
  return c;
}

/** Retângulo de água animada (desenhado no renderer por cima do chão). */
export function drawWaterTile(ctx, x, y, sx, sy, season, time, mask) {
  const th = SEASON_ART[season] || SEASON_ART[0];
  const w = th.water;
  ctx.fillStyle = w[2];
  ctx.fillRect(sx, sy, T, T);
  // ondulações
  ctx.fillStyle = w[1];
  const ph = time * 0.9;
  for (let i = 0; i < 3; i++) {
    const yy = sy + 6 + i * 9;
    const off = Math.sin(ph + x * 0.7 + y * 0.45 + i * 1.7) * 4;
    ctx.fillRect(sx + 4 + off, yy, 12, 2);
    ctx.fillRect(sx + 20 - off * 0.5, yy + 3, 7, 1);
  }
  // brilho superior
  ctx.fillStyle = alpha(w[0], 0.5);
  const sh = Math.sin(ph * 1.3 + x + y) * 3;
  ctx.fillRect(sx + 10 + sh, sy + 4, 9, 1);
  ctx.fillRect(sx + 2, sy + 20 + Math.cos(ph + x) * 2, 6, 1);
  // espuma nas bordas
  ctx.fillStyle = "rgba(235,250,255,.55)";
  if (!(mask & 1)) { ctx.fillRect(sx, sy, T, 2); ctx.fillRect(sx + 3, sy + 2, T - 6, 1); }
  if (!(mask & 4)) { ctx.fillRect(sx, sy + T - 2, T, 2); ctx.fillRect(sx + 3, sy + T - 3, T - 6, 1); }
  if (!(mask & 8)) { ctx.fillRect(sx, sy, 2, T); ctx.fillRect(sx + 2, sy + 3, 1, T - 6); }
  if (!(mask & 2)) { ctx.fillRect(sx + T - 2, sy, 2, T); ctx.fillRect(sx + T - 3, sy + 3, 1, T - 6); }
}


/** Preenche a área fora do mapa com água animada (o vale é uma ilha). */
export function drawMapBorder(ctx, { sx, sy, MAP_W, MAP_H, W, H, season, time }) {
  const th = SEASON_ART[season] || SEASON_ART[0];
  const x0 = sx(0), y0 = sy(0), x1 = sx(MAP_W), y1 = sy(MAP_H);
  const deep = mix(th.water[2], "#123a52", 0.45);
  const nX = Math.max(0, Math.min(W, x1) - Math.max(0, x0));
  // mar profundo fora do mapa
  ctx.fillStyle = deep;
  if (x0 > 0) ctx.fillRect(0, 0, x0, H);
  if (x1 < W) ctx.fillRect(x1, 0, W - x1, H);
  if (y0 > 0) ctx.fillRect(Math.max(0, x0), 0, nX, y0);
  if (y1 < H) ctx.fillRect(Math.max(0, x0), y1, nX, H - y1);
  // ondas lentas no mar
  ctx.fillStyle = "rgba(150,215,240,.10)";
  const step = 26;
  for (let y = (time * 6) % step; y < H; y += step) {
    for (let x = ((time * 10) % 90) - 90; x < W; x += 90) {
      ctx.fillRect(x + (y % 52), y, 34, 2);
    }
  }
  // espuma na linha do mapa
  ctx.fillStyle = "rgba(214,240,252,.30)";
  if (x0 > 0) { ctx.fillRect(x0 - 4, 0, 4, H); }
  if (x1 < W) { ctx.fillRect(x1, 0, 4, H); }
  if (y0 > 0) { ctx.fillRect(Math.max(0, x0) - 4, y0 - 4, nX + 8, 4); }
  if (y1 < H) {
    const wob = Math.sin(time * 1.6) * 2;
    ctx.fillRect(Math.max(0, x0) - 4, y1 + wob, nX + 8, 5);
    ctx.fillStyle = "rgba(190,230,245,.55)";
    for (let x = Math.max(0, x0); x < Math.min(W, x1); x += 22) {
      ctx.fillRect(x + ((time * 8) % 22), y1 - 3, 10, 2);
    }
  }
}
