// ============================================================
//  Bichos: galinha, vaca, ovelha, gato, pássaros, borboletas,
//  abelhas e vaga-lumes. Sprites originais desenhados à mão.
// ============================================================
import { spriteFromRows, cached, mkCanvas } from "./pixel.js";
import { PIX } from "./palette.js";

const S = (rows, colors) => spriteFromRows(rows, colors, { px: PIX });

// ---------------- GALINHA ----------------
const CHICKEN_COLORS = { w: "#f8f3e6", s: "#e0d7c3", y: "#e8b33c", r: "#d1493f", o: "#e08b3a", k: "#2a211c", t: "#cbb99c" };
const CHICKEN_1 = [
  "..............",
  "....rr........",
  "...rrrr.......",
  "...kyww...tt..",
  "...ywwwwwwtt..",
  "..wwwwwwwwww..",
  ".wwwwwwwwww...",
  ".wwwwwwwwww...",
  "..wwwwwwww....",
  "...wwwwww.....",
  "....o..o......",
  "...oo..oo.....",
];
const CHICKEN_2 = [
  "..............",
  "....rr........",
  "...rrrr.......",
  "...kyww...tt..",
  "...ywwwwwwtt..",
  "..wwwwwwwwww..",
  ".wwwwwwwwww...",
  ".wwwwwwwwww...",
  "..wwwwwwww....",
  "...wwwwww.....",
  "...o....o.....",
  "..oo....oo....",
];

// ---------------- VACA ----------------
const COW_COLORS = { w: "#f6f1e6", s: "#ded6c6", b: "#8a5a3b", d: "#5f3a22", k: "#2a211c", p: "#e8a3ac", h: "#3a2a20" };
const COW_1 = [
  "....................",
  ".....bbbb...........",
  "....bbbbbb.....ww...",
  "...bbwbbbb....wwww..",
  "...b..ssss...wwwwww.",
  "..bbssssssswwwwwwww.",
  ".wwwsssssswwwwbbwww.",
  ".wwwwwwwwwwwbbbwwww.",
  ".wwbbwwwwwwwbbbwwww.",
  ".wwbbwwwwwwwwwwwwww.",
  ".wwwwwwwwwwwwwwwwww.",
  "..wwwwwwwwwwwwwwww..",
  "..ss.ss.....ss.ss...",
  "..ss.ss.....ss.ss...",
  "..hh.hh.....hh.hh...",
  "..hh.hh.....hh.hh...",
];
const COW_2 = [
  "....................",
  ".....bbbb...........",
  "....bbbbbb.....ww...",
  "...bbwbbbb....wwww..",
  "...b..ssss...wwwwww.",
  "..bbssssssswwwwwwww.",
  ".wwwsssssswwwwbbwww.",
  ".wwwwwwwwwwwbbbwwww.",
  ".wwbbwwwwwwwbbbwwww.",
  ".wwbbwwwwwwwwwwwwww.",
  ".wwwwwwwwwwwwwwwwww.",
  "..wwwwwwwwwwwwwwww..",
  "..ss.ss.....ss.ss...",
  "..hh.hh.....hh.hh...",
  "..hh.hh.....hh.hh...",
  "..ss.ss.....ss.ss...",
];

// ---------------- OVELHA ----------------
const SHEEP_COLORS = { f: "#f7f4ec", s: "#dcd6c8", k: "#2a211c", g: "#4a4038", p: "#e8a3ac" };
const SHEEP_1 = [
  "................",
  ".....ffff.......",
  "...ffffffff.....",
  "..ffffffffff....",
  "..ffkffffffg....",
  ".fffffffffgg....",
  ".ffffffffff.....",
  "..ffffffff......",
  "...ff..ff.......",
  "...g....g.......",
  "..gg....gg......",
];
const SHEEP_2 = [
  "................",
  ".....ffff.......",
  "...ffffffff.....",
  "..ffffffffff....",
  "..ffkffffffg....",
  ".fffffffffgg....",
  ".ffffffffff.....",
  "..ffffffff......",
  "...ff..ff.......",
  "..gg....gg.......",
  ".gg......gg.....",
];

// ---------------- GATO ----------------
const CAT_COLORS = { o: "#e0954a", d: "#b8712f", w: "#fff6e8", k: "#2a211c", p: "#e8a3ac" };
const CAT_1 = [
  "..............",
  "..d.......d...",
  "..do.....od...",
  "..ooooooooo...",
  ".ookooookooo..",
  ".ooooooooow...",
  ".oddoooooow...",
  "..oooooooo....",
  "..d.o..o.d....",
  ".....dd.......",
];
const CAT_2 = [
  "..............",
  "..d.......d...",
  "..do.....od...",
  "..ooooooooo...",
  ".ooooooooooo..",
  ".ooooooooow...",
  ".oddoooooow...",
  "..oooooooo....",
  "..d..o..o.d...",
  "..dd.....dd...",
];

// ---------------- PÁSSARO ----------------
const BIRD_COLORS = { b: "#6f93b8", d: "#3f6488", w: "#e8eef5", k: "#241c18", y: "#e8b33c", o: "#d98d4a" };
const BIRD_GROUND = [
  ".......",
  "...bb..",
  "..bbbb.",
  ".bkbbby",
  "..wwb..",
  "..o.o..",
];
const BIRD_FLY = [
  "d.....d",
  ".db.bd.",
  "..bbb..",
  ".bkbbby",
  "..wwb..",
  "..o.o..",
];

// ---------------- BORBOLETA ----------------
const BFLY_A = [
  "p.....p",
  "pp.p.pp",
  ".pkkp..",
  "pp.p.pp",
  "p.....p",
];
const BFLY_B = [
  ".......",
  "..p.p..",
  "..pkkp.",
  "..p.p..",
  ".......",
];

// ---------------- ABELHA ----------------
const BEE = [
  "..w.w..",
  "..yyy..",
  ".ykyky.",
  ".yyyyy.",
  "..o.o..",
];

export const CRITTERS = {
  galinha: { colors: CHICKEN_COLORS, frames: [CHICKEN_1, CHICKEN_2], speed: 0.5, w: 14, h: 12 },
  vaca: { colors: COW_COLORS, frames: [COW_1, COW_2], speed: 0.35, w: 20, h: 16 },
  ovelha: { colors: SHEEP_COLORS, frames: [SHEEP_1, SHEEP_2], speed: 0.45, w: 16, h: 11 },
};

export function critterSprites(type) {
  return cached("critter:" + type, () => {
    const def = CRITTERS[type];
    if (!def) return null;
    return { frames: def.frames.map((r) => S(r, def.colors)), w: def.w, h: def.h };
  });
}

export function catSprites() {
  return cached("critter:cat", () => ({
    frames: [S(CAT_1, CAT_COLORS), S(CAT_2, CAT_COLORS)],
    w: 14, h: 10,
  }));
}

export function birdSprites() {
  return cached("critter:bird", () => ({
    ground: S(BIRD_GROUND, BIRD_COLORS),
    fly: S(BIRD_FLY, BIRD_COLORS),
    w: 7, h: 6,
  }));
}

export function butterflySprites() {
  return cached("critter:butterfly", () => ({
    frames: [S(BFLY_A, { p: "#ffd166" }), S(BFLY_B, { p: "#ffd166" })],
    framesBlue: [S(BFLY_A, { p: "#8fc7ff" }), S(BFLY_B, { p: "#8fc7ff" })],
    framesPink: [S(BFLY_A, { p: "#ffb3d1" }), S(BFLY_B, { p: "#ffb3d1" })],
  }));
}

export function beeSprite() {
  return cached("critter:bee", () => S(BEE, { w: "#e8f4ff", y: "#e8b33c", k: "#2a211c", o: "#2a211c" }));
}

/** Peixe pulando (efeito de pesca) */
export function fishSprite() {
  return cached("critter:fish", () => S([
    "...........",
    "....bbb....",
    "...bbbbb..b",
    "..bbkbbbbbb",
    "...bbbbb..b",
    "....bbb....",
  ], { b: "#7fc6d9", k: "#2a211c" }));
}

/** Pequena nuvem de fumaça (chaminés) */
export function smokePuff() {
  return cached("smoke", () => {
    const c = mkCanvas(8, 8);
    const g = c.getContext("2d");
    g.fillStyle = "rgba(240,238,230,.55)";
    g.beginPath(); g.arc(4, 4, 3.5, 0, Math.PI * 2); g.fill();
    return c;
  });
}
