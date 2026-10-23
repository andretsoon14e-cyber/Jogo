/**
 * Teste da caverna: geração, entrada, escadas, cristais e saída.
 *
 * Regras verificadas:
 *  - os 3 andares existem e são jogáveis (piso ligando entrada e escada);
 *  - entrar exige estar na Mina do Vale;
 *  - descer exige estar na escada e ter os cristais do andar;
 *  - cristal só sai de veio e some do mapa ao minerar;
 *  - sair exige estar na escada de subida e devolve ao vale.
 *
 * Uso: node test/cave.test.js [url]
 */
import { io } from "socket.io-client";
import { createCaveMap } from "../server/worldState.js";
import { TILE } from "../shared/constants.js";
import { CAVE_FLOORS, REGION_DEFS } from "../shared/careers.js";

const SERVER = process.argv[2] || "http://localhost:3000";
const ROOM = "C" + Math.random().toString(36).slice(2, 5).toUpperCase();
let failed = 0;
let total = 0;

function ok(name, cond, extra = "") {
  total++;
  if (!cond) failed++;
  console.log(`${cond ? "✅" : "❌"} ${name}${extra ? " — " + extra : ""}`);
}

// ------------------------------------------------------------------
// 1) Geração dos andares (puro, sem servidor)
// ------------------------------------------------------------------
function reachable(tiles, from, to) {
  const H = tiles.length, W = tiles[0].length;
  const seen = new Set();
  const queue = [[from.x, from.y]];
  const walkable = (t) => t !== undefined && t !== TILE.CAVE_WALL && t !== TILE.CAVE_CRYSTAL && t !== TILE.WATER;
  while (queue.length) {
    const [x, y] = queue.shift();
    const key = `${x},${y}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (x === to.x && y === to.y) return true;
    if (x < 0 || y < 0 || x >= W || y >= H) continue;
    if (!walkable(tiles[y][x])) continue;
    queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  return false;
}

for (const floorDef of CAVE_FLOORS) {
  const tiles = createCaveMap(floorDef.floor);
  const def = REGION_DEFS[floorDef.id];
  const flat = tiles.flat();
  const count = (v) => flat.filter((t) => t === v).length;
  ok(`Andar ${floorDef.floor}: existe e tem o tamanho certo`,
    tiles.length === def.size.h && tiles[0].length === def.size.w,
    `${tiles[0].length}x${tiles.length}`);
  ok(`Andar ${floorDef.floor}: tem piso caminhável`, count(TILE.CAVE_FLOOR) > 80, `${count(TILE.CAVE_FLOOR)} tiles`);
  ok(`Andar ${floorDef.floor}: tem veios de cristal`, count(TILE.CAVE_CRYSTAL) >= 5, `${count(TILE.CAVE_CRYSTAL)} veios`);
  ok(`Andar ${floorDef.floor}: tem escada de subida`, count(TILE.CAVE_STAIRS_UP) === 1);
  ok(`Andar ${floorDef.floor}: ${def.cave.stairs ? "tem" : "não tem"} escada de descida`,
    def.cave.stairs ? count(TILE.CAVE_STAIRS_DOWN) === 1 : count(TILE.CAVE_STAIRS_DOWN) === 0);
  ok(`Andar ${floorDef.floor}: entrada alcança a saída`,
    reachable(tiles, def.cave.spawn, def.cave.exit), `${def.cave.spawn.x},${def.cave.spawn.y} -> ${def.cave.exit.x},${def.cave.exit.y}`);
  if (def.cave.stairs) {
    ok(`Andar ${floorDef.floor}: dá para chegar na escada de descida`,
      reachable(tiles, def.cave.spawn, def.cave.stairs), `${def.cave.stairs.x},${def.cave.stairs.y}`);
  }
}

// ------------------------------------------------------------------
// 2) Comportamento no servidor
// ------------------------------------------------------------------
function waitFor(socket, event, predicate = () => true, ms = 4000) {
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

const socket = await new Promise((resolve, reject) => {
  const s = io(SERVER, { transports: ["websocket"], reconnection: false });
  const timer = setTimeout(() => reject(new Error("timeout ao entrar")), 8000);
  s.on("connect", () => s.emit("joinRoom", { roomCode: ROOM, username: "Explorador", x: 22, y: 21 }));
  s.on("joined", (d) => { clearTimeout(timer); resolve(s); });
  s.on("joinError", (e) => { clearTimeout(timer); reject(new Error(e.error)); });
  s.on("connect_error", (e) => { clearTimeout(timer); reject(e); });
});

const notifies = [];
socket.on("notify", (n) => notifies.push(n.msg));
socket.on("notifyAll", (n) => notifies.push(n.msg));
let inv = {};
let lastTravel = null;
socket.on("inventoryUpdate", (i) => { inv = i || {}; });
socket.on("traveled", (t) => { lastTravel = t; });
socket.on("tileUpdate", ({ x, y, tile, region }) => {
  if (region === "caverna1" && caveTilesRef.c1) caveTilesRef.c1[y][x] = tile;
  if (region === "caverna2" && caveTilesRef.c2) caveTilesRef.c2[y][x] = tile;
});
const caveTilesRef = { c1: null, c2: null };

// sem estar na mina, não entra
socket.emit("interact", { type: "travel", data: { to: "caverna1" } });
await new Promise((r) => setTimeout(r, 500));
ok("Entrar na caverna exige estar na Mina do Vale", notifies.some((m) => /Mina do Vale/i.test(m)), notifies.slice(-1)[0] || "sem aviso");

// caminha até a mina (55.5, 10) e entra
async function walkTo(tx, ty) {
  let x = 22, y = 21;
  const steps = Math.max(1, Math.ceil(Math.hypot(tx - 22, ty - 21)));
  for (let i = 1; i <= steps + 4; i++) {
    const k = Math.min(1, i / steps);
    x = 22 + (tx - 22) * k;
    y = 21 + (ty - 21) * k;
    socket.emit("move", { x, y, dir: "down" });
    if (Math.hypot(tx - x, ty - y) < 0.4) break;
    await new Promise((r) => setTimeout(r, 105));
  }
}
await walkTo(55.5, 10);

let traveled = waitFor(socket, "traveled", (d) => d.region === "caverna1", 4000);
socket.emit("interact", { type: "travel", data: { to: "caverna1" } });
const t1 = await traveled;
ok("Entra na caverna estando na mina", t1?.region === "caverna1", t1 ? `${t1.x},${t1.y}` : "sem traveled");
const cave1Tiles = t1?.tiles || createCaveMap(1);
caveTilesRef.c1 = cave1Tiles;
ok("Chega no ponto de entrada do andar 1", t1 && Math.abs(t1.x - (REGION_DEFS.caverna1.cave.spawn.x + 0.5)) < 0.01);

// tenta descer sem estar na escada
notifies.length = 0;
socket.emit("interact", { type: "travel", data: { to: "caverna2" } });
await new Promise((r) => setTimeout(r, 500));
ok("Descer exige estar na escada", notifies.some((m) => /escada/i.test(m)), notifies.slice(-1)[0] || "sem aviso");

// vai até a escada do andar 1 e tenta descer sem cristais
const s1 = REGION_DEFS.caverna1.cave.stairs;
s1 && await walkToServer(s1.x + 0.5, s1.y + 0.5);
async function walkToServer(tx, ty) {
  const me = await new Promise((resolve) => {
    const h = (list) => {
      const self = list.find((p) => p.username === "Explorador");
      if (!self) return;
      socket.off("playersUpdate", h);
      resolve(self);
    };
    socket.on("playersUpdate", h);
    socket.emit("requestPlayers");
    setTimeout(() => resolve({ x: 22, y: 21 }), 300);
  });
  let x = me.x, y = me.y;
  const steps = Math.max(1, Math.ceil(Math.hypot(tx - x, ty - y)));
  for (let i = 1; i <= steps + 4; i++) {
    const k = Math.min(1, i / steps);
    socket.emit("move", { x: me.x + (tx - me.x) * k, y: me.y + (ty - me.y) * k, dir: "down" });
    if (k >= 1) break;
    await new Promise((r) => setTimeout(r, 105));
  }
  await new Promise((r) => setTimeout(r, 200));
}

notifies.length = 0;
socket.emit("interact", { type: "travel", data: { to: "caverna2" } });
await new Promise((r) => setTimeout(r, 600));
const blockedByCrystal = notifies.some((m) => /crista/i.test(m));
ok("Descer sem cristais é bloqueado com aviso claro", blockedByCrystal, notifies.slice(-1)[0] || "sem aviso");

// ------------------------------------------------------------------
// 3) Descer de verdade (com cristais), subir e sair
// ------------------------------------------------------------------
function floorSpots(tiles) {
  const spots = [];
  for (let y = 0; y < tiles.length; y++) for (let x = 0; x < tiles[y].length; x++) {
    if (tiles[y][x] === TILE.CAVE_CRYSTAL) {
      for (const [dx, dy] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) {
        if (tiles[y + dy]?.[x + dx] === TILE.CAVE_FLOOR) { spots.push({ vein: { x, y }, stand: { x: x + dx, y: y + dy } }); break; }
      }
    }
  }
  return spots;
}
const spots = floorSpots(cave1Tiles).slice(0, 3);
ok("Andar 1 tem 3 veios alcançáveis para o teste", spots.length === 3, `${spots.length} veios`);
for (const [i, spot] of spots.entries()) {
  await walkToServer(spot.stand.x + 0.5, spot.stand.y + 0.5);
  notifies.length = 0;
  socket.emit("interact", { type: "mine", data: { x: spot.vein.x, y: spot.vein.y } });
  await new Promise((r) => setTimeout(r, 500));
  ok(`Minera o veio ${i + 1} e ganha cristal`, (inv.cristal || 0) >= i + 1 && cave1Tiles[spot.vein.y][spot.vein.x] === TILE.CAVE_FLOOR,
    `cristais=${inv.cristal || 0}`);
}

await walkToServer(s1.x + 0.5, s1.y + 1.5);
const down = waitFor(socket, "traveled", (d) => d.region === "caverna2", 4000);
notifies.length = 0;
socket.emit("interact", { type: "travel", data: { to: "caverna2" } });
const t2 = await down;
ok("Com 3 cristais, desce pela escada para o andar 2", t2?.region === "caverna2",
  t2 ? `chegou em ${t2.x},${t2.y}` : `sem traveled — ${notifies.slice(-1)[0] || "sem aviso"}`);
ok("Chega no spawn do andar 2", t2 && Math.abs(t2.x - (REGION_DEFS.caverna2.cave.spawn.x + 0.5)) < 0.01);

// subir: longe da saída deve ser bloqueado
await walkToServer(16.5, 10.5);
notifies.length = 0;
socket.emit("interact", { type: "travel", data: { to: "caverna1" } });
await new Promise((r) => setTimeout(r, 500));
ok("Subir exige estar na escada de saída", notifies.some((m) => /escada/i.test(m)), notifies.slice(-1)[0] || "sem aviso");

const ex2 = REGION_DEFS.caverna2.cave.exit;
await walkToServer(ex2.x + 0.5, ex2.y + 0.5);
const up = waitFor(socket, "traveled", (d) => d.region === "caverna1", 4000);
notifies.length = 0;
socket.emit("interact", { type: "travel", data: { to: "caverna1" } });
const t3 = await up;
ok("Sobe pela escada de saída do andar 2", t3?.region === "caverna1", t3 ? `chegou em ${t3.x},${t3.y}` : `sem traveled — ${notifies.slice(-1)[0] || "sem aviso"}`);

// e volta ao vale
await walkToServer(REGION_DEFS.caverna1.cave.exit.x + 0.5, REGION_DEFS.caverna1.cave.exit.y + 0.5);
const out = waitFor(socket, "traveled", (d) => d.region === "vale", 4000);
notifies.length = 0;
socket.emit("interact", { type: "travel", data: { to: "vale" } });
const t4 = await out;
ok("Volta ao vale pela escada de subida", t4?.region === "vale", t4 ? `chegou em ${t4.x},${t4.y}` : `sem traveled — ${notifies.slice(-1)[0] || "sem aviso"}`);

socket.disconnect();
console.log(failed === 0 ? `🎉 CAVERNA OK (${total}/${total})` : `❌ ${failed} falha(s) de ${total}`);
process.exit(failed === 0 ? 0 : 1);
