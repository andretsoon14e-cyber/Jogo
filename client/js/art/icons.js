// ============================================================
//  Ícones em pixel art (16x16), gerados por código e servidos
//  como data-URL. Substituem emojis em toda a interface para
//  manter a mesma linguagem visual do jogo.
// ============================================================
import { mkCanvas, cached } from "./pixel.js";
import { shade } from "./palette.js";

const S = 16;
const hex = (c) => c;

function newIcon() {
  const c = mkCanvas(S, S);
  const g = c.getContext("2d");
  g.imageSmoothingEnabled = false;
  return { c, g };
}
const P = (g, x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
const disc = (g, cx, cy, r, col) => {
  g.fillStyle = col;
  for (let dy = -r; dy <= r; dy++) {
    const w = Math.floor(Math.sqrt(Math.max(0, r * r - dy * dy)));
    g.fillRect(Math.round(cx - w), Math.round(cy + dy), Math.max(1, w * 2), 1);
  }
};
const line = (g, x0, y0, x1, y1, col, w = 1) => {
  g.fillStyle = col;
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  for (let i = 0; i <= steps; i++) {
    const x = Math.round(x0 + ((x1 - x0) * i) / steps);
    const y = Math.round(y0 + ((y1 - y0) * i) / steps);
    g.fillRect(x, y, w, w);
  }
};

const C = {
  w1: "#e8c39a", w2: "#c99a63", w3: "#9c6b3d", w4: "#6f4526",
  s1: "#e8e7dd", s2: "#c2c1b6", s3: "#92918a", s4: "#625f59",
  g1: "#b7e07a", g2: "#86c65c", g3: "#5f9e43", g4: "#3f7533",
  r1: "#f08a7e", r2: "#d4584c", r3: "#a53a33",
  y1: "#ffe9a8", y2: "#f2c34f", y3: "#c99a2a",
  b1: "#bfe6f2", b2: "#7fc7e8", b3: "#4a9bc4",
  p1: "#ffd0e0", p2: "#f09ab8",
  o1: "#ffb46b", o2: "#ef8a3f", o3: "#bf5f24",
  v1: "#d3b6ea", v2: "#a97fc9",
  br: "#7b5a3a", ink: "#3a2a20",
};

function render(key, fn) {
  const { c, g } = newIcon();
  fn(g);
  // contorno inferior suave para dar volume
  return c.toDataURL("image/png");
}

// ---------- ferramentas ----------
const toolIcons = {
  // enxada Stardew: cabo madeira diagonal + lâmina retangular prateada com reflexo
  enxada: (g) => { line(g, 3, 13, 11, 3, C.w2, 2); line(g, 3, 13, 12, 3, C.w1); line(g, 4, 12, 11, 4, C.w4); P(g, 9, 1, 6, 4, C.s1); P(g, 9, 1, 6, 1, "#ffffff"); P(g, 9, 4, 6, 1, C.s3); P(g, 13, 2, 2, 2, C.s2); P(g, 10, 2, 4, 1, "#f0f4f7"); },
  // regador Stardew: corpo azul c/ bico longo + alça + água visível
  regador: (g) => { P(g, 3, 5, 9, 8, C.b3); P(g, 3, 5, 9, 1, C.b2); P(g, 3, 5, 1, 8, C.b1); P(g, 11, 6, 1, 6, shade(C.b3,-0.2)); P(g, 4, 6, 7, 3, "#4a9bc4"); P(g, 4, 7, 7, 1, "#bfe6f2"); P(g, 12, 4, 3, 3, C.b3); P(g, 13, 3, 4, 2, C.b2); P(g, 2, 6, 2, 4, C.b2); P(g, 2, 6, 2, 1, C.b1); P(g, 1, 4, 3, 2, C.b3); P(g, 3, 12, 9, 1, "#2f7092"); },
  // foice Stardew: cabo curto + lâmina curva prateada bem preenchida
  foice: (g) => { line(g, 4, 13, 8, 5, C.w2, 2); P(g, 4, 12, 3, 1, C.w1); P(g, 8, 2, 7, 2, C.s1); P(g, 9, 1, 5, 2, "#ffffff"); P(g, 8, 3, 7, 1, C.s2); P(g, 14, 2, 1, 2, C.s3); for(let i=0;i<5;i++) P(g, 9+i, 1+i, 1, 1, C.s2); },
  // machado Stardew: cabo + cabeça dupla metálica
  machado: (g) => { line(g, 4, 13, 11, 4, C.w2, 2); line(g, 4, 13, 11, 5, C.w4); P(g, 9, 2, 5, 5, C.s2); P(g, 9, 2, 5, 1, "#ffffff"); P(g, 10, 3, 3, 2, C.s1); P(g, 13, 3, 1, 3, C.s3); P(g, 9, 6, 5, 1, C.s3); },
  // picareta Stardew: cabo + cabeça pontiaguda prateada
  picareta: (g) => { line(g, 3, 13, 12, 4, C.w2, 2); line(g, 3, 13, 12, 5, C.w4); P(g, 10, 2, 6, 2, C.s1); P(g, 9, 3, 8, 2, C.s2); P(g, 10, 3, 6, 1, "#ffffff"); P(g, 8, 3, 2, 2, C.s3); P(g, 15, 3, 1, 1, C.s3); for(let i=0;i<3;i++) P(g, 9+i*2, 4, 2, 1, C.s3); },
  // vara Stardew: cabo madeira + linha + boia vermelha + anzol
  vara: (g) => { line(g, 2, 13, 12, 2, C.w2); line(g, 2, 13, 12, 3, C.w1); P(g, 12, 2, 2, 1, "#ffffff"); P(g, 12, 3, 2, 6, "#dfe7ea"); P(g, 12, 8, 2, 1, "#c0392b"); P(g, 13, 9, 1, 2, C.s2); P(g, 13, 11, 1, 1, C.s3); },
  semente: (g) => { P(g, 3, 7, 10, 7, "#e8d6b0"); P(g, 3, 7, 10, 1, "#f6e8c8"); P(g, 3, 13, 10, 1, "#c4ae83"); P(g, 7, 3, 1, 4, C.g3); P(g, 5, 2, 3, 2, C.g2); P(g, 8, 1, 3, 2, C.g2); P(g, 6, 9, 4, 3, "#d9c59a"); },
};

// ---------- itens ----------
function cropIcon(kind, palette) {
  return (g) => {
    const [base, light, dark] = palette;
    if (kind === "root") {
      P(g, 6, 7, 5, 7, base); P(g, 5, 8, 7, 5, base); P(g, 6, 7, 2, 7, light); P(g, 9, 10, 2, 4, dark);
      P(g, 4, 12, 2, 1, dark); P(g, 11, 12, 2, 1, dark);
      P(g, 7, 2, 1, 5, C.g3); P(g, 5, 2, 2, 3, C.g2); P(g, 9, 1, 2, 3, C.g2);
    } else if (kind === "fruit") {
      disc(g, 8, 9, 5, dark); disc(g, 8, 8, 5, base); disc(g, 6, 6, 2, light);
      P(g, 8, 2, 1, 3, C.g3); P(g, 6, 2, 2, 2, C.g2); P(g, 9, 1, 2, 2, C.g2);
      P(g, 11, 7, 1, 1, light);
    } else if (kind === "grain") {
      line(g, 8, 13, 8, 4, C.g3);
      for (let i = 0; i < 3; i++) { P(g, 5, 5 + i * 2, 2, 2, base); P(g, 9, 5 + i * 2, 2, 2, base); P(g, 6, 4 + i * 2, 1, 1, light); }
      P(g, 7, 1, 2, 2, base);
    } else if (kind === "leafy") {
      disc(g, 8, 8, 6, dark); disc(g, 8, 7, 5, base); disc(g, 7, 6, 3, light);
      P(g, 8, 1, 1, 3, C.g4); P(g, 3, 9, 2, 1, C.g4); P(g, 11, 11, 2, 1, C.g4);
      P(g, 5, 5, 2, 1, "#ffffff88");
    } else if (kind === "squash") {
      disc(g, 8, 9, 5, dark); disc(g, 8, 9, 5, base); P(g, 6, 5, 4, 9, base); P(g, 7, 5, 2, 9, light);
      P(g, 8, 2, 1, 3, C.g3); P(g, 6, 2, 2, 1, C.g3);
    }
  };
}

function bottleIcon(liquid, cap) {
  return (g) => {
    P(g, 5, 6, 6, 8, "#e8f1f5"); P(g, 5, 6, 6, 1, "#ffffff");
    P(g, 6, 8, 4, 5, liquid); P(g, 6, 8, 1, 5, "#ffffff88");
    P(g, 6, 3, 4, 3, "#dfe9ee"); P(g, 6, 4, 4, 1, liquid); P(g, 6, 2, 4, 2, cap);
  };
}

const itemIcons = {
  madeira: (g) => { P(g, 2, 6, 12, 5, C.w3); P(g, 2, 6, 12, 1, C.w1); P(g, 3, 8, 4, 1, C.w4); P(g, 8, 9, 3, 1, C.w4); disc(g, 12, 8, 2, C.w2); P(g, 12, 7, 1, 1, C.w4); },
  pedra: (g) => { disc(g, 8, 10, 5, C.s3); disc(g, 7, 9, 4, C.s2); disc(g, 6, 7, 2, C.s1); P(g, 10, 11, 2, 2, C.s4); },
  peixe: (g) => { disc(g, 8, 8, 4, C.b3); disc(g, 8, 7, 3, C.b2); P(g, 12, 6, 3, 1, C.b3); P(g, 13, 5, 2, 1, C.b3); P(g, 13, 8, 2, 1, C.b3); P(g, 12, 7, 3, 1, C.b3); P(g, 6, 6, 1, 1, "#fff"); P(g, 5, 9, 2, 1, C.b1); },
  ovo: (g) => { disc(g, 8, 9, 4, "#f4e7cf"); disc(g, 8, 8, 4, "#fff8ec"); disc(g, 7, 6, 2, "#ffffff"); P(g, 5, 11, 6, 1, "#e0cfae"); },
  leite: (g) => bottleIcon("#f7f9fa", C.b3)(g),
  la: (g) => { disc(g, 8, 9, 5, "#dcd6e8"); disc(g, 8, 9, 4, "#f2eef8"); for (let i = 0; i <= 6; i++) line(g, 4, 6 + i, 12, 6 + i, i % 2 ? "#cfc7dd" : "#e8e2f2"); },
  minerio: (g) => { disc(g, 8, 9, 5, "#6f8fa8"); disc(g, 8, 8, 4, "#9fc7dd"); P(g, 6, 5, 2, 3, "#dff6ff"); P(g, 9, 7, 1, 2, "#ffffff"); P(g, 5, 9, 2, 1, "#c9e8f6"); },
  cogumelo: (g) => { P(g, 6, 9, 4, 5, "#f2e6cc"); P(g, 5, 10, 1, 3, "#dfd0b4"); disc(g, 8, 6, 5, C.r2); disc(g, 7, 6, 4, C.r1); P(g, 5, 4, 2, 1, "#ffe8e0"); P(g, 9, 5, 1, 1, "#ffe8e0"); },
  mel: (g) => { P(g, 4, 5, 8, 9, "#e8b44a"); P(g, 5, 6, 6, 7, "#f7cf6e"); P(g, 3, 4, 10, 2, "#c99a2a"); P(g, 6, 8, 2, 3, "#fff0b8"); P(g, 4, 12, 8, 2, "#c99a2a"); },
  queijo: (g) => { P(g, 3, 6, 10, 6, C.y2); P(g, 3, 6, 10, 1, C.y1); P(g, 3, 11, 10, 1, C.y3); disc(g, 6, 8, 1, C.y3); disc(g, 9, 9, 1, C.y3); P(g, 11, 7, 1, 1, "#fff6d0"); },
  concha: (g) => { disc(g, 8, 10, 5, "#f0d8d0"); disc(g, 8, 9, 4, "#ffeae2"); for (let i = 0; i < 4; i++) line(g, 8, 11, 4 + i * 3, 5, "#e8bfb4"); P(g, 6, 12, 5, 1, "#d9af9f"); },
  carvao: (g) => { disc(g, 8, 9, 5, "#3a3532"); disc(g, 7, 8, 3, "#565049"); P(g, 6, 6, 2, 1, "#7a736a"); P(g, 10, 10, 2, 1, "#242020"); },
  nabo: cropIcon("root", ["#f2f4ea", "#ffffff", "#cfd6c6"]),
  batata: cropIcon("root", ["#cf9a5c", "#e8b579", "#a06c34"]),
  morango: cropIcon("fruit", ["#e8446a", "#ff7f9f", "#b52a4a"]),
  tomate: cropIcon("fruit", ["#e04a3c", "#ff7a63", "#a82f2a"]),
  milho: cropIcon("grain", [C.y2, C.y1, C.y3]),
  abobora: cropIcon("squash", [C.o2, C.o1, C.o3]),
  trigo: cropIcon("grain", ["#e8c86a", "#f7e3a0", "#b89434"]),
  repolho: cropIcon("leafy", ["#9fd074", "#c2e59a", "#6fa84c"]),
  pao: (g) => { disc(g, 8, 9, 5, "#c98a4a"); disc(g, 8, 8, 5, "#e8b575"); P(g, 4, 7, 8, 4, "#e8b575"); line(g, 6, 6, 5, 8, "#b87a3c"); line(g, 9, 5, 8, 8, "#b87a3c"); line(g, 11, 8, 10, 10, "#b87a3c"); },
  salada: (g) => { disc(g, 8, 10, 5, "#e8f1f5"); disc(g, 8, 9, 4, "#d9e8ef"); P(g, 4, 4, 3, 4, C.g2); P(g, 8, 3, 4, 4, C.g3); P(g, 7, 6, 3, 3, C.g1); P(g, 10, 6, 3, 2, "#e04a3c"); P(g, 5, 7, 2, 2, "#ffe066"); },
  sopa: (g) => { disc(g, 8, 9, 5, "#e8f1f5"); disc(g, 8, 9, 4, "#f7d9a8"); disc(g, 8, 9, 3, "#efc279"); P(g, 6, 8, 2, 1, C.g2); P(g, 9, 10, 2, 1, C.o2); P(g, 5, 9, 1, 1, "#e04a3c"); line(g, 11, 5, 12, 2, "#cfd8dc"); },
  omelete: (g) => { disc(g, 8, 9, 5, "#e8f1f5"); disc(g, 8, 8, 4, "#ffe08a"); disc(g, 8, 8, 3, "#ffd166"); P(g, 6, 7, 2, 1, "#fff3c4"); P(g, 9, 9, 1, 1, C.g2); },
  peixe_grelhado: (g) => { disc(g, 8, 9, 5, "#e8f1f5"); disc(g, 8, 9, 4, C.b2); P(g, 12, 7, 3, 1, C.b3); P(g, 5, 8, 1, 1, "#fff"); line(g, 6, 11, 10, 6, "#b5652f"); },
  torta: (g) => { disc(g, 8, 10, 5, "#c98a4a"); disc(g, 8, 9, 5, "#e8b575"); for (let i = 0; i < 4; i++) P(g, 4 + i * 3, 7, 2, 2, "#f7d9a8"); P(g, 6, 5, 4, 2, "#e04a3c"); },
  doce_mel: (g) => { disc(g, 8, 9, 5, "#c99a2a"); disc(g, 8, 8, 4, "#f7cf6e"); disc(g, 7, 7, 2, "#fff0b8"); P(g, 8, 2, 1, 3, C.w4); },
  pizza: (g) => { for (let i = 0; i < 9; i++) { P(g, 4 + i, 4 + i, 9 - i, 1, "#e8b575"); } P(g, 5, 5, 7, 1, "#e8b575"); for (let i = 0; i < 5; i++) P(g, 6 + i, 5 + i, 1, 1, "#e04a3c"); P(g, 4, 4, 9, 1, "#c98a4a"); },
  banquete: (g) => { disc(g, 8, 11, 4, "#e8f1f5"); disc(g, 8, 10, 3, "#d9e8ef"); P(g, 2, 2, 3, 3, C.o2); P(g, 5, 3, 3, 3, C.g3); P(g, 9, 2, 3, 3, C.y2); P(g, 11, 5, 3, 2, C.r2); },
  estufa: (g) => { P(g, 3, 6, 10, 7, "#bfe6da"); P(g, 3, 6, 10, 1, "#e8f8f2"); P(g, 3, 12, 10, 1, "#8fbfb0"); for (let i = 0; i < 4; i++) P(g, 3 + i * 3, 6, 1, 7, "#8fbfb0"); P(g, 5, 2, 6, 2, "#c9564a"); P(g, 13, 3, 1, 4, C.w4); },
  animal: (g) => { disc(g, 7, 9, 4, "#f6f1e6"); disc(g, 10, 5, 3, "#f6f1e6"); P(g, 11, 2, 1, 2, C.w2); P(g, 9, 4, 1, 1, C.ink); P(g, 12, 5, 1, 1, C.ink); P(g, 4, 12, 6, 1, "#d9d0be"); },
  casa: (g) => { P(g, 2, 7, 12, 7, "#f2ddc0"); P(g, 2, 13, 12, 1, "#cfae86"); for (let i = 0; i < 5; i++) P(g, 2 + i, 6 - i, 12 - i * 2, 2, C.roof1); P(g, 7, 9, 3, 5, C.w3); P(g, 3, 8, 2, 2, C.b1); P(g, 11, 8, 2, 2, C.b1); },
  celeiro: (g) => { P(g, 2, 6, 12, 8, "#c0503f"); P(g, 2, 6, 12, 1, "#d97a63"); for (let i = 0; i < 4; i++) P(g, 2 + i, 5 - i, 12 - i * 2, 2, "#8f3129"); P(g, 6, 8, 6, 6, "#a8453a"); line(g, 6, 8, 11, 13, "#f2ead6"); line(g, 11, 8, 6, 13, "#f2ead6"); },
  cerca: (g) => { P(g, 1, 6, 2, 9, C.w3); P(g, 7, 6, 2, 9, C.w3); P(g, 13, 6, 2, 9, C.w3); P(g, 1, 8, 14, 2, C.w2); P(g, 1, 11, 14, 2, C.w2); },
  oficina: (g) => { P(g, 2, 7, 12, 6, "#9c8f82"); P(g, 2, 7, 12, 1, "#b8ab9c"); P(g, 4, 9, 8, 2, "#6f6459"); P(g, 4, 2, 1, 6, C.s2); P(g, 7, 1, 2, 2, C.s2); P(g, 9, 3, 4, 1, C.s2); },
  casa_exp: (g) => { P(g, 1, 8, 9, 5, "#f2ddc0"); for (let i = 0; i < 4; i++) P(g, 1 + i, 7 - i, 9 - i * 2, 2, C.roof1); P(g, 10, 9, 5, 4, "#e8d6b0"); P(g, 12, 5, 2, 3, "#7cb98a"); P(g, 11, 6, 4, 1, "#7cb98a"); },
  pocilga: (g) => { disc(g, 8, 9, 4, "#f0b8c0"); disc(g, 8, 8, 3, "#ffd0d8"); P(g, 6, 9, 1, 2, "#c98a96"); P(g, 9, 9, 1, 2, "#c98a96"); P(g, 5, 4, 2, 2, "#f0b8c0"); P(g, 9, 4, 2, 2, "#f0b8c0"); P(g, 6, 5, 1, 1, C.ink); P(g, 9, 5, 1, 1, C.ink); },
};

// ---------- interface ----------
const uiIcons = {
  coin: (g) => { disc(g, 8, 8, 6, "#c99a2a"); disc(g, 8, 8, 5, "#f2c34f"); disc(g, 8, 8, 3, "#ffe9a8"); P(g, 7, 5, 2, 6, "#c99a2a"); P(g, 6, 7, 4, 2, "#c99a2a"); },
  clock: (g) => { disc(g, 8, 8, 6, "#c2c1b6"); disc(g, 8, 8, 5, "#f6f4ea"); disc(g, 8, 8, 1, "#c9564a"); P(g, 8, 4, 1, 4, "#4a4a48"); P(g, 8, 8, 3, 1, "#4a4a48"); },
  map: (g) => { P(g, 2, 3, 12, 10, "#e8d6b0"); P(g, 2, 3, 4, 10, "#d9c39a"); P(g, 10, 3, 4, 10, "#d9c39a"); line(g, 6, 3, 6, 13, "#b8a074"); line(g, 10, 3, 10, 13, "#b8a074"); P(g, 3, 5, 2, 1, C.g3); P(g, 7, 8, 2, 1, C.g3); P(g, 11, 6, 2, 1, C.g3); P(g, 8, 10, 1, 1, "#c9564a"); },
  bank: (g) => { P(g, 2, 6, 12, 7, "#e8e3d4"); P(g, 2, 6, 12, 1, "#fff8ea"); P(g, 1, 4, 14, 2, "#c2c1b6"); for (let i = 0; i < 3; i++) P(g, 3 + i, 3, 10 - i * 2, 1, "#c2c1b6"); P(g, 3, 7, 2, 5, "#fff8ea"); P(g, 7, 7, 2, 5, "#fff8ea"); P(g, 11, 7, 2, 5, "#fff8ea"); P(g, 2, 13, 12, 1, "#b8b3a2"); disc(g, 8, 9, 1, "#e8b44a"); },
  job: (g) => { P(g, 2, 5, 12, 8, "#a97a48"); P(g, 2, 5, 12, 1, "#c99a63"); P(g, 5, 4, 6, 2, "#8a5a33"); P(g, 2, 8, 12, 1, "#8a5a33"); P(g, 7, 8, 2, 3, "#e8c15c"); },
  kitchen: (g) => { disc(g, 8, 10, 5, "#4a4a48"); disc(g, 8, 10, 4, "#6f6f6a"); disc(g, 8, 9, 3, "#8f8f88"); line(g, 12, 3, 15, 3, "#6f6f6a"); P(g, 6, 8, 2, 1, "#ffe066"); P(g, 9, 9, 2, 1, C.r2); },
  quest: (g) => { P(g, 3, 2, 10, 12, "#f2e6cc"); P(g, 3, 2, 10, 1, "#fff8ea"); P(g, 3, 13, 10, 1, "#d9c8a4"); P(g, 5, 5, 6, 1, "#8a7a60"); P(g, 5, 7, 6, 1, "#8a7a60"); P(g, 5, 9, 4, 1, "#8a7a60"); P(g, 2, 2, 2, 12, "#c99a63"); },
  coop: (g) => { P(g, 2, 7, 5, 4, "#e8c15c"); P(g, 9, 7, 5, 4, "#e8c15c"); P(g, 3, 5, 3, 2, "#f2d27a"); P(g, 10, 5, 3, 2, "#f2d27a"); P(g, 6, 6, 4, 2, "#c99a2a"); P(g, 7, 8, 2, 3, "#c99a2a"); },
  community: (g) => { P(g, 2, 8, 12, 5, "#e8e3d4"); P(g, 2, 8, 12, 1, "#fff8ea"); for (let i = 0; i < 3; i++) P(g, 1 + i * 2, 5 - i, 14 - i * 4, 2, "#c2c1b6"); P(g, 3, 9, 2, 4, "#fff8ea"); P(g, 7, 9, 2, 4, "#fff8ea"); P(g, 11, 9, 2, 4, "#fff8ea"); },
  friends: (g) => { disc(g, 6, 6, 3, "#ffd9ad"); disc(g, 11, 7, 2.5, "#ffd9ad"); P(g, 3, 9, 6, 4, "#5b9bd5"); P(g, 9, 10, 5, 3, "#e2695e"); },
  settings: (g) => { disc(g, 8, 8, 5, "#8f8f88"); disc(g, 8, 8, 2, "#4a4a48"); for (let i = 0; i < 4; i++) { P(g, 7, 1 + i * 12, 2, 3, "#8f8f88"); P(g, 1, 7, 3, 2, "#8f8f88"); P(g, 12, 7, 3, 2, "#8f8f88"); } disc(g, 8, 8, 5, "#ffffff00"); },
  help: (g) => { disc(g, 8, 8, 6, "#5b9bd5"); disc(g, 8, 8, 5, "#7fb8e8"); P(g, 6, 5, 4, 2, "#fff"); P(g, 9, 6, 2, 3, "#fff"); P(g, 7, 8, 2, 2, "#fff"); P(g, 7, 11, 2, 2, "#fff"); },
  bag: (g) => { P(g, 3, 6, 10, 8, "#a97a48"); P(g, 3, 6, 10, 1, "#c99a63"); P(g, 5, 3, 6, 2, "#8a5a33"); P(g, 5, 8, 6, 4, "#8a5a33"); P(g, 7, 9, 2, 2, "#e8c15c"); },
  travel: (g) => { for (let i = 0; i < 5; i++) P(g, 3 + i, 6 - i, 10 - i * 2, 2, C.b2); P(g, 3, 8, 10, 2, "#dfe9ee"); P(g, 4, 10, 2, 2, "#8f8f88"); P(g, 10, 10, 2, 2, "#8f8f88"); },
  hammer: (g) => { line(g, 4, 13, 9, 6, C.w2, 2); P(g, 8, 3, 5, 4, C.s2); P(g, 8, 3, 5, 1, C.s0 || "#f0efe8"); P(g, 11, 4, 2, 2, C.s3); },
  heart: (g) => { disc(g, 5, 6, 3, C.r2); disc(g, 11, 6, 3, C.r2); for (let i = 0; i < 6; i++) P(g, 3 + i, 8 + i, 10 - i * 2, 1, C.r2); P(g, 4, 5, 2, 1, "#ffb3a8"); },
  star: (g) => { P(g, 7, 1, 2, 4, C.y2); P(g, 7, 11, 2, 3, C.y2); P(g, 1, 6, 4, 2, C.y2); P(g, 10, 6, 4, 2, C.y2); disc(g, 8, 8, 3, C.y1); disc(g, 8, 8, 2, C.y2); P(g, 6, 6, 1, 1, "#fff8d8"); },
  sun: (g) => { disc(g, 8, 8, 4, C.y2); disc(g, 8, 7, 3, C.y1); for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4; P(g, 8 + Math.round(Math.cos(a) * 6), 8 + Math.round(Math.sin(a) * 6), 1, 1, C.y2); } },
  moon: (g) => { disc(g, 9, 8, 5, "#dfe7f2"); disc(g, 11, 6, 4, "#2a3350"); disc(g, 6, 10, 1, 1, "#c9d3e2"); },
  cloud: (g) => { disc(g, 6, 9, 3, "#e8eef5"); disc(g, 10, 8, 4, "#f4f8fc"); disc(g, 8, 11, 4, "#dfe7f0"); },
  rain: (g) => { disc(g, 6, 6, 3, "#c9d6e2"); disc(g, 10, 5, 4, "#dfe9f2"); for (let i = 0; i < 3; i++) line(g, 5 + i * 3, 10, 4 + i * 3, 13, "#7fc7e8"); },
  snow: (g) => { for (let i = 0; i < 3; i++) { line(g, 8 - i * 5, 4, 8 - i * 5, 12, "#e8f4ff"); line(g, 4, 6 + i * 3, 12, 6 + i * 3, "#e8f4ff"); } },
  fog: (g) => { for (let i = 0; i < 3; i++) P(g, 2 + i, 5 + i * 3, 12 - i * 2, 2, "rgba(230,238,245,.9)"); },
  check: (g) => { line(g, 3, 8, 7, 12, "#7cb98a", 2); line(g, 7, 12, 13, 4, "#7cb98a", 2); },
  close: (g) => { line(g, 4, 4, 12, 12, "#c9564a", 2); line(g, 12, 4, 4, 12, "#c9564a", 2); },
  chat: (g) => { P(g, 2, 4, 12, 7, "#f4f1e4"); P(g, 2, 4, 12, 1, "#fff"); P(g, 5, 11, 3, 2, "#f4f1e4"); P(g, 5, 7, 1, 1, "#8a7a60"); P(g, 8, 7, 1, 1, "#8a7a60"); P(g, 11, 7, 1, 1, "#8a7a60"); },
  send: (g) => { for (let i = 0; i < 7; i++) P(g, 3 + i, 8 - i, 2, 2, "#7cb98a"); P(g, 3, 9, 6, 2, "#9fd074"); },
  music: (g) => { P(g, 9, 2, 2, 9, "#5b9bd5"); P(g, 9, 2, 5, 2, "#5b9bd5"); disc(g, 7, 12, 2, "#5b9bd5"); },
  sfx: (g) => { P(g, 3, 6, 3, 5, "#8f8f88"); P(g, 6, 4, 2, 9, "#a8a8a2"); P(g, 9, 5, 1, 7, "#c2c1b6"); P(g, 11, 3, 1, 11, "#dfe4e8"); },
  save: (g) => { P(g, 2, 2, 12, 12, "#4a6f8f"); P(g, 4, 2, 8, 4, "#dfe9f2"); P(g, 4, 8, 8, 6, "#e8f1f5"); P(g, 6, 9, 4, 3, "#8fb8cf"); },
  sleep: (g) => { disc(g, 8, 9, 5, "#a8c6dc"); disc(g, 10, 7, 4, "#2a3350"); P(g, 2, 2, 1, 1, "#fff"); P(g, 11, 2, 1, 1, "#fff"); },
  warning: (g) => { for (let i = 0; i < 6; i++) P(g, 8 - i, 3 + i, i * 2, 2, C.y2); P(g, 4, 12, 8, 2, C.y2); P(g, 7, 6, 2, 5, "#6b4a12"); P(g, 7, 11, 2, 2, "#6b4a12"); },
  seed: toolIcons.semente,
  calendar: (g) => { P(g, 2, 4, 12, 10, "#f4f1e4"); P(g, 2, 4, 12, 3, "#c9564a"); P(g, 4, 2, 1, 3, "#8f8f88"); P(g, 11, 2, 1, 3, "#8f8f88"); for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) P(g, 4 + i * 3, 9 + j * 3, 2, 1, "#b8b3a2"); },
  arrow: (g) => { for (let i = 0; i < 5; i++) P(g, 4 + i, 8 - i, 2, 2, "#fff3d6"); for (let i = 0; i < 5; i++) P(g, 4 + i, 8 + i, 2, 2, "#fff3d6"); P(g, 3, 7, 2, 4, "#fff3d6"); },
  fish: itemIcons.peixe,
  paw: (g) => { disc(g, 8, 10, 3, "#c98a4a"); disc(g, 5, 6, 1.6, "#c98a4a"); disc(g, 8, 5, 1.6, "#c98a4a"); disc(g, 11, 6, 1.6, "#c98a4a"); },
  play: (g) => { for (let i = 0; i < 7; i++) { P(g, 5 + i, 4 + i, 2, 9 - i * 1.3, "#eaf6df"); } P(g, 4, 3, 2, 11, "#eaf6df"); P(g, 5, 4, 3, 10, "#f6ffee"); },
  sprout: (g) => { P(g, 7, 9, 2, 6, C.g3); P(g, 3, 6, 5, 3, C.g2); P(g, 8, 4, 5, 3, C.g2); P(g, 4, 5, 2, 2, C.g1); P(g, 9, 3, 2, 2, C.g1); P(g, 4, 13, 8, 2, C.w3); },
  paint: (g) => { P(g, 3, 3, 8, 8, "#c9564a"); P(g, 3, 3, 8, 2, "#e0746a"); P(g, 11, 9, 3, 3, "#8a5a33"); P(g, 5, 5, 2, 2, "#fff3d6"); },
  sparkle: (g) => { P(g, 7, 2, 2, 6, "#fff6d0"); P(g, 7, 9, 2, 5, "#fff6d0"); P(g, 2, 7, 6, 2, "#fff6d0"); P(g, 9, 7, 5, 2, "#fff6d0"); P(g, 7, 7, 2, 2, "#ffd166"); },
};

export const ICON_KEYS = { ...toolIcons, ...itemIcons, ...uiIcons };

// PNG hand-drawn premium tools (gerados via IA, aprovado opção 2)
const PNG_ICONS = {
  foice: "assets/tool_foice_preview_icon.png",
  picareta: "assets/tool_picareta_preview_icon.png",
  machado: "assets/tool_machado_preview_icon.png",
};
const cache = new Map();
export function iconURL(key) {
  if (PNG_ICONS[key]) return PNG_ICONS[key];
  if (!key) return "";
  if (cache.has(key)) return cache.get(key);
  const fn = toolIcons[key] || itemIcons[key] || uiIcons[key];
  let url;
  if (!fn) {
    // fallback: ponto dourado (não deixa buraco na interface)
    const { c, g } = newIcon();
    disc(g, 8, 8, 3, "#e8c15c");
    url = c.toDataURL("image/png");
  } else {
    url = render(key, fn);
  }
  cache.set(key, url);
  return url;
}

export function iconImg(key, cls = "pxIcon", size = 24) {
  const url = iconURL(key);
  return `<img class="${cls}" src="${url}" width="${size}" height="${size}" alt="" draggable="false" style="width:${size}px;height:${size}px">`;
}

/** Emoji → chave de ícone (para reaproveitar textos existentes). */
export const EMOJI_TO_ICON = {
  "🌾": "trigo", "🎣": "peixe", "🏠": "casa", "💰": "coin", "🪵": "madeira", "🍳": "kitchen",
  "🔨": "hammer", "✅": "check", "🐔": "animal", "⛏": "picareta", "⛏️": "picareta", "💼": "job",
  "🏛": "community", "🏛️": "community", "🏦": "bank", "⛵": "travel", "✈": "travel", "✈️": "travel",
  "🌱": "semente", "🐟": "peixe", "🗺": "map", "🗺️": "map", "⛰": "pedra", "⛰️": "pedra",
  "🪨": "pedra", "🏪": "casa", "☀": "sun", "☀️": "sun", "★": "star", "⭐": "star", "🌲": "trigo",
  "🤝": "coop", "👥": "friends", "🌉": "travel", "🪑": "casa", "🏖": "travel", "🏖️": "travel",
  "🌴": "sun", "🔧": "hammer", "✔": "check", "🪓": "machado", "🛏": "sleep", "🛏️": "sleep",
  "🛒": "bag", "⛲": "community", "📚": "quest", "🐄": "animal", "🐑": "animal", "💡": "sparkle",
  "🎁": "heart", "💕": "heart", "💍": "heart", "💒": "heart", "🍲": "sopa", "📜": "quest",
  "⚙": "settings", "⚙️": "settings", "🏥": "casa", "🥖": "pao", "🧀": "queijo", "🍯": "mel",
  "🥕": "nabo", "🌟": "star", "✨": "sparkle", "💫": "sparkle", "📦": "bag", "☁": "cloud",
  "☁️": "cloud", "🌧": "rain", "🌧️": "rain", "🌫": "fog", "🌫️": "fog", "❄": "snow", "❄️": "snow",
  "🎉": "star", "❌": "close", "📌": "map", "❤": "heart", "❤️": "heart", "🔥": "kitchen",
  "📍": "map", "🔒": "warning", "🌍": "map", "❓": "help", "🎒": "bag", "🌊": "travel",
  "🎵": "music", "🔊": "sfx", "🔉": "sfx", "💾": "save", "💵": "coin", "🧾": "quest",
  "🍞": "pao", "🥗": "salada", "🍰": "torta", "🍕": "pizza", "🍱": "banquete", "🏝": "travel",
  "🏝️": "travel", "🛖": "casa", "🏙": "casa", "🛠": "hammer", "🏬": "casa", "🥔": "batata",
  "🍓": "morango", "🍅": "tomate", "🌽": "milho", "🎃": "abobora", "🥬": "repolho", "🥚": "ovo",
  "🥛": "leite", "🧶": "la", "💎": "minerio", "🍄": "cogumelo", "🐚": "concha", "🚿": "regador",
  "🍺": "mel", "🚜": "celeiro", "⛪": "community", "🏚": "celeiro", "🌿": "estufa", "🐷": "pocilga",
  "🛣": "travel", "⚓": "travel", "🙂": "friends", "💛": "heart", "😊": "friends", "🌙": "moon",
  "👑": "star", "👶": "friends", "🧒": "friends", "👧": "friends", "👨": "friends", "👩": "friends",
  "🧑": "friends", "👤": "friends", "👋": "friends", "💬": "chat", "💊": "heart", "🤗": "heart",
  "💋": "heart", "🤍": "heart", "🧔": "friends", "🧜": "friends", "🧙": "friends", "📖": "quest",
  "🏭": "oficina", "🏢": "casa", "📄": "quest", "🏗": "hammer", "🏗️": "hammer", "⏰": "clock",
  "⏱": "clock", "⏱️": "clock", "🕘": "clock", "😴": "sleep", "⛰️": "pedra",
};

const EMOJI_RE = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/gu;

/** Substitui emojis dentro de um elemento por ícones em pixel art. */
export function iconize(root) {
  if (!root || typeof document === "undefined" || !document.createTreeWalker) return;
  const walker = document.createTreeWalker(root, 4 /* NodeFilter.SHOW_TEXT */);
  const jobs = [];
  let n;
  while ((n = walker.nextNode())) {
    if (!EMOJI_RE.test(n.nodeValue)) { EMOJI_RE.lastIndex = 0; continue; }
    EMOJI_RE.lastIndex = 0;
    jobs.push(n);
  }
  for (const node of jobs) {
    const text = node.nodeValue;
    const frag = document.createDocumentFragment();
    let last = 0;
    let m;
    const re = new RegExp(EMOJI_RE.source, "gu");
    while ((m = re.exec(text))) {
      if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
      const key = EMOJI_TO_ICON[m[0]];
      if (key) {
        const img = document.createElement("img");
        img.src = iconURL(key);
        img.className = "emj";
        img.width = 16; img.height = 16;
        img.alt = "";
        img.draggable = false;
        img.style.cssText = "width:16px;height:16px;vertical-align:-3px;margin:0 1px;image-rendering:pixelated";
        frag.appendChild(img);
      }
      last = m.index + m[0].length;
    }
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    node.parentNode.replaceChild(frag, node);
  }
}
