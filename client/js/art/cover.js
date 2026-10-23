// Capa animada — desenho pixel-art em tempo real (inspirado Stardew)
import { mkCanvas } from "./pixel.js";
import { C, SEASON_ART } from "./palette.js";
import { characterFrames, specForSkin } from "./characters.js";

let raf = null;
let running = false;

function drawCoverLogo() {
  const c = document.getElementById("coverLogoCanvas");
  if (!c || !c.getContext) return;
  // quando fundo mão-desenhada já tem placa, não desenha placa duplicada (user reclamou duplicação feia)
  if (document.querySelector(".coverHandBg")) {
    const g0 = c.getContext("2d");
    g0.clearRect(0,0,c.width,c.height);
    // desenha só badges sutis embaixo, sem placa para não duplicar o letreiro pintado
    return;
  }
  const g = c.getContext("2d");
  g.imageSmoothingEnabled = false;
  const W = c.width, H = c.height;
  g.clearRect(0, 0, W, H);
  // sombra de tabuleta de madeira atrás do logo
  const pad = 12;
  g.fillStyle = "#4a3120";
  roundRect(g, pad - 2, 18, W - pad*2 + 4, 118, 14);
  g.fill();
  g.fillStyle = "#6b4a2f";
  roundRect(g, pad, 20, W - pad*2, 114, 12);
  g.fill();
  g.fillStyle = "#f9f1de";
  roundRect(g, pad + 6, 26, W - pad*2 - 12, 102, 9);
  g.fill();
  g.fillStyle = "#efe1c6";
  roundRect(g, pad + 6, 26, W - pad*2 - 12, 24, 9);
  g.fill();
  // borda dourada
  g.strokeStyle = "#e8b44a";
  g.lineWidth = 3;
  roundRect(g, pad + 6, 26, W - pad*2 - 12, 102, 9);
  g.stroke();
  // parafusos
  g.fillStyle = "#c9a06a";
  g.beginPath(); g.arc(pad + 16, 36, 3.5, 0, 6.3); g.fill();
  g.beginPath(); g.arc(W - pad - 16, 36, 3.5, 0, 6.3); g.fill();
  // faixas de madeira
  g.fillStyle = "#d9a86c";
  g.fillRect(pad + 6, 96, W - pad*2 - 12, 2);
  g.fillStyle = "#b78d5c";
  g.fillRect(pad + 6, 98, W - pad*2 - 12, 1);
  // brilho superior
  g.fillStyle = "rgba(255,255,255,.35)";
  g.fillRect(pad + 10, 28, W - pad*2 - 20, 6);

  // texto pixelado manual (VALE ACONCHEGANTE)
  g.fillStyle = "#4a3120";
  g.font = "900 34px Trebuchet MS, Verdana, sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  // sombra do texto
  g.fillStyle = "rgba(60,40,20,.22)";
  g.fillText("VALE", W/2 + 1, 58 + 1);
  g.fillStyle = "#2b4a2c";
  g.fillText("VALE", W/2, 58);
  g.fillStyle = "rgba(60,40,20,.22)";
  g.fillText("ACONCHEGANTE", W/2 + 1, 88 + 1);
  g.fillStyle = "#6b4a2f";
  g.font = "900 22px Trebuchet MS, Verdana, sans-serif";
  g.fillText("ACONCHEGANTE", W/2, 88);
  // sublinhado decorativo
  g.strokeStyle = "#e8b44a";
  g.lineWidth = 2;
  g.beginPath(); g.moveTo(W/2 - 74, 102); g.lineTo(W/2 + 74, 102); g.stroke();
  g.fillStyle = "#e8b44a";
  g.beginPath(); g.arc(W/2, 102, 4, 0, 6.3); g.fill();
  g.fillStyle = "#fff8c6";
  g.beginPath(); g.arc(W/2, 102, 1.5, 0, 6.3); g.fill();

  // mini ícone central
  g.fillStyle = "#7cb958";
  g.font = "16px serif";
  g.fillText("🌿  Fazenda • Vida • Multiplayer  🌿", W/2, 116);
}

function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

export function initCoverCanvas() {
  // se lobby mão-desenhada já presente, não desenha cena procedural (poupa CPU e evita sobrepor arte)
  if (document.querySelector(".coverHandBg")) {
    drawCoverLogo();
    try { hydrateCoverIcons(); } catch {}
    window.addEventListener("resize", () => drawCoverLogo());
    return;
  }
  const canvas = document.getElementById("coverCanvas");
  if (!canvas || !canvas.getContext) return;
  const g = canvas.getContext("2d");
  g.imageSmoothingEnabled = false;
  drawCoverLogo();
  try { hydrateCoverIcons(); } catch {}
  // inicia loop
  startCoverLoop(canvas, g);
  // logo redesenha ao redimensionar
  window.addEventListener("resize", () => {
    resizeCover(canvas);
    drawCoverLogo();
  });
  resizeCover(canvas);
}

function hydrateCoverIcons() {
  const root = document.getElementById("coverScreen");
  if (!root) return;
  // usa icons.js se disponível
  import("./icons.js").then(m => {
    root.querySelectorAll("[data-icon]").forEach(el => {
      if (el.dataset.done) return;
      const key = el.dataset.icon;
      const size = Number(el.dataset.size || 18);
      el.innerHTML = m.iconImg(key, "pxIcon", size);
      el.dataset.done = "1";
      el.style.display = "inline-flex";
      el.style.verticalAlign = "-3px";
      el.style.marginRight = "6px";
    });
  }).catch(()=>{});
}

function resizeCover(canvas) {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";
  const g = canvas.getContext("2d");
  g.setTransform(dpr,0,0,dpr,0,0);
  g.imageSmoothingEnabled = false;
}

function startCoverLoop(canvas, g) {
  if (running) return;
  running = true;
  let t0 = performance.now();
  // pré-cache de sprites
  let charImg = null;
  try {
    const atlas = characterFrames(specForSkin("s1"));
    charImg = atlas.down[0];
  } catch {}

  function frame(now) {
    if (!running) return;
    if (!document.getElementById("coverScreen")?.classList.contains("active")) {
      raf = requestAnimationFrame(frame);
      return;
    }
    const t = (now - t0) / 1000;
    drawCoverScene(g, canvas, t, charImg);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
}

export function stopCoverLoop() {
  running = false;
  if (raf) cancelAnimationFrame(raf);
}

function drawCoverScene(g, canvas, t, charImg) {
  const W = window.innerWidth;
  const H = window.innerHeight;
  g.clearRect(0,0,W,H);
  // céu degradê animado (dia)
  const sky = g.createLinearGradient(0,0,0,H*0.72);
  sky.addColorStop(0, "#87ceeb");
  sky.addColorStop(0.45, "#a8dff0");
  sky.addColorStop(0.72, "#c9f0c8");
  g.fillStyle = sky;
  g.fillRect(0,0,W,H);

  // sol com pulso
  const sunX = W * 0.82 + Math.sin(t*0.1)*6;
  const sunY = H * 0.18 + Math.cos(t*0.07)*4;
  g.fillStyle = "#ffe066";
  g.beginPath(); g.arc(sunX, sunY, 22, 0, 6.28); g.fill();
  g.fillStyle = "rgba(255,240,160,.35)";
  g.beginPath(); g.arc(sunX, sunY, 34 + Math.sin(t*1.2)*2, 0, 6.28); g.fill();
  // raios
  g.strokeStyle = "rgba(255,230,120,.45)";
  g.lineWidth = 2;
  for (let i=0;i<8;i++) {
    const a = i/8*6.28 + t*0.2;
    g.beginPath();
    g.moveTo(sunX + Math.cos(a)*26, sunY + Math.sin(a)*26);
    g.lineTo(sunX + Math.cos(a)*38, sunY + Math.sin(a)*38);
    g.stroke();
  }

  // montanhas ao fundo (paralaxe)
  drawMountains(g, W, H, t);

  // campo / fazenda em pixel art (chão arenoso + grama)
  const groundY = H * 0.62;
  // base arenosa clara (como na foto)
  g.fillStyle = "#e8cfa0";
  g.fillRect(0, groundY, W, H - groundY);
  // textura de grãos
  g.fillStyle = "rgba(180,140,80,.18)";
  for (let i=0;i<W;i+=14) {
    const x = (i*37 + t*6) % W;
    g.fillRect(x, groundY + 10 + (i%3)*14, 8, 2);
    g.fillRect(x+4, groundY + 22 + (i%5)*8, 5, 2);
  }
  // faixas de grama nas bordas (imitando foto)
  g.fillStyle = "#6aa84f";
  g.fillRect(0, groundY, W, 18);
  g.fillStyle = "#7cb958";
  for (let x=0;x<W;x+=18) {
    const wob = Math.sin(t*0.8 + x*0.02)*3;
    g.fillRect(x + wob, groundY + 6, 14, 10);
  }
  g.fillStyle = "#6aa84f";
  for (let x=0;x<W;x+=10) g.fillRect(x, groundY + 12 + (x%7), 2, 4);
  // borda inferior grama
  g.fillStyle = "#5a9944";
  g.fillRect(0, H - 28, W, 28);
  g.fillStyle = "#7ac74f";
  for (let x=0;x<W;x+=12) g.fillRect(x + Math.sin(t*0.6 + x)*2, H-22, 6, 6);

  // casa principal (estilo foto: madeira + telha vermelha + varanda)
  const hx = W*0.5 - 110;
  const hy = groundY - 74;
  drawCoverHouse(g, hx, hy, t);

  // árvores grandes (foto tem 2 nos cantos)
  drawCoverTree(g, W*0.14, groundY - 6, 1.25, t, 0);
  drawCoverTree(g, W*0.88, groundY - 8, 1.35, t, 1);
  drawCoverTree(g, W*0.08, groundY + 18, 1.05, t, 2);
  drawCoverTree(g, W*0.94, groundY + 20, 1.1, t, 3);
  // cerca baixa (como na foto)
  drawCoverFence(g, W, groundY, t);
  // canteiros com plantas (foto-style)
  drawCoverCrops(g, W, groundY, t);
  // poço e barris
  drawCoverWell(g, W*0.78, groundY + 8, t);
  // borboletas e pássaros
  drawCoverCritters(g, W, H, groundY, t);
  // personagens caminhando
  if (charImg) {
    const px = W*0.5 + Math.sin(t*0.35)*18;
    const py = groundY + 22 + Math.abs(Math.cos(t*2))*2;
    g.fillStyle = "rgba(30,20,10,.18)";
    g.beginPath(); g.ellipse(px+16, py+36, 14, 5, 0, 0, 6.28); g.fill();
    g.drawImage(charImg, px, py, charImg.width*1.45, charImg.height*1.45);
    const px2 = W*0.32 + Math.sin(t*0.28+2)*10;
    const py2 = groundY + 42;
    g.beginPath(); g.ellipse(px2+16, py2+36, 14,5,0,0,6.28); g.fill();
    g.drawImage(charImg, px2, py2, charImg.width*1.3, charImg.height*1.3);
  }
  // brilho suave
  g.fillStyle = "rgba(255,255,255,.06)";
  g.fillRect(0, groundY, W, 2);
}

function drawMountains(g, W, H, t) {
  const baseY = H*0.55;
  const layers = [
    { col: "#2c4a4a", y: baseY+10, amp: 22, tx: t*2 },
    { col: "#3d6b52", y: baseY+22, amp: 16, tx: t*4 },
    { col: "#5c8f5e", y: baseY+34, amp: 12, tx: t*6 },
  ];
  for (const L of layers) {
    g.fillStyle = L.col;
    g.beginPath();
    g.moveTo(0, H);
    for (let x=0;x<=W;x+=12) {
      const y = L.y + Math.sin((x/W)*Math.PI*2.4 + L.tx*0.003)*L.amp + Math.sin(x*0.02)*L.amp*0.2;
      g.lineTo(x, y);
    }
    g.lineTo(W, H);
    g.closePath();
    g.fill();
  }
}

function drawCoverHouse(g, x, y, t) {
  // sombra
  g.fillStyle = "rgba(30,20,10,.18)";
  g.beginPath(); g.ellipse(x+68, y+78, 72, 10, 0, 0, 6.28); g.fill();
  // base madeira
  g.fillStyle = "#d9a86c";
  g.fillRect(x, y+18, 136, 52);
  g.fillStyle = "#b78d5c";
  for (let yy=y+18; yy<y+70; yy+=7) { g.fillRect(x, yy, 136, 2); g.fillRect(x, yy+2, 136, 1); }
  // tábuas verticais
  g.fillStyle = "#a97a48";
  for (let xx=x+18; xx<x+118; xx+=18) g.fillRect(xx, y+18, 2, 52);
  // fundação pedra
  g.fillStyle = "#c9bfae";
  g.fillRect(x-4, y+70, 144, 10);
  g.fillStyle = "#a8a69e";
  for (let i=0;i<144;i+=14) g.fillRect(x-4+i, y+70, 2, 10);
  // porta e janelas
  g.fillStyle = "#6b4a2f";
  g.fillRect(x+58, y+34, 22, 34);
  g.fillStyle = "#8a5a33";
  g.fillRect(x+60, y+36, 18, 32);
  g.fillStyle = "#ffe9a8";
  g.fillRect(x+62, y+42, 14, 12);
  g.fillStyle = "#e8b44a";
  g.fillRect(x+69, y+50, 3, 3);
  // janelas com jardineira
  g.fillStyle = "#6b4a2f";
  g.fillRect(x+14, y+32, 22, 20); g.fillRect(x+100, y+32, 22, 20);
  g.fillStyle = "#9fd4e8";
  g.fillRect(x+16, y+34, 18, 16); g.fillRect(x+102, y+34, 18, 16);
  g.fillStyle = "rgba(255,255,255,.45)";
  g.fillRect(x+17, y+35, 6, 2); g.fillRect(x+103, y+35, 6, 2);
  g.fillStyle = "#a05a34";
  g.fillRect(x+12, y+52, 26, 5); g.fillRect(x+98, y+52, 26, 5);
  g.fillStyle = "#e2695e"; g.fillRect(x+16, y+48, 4,4); g.fillRect(x+22, y+47, 4,4);
  g.fillStyle = "#ffd166"; g.fillRect(x+106, y+47, 4,4); g.fillRect(x+112, y+48, 4,4);
  // telha vermelha duas águas
  g.fillStyle = "#c14f42";
  for (let i=0;i<22;i++) {
    const inset = i*3;
    g.fillRect(x-8+inset/2, y-2 + i*1.2, 152 - inset, 2);
    if (i%4===2) { g.fillStyle = "#9c3a34"; g.fillRect(x-8+inset/2, y-2 + i*1.2, 152 - inset, 1); g.fillStyle = "#c14f42"; }
  }
  g.fillStyle = "#7a2a2a";
  g.fillRect(x-10, y+20, 156, 3);
  // chaminé
  g.fillStyle = "#8c8a80";
  g.fillRect(x+112, y-12, 12, 22);
  g.fillStyle = "#6b6960";
  g.fillRect(x+122, y-12, 2, 22);
  g.fillStyle = "#55534c";
  g.fillRect(x+110, y-16, 16, 6);
  // fumaça
  g.fillStyle = "rgba(240,238,230,.42)";
  g.beginPath(); g.arc(x+120 + Math.sin(t*1.1)*2, y-22 - (t*6%18), 5, 0, 6.28); g.fill();
  g.beginPath(); g.arc(x+124 + Math.cos(t*0.9)*3, y-30 - (t*6%18), 3.5, 0, 6.28); g.fill();
  // varanda
  g.fillStyle = "#8d5f34";
  g.fillRect(x+8, y+70, 120, 6);
  g.fillStyle = "#f2ddc0";
  g.fillRect(x+8, y+70, 120, 2);
  // degraus
  g.fillStyle = "#c9a06a";
  g.fillRect(x+52, y+76, 32, 3); g.fillRect(x+48, y+79, 40, 2);
}

function drawCoverTree(g, x, y, s, t, seed) {
  const sway = Math.sin(t*0.7 + seed)*2.2*s;
  // tronco
  g.fillStyle = "#6f4526";
  g.fillRect(x-5*s, y, 10*s, 28*s);
  g.fillStyle = "#8a5a33";
  g.fillRect(x-4*s, y+4*s, 3*s, 20*s);
  // copa em camadas
  g.fillStyle = "#2f6b3a";
  g.beginPath(); g.arc(x+sway, y-6*s, 26*s, 0, 6.28); g.fill();
  g.fillStyle = "#4a8f4a";
  g.beginPath(); g.arc(x-4*s+sway*0.6, y-14*s, 20*s, 0, 6.28); g.fill();
  g.fillStyle = "#6aa84f";
  g.beginPath(); g.arc(x-8*s+sway*0.4, y-20*s, 12*s, 0, 6.28); g.fill();
  // brilho
  g.fillStyle = "#8fd06a";
  g.beginPath(); g.arc(x-10*s, y-18*s, 5*s, 0, 6.28); g.fill();
}

function drawCoverFence(g, W, groundY, t) {
  const y = groundY + 8;
  g.fillStyle = "#8a5f34";
  for (let x=0; x<W; x+=18) {
    g.fillRect(x, y, 4, 22);
    g.fillRect(x+2, y, 14, 4);
    g.fillRect(x+2, y+10, 14, 3);
    // topo pontiagudo
    g.fillRect(x+1, y-3, 2, 4);
    g.fillStyle = "#d9a86c";
    g.fillRect(x, y, 2, 22);
    g.fillStyle = "#6b4a2f";
    g.fillRect(x+14, y, 2, 22);
    g.fillStyle = "#8a5f34";
  }
}

function drawCoverCrops(g, W, groundY, t) {
  // canteiros retangulares como na foto
  const beds = [
    { x: W*0.22, y: groundY+16, w: 88, h: 42 },
    { x: W*0.38, y: groundY+14, w: 92, h: 44 },
    { x: W*0.20, y: groundY+68, w: 96, h: 36 },
    { x: W*0.42, y: groundY+64, w: 88, h: 40 },
  ];
  for (const b of beds) {
    g.fillStyle = "#8f6a3c";
    g.fillRect(b.x-4, b.y-4, b.w+8, b.h+8);
    g.fillStyle = "#b88a4a";
    g.fillRect(b.x-2, b.y-2, b.w+4, b.h+4);
    g.fillStyle = "#7a5430";
    for (let yy=b.y; yy<b.y+b.h; yy+=8) g.fillRect(b.x, yy, b.w, 2);
    // plantas
    const cols = b.w / 5;
    for (let i=0;i<5;i++) for (let j=0;j<2;j++) {
      const px = b.x + 8 + i*16 + (j*8);
      const py = b.y + 8 + j*16;
      const bob = Math.sin(t*1.4 + i + j)*1.2;
      g.fillStyle = "#2f6b3a";
      g.fillRect(px, py+bob, 2, 8);
      g.fillStyle = "#4a8f4a";
      g.fillRect(px-4, py-2+bob, 6, 4);
      g.fillRect(px+2, py-1+bob, 6, 4);
      if ((i+j)%2===0) {
        g.fillStyle = "#e74c3c";
        g.beginPath(); g.arc(px+1, py-6+bob, 4, 0, 6.28); g.fill();
        g.fillStyle = "#ffd166";
        g.beginPath(); g.arc(px-1, py-7+bob, 1.2, 0, 6.28); g.fill();
      } else {
        g.fillStyle = "#8fd06a";
        g.beginPath(); g.arc(px+1, py-4+bob, 2.5, 0, 6.28); g.fill();
      }
    }
  }
  // estacas (foto tem 5 verticais com broto)
  for (let i=0;i<5;i++) {
    const sx = W*0.26 + i*22;
    const sy = groundY + 38;
    g.fillStyle = "#6b4a2f";
    g.fillRect(sx, sy, 3, 18);
    g.fillStyle = "#8a6a3a";
    g.fillRect(sx+1, sy, 1, 18);
    g.fillStyle = "#7ac74f";
    g.fillRect(sx-2, sy+12, 3, 3); g.fillRect(sx+2, sy+14, 3, 2);
  }
}

function drawCoverWell(g, x, y, t) {
  g.fillStyle = "rgba(30,20,10,.18)";
  g.beginPath(); g.ellipse(x, y+28, 28, 10, 0, 0, 6.28); g.fill();
  g.fillStyle = "#9a9a9a";
  g.fillRect(x-22, y, 44, 24);
  g.fillStyle = "#c9c8bd";
  for (let i=0;i<44;i+=8) g.fillRect(x-22+i, y, 1, 24);
  g.fillStyle = "#7a7a7a";
  g.fillRect(x-22, y, 44, 2); g.fillRect(x-22, y+22, 44, 2);
  // telhado
  g.fillStyle = "#6b4a2f";
  g.fillRect(x-26, y-10, 52, 8);
  g.fillStyle = "#8a5a33";
  g.fillRect(x-26, y-10, 52, 2);
  g.fillStyle = "#4a3120";
  g.fillRect(x-4, y-10, 2, 22); g.fillRect(x+4, y-10, 2, 22);
  g.fillStyle = "#4a90b8";
  g.fillRect(x-6, y+8, 12, 8);
}

function drawCoverCritters(g, W, H, groundY, t) {
  // borboletas
  for (let i=0;i<4;i++) {
    const bx = (W*0.3 + i*120 + Math.sin(t*0.6+i)*20) % W;
    const by = groundY - 30 - Math.abs(Math.sin(t*0.9+i))*12 + Math.cos(t*1.2+i)*6;
    const wing = Math.sin(t*8+i)*0.6+0.8;
    g.fillStyle = i%2 ? "#ffb3d1" : "#8fd06a";
    g.beginPath(); g.ellipse(bx-4*wing, by, 6, 4, -0.3, 0, 6.28); g.fill();
    g.beginPath(); g.ellipse(bx+4*wing, by, 6, 4, 0.3, 0, 6.28); g.fill();
    g.fillStyle = "#3a2a1e";
    g.fillRect(bx-1, by-1, 2, 4);
  }
  // pássaro
  const bx = (W + t*40) % (W+60) - 30;
  const by = H*0.24 + Math.sin(t*1.5)*8;
  g.fillStyle = "#5b4a3a";
  g.beginPath(); g.ellipse(bx, by, 6, 3, 0, 0, 6.28); g.fill();
  g.fillStyle = "#8a5a33";
  const flap = Math.sin(t*12)*6;
  g.beginPath(); g.moveTo(bx-2, by); g.lineTo(bx-8+flap, by-6); g.lineTo(bx-2, by-1); g.fill();
  g.beginPath(); g.moveTo(bx+2, by); g.lineTo(bx+8-flap, by-6); g.lineTo(bx+2, by-1); g.fill();
}

