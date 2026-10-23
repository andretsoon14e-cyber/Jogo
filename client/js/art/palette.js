// ============================================================
//  Vale Aconchegante — Direção de arte
//  Paleta original, harmoniosa e por estação. Tudo desenhado
//  em pixel art: unidades de 2px, contornos quentes, sombras
//  com deslocamento para baixo/direita.
// ============================================================

export const PIX = 3.8; // 1 "pixel de arte" = 3.4px (zoom Stardew real: personagem grande)
export const TILE = 32;

// ---------- Paleta-mãe (tons naturais) ----------
export const C = {
  // madeira / terra
  wood0: "#f0cfa0", wood1: "#d9a86c", wood2: "#b8844c", wood3: "#8d5f34", wood4: "#5f3d22", wood5: "#3c2615",
  // pedra
  stone0: "#e7e6dd", stone1: "#c9c8bd", stone2: "#a8a79c", stone3: "#84837a", stone4: "#5f5e57", stone5: "#3e3d38",
  // telhas
  roof0: "#e2705c", roof1: "#c14f42", roof2: "#9c3a34", roof3: "#72282a",
  roofGold0: "#e8b44a", roofGold1: "#c48f2c", roofGold2: "#9a6c1d",
  roofBlue0: "#6f9fc0", roofBlue1: "#4a7d9e", roofBlue2: "#33607c",
  roofGreen0: "#7fa76a", roofGreen1: "#5d8850", roofGreen2: "#42663a",
  // vegetação
  leaf0: "#b7e07a", leaf1: "#8bc95b", leaf2: "#63a844", leaf3: "#437f34", leaf4: "#2c5c28",
  // água
  water0: "#b7ecff", water1: "#7fd3ef", water2: "#4aa9d4", water3: "#2f80ac", water4: "#1e5c85",
  // luz
  warm: "#ffcf7a", warmDeep: "#ff9d4d", lamp: "#ffe9a8",
  // pele (variações)
  skin0: "#ffe0bd", skin1: "#f6c99b", skin2: "#dfa273", skin3: "#b97a4e", skin4: "#8a5434",
  skinShade: "rgba(120,70,40,.28)",
  // roupas
  cloth: ["#e2695e", "#5b9bd5", "#e8c15c", "#7cb98a", "#b58fd1", "#e89a5c"],
  ink: "rgba(40,26,18,.85)",
};

// ---------- Temas por estação ----------
export const SEASON_ART = [
  { // Primavera
    name: "Primavera",
    grass: ["#74b24f", "#68a746", "#82c25b", "#5c9a3f"],
    grassDark: ["#4a8536", "#3f7530"],
    tuft: ["#8fd066", "#5f9f42"],
    leaf: ["#8ccc5d", "#6cb44a", "#4d9739", "#376f2c"],
    leafLight: "#b9e783",
    leafBloom: ["#ffd3e2", "#fff0b8", "#e6c9ff"],
    path: ["#d9c08c", "#ccb37e", "#e6d2a4"],
    pathEdge: "#b89a68",
    water: ["#7fd3ef", "#4aa9d4", "#2f80ac"],
    flowers: ["#fff4b8", "#ffbcd4", "#d9b8ff", "#ffd98a"],
    sky: "#bfe8ff",
    ambient: "petals",
    tint: [255, 240, 210],
  },
  { // Verão
    name: "Verão",
    grass: ["#6fae46", "#63a33e", "#7dbe51", "#578f39"],
    grassDark: ["#417a30", "#376b2b"],
    tuft: ["#93d061", "#5b9a3b"],
    leaf: ["#7fc251", "#5da83f", "#3f8c32", "#2b6a27"],
    leafLight: "#b0e07a",
    leafBloom: ["#ffe28a", "#ffc46b"],
    path: ["#e0c78f", "#d3b981", "#ecd6a6"],
    pathEdge: "#bf9f6c",
    water: ["#84dcf5", "#45a8d6", "#2a7cae"],
    flowers: ["#ffe066", "#ff9f68", "#ff7f9f", "#f8f0a0"],
    sky: "#a9e2ff",
    ambient: "pollen",
    tint: [255, 246, 206],
  },
  { // Outono
    name: "Outono",
    grass: ["#a8a054", "#9b944b", "#b8ae63", "#8b8440"],
    grassDark: ["#6e6733", "#5e582c"],
    tuft: ["#c6b96b", "#8e8443"],
    leaf: ["#d99a45", "#c2762f", "#a35a28", "#7f4520"],
    leafLight: "#edbf6c",
    leafBloom: ["#ffb066", "#e88a4a"],
    path: ["#d6bd91", "#c9ae84", "#e2cda4"],
    pathEdge: "#b3946a",
    water: ["#79c4e0", "#4694b8", "#2c6f92"],
    flowers: ["#e8a24a", "#d97b45", "#c9a74e"],
    sky: "#c6d8e2",
    ambient: "leaves",
    tint: [255, 226, 178],
  },
  { // Inverno
    name: "Inverno",
    grass: ["#cfe0e4", "#c3d6db", "#dbeaee", "#b4c9d0"],
    grassDark: ["#96acb6", "#8499a4"],
    tuft: ["#e8f3f6", "#b6cbd4"],
    leaf: ["#a9c2bd", "#8aa8a6", "#6b8c8f", "#4f6f75"],
    leafLight: "#dff0f0",
    leafBloom: ["#eaf6ff", "#cfe6f0"],
    path: ["#d5d3cb", "#c6c4bc", "#e2e0d8"],
    pathEdge: "#a8a69e",
    water: ["#9fd9ea", "#6bb6cd", "#478fa8"],
    flowers: ["#eaf6ff", "#d7e8f2"],
    sky: "#d3e4ee",
    ambient: "snow",
    tint: [222, 238, 248],
  },
];

export function theme(seasonIndex) {
  return SEASON_ART[((seasonIndex % 4) + 4) % 4];
}

// ---------- helpers de cor ----------
export function hexToRgb(hex) {
  if (!hex || typeof hex !== "string" || !hex.includes("#")) return [120, 120, 120];
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function rgbToHex(r, g, b) {
  return "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
}
export function shade(hex, amt) {
  if (!hex || typeof hex !== "string") return hex || "#888888";
  const [r, g, b] = hexToRgb(hex);
  if (amt >= 0) return rgbToHex(r + (255 - r) * amt, g + (255 - g) * amt, b + (255 - b) * amt);
  return rgbToHex(r * (1 + amt), g * (1 + amt), b * (1 + amt));
}
export function mix(a, b, t) {
  if (!a || !b) return a || b || "#888";
  const A = hexToRgb(a), B = hexToRgb(b);
  return rgbToHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
}
export function alpha(hex, a) {
  if (!hex || typeof hex !== "string") return `rgba(120,120,120,${a})`;
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}
