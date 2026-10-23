// ============================================================
//  Vale Aconchegante — "rig" de personagens (arte original)
//  Arte nativa 24×48 + contorno de 1px, camadas independentes.
//
//  Cada camada (base, calça, camisa, cabelo, chapéu, ferramenta)
//  é desenhada por cima do mesmo rig, então a caminhada funciona
//  e as combinações nunca brigam entre si.
//
//  Desenho: silhueta com ombro arredondado, cintura marcada,
//  braços destacados do tronco, pernas afuniladas e sapatos com
//  bico. Rosto com esclera + íris + pupila + brilho, sobrancelha,
//  nariz e boca em linhas separadas. Roupa com gola, carcela,
//  botões, punho, bolso e dobras.
// ============================================================
import { mkCanvas, cached } from "./pixel.js";

export const RIG_W = 24;
export const RIG_H = 48;
/** Escala de exibição no mapa (px de tela por pixel de arte). */
export const RIG_SCALE = 2;
/** Margem do contorno (1px de arte em cada lado). */
export const RIG_PAD = 1;
/** Altura total do sprite com contorno, em pixels de arte. */
export const RIG_OUT_H = RIG_H + 1;
export const RIG_OUT_W = RIG_W + RIG_PAD * 2;
/** Tamanho final em tela (múltiplo inteiro — sem borrão). */
export const CHAR_W = RIG_OUT_W * RIG_SCALE;
export const CHAR_H = RIG_OUT_H * RIG_SCALE;
/** Linha dos pés dentro do sprite (de cima), em px de arte. */
export const RIG_FEET_ROW = RIG_H;

const OUTLINE = "#2b1d13";
const CX = RIG_W / 2;

// ------------------------------------------------------------------
//  Utilitários
// ------------------------------------------------------------------
export function shade(hex, k) {
  if (!hex) return "#000000";
  if (hex.startsWith("rgba") || hex.startsWith("rgb")) return hex;
  const h = hex.replace("#", "");
  const n = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16));
  const f = (v) => Math.max(0, Math.min(255, Math.round(v + (k >= 0 ? (255 - v) * k : v * k))));
  return `#${[f(r), f(g), f(b)].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function px(g, x, y, w, h, col) {
  if (!col || w <= 0 || h <= 0) return;
  g.fillStyle = col;
  g.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
}

const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (t) => Math.max(0, Math.min(1, t));

// ------------------------------------------------------------------
//  Variantes: 4 silhuetas por idade
// ------------------------------------------------------------------
/**
 * `legH/torsoH/headH` definem a altura; `headW/shoulderW/waistW/hipW/armW`
 * definem a silhueta. Pé na última linha da arte (RIG_H - 1).
 */
const VARIANT_SHAPE = {
  newborn_A: { legH: 0, torsoH: 0, headH: 12, headW: 13, shoulderW: 0, waistW: 0, hipW: 0, armW: 0 },
  newborn_B: { legH: 0, torsoH: 0, headH: 12, headW: 13, shoulderW: 0, waistW: 0, hipW: 0, armW: 0 },
  newborn_C: { legH: 0, torsoH: 0, headH: 12, headW: 13, shoulderW: 0, waistW: 0, hipW: 0, armW: 0 },
  newborn_D: { legH: 0, torsoH: 0, headH: 12, headW: 13, shoulderW: 0, waistW: 0, hipW: 0, armW: 0 },

  baby_A: { legH: 6, torsoH: 6, headH: 13, headW: 13, shoulderW: 9, waistW: 8, hipW: 9, armW: 2 },
  baby_B: { legH: 5, torsoH: 6, headH: 13, headW: 12, shoulderW: 8, waistW: 7, hipW: 8, armW: 2 },
  baby_C: { legH: 6, torsoH: 7, headH: 13, headW: 13, shoulderW: 9, waistW: 8, hipW: 9, armW: 2 },
  baby_D: { legH: 5, torsoH: 6, headH: 12, headW: 11, shoulderW: 8, waistW: 7, hipW: 8, armW: 2 },

  child_A: { legH: 11, torsoH: 9, headH: 12, headW: 11, shoulderW: 10, waistW: 8, hipW: 9, armW: 2 },
  child_B: { legH: 10, torsoH: 8, headH: 12, headW: 10, shoulderW: 9, waistW: 7, hipW: 8, armW: 2 },
  child_C: { legH: 12, torsoH: 8, headH: 12, headW: 11, shoulderW: 10, waistW: 8, hipW: 9, armW: 2 },
  child_D: { legH: 10, torsoH: 8, headH: 11, headW: 10, shoulderW: 8, waistW: 7, hipW: 8, armW: 2 },

  teen_A: { legH: 14, torsoH: 14, headH: 13, headW: 12, shoulderW: 11, waistW: 8, hipW: 9, armW: 2 },
  teen_B: { legH: 13, torsoH: 13, headH: 13, headW: 11, shoulderW: 10, waistW: 8, hipW: 9, armW: 2 },
  teen_C: { legH: 13, torsoH: 15, headH: 12, headW: 11, shoulderW: 10, waistW: 8, hipW: 9, armW: 2 },
  teen_D: { legH: 12, torsoH: 13, headH: 12, headW: 10, shoulderW: 9, waistW: 7, hipW: 8, armW: 2 },

  adult_A: { legH: 15, torsoH: 16, headH: 13, headW: 13, shoulderW: 12, waistW: 9, hipW: 10, armW: 2 },
  adult_B: { legH: 15, torsoH: 15, headH: 13, headW: 12, shoulderW: 11, waistW: 8, hipW: 9, armW: 2 },
  adult_C: { legH: 16, torsoH: 16, headH: 13, headW: 12, shoulderW: 11, waistW: 8, hipW: 9, armW: 2 },
  adult_D: { legH: 14, torsoH: 15, headH: 13, headW: 14, shoulderW: 13, waistW: 11, hipW: 12, armW: 3 },

  elder_A: { legH: 13, torsoH: 15, headH: 13, headW: 13, shoulderW: 12, waistW: 9, hipW: 10, armW: 2, stoop: 1 },
  elder_B: { legH: 14, torsoH: 14, headH: 12, headW: 12, shoulderW: 11, waistW: 9, hipW: 10, armW: 2 },
  elder_C: { legH: 13, torsoH: 15, headH: 14, headW: 13, shoulderW: 12, waistW: 10, hipW: 11, armW: 2, stoop: 1 },
  elder_D: { legH: 14, torsoH: 15, headH: 12, headW: 11, shoulderW: 10, waistW: 8, hipW: 9, armW: 2 },
};

export const BODY_VARIANTS = {
  newborn_A: { age: "newborn", variant: "A", name: "Recém-nascido — manta creme", desc: "Cabeça e manta, sem pernas" },
  newborn_B: { age: "newborn", variant: "B", name: "Recém-nascido — touca", desc: "Touca de tricô e manta clara" },
  newborn_C: { age: "newborn", variant: "C", name: "Recém-nascido — manta xadrez", desc: "Manta quadriculada" },
  newborn_D: { age: "newborn", variant: "D", name: "Recém-nascido — manta azul", desc: "Manta azulada" },
  baby_A: { age: "baby", variant: "A", name: "Bebê — encorpado", desc: "Cabeça grande, corpo curto" },
  baby_B: { age: "baby", variant: "B", name: "Bebê — franzino", desc: "Silhueta estreita" },
  baby_C: { age: "baby", variant: "C", name: "Bebê — bochechudo", desc: "Bochechas e cabelo ralo" },
  baby_D: { age: "baby", variant: "D", name: "Bebê — pequenino", desc: "Cabeça arredondada, ombros baixos" },
  child_A: { age: "child", variant: "A", name: "Criança — robusta", desc: "Ombros retos, pernas curtas" },
  child_B: { age: "child", variant: "B", name: "Criança — esguia", desc: "Silhueta fina, pernas longas" },
  child_C: { age: "child", variant: "C", name: "Criança — alta", desc: "Pernas compridas, tronco curto" },
  child_D: { age: "child", variant: "D", name: "Criança — pequena", desc: "Cabeça grande, corpo miúdo" },
  teen_A: { age: "teen", variant: "A", name: "Adolescente — atlético", desc: "Ombros largos" },
  teen_B: { age: "teen", variant: "B", name: "Adolescente — esguio", desc: "Tronco fino, pernas longas" },
  teen_C: { age: "teen", variant: "C", name: "Adolescente — alto", desc: "Tronco longo, ombros médios" },
  teen_D: { age: "teen", variant: "D", name: "Adolescente — franzino", desc: "Silhueta pequena" },
  adult_A: { age: "adult", variant: "A", name: "Adulto — encorpado", desc: "Tronco cheio, ombros largos" },
  adult_B: { age: "adult", variant: "B", name: "Adulto — esguio", desc: "Cintura marcada, pernas longas" },
  adult_C: { age: "adult", variant: "C", name: "Adulto — alto", desc: "Pernas compridas, ombros retos" },
  adult_D: { age: "adult", variant: "D", name: "Adulto — forte", desc: "Tórax amplo, cintura cheia" },
  elder_A: { age: "elder", variant: "A", name: "Idoso — curvado", desc: "Costas levemente curvadas" },
  elder_B: { age: "elder", variant: "B", name: "Idoso — ereto", desc: "Postura firme, cabelo grisalho" },
  elder_C: { age: "elder", variant: "C", name: "Idoso — barbudo", desc: "Barba cheia, ombros largos" },
  elder_D: { age: "elder", variant: "D", name: "Idoso — miúdo", desc: "Baixo, cabelo curto" },
};

export const BODY_VARIANT_LIST = Object.entries(BODY_VARIANTS).map(([id, v]) => ({ id, ...v }));

/** Converte id antigo (`adult_masc_A`) no id do rig (`adult_A`). */
export function rigBodyId(id) {
  if (!id) return "adult_A";
  if (BODY_VARIANTS[id]) return id;
  const age = ["adult", "elder", "teen", "child", "baby", "newborn"].find((a) => id.startsWith(a));
  if (!age) return "adult_A";
  const v = /_([ABCD])$/.exec(id)?.[1] || "A";
  return `${age}_${v}`;
}

export function ageOfBody(id) {
  return (BODY_VARIANTS[rigBodyId(id)] || BODY_VARIANTS.adult_A).age;
}

export function metricsFor(bodyId = "adult_A") {
  const def = BODY_VARIANTS[rigBodyId(bodyId)] || BODY_VARIANTS.adult_A;
  const shape = VARIANT_SHAPE[rigBodyId(bodyId)] || VARIANT_SHAPE.adult_A;
  return {
    age: def.age,
    variant: def.variant,
    ...shape,
    arm: shape.armW,
    stoop: shape.stoop || 0,
    bundle: def.age === "newborn",
  };
}

function limbs(m) {
  const feet = RIG_H - 1;
  const hip = feet - m.legH;
  const shoulder = hip - m.torsoH + 1;
  const headTop = shoulder - m.headH - 1;
  return { feet, hip, shoulder, headTop };
}

/** Largura do tronco em cada linha (ombro arredondado → cintura → quadril). */
function torsoW(m, i) {
  const n = Math.max(1, m.torsoH - 1);
  const t = i / n;
  let w = t < 0.55
    ? lerp(m.shoulderW, m.waistW, t / 0.55)
    : lerp(m.waistW, m.hipW, (t - 0.55) / 0.45);
  w = Math.round(w);
  if (i === 0) w -= 2;
  else if (i === 1) w -= 1;
  return Math.max(4, w);
}

/** Silhueta única: tronco + braços. Evita qualquer fresta entre eles. */
function silRow(m, i) {
  const tw = torsoW(m, i);
  const n = Math.max(1, m.torsoH - 1);
  const t = i / n;
  const armW = m.armW ? Math.max(2, m.armW - (i === 0 ? 1 : 0)) : 0;
  const outerW = tw + armW * 2;
  return {
    tw,
    tx: CX - Math.floor(tw / 2),
    ow: outerW,
    ox: CX - Math.floor(outerW / 2),
    armW,
  };
}

/** Braços colam na borda do tronco em cada linha (não deixam fresta). */
function armSpans(m, row) {
  const r = silRow(m, row);
  if (!r.armW) return { axL: r.tx, axR: r.tx + r.tw, armW: 0 };
  return { axL: r.tx - r.armW, axR: r.tx + r.tw, armW: r.armW };
}

function torsoRow(m, i) {
  const r = silRow(m, i);
  return { x: r.tx, w: r.tw };
}

// ------------------------------------------------------------------
//  Recém-nascido (manta + rosto)
// ------------------------------------------------------------------
function drawNewborn(g, m, dir, skin, opts) {
  const up = dir === "up";
  const skinDark = shade(skin, -0.16);
  const palettes = {
    A: { blanket: "#f2e4cb", hat: null },
    B: { blanket: "#dbe9df", hat: "#dbe9df" },
    C: { blanket: "#e8d3c0", hat: null },
    D: { blanket: "#cfdcea", hat: null },
  };
  const pal = palettes[m.variant] || palettes.A;
  const blanket = opts.blanket || pal.blanket;
  const bDark = shade(blanket, -0.18);
  const bLight = shade(blanket, 0.12);
  const hair = opts.hair || "#8a5a34";

  const hw = 13, hh = 11;
  const hx = CX - Math.floor(hw / 2);
  const hy = 25;

  // cabeça arredondada
  for (let i = 0; i < hh; i++) {
    let inset = 0;
    if (i === 0) inset = 3; else if (i === 1) inset = 1;
    else if (i === hh - 1) inset = 3; else if (i === hh - 2) inset = 2;
    const w = hw - inset * 2;
    const x = hx + inset;
    px(g, x, hy + i, w, 1, skin);
    px(g, x, hy + i, 1, 1, i > 1 ? skinDark : skin);
    px(g, x + w - 1, hy + i, 1, 1, shade(skin, -0.07));
  }
  px(g, hx, hy + 4, 1, 2, skinDark);        // orelhas
  px(g, hx + hw - 1, hy + 4, 1, 2, shade(skin, -0.1));

  // cabelo/touca
  if (pal.hat) {
    px(g, hx, hy - 1, hw, 3, blanket);
    px(g, hx + 1, hy - 2, hw - 2, 1, bLight);
    px(g, hx + Math.floor(hw / 2), hy - 3, 2, 1, bLight);
    px(g, hx, hy + 1, hw, 1, bDark);
  } else {
    px(g, hx + 2, hy - 1, hw - 4, 2, hair);
    px(g, hx + 1, hy, 1, 2, hair);
    px(g, hx + hw - 2, hy, 1, 2, hair);
    px(g, hx + 3, hy - 1, 3, 1, shade(hair, 0.2));
  }

  if (!up) {
    const ey = hy + 5;
    // olhos de bebê: 2x2 escuro com 1px de brilho
    px(g, hx + 3, ey, 2, 2, "#3b2b21");
    px(g, hx + hw - 5, ey, 2, 2, "#3b2b21");
    px(g, hx + 3, ey, 1, 1, "#fff6e6");
    px(g, hx + hw - 5, ey, 1, 1, "#fff6e6");
    px(g, hx + 1, ey + 1, 1, 1, "rgba(226,120,110,.32)");
    px(g, hx + hw - 2, ey + 1, 1, 1, "rgba(226,120,110,.32)");
    px(g, CX - 1, ey + 3, 2, 1, shade(skin, -0.3));
  } else {
    px(g, hx + 1, hy, hw - 2, 3, hair);
  }

  // manta-casulo
  const top = 33;
  px(g, CX - 4, top, 8, 2, blanket);
  px(g, CX - 5, top + 2, 10, 3, blanket);
  px(g, CX - 6, top + 5, 12, 6, blanket);
  px(g, CX - 5, top + 11, 10, 3, blanket);
  px(g, CX - 4, top + 14, 8, 1, bDark);
  px(g, CX - 5, top + 2, 2, 13, bLight);
  px(g, CX + 4, top + 3, 2, 12, bDark);
  px(g, CX - 1, top + 4, 1, 10, bDark);
  px(g, CX - 3, top + 13, 6, 1, bLight);
  px(g, CX - 4, top - 1, 8, 2, shade(blanket, 0.14));
  px(g, CX - 3, top - 1, 6, 1, bLight);
  if (m.variant === "C") {
    for (let y = top + 2; y < top + 14; y += 3) px(g, CX - 6, y, 12, 1, bDark);
    for (let x = CX - 6; x < CX + 6; x += 3) px(g, x, top + 2, 1, 12, bDark);
  }
  px(g, CX - 7, top + 8, 1, 2, skin);
  px(g, CX + 6, top + 8, 1, 2, skinDark);
}

/**
 * Olho 3×2 no estilo da referência: esclera branca em cima e, na linha de
 * baixo, íris colorida e pupila escura.
 */
function drawEyePx(g, x, y, w, h, iris, eyeColor) {
  const white = "#fbf6ea";
  if (w >= 3) {
    px(g, x, y, w, 1, white);
    px(g, x, y + 1, 1, 1, iris);
    px(g, x + 1, y + 1, 1, 1, eyeColor);
    px(g, x + 2, y + 1, 1, 1, shade(white, -0.1));
    if (h > 2) px(g, x, y + 2, w, 1, white);
  } else {
    px(g, x, y, w, 1, white);
    px(g, x + 1, y, 1, 1, iris);
    px(g, x, y + 1, 1, 1, eyeColor);
    px(g, x + 1, y + 1, 1, 1, white);
  }
}

// ------------------------------------------------------------------
//  Corpo base (pele + rosto)
// ------------------------------------------------------------------
export function drawBaseBody(g, m, dir, frame, skin, skinShade, opts = {}) {
  if (m.bundle) return drawNewborn(g, m, dir, skin, opts);
  const L = limbs(m);
  const side = dir === "left" || dir === "right";
  const up = dir === "up";
  const bob = frame === 1 || frame === 3 ? -1 : 0;
  const sd = skinShade || shade(skin, -0.18);
  const sl = shade(skin, 0.09);
  const hipY = L.hip + bob;
  const legLen = L.feet - L.hip;

  // ---- pernas (afinam no tornozelo) ----
  const legW = Math.max(3, Math.floor((m.hipW - 2) / 2));
  const gap = Math.max(1, m.hipW - legW * 2);
  const x0 = CX - Math.floor((legW * 2 + gap) / 2);
  const liftL = frame === 3 ? 1 : 0;
  const liftR = frame === 1 ? 1 : 0;
  const swing = side ? (frame === 1 ? 1 : frame === 3 ? -1 : 0) : 0;
  for (let i = 0; i < legLen - liftL; i++) {
    const taper = i > legLen * 0.62 ? 1 : 0;
    px(g, x0 - swing + taper, hipY + i, legW - taper, 1, sd);
  }
  for (let i = 0; i < legLen - liftR; i++) {
    const taper = i > legLen * 0.62 ? 1 : 0;
    px(g, x0 + legW + gap + swing + taper, hipY + i, legW - taper, 1, skin);
  }
  // joelho e tornozelo
  const knee = hipY + Math.round(legLen * 0.5);
  px(g, x0 + 1, knee, legW - 1, 1, shade(sd, -0.06));
  px(g, x0 + legW + gap + 1, knee, legW - 1, 1, shade(skin, -0.1));

  // ---- tronco (trapézio) ----
  const y0 = L.shoulder + bob;
  for (let i = 0; i < m.torsoH; i++) {
    const w = torsoW(m, i);
    const x = CX - Math.floor(w / 2);
    px(g, x, y0 + i, w, 1, skin);
    px(g, x, y0 + i, 1, 1, i < 2 ? sl : sd);
    px(g, x + w - 1, y0 + i, 1, 1, shade(skin, -0.08));
  }

  // ---- pescoço ----
  px(g, CX - 1, y0 - 1, 2, 1, sd);
  px(g, CX - 1, y0, 2, 1, shade(skin, -0.24));

  // ---- braços (parte da mesma silhueta; a manga cobre por cima) ----
  if (m.armW > 0) {
    for (let i = 0; i < m.torsoH; i++) {
      const r = silRow(m, i);
      px(g, r.tx - r.armW, y0 + i, r.armW, 1, sd);
      px(g, r.tx + r.tw, y0 + i, r.armW, 1, shade(skin, -0.04));
    }
  }

  // ---- cabeça ----
  const hw = m.headW;
  const hh = m.headH;
  const hx = CX - Math.floor(hw / 2);
  const hy = L.headTop + bob + (m.stoop ? 1 : 0);
  // perfil de crânio: 3 degraus no topo e 3 no queixo
  const insets = [];
  for (let i = 0; i < hh; i++) {
    const edge = Math.min(i, hh - 1 - i);
    // topo e queixo arredondados em 3 degraus; o queixo ganha um degrau extra
    const bottom = hh - 1 - i < i;
    insets.push(edge === 0 ? 3 : edge === 1 ? 2 : edge === 2 ? (bottom ? 2 : 1) : 0);
  }
  for (let i = 0; i < hh; i++) {
    const inset = insets[i];
    const w = hw - inset * 2;
    const x = hx + inset;
    px(g, x, hy + i, w, 1, skin);
    px(g, x, hy + i, 1, 1, i > 2 ? sd : sl);
    px(g, x + w - 1, hy + i, 1, 1, shade(skin, -0.1));
    if (i === 2) px(g, x + 2, hy + i, Math.max(1, w - 5), 1, sl);
  }
  // orelhas
  if (!up) {
    px(g, hx, hy + 5, 1, 2, sd);
    px(g, hx + hw - 1, hy + 5, 1, 2, shade(skin, -0.14));
  }

  // ---- rosto ----
  const eyeH = hh >= 13 ? 3 : 2;
  const eyeW = hw >= 12 ? 3 : 2;
  const eyeGap = hw >= 14 ? 3 : 2;
  const eyeY = hy + Math.max(3, Math.round(hh * 0.36));
  const eye = opts.eye || "#3b2b21";
  const iris = shade(opts.eyeLight || shade(eye, 0.34), -0.18);
  const brow = shade(opts.hair || "#4a3020", -0.04);
  const mouth = shade(skin, -0.52);
  const eyeL = CX - Math.floor((eyeW * 2 + eyeGap) / 2);
  const eyeR = eyeL + eyeW + eyeGap;
  if (!up) {
    if (side) {
      // perfil: um olho, virado para o lado
      const ex = dir === "right" ? hx + hw - eyeW - 1 : hx + 1;
      drawEyePx(g, ex, eyeY, eyeW, eyeH, iris, eye);
      px(g, dir === "right" ? hx + hw - 1 : hx, eyeY - 1, 1, eyeH + 1, sd);
      px(g, ex, eyeY - 2, eyeW + 1, 1, brow);
      px(g, dir === "right" ? hx + hw - eyeW - 2 : hx + 2, eyeY + eyeH + 2, 2, 1, mouth);
    } else {
      drawEyePx(g, eyeL, eyeY, eyeW, eyeH, iris, eye);
      drawEyePx(g, eyeR, eyeY, eyeW, eyeH, iris, eye);
      // sobrancelhas de 2px, 1px acima da pálpebra
      px(g, eyeL, eyeY - 2, Math.max(2, eyeW), 1, brow);
      px(g, eyeR, eyeY - 2, Math.max(2, eyeW), 1, brow);
      // nariz de 1px
      px(g, CX - 1, eyeY + eyeH + 1, 1, 1, shade(skin, -0.13));
      // boca de 2px, discreta
      const mY = eyeY + eyeH + 2;
      px(g, CX - 1, mY, 2, 1, mouth);
      // bochechas suaves
      px(g, eyeL - 1, eyeY + eyeH, 1, 1, "rgba(228,128,112,.2)");
      px(g, eyeR + eyeW, eyeY + eyeH, 1, 1, "rgba(228,128,112,.2)");
    }
  } else {
    px(g, hx + 1, hy + hh - 4, hw - 2, 4, sd);
  }

  // ---- barba ----
  if (opts.beard && !up) {
    const beard = opts.hair || "#4a3020";
    const bD = shade(beard, -0.26);
    const bL = shade(beard, 0.16);
    const by = eyeY + 4;
    // bigode
    px(g, CX - 2, by, 4, 1, beard);
    px(g, CX - 2, by, 2, 1, bL);
    px(g, CX - 3, by + 1, 1, 1, bD);
    px(g, CX + 2, by + 1, 1, 1, bD);
    // mandíbula
    for (let i = 0; i < 3; i++) {
      px(g, hx + (i === 0 ? 0 : 1), by + 1 + i, 1, 1, i === 2 ? bD : beard);
      px(g, hx + hw - 1 - (i === 0 ? 0 : 1), by + 1 + i, 1, 1, bD);
    }
    // queixo
    px(g, hx + 1, hy + hh - 2, hw - 2, 1, beard);
    px(g, hx + 1, hy + hh - 1, hw - 2, 1, beard);
    px(g, hx + 2, hy + hh - 1, Math.max(2, hw - 6), 1, bL);
    px(g, hx + 1, hy + hh - 1, 1, 1, bD);
    px(g, hx + hw - 2, hy + hh - 1, 1, 1, bD);
    // boca por cima da barba
    px(g, CX - 1, by + 2, 2, 1, shade(skin, -0.42));
  }

  return { ...L, hx, hy, hw, hh, tx: CX - Math.floor(m.shoulderW / 2), tw: m.shoulderW };
}

// ------------------------------------------------------------------
//  Calça / saia
// ------------------------------------------------------------------
export function drawPants(g, m, dir, frame, pants, skin, style = "long", opts = {}) {
  if (m.bundle) return;
  const L = limbs(m);
  const side = dir === "left" || dir === "right";
  const bob = frame === 1 || frame === 3 ? -1 : 0;
  const hipY = L.hip + bob;
  const legLen = L.feet - L.hip;
  const dark = shade(pants, -0.22);
  const light = shade(pants, 0.16);
  const mid = shade(pants, -0.1);
  const shoe = opts.shoe || "#4a3620";
  const shoeD = opts.shoeDark || shade(shoe, -0.42);
  const shoeL = opts.shoeLight || shade(shoe, 0.22);
  const legW = Math.max(3, Math.floor((m.hipW - 2) / 2));
  const gap = Math.max(1, m.hipW - legW * 2);
  const x0 = CX - Math.floor((legW * 2 + gap) / 2);
  const liftL = frame === 3 ? 1 : 0;
  const liftR = frame === 1 ? 1 : 0;
  const swing = side ? (frame === 1 ? 1 : frame === 3 ? -1 : 0) : 0;

  if (style === "skirt") {
    const top = hipY - 3;
    const h = Math.max(6, Math.round(legLen * 0.72));
    for (let i = 0; i < h; i++) {
      const ww = m.hipW + 1 + Math.floor((i / h) * 5);
      const x = CX - Math.floor(ww / 2);
      px(g, x, top + i, ww, 1, i === h - 1 ? dark : i === 0 ? light : pants);
      // pregas
      if (i > 1) {
        for (let k = 1; k < ww - 1; k += 4) px(g, x + k, top + i, 1, 1, mid);
      }
      px(g, x, top + i, 1, 1, light);
      px(g, x + ww - 1, top + i, 1, 1, dark);
    }
    // cintura
    px(g, CX - Math.floor((m.hipW + 1) / 2), top - 1, m.hipW + 1, 2, shade(pants, -0.3));
    px(g, CX - 1, top - 1, 2, 1, "#c9a24a");
    // pernas e sapatos
    const below = top + h;
    for (const [sxx, lift, back] of [[x0 - swing, liftL, true], [x0 + legW + gap + swing, liftR, false]]) {
      const bare = Math.max(0, L.feet - 2 - below - lift);
      if (bare > 0) px(g, sxx, below, legW - 1, bare, back ? shade(skin, -0.12) : skin);
      const by = L.feet - 2 - lift;
      px(g, sxx, by, legW, 2, shoe);
      px(g, sxx, by, legW - 1, 1, shoeL);
      px(g, sxx, by + 1, legW, 1, shoeD);
      if (!back) px(g, sxx + legW - 1, by + 1, 1, 1, shoe);
    }
    return;
  }

  // ---- cintura + cinto ----
  const waistY = hipY - 2;
  for (let i = 0; i < 2; i++) {
    const w = m.hipW - (i === 0 ? 1 : 0);
    px(g, CX - Math.floor(w / 2), waistY + i, w, 1, i === 0 ? shade(pants, -0.34) : shade(pants, -0.2));
  }
  // fivela de 2x2 com brilho
  px(g, CX - 1, waistY, 2, 2, "#e8c86a");
  px(g, CX - 1, waistY, 1, 1, "#fbf0b8");
  px(g, CX, waistY + 1, 1, 1, "#a8862e");
  // passantes
  px(g, CX - Math.floor(m.hipW / 2) + 2, waistY, 1, 2, shade(pants, -0.5));
  px(g, CX + Math.floor(m.hipW / 2) - 3, waistY, 1, 2, shade(pants, -0.5));

  // ---- pernas ----
  const lenPx = legLen - 1;
  const kneeY = hipY + Math.round(lenPx * 0.52);
  const shorts = style === "shorts";
  const legLenPx = shorts ? Math.max(5, Math.round(lenPx * 0.42)) : lenPx;
  for (const [sxx, lift, back] of [[x0 - swing, liftL, true], [x0 + legW + gap + swing, liftR, false]]) {
    const base = back ? mid : pants;
    const edgeL = back ? shade(pants, -0.26) : shade(pants, -0.02);
    const edgeR = back ? dark : shade(pants, -0.22);
    for (let i = 0; i < legLenPx - lift; i++) {
      const taper = i > legLenPx * 0.68 ? 1 : 0;
      const w = legW - taper;
      const x = sxx + (back ? 0 : taper);
      px(g, x, hipY + i, w, 1, base);
      px(g, x, hipY + i, 1, 1, edgeL);
      if (w > 3) px(g, x + w - 1, hipY + i, 1, 1, edgeR);
    }
    if (!shorts) px(g, sxx + 1, kneeY, legW - 2, 1, shade(pants, back ? -0.28 : -0.18));
    // bolso dianteiro (traço curto no quadril)
    if (!back && !shorts) {
      px(g, sxx + legW - 2, hipY + 1, 1, 3, shade(pants, -0.3));
      px(g, sxx + legW - 2, hipY + 1, 1, 1, shade(pants, 0.12));
    }
    const cuffY = hipY + legLenPx - lift - 1;
    px(g, sxx, cuffY, legW, 1, back ? shade(pants, -0.3) : shade(pants, 0.12));
    px(g, sxx, cuffY + 1, legW, 1, back ? shade(pants, -0.38) : shade(pants, -0.2));
    if (shorts) {
      const bareTop = hipY + legLenPx - lift;
      const bare = Math.max(0, L.feet - 2 - bareTop);
      if (bare > 0) px(g, sxx, bareTop, legW - 1, bare, back ? shade(skin, -0.12) : skin);
    }
  }
  // vão entre as pernas: sombra no quadril e contorno só abaixo do joelho
  const gapH = Math.min(lenPx, L.feet - hipY);
  px(g, x0 + legW, hipY, Math.max(1, gap), gapH, shade(pants, -0.4));
  px(g, x0 + legW + Math.floor(gap / 2), hipY, 1, gapH, OUTLINE);
  px(g, x0 + legW - 1, hipY, 1, gapH, shade(pants, -0.26));

  // ---- sapatos / botas ----
  for (const [sxx, lift, back] of [[x0 - swing, liftL, true], [x0 + legW + gap + swing, liftR, false]]) {
    const by = L.feet - 2 - lift;
    const boot = m.age === "adult" || m.age === "elder";
    const bh = boot ? 3 : 2;
    px(g, sxx, by - (boot ? 1 : 0), legW, bh - (boot ? 0 : 1) + 1, shoe);
    px(g, sxx, by - (boot ? 1 : 0), legW - (back ? 1 : 0), 1, shoeL);
    px(g, sxx, by + 1, legW, 1, shoeD);
    if (!back) {
      // bico
      px(g, sxx + legW, by + 1, 1, 1, shoe);
      px(g, sxx + legW, by + 1, 1, 1, shoeD);
    }
    if (boot) px(g, sxx, by - 1, legW, 1, shade(shoe, -0.14));
  }
}

// ------------------------------------------------------------------
//  Camisa
// ------------------------------------------------------------------
export function drawShirt(g, m, dir, frame, shirt, shirtDark, design = "solid", opts = {}) {
  if (m.bundle) return;
  const L = limbs(m);
  const side = dir === "left" || dir === "right";
  const bob = frame === 1 || frame === 3 ? -1 : 0;
  const y0 = L.shoulder + bob;
  const h = m.torsoH;
  const light = shade(shirt, 0.16);
  const dark = shirtDark || shade(shirt, -0.24);
  const mid = shade(shirt, -0.1);
  const sleeve = Math.max(4, h - 2);

  // ---- camisa inteira (tronco + mangas) numa peça só ----
  for (let i = 0; i < h; i++) {
    const r = silRow(m, i);
    px(g, r.ox, y0 + i, r.ow, 1, shirt);
    // luz e sombra nas bordas (ombro iluminado, lateral na sombra)
    px(g, r.ox, y0 + i, 1, 1, i < 2 ? light : mid);
    if (r.ow > 4) px(g, r.ox + 1, y0 + i, 1, 1, i < 2 ? shade(shirt, 0.1) : light);
    px(g, r.ox + r.ow - 1, y0 + i, 1, 1, i < 2 ? shade(shirt, -0.14) : dark);
    if (r.ow > 4) px(g, r.ox + r.ow - 2, y0 + i, 1, 1, mid);
    // barra da camisa
    if (i === h - 1) px(g, r.ox + 1, y0 + i, r.ow - 2, 1, shade(shirt, -0.2));
    if (i === h - 2) px(g, r.ox + 1, y0 + i, r.ow - 2, 1, shade(shirt, 0.06));
    if (r.armW) {
      // braço esquerdo: lado de fora na luz, lado de dentro na sombra
      px(g, r.tx - r.armW, y0 + i, r.armW, 1, i < 2 ? shade(shirt, -0.1) : shade(shirt, -0.04));
      px(g, r.tx - r.armW, y0 + i, 1, 1, i < 2 ? mid : light);
      // costura de junção com o tronco (é o que faz o braço aparecer)
      px(g, r.tx - 1, y0 + i, 1, 1, shade(shirt, -0.32));
      px(g, r.tx + r.tw, y0 + i, 1, 1, shade(shirt, -0.36));
      // braço direito: lado de fora na sombra
      px(g, r.tx + r.tw + 1, y0 + i, Math.max(0, r.armW - 1), 1, shade(shirt, -0.16));
    }
  }

  // ---- costura do ombro ----
  if (!side) {
    px(g, CX - Math.floor(m.shoulderW / 2) + 2, y0 + 1, m.shoulderW - 4, 1, shade(shirt, -0.16));
    px(g, CX - Math.floor(m.shoulderW / 2) + 2, y0 + 2, m.shoulderW - 4, 1, shade(shirt, 0.1));
  }

  // ---- punho da manga (2 linhas contrastantes) ----
  if (m.armW > 0) {
    const rp = silRow(m, Math.min(h - 1, sleeve));
    px(g, rp.tx - rp.armW, y0 + sleeve, rp.armW + 1, 1, shade(shirt, -0.34));
    px(g, rp.tx + rp.tw - 1, y0 + sleeve, rp.armW + 1, 1, shade(shirt, -0.38));
    px(g, rp.tx - rp.armW, y0 + sleeve - 1, rp.armW, 1, shade(shirt, -0.16));
    px(g, rp.tx + rp.tw, y0 + sleeve - 1, rp.armW, 1, shade(shirt, -0.2));
  }

  // ---- gola ----
  const cw = Math.max(3, Math.round(m.shoulderW * 0.32));
  const collar = opts.collar || "v";
  if (!side) {
    const skinD = shade(opts.skin || "#e8b98c", -0.24);
    if (collar === "round") {
      // gola redonda: arco de 1px com sombra interna
      px(g, CX - cw, y0, cw * 2, 1, light);
      px(g, CX - cw + 1, y0 + 1, cw * 2 - 2, 1, shade(shirt, -0.3));
      px(g, CX - cw + 2, y0 + 1, cw * 2 - 4, 1, skinD);
      px(g, CX - cw, y0 + 1, 1, 2, shade(shirt, -0.2));
      px(g, CX + cw - 1, y0 + 1, 1, 2, dark);
    } else if (collar === "button") {
      // duas abas retas
      px(g, CX - cw, y0, cw, 1, light);
      px(g, CX + 1, y0, cw, 1, shade(shirt, -0.18));
      px(g, CX - cw, y0 + 1, cw, 1, shade(shirt, -0.1));
      px(g, CX + 1, y0 + 1, cw, 1, dark);
      px(g, CX - cw + 1, y0 + 1, 1, 1, light);
      px(g, CX + cw - 1, y0 + 1, 1, 1, mid);
      px(g, CX, y0 + 1, 1, 1, skinD);
    } else {
      // V aberto com pele no decote
      px(g, CX - cw, y0, cw, 1, light);
      px(g, CX + 1, y0, cw, 1, shade(shirt, -0.16));
      px(g, CX - 1, y0 + 1, 1, 1, light);
      px(g, CX, y0 + 1, 1, 1, skinD);
      px(g, CX + 1, y0 + 1, 1, 1, dark);
      px(g, CX - 2, y0 + 2, 1, 1, light);
      px(g, CX + 2, y0 + 2, 1, 1, shade(shirt, -0.2));
      px(g, CX - 1, y0 + 2, 2, 1, skinD);
    }
    // abas da gola, abertas em V (não formam "X" no peito)
    px(g, CX - 2, y0 + 1, 1, 2, light);
    px(g, CX + 2, y0 + 1, 1, 2, shade(shirt, -0.12));
    // carcela + botões
    px(g, CX, y0 + 2, 1, h - 3, mid);
    for (const by of [4, Math.round(h * 0.55), h - 3]) {
      px(g, CX, y0 + by, 1, 1, "#f0e0b4");
      px(g, CX, y0 + by + 1, 1, 1, "#bfa978");
    }
    // bolso do peito com aba
    if (h > 9) {
      const px0 = CX - Math.round(m.shoulderW * 0.34);
      px(g, px0, y0 + 4, 3, 1, shade(shirt, -0.16));
      px(g, px0, y0 + 5, 1, 2, shade(shirt, -0.16));
      px(g, px0 + 2, y0 + 5, 1, 2, shade(shirt, -0.24));
      px(g, px0, y0 + 6, 3, 1, shade(shirt, -0.28));
    }
  }

  // ---- estampas ----
  switch (design) {
    case "plaid": {
      // tartan ancorado no centro (se seguir a largura da linha, o padrão dança)
      const cell = 3;
      const midTone = shade(shirt, -0.12);
      const hot = shade(shirt, -0.26);
      const hi = shade(shirt, 0.12);
      for (let i = 1; i < h - 1; i++) {
        const w = torsoW(m, i);
        const x = CX - Math.floor(w / 2);
        for (let dx = -Math.floor(w / 2) + 1; dx <= Math.ceil(w / 2) - 2; dx++) {
          const cx = (((dx % cell) + cell) % cell) < 1;
          const cy = i % cell < 1;
          const tone = cx && cy ? hot : cx || cy ? midTone : shirt;
          px(g, CX + dx, y0 + i, 1, 1, tone);
          if (cx && !cy) px(g, CX + dx, y0 + i, 1, 1, hi);
        }
      }
      break;
    }
    case "striped": {
      for (let i = 1; i < h - 1; i += 3) {
        const w = torsoW(m, i);
        px(g, CX - Math.floor(w / 2) + 1, y0 + i, w - 2, 1, light);
      }
      break;
    }
    case "floral": {
      const spots = [[-0.3, 0.22], [0.25, 0.34], [-0.18, 0.55], [0.3, 0.68], [-0.05, 0.8]];
      for (const [fx, fy] of spots) {
        const x = Math.round(CX + fx * m.shoulderW);
        const y = Math.round(y0 + fy * h);
        px(g, x, y, 1, 1, "#fff4dc");
        px(g, x + 1, y, 1, 1, "#ffd166");
        px(g, x, y + 1, 1, 1, "#e8a13c");
      }
      break;
    }
    case "bow": {
      px(g, CX - 2, y0 + 1, 4, 1, "#ffffff");
      px(g, CX - 2, y0 + 2, 1, 1, "#c0505f");
      px(g, CX + 1, y0 + 2, 1, 1, "#c0505f");
      px(g, CX, y0 + 2, 1, 1, "#a33c4c");
      px(g, CX - 3, y0 + 2, 1, 1, "#e88a9a");
      px(g, CX + 2, y0 + 2, 1, 1, "#e88a9a");
      break;
    }
    case "sweater": {
      // gola e punhos canelados + ponto trançado discreto
      px(g, CX - cw, y0, cw * 2, 1, light);
      for (let i = 3; i < h - 2; i += 4) {
        const w = torsoW(m, i);
        const x = CX - Math.floor(w / 2);
        for (let k = 3; k < w - 3; k += 3) {
          px(g, x + k, y0 + i, 1, 1, shade(shirt, 0.08));
          px(g, x + k + 1, y0 + i + 1, 1, 1, shade(shirt, -0.1));
        }
      }
      const wb = torsoW(m, h - 1);
      px(g, CX - Math.floor(wb / 2), y0 + h - 2, wb, 1, shade(shirt, -0.14));
      break;
    }
    case "hoodie": {
      // capuz atrás do pescoço + cordões + bolso canguru
      px(g, CX - cw - 1, y0, cw * 2 + 2, 1, dark);
      px(g, CX - cw, y0 + 1, cw * 2, 1, mid);
      px(g, CX - 1, y0 + 1, 1, 4, "#f2e6c8");
      px(g, CX + 2, y0 + 1, 1, 3, "#e0d2ae");
      const pw = Math.max(4, m.shoulderW - 6);
      px(g, CX - Math.floor(pw / 2), y0 + h - 5, pw, 1, mid);
      px(g, CX - Math.floor(pw / 2), y0 + h - 4, 1, 2, mid);
      px(g, CX + Math.ceil(pw / 2) - 1, y0 + h - 4, 1, 2, mid);
      break;
    }
    case "overalls": {
      const under = opts.undershirt || "#f3e8d3";
      const uD = shade(under, -0.12);
      // camiseta por baixo (ombros, mangas e peito)
      if (m.armW > 0) {
        for (let i = 0; i < sleeve; i++) {
          const sp = armSpans(m, Math.min(i + 1, h - 1));
          const w = Math.max(2, sp.armW - (i > sleeve * 0.75 ? 1 : 0));
          px(g, sp.axL + (sp.armW - w), y0 + i, w, 1, under);
          px(g, sp.axR, y0 + i, w, 1, uD);
        }
      }
      for (let i = 0; i < 3; i++) {
        const w = torsoW(m, i);
        px(g, CX - Math.floor(w / 2), y0 + i, w, 1, i === 0 ? shade(under, 0.06) : under);
      }
      // peitilho
      const bibY = y0 + 3;
      for (let i = 3; i < h; i++) {
        const w = torsoW(m, i);
        px(g, CX - Math.floor(w / 2) + 1, y0 + i, w - 2, 1, design === "overalls" ? shade(shirt, 0.04) : shirt);
      }
      px(g, CX - Math.floor(torsoW(m, 3) / 2) + 1, bibY, torsoW(m, 3) - 2, 1, shade(shirt, 0.2));
      // alças + botões
      px(g, CX - Math.round(m.shoulderW * 0.3), y0 + 1, 1, 2, shade(shirt, 0.08));
      px(g, CX + Math.round(m.shoulderW * 0.3) - 1, y0 + 1, 1, 2, shade(shirt, -0.08));
      px(g, CX - Math.round(m.shoulderW * 0.3), bibY, 1, 1, "#e8c86a");
      px(g, CX + Math.round(m.shoulderW * 0.3) - 1, bibY, 1, 1, "#e8c86a");
      // bolso
      px(g, CX - 2, bibY + 2, 4, 1, shade(shirt, -0.2));
      px(g, CX - 2, bibY + 2, 1, 2, shade(shirt, -0.2));
      break;
    }
    case "jumpsuit": {
      px(g, CX - 1, y0 + 1, 2, h - 2, shade(shirt, -0.16));
      px(g, CX - Math.round(cw * 0.6), y0, cw * 2, 1, light);
      px(g, CX - 1, y0 + 4, 1, 1, "#e8d6a8");
      px(g, CX - 1, y0 + Math.round(h * 0.5), 1, 1, "#e8d6a8");
      break;
    }
    case "western": {
      // bolsos com aba e costura, na cor da camisa (não viram "olhos")
      const wx = Math.round(m.shoulderW * 0.32);
      for (const [bx, tone] of [[CX - wx, mid], [CX + wx - 2, shade(shirt, -0.2)]]) {
        px(g, bx, y0 + 3, 2, 1, tone);
        px(g, bx, y0 + 4, 1, 2, tone);
        px(g, bx + 1, y0 + 4, 1, 2, shade(tone, -0.14));
      }
      break;
    }
    case "denim": {
      px(g, CX - Math.round(m.shoulderW * 0.28), y0 + 4, 3, 1, light);
      px(g, CX - Math.round(m.shoulderW * 0.28), y0 + 4, 1, 2, light);
      px(g, CX + 1, y0 + 2, 1, 1, "#ffe9a8");
      break;
    }
    case "hearts": {
      for (const [hx_, hy_] of [[-0.28, 0.28], [0.24, 0.45], [0, 0.62], [-0.3, 0.72]]) {
        const x = Math.round(CX + hx_ * m.shoulderW);
        const y = Math.round(y0 + hy_ * h);
        px(g, x, y, 1, 1, "#ff8fa3");
        px(g, x + 1, y, 1, 1, "#ff8fa3");
        px(g, x, y + 1, 2, 1, "#e0697e");
      }
      break;
    }
    case "ruffled": {
      for (let i = 0; i < h - 1; i += 4) {
        const w = torsoW(m, i);
        px(g, CX - Math.floor(w / 2), y0 + i, 1, 2, light);
        px(g, CX + Math.ceil(w / 2) - 1, y0 + i, 1, 2, light);
      }
      px(g, CX - cw, y0, cw * 2, 1, "#fff6e0");
      break;
    }
    case "cardigan": {
      const under = opts.undershirt || "#f4ead6";
      const uD = shade(under, -0.14);
      const cc = Math.max(3, Math.round(m.shoulderW * 0.34));
      // camiseta aparece na abertura (2px, não um painel branco)
      px(g, CX, y0 + 2, 1, h - 4, under);
      px(g, CX + 1, y0 + 2, 1, h - 4, uD);
      // lapelas rentes à abertura
      px(g, CX - 1, y0 + 1, 1, h - 3, shade(shirt, 0.16));
      px(g, CX + 2, y0 + 1, 1, h - 3, shade(shirt, -0.3));
      px(g, CX - 2, y0 + 1, 1, h - 3, shade(shirt, -0.18));
      px(g, CX + 3, y0 + 1, 1, h - 3, shade(shirt, -0.36));
      // gola alta
      px(g, CX - cc, y0, cc * 2, 1, light);
      px(g, CX - cc, y0 + 1, 2, 1, shade(shirt, -0.1));
      px(g, CX + cc - 2, y0 + 1, 2, 1, shade(shirt, -0.24));
      // botões
      px(g, CX - 1, y0 + 4, 1, 1, "#e2cb96");
      px(g, CX - 1, y0 + 8, 1, 1, "#e2cb96");
      px(g, CX - 1, y0 + 12, 1, 1, "#e2cb96");
      // tricô
      for (let i = 2; i < h - 1; i += 3) {
        const w = torsoW(m, i);
        px(g, CX - Math.floor(w / 2) + 1, y0 + i, 2, 1, mid);
        px(g, CX + Math.ceil(w / 2) - 3, y0 + i, 2, 1, mid);
      }
      break;
    }
  }

  // barra da camisa
  const wb = torsoW(m, h - 1);
  px(g, CX - Math.floor(wb / 2), y0 + h - 1, wb, 1, dark);

  // ---- cinto por cima da barra (camisa por dentro) ----
  if (!side && opts.pantsStyle !== "skirt" && m.age !== "newborn") {
    const wb = torsoW(m, h - 1);
    const bx = CX - Math.floor(wb / 2);
    px(g, bx + 1, y0 + h - 2, wb - 2, 1, "#7a5533");
    px(g, bx + 1, y0 + h - 1, wb - 2, 1, "#523620");
    px(g, CX - 1, y0 + h - 2, 2, 2, "#e8c86a");
    px(g, CX - 1, y0 + h - 2, 1, 1, "#fbf0b8");
    px(g, CX, y0 + h - 1, 1, 1, "#a8862e");
  }

  // ---- avental por cima: alças, peitoral e saia ----
  if (opts.apron) {
    const ap = opts.apron;
    const bibW = Math.max(5, m.waistW - 2);
    const skirtW = Math.max(6, m.hipW);
    const bibY = y0 + 3;
    const skirtY = y0 + Math.max(6, Math.round(h * 0.58));
    // alças no ombro
    px(g, CX - Math.floor(bibW / 2), y0, 1, 3, ap);
    px(g, CX + Math.ceil(bibW / 2) - 1, y0, 1, 3, ap);
    // peitoral
    px(g, CX - Math.floor(bibW / 2), bibY, bibW, skirtY - bibY, ap);
    px(g, CX - Math.floor(bibW / 2), bibY, bibW, 1, shade(ap, 0.16));
    px(g, CX - Math.floor(bibW / 2), bibY, 1, skirtY - bibY, shade(ap, 0.1));
    px(g, CX + Math.ceil(bibW / 2) - 1, bibY, 1, skirtY - bibY, shade(ap, -0.2));
    // bolso do peitoral
    if (skirtY - bibY > 4) px(g, CX - 1, bibY + 2, 3, 1, shade(ap, -0.26));
    // saia do avental cobre a barra da camisa
    px(g, CX - Math.floor(skirtW / 2), skirtY, skirtW, y0 + h - skirtY, ap);
    px(g, CX - Math.floor(skirtW / 2), skirtY, skirtW, 1, shade(ap, 0.14));
    px(g, CX - Math.floor(skirtW / 2), skirtY, 1, y0 + h - skirtY, shade(ap, 0.08));
    px(g, CX + Math.ceil(skirtW / 2) - 1, skirtY, 1, y0 + h - skirtY, shade(ap, -0.2));
    px(g, CX - Math.floor(skirtW / 2) + 1, y0 + h - 1, skirtW - 2, 1, shade(ap, -0.24));
    // laço nas costas
    px(g, CX - Math.floor(bibW / 2), skirtY - 1, 2, 1, shade(ap, -0.3));
    px(g, CX + Math.ceil(bibW / 2) - 2, skirtY - 1, 2, 1, shade(ap, -0.3));
  }
}

// ------------------------------------------------------------------
//  Mãos
// ------------------------------------------------------------------
export function drawHands(g, m, dir, frame, skin, skinShade) {
  if (m.bundle || !m.armW) return;
  const L = limbs(m);
  const side = dir === "left" || dir === "right";
  const bob = frame === 1 || frame === 3 ? -1 : 0;
  const sd = skinShade || shade(skin, -0.18);
  const sleeve = Math.max(4, m.torsoH - 2);
  const sp = silRow(m, Math.min(m.torsoH - 1, sleeve));
  const armW = Math.max(2, sp.armW - 1);
  const axL = sp.tx - sp.armW + 1;
  const axR = sp.tx + sp.tw;
  const handY = L.shoulder + bob + sleeve + 1;
  if (side) {
    px(g, CX - 1, handY, armW + 1, 2, skin);
    px(g, CX - 1, handY + 1, 1, 1, sd);
    return;
  }
  // mão esquerda (com polegar e canto arredondado)
  px(g, axL, handY, armW, 2, skin);
  px(g, axL, handY + 1, 1, 1, sd);
  px(g, axL + armW - 1, handY, 1, 1, shade(skin, 0.08));
  px(g, axL + armW - 1, handY + 1, 1, 1, sd);
  px(g, axL, handY + 2, armW - 1, 1, sd);
  // mão direita
  px(g, axR, handY, armW, 2, shade(skin, -0.06));
  px(g, axR, handY + 1, armW, 1, sd);
  px(g, axR, handY + 2, armW - 1, 1, sd);
}

// ------------------------------------------------------------------
//  Cabelo
// ------------------------------------------------------------------
const HAIR_STYLES = {
  bald:        { crown: 0, fringe: "none", sides: 0, back: 0 },
  buzz:        { crown: 1, fringe: "none", sides: 0, back: 0 },
  short:       { crown: 2, fringe: "jagged", sides: 1, back: 0 },
  pixie:       { crown: 2, fringe: "side", sides: 1, back: 0 },
  messy:       { crown: 3, fringe: "spiky", sides: 1, back: 0, tufts: true },
  spiky:       { crown: 3, fringe: "spiky", sides: 0, back: 0, spikes: true },
  undercut:    { crown: 2, fringe: "side", sides: 0, back: 0, shaved: true },
  mullet:      { crown: 2, fringe: "jagged", sides: 1, back: 5 },
  long:        { crown: 2, fringe: "parted", sides: 3, back: 9 },
  long_masc:   { crown: 2, fringe: "jagged", sides: 2, back: 6 },
  long_wavy_masc: { crown: 2, fringe: "parted", sides: 3, back: 8, wavy: true },
  bob:         { crown: 2, fringe: "full", sides: 2, back: 6, bob: true },
  bangs:       { crown: 2, fringe: "full", sides: 1, back: 0 },
  side_sweep:  { crown: 2, fringe: "sweep", sides: 1, back: 0 },
  wavy:        { crown: 2, fringe: "parted", sides: 3, back: 6, wavy: true },
  curly:       { crown: 3, fringe: "curly", sides: 2, back: 3, bumpy: true },
  afro_puff:   { crown: 4, fringe: "curly", sides: 3, back: 2, bumpy: true },
  bun:         { crown: 2, fringe: "parted", sides: 0, back: 0, bun: 2 },
  updo:        { crown: 2, fringe: "parted", sides: 0, back: 0, bun: 3 },
  ponytail:    { crown: 2, fringe: "parted", sides: 0, back: 0, tail: true },
  twin:        { crown: 2, fringe: "full", sides: 0, back: 0, twins: true },
  braided:     { crown: 2, fringe: "parted", sides: 2, back: 5, braid: true },
  braid_long:  { crown: 2, fringe: "parted", sides: 1, back: 9, braid: true },
};

export function drawHairRig(g, m, dir, style, hair, hairDark, opts = {}) {
  if (m.bundle || opts.bald) return;
  if (m.age === "elder" && !opts.keepHairColor) {
    hair = opts.silver || "#cac5b6";
    hairDark = "#9a958a";
  }
  const cfg = HAIR_STYLES[style] || HAIR_STYLES.short;
  if (cfg.crown === 0 && cfg.sides === 0 && cfg.back === 0) return;
  const L = limbs(m);
  const hw = m.headW;
  const hh = m.headH;
  const hx = CX - Math.floor(hw / 2);
  const hy = L.headTop + (m.stoop ? 1 : 0);
  const up = dir === "up";
  const side = dir === "left" || dir === "right";
  const backSide = dir === "right" ? "left" : "right";
  const light = shade(hair, 0.22);
  const midtone = shade(hair, -0.12);
  const dark = hairDark || shade(hair, -0.3);

  // Marca onde o cabelo passou: serve para desenhar o contorno da franja
  // (a linha escura entre cabelo e testa, que dá o acabamento da referência).
  const mask = new Set();
  const put = (x, y, w) => {
    if (w <= 0) return;
    px(g, x, y, w, 1, hair);
    for (let k = 0; k < w; k++) mask.add(y * 64 + x + k);
  };
  const has = (x, y) => mask.has(y * 64 + x);

  // ---- calota: degraus que acompanham o crânio, sem picos soltos ----
  const crown = Math.max(1, Math.min(cfg.crown, Math.max(1, hy)));
  const capBottom = hy + 1;
  const top = capBottom - (crown + 1);
  for (let y = top; y <= capBottom; y++) {
    const fromTop = y - top;
    const inset = Math.min(Math.ceil(hw / 2) - 2, Math.max(0, crown - fromTop + 1));
    put(hx + inset, y, hw - inset * 2);
  }
  // brilho no alto a esquerda e sombra a direita
  const capW = hw - Math.min(Math.ceil(hw / 2) - 2, crown + 1) * 2;
  const capX = hx + Math.min(Math.ceil(hw / 2) - 2, crown + 1);
  px(g, capX + 1, top, Math.max(1, Math.min(3, capW - 2)), 1, light);
  px(g, hx + hw - 3, top + 2, 1, 1, midtone);
  px(g, hx + hw - 2, capBottom - 1, 1, 1, midtone);

  // ---- franja / testeira ----
  const fy = hy + 2;
  if (!up) {
    switch (cfg.fringe) {
      case "full":
        put(hx + 1, fy, hw - 2);
        put(hx + 1, fy + 1, 3);
        put(hx + hw - 3, fy + 1, 2);
        break;
      case "jagged":
        put(hx + 1, fy, hw - 2);
        for (let x = 1; x < hw - 2; x += 4) put(hx + x, fy + 1, 2);
        break;
      case "parted":
        put(hx + 1, fy, Math.max(2, Math.floor(hw / 2) - 2));
        put(hx + Math.ceil(hw / 2) + 1, fy, Math.max(2, Math.floor(hw / 2) - 2));
        put(hx + 2, fy + 1, 2);
        put(hx + hw - 4, fy + 1, 2);
        break;
      case "side":
        put(hx + 1, fy, hw - 3);
        put(hx + 1, fy + 1, 3);
        break;
      case "sweep":
        put(hx + 2, fy, hw - 3);
        put(hx + 2, fy + 1, 4);
        break;
      case "spiky":
        put(hx + 1, fy, hw - 2);
        for (let x = 1; x < hw - 2; x += 3) put(hx + x, fy + 1, 2);
        break;
      case "curly":
        for (let x = 1; x < hw - 2; x++) put(hx + x, fy, 1);
        for (let x = 1; x < hw - 3; x += 2) put(hx + x, fy + 1, 2);
        break;
      default: break;
    }
    // contorno da franja: 1px escuro na base, só sobre a testa.
    // Na altura da sobrancelha o contorno cede lugar a ela (senão vira "óculos").
    const browLine = hy + Math.max(3, Math.round(hh * 0.36)) - 2;
    for (let x = hx + 1; x <= hx + hw - 2; x++) {
      let deepest = -1;
      for (let y = fy - 1; y <= fy + 2; y++) if (has(x, y)) deepest = y;
      if (deepest >= 0 && deepest < hy + hh - 2 && deepest + 1 < browLine) {
        px(g, x, deepest + 1, 1, 1, shade(hair, -0.42));
      }
    }
  } else {
    // nuca: cabelo cobre o crânio inteiro
    put(hx + 1, hy, hw - 2);
    px(g, hx + 2, hy + 1, 1, 2, light);
    px(g, hx + hw - 3, hy + 1, 1, 2, dark);
  }

  // ---- mechas laterais (emolduram o rosto) ----
  if (!side) {
    if (cfg.sides > 0) {
      // mecha colada na cabeça (sem "chifre"): 1px descendo pela têmpora
      const len = Math.max(3, Math.min(cfg.back || 4, 7));
      for (let i = 1; i <= len; i++) {
        const tone = i > len - 2 ? dark : hair;
        px(g, hx - 1, hy + i, 1, 1, tone);
        px(g, hx + hw, hy + i, 1, 1, i > len - 2 ? dark : midtone);
      }
      px(g, hx - 1, hy + 1, 1, Math.max(1, len - 2), light);
    } else if (!up) {
      px(g, hx, hy + 3, 1, 2, midtone);
      px(g, hx + hw - 1, hy + 3, 1, 2, dark);
    }
  } else {
    const bx = backSide === "left" ? hx - 1 : hx + hw;
    const len = Math.max(3, cfg.back || cfg.sides + 2);
    px(g, bx, hy + 1, 2, len, hair);
    px(g, bx + (backSide === "left" ? 0 : 1), hy + 1, 1, len, dark);
  }

  // ---- acessórios de cabelo ----
  if (cfg.bun) {
    const bw = 2 + (cfg.bun > 2 ? 1 : 0);
    const by = Math.max(0, top - bw + 1);
    px(g, CX - Math.floor(bw / 2), by, bw, bw, hair);
    px(g, CX - Math.floor(bw / 2), by, 1, 1, light);
    px(g, CX + Math.floor(bw / 2) - 1, by + bw - 1, 1, 1, dark);
  }
  if (cfg.tufts) {
    // mecha apoiada na calota (nunca um pixel solto voando)
    px(g, capX + 1, top - 1, Math.max(2, Math.floor(capW / 3)), 1, hair);
  }
  if (cfg.spikes) {
    for (let i = 0; i < 3; i++) {
      const x = capX + 1 + i * Math.max(2, Math.floor(capW / 3));
      px(g, x, top - 1, 1 + (i % 2), 1, hair);
    }
  }
  if (cfg.bumpy) {
    for (let x = 1; x < hw - 1; x += 2) px(g, hx + x, top - 1, 2, 1, hair);
    px(g, hx - 1, hy + 1, 1, 3, hair);
    px(g, hx + hw, hy + 1, 1, 3, hair);
  }
  if (cfg.tail) {
    if (side) {
      const tx = dir === "right" ? hx - 2 : hx + hw;
      px(g, tx, hy + 1, 2, 5, hair);
      px(g, tx, hy + 6, 1, 3, dark);
    } else {
      px(g, hx + hw - 1, hy + 2, 2, 5, hair);
      px(g, hx + hw, hy + 7, 1, 3, midtone);
    }
  }
  if (cfg.twins) {
    px(g, hx - 2, hy + 2, 2, 3, hair);
    px(g, hx + hw, hy + 2, 2, 3, midtone);
    px(g, hx - 2, hy + 5, 1, 1, dark);
    px(g, hx + hw + 1, hy + 5, 1, 1, dark);
  }
  if (cfg.braid) {
    for (let i = 0; i < (cfg.back || 5); i++) {
      const x = hx + hw - 1 + (i % 2 === 0 ? 0 : 1);
      px(g, x, hy + 2 + i, 1, 1, i % 2 === 0 ? hair : midtone);
    }
    px(g, hx + hw, hy + 2 + (cfg.back || 5), 1, 1, dark);
  }
  if (cfg.shaved) {
    px(g, hx, hy + 3, 1, 2, shade(hair, -0.35));
    px(g, hx + hw - 1, hy + 3, 1, 2, shade(hair, -0.4));
  }
}

// ------------------------------------------------------------------
//  Chapéus
// ------------------------------------------------------------------
export function drawHatRig(g, m, dir, hat) {
  if (!hat || hat.type === "none" || m.bundle) return;
  const L = limbs(m);
  const hw = m.headW;
  const hx = CX - Math.floor(hw / 2);
  const hy = L.headTop + (m.stoop ? 1 : 0);
  const c = hat.color || "#c9a86a";
  const c2 = hat.color2 || shade(c, -0.22);
  const dark = shade(c, -0.32);
  const light = shade(c, 0.18);
  const side = dir === "left" || dir === "right";
  switch (hat.type) {
    case "straw": {
      px(g, hx + 2, hy - 5, hw - 4, 1, c);
      px(g, hx + 1, hy - 4, hw - 2, 1, light);
      px(g, hx + 1, hy - 3, hw - 2, 1, c);
      px(g, hx + 1, hy - 2, hw - 2, 1, c2);
      px(g, hx, hy - 1, hw, 1, c);
      px(g, hx - 2, hy, hw + 4, 1, c);
      px(g, hx - 1, hy + 1, hw + 2, 1, dark);
      px(g, hx - 2, hy, 2, 1, light);
      px(g, hx + hw, hy, 2, 1, light);
      return;
    }
    case "cap": {
      px(g, hx, hy - 2, hw, 2, c);
      px(g, hx + 1, hy - 3, hw - 2, 1, c);
      px(g, hx + 2, hy - 3, 2, 1, light);
      if (side) px(g, dir === "right" ? hx + hw : hx - 2, hy - 1, 2, 1, dark);
      else px(g, hx + Math.floor(hw / 2), hy, hw, 1, dark);
      return;
    }
    case "bandana": {
      px(g, hx, hy - 2, hw, 2, c);
      px(g, hx + 1, hy - 3, hw - 2, 1, c);
      px(g, hx + 2, hy - 2, 2, 1, light);
      px(g, hx + hw - 1, hy, 2, 1, c);
      px(g, hx + hw, hy + 1, 1, 2, c2);
      return;
    }
    case "flower": {
      px(g, hx, hy - 2, hw, 2, c);
      px(g, hx + 1, hy - 3, hw - 2, 1, c);
      px(g, hx + hw - 3, hy - 4, 2, 2, c2);
      px(g, hx + hw - 3, hy - 4, 1, 1, "#fff3d6");
      px(g, hx + 2, hy - 3, 1, 1, light);
      return;
    }
    case "sailor": {
      px(g, hx + 1, hy - 2, hw - 2, 2, c);
      px(g, hx + 3, hy - 3, Math.max(2, hw - 6), 1, c);
      px(g, hx + 2, hy - 3, 2, 1, "#ffffff");
      px(g, hx + 1, hy, hw - 2, 1, "#2f4a6b");
      return;
    }
    case "goggles": {
      px(g, hx + 1, hy - 2, hw - 2, 2, c);
      px(g, hx + 2, hy - 1, 2, 2, "#bfe6f2");
      px(g, hx + hw - 4, hy - 1, 2, 2, "#bfe6f2");
      px(g, hx + 2, hy - 1, 1, 1, "#ffffff");
      px(g, hx + hw - 4, hy - 1, 1, 1, "#ffffff");
      return;
    }
    case "wizard": {
      px(g, hx + 3, hy - 7, 1, 2, c);
      px(g, hx + 2, hy - 5, 3, 2, c);
      px(g, hx + 1, hy - 4, hw - 2, 2, c);
      px(g, hx - 1, hy - 2, hw + 2, 2, c);
      px(g, hx - 2, hy, hw + 4, 1, dark);
      px(g, hx + 3, hy - 3, 1, 1, "#ffe9a8");
      return;
    }
    default:
      return;
  }
}

// ------------------------------------------------------------------
//  Ferramentas na mão (pose de ação)
// ------------------------------------------------------------------
export function drawToolRig(g, m, dir, tool) {
  if (!tool || m.bundle) return;
  const L = limbs(m);
  const side = dir === "left" || dir === "right";
  const sp = armSpans(m, Math.round(m.torsoH * 0.6));
  const handX = side ? (dir === "right" ? sp.axR : sp.axL) : sp.axL;
  const handY = L.shoulder + Math.round((L.hip - L.shoulder) * 0.55);
  const wood = "#8a6a42", woodD = "#5c452a", metal = "#c9d0d6", metalD = "#8a949c", metalL = "#eef4f8";
  if (tool === "enxada") {
    px(g, handX, handY, 2, 7, wood);
    px(g, handX, handY, 1, 7, shade(wood, 0.2));
    px(g, handX - 1, handY + 6, 4, 1, metal);
    px(g, handX - 1, handY + 7, 3, 1, metalD);
  } else if (tool === "machado") {
    px(g, handX, handY, 2, 8, wood);
    px(g, handX + 1, handY - 1, 3, 4, metal);
    px(g, handX + 1, handY - 1, 3, 1, metalL);
    px(g, handX + 3, handY, 1, 2, metalD);
  } else if (tool === "picareta") {
    px(g, handX, handY, 2, 8, wood);
    px(g, handX - 2, handY - 1, 6, 2, metal);
    px(g, handX - 2, handY - 1, 3, 1, metalL);
  } else if (tool === "foice") {
    px(g, handX, handY, 2, 6, wood);
    for (let i = 0; i < 5; i++) px(g, handX + 1 + i, handY - 1 + Math.floor(i / 2), 2, 1, i === 0 ? metalL : metal);
  } else if (tool === "regador") {
    px(g, handX - 1, handY + 1, 4, 4, "#4a9bc4");
    px(g, handX - 1, handY + 1, 4, 1, "#bfe6f2");
    px(g, handX + 3, handY + 1, 2, 1, "#4a9bc4");
    px(g, handX - 2, handY - 1, 2, 2, "#7fc7e8");
  } else if (tool === "vara") {
    px(g, handX, handY - 8, 1, 16, wood);
    px(g, handX + 1, handY - 8, 3, 1, "#dfe7ea");
    px(g, handX + 3, handY - 7, 1, 3, "#dfe7ea");
    px(g, handX + 3, handY - 4, 1, 1, "#c0392b");
  } else if (tool === "semente") {
    px(g, handX, handY + 2, 2, 2, "#e8d6b0");
    px(g, handX + 1, handY + 2, 1, 1, "#7cb98a");
  }

}

// ------------------------------------------------------------------
//  Bengala (idoso)
// ------------------------------------------------------------------
export function drawCane(g, m, dir, color = "#8a6a42") {
  if (m.bundle || !m.armW) return;
  const L = limbs(m);
  const side = dir === "left" || dir === "right";
  const sp = armSpans(m, Math.round(m.torsoH * 0.6));
  const handX = side ? (dir === "right" ? sp.axR - 1 : sp.axL) : sp.axL - 1;
  const handY = L.shoulder + Math.round((L.hip - L.shoulder) * 0.55);
  const wood = color, woodD = shade(color, -0.32), woodL = shade(color, 0.22);
  px(g, handX, handY + 1, 1, Math.max(3, L.feet - handY - 2), wood);
  px(g, handX, handY + 1, 1, 4, woodL);
  px(g, handX, L.feet - 2, 1, 1, woodD);
  const dx = handX < CX ? 1 : -1;
  px(g, handX + dx, handY, 1, 1, woodL);
  px(g, handX + dx * 2, handY + 1, 1, 1, woodD);
}

// ------------------------------------------------------------------
//  Composição + contorno
// ------------------------------------------------------------------
function drawParts(g, spec, dir, frame, tool) {
  const bodyId = rigBodyId(spec.bodyId);
  const m = metricsFor(bodyId);
  const skin = spec.skin || "#f6c99b";
  const skinShade = spec.skinShade || shade(skin, -0.16);
  const hairColor = m.age === "elder" && !spec.keepHairColor
    ? (spec.silver || "#cac5b6")
    : (spec.hair || "#6b4226");
  g.imageSmoothingEnabled = false;
  drawBaseBody(g, m, dir, frame, skin, skinShade, {
    eye: spec.eyeColor,
    eyeLight: spec.eyeLight,
    beard: spec.beard,
    hair: hairColor,
    blanket: spec.blanket,
  });
  const pantsStyle = spec.pantsStyle || (spec.skirt ? "skirt" : "long");
  drawPants(g, m, dir, frame, spec.pants || "#43506b", skin, pantsStyle, {
    shoe: spec.shoe, shoeDark: spec.shoeDark, shoeLight: spec.shoeLight,
  });
  drawShirt(g, m, dir, frame, spec.shirt || "#e2695e", spec.shirtDark, spec.shirtDesign, {
    apron: spec.apron, skin, undershirt: spec.undershirt, collar: spec.collar, pantsStyle,
  });
  drawHands(g, m, dir, frame, skin, skinShade);
  drawHairRig(g, m, dir, spec.hairStyle || "short", hairColor, spec.hairDark, { bald: spec.bald });
  drawHatRig(g, m, dir, spec.hat);
  if (spec.necklace && !m.bundle) {
    const L = limbs(m);
    px(g, CX - 1, L.shoulder, 2, 1, spec.necklace);
  }
  if (spec.cane) drawCane(g, m, dir, spec.cane === true ? "#8a6a42" : spec.cane);
  if (spec.bracelet && m.armW > 0 && !m.bundle) {
    const L = limbs(m);
    const sp2 = armSpans(m, Math.round(m.torsoH * 0.6));
    px(g, sp2.axL, L.shoulder + Math.round((L.hip - L.shoulder) * 0.62), m.armW, 1, spec.bracelet);
  }
  if (tool) drawToolRig(g, m, dir, tool);
  return m;
}

function outlineOf(art) {
  const out = mkCanvas(RIG_OUT_W, RIG_OUT_H);
  const g = out.getContext("2d");
  g.imageSmoothingEnabled = false;
  // silhueta deslocada nos arredores (sem contorno embaixo: o pé toca o chão)
  const offs = [[1, 0], [-1, 0], [1, -1], [-1, -1], [0, -1], [1, 1], [-1, 1]];
  for (const [dx, dy] of offs) g.drawImage(art, RIG_PAD + dx, 1 + dy);
  g.globalCompositeOperation = "source-in";
  g.fillStyle = OUTLINE;
  g.fillRect(0, 0, out.width, out.height);
  g.globalCompositeOperation = "source-over";
  g.drawImage(art, RIG_PAD, 1);
  return out;
}

/** Sprite final 26×49 (px de arte) já com contorno, em cache. */
export function rigSprite(spec, dir, frame, tool = null) {
  const key = `rig3:${JSON.stringify(spec)}:${dir}:${frame}:${tool || ""}`;
  return cached(key, () => {
    const art = mkCanvas(RIG_W, RIG_H);
    drawParts(art.getContext("2d"), spec, dir, frame, tool);
    return outlineOf(art);
  });
}

/** Quantidade de movimento em cada quadro (para sombra e balanço). */
export function rigIsStepping(frame) {
  return frame === 1 || frame === 3;
}
