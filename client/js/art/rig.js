// ============================================================
//  Vale Aconchegante — "rig" de personagens (arte original)
//  16×32 nativos + contorno de 1px, camadas independentes.
//
//  Por que existe: os corpos antigos eram imagens de corpo inteiro
//  já vestido; desenhadas por cima do código, elas apagavam o corpo
//  e congelavam as pernas — o personagem "deslizava" no mapa. Aqui
//  cada camada (base, calça, camisa, cabelo, chapéu, ferramenta) é
//  desenhada por cima do mesmo rig, então a caminhada funciona e as
//  combinações nunca brigam entre si.
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

const OUTLINE = "#3a2a1e";

// ------------------------------------------------------------------
//  Utilitários de cor
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

// ------------------------------------------------------------------
//  Métricas por idade (pé sempre na linha 31)
// ------------------------------------------------------------------
const AGE_METRICS = {
  newborn: { legH: 0, torsoH: 0, headH: 8, headW: 9, bodyW: 9, arm: 0, bundle: true },
  baby:    { legH: 3, torsoH: 4, headH: 8, headW: 8, bodyW: 5, arm: 2 },
  child:   { legH: 7, torsoH: 6, headH: 8, headW: 7, bodyW: 6, arm: 2 },
  teen:    { legH: 10, torsoH: 8, headH: 7, headW: 6, bodyW: 6, arm: 2 },
  adult:   { legH: 11, torsoH: 10, headH: 7, headW: 6, bodyW: 8, arm: 2 },
  elder:   { legH: 9, torsoH: 9, headH: 7, headW: 6, bodyW: 7, arm: 2, stoop: 1 },
};

/**
 * Duas opções por idade (A/B). A diferença é de silhueta e postura,
 * não de gênero: a base é neutra e serve para qualquer apresentação.
 */
export const BODY_VARIANTS = {
  newborn_A: { age: "newborn", variant: "A", name: "Recém-nascido — cobertor xadrez", desc: "Cabeça e cobertor, sem pernas" },
  newborn_B: { age: "newborn", variant: "B", name: "Recém-nascido — touca e manta", desc: "Touca de tricô, manta lisa" },
  baby_A: { age: "baby", variant: "A", name: "Bebê — encorpado", desc: "Cabeça grande, corpo curto" },
  baby_B: { age: "baby", variant: "B", name: "Bebê — franzino", desc: "Silhueta estreita" },
  child_A: { age: "child", variant: "A", name: "Criança — robusta", desc: "Ombros retos, pernas curtas" },
  child_B: { age: "child", variant: "B", name: "Criança — esguia", desc: "Silhueta fina, pernas longas" },
  teen_A: { age: "teen", variant: "A", name: "Adolescente — atlético", desc: "Ombros largos" },
  teen_B: { age: "teen", variant: "B", name: "Adolescente — esguio", desc: "Tronco fino, pernas longas" },
  adult_A: { age: "adult", variant: "A", name: "Adulto — encorpado", desc: "Tronco cheio, ombros largos" },
  adult_B: { age: "adult", variant: "B", name: "Adulto — esguio", desc: "Cintura marcada, pernas longas" },
  elder_A: { age: "elder", variant: "A", name: "Idoso — curvado", desc: "Costas levemente curvadas" },
  elder_B: { age: "elder", variant: "B", name: "Idoso — ereto", desc: "Postura firme, cabelo grisalho" },
};

export const BODY_VARIANT_LIST = Object.entries(BODY_VARIANTS).map(([id, v]) => ({ id, ...v }));

/** Converte id antigo (`adult_masc_A`) no id do rig (`adult_A`). */
export function rigBodyId(id) {
  if (!id) return "adult_A";
  if (BODY_VARIANTS[id]) return id;
  const age = ["adult", "elder", "teen", "child", "baby", "newborn"].find((a) => id.startsWith(a));
  if (!age) return "adult_A";
  const v = /_([AB])$/.exec(id)?.[1] || "A";
  return `${age}_${v}`;
}

export function ageOfBody(id) {
  return (BODY_VARIANTS[rigBodyId(id)] || BODY_VARIANTS.adult_A).age;
}

/**
 * Silhueta explícita de cada variante.
 * `headTop` resultante = 33 - legH - torsoH - headH (pé na linha 31):
 * adulto A 2 (28px de altura visível), adulto B 6 (25px),
 * adolescente 7/9, idoso 7/5, criança 12/14, bebê 18/19.
 */
const VARIANT_SHAPE = {
  newborn_A: { legH: 0, torsoH: 0, headH: 12, headW: 14, bodyW: 14, arm: 0 },
  newborn_B: { legH: 0, torsoH: 0, headH: 12, headW: 14, bodyW: 14, arm: 0 },
  baby_A: { legH: 7, torsoH: 7, headH: 13, headW: 15, bodyW: 12, arm: 3 },
  baby_B: { legH: 6, torsoH: 7, headH: 13, headW: 13, bodyW: 9, arm: 2 },
  child_A: { legH: 11, torsoH: 9, headH: 12, headW: 12, bodyW: 12, arm: 3 },
  child_B: { legH: 9, torsoH: 8, headH: 12, headW: 11, bodyW: 9, arm: 2 },
  teen_A: { legH: 14, torsoH: 12, headH: 12, headW: 14, bodyW: 12, arm: 3 },
  teen_B: { legH: 12, torsoH: 12, headH: 12, headW: 12, bodyW: 11, arm: 3 },
  adult_A: { legH: 17, torsoH: 15, headH: 12, headW: 15, bodyW: 15, arm: 3 },
  adult_B: { legH: 15, torsoH: 15, headH: 12, headW: 14, bodyW: 12, arm: 3 },
  elder_A: { legH: 14, torsoH: 15, headH: 13, headW: 15, bodyW: 14, arm: 3, stoop: 1 },
  elder_B: { legH: 15, torsoH: 13, headH: 13, headW: 15, bodyW: 14, arm: 3 },
};

export function metricsFor(bodyId = "adult_A") {
  const def = BODY_VARIANTS[rigBodyId(bodyId)] || BODY_VARIANTS.adult_A;
  const m = AGE_METRICS[def.age] || AGE_METRICS.adult;
  const shape = VARIANT_SHAPE[BODY_VARIANTS[rigBodyId(bodyId)] ? rigBodyId(bodyId) : ""];
  if (shape) return { age: def.age, variant: def.variant, ...shape, bundle: !!m.bundle };
  const A = (def.variant || "A") === "A";
  return {
    age: def.age,
    variant: def.variant,
    legH: m.legH + (A ? 0 : 1),
    torsoH: m.torsoH,
    headH: m.headH,
    headW: m.headW,
    bodyW: Math.max(4, m.bodyW + (A ? 1 : -1)),
    arm: m.arm,
    stoop: m.stoop || 0,
    bundle: !!m.bundle,
  };
}

function limbs(m) {
  const feet = RIG_H - 1;
  const hip = feet - m.legH;
  const shoulder = hip - m.torsoH + (m.torsoH ? 1 : 0);
  // pescoço entre o queixo e o ombro (a cabeça não encosta no tronco)
  const headTop = shoulder - m.headH - 1;
  return { feet, hip, shoulder, headTop };
}

// ------------------------------------------------------------------
//  Corpo base (pele + rosto)
// ------------------------------------------------------------------
export function drawBaseBody(g, m, dir, frame, skin, skinShade, opts = {}) {
  if (m.bundle) return drawNewborn(g, m, dir, skin, opts);
  const L = limbs(m);
  const side = dir === "left" || dir === "right";
  const up = dir === "up";
  const cx = RIG_W / 2;
  const bob = frame === 1 || frame === 3 ? -1 : 0;
  const skinDark = skinShade || shade(skin, -0.18);
  const skinLight = shade(skin, 0.10);

  // ---- pernas ----
  const legW = Math.max(2, Math.floor((m.bodyW - 3) / 2));
  const gap = Math.max(1, m.bodyW - legW * 2);
  const x0 = cx - Math.floor((legW * 2 + gap) / 2);
  const legTop = L.hip + bob;
  const legLen = L.feet - L.hip;
  const liftA = frame === 1 ? 1 : 0;
  const liftB = frame === 3 ? 1 : 0;
  const swingA = side ? (frame === 1 ? 1 : frame === 3 ? -1 : 0) : 0;
  const swingB = side ? (frame === 3 ? 1 : frame === 1 ? -1 : 0) : 0;
  px(g, x0 + swingB, legTop, legW, legLen - liftB, shade(skin, -0.1));
  px(g, x0 + legW + gap + swingA, legTop, legW, legLen - liftA, skin);
  px(g, x0 + legW + gap + swingA, legTop, 1, legLen - liftA, skinLight);

  // ---- tronco ----
  const tw = m.bodyW;
  const tx = cx - Math.floor(tw / 2);
  const torsoTop = L.shoulder + bob;
  const torsoH = Math.max(2, L.hip - L.shoulder);
  px(g, tx, torsoTop, tw, torsoH, skin);
  px(g, tx, torsoTop, 1, torsoH, skinDark);
  px(g, tx + tw - 1, torsoTop, 1, torsoH, skinDark);
  px(g, tx + 1, torsoTop, tw - 2, 1, skinLight);

  // ---- pescoço ----
  px(g, cx - 1, torsoTop - 2, 2, 2, skinDark);
  px(g, cx - 1, torsoTop - 2, 1, 1, skin);

  // ---- braços (a manga da camisa cobre por cima; a mão volta depois) ----
  if (m.arm > 0) {
    const armY = torsoTop + 1;
    const armH = Math.max(3, Math.round(torsoH * 0.62));
    const swing = frame === 1 ? 1 : frame === 3 ? -1 : 0;
    if (side) {
      px(g, cx - 1, armY + Math.max(0, swing), m.arm, armH, shade(skin, -0.1));
    } else {
      px(g, tx - m.arm, armY + Math.max(0, swing), m.arm, armH, skinDark);
      px(g, tx + tw, armY + Math.max(0, -swing), m.arm, armH, shade(skin, -0.04));
    }
  }

  // ---- cabeça ----
  const hw = m.headW;
  const hh = m.headH;
  const hx = cx - Math.floor(hw / 2);
  const hy = L.headTop + bob + (m.stoop ? 1 : 0);
  const earY = hy + Math.floor(hh * 0.42);
  if (!up) {
    px(g, hx - 1, earY, 1, 2, skinDark);
    px(g, hx + hw, earY, 1, 2, shade(skin, -0.06));
  }
  // crânio arredondado: cantos de cima e de baixo cortados
  px(g, hx + 1, hy, hw - 2, 1, skin);
  px(g, hx, hy + 1, hw, hh - 2, skin);
  px(g, hx + 1, hy + hh - 1, hw - 2, 1, shade(skin, -0.05));
  // luz no topo e sombra nas laterais
  px(g, hx + 2, hy + 1, hw - 4, 1, skinLight);
  px(g, hx, hy + 2, 1, hh - 4, skinDark);
  px(g, hx + hw - 1, hy + 2, 1, hh - 4, shade(skin, -0.09));

  const eyeY = hy + Math.floor(hh * 0.45);
  const eye = opts.eye || "#3b2b21";
  if (!up) {
    if (side) {
      const ex = dir === "right" ? hx + hw - 5 : hx + 2;
      px(g, ex, eyeY, 3, 2, eye);
      px(g, ex + (dir === "right" ? 0 : 2), eyeY, 1, 1, "#f4e6d2");
      px(g, dir === "right" ? hx + hw - 1 : hx, eyeY + 2, 1, 2, skinDark);
      px(g, dir === "right" ? hx + 1 : hx + hw - 4, eyeY - 2, 3, 1, shade(opts.hair || skinDark, -0.06));
      px(g, dir === "right" ? hx + hw - 6 : hx + 3, eyeY + 4, 3, 1, shade(skin, -0.3));
    } else {
      // sobrancelhas 3px
      const brow = shade(opts.hair || "#4a3020", -0.12);
      px(g, hx + 2, eyeY - 2, 3, 1, brow);
      px(g, hx + hw - 5, eyeY - 2, 3, 1, brow);
      // olhos 3×3 com brilho no canto
      px(g, hx + 2, eyeY, 3, 3, eye);
      px(g, hx + hw - 5, eyeY, 3, 3, eye);
      px(g, hx + 3, eyeY + 1, 1, 1, "#f4e6d2");
      px(g, hx + hw - 4, eyeY + 1, 1, 1, "#f4e6d2");
      // nariz de 1px e boca 2px, com 1 linha de respiro
      px(g, cx - 1, eyeY + 4, 1, 1, shade(skin, -0.22));
      px(g, cx - 1, eyeY + 6, 2, 1, shade(skin, -0.4));
      // bochechas
      px(g, hx + 1, eyeY + 3, 1, 1, "rgba(226,120,110,.26)");
      px(g, hx + hw - 2, eyeY + 3, 1, 1, "rgba(226,120,110,.26)");
    }
  } else {
    px(g, hx + 1, hy + hh - 4, hw - 2, 4, skinDark);
  }

  // ---- barba ----
  if (opts.beard && !up) {
    const beard = opts.hair || "#4a3020";
    const beardDark = shade(beard, -0.24);
    const by = eyeY + 4;
    // bigode 4px
    px(g, cx - 2, by, 4, 1, shade(beard, 0.16));
    // barba cheia nas bochechas e no queixo (boca e bigode ficam de fora)
    const bh = hh - (by - hy);
    px(g, hx, by, 2, bh, beard);
    px(g, hx + hw - 2, by, 2, bh, beardDark);
    px(g, hx + 2, hy + hh - 1, hw - 4, 1, beard);
    px(g, hx + 2, hy + hh - 1, 4, 1, shade(beard, 0.14));
    px(g, hx + 2, hy + hh - 2, 1, 1, beardDark);
    px(g, hx + hw - 3, hy + hh - 2, 1, 1, beardDark);
  }
  return { ...L, hx, hy, hw, hh, tx, tw, torsoTop, torsoH };
}

function drawNewborn(g, m, dir, skin, opts) {
  const up = dir === "up";
  const side = dir === "left" || dir === "right";
  const skinDark = shade(skin, -0.16);
  const blanket = opts.blanket || (m.variant === "A" ? "#f2e4cb" : "#d7e6dc");
  const blanketDark = shade(blanket, -0.16);
  const blanketLight = shade(blanket, 0.1);
  const hair = opts.hair || "#6b4226";

  // cabeça grande, apoiada na manta
  const hw = 13, hh = 12;
  const hx = RIG_W / 2 - Math.floor(hw / 2);
  const hy = 17;
  px(g, hx + 1, hy, hw - 2, 1, skin);
  px(g, hx, hy + 1, hw, hh - 2, skin);
  px(g, hx + 1, hy + hh - 1, hw - 2, 1, shade(skin, -0.06));
  px(g, hx + hw - 1, hy + 1, 1, hh - 2, shade(skin, -0.08));
  px(g, hx - 1, hy + 5, 1, 2, skinDark);
  px(g, hx + hw, hy + 5, 1, 2, shade(skin, -0.1));

  if (m.variant === "A") {
    // cabelo ralo de recém-nascido
    px(g, hx + 2, hy - 1, hw - 4, 2, hair);
    px(g, hx + 1, hy, 1, 2, hair);
    px(g, hx + hw - 2, hy, 1, 2, hair);
    px(g, hx + 3, hy - 1, 3, 1, shade(hair, 0.2));
  } else {
    // touca de tricô
    px(g, hx, hy - 2, hw, 3, blanket);
    px(g, hx + 1, hy - 3, hw - 2, 1, blanketLight);
    px(g, hx + Math.floor(hw / 2), hy - 4, 2, 1, blanketLight);
    px(g, hx, hy, hw, 1, blanketDark);
  }

  if (!up) {
    const eyeY = hy + 6;
    px(g, hx + 3, eyeY, 2, 2, "#3b2b21");
    px(g, hx + hw - 5, eyeY, 2, 2, "#3b2b21");
    px(g, hx + 3, eyeY, 1, 1, "#f4e6d2");
    px(g, hx + hw - 5, eyeY, 1, 1, "#f4e6d2");
    px(g, hx + 1, eyeY, 1, 1, "rgba(226,120,110,.3)");
    px(g, hx + hw - 2, eyeY, 1, 1, "rgba(226,120,110,.3)");
    px(g, RIG_W / 2 - 1, eyeY + 3, 2, 1, shade(skin, -0.3));
  } else {
    px(g, hx + 1, hy, hw - 2, 4, hair);
  }

  // manta-casulo (trapézio arredondado, do colo aos pés)
  const top = 29;
  px(g, 6, top, 12, 2, blanket);
  px(g, 5, top + 2, 14, 4, blanket);
  px(g, 4, top + 6, 16, 8, blanket);
  px(g, 5, top + 14, 14, 3, blanket);
  px(g, 6, top + 17, 12, 1, blanketDark);
  // luz e sombra
  px(g, 6, top, 12, 1, blanketLight);
  px(g, 5, top + 2, 2, 15, blanketLight);
  px(g, 18, top + 4, 2, 12, blanketDark);
  // pregas
  px(g, 9, top + 4, 1, 12, blanketDark);
  px(g, 14, top + 5, 1, 11, blanketDark);
  px(g, 7, top + 13, 10, 1, blanketLight);
  px(g, 8, top + 15, 8, 1, blanketDark);
  // gola enrolada
  px(g, 7, top - 1, 10, 2, shade(blanket, 0.16));
  px(g, 8, top - 1, 8, 1, blanketLight);
  // mãozinhas
  px(g, 3, top + 8, 1, 2, skin);
  px(g, 20, top + 8, 1, 2, skinDark);
}

// ------------------------------------------------------------------
//  Calça / saia
// ------------------------------------------------------------------
const PANTS_STYLES = new Set(["skirt", "shorts", "long"]);

export function drawPants(g, m, dir, frame, pants, skin, style = "long", opts = {}) {
  if (m.bundle) return;
  const L = limbs(m);
  const side = dir === "left" || dir === "right";
  const bob = frame === 1 || frame === 3 ? -1 : 0;
  const legW = Math.max(3, Math.floor((m.bodyW - 4) / 2));
  const gap = Math.max(2, m.bodyW - legW * 2);
  const x0 = RIG_W / 2 - Math.floor((legW * 2 + gap) / 2);
  const dark = shade(pants, -0.22);
  const light = shade(pants, 0.16);
  const shoe = opts.shoe || "#4a3620", shoeDark = opts.shoeDark || shade(shoe, -0.4), shoeLight = opts.shoeLight || shade(shoe, 0.24);
  const legTop = L.hip + bob;
  const legLen = L.feet - L.hip;
  const tx = RIG_W / 2 - Math.floor(m.bodyW / 2);

  if (style === "skirt") {
    const top = L.hip - 2 + bob;
    const w = m.bodyW + 2;
    const h = Math.max(4, Math.round(m.legH * 0.62));
    for (let i = 0; i < h; i++) {
      const ww = w + Math.floor((i / h) * 3);
      px(g, RIG_W / 2 - Math.floor(ww / 2), top + i, ww, 1, i === h - 1 ? dark : (i === 0 ? light : pants));
    }
    const below = top + h;
    const bare = Math.max(0, L.feet - below - 2);
    if (bare > 0) {
      px(g, x0 + (side && frame === 1 ? 1 : 0), below, legW, bare, skin);
      px(g, x0 + legW + gap + (side && frame === 3 ? 1 : 0), below, legW, bare, shade(skin, -0.06));
    }
    for (const [sxx, lift] of [[x0 + (side && frame === 1 ? 1 : 0), frame === 1], [x0 + legW + gap + (side && frame === 3 ? 1 : 0), frame === 3]]) {
      const by = L.feet - 2 - (lift ? 1 : 0);
      px(g, sxx, by, legW, 2, shoe);
      px(g, sxx, by + 1, legW, 1, shoeDark);
      px(g, sxx, by, 1, 1, shoeLight);
    }
    return;
  }

  // cinto com fivela
  px(g, tx, L.hip - 2 + bob, m.bodyW, 2, shade(pants, -0.3));
  px(g, RIG_W / 2 - 1, L.hip - 2 + bob, 2, 1, "#c9a24a");
  px(g, RIG_W / 2 - 1, L.hip - 1 + bob, 2, 1, "#8a6a2a");

  const liftA = frame === 1 ? 1 : 0;
  const liftB = frame === 3 ? 1 : 0;
  const swingA = side ? (frame === 1 ? 1 : frame === 3 ? -1 : 0) : 0;
  const swingB = side ? (frame === 3 ? 1 : frame === 1 ? -1 : 0) : 0;
  const lenA = style === "shorts" ? Math.max(2, Math.round(legLen * 0.45)) : legLen;

  // pernas (traseira mais escura, frente com brilho)
  px(g, x0 + swingB, legTop, legW, lenA - liftB - 1, dark);
  px(g, x0 + legW + gap + swingA, legTop, legW, lenA - liftA - 1, pants);
  px(g, x0 + legW + gap + swingA + legW - 1, legTop, 1, lenA - liftA - 2, shade(pants, -0.12));
  // barra
  px(g, x0 + swingB, legTop + lenA - liftB - 2, legW, 1, shade(pants, -0.34));
  px(g, x0 + legW + gap + swingA, legTop + lenA - liftA - 2, legW, 1, dark);

  if (style === "shorts") {
    const bareTop = legTop + lenA - 1;
    const bare = Math.max(0, L.feet - bareTop - 1);
    if (bare > 0) {
      px(g, x0 + swingB, bareTop, legW, bare - liftB, shade(skin, -0.1));
      px(g, x0 + legW + gap + swingA, bareTop, legW, bare - liftA, skin);
    }
  }

  // sapatos: 2px de altura, bico 1px para fora e sola escura
  for (const [sxx, lift, back] of [[x0 + swingB, liftB, true], [x0 + legW + gap + swingA, liftA, false]]) {
    const by = L.feet - 2 - lift;
    px(g, sxx, by, legW + 1, 2, shoe);
    px(g, sxx, by, legW + 1, 1, shoeLight);
    px(g, sxx, by + 1, legW + 1, 1, shoeDark);
    if (!back) px(g, sxx + legW + 1, by + (side && dir === "right" ? 0 : 1), 1, 1, shoeDark);
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
  const tw = m.bodyW;
  const tx = RIG_W / 2 - Math.floor(tw / 2);
  const top = L.shoulder + bob;
  const h = Math.max(2, L.hip - L.shoulder);
  const light = shade(shirt, 0.16);
  const dark = shirtDark || shade(shirt, -0.22);
  const sleeve = Math.max(2, Math.round(h * 0.55));

  // mangas (2px, com punho) — a mão de pele é desenhada depois
  if (m.arm > 0) {
    if (side) {
      px(g, 7, top + 1, m.arm + 1, sleeve, shirt);
      px(g, 7, top + sleeve, m.arm + 1, 1, dark);
    } else {
      px(g, tx - m.arm, top + 1, m.arm, sleeve, shirt);
      px(g, tx + tw, top + 1, m.arm, sleeve, shade(shirt, -0.08));
      px(g, tx - m.arm, top + sleeve, m.arm, 1, dark);
      px(g, tx + tw, top + sleeve, m.arm, 1, dark);
    }
  }
  // ombros: 1px a mais de cada lado nas duas primeiras linhas
  const ox = side ? 0 : 1;
  px(g, tx - ox, top, tw + ox * 2, 2, shirt);
  px(g, tx - ox, top, tw + ox * 2, 1, light);
  // tronco
  px(g, tx, top + 2, tw, h - 2, shirt);
  px(g, tx, top + 2, 1, h - 2, light);
  px(g, tx + tw - 1, top + 2, 1, h - 2, dark);
  // separação entre tronco e braço (senão a camisa vira um bloco só)
  if (!side && m.arm > 0) {
    px(g, tx, top + 2, 1, sleeve - 1, shade(shirt, -0.2));
    px(g, tx + tw - 1, top + 2, 1, sleeve - 1, shade(shirt, -0.2));
  }
  // gola aberta em V, com pele no decote
  const cc = RIG_W / 2;
  px(g, cc - 1, top + 1, 1, 1, dark);
  px(g, cc, top + 1, 1, 1, dark);
  px(g, cc - 2, top + 1, 1, 1, light);
  px(g, cc + 1, top + 1, 1, 1, light);
  px(g, cc - 1, top + 1, 1, 1, shade(opts.skin || "#e8b98c", -0.2));
  px(g, cc - 1, top + 2, 2, 1, light);
  // botões
  if (!side) {
    px(g, cc, top + 3, 1, 1, light);
    px(g, cc, top + Math.round(h * 0.55), 1, 1, light);
  }
  // cinto na cintura, por cima da barra
  px(g, tx, top + h - 1, tw, 1, "#4c3826");
  px(g, cc, top + h - 1, 1, 1, "#d0aa55");

  switch (design) {
    case "plaid": {
      // grade fina e de baixo contraste (não vira faixa na barriga)
      for (let x = tx + 2; x < tx + m.bodyW - 1; x += 3) px(g, x, top + 2, 1, h - 3, shade(shirt, 0.14));
      for (let y = top + 3; y < top + h - 1; y += 3) px(g, tx, y, m.bodyW, 1, shade(shirt, -0.1));
      px(g, tx + 2, top + 3, 1, 1, shade(shirt, 0.24));
      break;
    }
    case "striped":
      for (let y = top + 1; y < top + h - 1; y += 2) px(g, tx, y, m.bodyW, 1, light);
      break;
    case "floral":
      px(g, tx + 1, top + 2, 1, 1, "#fff6e0");
      px(g, tx + m.bodyW - 3, top + 3, 1, 1, "#fff6e0");
      px(g, tx + 2, top + h - 3, 1, 1, "#ffd166");
      px(g, tx + m.bodyW - 2, top + h - 2, 1, 1, "#ffd166");
      break;
    case "bow":
      px(g, 7, top + 1, 2, 1, "#ffffff");
      px(g, 7, top + 2, 2, 1, "#c0505f");
      break;
    case "sweater":
      px(g, tx, top + 2, m.bodyW, 1, light);
      px(g, tx, top + h - 2, m.bodyW, 1, dark);
      break;
    case "hoodie": {
      // gola do capuz (arco) e cordões
      px(g, tx + 2, top + 1, m.bodyW - 4, 1, dark);
      px(g, tx + 1, top + 1, 1, 2, dark);
      px(g, tx + m.bodyW - 2, top + 1, 1, 2, dark);
      px(g, 7, top + 2, 1, 3, shade(shirt, 0.45));
      px(g, 9, top + 2, 1, 2, shade(shirt, 0.45));
      // bolso canguru discreto
      px(g, tx + 2, top + h - 3, Math.max(1, m.bodyW - 4), 1, shade(shirt, -0.16));
      break;
    }
    case "overalls": {
      // camiseta por baixo + jardineira jeans com alças e botões
      const under = opts.undershirt || "#f3e8d3";
      px(g, tx, top + 2, m.bodyW, 1, under);
      px(g, tx + 1, top + 2, 1, 4, shirt);
      px(g, tx + m.bodyW - 2, top + 2, 1, 4, shirt);
      px(g, tx + 2, top + 3, m.bodyW - 4, h - 4, shade(shirt, 0.04));
      px(g, tx + 2, top + 3, m.bodyW - 4, 1, shade(shirt, 0.2));
      px(g, tx + 2, top + 3, 1, 1, "#e8c86a");
      px(g, tx + m.bodyW - 3, top + 3, 1, 1, "#e8c86a");
      px(g, tx + 3, top + 5, Math.max(1, m.bodyW - 6), 1, shade(shirt, -0.2));
      break;
    }
    case "jumpsuit":
      px(g, tx + 1, top + 2, m.bodyW - 2, 1, dark);
      px(g, 7, top, 2, h, shade(shirt, -0.12));
      break;
    case "western":
      px(g, tx + 1, top + 3, 1, 2, "#ffe9a8");
      px(g, tx + m.bodyW - 2, top + 3, 1, 2, "#ffe9a8");
      break;
    case "denim":
      px(g, tx + 1, top + 2, 1, h - 3, light);
      px(g, 7, top + 2, 1, 1, "#ffe9a8");
      break;
    case "cardigan": {
      // camiseta aparecendo no V do peito e cardigã fechado por baixo
      const under = opts.undershirt || "#f4ead6";
      // só o colarinho da camisa aparece (sem "guardanapo" no peito)
      const cc = RIG_W / 2;
      px(g, cc - 1, top + 1, 2, 1, under);
      px(g, cc - 2, top + 1, 1, 2, shade(shirt, -0.3));
      px(g, cc + 1, top + 1, 1, 2, shade(shirt, -0.3));
      px(g, cc - 2, top + 2, 1, 1, light);
      px(g, cc + 1, top + 2, 1, 1, shade(shirt, -0.4));
      // transpasse central discreto (sem faixa clara)
      px(g, cc, top + 4, 1, h - 5, shade(shirt, -0.2));
      px(g, cc, top + 5, 1, 1, "#e2cb96");
      px(g, cc, top + 8, 1, 1, "#e2cb96");
      px(g, tx, top + 2, 1, h - 2, light);
      // tricô: linhas horizontais de baixo contraste
      for (let y = top + 4; y < top + h - 2; y += 3) px(g, tx + 1, y, m.bodyW - 2, 1, shade(shirt, -0.07));
      break;
    }
    case "hearts":
      px(g, tx + 1, top + 3, 1, 1, "#ff8fa3");
      px(g, tx + m.bodyW - 3, top + 5, 1, 1, "#ff8fa3");
      break;
    case "ruffled":
      px(g, tx, top + 1, 1, h - 1, light);
      px(g, tx + m.bodyW - 1, top + 1, 1, h - 1, light);
      px(g, 7, top + 1, 2, 1, "#fff6e0");
      break;
  }
  if (opts.apron) {
    px(g, tx + 1, top + 2, Math.max(1, m.bodyW - 2), h - 3, opts.apron);
    px(g, 7, top + 1, 2, 1, shade(opts.apron, -0.25));
  }
}

// ------------------------------------------------------------------
//  Mãos (por cima da manga, para o braço não parecer um toco)
// ------------------------------------------------------------------
export function drawHands(g, m, dir, frame, skin, skinShade) {
  if (m.bundle || !m.arm) return;
  const L = limbs(m);
  const side = dir === "left" || dir === "right";
  const torsoH = Math.max(2, L.hip - L.shoulder);
  const sleeve = Math.max(2, Math.round(torsoH * 0.5));
  const bob = frame === 1 || frame === 3 ? -1 : 0;
  const swing = frame === 1 ? 1 : frame === 3 ? -1 : 0;
  const handY = L.shoulder + bob + sleeve;
  const tx = RIG_W / 2 - Math.floor(m.bodyW / 2);
  const skinDark = skinShade || shade(skin, -0.16);
  if (side) {
    px(g, RIG_W / 2 - 1, handY, m.arm + 1, 2, skin);
    px(g, RIG_W / 2 - 1, handY + 1, 1, 1, skinDark);
  } else {
    px(g, tx - m.arm, handY + Math.max(0, swing), m.arm, 2, skin);
    px(g, tx + m.bodyW, handY + Math.max(0, -swing), m.arm, 2, shade(skin, -0.05));
    px(g, tx - m.arm, handY + 1 + Math.max(0, swing), m.arm, 1, skinDark);
  }
}

// ------------------------------------------------------------------
//  Cabelo
// ------------------------------------------------------------------
export function drawHairRig(g, m, dir, style, hair, hairDark, opts = {}) {
  if (m.bundle || opts.bald) return;
  if (m.age === "elder" && !opts.keepHairColor) {
    hair = opts.silver || "#c8c3b4";
    hairDark = "#9c978a";
  }
  const L = limbs(m);
  const hw = m.headW, hh = m.headH;
  const hx = RIG_W / 2 - Math.floor(hw / 2);
  const hy = L.headTop + (m.stoop ? 1 : 0);
  const up = dir === "up";
  const side = dir === "left" || dir === "right";
  const back = dir === "right" ? hx : hx + hw - 1; // coluna da nuca na visão lateral
  const light = shade(hair, 0.18);
  const dark = hairDark || shade(hair, -0.25);
  // tampo do cabelo: cobre o alto da cabeça; na visão lateral só a parte de trás desce
  const cap = (depth = 0) => {
    // volume no topo: 1px mais alto, cantos arredondados
    const topY = Math.max(0, hy - 1);
    // topo arredondado: 1px mais alto no centro, sem linha reta
    px(g, hx + 2, topY, hw - 4, 1, hair);
    px(g, hx + 1, hy, hw - 2, 1, hair);
    px(g, hx, hy + 1, hw, 1, hair);
    px(g, hx + 2, topY, 2, 1, light);
    px(g, hx + hw - 3, hy, 1, 1, dark);
    if (!up) {
      // franja: dois dentes de 1px nos cantos, testa livre
      px(g, hx + 1, hy + 1, 1, 1, hair);
      px(g, hx + hw - 2, hy + 1, 1, 1, dark);
      px(g, hx + 3, hy + 1, 1, 1, hair);
    } else {
      px(g, hx, hy + 1, hw, 2, hair);
    }
    if (side) {
      const bx = back === hx ? hx : hx + hw - 2;
      px(g, bx, hy + 2, 2, Math.max(2, Math.round(hh * 0.4)), hair);
      px(g, bx + (back === hx ? 0 : 1), hy + 2, 1, 2, dark);
    } else {
      px(g, hx, hy + 3, 1, Math.max(1, Math.min(3, depth)), hair);
      px(g, hx + hw - 1, hy + 3, 1, Math.max(1, Math.min(3, depth)), dark);
    }
  };
  const drapeDepth = m.age === "baby" ? 0 : Math.max(0, hh - 4);

  switch (style) {
    case "bald": return;
    case "buzz":
    case "undercut":
      px(g, hx + 1, hy, hw - 2, 2, hair);
      px(g, hx + 2, hy, 2, 1, light);
      if (style === "undercut") px(g, hx + (side ? (back === hx ? 0 : hw - 1) : 0), hy + 2, side ? 1 : hw, 1, dark);
      return;
    case "short":
    case "messy":
    case "pixie":
      cap(2);
      if (style === "messy") { px(g, hx + 3, hy - 1, 1, 1, hair); px(g, hx + hw - 4, hy - 1, 1, 1, hair); }
      if (up) px(g, hx + 1, hy, hw - 2, hh - 2, hair);
      return;
    case "spiky":
    case "mullet":
      px(g, hx + 1, hy - 2, 1, 2, hair);
      px(g, hx + 3, hy - 3, 1, 3, hair);
      px(g, hx + 5, hy - 2, 1, 2, hair);
      px(g, hx + 1, hy, hw - 2, 3, hair);
      if (style === "mullet") {
        if (side) px(g, back === hx ? hx : hx + hw - 2, hy + 3, 2, 3, dark);
        else px(g, hx + 1, hy + 3, hw - 2, 3, dark);
      }
      return;
    case "long":
    case "long_masc":
    case "long_wavy_masc":
      cap(0);
      if (side) {
        px(g, back === hx ? hx - 1 : hx + hw - 1, hy + 2, 2, Math.max(4, hh + 2), hair);
        px(g, back === hx ? hx - 1 : hx + hw, hy + hh + 2, 1, Math.max(1, Math.round(m.torsoH * 0.5)), dark);
      } else {
        // mechas caem por fora da cabeça (não cobrem o rosto)
        px(g, hx - 2, hy + 2, 2, Math.max(5, hh), hair);
        px(g, hx + hw, hy + 2, 2, Math.max(5, hh), hair);
        px(g, hx - 2, hy + hh + 2, 1, Math.max(1, Math.round(m.torsoH * 0.45)), dark);
        px(g, hx + hw + 1, hy + hh + 2, 1, Math.max(1, Math.round(m.torsoH * 0.45)), dark);
      }
      px(g, hx + 2, hy + 1, 3, 1, light);
      if (up) px(g, hx, hy, hw, hh + 2, hair);
      return;
    case "bob":
      if (side) {
        px(g, hx, hy - 1, hw, 3, hair);
        px(g, back === hx ? hx - 1 : hx + hw - 1, hy + 1, 2, hh, hair);
        px(g, hx + 1, hy, 2, 1, light);
      } else {
        px(g, hx - 1, hy, hw + 2, 2, hair);
        px(g, hx - 1, hy + 1, 2, hh, hair);
        px(g, hx + hw - 1, hy + 1, 2, hh, hair);
        px(g, hx, hy + hh - 1, hw, 2, hair);
        px(g, hx + 2, hy + 1, 2, 1, light);
      }
      if (up) px(g, hx, hy, hw, hh - 1, hair);
      return;
    case "bun":
    case "updo":
      cap(1);
      px(g, hx + Math.floor(hw / 2) - 1, hy - 3, 3, 3, hair);
      px(g, hx + Math.floor(hw / 2), hy - 3, 1, 1, light);
      if (up) px(g, hx, hy, hw, hh - 2, hair);
      return;
    case "ponytail":
      cap(1);
      if (side) {
        px(g, back === hx ? hx - 2 : hx + hw, hy + 1, 2, 5, hair);
        px(g, back === hx ? hx - 3 : hx + hw + 1, hy + 5, 1, 2, dark);
      } else if (up) {
        px(g, hx + Math.floor(hw / 2) - 1, hy + hh, 2, 5, hair);
        px(g, hx, hy, hw, hh - 1, hair);
      } else {
        px(g, hx + hw - 1, hy + 2, 2, 4, hair);
        px(g, hx + hw, hy + 5, 1, 2, dark);
      }
      return;
    case "bangs":
      cap(0);
      px(g, hx + 1, hy + 2, hw - 2, 1, hair);
      px(g, hx + 2, hy + 2, 2, 1, light);
      return;
    case "side_sweep":
      cap(1);
      px(g, hx + 1, hy + 2, side ? hw - 4 : Math.floor(hw / 2), 1, hair);
      px(g, hx + hw - 3, hy, 2, 1, light);
      return;
    case "twin":
      cap(1);
      px(g, hx - 2, hy + 2, 2, 4, hair);
      px(g, hx + hw, hy + 2, 2, 4, hair);
      px(g, hx - 2, hy + 5, 1, 1, dark);
      px(g, hx + hw + 1, hy + 5, 1, 1, dark);
      if (up) px(g, hx, hy, hw, hh - 2, hair);
      return;
    case "wavy":
      cap(0);
      px(g, hx - 1, hy + 2, 2, 4, hair);
      px(g, hx + hw - 1, hy + 2, 2, 4, hair);
      px(g, hx, hy + 5, 2, 1, dark);
      px(g, hx + hw - 2, hy + 5, 2, 1, dark);
      if (up) px(g, hx, hy, hw, hh - 2, hair);
      return;
    case "braided":
    case "braid_long":
      cap(1);
      px(g, hx + hw - 1, hy + 2, 2, 4, hair);
      px(g, hx + hw, hy + 5, 1, 3, hair);
      px(g, hx + hw, hy + 8, 1, 1, dark);
      if (style === "braided") px(g, hx - 1, hy + 2, 2, 3, hair);
      if (up) px(g, hx, hy, hw, hh - 2, hair);
      return;
    case "curly":
    case "afro_puff":
      px(g, hx - 1, hy - 2, hw + 2, 4, hair);
      px(g, hx - 2, hy, 2, hh - 2, hair);
      px(g, hx + hw, hy, 2, hh - 2, hair);
      px(g, hx + 1, hy - 1, 2, 1, light);
      px(g, hx + hw - 3, hy - 1, 1, 1, light);
      if (side) px(g, back === hx ? hx - 2 : hx + hw, hy + 1, 2, hh - 2, hair);
      if (up) px(g, hx - 1, hy - 1, hw + 2, hh + 2, hair);
      return;
    default:
      cap(drapeDepth);
  }
}

// ------------------------------------------------------------------
//  Chapéus
// ------------------------------------------------------------------
export function drawHatRig(g, m, dir, hat) {
  if (!hat || hat.type === "none" || m.bundle) return;
  const L = limbs(m);
  const hw = m.headW;
  const hx = RIG_W / 2 - Math.floor(hw / 2);
  const hy = L.headTop + (m.stoop ? 1 : 0);
  const c = hat.color || "#c9a86a";
  const c2 = hat.color2 || shade(c, -0.22);
  const dark = shade(c, -0.3);
  const side = dir === "left" || dir === "right";
  switch (hat.type) {
    case "straw":
      px(g, hx - 2, hy - 1, hw + 4, 2, c);
      px(g, hx, hy - 3, hw, 2, c);
      px(g, hx + 1, hy - 3, 2, 1, shade(c, 0.2));
      px(g, hx - 2, hy, hw + 4, 1, dark);
      px(g, hx + 2, hy - 2, Math.max(1, hw - 4), 1, c2);
      return;
    case "cap":
      px(g, hx, hy - 2, hw, 2, c);
      px(g, hx + 1, hy - 3, hw - 2, 1, c);
      if (side) px(g, dir === "right" ? hx + hw : hx - 2, hy - 1, 2, 1, dark);
      else px(g, hx + Math.floor(hw / 2), hy, hw, 1, dark);
      return;
    case "bandana":
      px(g, hx, hy - 2, hw, 3, c);
      px(g, hx + 1, hy - 3, hw - 2, 1, c);
      px(g, hx + hw - 1, hy, 2, 1, c);
      px(g, hx + 2, hy - 2, 1, 1, shade(c, 0.22));
      return;
    case "flower":
      px(g, hx, hy - 2, hw, 2, c);
      px(g, hx + 1, hy - 3, hw - 2, 1, c);
      px(g, hx + hw - 2, hy - 4, 2, 2, c2);
      px(g, hx + hw - 2, hy - 4, 1, 1, "#fff3d6");
      return;
    case "sailor":
      px(g, hx + 1, hy - 2, hw - 2, 2, c);
      px(g, hx + 3, hy - 3, Math.max(1, hw - 6), 1, c);
      px(g, hx + 1, hy, hw - 2, 1, "#2f4a6b");
      return;
    case "goggles":
      px(g, hx + 1, hy - 2, hw - 2, 2, c);
      px(g, hx + 2, hy - 1, 2, 2, "#bfe6f2");
      px(g, hx + hw - 4, hy - 1, 2, 2, "#bfe6f2");
      px(g, hx + 2, hy - 1, 1, 1, "#ffffff");
      return;
    case "wizard":
      px(g, hx + 2, hy - 5, 2, 2, c);
      px(g, hx + 1, hy - 4, hw - 2, 2, c);
      px(g, hx - 1, hy - 2, hw + 2, 2, c);
      px(g, hx - 2, hy, hw + 4, 1, dark);
      px(g, hx + 2, hy - 1, 1, 1, "#ffe9a8");
      return;
    case "cowboy":
      px(g, hx - 2, hy - 1, hw + 4, 2, c);
      px(g, hx + 1, hy, hw - 2, 1, dark);
      px(g, hx + 1, hy - 3, Math.max(1, hw - 2), 2, c);
      px(g, hx + 2, hy - 3, Math.max(1, hw - 4), 1, shade(c, 0.16));
      return;
    default:
      px(g, hx, hy - 2, hw, 2, c);
  }
}

// ------------------------------------------------------------------
//  Ferramentas na mão (pose de ação)
// ------------------------------------------------------------------
export function drawToolRig(g, m, dir, tool) {
  if (!tool || m.bundle) return;
  const L = limbs(m);
  const side = dir === "left" || dir === "right";
  const right = dir === "right";
  const handX = side ? (right ? 12 : 2) : (dir === "up" ? 12 : 3);
  const handY = L.shoulder + Math.round((L.hip - L.shoulder) * 0.55);
  const wood = "#8a6a42", woodD = "#5c452a", metal = "#c9d0d6", metalD = "#8a949c", metalL = "#eef4f8";

  const blade = () => {
    if (tool === "enxada") {
      px(g, handX, handY, 2, 6, wood);
      px(g, handX, handY + 5, 3, 2, metal);
      px(g, handX, handY + 5, 3, 1, metalL);
    } else if (tool === "machado") {
      px(g, handX, handY, 2, 7, wood);
      px(g, handX + 1, handY, 3, 3, metal);
      px(g, handX + 1, handY, 3, 1, metalL);
      px(g, handX + 3, handY + 1, 1, 2, metalD);
    } else if (tool === "picareta") {
      px(g, handX, handY, 2, 7, wood);
      px(g, handX - 1, handY - 1, 5, 2, metal);
      px(g, handX - 1, handY - 1, 2, 1, metalL);
    } else if (tool === "foice") {
      px(g, handX, handY, 2, 6, wood);
      for (let i = 0; i < 5; i++) px(g, handX + 1 + i, handY - 1 + Math.floor(i / 2), 2, 1, metal);
      px(g, handX + 1, handY - 1, 2, 1, metalL);
    } else if (tool === "regador") {
      px(g, handX - 1, handY + 1, 4, 4, "#4a9bc4");
      px(g, handX - 1, handY + 1, 4, 1, "#bfe6f2");
      px(g, handX + 3, handY + 1, 2, 1, "#4a9bc4");
      px(g, handX - 2, handY - 1, 2, 2, "#7fc7e8");
    } else if (tool === "vara") {
      px(g, handX, handY - 6, 1, 14, wood);
      px(g, handX + 1, handY - 6, 3, 1, "#dfe7ea");
      px(g, handX + 3, handY - 5, 1, 3, "#dfe7ea");
      px(g, handX + 3, handY - 2, 1, 1, "#c0392b");
    } else if (tool === "semente") {
      px(g, handX, handY + 2, 2, 2, "#e8d6b0");
      px(g, handX + 1, handY + 2, 1, 1, "#7cb98a");
    }
  };
  if (tool === "vara") {
    // vara de pesca é longa: desenha antes para não cobrir o braço
    blade();
    return;
  }
  blade();
}

// ------------------------------------------------------------------
//  Bengala (idoso)
// ------------------------------------------------------------------
export function drawCane(g, m, dir, color = "#8a6a42") {
  if (m.bundle || !m.arm) return;
  const L = limbs(m);
  const side = dir === "left" || dir === "right";
  const handX = side ? (dir === "right" ? RIG_W - 1 : 1) : (dir === "up" ? RIG_W - 1 : 1);
  const handY = L.shoulder + Math.round((L.hip - L.shoulder) * 0.55);
  const wood = color, woodD = shade(color, -0.3), woodL = shade(color, 0.22);
  px(g, handX, handY + 1, 1, Math.max(2, L.feet - handY - 1), wood);
  px(g, handX, handY + 1, 1, 3, woodL);
  px(g, handX, L.feet - 1, 1, 1, woodD);
  // cabo curvo
  const dirX = handX < 8 ? 1 : -1;
  px(g, handX + dirX, handY, 1, 1, woodL);
  px(g, handX + dirX * 2, handY + (dirX > 0 ? 1 : 1), 1, 1, woodD);
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
    ? (spec.silver || "#c8c3b4")
    : (spec.hair || "#6b4226");
  g.imageSmoothingEnabled = false;
  drawBaseBody(g, m, dir, frame, skin, skinShade, {
    eye: spec.eyeColor,
    beard: spec.beard,
    hair: hairColor,
    blanket: spec.blanket,
  });
  const pantsStyle = spec.pantsStyle || (spec.skirt ? "skirt" : "long");
  drawPants(g, m, dir, frame, spec.pants || "#43506b", skin, pantsStyle, {
    shoe: spec.shoe, shoeDark: spec.shoeDark, shoeLight: spec.shoeLight,
  });
  drawShirt(g, m, dir, frame, spec.shirt || "#e2695e", spec.shirtDark, spec.shirtDesign, {
    apron: spec.apron, skin, undershirt: spec.undershirt,
  });
  drawHands(g, m, dir, frame, skin, skinShade);
  drawHairRig(g, m, dir, spec.hairStyle || "short", hairColor, spec.hairDark, { bald: spec.bald });
  drawHatRig(g, m, dir, spec.hat);
  if (spec.necklace) {
    const L = limbs(m);
    px(g, RIG_W / 2 - 1, L.shoulder, 2, 1, spec.necklace);
  }
  if (spec.cane) drawCane(g, m, dir, spec.cane === true ? "#8a6a42" : spec.cane);
  if (spec.bracelet && m.arm > 0) {
    const L = limbs(m);
    px(g, RIG_W / 2 - Math.floor(m.bodyW / 2) - m.arm, L.shoulder + Math.round((L.hip - L.shoulder) * 0.6), m.arm, 1, spec.bracelet);
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

/** Sprite final 18×33 (px de arte) já com contorno, em cache. */
export function rigSprite(spec, dir, frame, tool = null) {
  const key = `rig2:${JSON.stringify(spec)}:${dir}:${frame}:${tool || ""}`;
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
