import { game } from "./state.js";

// Áudio 100% procedural (Web Audio API): nenhum arquivo de terceiros,
// nenhuma música protegida. A trilha é original e gerada no navegador.
let ctx = null;
let master = null;
let musicGain = null;
let sfxGain = null;
let musicTimer = null;
let started = false;
let step = 0;

const SCALES = [
  [261.63, 293.66, 329.63, 392.0, 440.0, 523.25], // Primavera — Dó maior pentatônica
  [293.66, 329.63, 369.99, 440.0, 493.88, 587.33], // Verão — Ré
  [220.0, 246.94, 261.63, 329.63, 349.23, 440.0],  // Outono — Lá menor
  [174.61, 196.0, 220.0, 261.63, 293.66, 349.23],  // Inverno — Fá
];

const MELODY = [
  0, 2, 4, 2, 1, 3, 5, 3,
  2, 4, 5, 4, 3, 1, 2, 0,
  4, 5, 4, 2, 1, 3, 1, 2,
  0, 2, 1, 3, 2, 4, 3, 0,
];

export function initAudio() {
  if (started) return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    musicGain = ctx.createGain();
    sfxGain = ctx.createGain();
    musicGain.gain.value = 0.16;
    sfxGain.gain.value = 0.5;
    master.gain.value = game.settings.volume;
    musicGain.connect(master);
    sfxGain.connect(master);
    master.connect(ctx.destination);
    started = true;
    scheduleLoop();
    musicTimer = setInterval(scheduleLoop, 6200);
    document.addEventListener("pointerdown", resume, { once: true });
    document.addEventListener("keydown", resume, { once: true });
  } catch {
    ctx = null;
  }
}

function resume() {
  if (ctx?.state === "suspended") ctx.resume().catch(() => {});
}

export function applyAudioSettings() {
  if (!ctx) return;
  const v = game.settings.volume;
  master.gain.setTargetAtTime(v, ctx.currentTime, 0.05);
  musicGain.gain.setTargetAtTime(game.settings.music ? 0.16 : 0, ctx.currentTime, 0.05);
  sfxGain.gain.setTargetAtTime(game.settings.sfx ? 0.5 : 0, ctx.currentTime, 0.02);
}

function note(freq, when, dur, type, gainValue, destination) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(destination || musicGain);
  const g = gainValue ?? 0.18;
  gain.gain.setValueAtTime(0, when);
  gain.gain.linearRampToValueAtTime(g, when + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  osc.start(when);
  osc.stop(when + dur + 0.05);
}

function scheduleLoop() {
  if (!ctx || !game.settings.music) return;
  const t0 = ctx.currentTime + 0.08;
  const beat = 0.38;
  const scale = SCALES[game.world.seasonIndex % 4];
  const base = scale[0] / 2;
  for (let i = 0; i < 16; i++) {
    const t = t0 + i * beat;
    const idx = MELODY[(step + i) % MELODY.length];
    const octave = (step + i) % 8 === 6 ? 2 : 1;
    note(scale[idx] * octave, t, beat * 1.35, "triangle", 0.1);
    if (i % 2 === 0) {
      note(base * (i % 4 === 0 ? 1 : 1.5), t, beat * 1.8, "sine", 0.12);
    }
    if (i === 0 || i === 8) {
      note(scale[0] * 2, t, beat * 0.5, "square", 0.02);
    }
  }
  step = (step + 16) % MELODY.length;
}

const SFX = {
  till: { f: 150, type: "square", dur: 0.18, slide: 90 },
  water: { f: 620, type: "sine", dur: 0.25, slide: 900 },
  plant: { f: 420, type: "triangle", dur: 0.18, slide: 600 },
  harvest: { f: 660, type: "triangle", dur: 0.22, slide: 990 },
  chop: { f: 120, type: "square", dur: 0.12, slide: 80 },
  mine: { f: 95, type: "square", dur: 0.12, slide: 70 },
  fish: { f: 300, type: "sine", dur: 0.3, slide: 520 },
  buy: { f: 520, type: "square", dur: 0.1, slide: 780 },
  sell: { f: 780, type: "square", dur: 0.12, slide: 520 },
  open: { f: 440, type: "sine", dur: 0.08, slide: 550 },
  close: { f: 440, type: "sine", dur: 0.08, slide: 300 },
  error: { f: 180, type: "sawtooth", dur: 0.18, slide: 120 },
  sleep: { f: 240, type: "sine", dur: 0.9, slide: 120 },
  levelup: { f: 660, type: "triangle", dur: 0.5, slide: 1320 },
  chat: { f: 600, type: "sine", dur: 0.06, slide: 620 },
  build: { f: 200, type: "square", dur: 0.35, slide: 400 },
};

export function sfx(name) {
  if (!ctx || !game.settings.sfx) return;
  const def = SFX[name];
  if (!def) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = def.type;
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(def.f, now);
    if (def.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, def.slide), now + def.dur);
    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + def.dur);
    osc.connect(gain);
    gain.connect(sfxGain);
    osc.start(now);
    osc.stop(now + def.dur + 0.02);
  } catch { /* áudio nunca deve quebrar o jogo */ }
}

export function stopMusic() {
  if (musicTimer) clearInterval(musicTimer);
  musicTimer = null;
}
