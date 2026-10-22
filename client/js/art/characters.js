// ===========================================================
//  Personagens — sprites originais em pixel art (16×24 base)
//  Passo, braços, ferramentas com poses distintas, chapéus.
// ===========================================================
import { SEASON_ART, PIX, C, shade, alpha, mix } from "./palette.js";
import { mkCanvas, hash, cached, inkText } from "./pixel.js";

const W = 16, H = 24;
// ---- Premium NPCs (imagem gerada) ----
export const PREMIUM_NPC_CONFIG = {
  pedro: { src: "assets/npc_medico_premium.png", cols: 7, rows: 2 },
  marcos: { src: "assets/npc_bombeiro_premium.png", cols: 4, rows: 1 },
};
const premiumImages = {};
if (typeof window !== "undefined" && typeof Image !== "undefined") {
  for (const [id, cfg] of Object.entries(PREMIUM_NPC_CONFIG)) {
    const img = new Image();
    img.src = cfg.src;
    premiumImages[id] = img;
  }
}
export function isPremiumNpc(id){ return !!PREMIUM_NPC_CONFIG[id]; }
export function premiumReady(id){ const img = premiumImages[id]; return !!(img && img.complete && img.naturalWidth > 0); }
// Body base hand-drawn layers
const bodyImages={}; const layerImages={};
function loadBodyAsset(asset){ if(!asset) return null; if(bodyImages[asset]) return bodyImages[asset]; if(typeof window==='undefined' || typeof Image==='undefined') return null; const img=new Image(); img.src='assets/'+asset; img.onload=()=>{ try{ delete window.__charCache; }catch{} try{ if(typeof window!=='undefined' && window.refreshPreview) window.refreshPreview(); }catch{} }; bodyImages[asset]=img; return img; }
function loadLayerAsset(asset){ if(!asset) return null; if(layerImages[asset]) return layerImages[asset]; if(typeof window==='undefined' || typeof Image==='undefined') return null; const img=new Image(); img.src='assets/'+asset; img.onload=()=>{ try{ delete window.__charCache; }catch{} try{ if(typeof window!=='undefined' && window.refreshPreview) window.refreshPreview(); }catch{} }; layerImages[asset]=img; return img; }
export function bodyReady(asset){ const img=bodyImages[asset]||loadBodyAsset(asset); return !!(img && img.complete && img.naturalWidth>0); }
export function drawPremiumNpc(ctx, npcId, { x, y, dir="down", moving=false, time=0 }){
  const cfg = PREMIUM_NPC_CONFIG[npcId];
  const img = premiumImages[npcId];
  if(!cfg || !img || !img.complete || img.naturalWidth===0) return false;
  let col = 0, row = 0;
  // animação premium: médico tem 7 cols ×2 rows (14 poses), bombeiro 4×1 walk
  if(moving){
    col = Math.floor(time * 7) % cfg.cols;
    row = (cfg.rows > 1) ? 1 : 0;
  } else {
    // idle sutil: médico alterna entre frente parado (0) e piscar (3) a cada 2s, bombeiro fica parado
    if(cfg.cols >= 7){
      const idlePhase = Math.floor(time * 0.9) % 5;
      col = [0,0,3,0,0][idlePhase] || 0;
      row = 0;
    } else {
      col = 0; row = 0;
    }
  }
  const fw = img.naturalWidth / cfg.cols;
  const fh = img.naturalHeight / cfg.rows;
  const sx = col * fw, sy = row * fh;
  const dw = W * PIX * 1.35, dh = H * PIX * 1.35;
  const yFix = y + (dh - H*PIX*1.18);
  const bob = moving ? Math.sin(time*8)*0.8 : 0;
  // sombra firme no chão
  const cx = x + dw/2, cy = yFix + dh - 4;
  ctx.fillStyle = "rgba(20,18,12,0.30)";
  ctx.beginPath(); ctx.ellipse(cx, cy, dw*0.28, 3.5, 0, 0, Math.PI*2); ctx.fill();
  y = yFix;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, sx, sy, fw, fh, Math.round(x + (W*PIX - dw)/2), Math.round(y -6 + bob), dw, dh);
  ctx.restore();
  return true;
}

function rect(g, x, y, w, h, col) {
  g.fillStyle = col;
  g.fillRect(x * PIX, y * PIX, w * PIX, h * PIX);
}
function shadow(ctx, x, y, rx, ry, a = 0.2) {
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = "#161a14";
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, 6.3);
  ctx.fill();
  ctx.restore();
}
function outlineWash(g, x, y, w, h, dark) {
  g.fillStyle = dark;
  g.fillRect((x - 0.45) * PIX, y * PIX, 0.45 * PIX, h * PIX);
  g.fillRect((x + w) * PIX, y * PIX, 0.45 * PIX, h * PIX);
}

// ------------------------------------------------------------------
//  Cabelo / chapéus
// ------------------------------------------------------------------
function drawHair(g, spec, dir) {
  const h0 = spec.hair, h1 = spec.hairDark;
  const style = spec.hairStyle || "short";
  const side = dir === "left" || dir === "right";
  if (style === "long") {
    rect(g, 4.2, 1.2, 7.6, 5.2, h0);
    rect(g, 4.1, 3, 0.9, 6.2, h1);
    rect(g, 11.1, 3, 0.9, 6.2, h1);
    rect(g, 4.8, 1.0, 6.4, 1.2, shade(h0, 0.18));
    if (!side) {
      rect(g, 4.4, 6, 7.2, 1.4, h1);
    }
  } else if (style === "pixie") { rect(g, 5.0, 1.4, 6.0, 2.2, h0); rect(g, 5.2, 1.2, 5.6, 0.8, shade(h0, 0.20)); } else if (style === "mullet") { rect(g, 4.8, 1.4, 6.4, 2.0, h0); rect(g, 4.6, 3.2, 6.8, 3.0, h1); } else if (style === "spiky") { for(let i=0;i<4;i++){ rect(g, 4.8 + i*1.6, 1.0, 1.2, 2.0, h0); } } else if (style === "bangs") { rect(g, 4.4, 1.2, 7.2, 3.8, h0); } else if (style === "twin") { rect(g, 3.2, 3.0, 1.6, 4.0, h0); rect(g, 11.2, 3.0, 1.6, 4.0, h0); rect(g, 4.8, 1.4, 6.4, 2.8, h0); } else if (style === "messy") { rect(g, 4.4, 1.2, 7.2, 3.6, h0); } else if (style === "long_masc") { rect(g, 4.0, 1.6, 8.0, 4.8, h0); } else if (style === "ponytail") {
    rect(g, 4.6, 1.2, 6.8, 4.0, h0);
    rect(g, 5.2, 1.0, 5.6, 1.4, shade(h0, 0.16));
    if (side) {
      rect(g, dir === "right" ? 11.0 : 3.2, 4.2, 2.2, 2.8, h1);
      rect(g, dir === "right" ? 11.2 : 3.4, 6.6, 1.6, 1.8, h0);
    } else {
      rect(g, 7.0, 5.6, 2.0, 3.2, h0);
      rect(g, 7.2, 8.4, 1.6, 1.2, h1);
    }
  } else if (style === "bun") {
    rect(g, 4.8, 1.4, 6.4, 3.8, h0);
    rect(g, 6.2, 0.6, 3.6, 1.6, h0);
    rect(g, 6.6, 0.8, 2.8, 1.0, shade(h0, 0.15));
    rect(g, 4.6, 4.2, 1.0, 2.0, h1);
    rect(g, 10.4, 4.2, 1.0, 2.0, h1);
  } else {
    // short
    rect(g, 4.6, 1.4, 6.8, 3.6, h0);
    rect(g, 5.0, 1.2, 6.0, 1.0, shade(h0, 0.18));
    rect(g, 4.8, 4.6, 0.8, 1.0, h1);
    rect(g, 10.6, 4.6, 0.8, 1.0, h1);
    // brilho topo para volume
    if (!spec.bald) rect(g, 5.8, 1.6, 4.4, 0.6, shade(h0, 0.14));
    if (spec.bald) {
      rect(g, 6.2, 1.0, 3.6, 1.6, spec.skin);
    }
  }
  // brilho genérico para outros estilos longos/ponytail/bun já tem shade
  if (style === "side_sweep") { rect(g, 4.6, 1.4, 6.8, 3.2, h0); rect(g, 7.0, 1.6, 3.2, 1.8, shade(h0,-0.12)); }
  if (style === "afro_puff") { rect(g, 3.6, 1.0, 8.8, 4.8, h0); rect(g, 4.2, 1.2, 7.6, 1.0, shade(h0,0.18)); }
  if (style === "undercut") { rect(g, 5.6, 1.2, 4.8, 1.6, h0); rect(g, 4.8, 2.8, 6.4, 0.4, h1); }
  if (style === "long_wavy_masc") { rect(g, 3.8, 1.6, 8.4, 5.0, h0); rect(g, 4.2, 3.2, 1.0, 4.0, h1); }
  if (style === "braid_long") { rect(g, 4.6, 1.4, 6.8, 3.6, h0); rect(g, 7.0, 5.0, 2.0, 4.2, h1); rect(g, 7.2, 9.0, 1.6, 1.0, h0); }
  if (style === "long") rect(g, 6.4, 1.4, 3.2, 0.5, shade(h0, 0.20));
  if (style === "bun") rect(g, 7.0, 0.8, 2.0, 0.4, "rgba(255,255,255,.18)");
  if (spec.beard) {
    rect(g, 5.6, 6.0, 4.8, 1.4, h1);
    rect(g, 6.0, 7.2, 4.0, 0.8, shade(h1, -0.1));
  }
}
function drawHat(g, spec, dir) {
  const hat = spec.hat || { type: "none" };
  if (!hat || hat.type === "none") return;
  const col = hat.color || "#c9a86a";
  if (hat.type === "straw") {
    // Chapéu palha detalhado mão-desenhada: aba curva, trama, fita vermelha com sombra
    rect(g, 3.4, 2.8, 9.2, 1.6, col); // aba
    rect(g, 3.2, 3.0, 9.6, 0.4, shade(col, 0.22)); // brilho aba topo
    rect(g, 3.4, 4.0, 9.2, 0.5, shade(col, -0.20)); // sombra sob aba
    // copa alta com topo arredondado
    rect(g, 4.6, 0.6, 6.8, 2.4, col);
    rect(g, 4.8, 0.6, 6.4, 0.6, shade(col, 0.28)); // luz topo
    rect(g, 5.0, 1.0, 6.0, 0.4, shade(col, 0.18));
    rect(g, 6.8, 1.2, 2.2, 0.9, "#c0392b"); // fita vermelha
    rect(g, 6.8, 1.2, 2.2, 0.3, shade("#c0392b", 0.25)); // brilho fita
    rect(g, 6.8, 2.6, 2.2, 0.3, shade("#c0392b", -0.25)); // sombra fita
    // trama entrelaçada (linhas horizontais sutis)
    rect(g, 5.2, 1.6, 5.6, 0.3, shade(col, -0.12));
    rect(g, 5.4, 2.0, 5.2, 0.25, shade(col, -0.10));
    // botão decorativo
    rect(g, 7.6, 1.4, 0.7, 0.7, "#e8d5a8");
  } else if (hat.type === "cap") {
    rect(g, 4.4, 0.6, 7.2, 2.2, col);
    rect(g, 5.0, 2.6, 6.0, 0.8, shade(col, -0.2));
    rect(g, 10.2, 2.4, 2.2, 1.0, shade(col, -0.14));
    rect(g, 4.8, 1.0, 6.4, 0.8, shade(col, 0.16));
  } else if (hat.type === "bandana") {
    rect(g, 4.4, 1.4, 7.2, 1.6, col);
    rect(g, 4.6, 2.6, 6.8, 0.6, shade(col, -0.16));
    rect(g, 10.8, 2.8, 1.4, 1.4, col);
  } else if (hat.type === "sailor") {
    rect(g, 4.6, 0.4, 6.8, 1.8, "#ffffff");
    rect(g, 4.4, 1.8, 7.2, 0.8, col);
    rect(g, 10.8, 2.4, 1.2, 1.2, col);
    rect(g, 6.4, 0.6, 3.2, 0.6, shade(col, 0.2));
  } else if (hat.type === "flower") {
    rect(g, 4.8, 1.6, 6.4, 1.2, hat.color || col);
    rect(g, 7.6, 0.6, 1.6, 1.2, hat.color2 || "#ffe066");
    rect(g, 8.0, 0.9, 0.8, 0.6, "#fff3a0");
  } else if (hat.type === "goggles") {
    rect(g, 4.4, 1.8, 7.2, 1.0, col);
    rect(g, 5.0, 2.0, 1.4, 0.8, "#3a3a3a");
    rect(g, 9.4, 2.0, 1.4, 0.8, "#3a3a3a");
    rect(g, 6.4, 2.2, 3.0, 0.4, "#c9a86a");
  }
}

// ------------------------------------------------------------------
//  Rosto
// ------------------------------------------------------------------
function drawFace(g, spec, dir, blink, action) {
  const skin = spec.skin, skinShade = spec.skinShade;
  // pescoço — liga cabeça ao tronco (estava sem pescoço)
  rect(g, 7.0, 7.4, 2.0, 1.8, skin);
  rect(g, 7.0, 7.4, 0.5, 1.8, shade(skin, -0.12));
  rect(g, 8.5, 7.4, 0.5, 1.8, shade(skin, 0.08));
  // orelhas visíveis (sempre, exceto quando cabelo longo cobre parcialmente)
  rect(g, 3.8, 3.8, 1.0, 1.6, shade(skin, -0.10));
  rect(g, 11.2, 3.8, 1.0, 1.6, shade(skin, -0.10));
  rect(g, 4.0, 4.0, 0.6, 1.0, shade(skinShade, 0.15));
  rect(g, 11.4, 4.0, 0.6, 1.0, shade(skinShade, 0.15));
  // cabeça base 7x5 com cantos levemente arredondados via sombra
  rect(g, 4.6, 2.8, 6.8, 5.0, skin);
  rect(g, 4.6, 6.0, 6.8, 1.2, skinShade);
  rect(g, 4.4, 3.6, 0.6, 3.0, skinShade);
  rect(g, 10.9, 3.6, 0.6, 3.0, skinShade);
  // brincos se tiver colar prateado/dourado
  if (spec.necklace) {
    const eCol = spec.necklace;
    rect(g, 4.4, 5.0, 0.8, 0.8, eCol);
    rect(g, 11.0, 5.0, 0.8, 0.8, eCol);
    rect(g, 4.6, 5.4, 0.4, 0.4, shade(eCol, 0.25));
    rect(g, 11.2, 5.4, 0.4, 0.4, shade(eCol, 0.25));
  }
  // bochechas rosadas mais visíveis
  rect(g, 4.9, 5.4, 1.6, 1.0, alpha("#e8a0a0", 0.38));
  rect(g, 9.5, 5.4, 1.6, 1.0, alpha("#e8a0a0", 0.38));

  const lookingLeft = dir === "left";
  const lookingRight = dir === "right";
  const lookingUp = dir === "up";
  const eyeY = lookingUp ? 4.2 : 4.8;
  let eyeX0 = 5.8, eyeX1 = 9.0;
  if (lookingLeft) { eyeX0 -= 0.6; eyeX1 -= 0.6; }
  if (lookingRight) { eyeX0 += 0.6; eyeX1 += 0.6; }

  const eyeColor = spec.eyeColor || "#5a3a1e";
  const eyeLight = spec.eyeLight || shade(eyeColor, 0.35);
  if (blink) {
    rect(g, eyeX0, eyeY, 1.4, 0.6, "#2b1e16");
    rect(g, eyeX1, eyeY, 1.4, 0.6, "#2b1e16");
  } else {
    // olhos grandes estilo cozy — agora com cor personalizável
    rect(g, eyeX0, eyeY, 1.4, 1.4, "#ffffff");
    rect(g, eyeX1, eyeY, 1.4, 1.4, "#ffffff");
    // íris com cor escolhida
    rect(g, eyeX0 + 0.3, eyeY + 0.3, 0.9, 0.9, eyeColor);
    rect(g, eyeX1 + 0.3, eyeY + 0.3, 0.9, 0.9, eyeColor);
    // pupila
    rect(g, eyeX0 + 0.5, eyeY + 0.5, 0.5, 0.5, "#1a0f08");
    rect(g, eyeX1 + 0.5, eyeY + 0.5, 0.5, 0.5, "#1a0f08");
    // brilho
    rect(g, eyeX0 + 0.6, eyeY + 0.2, 0.4, 0.4, eyeLight);
    rect(g, eyeX1 + 0.6, eyeY + 0.2, 0.4, 0.4, eyeLight);
    rect(g, eyeX0 + 0.2, eyeY + 0.9, 0.3, 0.3, "rgba(255,255,255,.85)");
    rect(g, eyeX1 + 0.2, eyeY + 0.9, 0.3, 0.3, "rgba(255,255,255,.85)");
    // sombra sob olho
    if (!action) {
      rect(g, eyeX0 + 0.1, eyeY - 0.2, 1.4, 0.4, shade(skin, 0.06));
      rect(g, eyeX1 + 0.1, eyeY - 0.2, 1.4, 0.4, shade(skin, 0.06));
    }
  }
  // sobrancelha leve (dá expressão)
  rect(g, eyeX0 + 0.1, eyeY - 0.5, 1.2, 0.3, shade(spec.hair || "#6b4226", -0.08));
  rect(g, eyeX1 + 0.1, eyeY - 0.5, 1.2, 0.3, shade(spec.hair || "#6b4226", -0.08));
  // boca — agora visível e animada
  if (action) {
    rect(g, 7.3, 6.4, 1.6, 1.0, "#6b2a2a");
    rect(g, 7.5, 6.6, 1.2, 0.5, "#ffffff");
    rect(g, 7.7, 6.9, 0.8, 0.3, "#ff8a8a");
  } else {
    // boca sorridente suave
    rect(g, 7.2, 6.6, 1.8, 0.5, "#5a2a2a");
    rect(g, 7.4, 6.7, 1.4, 0.3, "#c96a5a");
    rect(g, 7.6, 6.85, 1.0, 0.25, shade("#c96a5a", 0.35));
    // brilho lábio inferior
    rect(g, 7.8, 6.95, 0.4, 0.15, "rgba(255,255,255,.55)");
  }
  // nariz sutil com sombra
  rect(g, 7.6, 5.35, 0.8, 0.55, shade(skin, -0.10));
  rect(g, 7.65, 5.5, 0.7, 0.3, shade(skin, -0.06));
}

// ------------------------------------------------------------------
//  Corpo / braços — com variação de pose por ferramenta
// ------------------------------------------------------------------
function drawBody(g, spec, dir, frame, act, toolPhase = 0) {
  const shirt = spec.shirt || "#e2695e", shirtDark = spec.shirtDark || shade(shirt,-0.18), pants = spec.pants || "#43506b";
  const skin = spec.skin || "#ffe0bd", skinShade = spec.skinShade || "#dba97e";
  const flip = dir === "right";
  const side = dir === "left" || dir === "right";

  // pernas com calça personalizável e sapatos marrons decentes
  const legWob = side ? 0 : [0, 0.3, 0, -0.3][frame] || 0;
  const shoeBase = "#3b2f1e", shoeLight = "#6b5430", shoeSole = "#1f160d";
  // perna esquerda
  rect(g, 5.6 + legWob, 16.2, 2.2, 5.4, pants);
  rect(g, 5.6 + legWob, 16.6, 0.5, 5.0, shade(pants, -0.18));
  rect(g, 5.7 + legWob, 20.9, 2.0, 0.6, shade(pants, -0.10)); // bainha
  // sapato esquerdo — com bico e sola
  rect(g, 5.2 + legWob, 21.5, 2.8, 1.3, shoeBase);
  rect(g, 5.4 + legWob, 21.5, 2.4, 0.5, shoeLight);
  rect(g, 5.2 + legWob, 22.6, 2.8, 0.45, shoeSole);
  rect(g, 5.4 + legWob, 21.7, 2.0, 0.4, shade(shoeBase, 0.18));
  // perna direita
  rect(g, 8.2 - legWob, 16.2, 2.2, 5.4, pants);
  rect(g, 9.6 - legWob, 16.6, 0.5, 5.0, shade(pants, -0.14));
  rect(g, 8.3 - legWob, 20.9, 2.0, 0.6, shade(pants, -0.10));
  rect(g, 8.0 - legWob, 21.5, 2.8, 1.3, shoeBase);
  rect(g, 8.2 - legWob, 21.5, 2.4, 0.5, shoeLight);
  rect(g, 8.0 - legWob, 22.6, 2.8, 0.45, shoeSole);
  rect(g, 8.2 - legWob, 21.7, 2.0, 0.4, shade(shoeBase, 0.18));

  // torso com gola respeitando margens e camiseta bonita
  if (spec.coatBack) {
    rect(g, 4.8, 9.6, 6.8, 6.8, spec.coatBack);
    rect(g, 5.2, 10.2, 6.0, 6.2, shirt);
    rect(g, 7.6, 11.2, 0.6, 0.6, "#2b1e16");
    rect(g, 7.6, 12.8, 0.6, 0.6, "#2b1e16");
    rect(g, 4.8, 10.4, 0.6, 6.0, shade(spec.coatBack, -0.2));
    // gola do casaco
    rect(g, 6.4, 9.6, 3.2, 0.9, shade(shirt, -0.15));
  } else {
    rect(g, 4.8, 9.6, 6.8, 6.8, shirt);
    rect(g, 4.8, 10.4, 0.6, 6.0, shirtDark);
    rect(g, 10.8, 10.4, 0.6, 6.0, shade(shirt, 0.12));
    // gola em V / careca — respeita margens do corpo e pescoço
    rect(g, 6.8, 9.4, 2.4, 1.0, shade(shirt, -0.22));
    rect(g, 7.1, 9.6, 1.8, 0.7, skin);
    // detalhe da costura lateral para realce
    rect(g, 5.0, 11.2, 0.4, 4.2, shade(shirt, 0.10));
    rect(g, 10.6, 11.2, 0.4, 4.2, shade(shirtDark, 0.08));
  }
  // camadas desenhadas à mão se existirem (Stardew level) - desenha por cima do corpo base
  if(spec.bodyAsset){
    const bImg = loadBodyAsset(spec.bodyAsset);
    if(bImg && bImg.complete && bImg.naturalWidth>0){
      const s = spec.bodyScale || 1;
      const sw = W*PIX*s, sh = H*PIX*s;
      // pernas com fluidez: leve balanço lateral por frame (mãos estáticas, só pernas mexem)
      const swing = side ? 0 : ([0, 0.35, 0, -0.35][frame] || 0);
      const sx0 = (W*PIX - sw)/2 + swing*PIX;
      const sy0 = (H*PIX - sh);
      g.clearRect(0,0,W*PIX,H*PIX);
      g.drawImage(bImg, 0, 0, bImg.naturalWidth, bImg.naturalHeight, sx0, sy0, sw, sh);
    }
  }
  if(spec.shirtAsset){
    const lImg = loadLayerAsset(spec.shirtAsset);
    if(lImg && lImg.complete && lImg.naturalWidth>0){ g.drawImage(lImg, 0, 0, lImg.naturalWidth, lImg.naturalHeight, 0, 6*PIX, W*PIX, H*PIX*0.6); }
  }
  if(spec.pantsAsset){
    const pImg = loadLayerAsset(spec.pantsAsset);
    if(pImg && pImg.complete && pImg.naturalWidth>0){ g.drawImage(pImg, 0, 0, pImg.naturalWidth, pImg.naturalHeight, 0, 13*PIX, W*PIX, H*PIX*0.45); }
  }
  if(spec.hairAsset){
    const hImg = loadLayerAsset(spec.hairAsset);
    if(hImg && hImg.complete && hImg.naturalWidth>0){ g.drawImage(hImg, 0, 0, hImg.naturalWidth, hImg.naturalHeight, 0, 0, W*PIX, H*PIX*0.5); }
  }
  if(spec.hatAsset){
    const haImg = loadLayerAsset(spec.hatAsset);
    if(haImg && haImg.complete && haImg.naturalWidth>0){ g.drawImage(haImg, 0, 0, haImg.naturalWidth, haImg.naturalHeight, 0, 0, W*PIX, H*PIX*0.5); }
  }
  // padrão da camisa — agora realmente aparece o design escolhido
  const design = spec.shirtDesign || "solid";
  if (design === "plaid") {
    // xadrez vermelho
    rect(g, 6.2, 10.8, 0.6, 4.2, shade(shirt, 0.18));
    rect(g, 9.0, 10.8, 0.6, 4.2, shade(shirt, 0.18));
    rect(g, 5.4, 12.2, 5.6, 0.5, shade(shirtDark, 0.12));
    rect(g, 5.4, 14.0, 5.6, 0.5, shade(shirtDark, 0.12));
  } else if (design === "bow") {
    // laço azul no peito
    rect(g, 7.2, 10.6, 1.8, 0.9, "#ffffff");
    rect(g, 7.8, 10.0, 0.6, 1.6, "#5b9bd5");
    rect(g, 7.5, 10.9, 0.4, 0.4, "#ffd166"); rect(g, 8.3, 10.9, 0.4, 0.4, "#ffd166");
  } else if (design === "floral") {
    rect(g, 6.0, 12.0, 0.8, 0.8, "#fff7e0"); rect(g, 6.2, 12.2, 0.4, 0.4, "#e8c15c");
    rect(g, 9.2, 12.8, 0.8, 0.8, "#fff7e0"); rect(g, 9.4, 13.0, 0.4, 0.4, "#e8c15c");
  } else if (design === "sweater") {
    rect(g, 5.2, 11.0, 5.6, 0.4, shade(shirtDark, 0.10));
    rect(g, 5.2, 13.2, 5.6, 0.4, shade(shirtDark, 0.10));
    rect(g, 8.2, 11.6, 1.2, 1.2, shade("#d96a3a", 0.1)); rect(g, 8.6, 12.0, 0.4, 0.4, "#fff");
  } else if (design === "ruffled") {
    rect(g, 5.0, 10.0, 1.0, 5.0, shade(shirt, 0.14)); rect(g, 6.2, 10.6, 0.6, 3.8, "rgba(255,255,255,.35)");
    rect(g, 9.0, 10.0, 1.0, 5.0, shade(shirt, 0.14));
  } else if (design === "western") {
    rect(g, 5.6, 11.6, 1.4, 1.2, shade(shirtDark, 0.12)); rect(g, 6.0, 12.0, 0.6, 0.4, "#ffd166");
    rect(g, 8.6, 11.6, 1.4, 1.2, shade(shirtDark, 0.12)); rect(g, 9.0, 12.0, 0.6, 0.4, "#ffd166");
  } else if (design === "hearts") {
    rect(g, 6.6, 13.2, 0.6, 0.6, "#ff6b8a"); rect(g, 8.8, 12.8, 0.6, 0.6, "#ff6b8a");
    rect(g, 7.0, 13.6, 0.4, 0.4, shade("#ff6b8a", 0.2));
  } else if (design === "jumpsuit") {
    // jardineira trigo — faixas
    rect(g, 6.0, 11.0, 0.4, 4.6, "#c9a86a"); rect(g, 9.6, 11.0, 0.4, 4.6, "#c9a86a");
    rect(g, 7.8, 11.0, 0.4, 4.6, "#c9a86a");
  } else if (design === "striped") {
    rect(g, 5.6, 11.4, 4.8, 0.4, "#ffffff"); rect(g, 5.6, 13.0, 4.8, 0.4, "#ffffff");
  } else if (design === "denim") {
    rect(g, 5.8, 11.0, 4.4, 0.6, shade(shirt,0.14)); rect(g, 5.8, 12.8, 4.4, 0.3, shade(shirtDark,0.10));
  } else if (design === "overalls") {
    rect(g, 5.4, 10.2, 0.6, 5.8, "#6b4a2f"); rect(g, 10.0, 10.2, 0.6, 5.8, "#6b4a2f");
    rect(g, 7.4, 14.0, 1.2, 0.6, "#e8b44a");
  } else if (design === "hoodie") {
    rect(g, 5.0, 10.6, 6.0, 1.0, shade(shirt,0.10)); rect(g, 6.8, 9.2, 2.4, 1.2, shade(shirt,-0.12));
    rect(g, 7.8, 9.4, 0.6, 1.4, "#ffffff");
  }
  // gola/cachecol por estação
  if (spec.scarf) {
    rect(g, 5.4, 9.2, 5.8, 1.2, spec.scarf);
    rect(g, 6.8, 9.0, 2.4, 0.8, shade(spec.scarf, 0.15));
    rect(g, 7.0, 10.2, 0.8, 1.6, spec.scarf);
  }
  if (spec.apron) {
    rect(g, 5.6, 11.8, 4.8, 4.8, spec.apron);
    rect(g, 5.6, 12.2, 0.5, 4.4, shade(spec.apron, -0.12));
    if (spec.apron === "#ffffff") {
      rect(g, 7.2, 12.8, 1.6, 1.0, "#e2695e");
    }
  }
  // distintivo / emblema para NPCs
  if (spec.necklace) {
    // colar - brinco simples estilo Stardew
    rect(g, 7.0, 9.2, 2.0, 0.6, spec.necklace);
    rect(g, 7.6, 9.6, 0.8, 0.8, shade(spec.necklace, 0.25));
    rect(g, 7.8, 9.8, 0.4, 0.4, "#fff8e0");
  }
  if (spec.bracelet) {
    // bracelete no pulso
    rect(g, 3.0, 13.4, 1.8, 0.6, spec.bracelet);
    rect(g, 11.2, 13.4, 1.8, 0.6, spec.bracelet);
    rect(g, 3.4, 13.6, 1.0, 0.3, "#fff8e0");
  }
  if (spec.badge) {
    rect(g, 9.0, 11.0, 1.2, 1.2, "#d4af37");
    rect(g, 9.2, 11.2, 0.8, 0.8, "#fff4a0");
  }
  // bolsos / cinto
  if (!act) {
    rect(g, 6.2, 14.8, 1.2, 1.0, shade(pants, 0.12));
    rect(g, 8.6, 14.8, 1.2, 1.0, shade(pants, 0.12));
  }

  // braços — pose muda com ferramenta e direção
  const tool = spec.tool || null;
  if (act && tool) {
    // poses específicas por ferramenta
    if (tool === "enxada") {
      // braços erguidos acima da cabeça
      if (side) {
        rect(g, flip ? 9.8 : 2.4, 7.8, 2.0, 4.6, skin);
        rect(g, flip ? 10.4 : 3.0, 10.0, 2.0, 3.6, skinShade);
        rect(g, 5.2, 11.0, 5.6, 2.6, shirt);
      } else {
        rect(g, 3.0, 8.2, 2.2, 4.4, skin);
        rect(g, 10.8, 8.2, 2.2, 4.4, skin);
        rect(g, 3.4, 10.8, 1.4, 2.2, skinShade);
        rect(g, 11.2, 10.8, 1.4, 2.2, skinShade);
        rect(g, 4.8, 10.6, 6.4, 2.4, shirt);
      }
    } else if (tool === "machado") {
      // machado balançado lateralmente
      if (side) {
        rect(g, flip ? 8.8 : 3.2, 10.2, 2.4, 4.0, skin);
        rect(g, flip ? 9.2 : 3.6, 12.6, 2.0, 1.2, skinShade);
        rect(g, 5.0, 11.4, 6.0, 2.6, shirt);
      } else {
        rect(g, 3.2, 9.6, 2.0, 4.4, skin);
        rect(g, 10.8, 9.6, 2.0, 4.4, skin);
        rect(g, 5.0, 10.8, 6.0, 2.6, shirt);
      }
    } else if (tool === "picareta") {
      // picareta alta, braços esticados pra cima
      rect(g, 3.4, 7.0, 2.0, 5.2, skin);
      rect(g, 10.6, 7.0, 2.0, 5.2, skin);
      rect(g, 4.8, 10.4, 6.4, 2.8, shirt);
    } else if (tool === "regador") {
      // segurado à frente, inclinado para regar
      const wx = side ? (flip ? 9.2 : 2.8) : 3.6;
      rect(g, wx, 10.8, 2.2, 3.8, skin);
      rect(g, side ? (flip ? 7.0 : 6.8) : 10.2, 10.8, 2.0, 3.4, skin);
      rect(g, 5.2, 11.2, 5.6, 2.4, shirt);
    } else if (tool === "vara") {
      // vara de pesca: braços estendidos à frente
      if (side) {
        rect(g, flip ? 9.4 : 3.0, 10.4, 2.2, 2.2, skin);
        rect(g, flip ? 8.2 : 4.8, 10.4, 2.0, 2.2, skin);
      } else {
        rect(g, 3.4, 10.6, 2.0, 3.0, skin);
        rect(g, 10.6, 10.6, 2.0, 3.0, skin);
      }
      rect(g, 5.0, 11.0, 6.0, 2.6, shirt);
    } else if (tool === "foice") {
      // foice varrendo baixo
      rect(g, side ? (flip ? 8.6 : 3.4) : 3.8, 11.2, 2.2, 3.6, skin);
      rect(g, side ? (flip ? 7.0 : 5.8) : 10.0, 11.2, 2.0, 3.0, skin);
      rect(g, 5.2, 11.4, 5.6, 2.4, shirt);
    } else {
      rect(g, 2.8, 10.2, 2.0, 3.8, skin);
      rect(g, 11.2, 10.2, 2.0, 3.8, skin);
      rect(g, 5.0, 11.0, 6.0, 2.8, shirt);
    }
  } else if (act) {
    // pose genérica de ação
    rect(g, 2.8, 9.8, 2.2, 4.0, skin);
    rect(g, 11.0, 9.8, 2.2, 4.0, skin);
  } else {
    // repouso / caminhando
    const swing = side ? 0 : [0, 0.6, 0, -0.6][frame] || 0;
    rect(g, 2.8 + swing, 10.2, 2.0, 4.6, skin);
    rect(g, 11.2 - swing, 10.2, 2.0, 4.6, skin);
    rect(g, 3.0 + swing, 13.0, 1.6, 1.0, skinShade);
    rect(g, 11.4 - swing, 13.0, 1.6, 1.0, skinShade);
    // luvas nos sprites laterais para dar volume
    if (side) {
      rect(g, flip ? 11.8 : 2.4, 10.8, 1.8, 2.8, shirtDark);
    }
  }

  // mãos
  if (act) {
    // mãos fechadas segurando ferramenta
    rect(g, 4.0, 8.6, 1.6, 1.4, skin);
    rect(g, 10.4, 8.6, 1.6, 1.4, skin);
    if (side) {
      rect(g, flip ? 11.6 : 2.0, 10.6, 1.4, 1.4, skin);
    }
  } else {
    rect(g, 3.2, 13.8, 1.4, 1.2, skin);
    rect(g, 11.4, 13.8, 1.4, 1.2, skin);
  }
}

// ------------------------------------------------------------------
//  Ferramentas — sprites detalhados com variação por direção e pose
// ------------------------------------------------------------------
function drawTool(g, tool, dir) {
  if (!tool) return;
  const flip = dir === "right";
  const side = dir === "left" || dir === "right";

  // helper: desenha cabo de madeira com sombreamento
  function woodHandle(x, y, w, h) {
    rect(g, x, y, w, h, "#8b7355");
    rect(g, x, y, 0.5, h, "#a88a5f");
    rect(g, x + w - 0.5, y, 0.5, h, "#6b5430");
    rect(g, x, y, w, 0.4, shade("#8b7355", 0.12));
  }
  function metalPart(x, y, w, h, base, dark, hi) {
    rect(g, x, y, w, h, base);
    rect(g, x, y, w, 0.5, hi);
    rect(g, x, y, 0.5, h, dark);
    rect(g, x, y + h - 0.5, w, 0.5, dark);
  }

  if (tool === "enxada") {
    if (side) {
      const hx = flip ? 11.8 : 0.6;
      const hy = 6.8;
      // cabo longo na horizontal / diagonal
      woodHandle(flip ? 3.2 : 2.2, hy + 1.2, 9.2, 1.4);
      // cabeça da enxada — lâmina larga
      metalPart(flip ? 12.2 : 0.4, hy, 3.2, 2.2, "#8a96a0", "#5f6972", "#c8d0d6");
      rect(g, flip ? 11.6 : 3.0, hy + 0.4, 1.4, 1.4, "#6f7a84");
      // detalhe: dentes
      rect(g, flip ? 13.8 : 0.6, hy + 1.6, 0.4, 0.8, "#3a3a3a");
      rect(g, flip ? 14.6 : 1.4, hy + 1.6, 0.4, 0.8, "#3a3a3a");
    } else if (dir === "up") {
      // enxada nas costas
      woodHandle(9.8, 10.2, 1.4, 6.0);
      metalPart(9.4, 9.6, 2.2, 1.4, "#8a96a0", "#5f6972", "#c8d0d6");
    } else {
      // frente: cabo vertical com lâmina horizontal embaixo
      woodHandle(7.2, 3.2, 1.6, 10.2);
      metalPart(5.4, 12.8, 5.2, 1.8, "#8a96a0", "#5f6972", "#c8d0d6");
      rect(g, 6.8, 12.4, 2.4, 0.8, "#6f7a84");
      rect(g, 5.8, 13.8, 0.6, 0.8, "#7a8470");
      rect(g, 9.4, 13.8, 0.6, 0.8, "#7a8470");
    }
  } else if (tool === "picareta") {
    if (side) {
      const hx = flip ? 12.0 : 0.8;
      woodHandle(flip ? 2.8 : 2.6, 6.6, 9.8, 1.3);
      // cabeça em T pontiaguda
      metalPart(flip ? 12.4 : 0.2, 6.0, 3.0, 1.0, "#7a848c", "#4f555c", "#b0b8be");
      rect(g, flip ? 13.4 : 0.4, 5.6, 0.8, 0.4, "#b0b8be");
      rect(g, flip ? 13.4 : 0.4, 7.0, 0.8, 0.4, "#4f555c");
      // ponta picareta brilho
      rect(g, flip ? 14.6 : 0.0, 6.2, 0.6, 0.6, "#d5dde2");
    } else if (dir === "up") {
      woodHandle(9.0, 10.0, 1.3, 6.2);
      metalPart(8.2, 9.4, 2.8, 1.0, "#7a848c", "#4f555c", "#b0b8be");
    } else {
      woodHandle(7.3, 2.8, 1.4, 10.6);
      metalPart(5.4, 2.8, 5.2, 1.2, "#7a848c", "#4f555c", "#b0b8be");
      rect(g, 5.4, 3.2, 0.8, 0.6, "#b0b8be");
      rect(g, 10.2, 3.2, 0.8, 0.6, "#4f555c");
      rect(g, 7.6, 2.2, 1.0, 1.0, "#6b747d");
    }
  } else if (tool === "machado") {
    if (side) {
      woodHandle(flip ? 3.0 : 2.4, 7.2, 9.0, 1.4);
      // cabeça do machado grande
      metalPart(flip ? 11.8 : 0.6, 6.2, 2.6, 3.2, "#a8b4bc", "#6f7a84", "#d5e0e6");
      rect(g, flip ? 11.2 : 2.8, 6.8, 1.2, 2.0, "#7d8a94");
      // fio afiado
      rect(g, flip ? 14.0 : 0.0, 6.8, 0.6, 2.0, "#eaf0f4");
      rect(g, flip ? 12.2 : 1.0, 6.4, 1.0, 0.6, "#eaf0f4");
      rect(g, flip ? 12.2 : 1.0, 9.0, 1.0, 0.6, "#eaf0f4");
    } else if (dir === "up") {
      woodHandle(9.6, 9.8, 1.4, 6.4);
      metalPart(8.8, 9.0, 2.8, 1.8, "#a8b4bc", "#6f7a84", "#d5e0e6");
      rect(g, 8.8, 9.8, 2.8, 0.4, "#eaf0f4");
    } else {
      woodHandle(7.2, 3.0, 1.6, 9.8);
      metalPart(8.4, 3.2, 2.2, 3.2, "#a8b4bc", "#6f7a84", "#d5e0e6");
      rect(g, 8.4, 4.0, 2.2, 0.6, "#7d8a94");
      rect(g, 10.2, 3.6, 0.4, 2.4, "#eaf0f4");
      // cabo extra visível
      rect(g, 7.6, 12.2, 0.8, 1.0, "#5a4528");
    }
  } else if (tool === "regador") {
    if (side) {
      const bx = flip ? 7.6 : 4.2;
      // corpo do regador
      metalPart(bx, 8.4, 4.2, 3.6, "#6fa8b8", "#4a7a8a", "#a8dce8");
      rect(g, bx + 0.4, 8.6, 3.4, 0.6, "#8fbfd0");
      rect(g, bx, 8.2, 4.2, 0.6, "#8fbfd0");
      // bico alongado
      rect(g, flip ? bx + 3.8 : bx - 1.8, 9.4, 2.2, 1.0, "#7fb8c8");
      rect(g, flip ? bx + 5.4 : bx - 3.2, 9.6, 1.2, 0.6, "#9dcfe0");
      // alça
      rect(g, flip ? bx - 0.8 : bx + 4.6, 9.0, 0.8, 2.0, "#4a7a8a");
      // jato d água quando em ação
      if (dir === "right" || dir === "down") {
        for (let i = 0; i < 4; i++) {
          const dx = flip ? bx + 6.8 + i * 1.2 : bx - 4.4 - i * 1.2;
          rect(g, dx, 10.6 + (i % 2) * 0.6, 0.8, 1.0, alpha("#7ec8e3", 0.7));
          rect(g, dx + 0.4, 12.0 + i * 0.4, 0.4, 0.6, alpha("#b8e6f5", 0.5));
        }
      }
    } else if (dir === "up") {
      metalPart(6.8, 11.4, 3.2, 2.2, "#6fa8b8", "#4a7a8a", "#a8dce8");
      rect(g, 6.4, 11.8, 0.8, 1.4, "#4a7a8a");
    } else {
      // frente: regador inclinado
      metalPart(6.4, 8.8, 3.8, 3.2, "#6fa8b8", "#4a7a8a", "#a8dce8");
      rect(g, 6.8, 8.6, 3.0, 0.6, "#8fbfd0");
      rect(g, 9.6, 9.4, 1.6, 0.8, "#7fb8c8");
      rect(g, 10.6, 9.6, 1.0, 0.6, "#9dcfe0");
      rect(g, 6.2, 9.4, 0.6, 1.6, "#4a7a8a");
      // gotas caindo
      for (let i = 0; i < 3; i++) {
        rect(g, 10.8 + i * 0.8, 10.8 + i * 1.0, 0.6, 0.8, alpha("#7ec8e3", 0.8 - i*0.2));
      }
    }
  } else if (tool === "vara") {
    if (side) {
      // vara longa em ângulo
      const startX = flip ? 3.2 : 2.0;
      for (let i = 0; i < 11; i++) {
        const segColor = i % 3 === 0 ? "#9e8a6a" : "#7a6a4a";
        rect(g, startX + (flip ? i*0.9 : (10-i)*0.9), 5.6 + i*0.12, 1.2, 0.6, segColor);
      }
      // linha de pesca
      for (let i = 0; i < 7; i++) {
        rect(g, startX + (flip ? 11.2 : 0.2) + i*0.6, 7.0 + i*0.8, 0.4, 0.4, alpha("#b0d0e8", 0.9));
      }
      // boia
      rect(g, startX + (flip ? 14.8 : -2.8), 12.2, 1.0, 1.2, "#e94a3a");
      rect(g, startX + (flip ? 14.8 : -2.8), 12.2, 1.0, 0.6, "#ffffff");
      rect(g, startX + (flip ? 15.2 : -2.4), 13.2, 0.4, 0.8, alpha("#b0d0e8", 0.6));
    } else if (dir === "up") {
      woodHandle(7.6, 10.2, 1.0, 6.0);
      rect(g, 7.8, 8.8, 0.6, 1.6, "#c2d0d6");
    } else {
      // frente: vara vertical com linha
      woodHandle(7.6, 2.8, 1.0, 11.4);
      // detalhe da carretilha
      rect(g, 7.2, 8.2, 1.8, 1.4, "#3a3a3a");
      rect(g, 7.4, 8.4, 1.4, 1.0, "#b0b8be");
      rect(g, 7.6, 8.0, 0.6, 0.6, "#e94a3a");
      // linha
      for (let i = 0; i < 5; i++) {
        rect(g, 8.2, 12.2 + i*0.8, 0.4, 0.5, alpha("#b0d0e8", 0.85));
      }
      // anzol
      rect(g, 8.0, 15.0, 0.8, 1.0, "#c0c8ce");
      rect(g, 8.2, 16.0, 0.4, 0.6, "#c0c8ce");
    }
  } else if (tool === "foice") {
    if (side) {
      woodHandle(flip ? 3.4 : 2.6, 8.0, 8.6, 1.2);
      // lâmina curva da foice
      rect(g, flip ? 11.6 : 0.8, 7.0, 2.8, 0.6, "#c2d0d6");
      rect(g, flip ? 13.6 : -0.4, 7.0, 1.4, 1.6, "#c2d0d6");
      rect(g, flip ? 12.0 : 0.6, 6.6, 2.0, 0.6, "#e6eef2");
      rect(g, flip ? 14.2 : -0.6, 6.6, 0.8, 0.6, "#e6eef2");
      // fio curvo
      rect(g, flip ? 13.8 : -0.2, 8.2, 1.2, 0.4, "#a8b8c2");
      // cabo detalhe
      rect(g, flip ? 6.0 : 6.8, 8.0, 0.6, 1.2, "#5a4528");
    } else if (dir === "up") {
      woodHandle(9.4, 10.2, 1.2, 5.8);
      rect(g, 9.0, 9.6, 2.0, 0.8, "#c2d0d6");
      rect(g, 10.2, 9.8, 1.0, 1.4, "#c2d0d6");
    } else {
      woodHandle(7.4, 4.8, 1.4, 8.2);
      // lâmina em arco à frente
      rect(g, 5.2, 5.2, 4.8, 0.8, "#c2d0d6");
      rect(g, 5.0, 5.4, 0.6, 1.6, "#c2d0d6");
      rect(g, 9.6, 5.4, 0.6, 1.6, "#c2d0d6");
      rect(g, 5.2, 4.8, 4.8, 0.6, "#e6eef2");
      rect(g, 7.2, 6.0, 1.6, 0.4, "#a8b8c2");
    }
  } else if (tool === "semente" || tool === "sementes") {
    // saco de sementes
    rect(g, 3.2, 10.2, 2.8, 3.0, "#d8c99a");
    rect(g, 3.6, 10.0, 2.0, 0.6, "#b8a87a");
    rect(g, 3.8, 11.2, 2.0, 0.4, "#7ac74f");
    rect(g, 4.2, 11.8, 1.2, 0.4, "#5fa93e");
    if (side) {
      rect(g, flip ? 9.2 : 3.8, 11.0, 1.6, 1.6, "#d8c99a");
    } else {
      rect(g, 10.2, 11.0, 1.6, 1.6, "#d8c99a");
    }
  }
}

// ------------------------------------------------------------------
//  Variação sazonal de roupas dos NPCs
// ------------------------------------------------------------------
export const SEASON_NPC_OVERRIDES = {
  primavera: {
    maria: { scarf: null, coatBack: null },
    joao: { shirt: "#8a5a3b", shirtDark: "#66412a" },
    ana: { shirt: "#e8c15c" },
    carlos: { shirt: "#6f7b80" },
    luna: { shirt: "#4a90b8" },
    pedro: { shirt: "#f2f5f7" },
    bia: { shirt: "#3f7f9e" },
    tai: { shirt: "#e08a5a" },
    rita: { shirt: "#8f6bab" },
    duda: { shirt: "#c98a3a" },
  },
  verao: {
    maria: { shirt: "#d46a5a", shirtDark: "#b5473c", coatBack: null, scarf: null },
    joao: { shirt: "#c9a86a", shirtDark: "#a88a4a", coatBack: null },
    ana: { shirt: "#ffe066", shirtDark: "#e8c15c", hat: { type: "flower", color: "#ffe066", color2: "#ff8fab" } },
    carlos: { shirt: "#7fb0a8", shirtDark: "#5a8f87" },
    luna: { shirt: "#5fb0d8", shirtDark: "#4a90b8", hat: { type: "none" } },
    pedro: { shirt: "#ffffff", shirtDark: "#e0e6ea" },
    bia: { shirt: "#4fb0c0", shirtDark: "#3f8f9e" },
    tai: { shirt: "#ffb07a", shirtDark: "#e08a5a", hat: { type: "flower", color: "#ffb07a", color2: "#ffe066" } },
    rita: { shirt: "#b58fd1", shirtDark: "#8f6bab" },
    duda: { shirt: "#e8b84a", shirtDark: "#c98a3a", hat: { type: "goggles", color: "#8a6a2f" } },
  },
  outono: {
    maria: { coatBack: "#7a3a2a", shirt: "#b5473c", scarf: "#c9a86a" },
    joao: { shirt: "#a05a2a", shirtDark: "#7a3a14", scarf: "#d9b06a" },
    ana: { shirt: "#c98a3a", shirtDark: "#a06a26", scarf: "#e8c15c" },
    carlos: { shirt: "#8a6a5a", shirtDark: "#6a4a3a", scarf: "#c9a86a" },
    luna: { shirt: "#3a6f9e", shirtDark: "#2a4f72", coatBack: "#2a4f72" },
    pedro: { shirt: "#f0dcc0", shirtDark: "#d9b89a" },
    bia: { shirt: "#2c5f78", shirtDark: "#1e404f", coatBack: "#1e404f" },
    tai: { shirt: "#c46a3a", shirtDark: "#a04a2a", scarf: "#e8b84a" },
    rita: { shirt: "#8a5ab0", shirtDark: "#6a3a8a", scarf: "#b58fd1" },
    duda: { shirt: "#a06a26", shirtDark: "#7a4a1a", coatBack: "#5a3a1a" },
  },
  inverno: {
    maria: { coatBack: "#4a2a1e", shirt: "#8a3a2a", shirtDark: "#5a2416", scarf: "#e8c15c", hat: { type: "cap", color: "#4a2a1e" } },
    joao: { shirt: "#3a3a3a", shirtDark: "#2a2a2a", coatBack: "#3a3a3a", scarf: "#c9a86a", hat: { type: "cap", color: "#5a3a1e" } },
    ana: { shirt: "#6a8a5a", shirtDark: "#4a6a3a", coatBack: "#3a4a3a", scarf: "#e8c15c", hat: { type: "bandana", color: "#c9a86a" } },
    carlos: { shirt: "#4a4a4a", shirtDark: "#333333", coatBack: "#2a2a2a", scarf: "#8a9aa0", hat: { type: "cap", color: "#2a2a2a" } },
    luna: { shirt: "#2a5a8a", shirtDark: "#1e3a5a", coatBack: "#1e3a5a", scarf: "#ffffff", hat: { type: "sailor", color: "#1e3a5a" } },
    pedro: { shirt: "#e8eef2", shirtDark: "#c9d4dc", coatBack: "#4a5a6a", scarf: "#ffffff" },
    bia: { shirt: "#1e4a5a", shirtDark: "#12303a", coatBack: "#122f3a", scarf: "#a8d8e8" },
    tai: { shirt: "#7a6a5a", shirtDark: "#5a4a3a", coatBack: "#4a3a2a", scarf: "#d9b06a" },
    rita: { shirt: "#6a4a8a", shirtDark: "#4a2a6a", coatBack: "#3a2a4a", scarf: "#e8c1ff" },
    duda: { shirt: "#5a4a3a", shirtDark: "#3a2a1a", coatBack: "#2a1e14", scarf: "#c9a86a", hat: { type: "goggles", color: "#3a2a1e" } },
  },
};

const SEASON_KEYS = ["primavera", "verao", "outono", "inverno"];

export function seasonSpec(npcId, seasonIndex, baseSpec) {
  const seasonKey = SEASON_KEYS[seasonIndex] || "primavera";
  const overrides = SEASON_NPC_OVERRIDES[seasonKey]?.[npcId];
  if (!overrides) return baseSpec;
  return { ...baseSpec, ...overrides };
}

/** Gera o atlas de um personagem */
export function characterFrames(spec) {
  const key = "char:" + JSON.stringify(spec);
  return cached(key, () => {
    const atlas = {};
    for (const dir of ["down", "up", "left", "right"]) {
      atlas[dir] = [];
      for (let f = 0; f < 4; f++) {
        const c = mkCanvas(W * PIX, H * PIX);
        const g = c.getContext("2d");
        g.imageSmoothingEnabled = false;
        const act = false;
        drawBody(g, spec, dir, f, act);
        drawFace(g, spec, dir, false, false);
        drawHair(g, spec, dir);
        drawHat(g, spec, dir);
        atlas[dir].push(c);
      }
      for (const toolName of ["enxada", "picareta", "machado", "regador", "vara", "foice", "semente"]) {
        const ca = mkCanvas(W * PIX, H * PIX);
        const ga = ca.getContext("2d");
        ga.imageSmoothingEnabled = false;
        drawBody(ga, { ...spec, tool: toolName }, dir, 0, true, 0);
        drawFace(ga, spec, dir, false, true);
        drawHair(ga, spec, dir);
        drawHat(ga, spec, dir);
        drawTool(ga, toolName, dir);
        atlas[dir + "Action:" + toolName] = ca;
      }
      const caGeneric = mkCanvas(W * PIX, H * PIX);
      const gaGeneric = caGeneric.getContext("2d");
      gaGeneric.imageSmoothingEnabled = false;
      drawBody(gaGeneric, spec, dir, 0, true);
      drawFace(gaGeneric, spec, dir, false, true);
      drawHair(gaGeneric, spec, dir);
      drawHat(gaGeneric, spec, dir);
      drawTool(gaGeneric, spec.tool, dir);
      atlas[dir + "Action"] = caGeneric;
    }
    return atlas;
  });
}

export const SKIN_SPECS = {
  s1: { shirt: "#e2695e", shirtDark: "#b74d46", pants: "#43506b", skin: C.skin1, skinShade: "#dba97e", hair: "#6b4226", hairDark: "#4a2c18", hairStyle: "long", hat: { type: "straw", color: "#e6c979" } },
  s2: { shirt: "#5b9bd5", shirtDark: "#3f79ad", pants: "#4a3f55", skin: C.skin0, skinShade: "#e0b892", hair: "#d9b06a", hairDark: "#a9814a", hairStyle: "short", hat: { type: "cap", color: "#3f6f9e" } },
  s3: { shirt: "#e8c15c", shirtDark: "#c19a3d", pants: "#5a5140", skin: C.skin2, skinShade: "#c98d5f", hair: "#3a2b22", hairDark: "#241a14", hairStyle: "bun", hat: { type: "flower", color: "#8fc46a", color2: "#ffc6dd" } },
  s4: { shirt: "#7cb98a", shirtDark: "#5a9470", pants: "#3f4f63", skin: C.skin3, skinShade: "#a8683f", hair: "#2b1d17", hairDark: "#1b120e", hairStyle: "short", hat: { type: "bandana", color: "#c85c4f" } },
  s5: { shirt: "#b58fd1", shirtDark: "#8f6bab", pants: "#4b4256", skin: C.skin0, skinShade: "#e0b892", hair: "#a45c2c", hairDark: "#7a3f1b", hairStyle: "ponytail", hat: { type: "none" } },
  s6: { shirt: "#e89a5c", shirtDark: "#c07740", pants: "#455e52", skin: C.skin4, skinShade: "#71402a", hair: "#1f1612", hairDark: "#120c09", hairStyle: "long", hat: { type: "straw", color: "#d9b06a" } },
  s7: { shirt: "#e2695e", shirtDark: "#b74d46", pants: "#43506b", skin: C.skin1, skinShade: "#dba97e", hair: "#6b4226", hairDark: "#4a2c18", hairStyle: "long", hat: { type: "flower", color: "#e8b44a", color2: "#ffd166" }, necklace: "#e8b44a" },
  s8: { shirt: "#5b9bd5", shirtDark: "#3f79ad", pants: "#4a3f55", skin: C.skin0, skinShade: "#e0b892", hair: "#f2e6cc", hairDark: "#d9b06a", hairStyle: "ponytail", hat: { type: "cap", color: "#2980b9" }, necklace: "#c0c0c0" },
  s9: { shirt: "#7cb98a", shirtDark: "#5a9470", pants: "#3f4f63", skin: C.skin3, skinShade: "#a8683f", hair: "#ff9a9e", hairDark: "#c76a6a", hairStyle: "short", hat: { type: "none" }, necklace: "#e8b44a" },
  s10: { shirt: "#fccb90", shirtDark: "#c98a86", pants: "#5a5140", skin: C.skin2, skinShade: "#c98d5f", hair: "#3a2b22", hairDark: "#241a14", hairStyle: "bun", hat: { type: "bandana", color: "#ff6b9e" }, necklace: "#ff6b9e" },
  s11: { shirt: "#d299c2", shirtDark: "#8f5a9e", pants: "#4b4256", skin: C.skin0, skinShade: "#e0b892", hair: "#2b1d17", hairDark: "#1b120e", hairStyle: "short", hat: { type: "sailor", color: "#6c3483" }, necklace: "#ffd700" },
  s12: { shirt: "#ffe4a0", shirtDark: "#c9a86a", pants: "#5a5140", skin: C.skin1, skinShade: "#dba97e", hair: "#1a1a2e", hairDark: "#0f0f1a", hairStyle: "long", hat: { type: "straw", color: "#7d6608" }, necklace: "#a8d8ff" },
};

export function specForSkin(id) {
  return SKIN_SPECS[id] || SKIN_SPECS.s1;
}

/** Especificações visuais dos moradores */
export const NPC_SPECS = {
  maria: { shirt: "#b5473c", shirtDark: "#8a3129", coatBack: "#8a3129", pants: "#4a3f55", skin: C.skin1, skinShade: "#dba97e", hair: "#a9a9a9", hairDark: "#7d7d7d", hairStyle: "bun", hat: { type: "none" }, badge: true },
  joao: { shirt: "#8a5a3b", shirtDark: "#66412a", pants: "#3f4a3a", skin: C.skin2, skinShade: "#c98d5f", hair: "#4a3020", hairDark: "#2c1c10", hairStyle: "short", beard: true, apron: "#b07d4f", hat: { type: "none" } },
  ana: { shirt: "#e8c15c", shirtDark: "#c19a3d", pants: "#4b4256", skin: C.skin2, skinShade: "#c98d5f", hair: "#5a3218", hairDark: "#3a1f0e", hairStyle: "ponytail", apron: "#fff3d6", hat: { type: "bandana", color: "#d9b06a" } },
  carlos: { shirt: "#6f7b80", shirtDark: "#4f595e", pants: "#3a3f45", skin: C.skin3, skinShade: "#a8683f", hair: "#5c5c5c", hairDark: "#3a3a3a", hairStyle: "short", beard: true, bald: true, hat: { type: "none" }, apron: "#4a3b30" },
  luna: { shirt: "#4a90b8", shirtDark: "#326d90", pants: "#3b4a5c", skin: C.skin1, skinShade: "#dba97e", hair: "#2b2b3a", hairDark: "#171723", hairStyle: "long", hat: { type: "sailor", color: "#3b6f9e" } },
  pedro: { shirt: "#f2f5f7", shirtDark: "#cfd9df", pants: "#4a5560", skin: C.skin2, skinShade: "#c98d5f", hair: "#3a2b22", hairDark: "#241a14", hairStyle: "short", apron: "#ffffff", hat: { type: "none" } },
  bia: { shirt: "#3f7f9e", shirtDark: "#2c5f78", pants: "#3a4a55", skin: C.skin3, skinShade: "#a8683f", hair: "#211612", hairDark: "#120c09", hairStyle: "short", hat: { type: "sailor", color: "#2c5f78" } },
  tai: { shirt: "#e08a5a", shirtDark: "#b86a3e", pants: "#4a5c46", skin: C.skin2, skinShade: "#c98d5f", hair: "#1f1612", hairDark: "#120c09", hairStyle: "long", hat: { type: "flower", color: "#e08a5a", color2: "#ffe066" } },
  rita: { shirt: "#8f6bab", shirtDark: "#6f4f8a", pants: "#3f3a4a", skin: C.skin0, skinShade: "#e0b892", hair: "#7a3f1b", hairDark: "#4f2a12", hairStyle: "bun", hat: { type: "none" } },
  duda: { shirt: "#c98a3a", shirtDark: "#a06a26", pants: "#46503f", skin: C.skin1, skinShade: "#dba97e", hair: "#3a2b22", hairDark: "#241a14", hairStyle: "short", hat: { type: "goggles", color: "#6b4a2f" } },
  sofia: { shirt: "#9b59b6", shirtDark: "#7b3e9a", coatBack: "#7d3c98", pants: "#3a2a4a", skin: C.skin2, skinShade: "#c98d5f", hair: "#4a3020", hairDark: "#2c1c10", hairStyle: "long", hat: { type: "none" } },
  marcos: { shirt: "#e74c3c", shirtDark: "#b03a2e", coatBack: "#a93226", pants: "#2a2a2a", skin: C.skin3, skinShade: "#a8683f", hair: "#2b1d17", hairDark: "#1b120e", hairStyle: "short", hat: { type: "cap", color: "#c0392b" } },
  helena: { shirt: "#ffffff", shirtDark: "#d5dbdb", coatBack: "#ffffff", pants: "#4a5560", skin: C.skin1, skinShade: "#dba97e", hair: "#d9b06a", hairDark: "#a9814a", hairStyle: "ponytail", apron: "#ffffff", hat: { type: "cap", color: "#ffffff" } },
  rafael: { shirt: "#1abc9c", shirtDark: "#148f77", pants: "#4a5c46", skin: C.skin2, skinShade: "#c98d5f", hair: "#3a2b22", hairDark: "#241a14", hairStyle: "short", apron: "#a9dfbf", hat: { type: "none" } },
  clara: { shirt: "#f39c12", shirtDark: "#b9770e", pants: "#5a4a3a", skin: C.skin0, skinShade: "#e0b892", hair: "#ff9a9e", hairDark: "#c76a6a", hairStyle: "long", hat: { type: "flower", color: "#f39c12", color2: "#ffe066" } },
  edu: { shirt: "#2ecc71", shirtDark: "#239b56", pants: "#3f4a3a", skin: C.skin3, skinShade: "#a8683f", hair: "#1a1a2e", hairDark: "#0f0f1a", hairStyle: "short", hat: { type: "bandana", color: "#2ecc71" } },
  paulo: { shirt: "#fdfefe", shirtDark: "#d5dbdb", pants: "#5a5140", skin: C.skin2, skinShade: "#c98d5f", hair: "#5a3218", hairDark: "#3a1f0e", hairStyle: "short", apron: "#f9e79f", hat: { type: "cap", color: "#f9e79f" } },
  larissa: { shirt: "#27ae60", shirtDark: "#1e8449", pants: "#4a5c46", skin: C.skin1, skinShade: "#dba97e", hair: "#7a3f1b", hairDark: "#4f2a12", hairStyle: "ponytail", hat: { type: "straw", color: "#82e0aa" } },
  roberto: { shirt: "#5d6d7e", shirtDark: "#34495e", pants: "#3a4a3a", skin: C.skin2, skinShade: "#c98d5f", hair: "#bdc3c7", hairDark: "#84837a", hairStyle: "short", beard: true, hat: { type: "straw", color: "#d5d8dc" } },
  fernanda: { shirt: "#8e44ad", shirtDark: "#6c3483", coatBack: "#6c3483", pants: "#4b4256", skin: C.skin0, skinShade: "#e0b892", hair: "#3a2b22", hairDark: "#241a14", hairStyle: "bun", hat: { type: "none" } },
};

/** Desenha um personagem no mundo */
export function drawCharacter(ctx, atlas, dir, { x, y, moving, action, time = 0, alpha = 1 }) {
  const d = atlas ? (atlas[dir] ? dir : "down") : "down";
  const frames = atlas[d] || atlas.down;
  // pernas com fluidez: 8fps, mãos estáticas (sem balanço de braço)
  const f = moving ? (Math.floor(time * 9) % 4) : 0;
  const img = frames[f] || frames[0];
  const bob = moving ? Math.sin(time * 10) * 0.5 : 0;
  ctx.save();
  ctx.globalAlpha = alpha;
  // sombra no chão - dá impressão que tá pisando, não flutuando
  const cx = x + W*PIX/2, cy = y + H*PIX - 3;
  const rx = W*PIX*0.28, ry = 3.2;
  ctx.fillStyle = "rgba(20,18,12,0.28)";
  ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI*2); ctx.fill();
  ctx.drawImage(img, Math.round(x), Math.round(y + bob));
  ctx.restore();
}

/** Pose de ação com uma ferramenta específica (cacheada por spec+ferramenta). */
export function actionFrames(spec, tool, dir) {
  const t = tool || "enxada";
  return cached(`action:${JSON.stringify(spec)}:${t}:${dir}`, () => {
    const c = mkCanvas(W * PIX, H * PIX);
    const g = c.getContext("2d");
    g.imageSmoothingEnabled = false;
    drawBody(g, { ...spec, tool: t }, dir, 0, true, 0);
    drawFace(g, spec, dir, false, true);
    drawHair(g, spec, dir);
    drawHat(g, spec, dir);
    drawTool(g, t, dir);
    return c;
  });
}

export function toolFrame(spec, tool, dir) {
  const key = `toolFrame:${JSON.stringify(spec)}:${tool}:${dir}`;
  return cached(key, () => actionFrames(spec, tool, dir));
}
