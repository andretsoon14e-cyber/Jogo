// Helpers de pixel art: canvas offscreen, sprites por "ASCII" e cache.
import { PIX } from "./palette.js";

export function mkCanvas(w, h) {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.ceil(w));
  c.height = Math.max(1, Math.ceil(h));
  const ctx = c.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  return c;
}

/** Converte linhas de letras em sprite (1 letra = 1 pixel de arte = PIX px). */
export function spriteFromRows(rows, colors, { scale = 1, px = PIX } = {}) {
  const w = rows[0].length, h = rows.length;
  const s = px * scale;
  const c = mkCanvas(w * s, h * s);
  const ctx = c.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ch = rows[y][x];
      const col = colors[ch];
      if (!col) continue;
      ctx.fillStyle = col;
      ctx.fillRect(x * s, y * s, s, s);
    }
  }
  return c;
}

const cache = new Map();
export function cached(key, build) {
  let v = cache.get(key);
  if (v === undefined) { v = build(); cache.set(key, v); }
  return v;
}
export function clearCache(prefix) {
  if (!prefix) return cache.clear();
  for (const k of [...cache.keys()]) if (k.startsWith(prefix)) cache.delete(k);
}

/** Blit de sprite com "pixel snapping" para não tremer ao andar. */
export function blit(ctx, img, x, y, flip = false) {
  x = Math.round(x); y = Math.round(y);
  if (flip) {
    ctx.save();
    ctx.translate(x + img.width, y);
    ctx.scale(-1, 1);
    ctx.drawImage(img, 0, 0);
    ctx.restore();
  } else {
    ctx.drawImage(img, x, y);
  }
}

/** Sombra elíptica suave usada por personagens/objetos. */
export function shadow(ctx, x, y, rx, ry, a = 0.22) {
  ctx.save();
  ctx.fillStyle = `rgba(28,34,22,${a})`;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Desenha um "vulto" pixelado (para partículas/smoke) */
export function puffs(ctx, x, y, size, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fill();
}

/** Ruído determinístico 0..1 */
export function hash(x, y, seed = 0) {
  let h = (x * 374761393 + y * 668265263 + seed * 2246822519) >>> 0;
  h = (h ^ (h >>> 13)) >>> 0;
  h = (h * 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Escolha determinística de uma lista */
export function pick(list, x, y, seed = 0) {
  return list[Math.floor(hash(x, y, seed) * list.length) % list.length];
}

/** Traça uma linha de "pixels de arte" */
export function pxLine(ctx, x0, y0, x1, y1, color, s = PIX) {
  ctx.fillStyle = color;
  let x = Math.round(x0), y = Math.round(y0);
  const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? s : -s, sy = y0 < y1 ? s : -s;
  let err = dx - dy;
  while (true) {
    ctx.fillRect(x, y, s, s);
    if (Math.abs(x - x1) < s && Math.abs(y - y1) < s) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x += sx; }
    if (e2 < dx) { err += dx; y += sy; }
    if (Math.abs(x - x0) > 400 || Math.abs(y - y0) > 400) break;
  }
}

/** Retângulo pixelado */
export function pxRect(ctx, x, y, w, h, color, s = PIX) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x) * s, Math.round(y) * s, w * s, h * s);
}

/** Corpo arredondado com degraus (sem antialias) */
export function pxRound(ctx, x, y, w, h, color, s = PIX, corner = 1) {
  ctx.fillStyle = color;
  const X = x * s, Y = y * s, W = w * s, H = h * s, c = corner * s;
  ctx.fillRect(X + c, Y, W - c * 2, H);
  ctx.fillRect(X, Y + c, W, H - c * 2);
}

/** Texto com contorno escuro (legível sobre qualquer fundo) */
export function inkText(ctx, text, x, y, { size = 12, fill = "#fff", stroke = "rgba(30,20,12,.85)", weight = "800", align = "center", font = "Trebuchet MS, Segoe UI, sans-serif", lw = 3 } = {}) {
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  ctx.lineJoin = "round";
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.strokeText(text, x, y); }
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
}
