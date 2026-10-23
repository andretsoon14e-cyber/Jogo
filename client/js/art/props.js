// ============================================================
//  Cenário: árvores, arbustos, pedras, flores, cercas, postes,
//  bancos, placas, barris, caixas e outros enfeites.
//  Tudo desenhado em "art pixels" (1 unidade) e ampliado 2x,
//  garantindo bordas nítidas de pixel art.
// ============================================================
import { mkCanvas, cached, hash } from "./pixel.js";
import { C, SEASON_ART, PIX, shade, mix } from "./palette.js";

const A = (w, h) => {
  const c = mkCanvas(w, h);
  const g = c.getContext("2d");
  g.imageSmoothingEnabled = false;
  return { c, g };
};
const up = (c) => {
  const o = mkCanvas(c.width * PIX, c.height * PIX);
  const g = o.getContext("2d");
  g.imageSmoothingEnabled = false;
  g.drawImage(c, 0, 0, o.width, o.height);
  return o;
};
const px = (g, x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };

// ----------------------------- ÁRVORES -----------------------------
export function treeParts(season, variant = 0, seed = 1) {
  return cached(`treeparts:${season}:${variant}:${seed % 6}`, () => {
    const t = SEASON_ART[season];
    const r = hash(seed, variant, 7);
    const big = variant % 3 === 0;
    // ---------- tronco (48 x 40 art px) ----------
    const TW = 30, TH = 40;
    const tr = A(TW, TH);
    const tg = tr.g;
    const trunkH = 20 + Math.floor(r * 6);
    const baseY = TH - 2;
    // sombra no chão
    tg.fillStyle = "rgba(28,34,22,.20)";
    tg.beginPath(); tg.ellipse(17, baseY + 1, 13, 4, 0, 0, 6.3); tg.fill();
    // raízes
    px(tg, 10, baseY - 3, 5, 3, C.wood4);
    px(tg, 19, baseY - 3, 5, 3, C.wood4);
    px(tg, 13, baseY - 1, 9, 2, C.wood5);
    // tronco com curvas
    for (let i = 0; i < trunkH; i++) {
      const w = 5 - Math.floor(i / 12);
      const bend = Math.round(Math.sin((i / trunkH) * 1.6) * 1.2);
      const x = 15 + bend - Math.floor(w / 2);
      px(tg, x, baseY - i, w, 1, C.wood3);
      px(tg, x, baseY - i, 1, 1, C.wood2);
      px(tg, x + w - 1, baseY - i, 1, 1, C.wood4);
    }
    // galhos
    px(tg, 10, baseY - trunkH + 4, 5, 2, C.wood3);
    px(tg, 20, baseY - trunkH + 6, 5, 2, C.wood4);
    px(tg, 8, baseY - trunkH + 1, 4, 2, C.wood3);
    // ---------- copa (54 x 50) ----------
    const CW = 44, CH = 42;
    const cp = A(CW, CH);
    const cg = cp.g;
    const shape = variant % 3;           // 0 = redonda, 1 = alta, 2 = pinheiro
    const R0 = shape === 2 ? (big ? 13 : 11) : (big ? 16.5 : 13.5);
    const cx = CW / 2, cy = CH * (shape === 2 ? 0.62 : 0.58);
    const blob = (ox, oy, rad, col) => {
      cg.fillStyle = col;
      for (let dy = -rad; dy <= rad; dy++) {
        const w = Math.floor(Math.sqrt(Math.max(0, rad * rad - dy * dy)));
        cg.fillRect(Math.round(cx + ox - w), Math.round(cy + oy + dy), w * 2, 1);
      }
    };
    if (shape === 2) {
      // pinheiro: três triângulos empilhados, com contorno escuro
      const tiers = [
        { base: R0 * 1.15, top: 26, bottom: 34, col: t.leaf[3], dark: t.leaf[4] || t.leaf[3] },
        { base: R0 * 0.95, top: 20, bottom: 27, col: t.leaf[2], dark: t.leaf[3] },
        { base: R0 * 0.72, top: 13, bottom: 21, col: t.leaf[1], dark: t.leaf[2] },
        { base: R0 * 0.48, top: 6, bottom: 14, col: t.leaf[0], dark: t.leaf[1] },
      ];
      for (const T1 of tiers) {
        const hgt = T1.bottom - T1.top;
        for (let i = 0; i <= hgt; i++) {
          const k = i / hgt;
          const w = Math.max(1, Math.round(T1.base * (0.28 + k * 0.72)));
          cg.fillStyle = T1.dark;
          cg.fillRect(Math.round(cx - w), Math.round(cy - T1.top + i), w * 2, 1);
        }
        for (let i = 0; i <= hgt - 2; i++) {
          const k = i / hgt;
          const w = Math.max(1, Math.round(T1.base * (0.20 + k * 0.62)));
          cg.fillStyle = T1.col;
          cg.fillRect(Math.round(cx - w), Math.round(cy - T1.top + i), w * 2 - 2, 1);
        }
        // luz vinda da esquerda
        for (let i = 0; i <= hgt - 4; i++) {
          const k = i / hgt;
          const w = Math.max(1, Math.round(T1.base * (0.20 + k * 0.62)));
          cg.fillStyle = shade(T1.col, 0.14);
          cg.fillRect(Math.round(cx - w), Math.round(cy - T1.top + i), Math.max(1, Math.round(w * 0.35)), 1);
        }
      }
      if (season === 3) {
        for (let i = 0; i < 10; i++) {
          cg.fillStyle = "rgba(255,255,255,.8)";
          const w = Math.round(R0 * (0.9 - i * 0.07));
          cg.fillRect(Math.round(cx - w + 2), Math.round(cy - 30 + i * 3), 4, 2);
        }
      }
    } else if (shape === 1) {
      // copa alta e cheia (choupo)
      blob(0, 8, R0 * 0.92, t.leaf[3]);
      blob(0, 2, R0 * 0.86, t.leaf[2]);
      blob(-1, -4, R0 * 0.72, t.leaf[1]);
      blob(-2, -9, R0 * 0.54, t.leaf[0]);
      blob(-3, -13, R0 * 0.32, shade(t.leaf[0], 0.12));
    } else {
      // copa redonda cheia
      blob(0, 3, R0, t.leaf[3]);
      blob(1, 6, R0 * 0.8, t.leaf[4] || t.leaf[3]);
      blob(-1, 0, R0 * 0.94, t.leaf[2]);
      blob(-2, -3, R0 * 0.76, t.leaf[1]);
      blob(-4, -6, R0 * 0.5, t.leaf[0]);
      blob(-7, -8, R0 * 0.26, shade(t.leaf[0], 0.14));
    }
    // aglomerados na borda (silhueta irregular, menores = menos "couve-flor")
    for (let i = 0; i < 22; i++) {
      const a = hash(seed, i, 11) * 6.28;
      const rr = R0 * (0.9 + hash(i, seed, 12) * 0.2);
      const fx = Math.round(cx + Math.cos(a) * rr);
      const fy = Math.round(cy + Math.sin(a) * rr * 0.82 + 3);
      const col = i % 3 === 0 ? t.leaf[1] : (i % 3 === 1 ? t.leaf[2] : t.leaf[3]);
      cg.fillStyle = col;
      cg.fillRect(fx - 2, fy - 1, 4, 3);
    }
    // sombra de baixo (volume)
    cg.fillStyle = "rgba(26,44,24,.22)";
    for (let i = 0; i < 7; i++) {
      const fx = Math.round(cx - R0 * 0.75 + i * (R0 * 0.25));
      cg.fillRect(fx, Math.round(cy + R0 * 0.62), Math.round(R0 * 0.22), 3);
    }
    // sombra interna (parte de baixo da copa)
    cg.fillStyle = "rgba(30,44,26,.16)";
    for (let i = 0; i < 8; i++) {
      cg.fillRect(Math.round(cx - R0 + 4 + i * 5), Math.round(cy + R0 * 0.55 + (i % 2)), 5, 3);
    }
    // detalhes sazonais
    if (season === 0) {
      for (let i = 0; i < 5; i++) {
        const a = hash(i, seed, 13) * 6.28, rr = R0 * (0.30 + hash(seed, i, 14) * 0.55);
        const fx = Math.round(cx + Math.cos(a) * rr), fy = Math.round(cy + Math.sin(a) * rr * 0.8);
        cg.fillStyle = i % 2 ? "#ffe3ee" : "#fff6cc";
        cg.fillRect(fx, fy, 2, 2);
      }
    } else if (season === 2) {
      for (let i = 0; i < 8; i++) {
        const a = hash(i, seed, 17) * 6.28, rr = R0 * (0.25 + hash(seed, i, 18) * 0.6);
        const fx = Math.round(cx + Math.cos(a) * rr), fy = Math.round(cy + Math.sin(a) * rr * 0.8);
        cg.fillStyle = i % 2 ? "#e8743f" : "#f2b03f";
        cg.fillRect(fx, fy, 4, 4);
        cg.fillStyle = "rgba(255,220,150,.5)";
        cg.fillRect(fx + 1, fy, 2, 1);
      }
    } else if (season === 3) {
      for (let i = 0; i < 10; i++) {
        const a = hash(i, seed, 19) * 6.28, rr = R0 * (0.3 + hash(seed, i, 20) * 0.62);
        const fx = Math.round(cx + Math.cos(a) * rr), fy = Math.round(cy + Math.sin(a) * rr * 0.8 - 3);
        cg.fillStyle = "rgba(255,255,255,.9)";
        cg.fillRect(fx - 2, fy, 6, 2);
        cg.fillRect(fx - 1, fy + 2, 4, 1);
      }
    }
    return {
      trunk: up(tr.c), canopy: up(cp.c),
      trunkW: TW * PIX, trunkH: TH * PIX,
      canopyW: CW * PIX, canopyH: CH * PIX,
      canopyOffsetY: -(trunkH + (shape === 2 ? 4 : shape === 1 ? 10 : (big ? 20 : 15))) * PIX,
      shape,
      sway: big ? 1.0 : 0.75,
    };
  });
}

/** sprite único (usado em contextos simples) */
export function treeSprite(season, variant = 0, seed = 1) {
  return cached(`treefull:${season}:${variant}:${seed % 6}`, () => {
    const p = treeParts(season, variant, seed);
    const w = Math.max(p.trunkW, p.canopyW);
    const h = p.trunkH + Math.abs(p.canopyOffsetY) + 8;
    const c = mkCanvas(w + 16, h);
    const g = c.getContext("2d");
    g.imageSmoothingEnabled = false;
    g.drawImage(p.trunk, (w + 16 - p.trunkW) / 2, h - p.trunkH);
    g.drawImage(p.canopy, (w + 16 - p.canopyW) / 2, h - p.trunkH + p.canopyOffsetY + 8);
    return c;
  });
}

// ----------------------------- ARBUSTO -----------------------------
export function bushSprite(season, seed = 0) {
  return cached(`bush:${season}:${seed % 5}`, () => {
    const t = SEASON_ART[season];
    const { c, g } = A(16, 12);
    const blob = (cx, cy, rad, col) => {
      for (let y = -rad; y <= rad; y++) {
        const w = Math.floor(Math.sqrt(Math.max(0, rad * rad - y * y)));
        px(g, cx - w, cy + y, w * 2, 1, col);
      }
    };
    blob(8, 7, 6, t.leaf[3]);
    blob(7, 6, 5, t.leaf[2]);
    blob(5, 5, 3, t.leaf[1]);
    blob(10, 9, 3, t.leaf[3]);
    if (season === 0) { px(g, 5, 5, 1, 1, "#ffd0e0"); px(g, 10, 6, 1, 1, "#fff3c4"); px(g, 8, 4, 1, 1, "#ffd0e0"); }
    if (season === 2) { px(g, 6, 6, 1, 1, "#e8743f"); px(g, 10, 7, 1, 1, "#f0a63f"); }
    if (season === 3) { px(g, 6, 3, 4, 1, "rgba(255,255,255,.9)"); px(g, 4, 5, 2, 1, "rgba(255,255,255,.7)"); }
    return up(c);
  });
}

// ----------------------------- PEDRAS -----------------------------
export function rockSprite(seed = 0) {
  return cached(`rock:${seed % 6}`, () => {
    const { c, g } = A(14, 10);
    const blob = (cx, cy, rad, col) => {
      for (let y = -rad; y <= rad; y++) {
        const w = Math.floor(Math.sqrt(Math.max(0, rad * rad - y * y)));
        px(g, cx - w, cy + y, w * 2, 1, col);
      }
    };
    blob(7, 6, 5, C.stone3);
    blob(6, 5, 4, C.stone2);
    blob(5, 4, 2, C.stone1);
    px(g, 9, 8, 3, 1, C.stone4);
    px(g, 4, 3, 2, 1, C.stone0);
    // musgo
    px(g, 3, 8, 2, 1, "#6f9a4e");
    return up(c);
  });
}

// ----------------------------- FLORES / TUFOS -----------------------------
export function flowerSprite(season, kind = 0) {
  return cached(`flower:${season}:${kind % 4}`, () => {
    const t = SEASON_ART[season];
    const { c, g } = A(9, 9);
    px(g, 4, 5, 1, 4, t.tuft[1]);
    px(g, 3, 6, 1, 2, t.tuft[0]);
    px(g, 5, 6, 1, 2, t.tuft[1]);
    const petal = t.flowers[kind % t.flowers.length];
    px(g, 3, 2, 3, 3, petal);
    px(g, 2, 3, 1, 1, petal); px(g, 6, 3, 1, 1, petal);
    px(g, 4, 3, 1, 1, "#e8a63c");
    return up(c);
  });
}

export function grassTuftSprite(season, kind = 0) {
  return cached(`tuft:${season}:${kind % 4}`, () => {
    const t = SEASON_ART[season];
    const { c, g } = A(10, 7);
    const c1 = t.tuft[0], c2 = t.tuft[1];
    px(g, 1, 4, 1, 3, c2); px(g, 2, 2, 1, 5, c1); px(g, 3, 4, 1, 3, c2);
    px(g, 5, 1, 1, 6, c1); px(g, 6, 3, 1, 4, c2);
    px(g, 8, 2, 1, 5, c1); px(g, 7, 5, 1, 2, c2);
    return up(c);
  });
}

// ----------------------------- CERCA -----------------------------
export function fenceSprite(season, mask = 0b1111) {
  return cached(`fence:${season}:${mask}`, () => {
    const { c, g } = A(16, 16);
    // Stardew-like short wooden fence with pointed posts, horizontal planks
    // posts with highlight
    px(g, 2, 3, 3, 12, C.wood3);
    px(g, 2, 3, 1, 12, C.wood1);
    px(g, 4, 3, 1, 12, C.wood4);
    px(g, 2, 2, 3, 2, C.wood2); // pointed top
    px(g, 3, 1, 1, 2, C.wood1);
    px(g, 11, 3, 3, 12, C.wood3);
    px(g, 11, 3, 1, 12, C.wood1);
    px(g, 13, 3, 1, 12, C.wood4);
    px(g, 11, 2, 3, 2, C.wood2);
    px(g, 12, 1, 1, 2, C.wood1);
    // horizontal rails - more rounded
    px(g, 3, 6, 10, 2, C.wood2);
    px(g, 3, 6, 10, 1, C.wood1);
    px(g, 3, 10, 10, 2, C.wood3);
    px(g, 3, 10, 10, 1, C.wood2);
    // nails
    px(g, 4, 7, 1, 1, C.wood4);
    px(g, 12, 7, 1, 1, C.wood4);
    // sombra
    px(g, 1, 15, 14, 1, "rgba(30,24,16,.22)");
    px(g, 3, 16, 10, 1, "rgba(30,24,16,.12)");
    return up(c);
  });
}
export function stoneWallSprite() {
  return cached("stonewall", () => {
    const { c, g } = A(16, 16);
    // Stone wall like Stardew farm borders (gray stones with mortar)
    px(g, 0, 0, 16, 16, C.stone3);
    for (let y=0;y<16;y+=4) {
      const off = (y/4)%2 ? 0 : 4;
      for (let x=off;x<16;x+=8) {
        px(g, x, y, 8, 4, C.stone2);
        px(g, x, y, 8, 1, C.stone1);
        px(g, x, y+3, 8, 1, C.stone4);
        px(g, x, y, 1, 4, C.stone1);
      }
    }
    px(g, 0, 15, 16, 1, "rgba(30,24,16,.22)");
    return up(c);
  });
}

// ----------------------------- POSTE DE LUZ -----------------------------
export function lampSprite() {
  return cached("lamp", () => {
    const { c, g } = A(14, 30);
    px(g, 6, 6, 2, 21, "#4a4038");
    px(g, 6, 6, 1, 21, "#6b5c4c");
    px(g, 4, 26, 6, 2, "#3a322b");
    px(g, 3, 27, 8, 2, "#2e2822");
    // lanterna
    px(g, 3, 3, 8, 3, "#2f2a24");
    px(g, 4, 6, 6, 6, "#3a332c");
    px(g, 5, 7, 4, 4, "#ffe9a8");
    px(g, 6, 8, 2, 2, "#fff6d0");
    px(g, 4, 12, 6, 1, "#2f2a24");
    px(g, 6, 0, 2, 3, "#3a332c");
    return up(c);
  });
}

export function lampGlow() {
  return cached("lampGlow", () => {
    const s = 128;
    const c = mkCanvas(s, s);
    const g = c.getContext("2d");
    const grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    grd.addColorStop(0, "rgba(255,214,120,.55)");
    grd.addColorStop(0.45, "rgba(255,190,90,.18)");
    grd.addColorStop(1, "rgba(255,180,80,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, s, s);
    return c;
  });
}

// ----------------------------- BANCO -----------------------------
export function benchSprite() {
  return cached("bench", () => {
    const { c, g } = A(22, 14);
    px(g, 1, 3, 20, 3, C.wood2);
    px(g, 1, 3, 20, 1, C.wood1);
    px(g, 1, 7, 20, 3, C.wood3);
    px(g, 1, 7, 20, 1, C.wood2);
    px(g, 2, 10, 2, 4, C.wood4); px(g, 18, 10, 2, 4, C.wood4);
    px(g, 1, 13, 20, 1, "rgba(30,24,16,.2)");
    // detalhe metálico
    px(g, 0, 5, 2, 1, "#5a5a55"); px(g, 20, 5, 2, 1, "#5a5a55");
    return up(c);
  });
}

// ----------------------------- PLACA / CAIXA DE CORREIO -----------------------------
export function signSprite(text = "") {
  return cached("sign:" + text, () => {
    const { c, g } = A(22, 20);
    px(g, 10, 8, 2, 11, C.wood3);
    px(g, 2, 2, 18, 8, C.wood2);
    px(g, 2, 2, 18, 1, C.wood1);
    px(g, 2, 9, 18, 1, C.wood4);
    px(g, 4, 4, 14, 4, "#e8d6b0");
    return up(c);
  });
}

export function mailboxSprite() {
  return cached("mailbox", () => {
    const { c, g } = A(12, 20);
    px(g, 5, 8, 2, 11, C.wood4);
    px(g, 2, 3, 8, 6, "#c94f45");
    px(g, 2, 3, 8, 2, "#e2695e");
    px(g, 2, 8, 8, 1, "#8f3129");
    px(g, 9, 1, 1, 4, "#e8c15c");
    px(g, 9, 1, 2, 2, "#e8c15c");
    return up(c);
  });
}

// ----------------------------- BARRIL / CAIXA / VASO -----------------------------
export function barrelSprite() {
  return cached("barrel", () => {
    const { c, g } = A(12, 14);
    px(g, 1, 2, 10, 11, C.wood3);
    px(g, 1, 2, 10, 1, C.wood2);
    px(g, 1, 4, 10, 1, "#6a6157"); px(g, 1, 10, 10, 1, "#6a6157");
    px(g, 2, 3, 1, 10, C.wood2);
    px(g, 9, 3, 1, 10, C.wood4);
    px(g, 3, 5, 6, 1, C.wood4); px(g, 3, 8, 6, 1, C.wood4);
    px(g, 0, 13, 12, 1, "rgba(30,24,16,.2)");
    return up(c);
  });
}

export function crateSprite() {
  return cached("crate", () => {
    const { c, g } = A(12, 12);
    px(g, 1, 1, 10, 10, C.wood2);
    px(g, 1, 1, 10, 1, C.wood1);
    px(g, 1, 10, 10, 1, C.wood4);
    px(g, 1, 1, 1, 10, C.wood3); px(g, 10, 1, 1, 10, C.wood4);
    px(g, 2, 2, 8, 1, C.wood3); px(g, 2, 9, 8, 1, C.wood3);
    px(g, 2, 5, 8, 1, "#d9b06a");
    return up(c);
  });
}

export function potSprite(season = 0) {
  return cached("pot:" + season, () => {
    const { c, g } = A(10, 12);
    px(g, 1, 6, 8, 5, "#b5623f");
    px(g, 1, 6, 8, 1, "#d1784f");
    px(g, 2, 10, 6, 1, "#8c452c");
    px(g, 3, 3, 4, 3, SEASON_ART[season].leaf[2]);
    px(g, 2, 4, 2, 2, SEASON_ART[season].leaf[1]);
    if (season === 0) { px(g, 4, 2, 2, 1, "#ffd0e0"); px(g, 6, 3, 1, 1, "#fff3c4"); }
    return up(c);
  });
}

// ----------------------------- POÇO / FONTE -----------------------------
export function wellSprite() {
  return cached("well", () => {
    const { c, g } = A(28, 30);
    px(g, 2, 24, 24, 4, C.stone3);
    px(g, 2, 24, 24, 1, C.stone1);
    px(g, 4, 16, 20, 9, C.stone2);
    px(g, 4, 16, 20, 1, C.stone1);
    px(g, 4, 16, 1, 9, C.stone1); px(g, 23, 16, 1, 9, C.stone4);
    for (let y = 18; y < 24; y += 3) px(g, 5, y, 18, 1, C.stone3);
    px(g, 8, 19, 12, 4, "#3f6a80");
    px(g, 9, 20, 10, 1, "#6fa7bd");
    // telhado
    px(g, 6, 2, 2, 15, C.wood3); px(g, 20, 2, 2, 15, C.wood3);
    px(g, 3, 2, 22, 3, C.roof1);
    px(g, 4, 0, 20, 2, C.roof0);
    px(g, 3, 5, 22, 1, C.roof2);
    px(g, 12, 5, 4, 8, C.wood2);
    px(g, 13, 8, 2, 3, "#6b5240");
    return up(c);
  });
}

export function fountainSprite() {
  return cached("fountain", () => {
    const { c, g } = A(40, 38);
    // sombra no chão
    g.fillStyle = "rgba(30,26,18,.18)";
    g.beginPath(); g.ellipse(20, 34, 19, 5, 0, 0, 6.3); g.fill();
    // base octogonal
    for (let i = 0; i < 6; i++) px(g, 2 + i, 26 + i, 36 - i * 2, 2, i < 2 ? C.stone1 : C.stone3);
    // borda externa
    px(g, 4, 22, 32, 5, C.stone2);
    px(g, 4, 22, 32, 2, C.stone1);
    px(g, 4, 26, 32, 1, C.stone4);
    // água
    px(g, 7, 24, 26, 4, "#4a9bc4");
    px(g, 8, 24, 24, 2, "#7fc7e8");
    px(g, 10, 25, 8, 1, "#c9eefc");
    px(g, 22, 26, 9, 1, "#a8dcef");
    // coluna central
    px(g, 18, 12, 4, 12, C.stone2);
    px(g, 18, 12, 1, 12, C.stone1);
    px(g, 21, 12, 1, 12, C.stone3);
    // taça superior
    px(g, 14, 9, 12, 3, C.stone1);
    px(g, 14, 9, 12, 1, C.stone0);
    px(g, 12, 11, 16, 2, C.stone2);
    // bacia superior com água
    px(g, 15, 8, 10, 2, "#7fc7e8");
    // jato central
    px(g, 19, 3, 2, 6, "#dff6ff");
    px(g, 17, 5, 1, 4, "#bfe6f8");
    px(g, 22, 5, 1, 4, "#bfe6f8");
    px(g, 19, 1, 2, 2, "#f2fbff");
    // quedas d'água nas laterais
    px(g, 12, 13, 1, 8, "rgba(200,240,255,.65)");
    px(g, 27, 13, 1, 8, "rgba(200,240,255,.65)");
    // detalhes da borda
    for (let i = 0; i < 4; i++) { px(g, 6 + i * 9, 27, 3, 1, C.stone1); }
    return up(c);
  });
}

// ----------------------------- ESTÁTUA / MONUMENTO -----------------------------
export function statueSprite() {
  return cached("statue", () => {
    const { c, g } = A(18, 26);
    px(g, 2, 20, 14, 5, C.stone2);
    px(g, 2, 20, 14, 1, C.stone1);
    px(g, 4, 17, 10, 3, C.stone1);
    px(g, 7, 6, 4, 11, C.stone1);
    px(g, 7, 6, 1, 11, C.stone0);
    px(g, 5, 9, 2, 3, C.stone1); px(g, 11, 8, 2, 4, C.stone1);
    px(g, 6, 2, 6, 5, C.stone1);
    px(g, 6, 2, 6, 1, C.stone0);
    px(g, 13, 2, 1, 9, C.stone2);
    px(g, 2, 25, 14, 1, "rgba(30,24,16,.2)");
    return up(c);
  });
}

// ----------------------------- BANDEIRA / POSTE -----------------------------
export function flagSprite() {
  return cached("flag", () => {
    const { c, g } = A(10, 26);
    px(g, 4, 2, 1, 23, C.wood4);
    px(g, 5, 2, 1, 23, C.wood3);
    px(g, 5, 2, 4, 6, "#e2695e");
    px(g, 5, 4, 4, 2, "#fff3d6");
    px(g, 1, 25, 8, 1, "rgba(30,24,16,.2)");
    return up(c);
  });
}

// ----------------------------- PILHA DE LENHA / FARDO -----------------------------
export function logPileSprite() {
  return cached("logs", () => {
    const { c, g } = A(18, 14);
    for (let i = 0; i < 3; i++) {
      px(g, 1 + i * 5, 6, 4, 7, C.wood3);
      px(g, 1 + i * 5, 6, 4, 1, C.wood1);
      px(g, 2 + i * 5, 8, 2, 3, C.wood4);
    }
    for (let i = 0; i < 2; i++) {
      px(g, 4 + i * 5, 2, 4, 5, C.wood2);
      px(g, 4 + i * 5, 2, 4, 1, C.wood0);
    }
    px(g, 0, 13, 18, 1, "rgba(30,24,16,.2)");
    return up(c);
  });
}

export function haySprite() {
  return cached("hay", () => {
    const { c, g } = A(16, 12);
    px(g, 1, 3, 14, 8, "#d9b25e");
    px(g, 1, 3, 14, 1, "#efd287");
    px(g, 1, 10, 14, 1, "#b08a3c");
    for (let i = 2; i < 14; i += 3) px(g, i, 4, 1, 6, "#c9a24c");
    px(g, 0, 11, 16, 1, "rgba(30,24,16,.2)");
    return up(c);
  });
}

// ----------------------------- ESPANTALHO -----------------------------
export function scarecrowSprite() {
  return cached("scarecrow", () => {
    const { c, g } = A(16, 28);
    px(g, 7, 8, 2, 19, C.wood3);
    px(g, 1, 12, 14, 2, C.wood2);
    px(g, 4, 8, 8, 8, "#c96a4a");
    px(g, 4, 8, 8, 1, "#e08a62");
    px(g, 3, 2, 10, 6, "#dfc28a");
    px(g, 3, 2, 10, 1, "#efd7a4");
    px(g, 2, 1, 12, 2, C.wood3);
    px(g, 5, 5, 1, 1, "#3a2a20"); px(g, 9, 5, 1, 1, "#3a2a20");
    px(g, 7, 6, 2, 1, "#3a2a20");
    px(g, 13, 13, 1, 4, "#d9b25e"); px(g, 2, 13, 1, 4, "#d9b25e");
    return up(c);
  });
}

// ----------------------------- PONTE / DOCA -----------------------------
export function pierSprite() {
  return cached("pier", () => {
    const { c, g } = A(32, 18);
    px(g, 0, 4, 32, 10, C.wood2);
    for (let i = 0; i < 8; i++) px(g, i * 4, 4, 3, 10, C.wood1);
    for (let i = 0; i < 8; i++) px(g, i * 4 + 3, 4, 1, 10, C.wood3);
    px(g, 0, 4, 32, 1, C.wood0);
    px(g, 0, 13, 32, 1, C.wood4);
    px(g, 4, 14, 2, 4, C.wood3); px(g, 26, 14, 2, 4, C.wood3);
    return up(c);
  });
}

// ----------------------------- COQUEIRO (ilha) -----------------------------
export function palmSprite(season = 0, seed = 0) {
  return cached(`palm:${season}:${seed % 6}`, () => {
    const { c, g } = A(30, 44);
    const baseY = 42;
    const trunkH = 26 + (seed % 4);
    // tronco curvo
    for (let i = 0; i < trunkH; i++) {
      const bend = Math.round(Math.sin((i / trunkH) * 1.2) * 3);
      px(g, 14 + bend, baseY - i, 3, 1, i % 4 === 0 ? C.wood4 : C.wood3);
      px(g, 14 + bend, baseY - i, 1, 1, C.wood2);
    }
    const tx = 15 + Math.round(Math.sin(1.2) * 3), ty = baseY - trunkH;
    // folhas
    const leaf = SEASON_ART[season].leaf;
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      for (let j = 2; j < 13; j++) {
        const x = Math.round(tx + Math.cos(a) * j);
        const y = Math.round(ty + Math.sin(a) * j * 0.55 + (j * j) / 90);
        px(g, x, y, 2, 1, j % 3 === 0 ? leaf[1] : leaf[2]);
      }
    }
    px(g, tx - 1, ty - 1, 3, 2, leaf[3]);
    // cocos
    px(g, tx - 3, ty + 3, 2, 2, "#8a5a33");
    px(g, tx + 2, ty + 4, 2, 2, "#6f4526");
    px(g, 12, baseY, 12, 1, "rgba(30,24,16,.22)");
    return up(c);
  });
}
