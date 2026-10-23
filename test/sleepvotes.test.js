/**
 * Teste determinístico de votos de descanso (sleepVotes).
 *
 * Regra do projeto: voto de um dia NÃO pode contar no dia seguinte.
 * Reprodução: 3 jogadores na sala (maioria = 2 votos), em dois dias seguidos.
 *   Dia 1: A vota (sleepVote 1/2), B vota -> avança.
 *   Dia 2: B vota (sleepVote 1/2, não avança), C vota -> avança.
 * Se o voto de A vazasse para o dia 2, o voto de B sozinho já fecharia maioria
 * (2/2) e o evento sleepVote viria com votes=2 — o teste falharia ali.
 *
 * Sem sleeps arbitrários: a sincronização é feita pelos próprios eventos.
 * Uso: node test/sleepvotes.test.js [url]
 * Requer o servidor rodando: npm start
 */
import { io } from "socket.io-client";

const URL = process.argv[2] || "http://localhost:3000";
const ROOM = "S" + Math.random().toString(36).slice(2, 5).toUpperCase();
let failed = 0;
let total = 0;

function ok(name, cond, extra = "") {
  total++;
  if (!cond) failed++;
  console.log(`${cond ? "✅" : "❌"} ${name}${extra ? " — " + extra : ""}`);
}

function once(socket, event, ms = 4000) {
  return new Promise((resolve) => {
    const t = setTimeout(() => { socket.off(event, handler); resolve(null); }, ms);
    function handler(data) { clearTimeout(t); socket.off(event, handler); resolve(data); }
    socket.on(event, handler);
  });
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
    const s = io(URL, { transports: ["websocket"], reconnection: false });
    const timer = setTimeout(() => reject(new Error("timeout ao entrar: " + name)), 8000);
    s.on("connect", () => s.emit("joinRoom", { roomCode: ROOM, username: name, x: 22, y: 21 }));
    s.on("joined", (data) => { clearTimeout(timer); resolve({ socket: s, data }); });
    s.on("joinError", (d) => { clearTimeout(timer); reject(new Error(d.error)); });
    s.on("connect_error", (e) => { clearTimeout(timer); reject(e); });
  });
}

const A = await connect("VotanteA");
const B = await connect("VotanteB");
const C = await connect("VotanteC");

const threePlayers = await waitFor(A.socket, "playersUpdate", (list) => list?.length === 3, 3000);
ok("Sala com 3 jogadores", threePlayers?.length === 3, `playersUpdate=${threePlayers?.length ?? "n/a"}`);

// ---- Dia 1: 1 voto não avança, 2 votos avançam ----
const vote1 = once(C.socket, "sleepVote");
A.socket.emit("sleep");
const v1 = await vote1;
ok("Dia 1: 1 voto sozinho não avança (maioria = 2)", v1?.votes === 1 && v1?.needed === 2, v1 ? `votos ${v1.votes}/${v1.needed}` : "sem sleepVote");

const day1 = Promise.all([once(A.socket, "newDay"), once(B.socket, "newDay"), once(C.socket, "newDay")]);
B.socket.emit("sleep");
const d1 = (await day1)[2];
ok("Dia 1: 2 votos avançam o dia", !!d1, d1 ? `dia ${d1.day}` : "sem newDay");

// ---- Dia 2: o voto do dia 1 não pode mais contar ----
const vote2 = once(A.socket, "sleepVote");
B.socket.emit("sleep");
const v2 = await vote2;
ok(
  "Dia 2: 1 voto não avança (voto do dia 1 não vazou)",
  v2?.votes === 1 && v2?.needed === 2,
  v2 ? `votos ${v2.votes}/${v2.needed}` : "sem sleepVote (o dia pode ter avançado indevidamente)"
);

const day2 = Promise.all([once(A.socket, "newDay"), once(B.socket, "newDay"), once(C.socket, "newDay")]);
C.socket.emit("sleep");
const d2 = (await day2)[0];
ok("Dia 2: 2 votos avançam o dia", !!d2, d2 ? `dia ${d2.day}` : "sem newDay");
ok("Os dias andaram exatamente 2", !!d1 && !!d2 && d2.day === d1.day + 1, `${d1?.day} -> ${d2?.day}`);

A.socket.disconnect();
B.socket.disconnect();
C.socket.disconnect();

console.log(failed === 0 ? `🎉 VOTOS DE DESCANSO OK (${total}/${total})` : `❌ ${failed} falha(s) de ${total}`);
process.exit(failed === 0 ? 0 : 1);
