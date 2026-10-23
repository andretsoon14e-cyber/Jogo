/**
 * Teste real de multiplayer com DOIS clientes Socket.IO simultâneos
 * + contas, persistência, construção, missões e recuperação de mundo.
 *
 * Uso: node test/multiplayer.test.js [url]
 * Requer o servidor rodando: npm start
 */
import { io } from "socket.io-client";

const URL = process.argv[2] || "http://localhost:3000";
const ROOM = "T" + Math.random().toString(36).slice(2, 5).toUpperCase();
const ACC = "teste" + Math.random().toString(36).slice(2, 7);
const PASS = "senha123";
let failed = 0;
let total = 0;

function ok(name, cond, extra = "") {
  total++;
  if (!cond) failed++;
  console.log(`${cond ? "✅" : "❌"} ${name}${extra ? " — " + extra : ""}`);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function once(socket, event, ms = 5000) {
  return new Promise((resolve) => {
    const t = setTimeout(() => resolve(null), ms);
    socket.once(event, (data) => { clearTimeout(t); resolve(data); });
  });
}

/** Espera o primeiro evento que satisfaça o predicado (ignora eventos antigos). */
function waitFor(socket, event, predicate = () => true, ms = 5000) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => { socket.off(event, handler); resolve(null); }, ms);
    function handler(data) {
      if (!predicate(data)) return;
      clearTimeout(timer);
      socket.off(event, handler);
      resolve(data);
    }
    socket.on(event, handler);
  });
}

function connect(name, { token = null, x = 22, y = 21 } = {}) {
  return new Promise((resolve, reject) => {
    const s = io(URL, { transports: ["websocket"], reconnection: false });
    const timer = setTimeout(() => reject(new Error("timeout ao entrar: " + name)), 8000);
    s.on("connect", () => {
      s.emit("joinRoom", { roomCode: ROOM, username: name, token, skin: "s2", x, y });
    });
    s.on("joined", (data) => {
      clearTimeout(timer);
      resolve({ socket: s, data });
    });
    s.on("joinError", (d) => { clearTimeout(timer); reject(new Error(d.error)); });
    s.on("connect_error", (e) => { clearTimeout(timer); reject(e); });
  });
}

async function main() {
  console.log(`\n🌾 TESTE COMPLETO — sala ${ROOM}, conta ${ACC}\n`);

  const health = await fetch(URL + "/health").then((r) => r.json()).catch(() => null);
  ok("Servidor responde /health", health?.status === "ok");

  // ---------- CONTAS ----------
  const reg = await fetch(URL + "/api/register", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: ACC, password: PASS }),
  }).then((r) => r.json());
  ok("Criar conta gratuita", !!reg.token, reg.error || ACC);

  const badLogin = await fetch(URL + "/api/login", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: ACC, password: "errada" }),
  });
  ok("Login com senha errada é rejeitado", badLogin.status === 401);

  const login = await fetch(URL + "/api/login", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: ACC, password: PASS }),
  }).then((r) => r.json());
  ok("Login com senha correta", !!login.token);

  const created = await fetch(URL + "/api/create-room", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: ROOM }),
  }).then((r) => r.json());
  ok("Criar sala", created.code === ROOM, created.error || created.code);

  // ---------- ENTRADA ----------
  const A = await connect("Alice");
  ok("Jogador visitante entra", A.data.roomCode === ROOM);
  ok("Mapa recebido pelo cliente", A.data.world.tiles.length >= 50, `${A.data.world.tiles.length} linhas`);
  ok("A é anfitrião", A.data.isHost === true);
  ok("Inventário inicial no self", A.data.self.inventory.nabo_seed === 5);

  const bJoined = once(A.socket, "playerJoined");
  const aUpd = waitFor(A.socket, "playersUpdate", (list) => list.length === 2);
  const B = await connect("Beto");
  const joinedNotice = await bJoined;
  const au = await aUpd;
  ok("B entra na mesma sala", B.data.roomCode === ROOM);
  ok("A vê B chegar em tempo real", joinedNotice?.username === "Beto");
  ok("Lista de jogadores sincronizada", au?.length === 2, `${au?.length || 0} jogadores`);
  ok("Estado privado não vaza na lista pública", au && !("inventory" in au[0]));

  // ---------- MOVIMENTO / CHAT ----------
  const moved = once(B.socket, "playerMoved");
  A.socket.emit("move", { x: 23.5, y: 16.25, dir: "down" });
  const mv = await moved;
  ok("Movimento em tempo real", mv?.x === 23.5 && mv?.y === 16.25, `${mv?.x},${mv?.y}`);

  const chat = once(B.socket, "chatMsg");
  A.socket.emit("chat", { msg: "Olá, Beto!" });
  const cm = await chat;
  ok("Chat sincronizado", cm?.msg === "Olá, Beto!");

  // ---------- AGRICULTURA ----------
  const tileA = once(A.socket, "tileUpdate");
  const tileB = once(B.socket, "tileUpdate");
  A.socket.emit("interact", { type: "till", data: { x: 22, y: 15 } });
  const [ta, tb] = await Promise.all([tileA, tileB]);
  ok("Arar terra: A recebe update", ta?.tile === 1);
  ok("Arar terra: B vê a mesma terra (mundo compartilhado)", tb?.tile === 1);

  const plotB = waitFor(B.socket, "plotUpdate", (d) => d?.plot?.crop === "nabo");
  const invA = once(A.socket, "inventoryUpdate");
  A.socket.emit("interact", { type: "plant", data: { x: 22, y: 15, seed: "nabo_seed" } });
  const [pb, ia] = await Promise.all([plotB, invA]);
  ok("Plantar sincroniza para B", pb?.plot?.crop === "nabo");
  ok("Semente consumida do inventário", ia && ia.nabo_seed === 4, `nabo_seed=${ia?.nabo_seed}`);

  // votação de dormir: com 2 jogadores é preciso maioria (2 votos)
  const onlyOne = once(A.socket, "newDay", 900);
  A.socket.emit("sleep");
  const earlyDay = await onlyOne;
  ok("Um voto sozinho não força a noite (2 jogadores)", earlyDay === null);

  // rega + 3 noites
  for (let d = 0; d < 3; d++) {
    const watered = waitFor(A.socket, "plotUpdate", (p) => p?.plot?.watered === true);
    A.socket.emit("interact", { type: "water", data: { x: 22, y: 15 } });
    const wp = await watered;
    if (d === 0) ok("Regar sincroniza estado", wp?.plot?.watered === true);
    const dayEvt = once(B.socket, "newDay");
    A.socket.emit("sleep");
    B.socket.emit("sleep");
    const nd = await dayEvt;
    if (d === 0) ok("Maioria dormindo avança o dia para todos", nd?.day === 2, `dia ${nd?.day}`);
    await sleep(150);
  }

  const worldAfter = await fetch(URL + "/api/world/" + ROOM).then((r) => r.json());
  const plot = worldAfter.plots["22,15"];
  ok("Planta cresce 3 estágios (regada todo dia)", plot?.crop === "nabo" && plot.stage >= 3, `estágio ${plot?.stage}`);

  B.socket.emit("move", { x: 23.2, y: 16.4, dir: "up" });
  await sleep(120);
  const harvestFx = waitFor(A.socket, "effect", (e) => e.type === "harvest");
  const invB = waitFor(B.socket, "inventoryUpdate", (inv) => (inv?.nabo || 0) >= 1);
  B.socket.emit("interact", { type: "harvest", data: { x: 22, y: 15 } });
  const [fx, inv] = await Promise.all([harvestFx, invB]);
  ok("Colheita gera efeito compartilhado", fx?.type === "harvest");
  ok("Item vai para o inventário de quem colheu", (inv?.nabo || 0) >= 1, `nabo x${inv?.nabo}`);

  // ---------- ECONOMIA ----------
  const goldB = waitFor(B.socket, "goldUpdate", (g) => g > 500);
  B.socket.emit("interact", { type: "sell", data: { item: "nabo", qty: 1 } });
  const gb = await goldB;
  ok("Venda rende ouros", gb > 500, `${gb} ouros`);

  const beforeBuy = once(A.socket, "goldUpdate");
  const invVar = once(A.socket, "inventoryUpdate");
  A.socket.emit("interact", { type: "buy", data: { item: "vara", qty: 1 } });
  const [bg, iv] = await Promise.all([beforeBuy, invVar]);
  ok("Compra desconta ouros", bg === 400, `${bg} ouros`);
  ok("Vara de pesca entra no inventário", !!iv?.vara);

  // ---------- CONSTRUÇÃO ----------
  const buildB = once(B.socket, "buildingsUpdate");
  A.socket.emit("interact", { type: "build", data: { buildingId: "cerca", x: 21, y: 22 } });
  const bb = await buildB;
  ok("Construção é compartilhada", bb && Object.values(bb).some((b) => b.buildingId === "cerca"));
  const buildFail = once(A.socket, "notify");
  A.socket.emit("interact", { type: "build", data: { buildingId: "cerca", x: 16, y: 16 } });
  const bf = await buildFail;
  ok("Construção em local ocupado é rejeitada", bf?.type === "error");

  // ---------- COMUNIDADE / MISSÕES ----------
  const commB = once(B.socket, "communityUpdate");
  B.socket.emit("interact", { type: "donate", data: { project: "praca", amount: 500 } });
  const cp = await commB;
  ok("Doação comunitária sincronizada", cp?.praca === 500);

  const statsQuest = once(B.socket, "statsUpdate");
  B.socket.emit("interact", { type: "claimQuest", data: { questId: "q5" } });
  const sq = await statsQuest;
  ok("Missão comunitária resgatada e registrada", sq?.claimedQuests?.includes("q5"), JSON.stringify(sq?.claimedQuests));

  // ---------- PERSISTÊNCIA DE CONTA ----------
  const accJoin = await connect(ACC, { token: reg.token });
  ok("Conta entra autenticada", accJoin.data.self.username === ACC, accJoin.data.self.username);
  ok("Conta começa com 500 ouros", accJoin.data.self.gold === 500, String(accJoin.data.self.gold));
  const buyEvt = once(accJoin.socket, "goldUpdate");
  const invAcc = once(accJoin.socket, "inventoryUpdate");
  accJoin.socket.emit("interact", { type: "buy", data: { item: "nabo", qty: 1 } });
  const [_, iacc] = await Promise.all([buyEvt, invAcc]);
  ok("Conta compra semente", iacc?.nabo_seed === 6, `nabo_seed=${iacc?.nabo_seed}`);
  accJoin.socket.emit("requestSave");
  await sleep(300);
  accJoin.socket.disconnect();
  await sleep(300);

  const accAgain = await connect(ACC, { token: reg.token });
  ok("Ouros da conta persistem após sair", accAgain.data.self.gold === 480, String(accAgain.data.self.gold));
  ok("Inventário da conta persiste", accAgain.data.self.inventory.nabo_seed === 6, `nabo_seed=${accAgain.data.self.inventory.nabo_seed}`);

  // conta não pode ser personificada por visitante
  const fake = await connect(ACC);
  ok("Visitante não assume o nome de uma conta", fake.data.self.username !== ACC, fake.data.self.username);
  fake.socket.disconnect();

  // ---------- TEMPO ----------
  const timeEvt = once(accAgain.socket, "timeUpdate", 6000);
  const t = await timeEvt;
  ok("Servidor sincroniza o relógio do mundo", !!t && t.time > 0, t ? `${Math.floor(t.time)} min` : "sem evento");

  // ---------- DESCONEXÃO / RECUPERAÇÃO ----------
  const left = once(A.socket, "playerLeft");
  B.socket.disconnect();
  ok("Desconexão notificada", !!(await left));

  const dayAfter = once(A.socket, "newDay");
  A.socket.emit("sleep");
  accAgain.socket.emit("sleep");
  const nd2 = await dayAfter;
  ok("Mundo continua após alguém desconectar", !!nd2, nd2 ? `dia ${nd2.day}` : "sem evento");

  A.socket.disconnect();
  await sleep(300);
  const A2 = await connect("Alice2");
  ok("Reconexão recupera o mundo salvo", A2.data.world.communityProgress.praca === 500);
  ok("Construções persistem após reconexão", Object.values(A2.data.world.buildings).some((b) => b.buildingId === "cerca"));
  A2.socket.disconnect();
  accAgain.socket.disconnect();

  // ---------- API ----------
  const rooms = await fetch(URL + "/api/rooms").then((r) => r.json());
  ok("API de salas responde", Array.isArray(rooms));

  console.log(`\n${failed === 0 ? "🎉 TODOS OS TESTES PASSARAM" : `⚠️ ${failed} de ${total} falharam`} (${total - failed}/${total})\n`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("\n❌ Erro fatal no teste:", e.message, "\n", e.stack);
  process.exit(1);
});
