// ============================================================
//  Construções — desenho procedural detalhado em pixel art.
//  Cada prédio tem silhueta, materiais, telhado e enfeites
//  próprios. Sprites são cacheados por prédio + estação.
// ============================================================
import { mkCanvas, cached } from "./pixel.js";
import { C, PIX, SEASON_ART, shade, alpha, mix } from "./palette.js";

const ART = (w, h) => {
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
const R = (g, x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };

// ---------- materiais de parede ----------
function wallPlaster(g, x, y, w, h, base, shadow) {
  R(g, x, y, w, h, base);
  R(g, x, y, w, 1, shade(base, 0.25));
  R(g, x + w - 1, y, 1, h, shadow);
  R(g, x, y + h - 1, w, 1, shadow);
  // manchas sutis
  for (let i = 0; i < Math.floor(w / 8); i++) {
    const px = x + 3 + ((i * 13) % Math.max(1, w - 6));
    const py = y + 3 + ((i * 7) % Math.max(1, h - 6));
    R(g, px, py, 2, 1, alpha(shadow, 0.18));
  }
}
function wallPlanks(g, x, y, w, h, base, dark) {
  R(g, x, y, w, h, base);
  for (let yy = y; yy < y + h; yy += 4) {
    R(g, x, yy, w, 1, dark);
    R(g, x, yy + 1, w, 1, shade(base, 0.12));
  }
  R(g, x, y, 1, h, shade(base, 0.2));
  R(g, x + w - 1, y, 1, h, dark);
}
function wallBricks(g, x, y, w, h, base, dark) {
  R(g, x, y, w, h, base);
  for (let yy = y; yy < y + h; yy += 4) {
    R(g, x, yy, w, 1, dark);
    const off = ((yy - y) / 4) % 2 ? 4 : 0;
    for (let xx = x + off; xx < x + w; xx += 8) R(g, xx, yy, 1, 4, dark);
  }
  R(g, x, y, 1, h, shade(base, 0.12));
  R(g, x + w - 1, y, 1, h, dark);
}
function wallStone(g, x, y, w, h, base, dark) {
  R(g, x, y, w, h, base);
  for (let yy = y + 3; yy < y + h; yy += 5) {
    R(g, x, yy, w, 1, dark);
    const off = ((yy - y) / 5) % 2 ? 3 : 0;
    for (let xx = x + off; xx < x + w; xx += 7) R(g, xx, yy - 4, 1, 4, dark);
  }
  for (let i = 0; i < w * h / 40; i++) {
    R(g, x + 2 + ((i * 11) % Math.max(1, w - 3)), y + 2 + ((i * 17) % Math.max(1, h - 3)), 2, 1, shade(base, 0.16));
  }
}

// ---------- telhado ----------
function gableRoof(g, x, y, w, h, cols, opts = {}) {
  const [c0, c1, c2] = cols;
  const half = Math.floor(w / 2);
  // duas águas: trapézio com inclinação
  for (let i = 0; i < h; i++) {
    const inset = Math.round((1 - i / h) * (half * 0.62));
    R(g, x + inset, y + i, w - inset * 2, 1, i < 2 ? c0 : c1);
    // fiadas de telha
    if (i % 3 === 2) {
      R(g, x + inset, y + i, w - inset * 2, 1, c2);
      for (let xx = x + inset + 2; xx < x + w - inset - 2; xx += 5) {
        R(g, xx, y + i, 2, 1, shade(c2, 0.16));
      }
    }
  }
  // cumeeira (linha clara no topo, com "remate")
  R(g, x + Math.round(half * 0.36), y, Math.round(w * 0.28) + 1, 2, shade(c0, 0.22));
  R(g, x + Math.round(half * 0.30), y - 1, Math.round(w * 0.40), 1, shade(c0, 0.05));
  // beiral: sombra forte + telhas recortadas embaixo
  const eaveY = y + h - 1;
  R(g, x - 3, eaveY, w + 6, 2, shade(c1, -0.30));
  R(g, x - 3, eaveY, w + 6, 1, shade(c0, 0.10));
  for (let xx = x - 3; xx < x + w + 3; xx += 3) {
    R(g, xx, eaveY + 2, 2, 1, shade(c1, -0.42));
  }
  R(g, x - 3, eaveY + 3, w + 6, 1, "rgba(38,28,18,.20)");
}

function hipRoof(g, x, y, w, h, cols) {
  const [c0, c1, c2] = cols;
  for (let i = 0; i < h; i++) {
    const inset = Math.round((1 - i / h) * (w * 0.34));
    R(g, x + inset, y + i, w - inset * 2, 1, i < 2 ? c0 : c1);
    if (i % 3 === 2) R(g, x + inset, y + i, w - inset * 2, 1, c2);
  }
  R(g, x - 3, y + h - 1, w + 6, 3, shade(c1, -0.32));
  R(g, x - 3, y + h - 1, w + 6, 1, shade(c0, 0.2));
  R(g, x - 3, y + h + 2, w + 6, 1, "rgba(40,30,20,.2)");
}

// ---------- janela ----------
function windowBox(g, x, y, w, h, { frame = C.wood4, lit = false, arched = false, flower = false, bars = false } = {}) {
  R(g, x - 1, y - 1, w + 2, h + 2, frame);
  const glass = lit ? "#ffd98a" : "#9fd4e8";
  R(g, x, y, w, h, glass);
  if (!lit) {
    // reflexo diagonal
    for (let i = 0; i < Math.min(w, h); i++) {
      R(g, x + i, y + h - 1 - i, 1, 1, "rgba(255,255,255,.45)");
    }
    R(g, x + 1, y + 1, w - 2, 1, "rgba(255,255,255,.35)");
  } else {
    R(g, x, y + h - 1, w, 1, "#f0a94e");
    R(g, x + 1, y + 1, 2, 2, "#fff3c4");
  }
  // caixilho
  R(g, x + Math.floor(w / 2), y, 1, h, frame);
  R(g, x, y + Math.floor(h / 2), w, 1, frame);
  if (arched) {
    R(g, x - 1, y - 2, w + 2, 1, frame);
    R(g, x, y - 2, 1, 1, frame); R(g, x + w - 1, y - 2, 1, 1, frame);
  }
  if (bars) for (let i = 2; i < w; i += 3) R(g, x + i, y, 1, h, frame);
  // peitoril
  R(g, x - 2, y + h + 1, w + 4, 1, shade(frame, 0.2));
  R(g, x - 2, y + h + 2, w + 4, 1, shade(frame, -0.25));
  if (flower) {
    R(g, x - 2, y + h, w + 4, 2, "#a05a34");
    const cols = ["#e8695e", "#ffd166", "#ffb3d1"];
    for (let i = 0; i < w + 2; i += 3) {
      R(g, x - 1 + i, y + h - 2, 2, 2, cols[(i / 3) % 3 | 0]);
      R(g, x - 1 + i, y + h, 1, 1, "#5f9a44");
    }
  }
}

// ---------- porta ----------
function door(g, x, y, w, h, { wood = C.wood3, frame = C.wood4, step = true, glass = false } = {}) {
  R(g, x - 1, y - 1, w + 2, h + 2, frame);
  R(g, x, y, w, h, wood);
  R(g, x, y, 1, h, shade(wood, 0.2));
  R(g, x + w - 1, y, 1, h, shade(wood, -0.28));
  if (glass) {
    R(g, x + 2, y + 2, w - 4, Math.floor(h / 2.4), "#9fd4e8");
    R(g, x + 2, y + 2, w - 4, 1, "#e8f6fc");
    R(g, x + 2, y + Math.floor(h / 2.4) - 1, w - 4, 1, frame);
  } else {
    R(g, x + 2, y + 2, w - 4, Math.floor(h / 2.6), shade(wood, -0.18));
    R(g, x + 2, y + Math.floor(h / 1.9), w - 4, Math.floor(h / 2.8), shade(wood, -0.12));
  }
  R(g, x + w - 3, y + Math.floor(h / 2), 1, 2, "#e8c15c"); // maçaneta
  if (step) {
    R(g, x - 2, y + h + 1, w + 4, 2, C.stone1);
    R(g, x - 2, y + h + 3, w + 4, 1, C.stone3);
  }
  // lanterna
  R(g, x - 3, y + 1, 1, 4, "#3a332c");
  R(g, x - 4, y + 4, 3, 3, "#3a332c");
  R(g, x - 3, y + 5, 1, 1, "#ffe9a8");
  R(g, x + w + 2, y + 1, 1, 4, "#3a332c");
  R(g, x + w + 1, y + 4, 3, 3, "#3a332c");
  R(g, x + w + 2, y + 5, 1, 1, "#ffe9a8");
}

function awning(g, x, y, w, cols, h = 4) {
  const [a, b] = cols;
  for (let i = 0; i < w; i++) {
    const col = Math.floor(i / 3) % 2 ? a : b;
    R(g, x + i, y, 1, h, col);
  }
  for (let i = 0; i < w; i += 3) {
    R(g, x + i, y + h, 1, 2, Math.floor(i / 3) % 2 ? shade(a, -0.15) : shade(b, -0.15));
  }
  R(g, x, y, w, 1, shade(a, 0.25));
}

function signBoard(g, x, y, w, h, { bg = C.wood2, border = C.wood4, motif } = {}) {
  R(g, x - 1, y - 1, w + 2, h + 2, border);
  R(g, x, y, w, h, bg);
  R(g, x, y, w, 1, shade(bg, 0.28));
  R(g, x, y + h - 1, w, 1, shade(bg, -0.2));
  // tábuas
  for (let yy = y + 2; yy < y + h - 1; yy += 3) R(g, x + 1, yy, w - 2, 1, shade(bg, -0.12));
  R(g, x + Math.floor(w / 2), y, 1, h, shade(bg, -0.22));
  // parafusos
  R(g, x + 1, y + 1, 1, 1, "#c9b48c");
  R(g, x + w - 2, y + 1, 1, 1, "#c9b48c");
  if (motif) motif(g, x + Math.floor(w / 2), y + Math.floor(h / 2));
}

function chimney(g, x, y, w, cols = [C.stone2, C.stone3, C.stone4]) {
  R(g, x, y, w, 8, cols[0]);
  R(g, x, y, w, 1, cols[1]);
  R(g, x + w - 1, y, 1, 8, cols[2]);
  R(g, x - 1, y - 1, w + 2, 2, cols[2]);
  R(g, x - 1, y - 1, w + 2, 1, cols[1]);
  for (let yy = y + 3; yy < y + 8; yy += 3) R(g, x, yy, w, 1, cols[2]);
}

function foundation(g, x, y, w, h, col = C.stone2) {
  R(g, x, y, w, h, col);
  for (let i = 0; i < w; i += 4) R(g, x + i, y, 1, h, shade(col, -0.22));
  R(g, x, y, w, 1, shade(col, 0.22));
}

function pottedPlant(g, x, y, season) {
  R(g, x, y, 3, 3, "#b5623f");
  R(g, x, y, 3, 1, "#d1784f");
  R(g, x + 1, y - 3, 1, 3, SEASON_ART[season].leaf[2]);
  R(g, x, y - 4, 3, 2, SEASON_ART[season].leaf[1]);
}

function crateStack(g, x, y) {
  for (let i = 0; i < 2; i++) {
    R(g, x + i * 5, y, 5, 5, C.wood2);
    R(g, x + i * 5, y, 5, 1, C.wood1);
    R(g, x + i * 5, y + 4, 5, 1, C.wood4);
    R(g, x + i * 5 + 2, y + 1, 1, 3, C.wood3);
  }
}

function barrel(g, x, y) {
  R(g, x, y, 4, 6, C.wood3);
  R(g, x, y, 4, 1, C.wood2);
  R(g, x, y + 2, 4, 1, "#6a6157");
  R(g, x, y + 5, 4, 1, "#6a6157");
  R(g, x + 1, y + 1, 1, 4, C.wood2);
}

// ============================================================
//  Prédios
// ============================================================
function paint(g, o) {
  const { w, h } = o; // em art pixels
  const sid = o.id;
  const season = o.season || 0;

  if (sid === "prefeitura") {
    const rw = w - 8, roofY = 14;
    wallBricks(g, 4, roofY + 20, w - 8, h - roofY - 20, "#d9c9a8", "#c2b190");
    gableRoof(g, 4, roofY, rw, 26, [C.roof0, C.roof1, C.roof2]);
    // frontão
    R(g, w / 2 - 10, roofY + 10, 20, 14, "#e5d6b8");
    R(g, w / 2 - 10, roofY + 10, 20, 1, "#f2e6cd");
    // relógio
    R(g, w / 2 - 4, roofY + 14, 9, 9, "#5f4a33");
    R(g, w / 2 - 3, roofY + 15, 7, 7, "#fff3d6");
    R(g, w / 2, roofY + 16, 1, 3, "#4a3a28");
    R(g, w / 2, roofY + 18, 2, 1, "#4a3a28");
    // colunas
    for (const cx of [10, w - 14]) {
      R(g, cx, roofY + 24, 5, h - roofY - 28, "#efe6d2");
      R(g, cx, roofY + 24, 1, h - roofY - 28, "#fff8ea");
      R(g, cx + 4, roofY + 24, 1, h - roofY - 28, "#cbbb9a");
      R(g, cx - 1, roofY + 22, 7, 2, "#efe6d2");
      R(g, cx - 1, h - 4, 7, 2, "#efe6d2");
    }
    // janelas altas
    windowBox(g, 20, roofY + 30, 7, 12, { frame: "#6b5a44", bars: false });
    windowBox(g, w - 27, roofY + 30, 7, 12, { frame: "#6b5a44" });
    // porta central
    door(g, w / 2 - 5, h - 20, 10, 18, { wood: "#7b5a3a", frame: "#5f4a33" });
    R(g, w / 2 - 7, h - 2, 14, 2, C.stone1);
    // escada
    R(g, w / 2 - 8, h - 1, 16, 1, C.stone1);
    // bandeira
    R(g, 6, roofY - 6, 1, 10, C.wood4);
    R(g, 7, roofY - 6, 4, 4, "#e2695e");
    R(g, 7, roofY - 4, 4, 1, "#fff3d6");
    pottedPlant(g, 8, h - 6, season);
    pottedPlant(g, w - 11, h - 6, season);
  } else if (sid === "clinica") {
    const roofY = 12;
    wallPlaster(g, 3, roofY + 12, w - 6, h - roofY - 12, "#eef3ec", "#cfd8cc");
    hipRoof(g, 3, roofY, w - 6, 16, [C.roofGreen0, C.roofGreen1, C.roofGreen2]);
    R(g, 3, roofY + 19, w - 6, 2, "#ffffff");
    // cruz
    R(g, w / 2 - 1, roofY + 4, 3, 9, "#e2695e");
    R(g, w / 2 - 4, roofY + 7, 9, 3, "#e2695e");
    // janela grande
    windowBox(g, 8, roofY + 26, 12, 10, { frame: "#e8eef0", lit: false });
    awning(g, 7, roofY + 24, 14, ["#7cb98a", "#f4f7f2"], 3);
    windowBox(g, w - 20, roofY + 26, 10, 10, { frame: "#e8eef0" });
    door(g, w / 2 - 5, h - 19, 10, 17, { wood: "#6f9e8a", frame: "#4f7a68", glass: true });
    pottedPlant(g, 3, h - 5, season);
  } else if (sid === "carpintaria") {
    const roofY = 10;
    wallPlanks(g, 3, roofY + 12, w - 6, h - roofY - 12, "#c99a63", "#a97a48");
    gableRoof(g, 3, roofY, w - 6, 18, ["#a06840", "#84502f", "#633a22"]);
    // serra na cumeeira
    R(g, w / 2 - 6, roofY - 2, 12, 5, "#c3cbcf");
    for (let i = 0; i < 5; i++) R(g, w / 2 - 6 + i * 2, roofY + 2, 1, 1, "#c3cbcf");
    // porta
    door(g, w / 2 - 6, h - 22, 12, 20, { wood: "#8a5a33", frame: "#5f3a22" });
    // placa (serra + machado)
    signBoard(g, w - 26, roofY + 24, 18, 9, {
      motif: (gg, cx, cy) => {
        R(gg, cx - 5, cy - 1, 10, 2, "#d9dfe3");
        for (let i = 0; i < 10; i += 2) R(gg, cx - 4 + i, cy + 1, 1, 1, "#8d9298");
        R(gg, cx - 6, cy - 3, 2, 4, "#a06840");
      },
    });
    // pilha de lenha + tábuas
    for (let i = 0; i < 3; i++) {
      R(g, 4 + i * 4, h - 9, 4, 7, C.wood3);
      R(g, 4 + i * 4, h - 9, 4, 1, C.wood1);
      R(g, 5 + i * 4, h - 6, 2, 2, C.wood4);
    }
    R(g, 4, h - 12, 12, 2, C.wood1);
    R(g, 4, h - 15, 12, 2, C.wood2);
    // janela
    windowBox(g, 9, roofY + 24, 8, 8, { frame: "#5f3a22", flower: true });
  } else if (sid === "mercado") {
    const roofY = 10;
    wallPlaster(g, 3, roofY + 14, w - 6, h - roofY - 14, "#f4e3bb", "#dcc79a");
    hipRoof(g, 3, roofY, w - 6, 16, [C.roofGold0, C.roofGold1, C.roofGold2]);
    // toldo listrado
    awning(g, 2, roofY + 18, w - 4, ["#5f9a5a", "#f6efd8"], 6);
    // vitrine
    R(g, 5, roofY + 28, 16, 12, "#7b5a3a");
    R(g, 6, roofY + 29, 14, 10, "#bfe6f2");
    R(g, 6, roofY + 29, 14, 1, "#e8f8ff");
    R(g, 13, roofY + 29, 1, 10, "#7b5a3a");
    for (let i = 0; i < 4; i++) {
      const cols = ["#e2695e", "#ffd166", "#7cb98a", "#b58fd1"];
      R(g, 7 + i * 3, roofY + 36, 2, 2, cols[i]);
      R(g, 7 + i * 3, roofY + 34, 1, 1, "#5f9a44");
    }
    windowBox(g, w - 24, roofY + 28, 12, 10, { frame: "#7b5a3a" });
    door(g, w / 2 - 6, h - 20, 12, 18, { wood: "#8a5f3b", frame: "#5f3a22", glass: true });
    // caixas de produtos
    crateStack(g, 2, h - 8);
    R(g, 2, h - 10, 5, 2, "#e2695e");
    R(g, 8, h - 9, 5, 2, "#ffd166");
    barrel(g, w - 9, h - 8);
    // placa pendurada
    signBoard(g, w / 2 - 12, roofY + 20, 24, 7, {
      motif: (gg, cx, cy) => {
        R(gg, cx - 5, cy - 1, 10, 3, "#e8c15c");
        R(gg, cx - 5, cy + 2, 10, 1, "#c19a3d");
        R(gg, cx - 1, cy - 2, 2, 1, "#7cb98a");
      },
    });
  } else if (sid === "taverna") {
    const roofY = 10;
    wallStone(g, 3, roofY + 24, w - 6, h - roofY - 24, "#d9cdb5", "#b8a98d");
    // madeiramento
    R(g, 3, roofY + 12, w - 6, 12, "#8a5a33");
    for (let i = 0; i < w - 6; i += 10) R(g, 3 + i, roofY + 12, 2, 12, "#6f4526");
    R(g, 3, roofY + 12, w - 6, 1, "#a97a48");
    gableRoof(g, 3, roofY, w - 6, 18, ["#9c5a33", "#7d4325", "#5c2f19"]);
    // janelas quentes
    windowBox(g, 8, roofY + 26, 9, 9, { frame: "#4a2f1a", lit: true });
    windowBox(g, w - 20, roofY + 26, 9, 9, { frame: "#4a2f1a", lit: true });
    door(g, w / 2 - 6, h - 22, 12, 20, { wood: "#6f4526", frame: "#4a2f1a" });
    // caneco pendurado
    R(g, w / 2 + 14, roofY + 16, 1, 5, "#3a2a20");
    R(g, w / 2 + 11, roofY + 21, 7, 5, "#e8c15c");
    R(g, w / 2 + 11, roofY + 21, 7, 2, "#fff3d6");
    R(g, w / 2 + 12, roofY + 26, 5, 1, "#c19a3d");
    chimney(g, w - 12, roofY - 4, 6);
    barrel(g, 2, h - 9);
    barrel(g, w - 8, h - 9);
    pottedPlant(g, 12, h - 5, season);
  } else if (sid === "ferraria") {
    const roofY = 10;
    wallStone(g, 3, roofY + 16, w - 6, h - roofY - 16, "#8c8a80", "#6b6960");
    R(g, 3, roofY + 16, w - 6, 1, "#a8a69a");
    gableRoof(g, 3, roofY, w - 6, 16, ["#5d6b74", "#44515a", "#2f3a42"]);
    // forja acesa
    R(g, 4, h - 26, 14, 14, "#5f4a3a");
    R(g, 5, h - 25, 12, 12, "#2f2420");
    R(g, 7, h - 22, 8, 5, "#ff9d4d");
    R(g, 8, h - 21, 6, 3, "#ffcf7a");
    R(g, 9, h - 20, 4, 1, "#fff3c4");
    // chaminé grande
    chimney(g, w - 14, roofY - 8, 8, ["#6b6960", "#55534c", "#3f3d38"]);
    // bigorna
    R(g, w - 24, h - 10, 10, 3, "#4a4a48");
    R(g, w - 22, h - 7, 6, 4, "#3a3a38");
    R(g, w - 26, h - 12, 5, 3, "#5f5f5d");
    // ferramentas na parede
    R(g, 9, roofY + 20, 1, 9, C.wood3);
    R(g, 7, roofY + 19, 5, 2, "#b9c0c4");
    R(g, 14, roofY + 20, 1, 8, C.wood3);
    R(g, 12, roofY + 19, 5, 2, "#9aa0a6");
    // porta
    door(g, w / 2 - 5, h - 20, 10, 18, { wood: "#5f4a3a", frame: "#3f3228" });
    windowBox(g, w - 22, roofY + 22, 7, 6, { frame: "#3f3228", lit: true });
  } else if (sid === "banco") {
    const roofY = 8;
    wallStone(g, 3, roofY + 18, w - 6, h - roofY - 18, "#e6e0d2", "#c6bfae");
    gableRoof(g, 3, roofY, w - 6, 16, [C.roofBlue0, C.roofBlue1, C.roofBlue2]);
    // frontão + colunas
    R(g, 6, roofY + 14, w - 12, 10, "#efe9da");
    R(g, 6, roofY + 14, w - 12, 1, "#fbf6e8");
    for (const cx of [10, w - 16]) {
      R(g, cx, roofY + 22, 4, h - roofY - 26, "#f7f2e4");
      R(g, cx + 3, roofY + 22, 1, h - roofY - 26, "#cfc7b4");
      R(g, cx - 1, roofY + 21, 6, 2, "#f7f2e4");
    }
    // moeda no frontão
    R(g, w / 2 - 4, roofY + 17, 9, 5, "#e8c15c");
    R(g, w / 2 - 3, roofY + 18, 7, 3, "#fff0b8");
    R(g, w / 2 - 1, roofY + 18, 3, 3, "#c19a3d");
    windowBox(g, 19, roofY + 26, 6, 9, { frame: "#7b6a4f" });
    windowBox(g, w - 25, roofY + 26, 6, 9, { frame: "#7b6a4f" });
    door(g, w / 2 - 5, h - 20, 10, 18, { wood: "#5f6f7a", frame: "#3f4a52" });
    // escadinha + luminárias
    R(g, w / 2 - 8, h - 2, 16, 2, C.stone1);
    R(g, w / 2 - 10, h, 20, 1, C.stone3);
    R(g, 7, h - 12, 2, 5, "#3a332c"); R(g, 6, h - 13, 4, 2, "#ffe9a8");
    R(g, w - 9, h - 12, 2, 5, "#3a332c"); R(g, w - 10, h - 13, 4, 2, "#ffe9a8");
  } else if (sid === "igreja") {
    const roofY = 20;
    const cx = w / 2;
    // ---- torre sineira (frontal, integrada) ----
    const tw = 16, tx = cx - tw / 2;
    wallStone(g, tx, 0, tw, roofY + 8, "#efeadd", "#cfc8b6");
    // pináculo
    for (let i = 0; i < 10; i++) {
      R(g, tx + i, 8 - i, tw - i * 2, 1, i < 3 ? "#9aa5ad" : "#7b868f");
    }
    R(g, tx + tw / 2 - 1, -6, 2, 8, "#e8c15c");
    R(g, tx + tw / 2 - 3, -4, 6, 2, "#e8c15c");
    // sineira (arco aberto com sino)
    R(g, tx + 3, 10, tw - 6, 12, "#5f6a72");
    R(g, tx + 4, 11, tw - 8, 10, "#3f4a52");
    R(g, tx + tw / 2 - 2, 13, 5, 6, "#c9a24c");
    R(g, tx + tw / 2 - 3, 18, 7, 2, "#8a6a28");
    R(g, tx + tw / 2 - 1, 19, 3, 1, "#6b4f1c");
    // cornija
    R(g, tx - 2, roofY - 2, tw + 4, 3, "#cfc8b6");
    R(g, tx - 2, roofY - 2, tw + 4, 1, "#f2eee2");
    // ---- corpo ----
    wallPlaster(g, 3, roofY + 16, w - 6, h - roofY - 16, "#f6f3e8", "#d8d2c2");
    R(g, 3, h - 9, w - 6, 3, "#cfc8b6");
    R(g, 3, roofY + 16, w - 6, 2, "#b8b2a2");
    // telhado (duas águas) cobrindo o topo do corpo
    gableRoof(g, 3, roofY + 2, w - 6, 16, ["#8f9aa3", "#727d86", "#57616a"]);
    // rosácea
    const ry = roofY + 26;
    for (let r = 5; r >= 0; r--) {
      const col = r === 5 ? "#7b6a4f" : (r === 0 ? "#fff3d6" : "#8fd0e8");
      R(g, cx - r, ry - r, r * 2, r * 2, col);
    }
    R(g, cx - 1, ry - 5, 2, 10, "#fff3d6");
    R(g, cx - 5, ry - 1, 10, 2, "#fff3d6");
    // janelas em arco
    windowBox(g, 7, roofY + 32, 6, 10, { frame: "#7b6a4f", arched: true });
    windowBox(g, w - 13, roofY + 32, 6, 10, { frame: "#7b6a4f", arched: true });
    // porta com arco e vitral
    R(g, cx - 7, h - 24, 14, 22, "#7b6a4f");
    R(g, cx - 6, h - 23, 12, 20, "#8a5f3b");
    R(g, cx - 5, h - 22, 10, 8, "#bfe6f2");
    R(g, cx - 5, h - 22, 10, 3, "#b58fd1");
    R(g, cx - 1, h - 22, 2, 8, "#7b6a4f");
    R(g, cx + 4, h - 12, 2, 2, "#e8c15c");
    R(g, cx - 8, h - 1, 16, 2, "#cfc8b6");
    pottedPlant(g, 3, h - 5, season);
    pottedPlant(g, w - 8, h - 5, season);
  } else if (sid === "celeiro") {
    const roofY = 8;
    wallPlanks(g, 3, roofY + 16, w - 6, h - roofY - 16, "#c0503f", "#98382c");
    gableRoof(g, 3, roofY, w - 6, 18, ["#7d4a33", "#63382a", "#472720"]);
    // moldura branca
    R(g, 3, roofY + 16, w - 6, 2, "#f2ead6");
    for (const cx of [3, w - 5]) R(g, cx, roofY + 16, 2, h - roofY - 16, "#f2ead6");
    // porta dupla
    R(g, w / 2 - 12, h - 26, 24, 24, "#8f3129");
    R(g, w / 2 - 11, h - 25, 10, 22, "#a8453a");
    R(g, w / 2 + 1, h - 25, 10, 22, "#9c3d32");
    R(g, w / 2 - 12, h - 26, 24, 1, "#f2ead6");
    for (let i = 0; i < 3; i++) R(g, w / 2 - 11, h - 22 + i * 6, 10, 1, "#7d2c25");
    R(g, w / 2 - 1, h - 26, 2, 24, "#f2ead6");
    // X branco nas portas
    R(g, w / 2 - 9, h - 22, 7, 1, "#f2ead6");
    R(g, w / 2 - 9, h - 18, 7, 1, "#f2ead6");
    // janelinha no sótão
    R(g, w / 2 - 4, roofY + 8, 9, 7, "#f2ead6");
    R(g, w / 2 - 3, roofY + 9, 7, 5, "#8fb8cf");
    // feno
    R(g, 4, h - 10, 10, 8, "#d9b25e");
    for (let i = 5; i < 14; i += 3) R(g, i, h - 9, 1, 6, "#c9a24c");
    R(g, 4, h - 10, 10, 1, "#efd287");
    // cata-vento
    R(g, w / 2, roofY - 6, 1, 8, "#5f5e57");
    R(g, w / 2 - 3, roofY - 8, 7, 2, "#c3cbcf");
  } else if (sid === "casa_player" || o.house) {
    const roofY = 10;
    // parede com reboco envelhecido/mancha — herança abandonada
    wallPlaster(g, 3, roofY + 18, w - 6, h - roofY - 18, "#e8c9a8", "#c9a68a");
    // manchas de umidade e descascado
    R(g, 6, roofY + 22, 12, 8, "rgba(180,140,110,.18)");
    R(g, w - 22, roofY + 24, 10, 10, "rgba(140,110,90,.14)");
    R(g, 3, roofY + 18, 2, h - roofY - 18, "#8a6a3a");
    R(g, w - 5, roofY + 18, 2, h - roofY - 18, "#7a5a32");
    R(g, 3, h - 10, w - 6, 3, "#9a8a78");
    R(g, 3, h - 10, w - 6, 1, "#b8a898");
    R(g, 3, roofY + 18, w - 6, 2, "#8a5a3a");
    R(g, 3, roofY + 18, w - 6, 1, "#a97a48");
    gableRoof(g, 3, roofY, w - 6, 18, [C.roof0, C.roof1, C.roof2]);
    // telhado esburacado — faltando telhas (buracos escuros)
    R(g, 12, roofY + 6, 7, 3, "rgba(40,28,18,.85)");
    R(g, 13, roofY + 7, 5, 1, "rgba(20,14,8,.6)");
    R(g, w - 24, roofY + 9, 6, 3, "rgba(40,28,18,.82)");
    R(g, w - 23, roofY + 10, 4, 1, "rgba(20,14,8,.55)");
    R(g, w/2 - 2, roofY + 4, 4, 2, "rgba(40,28,18,.78)");
    // rachaduras no telhado
    R(g, 18, roofY + 11, 10, 1, "rgba(60,40,20,.35)");
    R(g, w - 30, roofY + 13, 8, 1, "rgba(60,40,20,.30)");
    // chaminé torta e com fuligem
    chimney(g, w - 17, roofY + 1, 6);
    R(g, w - 16, roofY + 8, 1, 5, "rgba(30,30,30,.35)");
    // janelas — uma boa, uma quebrada com teia
    windowBox(g, 8, roofY + 26, 9, 9, { frame: "#6b4a2f", flower: false });
    // janela quebrada (sem flor, vidro escuro rachado)
    R(g, w - 19, roofY + 26, 9, 9, "rgba(30,30,35,.88)");
    R(g, w - 19, roofY + 26, 9, 9, "#2a2a30");
    R(g, w - 18, roofY + 27, 7, 7, "rgba(0,0,0,.55)");
    // rachadura em X na janela quebrada
    R(g, w - 19, roofY + 30, 9, 1, "rgba(255,255,255,.55)");
    R(g, w - 15, roofY + 26, 1, 9, "rgba(255,255,255,.45)");
    R(g, w - 19, roofY + 26, 1, 9, "rgba(90,70,50,.5)"); // moldura torta
    // teia de aranha na janela quebrada e cantos
    for(let i=0;i<3;i++){ R(g, w - 19 + i*2, roofY + 26 + i, 1, 1, "rgba(220,220,220,.55)"); R(g, w - 19 + i, roofY + 26 + i*2, 1, 1, "rgba(220,220,220,.45)"); }
    R(g, w - 12, roofY + 25, 4, 1, "rgba(220,220,220,.35)");
    R(g, w - 10, roofY + 18, 1, 7, "rgba(200,200,200,.30)");
    R(g, 4, roofY + 18, 6, 1, "rgba(220,220,220,.28)"); // teia canto superior parede
    R(g, 4, roofY + 19, 1, 5, "rgba(220,220,220,.25)");
    // porta estraçalhada — tábuas tortas
    door(g, w / 2 - 5, h - 22, 10, 20, { wood: "#7a5a33", frame: "#4a3320" });
    // rachadura vertical na porta + tábua solta
    R(g, w/2 - 1, h - 20, 1, 16, "rgba(20,14,8,.75)");
    R(g, w/2 - 4, h - 14, 8, 1, "rgba(40,28,18,.9)");
    R(g, w/2 - 5, h - 8, 2, 3, "rgba(40,28,18,.0)"); // buraco embaixo porta (mostra sombra)
    R(g, w/2 - 4, h - 7, 1, 2, "rgba(0,0,0,.25)");
    // luminárias apagadas (vidro escuro, sem brilho)
    R(g, w/2 - 9, h - 17, 2, 2, "rgba(40,40,45,.9)"); // apaga brilho esquerdo
    R(g, w/2 + 7, h - 17, 2, 2, "rgba(40,40,45,.9)"); // apaga brilho direito
    R(g, w/2 - 8, h - 16, 1, 1, "rgba(80,80,90,.6)");
    // vasos mortos / planta seca
    // pottedPlant removido — substituído por vaso seco
    R(g, w/2 + 8, h - 7, 4, 3, "#8a6a4a"); // vaso seco
    R(g, w/2 + 9, h - 9, 2, 3, "rgba(90,70,40,.55)"); // galho seco
    // trepadeira seca
    R(g, 4, h - 8, 7, 6, "rgba(90,110,60,.45)");
    R(g, 5, h - 11, 5, 4, "rgba(110,90,50,.35)");
  } else if (sid === "mina") {
    // morro de pedra
    for (let i = 0; i < 10; i++) {
      const ww = w - 6 - i * 2;
      R(g, 3 + i, 6 + i * 3, ww, 3, i < 3 ? C.stone2 : C.stone3);
    }
    // entrada de madeira
    R(g, w / 2 - 14, h - 30, 28, 4, C.wood3);
    R(g, w / 2 - 14, h - 30, 28, 1, C.wood2);
    R(g, w / 2 - 16, h - 26, 4, 26, C.wood3);
    R(g, w / 2 + 12, h - 26, 4, 26, C.wood4);
    R(g, w / 2 - 12, h - 26, 24, 26, "#241f1c");
    R(g, w / 2 - 10, h - 22, 20, 20, "#17130f");
    R(g, w / 2 - 6, h - 18, 3, 3, "#ffe9a8");
    // trilho e carrinho
    R(g, 4, h - 6, w - 8, 1, "#6b6960");
    R(g, 4, h - 4, w - 8, 1, "#4a4842");
    R(g, w - 22, h - 12, 12, 6, "#5f5e57");
    R(g, w - 21, h - 11, 10, 4, "#8c8a80");
    R(g, w - 19, h - 10, 2, 2, "#ffd166");
    R(g, w - 15, h - 10, 2, 2, "#ffd166");
    // placa
    signBoard(g, 5, 4, 12, 8, { bg: "#8a5a33" });
  } else if (sid === "doca" || sid === "pier" || sid === "pier_ilha") {
    R(g, 2, h - 20, w - 4, 4, C.wood2);
    R(g, 2, h - 20, w - 4, 1, C.wood1);
    for (let i = 0; i < 6; i++) R(g, 4 + i * 6, h - 16, 3, 8, C.wood3);
    R(g, 2, h - 10, w - 4, 2, C.wood4);
    // barco
    const bx = w / 2 - 12;
    R(g, bx, h - 18, 24, 4, "#8a5a33");
    R(g, bx + 2, h - 14, 20, 3, "#6f4526");
    R(g, bx + 3, h - 12, 18, 2, "#4a2f1a");
    R(g, bx + 11, h - 30, 1, 12, C.wood4);
    R(g, bx + 12, h - 30, 9, 8, "#f6f1e6");
    R(g, bx + 12, h - 30, 9, 1, "#dfd7c6");
    // caixotes
    R(g, 3, h - 14, 5, 5, C.wood2);
    R(g, 3, h - 14, 5, 1, C.wood1);
    R(g, 8, h - 13, 4, 4, C.wood3);
    // poste com lanterna
    R(g, w - 6, h - 26, 1, 14, "#4a4038");
    R(g, w - 8, h - 28, 5, 3, "#ffe9a8");
  } else if (sid === "aerodromo" || sid === "aeroporto") {
    // hangar
    R(g, 3, h - 22, w - 6, 20, "#b9c6cc");
    R(g, 3, h - 22, w - 6, 2, "#d5e0e4");
    for (let i = 0; i < 8; i++) {
      const inset = Math.round((1 - i / 8) * 6);
      R(g, 3 + inset, h - 30 + i, w - 6 - inset * 2, 1, i < 3 ? "#d5e0e4" : "#9aa9b0");
    }
    R(g, w / 2 - 11, h - 24, 22, 22, "#7f8f96");
    R(g, w / 2 - 10, h - 23, 20, 20, "#5f6f76");
    for (let i = 0; i < 4; i++) R(g, w / 2 - 10, h - 21 + i * 5, 20, 1, "#7f8f96");
    // avião pequeno
    R(g, 4, h - 12, 16, 3, "#e8eef2");
    R(g, 4, h - 12, 16, 1, "#ffffff");
    R(g, 16, h - 14, 4, 2, "#c0392b");
    R(g, 8, h - 14, 3, 2, "#c3cbcf");
    R(g, 5, h - 9, 2, 2, "#4a4a48");
    R(g, 14, h - 9, 2, 2, "#4a4a48");
    // biruta
    R(g, w - 8, h - 26, 1, 12, "#5f5e57");
    R(g, w - 12, h - 27, 5, 3, "#e2695e");
  } else if (sid.startsWith("bau")) {
    // baú colorido: mesma receita, cor diferente (pedido: várias madeiras = várias cores)
    const col = o.color || "#d9b06a";
    const dark = col === "#f5f5f0" ? "#d9d9d0" : col === "#e8d5a8" ? "#c9b98a" : col === "#d9a0a0" ? "#c08080" : "#8a6b4a";
    R(g, 2, 4, w-4, h-6, col);
    R(g, 2, 4, w-4, 2, "#fff8dc33");
    R(g, 2, h-4, w-4, 2, dark);
    // tampa com ferragens
    R(g, 3, 5, w-6, 3, dark);
    R(g, w/2 -2, 7, 4, h-12, "#6b4a2f");
    R(g, w/2 -1, 7, 2, h-12, "#8a6a44");
    // fechadura dourada
    R(g, w/2 -1, h/2, 2, 2, "#e8b44a");
    R(g, w/2, h/2+2, 1, 1, "#6b4a2f");
  } else {
    // fallback: casa genérica com a cor do prédio
    const roofY = 8;
    wallPlaster(g, 3, roofY + 14, w - 6, h - roofY - 14, o.color || "#e8d2b0", "#c9b190");
    gableRoof(g, 3, roofY, w - 6, 18, [o.roof0 || C.roof0, o.roof1 || C.roof1, o.roof2 || C.roof2]);
    windowBox(g, 7, roofY + 22, 8, 8, { frame: "#6b4a2f" });
    door(g, w / 2 - 5, h - 20, 10, 18, { wood: "#8a5a33", frame: "#5f3a22" });
  }
}

/** Gera o sprite de um prédio com metadados de janelas/porta. */
export function buildingSprite(b, season) {
  return cached(`bld:${b.id}:${b.w}x${b.h}:${season}:${b.roof || ""}`, () => {
    const w = b.w * 16, h = b.h * 16;
    const extraTop = b.id === "igreja" ? 36 : 0;
    const padBottom = 16;
    const { c, g } = ART(w, h + extraTop + padBottom);
    g.translate(0, extraTop);
    // fundação de pedra sob o prédio
    R(g, 0, h - 10, w, 10, "rgba(60,48,34,.30)");
    for (let i = 0; i < w; i += 7) {
      R(g, i, h - 10, 5, 4, "rgba(220,210,190,.35)");
      R(g, i + 2, h - 6, 5, 4, "rgba(220,210,190,.22)");
    }
    // sombra projetada (pixelada, some embaixo)
    for (let i = 0; i < 9; i++) {
      R(g, 3 + i * 2, h + i, w - 6 - i * 4, 2, `rgba(28,24,16,${0.19 - i * 0.02})`);
    }
    paint(g, { ...b, w, h, season });
    // recorta a área extra em baixa resolução antes de ampliar
    const sprite = up(c);
    return { canvas: sprite, extraTop: extraTop * PIX, padBottom: padBottom * PIX };
  });
}

/** Janelas iluminadas: desenhadas por cima à noite (coordenadas em px de tela). */
export function buildingNightLights(b, season) {
  return cached(`bldNight:${b.id}:${b.w}x${b.h}:${season}`, () => {
    const w = b.w * 32, h = b.h * 32;
    const c = mkCanvas(w, h);
    const g = c.getContext("2d");
    const lights = [];
    const add = (x, y, ww, hh, warm = "#ffcf7a") => lights.push({ x, y, w: ww, h: hh, warm });
    const sid = b.id;
    if (sid === "casa_player") { add(16, h * 0.52, 18, 18); add(w - 38, h * 0.52, 18, 18); }
    else if (sid === "taverna") { add(16, h * 0.6, 18, 18); add(w - 40, h * 0.6, 18, 18); }
    else if (sid === "mercado") { add(10, h * 0.62, 34, 24); add(w - 48, h * 0.62, 24, 20); }
    else if (sid === "ferraria") { add(10, h * 0.7, 28, 24); add(w - 44, h * 0.6, 14, 12); }
    else if (sid === "igreja") { add(w / 2 - 26, h * 0.45, 18, 18); add(w / 2 - 12, h * 0.55, 24, 24); }
    else if (sid === "prefeitura" || sid === "banco") { add(40, h * 0.55, 14, 24); add(w - 54, h * 0.55, 14, 24); }
    else if (sid === "clinica") { add(16, h * 0.55, 24, 20); add(w - 40, h * 0.55, 20, 20); }
    else { add(w * 0.2, h * 0.55, 16, 16); add(w * 0.66, h * 0.55, 16, 16); }
    g.fillStyle = "rgba(255,205,120,.30)";
    for (const l of lights) g.fillRect(l.x, l.y, l.w, l.h);
    return { canvas: c, lights };
  });
}

export function buildingDoorPos(b) {
  return { x: b.x + b.w / 2, y: b.y + b.h - 0.4 };
}
