// ============================================================
//  Retratos de diálogo — arte própria em 56×56 "pixels de arte",
//  exibida em múltiplo inteiro (112 = 2×) com vizinho mais próximo.
//
//  Não é o sprite do mapa ampliado: o rosto é redesenhado com
//  3,5× mais pixels, então cabe íris, brilho no olho, sobrancelha,
//  textura de cabelo, barba e costura de roupa. O enquadramento é
//  busto (cabeça + ombros), com colo e gola visíveis.
// ============================================================
import { mkCanvas, cached } from "./pixel.js";

export const PORTRAIT_ART = 56;
/** Tamanho de exibição padrão (múltiplo inteiro de 56). */
export const PORTRAIT_SIZE = 112;

const OUT = "#32241a";

function shade(hex, k) {
  if (!hex) return "#000000";
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

/** Silhueta do rosto por idade (mandíbula, bochecha, queixo). */
function faceShape(age) {
  switch (age) {
    case "child": return { w: 26, h: 25, jaw: 0.80, chin: 3, cheek: 3 };
    case "teen": return { w: 24, h: 28, jaw: 0.74, chin: 3, cheek: 2 };
    case "elder": return { w: 25, h: 28, jaw: 0.70, chin: 4, cheek: 4 };
    case "baby": return { w: 24, h: 22, jaw: 0.86, chin: 2, cheek: 4 };
    case "newborn": return { w: 22, h: 20, jaw: 0.90, chin: 1, cheek: 4 };
    default: return { w: 25, h: 29, jaw: 0.68, chin: 4, cheek: 3 };
  }
}

function drawHead(g, spec, age) {
  const skin = spec.skin || "#f6c99b";
  const skinMid = shade(skin, -0.08);
  const skinDark = shade(skin, -0.18);
  const skinLight = shade(skin, 0.12);
  const shape = faceShape(age);
  const cx = 28;
  const top = 17;
  const w = shape.w;
  const h = shape.h;
  const left = cx - Math.floor(w / 2);
  const jawW = Math.round(w * shape.jaw);
  const jawLeft = cx - Math.floor(jawW / 2);

  // pescoço + colo
  px(g, cx - 5, top + h - 3, 10, 7, skinMid);
  px(g, cx - 5, top + h - 3, 2, 7, skinDark);
  px(g, cx + 3, top + h - 3, 2, 7, skinLight);
  px(g, cx - 6, top + h + 3, 12, 3, skinDark);

  // cabeça em três blocos (topo, maçãs do rosto, mandíbula)
  px(g, left + 3, top, w - 6, 3, skin);                 // topo
  px(g, left + 1, top + 3, w - 2, h - 10, skin);       // têmporas/maçãs
  px(g, jawLeft + 1, top + h - 7, jawW - 2, 5, skin);  // mandíbula
  px(g, jawLeft + 3, top + h - 2, jawW - 6, 2, skin);  // queixo
  // orelhas
  px(g, left - 2, top + 12, 3, 6, skinMid);
  px(g, left + w - 1, top + 12, 3, 6, skinMid);
  px(g, left - 1, top + 13, 1, 4, skinDark);
  px(g, left + w, top + 13, 1, 4, skinDark);
  // sombreamento lateral e luz na testa
  px(g, left + 1, top + 4, 2, h - 12, skinDark);
  px(g, left + 4, top + 1, 5, 2, skinLight);
  px(g, cx + 6, top + 6, 3, 8, skinLight);

  const eyeY = top + Math.round(h * 0.42);
  const eyeGap = Math.round(w * 0.30);
  const eye = spec.eyeColor || "#4a3524";
  const eyeLight = shade(eye, 0.45);

  // olhos: esclera, íris, pupila, brilho (2×2 de detalhe)
  for (const side of [-1, 1]) {
    const ex = cx + side * eyeGap - 3;
    px(g, ex, eyeY, 6, 4, "#fdfaf2");         // esclera
    px(g, ex + 1, eyeY, 4, 4, eye);           // íris
    px(g, ex + 2, eyeY + 1, 2, 2, "#1d1611"); // pupila
    px(g, ex + 2, eyeY, 1, 1, "#ffffff");     // brilho
    px(g, ex + 1, eyeY + 3, 4, 1, eyeLight);  // reflexo inferior
    px(g, ex, eyeY - 1, 6, 1, shade(skin, -0.30)); // pálpebra
  }
  // sobrancelhas
  const browCol = shade(spec.hair || "#5a3a20", -0.12);
  const browY = eyeY - 4;
  for (const side of [-1, 1]) {
    const bx = cx + side * eyeGap - 3;
    px(g, bx, browY + (side > 0 ? 0 : 1), 5, 1, shade(browCol, 0.22));
    px(g, bx + (side > 0 ? 1 : 0), browY + 1 + (side > 0 ? 0 : 1), 3, 1, shade(browCol, 0.1));
  }
  // nariz (sombra + luz)
  px(g, cx - 1, eyeY + 4, 2, 4, skinMid);
  px(g, cx - 2, eyeY + 8, 4, 1, skinDark);
  px(g, cx + 1, eyeY + 4, 1, 4, skinLight);
  // boca
  const mouthY = eyeY + 11;
  px(g, cx - 3, mouthY, 7, 1, shade(skin, -0.34));
  px(g, cx - 2, mouthY + 1, 5, 1, shade(skin, -0.16));
  px(g, cx - 1, mouthY + 1, 3, 1, shade("#b5674f", -0.06));
  // bochechas
  px(g, cx - eyeGap - 3, eyeY + 4, 2, 1, "rgba(226,120,110,.30)");
  px(g, cx + eyeGap + 1, eyeY + 4, 2, 1, "rgba(226,120,110,.30)");

  // marcas de idade
  if (age === "elder") {
    px(g, cx + eyeGap - 4, eyeY - 2, 5, 1, shade(skin, -0.22)); // pés de galinha
    px(g, cx - eyeGap - 1, eyeY - 2, 5, 1, shade(skin, -0.22));
    px(g, cx - 5, top + 7, 9, 1, shade(skin, -0.10));            // testa
    px(g, cx - 2, mouthY + 3, 4, 1, shade(skin, -0.18));         // queixo
  }
  if (age === "child" || age === "baby" || age === "newborn") {
    px(g, cx - eyeGap - 3, eyeY + 5, 3, 1, "rgba(230,130,120,.35)");
    px(g, cx + eyeGap + 1, eyeY + 5, 3, 1, "rgba(230,130,120,.35)");
  }
  return { cx, top, w, h, left, eyeY, mouthY };
}

function drawHairPortrait(g, spec, age, head) {
  const style = spec.hairStyle || "short";
  const { cx, top, w, left } = head;
  const hair = age === "elder" ? (spec.silverHair || "#c6c1b3") : (spec.hair || "#5a3a20");
  const dark = age === "elder" ? "#9a958a" : (spec.hairDark || shade(hair, -0.28));
  const light = shade(hair, 0.22);

  if (spec.bald) {
    px(g, left + 2, top + 1, 2, 4, shade(spec.skin || "#f6c99b", 0.1));
    px(g, left - 1, top + 7, 3, 6, dark); // laterais
    px(g, left + w - 2, top + 7, 3, 6, dark);
    return;
  }
  const long = ["long", "long_masc", "long_wavy_masc", "wavy", "braid_long", "braided"].includes(style);
  const bobbed = ["bob", "bangs", "pixie"].includes(style);
  const cropped = ["buzz", "undercut"].includes(style);
  const volume = ["curly", "afro_puff", "twin", "messy", "spiky", "mullet"].includes(style);

  if (cropped) {
    px(g, left + 2, top - 2, w - 4, 5, hair);
    px(g, left + 3, top - 2, 5, 1, light);
    px(g, left + 1, top + 2, 2, 5, hair);
    px(g, left + w - 3, top + 2, 2, 5, hair);
    return;
  }
  // tampo com franja
  px(g, left + 1, top - 3, w - 2, 5, hair);
  px(g, left - 1, top - 1, w + 2, 4, hair);
  px(g, left + 3, top - 3, 6, 2, light);
  px(g, left + w - 9, top - 2, 4, 1, light);
  // franja sobre a testa
  const bangDepth = style === "bangs" || style === "bob" || style === "pixie" ? 5 : 3;
  if (style !== "side_sweep") {
    px(g, left + 2, top + 2, Math.round(w * 0.55), bangDepth, hair);
    px(g, left + 3, top + 2, 4, 1, light);
  } else {
    px(g, left + 2, top + 2, Math.round(w * 0.8), 2, hair);
    px(g, left + w - 10, top + 2, 8, 1, dark);
  }
  // costeletas / laterais
  px(g, left - 2, top + 2, 3, bobbed || long ? 16 : 9, hair);
  px(g, left + w - 1, top + 2, 3, bobbed || long ? 16 : 9, hair);
  px(g, left - 1, top + 4, 1, 10, dark);
  px(g, left + w, top + 4, 1, 10, dark);
  if (volume) {
    px(g, left - 3, top - 2, 4, 6, hair);
    px(g, left + w - 1, top - 2, 4, 6, hair);
    px(g, left + 2, top - 5, w - 4, 3, hair);
    px(g, left + 4, top - 5, 5, 1, light);
  }
  if (long) {
    px(g, left - 3, top + 6, 4, 22, hair);
    px(g, left + w - 1, top + 6, 4, 22, hair);
    px(g, left - 3, top + 20, 2, 8, dark);
    px(g, left + w + 1, top + 20, 2, 8, dark);
  }
  if (bobbed) {
    px(g, left - 3, top + 6, 4, 16, hair);
    px(g, left + w - 1, top + 6, 4, 16, hair);
    px(g, left - 2, top + 20, 3, 2, dark);
    px(g, left + w - 1, top + 20, 3, 2, dark);
  }
  if (style === "ponytail" || style === "twin" || style === "braided") {
    const side = style === "twin" ? [-1, 1] : [1];
    for (const s of side) {
      const x = s > 0 ? left + w + 1 : left - 5;
      px(g, x, top + 8, 4, 14, style === "braided" ? dark : hair);
      px(g, x, top + 14, 4, 2, dark);
      px(g, x, top + 19, 4, 2, dark);
    }
  }
  if (style === "bun" || style === "updo") {
    px(g, cx - 6, top - 9, 12, 7, hair);
    px(g, cx - 5, top - 9, 6, 2, light);
    px(g, cx - 6, top - 3, 12, 2, dark);
  }
  if (style === "mullet" || style === "spiky") {
    for (let i = 0; i < 4; i++) px(g, left + 3 + i * 5, top - 6 - (i % 2), 3, 4, hair);
  }
  // barba
  if (spec.beard) {
    const beard = age === "elder" ? "#ded9cd" : (spec.beardColor || hair);
    px(g, head.left + 3, head.eyeY + 9, w - 6, 7, beard);
    px(g, head.left + 5, head.eyeY + 14, w - 10, 4, beard);
    px(g, head.left + 4, head.eyeY + 10, 3, 5, shade(beard, -0.16));
    px(g, head.cx - 3, head.eyeY + 11, 6, 2, shade("#b5674f", -0.1)); // boca na barba
  }
  if (spec.mustache && !spec.beard) {
    px(g, head.cx - 4, head.mouthY - 2, 8, 1, spec.hair || "#5a3a20");
  }
}

function drawHatPortrait(g, spec, head) {
  const hat = spec.hat;
  if (!hat || hat.type === "none") return;
  const { cx, top, w, left } = head;
  const c = hat.color || "#c9a86a";
  const dark = shade(c, -0.28);
  const light = shade(c, 0.2);
  switch (hat.type) {
    case "straw":
      px(g, left - 10, top - 6, w + 20, 5, c);        // aba
      px(g, left - 10, top - 2, w + 20, 2, dark);
      px(g, left + 2, top - 13, w - 4, 8, c);         // copa
      px(g, left + 4, top - 13, 8, 2, light);
      px(g, left + 1, top - 6, w - 2, 2, shade(c, -0.18)); // fita
      break;
    case "cap":
      px(g, left + 1, top - 9, w - 2, 8, c);
      px(g, left + 3, top - 9, 7, 2, light);
      px(g, left + w - 2, top - 3, 10, 3, dark);      // aba lateral
      px(g, left + 1, top - 2, w - 2, 1, dark);
      break;
    case "bandana":
      px(g, left - 1, top - 7, w + 2, 5, c);
      px(g, left + 3, top - 7, 8, 1, light);
      px(g, left + w - 1, top - 4, 4, 2, c);
      break;
    case "flower":
      px(g, left - 1, top - 6, w + 2, 4, c);
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * 6.28;
        px(g, left + w - 5 + Math.cos(a) * 3, top - 8 + Math.sin(a) * 3, 2, 2, hat.color2 || "#ffc6dd");
      }
      px(g, left + w - 5, top - 8, 2, 2, "#ffe066");
      break;
    case "sailor":
      px(g, left + 2, top - 9, w - 4, 6, c);
      px(g, left + 2, top - 3, w - 4, 2, "#2f4a6b");
      px(g, left + 4, top - 9, 6, 1, "#ffffff");
      break;
    case "goggles":
      px(g, left, top - 7, w, 4, c);
      px(g, left + 2, top - 5, 8, 4, "#bfe6f2");
      px(g, left + w - 10, top - 5, 8, 4, "#bfe6f2");
      px(g, left + 3, top - 5, 3, 1, "#ffffff");
      break;
    case "wizard":
      px(g, left + 7, top - 17, 4, 6, c);
      px(g, left + 2, top - 13, w - 4, 6, c);
      px(g, left - 8, top - 8, w + 16, 3, c);
      px(g, left - 8, top - 5, w + 16, 2, dark);
      px(g, left + 8, top - 14, 2, 2, "#ffe9a8");
      break;
    case "cowboy":
      px(g, left - 9, top - 7, w + 18, 4, c);
      px(g, left - 9, top - 3, w + 18, 2, dark);
      px(g, left + 3, top - 12, w - 6, 6, c);
      px(g, left + 5, top - 12, w - 10, 2, light);
      break;
    default:
      px(g, left, top - 6, w, 4, c);
  }
}

function drawClothesPortrait(g, spec) {
  const shirt = spec.shirt || "#e2695e";
  const shirtDark = spec.shirtDark || shade(shirt, -0.2);
  const light = shade(shirt, 0.12);
  // ombros
  px(g, 3, 47, 50, 9, shirt);
  px(g, 6, 45, 44, 4, shirt);
  px(g, 3, 47, 4, 9, shirtDark);
  px(g, 49, 47, 4, 9, shirtDark);
  px(g, 10, 45, 8, 3, light);
  // gola em V
  px(g, 22, 45, 12, 3, shade(shirt, -0.3));
  px(g, 25, 48, 6, 3, shade(spec.skin || "#f6c99b", -0.05));
  px(g, 24, 45, 2, 8, shirtDark);
  px(g, 30, 45, 2, 8, shade(shirt, -0.12));
  // avental / casaco
  if (spec.apron) {
    px(g, 16, 49, 24, 7, spec.apron);
    px(g, 16, 49, 24, 1, shade(spec.apron, -0.18));
    px(g, 20, 47, 2, 3, shade(spec.apron, -0.18));
    px(g, 34, 47, 2, 3, shade(spec.apron, -0.18));
  }
  if (spec.coatBack) {
    px(g, 3, 45, 6, 11, spec.coatBack);
    px(g, 47, 45, 6, 11, spec.coatBack);
    px(g, 3, 45, 6, 1, shade(spec.coatBack, 0.16));
  }
  if (spec.badge) {
    px(g, 39, 49, 5, 5, "#e8c15c");
    px(g, 40, 50, 3, 3, "#b8901f");
  }
  if (spec.necklace) {
    px(g, 22, 40, 12, 1, spec.necklace);
    px(g, 26, 41, 4, 2, spec.necklace);
  }
}

/**
 * Desenha o retrato em um canvas quadrado.
 * @param {object} spec aparência (mesma do sprite)
 * @param {object} opts { size, background, frame, name }
 */
export function drawPortrait(spec, opts = {}) {
  const size = opts.size || PORTRAIT_SIZE;
  const key = `portrait:${JSON.stringify(spec)}:${size}:${opts.background || ""}`;
  return cached(key, () => {
    const art = mkCanvas(PORTRAIT_ART, PORTRAIT_ART);
    const g = art.getContext("2d");
    g.imageSmoothingEnabled = false;

    // fundo suave (não compite com o rosto)
    const bg = opts.background || "#e9f0d8";
    g.fillStyle = bg;
    g.fillRect(0, 0, PORTRAIT_ART, PORTRAIT_ART);
    g.fillStyle = "rgba(255,255,255,.22)";
    for (let y = 0; y < PORTRAIT_ART; y += 4) {
      for (let x = 0; x < PORTRAIT_ART; x += 4) {
        if (((x / 4) + (y / 4)) % 2 === 0) g.fillRect(x, y, 4, 4);
      }
    }
    g.fillStyle = "rgba(255,255,255,.30)";
    g.beginPath();
    g.arc(28, 26, 22, 0, Math.PI * 2);
    g.fill();

    const age = spec.bodyAge || spec.age || "adult";
    const head = drawHead(g, spec, age);
    drawClothesPortrait(g, spec);
    drawHairPortrait(g, spec, age, head);
    drawHatPortrait(g, spec, head);

    // contorno da silhueta (mesma linguagem do sprite)
    const out = mkCanvas(PORTRAIT_ART, PORTRAIT_ART);
    const og = out.getContext("2d");
    og.imageSmoothingEnabled = false;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, -1], [1, -1], [-1, -1], [0, 1], [1, 1], [-1, 1]]) {
      og.drawImage(art, dx, dy, 1, 1, 0, 0, PORTRAIT_ART - 1, PORTRAIT_ART - 1);
    }
    og.globalCompositeOperation = "source-in";
    og.fillStyle = OUT;
    og.fillRect(0, 0, PORTRAIT_ART, PORTRAIT_ART);
    og.globalCompositeOperation = "source-over";
    og.drawImage(art, 0, 0);

    // escala inteira (112 = 2×, 168 = 3×, 224 = 4×)
    const factor = Math.max(1, Math.round(size / PORTRAIT_ART));
    const canvas = mkCanvas(PORTRAIT_ART * factor, PORTRAIT_ART * factor);
    const cg = canvas.getContext("2d");
    cg.imageSmoothingEnabled = false;
    cg.drawImage(out, 0, 0, canvas.width, canvas.height);
    canvas.dataset.portraitScale = String(factor);
    return canvas;
  });
}

export function portraitCSSSize() {
  return PORTRAIT_SIZE;
}
