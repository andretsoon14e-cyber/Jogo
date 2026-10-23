/**
 * Teste de objetivos cooperativos (a sala inteira soma, todos ganham).
 *
 * Cobre um bug real encontrado em 2026-10-23: a missão "Mutirão da Colheita"
 * usava o stat `harvested`, mas nenhuma ação chamava recordCoop("harvested").
 * A barra ficava travada em 0 para sempre.
 *
 * Uso: node test/coop.test.js [url]
 * Requer o servidor rodando: npm start
 */
import fs from "node:fs";
import { io } from "socket.io-client";
import { COOP_MISSIONS } from "../shared/careers.js";

const SERVER = process.argv[2] || "http://localhost:3000";
const ROOM = "P" + Math.random().toString(36).slice(2, 5).toUpperCase();
let failed = 0;
let total = 0;

function ok(name, cond, extra = "") {
  total++;
  if (!cond) failed++;
  console.log(`${cond ? "✅" : "❌"} ${name}${extra ? " — " + extra : ""}`);
}

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

function connect(name) {
  return new Promise((resolve, reject) => {
    const s = io(SERVER, { transports: ["websocket"], reconnection: false });
    const timer = setTimeout(() => reject(new Error("timeout ao entrar: " + name)), 8000);
    s.on("connect", () => s.emit("joinRoom", { roomCode: ROOM, username: name, x: 22, y: 21 }));
    s.on("joined", (data) => { clearTimeout(timer); resolve({ socket: s, data }); });
    s.on("joinError", (d) => { clearTimeout(timer); reject(new Error(d.error)); });
    s.on("connect_error", (e) => { clearTimeout(timer); reject(e); });
  });
}

async function walkTo(socket, tx, ty) {
  let x = 22, y = 21;
  const steps = Math.max(1, Math.ceil(Math.hypot(tx - x, ty - y)));
  for (let i = 1; i <= steps + 4; i++) {
    const k = Math.min(1, i / steps);
    x = 22 + (tx - 22) * k;
    y = 21 + (ty - 21) * k;
    socket.emit("move", { x, y, dir: "down" });
    if (Math.hypot(tx - x, ty - y) < 0.5) break;
    await new Promise((r) => setTimeout(r, 110));
  }
}

// ---------- 1) verificação estática: toda missão tem quem a alimente ----------
const src = fs.readFileSync(new URL("../server/gameActions.js", import.meta.url), "utf-8")
  + fs.readFileSync(new URL("../server/careers.js", import.meta.url), "utf-8");
for (const m of COOP_MISSIONS) {
  const re = new RegExp(`recordCoop\\([^)]*"${m.stat}"`);
  ok(`Missão "${m.name}" tem ação que soma progresso`, re.test(src), `stat=${m.stat}`);
}

// ---------- 2) progresso compartilhado de verdade ----------
const A = await connect("CooperaA");
const B = await connect("CooperaB");
const start = await waitFor(A.socket, "coopUpdate", (list) => Array.isArray(list), 3000);
const harvestBefore = start?.find((m) => m.id === "colheita")?.progress ?? 0;

// prepara o canteiro perto do spawn e planta
await walkTo(A.socket, 23, 16);
A.socket.emit("interact", { type: "till", data: { x: 23, y: 16 } });
await waitFor(A.socket, "tileUpdate", (d) => d?.x === 23 && d?.y === 16, 2000);
A.socket.emit("interact", { type: "plant", data: { x: 23, y: 16, seed: "nabo_seed" } });
const planted = await waitFor(A.socket, "plotUpdate", (d) => d?.key === "23,16" && d?.plot?.crop === "nabo", 2500);
ok("Canteiro preparado para o mutirão", !!planted);

// nabo leva 3 dias e só cresce se for regado: rega + os dois dormem
for (let d = 0; d < 3; d++) {
  const watered = waitFor(A.socket, "plotUpdate", (p) => p?.key === "23,16" && p?.plot?.watered === true, 2500);
  A.socket.emit("interact", { type: "water", data: { x: 23, y: 16 } });
  const wp = await watered;
  if (d === 0) ok("Regar o canteiro do mutirão", !!wp);
  const newDay = waitFor(A.socket, "newDay", () => true, 4000);
  A.socket.emit("sleep");
  B.socket.emit("sleep");
  const nd = await newDay;
  if (d === 0) ok("Noite passa com os dois votos", !!nd, nd ? `dia ${nd.day}` : "sem newDay");
  await new Promise((r) => setTimeout(r, 120));
}

const beforeHarvest = await waitFor(A.socket, "coopUpdate", () => true, 900);
const beforeVal = beforeHarvest?.find((m) => m.id === "colheita")?.progress ?? harvestBefore;

const coopUpd = waitFor(A.socket, "coopUpdate", (list) => (list?.find((m) => m.id === "colheita")?.progress || 0) > beforeVal, 4000);
A.socket.emit("interact", { type: "harvest", data: { x: 23, y: 16 } });
const after = await coopUpd;
ok("Colher avança o mutirão cooperativo da sala", !!after, after ? `progresso ${after.find((m) => m.id === "colheita").progress}` : "sem coopUpdate");

const inv = await waitFor(A.socket, "inventoryUpdate", (i) => (i?.nabo || 0) > 0, 2500);
ok("Quem colheu recebe o item", !!inv, inv ? `nabo=${inv.nabo}` : "sem item");

A.socket.disconnect();
B.socket.disconnect();

console.log(failed === 0 ? `🎉 CO-OP OK (${total}/${total})` : `❌ ${failed} falha(s) de ${total}`);
process.exit(failed === 0 ? 0 : 1);
