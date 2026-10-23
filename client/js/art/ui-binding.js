// ============================================================
//  Liga a arte em pixel ao DOM: injeta ícones, converte emojis
//  em sprites e desenha o emblema da tela de entrada.
// ============================================================
import { iconURL, iconize, iconImg, EMOJI_TO_ICON } from "./icons.js";
import { characterFrames, specForSkin, NPC_SPECS, seasonSpec } from "./characters.js";
import { mkCanvas } from "./pixel.js";

let observer = null;
let pending = null;

/** Preenche elementos marcados com data-icon. */
export function hydrateIcons(root = document) {
  if (!root || !root.querySelectorAll) return;
  root.querySelectorAll("[data-icon]").forEach((el) => {
    if (el.dataset.iconDone) return;
    const key = el.dataset.icon;
    const size = Number(el.dataset.size || 22);
    el.innerHTML = iconImg(key, "pxIcon", size);
    el.dataset.iconDone = "1";
  });
}

/** Troca o ícone de um elemento já hidratado. */
export function setIcon(el, key, size = 20) {
  if (!el) return;
  el.innerHTML = iconImg(key, "pxIcon", size);
  el.dataset.iconDone = "1";
}

/** Observa mudanças e substitui emojis por ícones de pixel art. */
export function watchIcons() {
  if (observer) return;
  // ambientes sem MutationObserver (testes/jsdom antigos) seguem sem observação
  if (typeof MutationObserver === "undefined" || typeof requestAnimationFrame === "undefined") {
    iconize(document.getElementById("gameScreen") || document.body);
    return;
  }
  const target = document.getElementById("gameScreen") || document.body;
  observer = new MutationObserver(() => {
    if (pending) return;
    pending = requestAnimationFrame(() => {
      pending = null;
      iconize(document.querySelectorAll(".panelBody").length ? document.getElementById("gameScreen") : document.body);
      hydrateIcons(document);
    });
  });
  observer.observe(target, { childList: true, subtree: true, characterData: true });
}

/** Cabeçalhos de painel ganham ícone (sem poluir o HTML). */
export function decoratePanelHeaders() {
  if (typeof document === "undefined" || !document.getElementById) return;
  const map = {
    inventoryPanel: "bag", shopPanel: "bag", buildPanel: "hammer", jobPanel: "job",
    kitchenPanel: "kitchen", travelPanel: "travel", coopPanel: "coop", bankPanel: "bank",
    housePanel: "casa", shiftPanel: "clock", questPanel: "quest", communityPanel: "community",
    socialPanel: "friends", npcPanel: "chat", mapPanel: "map", settingsPanel: "settings",
    tutorialPanel: "help",
  };
  for (const [id, key] of Object.entries(map)) {
    const panel = document.getElementById(id);
    const title = panel?.querySelector(".phTitle");
    if (!title || title.dataset.decorated) continue;
    title.dataset.decorated = "1";
    const img = document.createElement("img");
    img.src = iconURL(key);
    img.className = "pxIcon";
    img.width = 20; img.height = 20;
    img.alt = "";
    img.style.cssText = "width:20px;height:20px;image-rendering:pixelated";
    title.prepend(img);
  }
}

/** Emblema da tela inicial: paisagem em pixel art desenhada por código. */
export function drawLogo() {
  if (typeof document === "undefined" || !document.getElementById) return;
  const c = document.getElementById("logoCanvas");
  if (!c || !c.getContext) return;
  const g = c.getContext("2d");
  g.imageSmoothingEnabled = false;
  const W = c.width, H = c.height;
  g.clearRect(0, 0, W, H);
  // céu
  const sky = g.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#1f3a52");
  sky.addColorStop(0.45, "#4a7c8c");
  sky.addColorStop(1, "#8fc7a8");
  g.fillStyle = sky;
  g.fillRect(0, 0, W, H);
  // estrelas
  for (let i = 0; i < 40; i++) {
    const x = (i * 97 + 13) % W;
    const y = (i * 37) % (H * 0.5);
    g.fillStyle = `rgba(255,248,210,${0.25 + ((i * 7) % 5) / 10})`;
    g.fillRect(x, y, 1, 1);
  }
  // lua
  g.fillStyle = "#f7f0cf";
  g.beginPath(); g.arc(W - 42, 26, 12, 0, 6.3); g.fill();
  g.fillStyle = "rgba(0,0,0,.06)";
  g.beginPath(); g.arc(W - 46, 23, 3, 0, 6.3); g.fill();
  g.beginPath(); g.arc(W - 38, 31, 2, 0, 6.3); g.fill();
  // montanhas
  const layer = (color, baseY, amp, seed) => {
    g.fillStyle = color;
    g.beginPath();
    g.moveTo(0, H);
    for (let x = 0; x <= W; x += 6) {
      const y = baseY + Math.sin((x / W) * Math.PI * 2.5 + seed) * amp + Math.sin(x * 0.08 + seed) * amp * 0.3;
      g.lineTo(x, y);
    }
    g.lineTo(W, H);
    g.closePath();
    g.fill();
  };
  layer("#2c4a4a", H * 0.62, 12, 0.6);
  layer("#3d6b52", H * 0.72, 9, 2.1);
  layer("#5c8f5e", H * 0.82, 6, 4.2);
  // casinha
  const hx = W * 0.22, hy = H * 0.62;
  g.fillStyle = "#f2ddc0"; g.fillRect(hx, hy, 34, 24);
  g.fillStyle = "#9c3a34";
  for (let i = 0; i < 7; i++) g.fillRect(hx + 17 - (7 - i) * 2.4, hy - i * 2, (7 - i) * 4.8, 2);
  g.fillStyle = "#ffcf7a"; g.fillRect(hx + 13, hy + 8, 8, 8);
  g.fillStyle = "#8a5a33"; g.fillRect(hx + 6, hy + 12, 6, 12);
  g.fillStyle = "#ffcf7a"; g.fillRect(hx + 7, hy + 14, 4, 4);
  g.fillStyle = "#b8b3a2"; g.fillRect(hx + 24, hy - 14, 5, 8);
  // fumaça
  g.fillStyle = "rgba(240,238,230,.35)";
  g.beginPath(); g.arc(hx + 26, hy - 20, 3, 0, 6.3); g.fill();
  g.beginPath(); g.arc(hx + 29, hy - 26, 2, 0, 6.3); g.fill();
  // árvores
  const tree = (tx, ty, s) => {
    g.fillStyle = "#6f4526"; g.fillRect(tx - 1, ty, 3, 8 * s);
    g.fillStyle = "#2f6b3a";
    g.beginPath(); g.arc(tx, ty - 2, 8 * s, 0, 6.3); g.fill();
    g.fillStyle = "#4a8f4a";
    g.beginPath(); g.arc(tx - 2, ty - 5, 6 * s, 0, 6.3); g.fill();
    g.fillStyle = "#6aa84f";
    g.beginPath(); g.arc(tx - 4, ty - 7, 3 * s, 0, 6.3); g.fill();
  };
  tree(W * 0.68, H * 0.78, 1.15);
  tree(W * 0.8, H * 0.82, 0.9);
  tree(W * 0.55, H * 0.84, 0.75);
  // chão
  g.fillStyle = "#6aa84f";
  g.fillRect(0, H * 0.86, W, H * 0.14);
  g.fillStyle = "#7cb958";
  for (let i = 0; i < W; i += 5) g.fillRect(i, H * 0.86 + ((i * 3) % 3), 3, 1);
  // plantinhas
  for (let i = 0; i < 14; i++) {
    const x = 6 + i * 15;
    const y = H * 0.9 + ((i * 5) % 6);
    g.fillStyle = "#4a7c37"; g.fillRect(x, y, 1, 3);
    g.fillStyle = "#8fc75e"; g.fillRect(x - 1, y, 1, 2); g.fillRect(x + 1, y + 1, 1, 2);
  }
  // personagem (o mesmo sprite do jogo!)
  try {
    const atlas = characterFrames(specForSkin("s1"));
    const img = atlas.down[0];
    const scale = 1.35;
    g.drawImage(img, W * 0.42, H * 0.72, img.width * scale, img.height * scale);
    g.fillStyle = "rgba(30,24,16,.22)";
    g.beginPath(); g.ellipse(W * 0.42 + img.width * scale / 2, H * 0.72 + img.height * scale, 12, 3, 0, 0, 6.3); g.fill();
  } catch (e) { /* arte é opcional */ }
  // vinheta
  const vg = g.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.9);
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, "rgba(10,20,16,.5)");
  g.fillStyle = vg;
  g.fillRect(0, 0, W, H);
}

/** Retrato pixel-art (busto) de um NPC para os painéis — grande + sazonal + detalhado */
export function npcPortrait(npc, size = 96, opts = {}) {
  const season = (typeof window !== "undefined" && window.__seasonOverride != null) ? window.__seasonOverride : (opts.seasonIndex ?? (typeof game !== "undefined" ? game?.world?.seasonIndex : 0));
  const c = mkCanvas(size, size);
  const g = c.getContext("2d");
  g.imageSmoothingEnabled = false;

  // paleta de fundo por estação
  const seasonBg = [
    { bg: "#e8f2d6", bg2: "#d0e6b2", accent: "#7cb98a" }, // primavera - flores
    { bg: "#fff6bf", bg2: "#ffe8a0", accent: "#e8c15c" }, // verão - sol
    { bg: "#f5d6b0", bg2: "#e0b88a", accent: "#c97a3a" }, // outono - folhas
    { bg: "#dce8f5", bg2: "#c4d6ea", accent: "#6f90b8" }, // inverno - neve
  ];
  const th = seasonBg[season] || seasonBg[0];
  // fundo degradê + padrão xadrez sutil
  const grd = g.createLinearGradient(0, 0, 0, size);
  grd.addColorStop(0, th.bg);
  grd.addColorStop(1, th.bg2);
  g.fillStyle = grd;
  g.fillRect(0, 0, size, size);
  for (let y = 0; y < size; y += 8) {
    for (let x = 0; x < size; x += 8) {
      if (((x/8)+(y/8))%2===0) {
        g.fillStyle = "rgba(255,255,255,.18)";
        g.fillRect(x,y,8,8);
      }
    }
  }
  // vinheta de estação no canto
  g.fillStyle = th.accent;
  g.globalAlpha = 0.14;
  g.beginPath();
  g.arc(size - 10, 10, 22, 0, 6.3);
  g.fill();
  g.globalAlpha = 1;
  // ícone sazonal pequeno
  const seasonIcon = ["🌸","☀","🍂","❄"][season] || "🌸";
  g.font = `${Math.round(size*0.18)}px serif`;
  g.textAlign = "center";
  g.fillStyle = "rgba(90,60,30,.45)";
  // usamos texto pequeno como emoji já é estilizado, mas desenha fallback
  // (não depende de emoji rendering - desenha círculo)
  g.fillStyle = th.accent;
  g.globalAlpha = 0.85;
  g.beginPath();
  if (season===0) { // primavera - flor
    g.fillStyle = "#f8a8c0";
    for(let i=0;i<5;i++){ const a=i/5*6.28; g.beginPath(); g.arc(size-10+Math.cos(a)*5, 10+Math.sin(a)*5, 3.2,0,6.3); g.fill(); }
    g.fillStyle="#ffe066"; g.beginPath(); g.arc(size-10,10,2.4,0,6.3); g.fill();
  } else if(season===1) { // verão - sol
    g.fillStyle="#ffe066"; g.beginPath(); g.arc(size-10,10,5.5,0,6.3); g.fill();
    g.strokeStyle="rgba(255,200,60,.5)"; g.lineWidth=1.5;
    for(let i=0;i<8;i++){ const a=i/8*6.28; g.beginPath(); g.moveTo(size-10+Math.cos(a)*7, 10+Math.sin(a)*7); g.lineTo(size-10+Math.cos(a)*9, 10+Math.sin(a)*9); g.stroke(); }
  } else if(season===2) { // outono - folha
    g.fillStyle="#c97a3a";
    g.beginPath(); g.ellipse(size-10, 11, 4.5, 7, -0.3, 0, 6.3); g.fill();
    g.fillStyle="#a85a2a"; g.beginPath(); g.moveTo(size-10, 4); g.lineTo(size-10, 18); g.stroke();
  } else { // inverno - floco
    g.fillStyle="white";
    for(let i=0;i<6;i++){ const a=i/6*6.28; g.beginPath(); g.moveTo(size-10,10); g.lineTo(size-10+Math.cos(a)*6, 10+Math.sin(a)*6); g.lineWidth=1.4; g.strokeStyle="white"; g.stroke(); }
    g.fillStyle="white"; g.beginPath(); g.arc(size-10,10,1.8,0,6.3); g.fill();
  }
  g.globalAlpha = 1;

  let baseSpec = NPC_SPECS[npc.id];
  if (!baseSpec) {
    baseSpec = {
      shirt: npc.color || "#7cb98a", shirtDark: "#4a7c37", pants: "#44506b",
      skin: "#f6c99b", skinShade: "#dba97e", hair: npc.accent || "#4a3020",
      hairDark: "#2c1c10", hairStyle: "short", hat: { type: "none" },
    };
  } else if (season != null && typeof seasonSpec === "function") {
    try { baseSpec = seasonSpec(npc.id, season, baseSpec); } catch {}
  }

  const atlas = characterFrames(baseSpec);
  const frame = atlas.down[0];
  const sw = frame.width, sh = frame.height;
  // recorte maior: mostra busto completo com mais detalhe
  const cropY = sh * 0.02;
  const cropH = sh * 0.68;
  // escala ampliada para retrato grande
  const scale = (size * 0.92) / (sw * 0.92);
  const dw = sw * scale, dh = cropH * scale;
  // sombra suave atrás do busto
  g.fillStyle = "rgba(60,40,20,.12)";
  g.beginPath();
  g.ellipse(size/2, size - 8, size*0.38, size*0.10, 0, 0, 6.3);
  g.fill();
  g.drawImage(frame, 0, cropY, sw, cropH, (size - dw)/2, size - dh - 1, dw, dh);

  // moldura de madeira pergaminho — dupla
  g.strokeStyle = "#6b4a2e";
  g.lineWidth = 3;
  g.strokeRect(1.5, 1.5, size-3, size-3);
  g.strokeStyle = "#d9c79a";
  g.lineWidth = 2;
  g.strokeRect(4.5, 4.5, size-9, size-9);
  g.strokeStyle = "rgba(107,74,47,.25)";
  g.lineWidth = 1;
  g.strokeRect(7, 7, size-14, size-14);

  // placa de nome na base do retrato
  const name = npc.name || npc.id || "";
  if (size >= 88 && name) {
    const tagH = Math.max(14, Math.round(size*0.16));
    const tagY = size - tagH - 2;
    // fundo da placa
    g.fillStyle = "rgba(90,60,40,.92)";
    const tw = Math.min(size-16, name.length * (size*0.09) + 14);
    const tx = (size - tw)/2;
    g.fillRect(tx, tagY, tw, tagH);
    g.fillStyle = "#f2e6c8";
    g.fillRect(tx+1, tagY+1, tw-2, tagH-2);
    g.fillStyle = "#3a2416";
    g.font = `700 ${Math.round(tagH*0.62)}px Trebuchet MS, Segoe UI, sans-serif`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(name, size/2, tagY + tagH/2 + 0.5);
  }
  return c;
}


