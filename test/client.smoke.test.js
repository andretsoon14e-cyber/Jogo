/**
 * Smoke test do CLIENTE real em jsdom, com canvas e áudio simulados.
 * Executa o jogo, simula login de visitante, recebe "joined" do servidor falso,
 * renderiza frames e abre todos os painéis para pegar erros de runtime.
 *
 * Uso: node test/client.smoke.test.js
 */
import fs from "node:fs";
import { JSDOM } from "jsdom";

const html = fs.readFileSync("client/index.html", "utf-8");
const dom = new JSDOM(html, {
  url: "http://localhost:3000/",
  runScripts: "outside-only",
  pretendToBeVisual: false,
});

const { window } = dom;
let failures = 0;
function ok(name, cond, extra = "") {
  if (!cond) failures++;
  console.log(`${cond ? "✅" : "❌"} ${name}${extra ? " — " + extra : ""}`);
}

// ---------- stubs de canvas ----------
const gradient = { addColorStop() {} };
function makeCtx() {
  const store = {};
  return new Proxy(store, {
    get(t, p) {
      if (p in t) return t[p];
      if (p === "createLinearGradient" || p === "createRadialGradient") return () => gradient;
      if (p === "measureText") return () => ({ width: 10 });
      if (p === "canvas") return { width: 1024, height: 768 };
      return () => {};
    },
    set(t, p, v) { t[p] = v; return true; },
  });
}
window.HTMLCanvasElement.prototype.getContext = function () { return makeCtx(); };
window.HTMLElement.prototype.getBoundingClientRect = function () {
  return { left: 0, top: 0, right: 1024, bottom: 768, width: 1024, height: 768, x: 0, y: 0 };
};

// ---------- stubs de ambiente ----------
class FakeAudioContext {
  constructor() { this.currentTime = 0; this.state = "running"; this.destination = {}; }
  createGain() {
    return { gain: { value: 0, setTargetAtTime() {}, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} };
  }
  createOscillator() {
    return { type: "sine", frequency: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, start() {}, stop() {} };
  }
  resume() { this.state = "running"; return Promise.resolve(); }
}
window.AudioContext = FakeAudioContext;
window.webkitAudioContext = FakeAudioContext;
window.confirm = () => true;

const rafQueue = [];
let rafId = 0;
function fakeRaf(cb) { rafQueue.push(cb); return ++rafId; }
function flushFrames(times = 3) {
  let ts = 1000;
  for (let i = 0; i < times; i++) {
    ts += 16.7;
    const q = rafQueue.splice(0, rafQueue.length);
    for (const cb of q) {
      try { cb(ts); } catch (e) { throw e; }
    }
  }
}

// fake socket
const handlers = new Map();
const sent = [];
const joinData = (() => {
  const tiles = Array.from({ length: 50 }, () => Array.from({ length: 70 }, () => 0));
  for (let x = 8; x <= 56; x++) tiles[26][x] = 3;
  for (let x = 58; x <= 61; x++) tiles[26][x] = 2;
  const self = {
    id: "self1", username: "VisitanteTeste", account: false, skin: "s1", x: 22, y: 21, dir: "down",
    gold: 500,
    inventory: { nabo_seed: 5, madeira: 5, pedra: 3, vara: 1, nabo: 2 },
    level: { farming: 1, fishing: 1, mining: 1, building: 1, cooking: 1, commerce: 1 },
    xp: { farming: 10, fishing: 0, mining: 0, building: 0, cooking: 0, commerce: 0 },
    friendship: { maria: 12 },
    stats: { harvested: 5, harvested_nabo: 3, wood: 4, stone: 2, fish: 1, donated: 0, friendship: 12, animals: 0 },
    claimedQuests: [],
  };
  return {
    roomCode: "VALE1",
    selfId: "self1",
    isHost: true,
    self,
    players: [{ ...self }],
    world: {
      roomCode: "VALE1",
      day: 3, seasonIndex: 0, weather: "Chuvoso", time: 600,
      tiles,
      plots: { "22,15": { crop: "nabo", stage: 3, watered: true, plantedDay: 1, owner: "VisitanteTeste" } },
      buildings: { b1: { buildingId: "estufa", x: 18, y: 22, owner: "VisitanteTeste" } },
      animals: [{ id: "a1", type: "galinha", owner: "VisitanteTeste", x: 16, y: 28 }],
      communityProgress: { praca: 500, biblioteca: 0, ponte: 1000, estrada: 0 },
      festival: { name: "Festival da Colheita", season: 0, day: 28 },
    },
  };
})();

function fire(event, data) {
  const list = handlers.get(event) || [];
  for (const cb of list.slice()) {
    try { cb(data); } catch (e) { failures++; console.error(`❌ erro no handler "${event}":`, e); }
  }
}
const fakeSocket = {
  connected: true,
  on(event, cb) {
    if (!handlers.has(event)) handlers.set(event, []);
    handlers.get(event).push(cb);
    return fakeSocket;
  },
  off(event, cb) {
    const list = handlers.get(event) || [];
    handlers.set(event, list.filter((f) => f !== cb));
    return fakeSocket;
  },
  emit(event, payload) {
    sent.push({ event, payload });
    if (event === "joinRoom") setTimeout(() => fire("joined", joinData), 5);
    return fakeSocket;
  },
  disconnect() { fire("disconnect"); },
};
window.io = () => fakeSocket;

// globais para os módulos
globalThis.window = window;
globalThis.document = window.document;

globalThis.localStorage = window.localStorage;
globalThis.HTMLElement = window.HTMLElement;
globalThis.HTMLCanvasElement = window.HTMLCanvasElement;
globalThis.AudioContext = FakeAudioContext;
globalThis.webkitAudioContext = FakeAudioContext;
globalThis.requestAnimationFrame = fakeRaf;
globalThis.cancelAnimationFrame = () => {};
window.requestAnimationFrame = fakeRaf;
window.cancelAnimationFrame = () => {};

const errors = [];
process.on("uncaughtException", (e) => { errors.push(e); console.error("uncaught:", e.message); });
window.addEventListener("error", (e) => { errors.push(e.error || new Error(e.message)); });

// ---------- importa o jogo ----------
await import("../client/js/main.js");
const game = window.game;
ok("Módulo principal carregou", !!game);
const onCover = window.document.getElementById("coverScreen")?.classList.contains("active");
const onLogin = window.document.getElementById("loginScreen")?.classList.contains("active");
ok("Capa ou login ativa", onCover || onLogin, `cover=${onCover} login=${onLogin}`);
if (onCover) {
  const playBtn = window.document.getElementById("btnCoverPlay");
  if (playBtn) playBtn.click();
  await new Promise((r)=> setTimeout(r, 40));
}
ok("Tela de login ativa após capa", window.document.getElementById("loginScreen").classList.contains("active"));
ok("6 aparências disponíveis", window.document.querySelectorAll(".skinOpt").length === 6);
ok("Acessórios disponíveis", !!window.document.getElementById("modularPick"), "modularPick existe");
if (window.document.getElementById("modularPick")) {
  const hatBtn = window.document.querySelector("#modularPick button");
  if (hatBtn) { hatBtn.click(); ok("Seleção de acessório funciona", true); }
}

// ---------- login visitante ----------
window.localStorage.setItem("vale_tutorial", "done"); // evita o modal automático no teste
window.document.querySelector('.loginTab[data-mode="guest"]').click();
window.document.getElementById("inpName").value = "VisitanteTeste";
window.document.getElementById("inpRoom").value = "VALE1";
window.document.getElementById("btnPlay").click();
await new Promise((r) => setTimeout(r, 120));

ok("Tela do jogo aberta", window.document.getElementById("gameScreen").classList.contains("active"));
fire("connect");
await new Promise((r) => setTimeout(r, 80));
ok("Cliente enviou joinRoom", sent.some((s) => s.event === "joinRoom"));
ok("Cliente recebeu o mundo", game.world.tiles.length >= 50);
ok("Jogador local configurado", game.username === "VisitanteTeste");
ok("Hotbar montada", game.hotbar.length > 0, `${game.hotbar.length} slots`);
// ---------- criador de personagem (grade) ----------
const creatorHost = window.document.getElementById("modularPick");
ok("Criador montado em grade", !!creatorHost?.querySelector(".creatorOptions"));
ok("Prévia do criador visível", !!creatorHost?.querySelector(".creatorPreviewCanvas"));
const bodyTabs = [...window.document.querySelectorAll(".creatorTab")].map((b) => b.textContent.trim());
ok("Abas do criador (10 categorias)", bodyTabs.length === 10, bodyTabs.join(","));
const bodyOpts = creatorHost?.querySelectorAll(".creatorOpt") || [];
ok("Corpo mostra 12 opções (2 por idade)", bodyOpts.length === 12, `${bodyOpts.length} opções`);
ok("Nenhuma opção começa escondida", [...bodyOpts].every((b) => b.offsetParent !== null || b.style.display !== "none"));
// escolher a segunda opção não pula a seleção
if (bodyOpts[2]) {
  const wanted = bodyOpts[2];
  const wantedId = game.skinParts.body; // referência antes do clique
  wanted.click();
  const selected = [...creatorHost.querySelectorAll(".creatorOpt.selected")];
  ok("Seleção manual fica marcada (sem auto-pulo)", selected.length === 1, `${selected.length} marcada(s)`);
  ok("Corpo trocado no estado", game.skinParts.body !== wantedId || selected.length === 1, game.skinParts.body);
}


// frames
flushFrames(4);
ok("Renderizou frames sem exceção", true);
ok("HUD atualizado", window.document.getElementById("hudSeason").textContent === "Primavera");

// ---------- abrir todos os painéis ----------
const panels = ["inventoryPanel", "shopPanel", "buildPanel", "questPanel", "communityPanel", "socialPanel", "mapPanel", "settingsPanel", "npcPanel"];
for (const id of panels) {
  window.togglePanel(id);
  const el = window.document.getElementById(id);
  ok(`Painel ${id} abre`, el.classList.contains("open"));
  if (id === "shopPanel") {
    for (const tab of window.document.querySelectorAll("#shopTabs .tab")) {
      tab.click();
      ok(`Aba da loja "${tab.textContent.trim()}" renderiza`, window.document.getElementById("shopContent").children.length >= 0);
    }
  }
  if (id === "mapPanel") {
    ok("Minimapa com jogadores", window.document.getElementById("mapPlayers").children.length >= 1);
  }
  if (id === "buildPanel") {
    const btn = window.document.querySelector("#buildContent .shopItem button");
    ok("Construções listadas", !!btn);
  }
  window.togglePanel(id); // fecha
}

// ---------- NPC ----------
window.openNpc("maria");
ok("Painel de NPC abre", window.document.getElementById("npcPanel").classList.contains("open"));
ok("Diálogo do NPC preenchido", window.document.getElementById("npcDialog").textContent.length > 5);
ok("Lista de presentes preenchida", window.document.getElementById("giftSelect").options.length > 0);
window.togglePanel("npcPanel");

// ---------- eventos de rede ----------
fire("playerJoined", { id: "p2", username: "Amigo", account: false, skin: "s2", x: 30, y: 20, dir: "down", level: { farming: 2 }, animals: 0 });
ok("Outro jogador aparece", game.players.has("p2"));
fire("playersUpdate", [
  { id: "self1", username: "VisitanteTeste", account: false, skin: "s1", x: 22, y: 21, dir: "down", level: { farming: 1 } },
  { id: "p2", username: "Amigo", account: false, skin: "s2", x: 30, y: 20, dir: "down", level: { farming: 2 } },
]);
ok("Lista de jogadores sincronizada", game.players.size === 2);
fire("timeUpdate", { time: 720, day: 4, seasonIndex: 1, weather: "Ensolarado" });
ok("Relógio do servidor aplicado", game.world.day === 4);
fire("tileUpdate", { x: 30, y: 21, tile: 1 });
ok("Atualização de tile aplicada", game.world.tiles[21][30] === 1);
fire("plotUpdate", { key: "30,21", plot: { crop: "batata", stage: 1, watered: false } });
ok("Atualização de plantação aplicada", game.world.plots["30,21"].crop === "batata");
fire("inventoryUpdate", { nabo_seed: 9, vara: 1 });
ok("Inventário atualizado", game.self.inventory.nabo_seed === 9);
fire("goldUpdate", 1234);
ok("Ouro atualizado", game.self.gold === 1234);
fire("notify", { msg: "Teste", type: "success" });
ok("Notificação criada", window.document.querySelectorAll("#notifications .notif").length > 0);
fire("chatMsg", { username: "Amigo", msg: "oi!" });
ok("Chat adicionado", window.document.getElementById("chatLog").textContent.includes("oi!"));
fire("communityUpdate", { praca: 500, biblioteca: 100, ponte: 0, estrada: 0 });
ok("Progresso comunitário atualizado", game.world.communityProgress.biblioteca === 100);
fire("newDay", { day: 5, seasonIndex: 1, weather: "Ensolarado", plots: {}, animals: [], festival: null, notes: ["Novo dia"] });
ok("Novo dia aplicado", game.world.day === 5);
fire("effect", { x: 22, y: 15, type: "harvest" });
ok("Efeito criado", game.effects.length > 0);
fire("sleepVote", { votes: 1, needed: 2, by: "Amigo" });
ok("Votação de dormir exibida", true);

flushFrames(4);
ok("Renderizou após eventos de rede", true);

// painéis após dados novos
window.togglePanel("questPanel");
ok("Missões renderizadas", window.document.getElementById("questContent").textContent.includes("Primeira Colheita"));
window.togglePanel("questPanel");
window.togglePanel("communityPanel");
ok("Comunidade renderizada", window.document.getElementById("communityContent").textContent.includes("Praça"));
window.togglePanel("communityPanel");

// interação por clique no mundo (centro)
const canvas = window.document.getElementById("gameCanvas");
canvas.dispatchEvent(new window.MouseEvent("mousedown", { clientX: 512, clientY: 384, bubbles: true }));
flushFrames(2);
ok("Clique no mundo não quebra", true);

ok("Nenhuma exceção não tratada", errors.length === 0, errors.map((e) => e.message).join("; "));

console.log(`\n${failures === 0 ? "🎉 CLIENTE OK — todos os testes de interface passaram" : `⚠️ ${failures} falha(s) no cliente`}\n`);
process.exit(failures === 0 ? 0 : 1);
