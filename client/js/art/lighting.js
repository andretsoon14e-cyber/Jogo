// ============================================================
//  Iluminação: luz do dia, anoitecer, noite, lâmpadas e janelas.
//  Nada de filtro preto chapado — usamos cor + vinheta suave e
//  luzes aditivas, mantendo a arte legível.
// ============================================================
import { cached, mkCanvas } from "./pixel.js";

/** Estado de luz para um minuto do dia. */
export function lightState(minutes, weather) {
  const h = minutes / 60;
  let tint = null, dark = 0, warm = 0, lamp = 0;
  if (h < 5) { dark = 0.34; tint = [40, 56, 108, 0.34]; lamp = 1; }
  else if (h < 6.5) {
    const k = (h - 5) / 1.5;
    dark = 0.30 * (1 - k); tint = [92, 108, 152, 0.24 * (1 - k)]; lamp = 1 - k * 0.55;
    warm = 0.12 + k * 0.14;
  } else if (h < 8.5) {
    const k = (h - 6.5) / 2;
    dark = 0.04 * (1 - k); tint = [255, 206, 158, 0.07 * (1 - k)];
    warm = 0.16 * (1 - k * 0.5); lamp = Math.max(0, 0.22 * (1 - k));
  } else if (h < 16.5) { warm = 0.05; }
  else if (h < 18.4) {
    const k = (h - 16.5) / 1.9;
    warm = 0.07 + k * 0.24; tint = [255, 158, 92, k * 0.12];
  } else if (h < 20) {
    const k = (h - 18.4) / 1.6;
    dark = k * 0.24; tint = [72, 66, 130, k * 0.20]; warm = 0.26 * (1 - k * 0.5); lamp = k;
  } else {
    dark = 0.28; tint = [44, 58, 108, 0.30]; lamp = 1;
  }
  if (weather === "Chuvoso") { dark = Math.min(0.5, dark + 0.13); tint = tint || [70, 96, 130, 0.2]; lamp = Math.max(lamp, 0.55); }
  if (weather === "Nublado") { dark = Math.min(0.4, dark + 0.05); }
  if (weather === "Nevoa") { dark = Math.min(0.4, dark + 0.03); }
  return { dark, tint, warm, lamp, night: lamp > 0.5, h };
}

const vignetteCache = new Map();
function vignette(W, H) {
  const key = W + "x" + H;
  if (vignetteCache.has(key)) return vignetteCache.get(key);
  const c = mkCanvas(W, H);
  const g = c.getContext("2d");
  const grd = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
  grd.addColorStop(0, "rgba(20,26,40,0)");
  grd.addColorStop(1, "rgba(18,24,38,.10)");
  g.fillStyle = grd;
  g.fillRect(0, 0, W, H);
  vignetteCache.set(key, c);
  if (vignetteCache.size > 4) vignetteCache.delete(vignetteCache.keys().next().value);
  return c;
}

/** Aplica luz do dia + vinheta. */
const glowCache = new Map();
function cachedGlowSprite(color, strength) {
  const key = color + "|" + strength.toFixed(2);
  let c = glowCache.get(key);
  if (c) return c;
  const S = 128;
  c = mkCanvas(S, S);
  const g = c.getContext("2d");
  const grd = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  grd.addColorStop(0, `rgba(${color},${strength})`);
  grd.addColorStop(0.45, `rgba(${color},${strength * 0.32})`);
  grd.addColorStop(1, `rgba(${color},0)`);
  g.fillStyle = grd;
  g.fillRect(0, 0, S, S);
  glowCache.set(key, c);
  if (glowCache.size > 24) glowCache.delete(glowCache.keys().next().value);
  return c;
}

export function applyDaylight(ctx, W, H, minutes, weather, indoors = false) {
  const L = lightState(minutes, weather);
  if (indoors) {
    // interiores: luz ambiente quente, sem escurecer demais
    ctx.save();
    const grd = ctx.createRadialGradient(W / 2, H * 0.4, 40, W / 2, H * 0.4, Math.max(W, H) * 0.8);
    grd.addColorStop(0, "rgba(255,226,170,.10)");
    grd.addColorStop(1, "rgba(60,40,30,.30)");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
    return L;
  }
  // luz quente direcional (manhã pela esquerda, tarde pela direita)
  if (L.warm > 0.02) {
    const sunX = L.h < 12 ? W * 0.1 : W * 0.9;
    const grd = ctx.createRadialGradient(sunX, H * 0.18, 40, sunX, H * 0.18, Math.max(W, H) * 0.95);
    grd.addColorStop(0, `rgba(255,214,140,${L.warm * 0.5})`);
    grd.addColorStop(0.55, `rgba(255,196,120,${L.warm * 0.22})`);
    grd.addColorStop(1, "rgba(255,180,100,0)");
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  if (L.tint) {
    const [r, g, b, a] = L.tint;
    ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
    ctx.fillRect(0, 0, W, H);
  }
  if (L.dark > 0.02) {
    ctx.fillStyle = `rgba(22,30,58,${Math.min(0.22, L.dark)})`;
    ctx.fillRect(0, 0, W, H);
    // "luz da lua": realce azulado nas áreas altas
    const moon = ctx.createLinearGradient(0, 0, W * 0.6, H);
    moon.addColorStop(0, `rgba(120,160,230,${L.dark * 0.30})`);
    moon.addColorStop(1, "rgba(90,120,200,0)");
    ctx.save();
    ctx.globalCompositeOperation = "soft-light";
    ctx.fillStyle = moon;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  // Warm amber wash at dusk like Stardew farm (18h-21h)
  if (L.h >= 17.5 && L.h < 20.5 && !indoors) {
    const k = 1 - Math.abs(L.h - 19) / 1.5
    if (k>0) {
      ctx.fillStyle = `rgba(255, 148, 64, ${0.12*k})`
      ctx.fillRect(0,0,W,H)
    }
  }
  ctx.drawImage(vignette(W, H), 0, 0);
  return L;
}

/** Brilho aditivo (janelas, postes, forja). */
export function glow(ctx, x, y, radius, color = "255,205,120", strength = 0.5) {
  const key = color + "|" + strength.toFixed(2);
  let spr = glowCache.get(key);
  if (!spr) {
    const S = 64;
    spr = mkCanvas(S, S);
    const g = spr.getContext("2d");
    const grd = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    grd.addColorStop(0, `rgba(${color},${strength})`);
    grd.addColorStop(0.5, `rgba(${color},${strength * 0.25})`);
    grd.addColorStop(1, `rgba(${color},0)`);
    g.fillStyle = grd;
    g.fillRect(0, 0, S, S);
    glowCache.set(key, spr);
    if (glowCache.size > 24) glowCache.delete(glowCache.keys().next().value);
  }
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.drawImage(spr, x - radius, y - radius, radius * 2, radius * 2);
  ctx.restore();
}

/** Feixes de sol da manhã (linhas diagonais suaves). */
export function sunRays(ctx, W, H, minutes, time) {
  if (minutes < 6 * 60 || minutes > 9 * 60) return;
  const k = 1 - Math.abs(minutes - 7.5 * 60) / (1.5 * 60);
  if (k <= 0) return;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = 0.05 * k;
  ctx.fillStyle = "#ffe9b0";
  for (let i = 0; i < 6; i++) {
    const x = ((i * 260 + time * 6) % (W + 400)) - 200;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 90, 0);
    ctx.lineTo(x + 300, H);
    ctx.lineTo(x + 210, H);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}
