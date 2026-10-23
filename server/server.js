import express from "express";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Server } from "socket.io";
import cors from "cors";
import { register, login, verifyToken } from "./accounts.js";
import {
  ensureRoom, getRoom, listRooms, joinPlayer, leavePlayer, saveRoom,
  saveDirtyRooms, allRooms, normalizedCode, resetRoom, persistPlayer,
} from "./rooms.js";
import { handleAction, publicPlayer, publicWorld } from "./gameActions.js";
import { sanitizeLook } from "../shared/looks.js";
import { handleBankAction } from "./bank.js";
import { handleSocialAction, socialSnapshot } from "./social.js";
import { sendCareerState, dailyCareerEffects, coopSnapshot, chainSnapshot, jobSnapshot } from "./careers.js";
import { saveWorldToDisk, loadWorldFromDisk, advanceDay } from "./worldState.js";
import { GAME_END_MINUTES, ANIMALS } from "../shared/constants.js";

const __filename = fileURLToPath(import.meta.url);

// Velocidade máxima aceita do cliente, em tiles por segundo.
// O jogo roda a 4.2 (7.14 com Shift); 9 dá folga para lag sem abrir teleporte.
const MOVE_SPEED = 9;
// Tolerância fixa por pacote (arredondamento + latência).
const MOVE_SLACK = 1.2;
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT) || 3000;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
  maxHttpBufferSize: 1e6,
  pingTimeout: 20000,
});

app.use(cors());
app.use(express.json({ limit: "32kb" }));
// Evita cache teimoso: navegador e .exe devem sempre pegar o último client
const noCache = (res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
};
app.use(express.static(path.join(__dirname, "../client"), { index: false, maxAge: 0, etag: false, lastModified: false, cacheControl: false, setHeaders: noCache }));
app.use("/shared", express.static(path.join(__dirname, "../shared"), { maxAge: 0, etag: false, lastModified: false, cacheControl: false, setHeaders: noCache }));
// versão exposta para o cliente conferir qual build está rodando (mesma no navegador e no .exe)
let APP_VERSION = "0.0.0";
try {
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, "../package.json"), "utf-8"));
  if (pkg.version) APP_VERSION = pkg.version;
} catch {}
app.get("/api/version", (req, res) => {
  noCache(res);
  res.json({ version: APP_VERSION });
});

// ---------------- CONTAS ----------------
app.post("/api/register", (req, res) => {
  const { username, password } = req.body || {};
  const result = register(username, password);
  if (!result.ok) return res.status(400).json({ error: result.error });
  res.json({ username: result.username, token: result.token });
});

app.post("/api/login", (req, res) => {
  const { username, password } = req.body || {};
  const result = login(username, password);
  if (!result.ok) return res.status(401).json({ error: result.error });
  res.json({ username: result.username, token: result.token });
});

app.get("/api/me", (req, res) => {
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  const user = verifyToken(token);
  if (!user) return res.status(401).json({ error: "Sessão inválida" });
  res.json({ username: user });
});

// ---------------- MUNDOS ----------------
app.get("/health", (req, res) => res.json({ status: "ok", rooms: allRooms().size, uptime: process.uptime() }));

app.get("/api/rooms", (req, res) => res.json(listRooms()));

app.post("/api/create-room", (req, res) => {
  let code = normalizedCode(req.body?.code) || Math.random().toString(36).slice(2, 6).toUpperCase();
  if (getRoom(code)) return res.status(400).json({ error: "Já existe uma sala com esse código." });
  const room = ensureRoom(code);
  saveWorldToDisk(code, room.world);
  res.json({ code });
});

app.post("/api/reset-room", (req, res) => {
  const code = normalizedCode(req.body?.code);
  if (!code) return res.status(400).json({ error: "Código inválido" });
  const room = getRoom(code);
  if (room && room.players.size > 0) return res.status(400).json({ error: "Há jogadores nesta sala." });
  res.json(resetRoom(code));
});

app.get("/api/world/:code", (req, res) => {
  const code = normalizedCode(req.params.code);
  if (!code) return res.status(400).json({ error: "Código inválido" });
  const room = getRoom(code);
  if (room) return res.json(publicWorld(room.world));
  const world = loadWorldFromDisk(code);
  if (!world) return res.status(404).json({ error: "Mundo não encontrado" });
  res.json(publicWorld(world));
});

app.get("/api/world/:code/player/:name", (req, res) => {
  const code = normalizedCode(req.params.code);
  const room = getRoom(code);
  const world = room?.world || loadWorldFromDisk(code);
  if (!world) return res.status(404).json({ error: "Mundo não encontrado" });
  const st = world.playerStates?.[req.params.name];
  if (!st) return res.status(404).json({ error: "Jogador não encontrado" });
  res.json({ username: st.username, gold: st.gold, level: st.level, lastSeen: st.lastSeen });
});

// ---------------- PÁGINA INICIAL (versão injetada) ----------------
// O index.html usa o token __APP_VERSION__; o número vem só do package.json.
// Assim o aviso "HTML em cache" nunca aparece por divergência de versão.
const INDEX_PATH = path.join(__dirname, "../client/index.html");
function sendIndex(req, res) {
  noCache(res);
  try {
    const html = fs.readFileSync(INDEX_PATH, "utf-8").split("__APP_VERSION__").join(APP_VERSION);
    res.type("html").send(html);
  } catch {
    res.sendFile(INDEX_PATH);
  }
}

app.get("/", sendIndex);

// SPA fallback
app.get("*", sendIndex);

// ---------------- TEMPO DO MUNDO ----------------
setInterval(() => {
  for (const room of allRooms().values()) {
    if (room.players.size === 0) continue;
    room.world.time += 1.0; // ritmo Stardew mais calmo (~0.5 min/s)
    if (room.world.time >= GAME_END_MINUTES) {
      advanceWorld(room, ["🌅 O dia amanheceu. Todos dormiram cedo."]);
    } else {
      io.to(room.roomCode).emit("timeUpdate", {
        time: room.world.time,
        day: room.world.day,
        seasonIndex: room.world.seasonIndex,
        weather: room.world.weather,
      });
    }
  }
}, 2000);

// Autosave: salva mundos sujos a cada 5s
setInterval(() => saveDirtyRooms(), 5000);
// Backup completo a cada 30s
setInterval(() => {
  for (const [code, room] of allRooms()) saveWorldToDisk(code, room.world);
}, 30000);

function advanceWorld(room, extraNotes = []) {
  const notes = advanceDay(room.world);
  notes.push(...dailyCareerEffects(room, io));
  room.sleepVotes.clear();
  for (const p of room.players.values()) {
    // produtos de animais entram na conta de quem estava online
    const saved = room.world.playerStates[p.username];
    if (p.account && saved) {
      p.inventory = { ...saved.inventory };
      p.gold = saved.gold;
    } else {
      // visitantes não têm playerState persistente: produzimos na sessão atual
      for (const animal of room.world.animals || []) {
        if (animal.owner !== p.username) continue;
        const def = ANIMALS[animal.type];
        if (def && Math.random() <= def.productChance) {
          p.inventory[def.product] = (p.inventory[def.product] || 0) + 1;
        }
      }
    }
    p.talkedToday = {};
  }
  for (const p of room.players.values()) {
    if (p.account) persistPlayer(room.world, p);
  }
  saveWorldToDisk(room.roomCode, room.world);
  room.dirty = false;
  io.to(room.roomCode).emit("tilesReload", { tiles: room.world.tiles });
  io.to(room.roomCode).emit("newDay", {
    day: room.world.day,
    seasonIndex: room.world.seasonIndex,
    weather: room.world.weather,
    plots: room.world.plots,
    animals: room.world.animals,
    festival: room.world.festival,
    notes: [...notes, ...extraNotes],
  });
  io.to(room.roomCode).emit("coopUpdate", coopSnapshot(room.world));
  for (const [id, p] of room.players) {
    const s = io.sockets.sockets.get(id);
    if (!s) continue;
    s.emit("inventoryUpdate", p.inventory);
    s.emit("goldUpdate", p.gold);
    s.emit("skillsUpdate", { level: p.level, xp: p.xp });
    s.emit("jobUpdate", jobSnapshot(p, room.world));
    s.emit("chainsUpdate", chainSnapshot(p));
    s.emit("bankUpdate", { balance: p.bankBalance||0, cash: p.gold, loan: p.loan||null, history: (p.bankHistory||[]).slice(-20) });
    s.emit("socialUpdate", socialSnapshot(p));
  }
}

// ---------------- SOCKET.IO ----------------
io.on("connection", (socket) => {
  let room = null;
  let player = null;
  let lastChat = 0;

  socket.on("joinRoom", (payload = {}) => {
    try {
      const code = normalizedCode(payload.roomCode) || "VALE1";
      const tokenUser = verifyToken(payload.token);
      room = ensureRoom(code);

      let requested = String(payload.username || "").slice(0, 20);
      let name = tokenUser || requested || `Visitante${Math.floor(Math.random() * 999)}`;
      // evita se passar por uma conta que não é sua
      if (!tokenUser) {
        const online = [...room.players.values()].some((p) => p.username.toLowerCase() === name.toLowerCase());
        const saved = Object.keys(room.world.playerStates || {}).some((n) => n.toLowerCase() === name.toLowerCase());
        if (online || saved) name = `${name.slice(0, 16)}_${Math.floor(Math.random() * 90 + 10)}`;
      }

      player = joinPlayer(room, socket.id, {
        username: name,
        tokenUser,
        skin: payload.skin,
        look: sanitizeLook(payload.look),
        x: payload.x,
        y: payload.y,
      });
      socket.join(code);
      persistPlayer(room.world, player);

      socket.emit("joined", {
        roomCode: code,
        selfId: socket.id,
        isHost: room.hostId === socket.id,
        self: player,
        players: [...room.players.values()].map(publicPlayer),
        world: publicWorld(room.world),
      });
      socket.to(code).emit("playerJoined", publicPlayer(player));
      io.to(code).emit("playersUpdate", [...room.players.values()].map(publicPlayer));
      socket.emit("chatHistory", room.chat.slice(-30));
      sendCareerState({ player, room, socket });
      // banco e social
      socket.emit("bankUpdate", { balance: player.bankBalance||0, cash: player.gold, loan: player.loan||null, history: (player.bankHistory||[]).slice(-20) });
      socket.emit("socialUpdate", socialSnapshot(player));
      socket.emit("furnitureUpdate", player.furniture||[]);
      room.dirty = true;
      console.log(`[${code}] ${player.username}${player.account ? " (conta)" : " (visitante)"} entrou — ${room.players.size} online`);
    } catch (e) {
      console.error("joinRoom", e);
      socket.emit("joinError", { error: "Não foi possível entrar nessa sala." });
    }
  });

  socket.on("move", (data = {}) => {
    if (!room || !player) return;
    const x = Number(data.x), y = Number(data.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    if (x < 0 || y < 0 || x > 100 || y > 100) return;
    // ---- validação de velocidade ----
    // O servidor é a autoridade sobre a posição: ninguém atravessa o mapa
    // num pacote só. O excedente é aparado em vez de recusado, para não
    // desincronizar quem está com lag (o cliente continua de onde dá).
    const now = Date.now();
    const lastAt = player.moveAt || now;
    const elapsed = Math.max(0, (now - lastAt) / 1000);
    const maxStep = MOVE_SPEED * elapsed + MOVE_SLACK;
    const dx = x - (player.x ?? x), dy = y - (player.y ?? y);
    const dist = Math.hypot(dx, dy);
    let nx = x, ny = y;
    if (now < (player.tpUntil || 0)) {
      // posição definida pelo servidor (viagem, entrar/sair de casa): livre
    } else if (dist > maxStep && dist > 0.001) {
      const k = maxStep / dist;
      nx = player.x + dx * k;
      ny = player.y + dy * k;
      player.moveClamps = (player.moveClamps || 0) + 1;
    }
    player.x = nx;
    player.y = ny;
    player.moveAt = now;
    player.dir = ["up", "down", "left", "right"].includes(data.dir) ? data.dir : player.dir;
    socket.to(room.roomCode).emit("playerMoved", { id: socket.id, x: nx, y: ny, dir: player.dir, region: player.region || "vale" });
    room.dirty = true;
  });

  socket.on("chat", (data = {}) => {
    if (!room || !player) return;
    const now = Date.now();
    if (now - lastChat < 500) return;
    lastChat = now;
    const msg = String(data.msg || "").replace(/[\u0000-\u001f]/g, "").slice(0, 200);
    if (!msg.trim()) return;
    const entry = { username: player.username, msg, at: now };
    room.chat.push(entry);
    if (room.chat.length > 80) room.chat.shift();
    io.to(room.roomCode).emit("chatMsg", entry);
  });

  socket.on("interact", (data = {}) => {
    if (!room || !player) return;
    // sem throttle global: cada ação valida seus próprios cooldowns e custos
    const ctx = {
      io,
      room,
      player,
      socket,
      broadcast: (ev, payload) => io.to(room.roomCode).emit(ev, payload),
      emitSelf: (ev, payload) => socket.emit(ev, payload),
      notify: (msg, type = "info") => socket.emit("notify", { msg, type }),
    };
    try {
      // banco e social antes do genérico
      let handled = handleBankAction(ctx, data.type, data.data || {});
      if (handled === undefined) handled = handleSocialAction(ctx, data.type, data.data || {});
      if (handled !== undefined) { persistPlayer(room.world, player); room.dirty = true; return; }
      handleAction(ctx, data.type, data.data || {});
      persistPlayer(room.world, player);
      room.dirty = true;
    } catch (e) {
      console.error("interact", data.type, e);
      socket.emit("notify", { msg: "Não foi possível executar essa ação.", type: "error" });
    }
  });

  socket.on("requestCareer", () => {
    if (!room || !player) return;
    sendCareerState({ player, room, socket });
  });

  socket.on("requestSave", () => {
    if (!room || !player) return;
    persistPlayer(room.world, player);
    saveRoom(room);
    socket.emit("saved", { ok: true, at: Date.now() });
  });

  socket.on("sleep", () => {
    if (!room || !player) return;
    room.sleepVotes.add(socket.id);
    // maioria simples: 1 jogador = 1 voto, 2 = 2, 3 = 2, 4 = 3...
    const needed = Math.max(1, Math.floor(room.players.size / 2) + 1);
    const votes = room.sleepVotes.size;
    if (votes >= needed) {
      advanceWorld(room, [`🌙 ${player.username} iniciou o descanso da noite.`]);
      room.sleepVotes.clear();
    } else {
      io.to(room.roomCode).emit("sleepVote", { votes, needed, by: player.username });
    }
  });

  socket.on("resetPlayer", () => {
    // usado apenas em testes/administração local
    if (!room || !player) return;
    player.gold = 500;
    player.inventory = { nabo_seed: 5, batata_seed: 3, madeira: 5, pedra: 3 };
  });

  socket.on("disconnect", () => {
    if (!room) return;
    const p = leavePlayer(room, socket.id);
    saveRoom(room);
    if (!p) return;
    socket.to(room.roomCode).emit("playerLeft", socket.id);
    io.to(room.roomCode).emit("playersUpdate", [...room.players.values()].map(publicPlayer));
    if (room.hostId) {
      const newHost = io.sockets.sockets.get(room.hostId);
      if (newHost) newHost.emit("promotedHost");
    }
    console.log(`[${room.roomCode}] ${p.username} saiu — ${room.players.size} online`);
  });
});

const isMain = process.argv[1] && path.resolve(process.argv[1]) === __filename;
if (isMain) {
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`🌾 Vale Aconchegante rodando em http://localhost:${PORT}`);
    console.log(`   Multiplayer Socket.IO ativo | dados em ${process.env.DATA_DIR || "server/data"}`);
  });
}

export { app, server, io };
