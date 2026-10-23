/**
 * Regras das casas dos jogadores (sem browser/socket).
 *
 * Cobre: uma casa por jogador, permissão de entrada separada do baú,
 * revogação, aluguel diário com dívida, construir casa para alguém e
 * transferir a propriedade.
 *
 * Uso: node test/houses.test.js
 */
import { createWorldState } from "../server/worldState.js";
import { handleHouseAction, applyDailyRent, enterHouseFor, leaveHouseFor } from "../server/houses.js";
import { canEnterHouse, canUseChest, houseByOwner, houseById, publicHouses, ensurePlayerHouse, apartmentByOwner } from "../shared/houses.js";

const ok = (name, cond, extra = "") => console.log(`${cond ? "✅" : "❌"} ${name}${extra ? " — " + extra : ""}${cond ? "" : " (FALHOU)"}`);
let fails = 0;
const check = (name, cond, extra) => { if (!cond) fails++; ok(name, cond, extra); };

const world = createWorldState("TMPH2", { slots: 1 });
const room = { world, players: new Map(), dirty: false, roomCode: "TMPH2", houseRequests: new Map(), reqSeq: 0 };
const notes = [];
const io = { sockets: { sockets: new Map() } };
const mkPlayer = (name, extra = {}) => ({
  id: "sock_" + name, username: name, x: 33, y: 33.9, inventory: { madeira: 30, pedra: 20 }, gold: 5000,
  indoors: null, stats: {}, ...extra,
});
const ctxFor = (player) => ({
  io, room, player,
  broadcast: () => {}, emitSelf: () => {}, notify: (msg) => notes.push(msg),
});

const ana = mkPlayer("Ana");
room.players.set(ana.id, ana);
ensurePlayerHouse(world, ana);
const own = houseByOwner(world, "Ana");
check("Ana tem casa própria gerada", !!own, own ? `${own.id} em ${own.x},${own.y}` : "sem casa");

// --- construção de casa para outro jogador ---
const beto = mkPlayer("Beto");
room.players.set(beto.id, beto);
const cara = mkPlayer("Cara");
room.players.set(cara.id, cara);
const before = ana.gold;
handleHouseAction(ctxFor(ana), "buildHouse", { forUser: "Cara" });
const caraHouse = houseByOwner(world, "Cara");
check("buildHouse cria casa no nome do jogador sem casa", !!caraHouse && cara.houseId === caraHouse.id,
  caraHouse ? `${caraHouse.id} p/ Cara` : "não criou");
check("buildHouse cobra o custo combinado", ana.gold === before - 1800, `gold ${before} → ${ana.gold}`);
check("buildHouse consome madeira e pedra", ana.inventory.madeira === 10 && ana.inventory.pedra === 5,
  `madeira=${ana.inventory.madeira} pedra=${ana.inventory.pedra}`);
ensurePlayerHouse(world, beto);

// --- permissões de entrada e baú ---
check("Dono entra na própria casa", canEnterHouse(own, "Ana"));
check("Visitante não entra sem permissão", !canEnterHouse(own, "Beto"));
own.access.Beto = { enter: true };
check("Permissão de entrada libera só a entrada", canEnterHouse(own, "Beto") && !canUseChest(own, "Beto"));
own.access.Beto.chest = true;
check("Permissão de baú é separada", canUseChest(own, "Beto"));
handleHouseAction(ctxFor(ana), "revokeAccess", { username: "Beto" });
check("revokeAccess remove entrada e baú", !canEnterHouse(own, "Beto") && !canUseChest(own, "Beto"));

// --- entrar/sair move o jogador para a porta certa ---
const ctxB = ctxFor(beto);
own.access.Beto = { enter: true };
enterHouseFor(ctxB, beto, own);
check("entrar leva para dentro (8,9)", beto.indoors === `casa:${own.id}` && beto.x === 8 && beto.y === 9, `${beto.indoors} ${beto.x},${beto.y}`);
leaveHouseFor(ctxB, beto);
check("sair devolve à porta da casa", beto.indoors === null && Math.hypot(beto.x - own.entry.x, beto.y - own.entry.y) < 0.01,
  `${beto.x},${beto.y} (porta ${own.entry.x},${own.entry.y})`);

// --- aluguel diário ---
beto.gold = 100;
const apt = (() => {
  handleHouseAction(ctxB, "rentApartment", {});
  return apartmentByOwner(world, "Beto");
})();
check("rentApartment cria apartamento no nome", !!apt && !!apt.apartment, apt ? apt.id : "sem apto");
world.day = 2;
const rentNotes = applyDailyRent(world, room, io);
check("Aluguel cobra $30 e zera dívida", beto.gold === 70 && beto.rentDebt === 0, `gold=${beto.gold} dívida=${beto.rentDebt}`);
beto.gold = 10; world.day = 3;
applyDailyRent(world, room, io);
check("Sem ouro, vira dívida de $30", beto.rentDebt === 30, `dívida=${beto.rentDebt}`);
check("Avisos de aluguel são gerados", rentNotes.length >= 1, rentNotes.join(" | "));

// --- transferir casa ---
const duda = mkPlayer("Duda");
room.players.set(duda.id, duda);
handleHouseAction(ctxFor(ana), "giveHouse", { toUser: "Duda" });
check("giveHouse transfere a propriedade", houseByOwner(world, "Duda")?.id === own.id && !houseByOwner(world, "Ana"),
  houseByOwner(world, "Duda")?.id || "não transferiu");
handleHouseAction(ctxFor(duda), "giveHouse", { toUser: "Cara" });
check("giveHouse recusa quem já tem casa", houseByOwner(world, "Cara")?.id === caraHouse.id,
  houseByOwner(world, "Cara")?.id || "sumiu");
check("Lista pública não vaza baú/acesso", publicHouses(world).every((h) => !("chest" in h) && !("access" in h)));

console.log(fails === 0 ? "\n🎉 CASAS OK" : `\n⚠️ ${fails} falha(s)`);
process.exit(fails === 0 ? 0 : 1);
