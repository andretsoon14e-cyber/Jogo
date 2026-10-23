// ============================================================
//  Interiores: cômodos aconchegantes desenhados em pixel art,
//  com paredes, janelas, móveis e iluminação quente.
// ============================================================
import { mkCanvas, cached, hash, shadow } from "./pixel.js";
import { C, PIX, SEASON_ART, shade, alpha, mix } from "./palette.js";
import { inkText } from "./pixel.js";

const TS = 42; // interior mais próximo

// ---------------- móveis ----------------
function furnitureSprite(id, rot = 0) {
  return cached(`furn:${id}:${rot}`, () => {
    const spec = {
      cama: [64, 54], mesa: [52, 34], cadeira: [26, 34], estante: [40, 46],
      tapete: [64, 44], sofa: [60, 34], quadro: [28, 34],
    }[id] || [32, 32];
    const c = mkCanvas(spec[0], spec[1]);
    const g = c.getContext("2d");
    g.imageSmoothingEnabled = false;
    const W = spec[0], H = spec[1];
    if (id === "cama") {
      g.fillStyle = "#7b5a3a"; g.fillRect(2, 4, W - 4, H - 6);
      g.fillStyle = "#8a6543"; g.fillRect(3, 5, W - 6, H - 8);
      g.fillStyle = "#f4f0e6"; g.fillRect(4, 4, W - 8, 18);   // lençol
      g.fillStyle = "#dfe8f2"; g.fillRect(4, 4, W - 8, 5);
      g.fillStyle = "#f7f4ec"; g.fillRect(7, 9, 18, 12);       // travesseiro
      g.fillStyle = "#e8e2d2"; g.fillRect(7, 18, 18, 2);
      g.fillStyle = "#c96a5e"; g.fillRect(4, 24, W - 8, H - 30); // manta
      g.fillStyle = "#e08a7a"; g.fillRect(4, 24, W - 8, 3);
      for (let x = 8; x < W - 6; x += 8) g.fillRect(x, 28, 3, H - 36);
    } else if (id === "mesa") {
      g.fillStyle = "#a97a48"; g.fillRect(2, 6, W - 4, 16);
      g.fillStyle = "#c99a63"; g.fillRect(3, 7, W - 6, 12);
      g.fillStyle = "#e0b87f"; g.fillRect(3, 7, W - 6, 3);
      g.fillStyle = "#8a5a33"; g.fillRect(5, 22, 5, 11); g.fillRect(W - 10, 22, 5, 11);
      g.fillStyle = "#6f4526"; g.fillRect(5, 30, 5, 3); g.fillRect(W - 10, 30, 5, 3);
      // jarro e frutas
      g.fillStyle = "#e8eef2"; g.fillRect(W / 2 - 5, 0, 10, 8);
      g.fillStyle = "#7cb98a"; g.fillRect(W / 2 - 1, -4, 2, 6);
      g.fillStyle = "#e2695e"; g.fillRect(W / 2 - 9, 2, 4, 4);
    } else if (id === "cadeira") {
      g.fillStyle = "#8a5a33"; g.fillRect(4, 0, W - 8, 16);
      g.fillStyle = "#a97a48"; g.fillRect(5, 1, W - 10, 12);
      g.fillStyle = "#c99a63"; g.fillRect(3, 14, W - 6, 6);
      g.fillStyle = "#8a5a33"; g.fillRect(5, 20, 4, 12); g.fillRect(W - 9, 20, 4, 12);
    } else if (id === "estante") {
      g.fillStyle = "#6f4526"; g.fillRect(0, 0, W, H);
      g.fillStyle = "#8a5a33"; g.fillRect(2, 2, W - 4, H - 4);
      for (let r = 0; r < 3; r++) {
        g.fillStyle = "#5c3a20"; g.fillRect(3, 10 + r * 13, W - 6, 2);
        for (let i = 0; i < 4; i++) {
          const col = ["#c9564a", "#5b9bd5", "#e8c15c", "#7cb98a"][(i + r) % 4];
          g.fillStyle = col;
          g.fillRect(5 + i * 8, 4 + r * 13, 5, 8);
        }
      }
    } else if (id === "tapete") {
      g.fillStyle = "#b5473c"; g.fillRect(0, 0, W, H);
      g.fillStyle = "#c96a5e"; g.fillRect(3, 3, W - 6, H - 6);
      g.fillStyle = "#e8c15c"; g.fillRect(7, 7, W - 14, H - 14);
      g.fillStyle = "#b5473c"; g.fillRect(11, 11, W - 22, H - 22);
      g.fillStyle = "#fff3d6"; for (let i = 0; i < 5; i++) { g.fillRect(9 + i * 10, 9, 3, 3); g.fillRect(9 + i * 10, H - 12, 3, 3); }
    } else if (id === "sofa") {
      g.fillStyle = "#5b7f9e"; g.fillRect(0, 4, W, H - 6);
      g.fillStyle = "#6f9ec2"; g.fillRect(2, 6, W - 4, 14);
      g.fillStyle = "#87b5d6"; g.fillRect(4, 8, W / 2 - 6, 10);
      g.fillStyle = "#87b5d6"; g.fillRect(W / 2 + 2, 8, W / 2 - 6, 10);
      g.fillStyle = "#4a6a85"; g.fillRect(0, H - 8, W, 6);
      g.fillStyle = "#3f5c75"; g.fillRect(0, H - 4, 4, 4); g.fillRect(W - 4, H - 4, 4, 4);
    } else if (id === "quadro") {
      g.fillStyle = "#6f4526"; g.fillRect(0, 0, W, H - 6);
      g.fillStyle = "#e8d9b8"; g.fillRect(3, 3, W - 6, H - 12);
      g.fillStyle = "#8fc7e8"; g.fillRect(5, 5, W - 10, 12);
      g.fillStyle = "#7cb98a"; g.fillRect(5, 15, W - 10, H - 24);
      g.fillStyle = "#e8c15c"; g.fillRect(W - 12, 7, 4, 4);
    }
    return c;
  });
}

// ---------------- papel de parede ----------------
function wallTexture(room, W, H) {
  return cached(`wall:${room}:${W}x${H}`, () => {
    const c = mkCanvas(W, H);
    const g = c.getContext("2d");
    const base = { casa_player: "#d9c3a5", taverna: "#c9a06a", mercado: "#cfd9c0", banco: "#cdd6dc", igreja: "#e8e0d0", ferraria: "#a89c90", clinica: "#cfe0da", prefeitura: "#cfc3b0" }[room] || "#d5c4a8";
    g.fillStyle = base;
    g.fillRect(0, 0, W, H);
    // listras de papel
    for (let x = 0; x < W; x += 16) {
      g.fillStyle = alpha(shade(base, 0.12), 0.5);
      g.fillRect(x, 0, 8, H);
      g.fillStyle = alpha(shade(base, -0.12), 0.35);
      g.fillRect(x + 8, 0, 1, H);
    }
    // florzinhas
    for (let y = 10; y < H; y += 26) {
      for (let x = 4; x < W; x += 32) {
        g.fillStyle = alpha(shade(base, -0.25), 0.35);
        g.fillRect(x, y, 2, 2);
        g.fillRect(x + 3, y + 3, 2, 2);
      }
    }
    // rodapé de madeira
    g.fillStyle = "#7b5a3a";
    g.fillRect(0, H - 12, W, 12);
    g.fillStyle = "#8a6543";
    g.fillRect(0, H - 12, W, 3);
    g.fillStyle = "#5c4128";
    for (let x = 0; x < W; x += 24) g.fillRect(x, H - 9, 2, 9);
    return c;
  });
}

function floorTexture(room, W, H) {
  return cached(`floor:${room}:${W}x${H}`, () => {
    const c = mkCanvas(W, H);
    const g = c.getContext("2d");
    const tone = room === "ferraria" ? "#8f8880" : room === "banco" ? "#b8b2a4" : "#c9a878";
    g.fillStyle = tone;
    g.fillRect(0, 0, W, H);
    const ph = 18;
    for (let y = 0, r = 0; y < H; y += ph, r++) {
      g.fillStyle = alpha(shade(tone, 0.1), 0.6);
      g.fillRect(0, y, W, 2);
      g.fillStyle = alpha(shade(tone, -0.22), 0.5);
      g.fillRect(0, y + ph - 2, W, 2);
      const off = r % 2 ? 40 : 0;
      for (let x = -off; x < W; x += 80) {
        g.fillStyle = alpha(shade(tone, -0.25), 0.45);
        g.fillRect(x, y, 2, ph);
      }
      // nós da madeira
      for (let x = 20; x < W; x += 97) {
        g.fillStyle = alpha(shade(tone, -0.16), 0.6);
        g.fillRect((x + r * 13) % W, y + 7, 5, 2);
      }
    }
    return c;
  });
}

// ---------------- desenho principal ----------------
export function renderInterior(ctx, { W, H, time, season, game, characterFrames, specForLook, drawCharacter, feetAnchor }) {
  const roomId = game.indoors;
  const def = {
    casa_player: { name: "Sua Casa" }, taverna: { name: "Taverna" }, mercado: { name: "Mercado" },
    banco: { name: "Banco do Vale" }, igreja: { name: "Igreja" }, ferraria: { name: "Ferraria" },
    clinica: { name: "Clínica" }, prefeitura: { name: "Prefeitura" }, carpintaria: { name: "Carpintaria" },
    casa_simples: { name: "Casa Simples" }, casa_familia: { name: "Casa de Família" }, chacara: { name: "Chácara" },
  }[roomId] || { name: "Interior" };
  const roomKey = ["casa_player", "casa_simples", "casa_familia", "chacara"].includes(roomId) ? "casa_player" : roomId;

  const IW = 16, IH = 12;
  const roomW = IW * TS, roomH = IH * TS;
  // escala: o cômodo ocupa a maior parte da tela (sem ficar minúsculo no centro)
  const k = Math.min((W - 120) / roomW, (H - 150) / roomH, 2.4);
  const ox = (W - roomW * k) / 2;
  const oy = (H - roomH * k) / 2;

  // fundo externo (madeira escura + vinheta)
  const bgg = ctx.createLinearGradient(0, 0, W, H);
  bgg.addColorStop(0, "#241a12");
  bgg.addColorStop(0.5, "#2e2116");
  bgg.addColorStop(1, "#1a120c");
  ctx.fillStyle = bgg;
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = `rgba(255,220,170,${0.012 + (i % 3) * 0.006})`;
    ctx.fillRect((i * 137) % W, (i * 91) % H, 120, 3);
  }

  ctx.save();
  ctx.translate(ox, oy);
  ctx.scale(k, k);
  const sx = (x) => x * TS;
  const sy = (y) => y * TS;
  const rx = 0, ry = 0;

  // piso
  ctx.drawImage(floorTexture(roomKey, roomW, roomH), rx, ry);

  // parede norte (alvenaria + papel)
  const wallH = 2.2 * TS;
  ctx.drawImage(wallTexture(roomKey, roomW, wallH), rx, ry);
  // sombra sob a parede
  const grd = ctx.createLinearGradient(0, ry + wallH, 0, ry + wallH + 26);
  grd.addColorStop(0, "rgba(30,22,14,.35)");
  grd.addColorStop(1, "rgba(30,22,14,0)");
  ctx.fillStyle = grd;
  ctx.fillRect(rx, ry + wallH, roomW, 26);
  // teto/rodapé superior
  ctx.fillStyle = "#4a3426";
  ctx.fillRect(rx, ry - 6, roomW, 8);
  ctx.fillStyle = "#5f4331";
  ctx.fillRect(rx, ry - 6, roomW, 3);

  // paredes laterais e sul (grossas)
  ctx.fillStyle = "#3a2a1e";
  ctx.fillRect(rx - 8, ry, 8, roomH);
  ctx.fillRect(rx + roomW, ry, 8, roomH);
  ctx.fillRect(rx - 8, ry + roomH, roomW + 16, 10);

  // janelas
  const drawWindow = (wx, wy) => {
    const ww = 58, wh = 46;
    ctx.fillStyle = "#6f4526";
    ctx.fillRect(wx - 4, wy - 4, ww + 8, wh + 8);
    ctx.fillStyle = "#8a5a33";
    ctx.fillRect(wx - 2, wy - 2, ww + 4, wh + 4);
    // céu
    const day = game.world.time;
    const night = day > 19 * 60 || day < 6 * 60;
    const g2 = ctx.createLinearGradient(0, wy, 0, wy + wh);
    if (night) { g2.addColorStop(0, "#26324f"); g2.addColorStop(1, "#3f4f6e"); }
    else { g2.addColorStop(0, "#bfe8ff"); g2.addColorStop(1, "#e8f7ff"); }
    ctx.fillStyle = g2;
    ctx.fillRect(wx, wy, ww, wh);
    // colinas
    ctx.fillStyle = night ? "#2f4a3d" : SEASON_ART[season].grass[2];
    ctx.beginPath();
    ctx.moveTo(wx, wy + wh - 12);
    ctx.quadraticCurveTo(wx + ww * 0.3, wy + wh - 30, wx + ww * 0.6, wy + wh - 14);
    ctx.quadraticCurveTo(wx + ww * 0.8, wy + wh - 6, wx + ww, wy + wh - 15);
    ctx.lineTo(wx + ww, wy + wh);
    ctx.lineTo(wx, wy + wh);
    ctx.fill();
    if (night) { ctx.fillStyle = "#fff8d8"; ctx.fillRect(wx + 12, wy + 8, 2, 2); ctx.fillRect(wx + 40, wy + 14, 2, 2); }
    else { ctx.fillStyle = "rgba(255,255,255,.7)"; ctx.fillRect(wx + 10, wy + 8, 16, 4); ctx.fillRect(wx + 34, wy + 16, 12, 3); }
    // grade
    ctx.fillStyle = "#6f4526";
    ctx.fillRect(wx + ww / 2 - 2, wy, 4, wh);
    ctx.fillRect(wx, wy + wh / 2 - 2, ww, 4);
    // cortina
    ctx.fillStyle = roomKey === "taverna" ? "#a8453a" : "#b5473c";
    ctx.fillRect(wx - 6, wy - 6, 12, wh + 16);
    ctx.fillRect(wx + ww - 6, wy - 6, 12, wh + 16);
    ctx.fillStyle = alpha("#ffffff", 0.15);
    ctx.fillRect(wx - 5, wy - 5, 4, wh + 12);
    ctx.fillRect(wx + ww - 5, wy - 5, 4, wh + 12);
  };
  drawWindow(sx(2.2), ry + 12);
  drawWindow(sx(11.6), ry + 12);

  // porta (sul) / tapete de entrada
  const doorX = sx(7.2), doorY = ry + roomH - 44;
  ctx.fillStyle = "#6f4526";
  ctx.fillRect(doorX - 4, doorY - 4, 64, 48);
  ctx.fillStyle = "#8a5a33";
  ctx.fillRect(doorX, doorY, 56, 44);
  ctx.fillStyle = "#a97a48";
  ctx.fillRect(doorX + 4, doorY + 4, 48, 18);
  ctx.fillStyle = "#6f4526";
  ctx.fillRect(doorX + 28, doorY + 4, 3, 40);
  ctx.fillStyle = "#e8c15c";
  ctx.fillRect(doorX + 46, doorY + 26, 4, 4);
  // luz da porta
  const dg = ctx.createLinearGradient(0, doorY + 40, 0, doorY + 80);
  dg.addColorStop(0, "rgba(255,220,150,.28)");
  dg.addColorStop(1, "rgba(255,220,150,0)");
  ctx.fillStyle = dg;
  ctx.fillRect(doorX - 10, doorY + 40, 76, 46);

  // tapete central
  ctx.save();
  ctx.globalAlpha = 0.95;
  ctx.fillStyle = "#9c3a34";
  ctx.fillRect(sx(5.4), sy(5.2), TS * 5.4, TS * 3.2);
  ctx.fillStyle = "#b5473c";
  ctx.fillRect(sx(5.6), sy(5.4), TS * 5.0, TS * 2.8);
  ctx.fillStyle = "#d9a86c";
  ctx.fillRect(sx(5.9), sy(5.7), TS * 4.4, TS * 2.2);
  ctx.fillStyle = "#9c3a34";
  ctx.fillRect(sx(6.2), sy(6.0), TS * 3.8, TS * 1.6);
  ctx.restore();

  // ---------------- móveis fixos do cômodo ----------------
  const isHome = roomKey === "casa_player";
  if (isHome || roomKey === "taverna") {
    // balcão + fogão
    const bx = sx(5.2), by = sy(1.75);
    ctx.fillStyle = "rgba(30,22,14,.25)";
    ctx.fillRect(bx + 4, by + 58, 172, 8);
    ctx.fillStyle = "#8a5a33";
    ctx.fillRect(bx, by, 168, 56);
    ctx.fillStyle = "#a97a48";
    ctx.fillRect(bx + 2, by + 2, 164, 22);
    ctx.fillStyle = "#c99a63";
    ctx.fillRect(bx + 2, by + 2, 164, 5);
    // forno
    ctx.fillStyle = "#4a4a48";
    ctx.fillRect(bx + 10, by + 26, 60, 26);
    ctx.fillStyle = "#2f2f2d";
    ctx.fillRect(bx + 14, by + 30, 52, 18);
    // fogo animado
    const flick = 0.65 + Math.sin(time * 9) * 0.12;
    ctx.fillStyle = `rgba(255,140,60,${flick})`;
    ctx.fillRect(bx + 22, by + 36, 36, 10);
    ctx.fillStyle = `rgba(255,210,120,${flick})`;
    ctx.fillRect(bx + 30, by + 39, 20, 6);
    // panelas
    ctx.fillStyle = "#3a3a38";
    ctx.beginPath(); ctx.ellipse(bx + 96, by + 16, 13, 6, 0, 0, 6.3); ctx.fill();
    ctx.fillStyle = "#5f5e57";
    ctx.beginPath(); ctx.ellipse(bx + 96, by + 14, 11, 5, 0, 0, 6.3); ctx.fill();
    ctx.fillStyle = "#c9a06a";
    ctx.fillRect(bx + 120, by + 8, 22, 12);
    ctx.fillStyle = "#8a5a33";
    ctx.fillRect(bx + 124, by + 10, 14, 8);
    // pratos na parede
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = "#f4f1e4";
      ctx.beginPath(); ctx.arc(bx + 40 + i * 26, by - 22, 9, 0, 6.3); ctx.fill();
      ctx.fillStyle = "#c9d6dc";
      ctx.beginPath(); ctx.arc(bx + 40 + i * 26, by - 22, 5, 0, 6.3); ctx.fill();
    }
  }
  if (isHome) {
    // cama no canto
    ctx.drawImage(furnitureSprite("cama"), sx(11.6), sy(3.4));
    // estante
    ctx.drawImage(furnitureSprite("estante"), sx(1.2), sy(3.2));
    // mesinha + cadeiras
    ctx.drawImage(furnitureSprite("mesa"), sx(2.6), sy(6.4));
    ctx.drawImage(furnitureSprite("cadeira"), sx(2.2), sy(7.2));
    ctx.drawImage(furnitureSprite("cadeira"), sx(4.4), sy(7.2));
    // planta
    drawPotted(ctx, sx(13.6), sy(9.6), time, season);
    // lareira
    drawFireplace(ctx, sx(12.4), sy(1.5), time);
  } else if (roomKey === "taverna") {
    for (let i = 0; i < 2; i++) {
      ctx.drawImage(furnitureSprite("mesa"), sx(2.4 + i * 3.2), sy(5.4));
      ctx.drawImage(furnitureSprite("cadeira"), sx(2.0 + i * 3.2), sy(6.2));
      ctx.drawImage(furnitureSprite("cadeira"), sx(4.2 + i * 3.2), sy(6.2));
    }
    // balcão de bebidas
    ctx.fillStyle = "#6f4526";
    ctx.fillRect(sx(9.8), sy(4.2), 168, 52);
    ctx.fillStyle = "#8a5a33";
    ctx.fillRect(sx(9.8), sy(4.2), 168, 14);
    for (let i = 0; i < 7; i++) {
      ctx.fillStyle = ["#c9564a", "#5b9bd5", "#7cb98a", "#e8c15c"][i % 4];
      ctx.fillRect(sx(10.2 + i * 0.6), sy(4.0), 7, 9);
    }
    drawFireplace(ctx, sx(1.2), sy(1.4), time);
    ctx.drawImage(furnitureSprite("sofa"), sx(12.6), sy(8.6));
  } else if (roomKey === "mercado") {
    for (let r = 0; r < 2; r++) {
      ctx.drawImage(furnitureSprite("estante"), sx(1.4 + r * 13.2), sy(3.2));
    }
    // ilha de produtos
    ctx.fillStyle = "#8a5a33";
    ctx.fillRect(sx(5.2), sy(5.0), 190, 60);
    ctx.fillStyle = "#a97a48";
    ctx.fillRect(sx(5.2), sy(5.0), 190, 16);
    for (let i = 0; i < 8; i++) {
      const col = ["#e2695e", "#ffd166", "#7cb98a", "#b58fd1", "#e8a05c"][i % 5];
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(sx(5.6 + i * 0.62), sy(5.15), 7, 0, 6.3); ctx.fill();
    }
    ctx.fillStyle = "#6f4526";
    ctx.fillRect(sx(5.6), sy(8.0), 170, 50);
    ctx.fillStyle = "#c99a63";
    ctx.fillRect(sx(5.6), sy(7.9), 170, 8);
  } else if (roomKey === "banco") {
    // balcão do caixa
    ctx.fillStyle = "#6f5a42";
    ctx.fillRect(sx(6.0), sy(4.4), 200, 66);
    ctx.fillStyle = "#8a7250";
    ctx.fillRect(sx(6.0), sy(4.4), 200, 14);
    ctx.fillStyle = "#c9a06a";
    ctx.fillRect(sx(6.0), sy(4.4), 200, 3);
    // grades
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = "#c9a06a";
      ctx.fillRect(sx(6.6 + i * 1.2), sy(3.4), 3, 22);
    }
    // cofre
    ctx.fillStyle = "#5f6a72";
    ctx.fillRect(sx(12.6), sy(3.0), 54, 62);
    ctx.fillStyle = "#7f8f96";
    ctx.fillRect(sx(12.6), sy(3.0), 54, 10);
    ctx.fillStyle = "#e8c15c";
    ctx.beginPath(); ctx.arc(sx(13.6), sy(3.85), 7, 0, 6.3); ctx.fill();
    ctx.fillStyle = "#8a7250";
    for (let i = 0; i < 5; i++) ctx.fillRect(sx(7.0 + i * 0.5), sy(5.0), 10, 10);
    drawPotted(ctx, sx(2.0), sy(8.8), time, season);
  } else if (roomKey === "igreja") {
    // vitral
    const vx = sx(8), vy = ry + 16;
    ctx.fillStyle = "#6f5a42";
    ctx.fillRect(vx - 42, vy - 8, 84, 88);
    const cols = ["#c9564a", "#5b9bd5", "#e8c15c", "#7cb98a", "#b58fd1"];
    for (let r = 0; r < 5; r++) for (let c2 = 0; c2 < 4; c2++) {
      ctx.fillStyle = cols[(r + c2) % 5];
      ctx.fillRect(vx - 36 + c2 * 18, vy - 2 + r * 16, 16, 14);
    }
    ctx.fillStyle = "rgba(30,22,14,.45)";
    for (let i = 0; i < 4; i++) ctx.fillRect(vx - 36 + i * 18 - 1, vy - 2, 2, 80);
    // bancos
    for (let r = 0; r < 3; r++) {
      for (const bx2 of [3.4, 7.4]) {
        ctx.fillStyle = "#8a5a33";
        ctx.fillRect(sx(bx2), sy(6.2 + r * 1.3), 100, 16);
        ctx.fillStyle = "#a97a48";
        ctx.fillRect(sx(bx2), sy(6.2 + r * 1.3), 100, 5);
        ctx.fillStyle = "#6f4526";
        ctx.fillRect(sx(bx2 + 0.1), sy(7.1 + r * 1.3), 6, 10);
        ctx.fillRect(sx(bx2 + 2.7), sy(7.1 + r * 1.3), 6, 10);
      }
    }
    // altar + velas
    ctx.fillStyle = "#e8e0d0";
    ctx.fillRect(sx(10.6), sy(4.2), 78, 60);
    ctx.fillStyle = "#f4efe4";
    ctx.fillRect(sx(10.6), sy(4.2), 78, 12);
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = "#f4f1e4";
      ctx.fillRect(sx(11.0 + i * 0.7), sy(4.0), 5, 14);
      const fl = 0.6 + Math.sin(time * 7 + i) * 0.25;
      ctx.fillStyle = `rgba(255,200,100,${fl})`;
      ctx.fillRect(sx(11.05 + i * 0.7), sy(3.85), 3, 4);
    }
  } else if (roomKey === "ferraria") {
    // forja
    ctx.fillStyle = "#4a443e";
    ctx.fillRect(sx(10.8), sy(2.4), 96, 74);
    ctx.fillStyle = "#5f5852";
    ctx.fillRect(sx(10.8), sy(2.4), 96, 14);
    const fl = 0.7 + Math.sin(time * 8) * 0.15;
    ctx.fillStyle = `rgba(255,130,50,${fl})`;
    ctx.fillRect(sx(11.4), sy(3.4), 58, 30);
    ctx.fillStyle = `rgba(255,220,140,${fl})`;
    ctx.fillRect(sx(11.9), sy(3.8), 34, 18);
    // bigorna
    ctx.fillStyle = "#5f5e57";
    ctx.fillRect(sx(3.6), sy(6.0), 56, 18);
    ctx.fillStyle = "#8c8a80";
    ctx.fillRect(sx(3.6), sy(6.0), 56, 6);
    ctx.fillStyle = "#4a4842";
    ctx.fillRect(sx(4.4), sy(7.4), 38, 20);
    // barril
    ctx.fillStyle = "#8a5a33";
    ctx.fillRect(sx(12.4), sy(8.2), 34, 40);
    ctx.fillStyle = "#6f4526";
    ctx.fillRect(sx(12.4), sy(8.2), 34, 6);
    ctx.fillRect(sx(12.4), sy(9.9), 34, 5);
  } else if (roomKey === "clinica") {
    ctx.drawImage(furnitureSprite("cama"), sx(10.8), sy(4.2));
    ctx.fillStyle = "#e8f1ec";
    ctx.fillRect(sx(2.6), sy(4.0), 96, 56);
    ctx.fillStyle = "#cfdcd6";
    ctx.fillRect(sx(2.6), sy(4.0), 96, 10);
    ctx.fillStyle = "#c9564a";
    ctx.fillRect(sx(3.2), sy(5.0), 8, 3); ctx.fillRect(sx(4.5), sy(3.7), 3, 8);
    drawPotted(ctx, sx(13.0), sy(8.8), time, season);
  } else if (roomKey === "prefeitura") {
    ctx.fillStyle = "#8a7250";
    ctx.fillRect(sx(5.0), sy(4.4), 190, 62);
    ctx.fillStyle = "#a98a62";
    ctx.fillRect(sx(5.0), sy(4.4), 190, 14);
    ctx.drawImage(furnitureSprite("estante"), sx(12.4), sy(3.4));
    ctx.drawImage(furnitureSprite("estante"), sx(13.6), sy(3.4));
    ctx.fillStyle = "#c9564a";
    ctx.fillRect(sx(2.4), sy(3.2), 26, 18);
    ctx.fillStyle = "#fff3d6";
    ctx.fillRect(sx(2.4), sy(3.6), 26, 5);
    drawPotted(ctx, sx(2.2), sy(8.8), time, season);
  } else if (roomKey === "carpintaria") {
    ctx.fillStyle = "#8a5a33";
    ctx.fillRect(sx(2.6), sy(4.6), 130, 44);
    ctx.fillStyle = "#a97a48";
    ctx.fillRect(sx(2.6), sy(4.6), 130, 10);
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = i % 2 ? "#c99a63" : "#b8844c";
      ctx.fillRect(sx(3.0 + i * 0.9), sy(5.6), 24, 8);
    }
    ctx.drawImage(furnitureSprite("estante"), sx(12.8), sy(3.4));
    ctx.fillStyle = "#6f4526";
    ctx.fillRect(sx(10.4), sy(7.0), 80, 44);
  }

  // ---------------- móveis do jogador ----------------
  for (const f of game.furniture || []) {
    const spr = furnitureSprite(f.id);
    const fx = sx(f.x) - spr.width / 2 + 16;
    const fy = sy(f.y) - spr.height + 20;
    if (f.id === "tapete") {
      ctx.globalAlpha = 0.9;
      ctx.drawImage(spr, fx, fy + 8);
      ctx.globalAlpha = 1;
      continue;
    }
    ctx.fillStyle = "rgba(30,22,14,.2)";
    ctx.beginPath(); ctx.ellipse(fx + spr.width / 2, fy + spr.height - 2, spr.width * 0.42, 5, 0, 0, 6.3); ctx.fill();
    ctx.drawImage(spr, fx, fy);
    if (f.id === "quadro") {
      // já desenhado alto; sem etiqueta
    } else {
      inkText(ctx, f.name || "", fx + spr.width / 2, fy + spr.height + 11, { size: 9, fill: "#fff8e7", stroke: "rgba(30,20,12,.8)", lw: 2.5 });
    }
  }

  // ---------------- criança ----------------
  if (game.social?.family) {
    const kid = game.social.family;
    const kx = sx(8.6), ky = sy(7.6);
    const stage = kid.stage || "baby";
    ctx.fillStyle = "rgba(30,22,14,.18)";
    ctx.beginPath(); ctx.ellipse(kx, ky + 20, 12, 5, 0, 0, 6.3); ctx.fill();
    if (stage === "baby") {
      // berço
      ctx.fillStyle = "#a97a48";
      ctx.fillRect(kx - 26, ky - 6, 52, 26);
      ctx.fillStyle = "#e8d9b8";
      ctx.fillRect(kx - 22, ky - 2, 44, 18);
      ctx.fillStyle = "#f7f1e2";
      ctx.beginPath(); ctx.arc(kx - 4, ky + 8, 7, 0, 6.3); ctx.fill();
      ctx.fillStyle = "#ffd9ad";
      ctx.beginPath(); ctx.arc(kx - 4, ky + 4, 6, 0, 6.3); ctx.fill();
      ctx.fillStyle = "#3a2a20";
      ctx.fillRect(kx - 7, ky + 3, 1, 2); ctx.fillRect(kx - 2, ky + 3, 1, 2);
      ctx.fillStyle = "#ffb3c7";
      ctx.fillRect(kx + 10, ky + 2, 8, 6);
    } else {
      // criança de pé
      const bob = Math.sin(time * 2) * 1;
      ctx.fillStyle = "#7cb98a";
      ctx.fillRect(kx - 7, ky + 2 + bob, 14, 14);
      ctx.fillStyle = "#ffd9ad";
      ctx.beginPath(); ctx.arc(kx, ky - 4 + bob, 8, 0, 6.3); ctx.fill();
      ctx.fillStyle = "#5a3a22";
      ctx.fillRect(kx - 8, ky - 12 + bob, 16, 5);
      ctx.fillStyle = "#3a2a20";
      ctx.fillRect(kx - 3, ky - 5 + bob, 1, 2); ctx.fillRect(kx + 2, ky - 5 + bob, 1, 2);
      ctx.fillStyle = "#44506b";
      ctx.fillRect(kx - 6, ky + 16 + bob, 4, 7); ctx.fillRect(kx + 2, ky + 16 + bob, 4, 7);
    }
    inkText(ctx, kid.kidName || "Filho(a)", kx, ky - 20, { size: 9.5, fill: "#fff8e7", stroke: "rgba(30,20,12,.8)", lw: 2.5 });
  }

  // ---------------- jogadores ----------------
  const drawP = (p, isSelf) => {
    const px = sx(isSelf ? game.x : (p.renderX ?? p.x));
    const py = sy(isSelf ? game.y : (p.renderY ?? p.y));
    const look = isSelf ? game.look : p.look;
    drawCharacter(ctx, characterFrames(specForLook(look, p.skin || "s1")), p.dir || "down", {
      ...feetAnchor(px, py + 51), moving: isSelf ? game.moving : !!p.moving, time: time + (p.id ? p.id.length : 0),
    });
    inkText(ctx, p.username || "", px, py + 51 - 99 - 4, { size: 11, fill: isSelf ? "#ffe9a8" : "#eafff0", stroke: "rgba(28,20,12,.85)", lw: 3.5 });
  };
  for (const p of game.players.values()) {
    if (p.id === game.selfId) continue;
    if (p.indoors !== game.indoors) continue;
    drawP(p, false);
  }
  drawP({ ...game, username: game.username, skin: game.skin, dir: game.dir, id: game.selfId }, true);

  ctx.restore();

  // ---------------- iluminação quente ----------------
  const lampX = ox + sx(8) * k, lampY = oy + sy(4.4) * k;
  const lg = ctx.createRadialGradient(lampX, lampY, 10, lampX, lampY, 340);
  lg.addColorStop(0, "rgba(255,214,140,.20)");
  lg.addColorStop(1, "rgba(255,200,120,0)");
  ctx.fillStyle = lg;
  ctx.fillRect(0, 0, W, H);
  // vinheta de interior
  const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.32, W / 2, H / 2, Math.max(W, H) * 0.7);
  vg.addColorStop(0, "rgba(30,20,12,0)");
  vg.addColorStop(1, "rgba(25,16,10,.42)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);

  // poeira na luz
  for (let i = 0; i < 16; i++) {
    const x = (i * 173 + time * 8) % W;
    const y = (i * 97 + Math.sin(time * 0.5 + i) * 40) % H;
    ctx.fillStyle = "rgba(255,235,190,.14)";
    ctx.fillRect(x, y, 2, 2);
  }

  // ---------------- etiqueta do cômodo e saída ----------------
  ctx.save();
  const label = def.name;
  ctx.font = "800 12px Trebuchet MS, Segoe UI, sans-serif";
  const tw = ctx.measureText(label).width + 30;
  ctx.fillStyle = "rgba(40,28,18,.78)";
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(W / 2 - tw / 2, 14, tw, 26, 8) : ctx.rect(W / 2 - tw / 2, 14, tw, 26);
  ctx.fill();
  ctx.fillStyle = "#f4e3c2";
  ctx.textAlign = "center";
  ctx.fillText(label, W / 2, 32);
  ctx.restore();

  const ex = ox + sx(8) * k, ey = oy + sy(IH - 0.9) * k;
  const pulse = 0.7 + Math.sin(time * 3) * 0.2;
  ctx.fillStyle = `rgba(255,240,200,${pulse})`;
  ctx.font = "800 11px Trebuchet MS, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("▼  SAIR (F)", ex, ey + 26);
}

function drawPotted(ctx, x, y, time, season) {
  ctx.fillStyle = "rgba(30,22,14,.18)";
  ctx.beginPath(); ctx.ellipse(x + 14, y + 34, 14, 5, 0, 0, 6.3); ctx.fill();
  ctx.fillStyle = "#b5623f";
  ctx.fillRect(x, y + 16, 28, 20);
  ctx.fillStyle = "#d1784f";
  ctx.fillRect(x, y + 16, 28, 5);
  ctx.fillStyle = SEASON_ART[season].leaf[3];
  ctx.beginPath(); ctx.ellipse(x + 14, y + 8, 16, 12, 0, 0, 6.3); ctx.fill();
  ctx.fillStyle = SEASON_ART[season].leaf[2];
  ctx.beginPath(); ctx.ellipse(x + 11, y + 4, 11, 9, 0, 0, 6.3); ctx.fill();
  ctx.fillStyle = SEASON_ART[season].leaf[1];
  ctx.beginPath(); ctx.ellipse(x + 8, y, 6, 5, 0, 0, 6.3); ctx.fill();
}

function drawFireplace(ctx, x, y, time) {
  ctx.fillStyle = "#8c8a80";
  ctx.fillRect(x, y, 96, 72);
  ctx.fillStyle = "#a8a69a";
  for (let i = 0; i < 6; i++) ctx.fillRect(x, y + i * 12, 96, 2);
  ctx.fillStyle = "#3a2a20";
  ctx.fillRect(x + 12, y + 20, 72, 46);
  const fl = 0.6 + Math.sin(time * 7) * 0.2;
  ctx.fillStyle = `rgba(255,140,60,${fl})`;
  ctx.fillRect(x + 22, y + 44, 52, 20);
  ctx.fillStyle = `rgba(255,215,130,${fl})`;
  ctx.fillRect(x + 32, y + 50, 32, 14);
  ctx.fillStyle = "#fff3c4";
  ctx.fillRect(x + 42, y + 56, 12, 8);
  ctx.fillStyle = "#8a5a33";
  ctx.fillRect(x, y - 8, 96, 10);
  ctx.fillStyle = "#c99a63";
  ctx.fillRect(x, y - 8, 96, 3);
  // brilho
  const g2 = ctx.createRadialGradient(x + 48, y + 54, 4, x + 48, y + 54, 120);
  g2.addColorStop(0, `rgba(255,170,80,${0.28 * fl})`);
  g2.addColorStop(1, "rgba(255,150,60,0)");
  ctx.fillStyle = g2;
  ctx.fillRect(x - 60, y - 40, 216, 216);
}
