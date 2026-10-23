/**
 * Validação de movimento no servidor.
 *
 * Regra: o servidor é a autoridade da posição. Um cliente não pode
 * atravessar o mapa num único pacote e agir lá do outro lado.
 * O excedente é aparado (não recusado), para não travar quem tem lag.
 *
 * Uso: node test/movement.test.js [url]
 * Requer o servidor rodando: npm start
 */
import { io } from "socket.io-client";

const URL = process.argv[2] || "http://localhost:3000";
const ROOM = "M" + Math.random().toString(36).slice(2, 5).toUpperCase();
let failed = 0;
let total = 0;

function ok(name, cond, extra = "") {
  total++;
  if (!cond) failed++;
  console.log(`${cond ? "✅" : "❌"} ${name}${extra ? " — " + extra : ""}`);
}

function waitFor(socket, event, predicate = () => true, ms = 3000) {
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
    const s = io(URL, { transports: ["websocket"], reconnection: false });
    const timer = setTimeout(() => reject(new Error("timeout ao entrar: " + name)), 8000);
    s.on("connect", () => s.emit("joinRoom", { roomCode: ROOM, username: name, x: 22, y: 21 }));
    s.on("joined", (data) => { clearTimeout(timer); resolve({ socket: s, data }); });
    s.on("joinError", (d) => { clearTimeout(timer); reject(new Error(d.error)); });
    s.on("connect_error", (e) => { clearTimeout(timer); reject(e); });
  });
}

const A = await connect("Corredor");
const B = await connect("Observador");
await waitFor(B.socket, "playersUpdate", (l) => l?.length === 2, 3000);

// ---- 1) teleporte em um pacote é aparado ----
const seen = waitFor(B.socket, "playerMoved", (d) => d?.id === A.data.selfId, 3000);
A.socket.emit("move", { x: 90, y: 90, dir: "right" });
const moved = await seen;
const dist = moved ? Math.hypot(moved.x - 22, moved.y - 21) : Infinity;
ok("Teleporte de 22,21 para 90,90 é limitado", !!moved && dist < 4, `parou a ${dist.toFixed(2)} tiles`);
ok("Posição limitada continua dentro do mapa", !!moved && moved.x >= 0 && moved.y >= 0 && moved.x <= 100 && moved.y <= 100, moved ? `${moved.x.toFixed(1)},${moved.y.toFixed(1)}` : "sem evento");

// ---- 2) não dá para agir no lugar para onde tentou teleportar ----
const tileAtFar = waitFor(A.socket, "tileUpdate", (d) => d?.x === 90 && d?.y === 90, 900);
A.socket.emit("interact", { type: "till", data: { x: 90, y: 90 } });
const tilled = await tileAtFar;
ok("Não consegue arar longe da própria posição", tilled === null, tilled ? "arou 90,90" : "bloqueado");

// ---- 3) caminhada normal passa intacta ----
const walk = waitFor(B.socket, "playerMoved", (d) => d?.id === A.data.selfId && d?.x > 23 && d?.x < 26, 3000);
let cx = moved ? moved.x : 22;
let cy = moved ? moved.y : 21;
for (let i = 0; i < 8; i++) {
  cx += 0.4;
  A.socket.emit("move", { x: cx, y: cy, dir: "right" });
  await new Promise((r) => setTimeout(r, 110));
}
const walked = await walk;
ok("Passos normais chegam sem corte", !!walked, walked ? `${walked.x.toFixed(2)},${walked.y.toFixed(2)}` : "nada recebido");

// ---- 4) distância de ação é medida na posição real ----
const near = waitFor(A.socket, "plotUpdate", (d) => d?.key === `${Math.round(cx)},${Math.round(cy)}`, 1500);
A.socket.emit("interact", { type: "till", data: { x: Math.round(cx), y: Math.round(cy) } });
const nearPlot = await near;
ok("Ação perto da posição real é aceita", nearPlot !== null, nearPlot ? "terra arada" : "recusada");

A.socket.disconnect();
B.socket.disconnect();

console.log(failed === 0 ? `🎉 MOVIMENTO OK (${total}/${total})` : `❌ ${failed} falha(s) de ${total}`);
process.exit(failed === 0 ? 0 : 1);
