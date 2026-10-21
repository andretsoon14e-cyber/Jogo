// ============================================================
//  Vida ambiental: pássaros, borboletas, abelhas, vaga-lumes,
//  gatos, fumaça de chaminé, folhas ao vento e ondas na água.
//  Tudo puramente visual e determinístico por região.
// ============================================================
import { hash, cached, mkCanvas } from "./pixel.js";

function fireflyGlow() {
  return cached("fireflyGlow", () => {
    const S = 32;
    const c = mkCanvas(S, S);
    const g = c.getContext("2d");
    const grd = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    grd.addColorStop(0, "rgba(226,255,160,.95)");
    grd.addColorStop(0.4, "rgba(200,250,130,.30)");
    grd.addColorStop(1, "rgba(180,255,120,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, S, S);
    return c;
  });
}
import { birdSprites, butterflySprites, beeSprite, catSprites, smokePuff } from "./critters.js";

const state = new Map();

function rnd(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

export function ambientFor(regionKey, season, w, h) {
  const key = regionKey + ":" + w + "x" + h;
  let st = state.get(key);
  if (st) return st;
  const r = rnd(regionKey.length * 977 + w * 31 + h);
  const pickSpot = () => {
    for (let i = 0; i < 40; i++) {
      const x = 2 + r() * (w - 4);
      const y = 2 + r() * (h - 4);
      return { x, y };
    }
    return { x: w / 2, y: h / 2 };
  };
  st = {
    birds: Array.from({ length: 12 }, () => {
      const p = pickSpot();
      return { hx: p.x, hy: p.y, x: p.x, y: p.y, tx: p.x, ty: p.y, t: r() * 10, peck: 0, fly: 0, flyT: 0, dir: 1, speed: 0.25 + r() * 0.3 };
    }),
    butterflies: Array.from({ length: 16 }, () => {
      const p = pickSpot();
      return { hx: p.x, hy: p.y, ph: r() * 6.28, rad: 1 + r() * 2.2, sp: 0.25 + r() * 0.35, tint: Math.floor(r() * 3) };
    }),
    bees: Array.from({ length: 8 }, () => {
      const p = pickSpot();
      return { hx: p.x, hy: p.y, ph: r() * 6.28, rad: 0.6 + r() * 1.2, sp: 1.1 + r() * 0.9 };
    }),
    fireflies: Array.from({ length: 26 }, () => {
      const p = pickSpot();
      return { hx: p.x, hy: p.y, ph: r() * 6.28, rad: 0.7 + r() * 2.4, sp: 0.35 + r() * 0.5, b: r() * 6.28 };
    }),
    cats: Array.from({ length: 2 }, () => {
      const p = pickSpot();
      return { hx: p.x, hy: p.y, x: p.x, y: p.y, tx: p.x, ty: p.y, t: 0, dir: 1, sleep: 0 };
    }),
    smoke: [],
    leaves: [],
    lastSmoke: 0,
    season,
  };
  state.set(key, st);
  return st;
}

const isNight = (minutes) => minutes >= 19 * 60 || minutes < 6 * 60;

/** Atualiza e desenha a vida ambiental. Chamado a cada frame. */
export function drawAmbient(ctx, { regionKey, season, minutes, weather, sx, sy, player, buildings, time, dt, viewW, viewH }) {
  const st = ambientFor(regionKey, season, 70, 50);
  const bird = birdSprites();
  const bf = butterflySprites();
  const bee = beeSprite();
  const cat = catSprites();
  const night = isNight(minutes);

  // ---------------- PÁSSAROS ----------------
  for (const b of st.birds) {
    if (b.fly > 0) {
      b.flyT += dt;
      b.x += b.flyDx * dt * 4.2;
      b.y += b.flyDy * dt * 4.2 - Math.sin(b.flyT * 6) * 0.01;
      b.fly -= dt;
      const px = sx(b.x), py = sy(b.y) - Math.sin(b.flyT * 3) * 8;
      ctx.save();
      ctx.translate(px, py);
      ctx.scale(b.flyDx >= 0 ? 1 : -1, 1);
      ctx.drawImage(bird.fly, -7, -6);
      ctx.restore();
      if (b.fly <= 0) {
        b.hx = 2 + Math.random() * 60;
        b.hy = 2 + Math.random() * 40;
        b.x = b.hx; b.y = b.hy; b.tx = b.hx; b.ty = b.hy;
      }
      continue;
    }
    b.t -= dt;
    if (b.t <= 0) {
      b.t = 1.2 + Math.random() * 3;
      b.tx = b.hx + (Math.random() - 0.5) * 2.6;
      b.ty = b.hy + (Math.random() - 0.5) * 2.0;
      b.peck = Math.random() < 0.5 ? 0.55 : 0;
    }
    const dx = b.tx - b.x, dy = b.ty - b.y;
    const d = Math.hypot(dx, dy);
    if (d > 0.06) {
      b.x += (dx / d) * b.speed * dt * 2.4;
      b.y += (dy / d) * b.speed * dt * 2.4;
      b.dir = dx >= 0 ? 1 : -1;
    }
    if (b.peck > 0) b.peck -= dt;
    // fugir do jogador
    const distP = Math.hypot(b.x - player.x, b.y - player.y);
    if (distP < 2.2) {
      b.fly = 1.6 + Math.random();
      b.flyT = 0;
      const a = Math.atan2(b.y - player.y, b.x - player.x) + (Math.random() - 0.5);
      b.flyDx = Math.cos(a); b.flyDy = Math.sin(a) * 0.7;
      continue;
    }
    const px = sx(b.x), py = sy(b.y);
    if (px < -40 || py < -40 || px > viewW + 40 || py > viewH + 40) continue;
    ctx.save();
    ctx.translate(Math.round(px), Math.round(py));
    ctx.scale(b.dir >= 0 ? 1 : -1, 1);
    ctx.fillStyle = "rgba(20,26,18,.18)";
    ctx.beginPath(); ctx.ellipse(2, 11, 5, 2, 0, 0, 6.3); ctx.fill();
    const peck = b.peck > 0 ? Math.sin((0.55 - b.peck) * 30) * 2 : 0;
    ctx.drawImage(bird.ground, -7, -6 + peck);
    ctx.restore();
  }

  // ---------------- BORBOLETAS / ABELHAS ----------------
  if (!night && weather !== "Chuvoso" && weather !== "Neve") {
    for (const f of st.butterflies) {
      const t = time * f.sp + f.ph;
      const x = f.hx + Math.cos(t) * f.rad + Math.sin(t * 2.3) * 0.35;
      const y = f.hy + Math.sin(t * 1.6) * f.rad * 0.7 + Math.cos(t * 1.9) * 0.2;
      const px = sx(x), py = sy(y) - 10 - Math.sin(t * 5) * 3;
      if (px < -20 || py < -20 || px > viewW + 20 || py > viewH + 20) continue;
      const frames = f.tint === 0 ? bf.frames : f.tint === 1 ? bf.framesBlue : bf.framesPink;
      const img = frames[Math.floor(time * 14 + f.ph) % 2];
      ctx.drawImage(img, Math.round(px), Math.round(py));
    }
    for (const b of st.bees) {
      const t = time * b.sp + b.ph;
      const x = b.hx + Math.cos(t * 1.7) * b.rad;
      const y = b.hy + Math.sin(t * 2.1) * b.rad * 0.6;
      const px = sx(x), py = sy(y) - 12 + Math.sin(t * 8) * 2;
      if (px < -20 || py < -20 || px > viewW + 20 || py > viewH + 20) continue;
      ctx.drawImage(bee, Math.round(px), Math.round(py));
    }
  }

  // ---------------- VAGA-LUMES ----------------
  if (night) {
    for (const f of st.fireflies) {
      const t = time * f.sp + f.ph;
      const x = f.hx + Math.cos(t) * f.rad;
      const y = f.hy + Math.sin(t * 1.3) * f.rad * 0.8;
      const px = sx(x), py = sy(y) - 8 - Math.sin(t * 2) * 4;
      if (px < -20 || py < -20 || px > viewW + 20 || py > viewH + 20) continue;
      const a = 0.35 + Math.max(0, Math.sin(time * 2.2 + f.b)) * 0.65;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.drawImage(fireflyGlow(), px - 14, py - 14, 28, 28);
      ctx.restore();
      ctx.fillStyle = `rgba(240,255,180,${a})`;
      ctx.fillRect(px - 1, py - 1, 2, 2);
    }
  }

  // ---------------- GATOS ----------------
  for (const c of st.cats) {
    c.t -= dt;
    if (c.sleep > 0) {
      c.sleep -= dt;
      if (c.sleep <= 0) { c.tx = c.hx + (Math.random() - 0.5) * 3; c.ty = c.hy + (Math.random() - 0.5) * 2; }
    } else if (c.t <= 0) {
      c.t = 2.5 + Math.random() * 5;
      if (Math.random() < 0.35) c.sleep = 3 + Math.random() * 4;
      c.tx = c.hx + (Math.random() - 0.5) * 3.4;
      c.ty = c.hy + (Math.random() - 0.5) * 2.4;
    } else {
      const dx = c.tx - c.x, dy = c.ty - c.y;
      const d = Math.hypot(dx, dy);
      if (d > 0.05) {
        c.x += (dx / d) * dt * 0.7;
        c.y += (dy / d) * dt * 0.7;
        c.dir = dx >= 0 ? 1 : -1;
      }
    }
    const px = sx(c.x), py = sy(c.y);
    if (px < -30 || py < -30 || px > viewW + 30 || py > viewH + 30) continue;
    ctx.save();
    ctx.translate(Math.round(px), Math.round(py));
    ctx.scale(c.dir >= 0 ? 1 : -1, 1);
    ctx.fillStyle = "rgba(20,26,18,.16)";
    ctx.beginPath(); ctx.ellipse(0, 18, 9, 3, 0, 0, 6.3); ctx.fill();
    const frame = c.sleep > 0 ? 0 : Math.floor(time * 5) % 2;
    ctx.drawImage(cat.frames[frame], -14, -4);
    if (c.sleep > 0) {
      ctx.fillStyle = "rgba(255,255,255,.85)";
      ctx.font = "bold 9px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("z", 10, -8 - Math.sin(time * 2) * 2);
    }
    ctx.restore();
  }

  // ---------------- FUMAÇA DAS CHAMINÉS ----------------
  if (!st.lastSmoke || time - st.lastSmoke > 0.85) {
    st.lastSmoke = time;
    for (const b of buildings) {
      if (!["casa_player", "taverna", "ferraria", "carpintaria", "igreja", "prefeitura"].includes(b.id)) continue;
      if (Math.hypot(b.x + b.w / 2 - player.x, b.y + b.h / 2 - player.y) > 16) continue;
      const chimX = (b.x + b.w - (b.id === "ferraria" ? 0.8 : 0.55)) * 32;
      const chimY = b.y * 32 + (b.id === "igreja" ? -4 : 6);
      st.smoke.push({ wx: chimX, wy: chimY, t: 0, life: 2.4 + Math.random(), drift: (Math.random() - 0.3) * 12, size: 7 + Math.random() * 6 });
    }
  }
  const puffs = smokePuff();
  for (const s of st.smoke) s.t += dt;
  st.smoke = st.smoke.filter((s) => s.t < s.life);
  for (const s of st.smoke) {
    const px = sx(s.wx / 32) + s.drift * s.t;
    const py = sy(s.wy / 32) - s.t * 26;
    const k = s.t / s.life;
    ctx.save();
    ctx.globalAlpha = (1 - k) * 0.55;
    const sc = 1 + k * 1.9;
    ctx.drawImage(puffs, px - (8 * sc) / 2, py - (8 * sc) / 2, 8 * sc, 8 * sc);
    ctx.restore();
  }
}

/** Folhas/pétalas/poeira ao vento — efeito de tela (não depende da câmera). */
export function drawWindParticles(ctx, { season, minutes, weather, W, H, time, dt }) {
  const night = isNight(minutes);
  const want = season === 2 ? 26 : season === 0 ? 20 : season === 1 ? 12 : 14;
  const col = season === 2 ? ["#d99a45", "#c2762f", "#a35a28"] : season === 0 ? ["#ffd0e0", "#fff3c4", "#e6c9ff"] : season === 3 ? ["#ffffff", "#e8f4fa"] : ["#e8e2a0", "#d9d08a"];
  for (let i = 0; i < want; i++) {
    const sp = 10 + (i % 5) * 8;
    const x = ((i * 137.5 + time * sp * (1 + (i % 3) * 0.2)) % (W + 80)) - 40;
    const y = (i * 91 + Math.sin(time * 0.7 + i) * 40 + time * 12) % H;
    ctx.globalAlpha = 0.5 + Math.sin(time + i) * 0.25;
    ctx.fillStyle = col[i % col.length];
    if (season === 3 || weather === "Neve") {
      ctx.fillRect(x, y, 2, 2);
    } else {
      ctx.fillRect(x, y, 4, 2);
      ctx.fillRect(x + 1, y + 2, 2, 1);
    }
  }
  ctx.globalAlpha = 1;
  // poeira dourada no fim de tarde
  if (minutes > 16 * 60 && minutes < 19.5 * 60) {
    for (let i = 0; i < 18; i++) {
      const x = (i * 173 + time * 6) % W;
      const y = (i * 97 + Math.sin(time * 0.5 + i) * 30) % H;
      ctx.fillStyle = "rgba(255,225,160,.16)";
      ctx.fillRect(x, y, 3, 3);
    }
  }
}
