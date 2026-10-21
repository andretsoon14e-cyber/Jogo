import { ITEM_INFO } from "../shared/constants.js";
import { BANK } from "../shared/bank.js";
import { persistPlayer } from "./rooms.js";

function pushHistory(player, text) {
  player.bankHistory ||= [];
  player.bankHistory.push({ at: Date.now(), text });
  if (player.bankHistory.length > 40) player.bankHistory.shift();
}

function emitBank(player, socket) {
  socket.emit("bankUpdate", {
    balance: player.bankBalance ?? 0,
    cash: player.gold ?? 0,
    loan: player.loan || null,
    history: (player.bankHistory || []).slice(-20),
  });
}

export function handleBankAction(ctx, type, data) {
  // Só dentro do banco? No vale, próximo ao banco; dentro não precisa (abstração)
  // Permitimos em qualquer lugar se já tiver conta, mas preferimos avisar.
  switch (type) {
    case "bankDeposit":
      return bankDeposit(ctx, data);
    case "bankWithdraw":
      return bankWithdraw(ctx, data);
    case "bankTransfer":
      return bankTransfer(ctx, data);
    case "bankLoan":
      return bankLoan(ctx, data);
    case "bankPayLoan":
      return bankPayLoan(ctx, data);
    case "requestBank":
      return requestBank(ctx);
    default:
      return undefined;
  }
}

function bankDeposit(ctx, data) {
  const { player, socket } = ctx;
  const amount = Math.max(1, Math.min(50000, parseInt(data.amount, 10) || 0));
  if (!amount) return ctx.notify("Informe um valor.", "error");
  if ((player.gold || 0) < amount) return ctx.notify("Dinheiro insuficiente na carteira.", "error");
  player.gold -= amount;
  player.bankBalance = (player.bankBalance || 0) + amount;
  pushHistory(player, `+ Depósito $${amount} → saldo $${player.bankBalance}`);
  ctx.emitSelf("goldUpdate", player.gold);
  emitBank(player, socket);
  ctx.notify(`💳 Depósito de $${amount} realizado. Saldo: $${player.bankBalance}.`, "success");
  ctx.room.dirty = true;
  persistPlayer(ctx.room.world, player);
}

function bankWithdraw(ctx, data) {
  const { player, socket } = ctx;
  const amount = Math.max(1, Math.min(50000, parseInt(data.amount, 10) || 0));
  if (!amount) return ctx.notify("Informe um valor.", "error");
  if ((player.bankBalance || 0) < amount) return ctx.notify("Saldo bancário insuficiente.", "error");
  player.bankBalance -= amount;
  player.gold += amount;
  pushHistory(player, `− Saque $${amount} → saldo $${player.bankBalance}`);
  ctx.emitSelf("goldUpdate", player.gold);
  emitBank(player, socket);
  ctx.notify(`🏧 Saque de $${amount}. Carteira: $${player.gold}.`, "success");
  ctx.room.dirty = true;
  persistPlayer(ctx.room.world, player);
}

function bankTransfer(ctx, data) {
  const { player, room, socket } = ctx;
  const toName = String(data.to || "").trim();
  const amount = Math.max(1, Math.min(BANK.maxTransfer, parseInt(data.amount, 10) || 0));
  if (!toName) return ctx.notify("Informe o nome do destinatário.", "error");
  if (amount <= 0) return ctx.notify("Valor inválido.", "error");
  if ((player.bankBalance || 0) < amount) return ctx.notify("Saldo insuficiente.", "error");
  if (toName.toLowerCase() === player.username.toLowerCase())
    return ctx.notify("Você não pode transferir para si mesmo.", "error");

  // Procura destinatário online primeiro
  let target = [...room.players.values()].find((p) => p.username.toLowerCase() === toName.toLowerCase());
  let worldState = null;
  if (target) {
    // online
    target.bankBalance = (target.bankBalance || 0) + amount;
    target.bankHistory ||= [];
    target.bankHistory.push({ at: Date.now(), text: `+ Recebido $${amount} de ${player.username} → saldo $${target.bankBalance}` });
    const s = ctx.io.sockets.sockets.get(target.id);
    if (s) {
      s.emit("goldUpdate", target.gold);
      s.emit("bankUpdate", { balance: target.bankBalance, cash: target.gold, loan: target.loan || null, history: target.bankHistory.slice(-20) });
      s.emit("notify", { msg: `💸 Você recebeu $${amount} de ${player.username}!`, type: "success" });
    }
    if (target.account) persistPlayer(room.world, target);
  } else {
    // offline, mas com conta salva
    const saved = room.world.playerStates[toName] || Object.values(room.world.playerStates).find((st) => st.username?.toLowerCase() === toName.toLowerCase());
    if (!saved) return ctx.notify("Jogador não encontrado (ele precisa já ter entrado neste mundo com conta).", "error");
    saved.bankBalance = (saved.bankBalance || 0) + amount;
    saved.bankHistory ||= [];
    saved.bankHistory.push({ at: Date.now(), text: `+ Recebido $${amount} de ${player.username} → saldo $${saved.bankBalance}` });
    // persiste
    room.world.playerStates[saved.username] = saved;
    ctx.notify(`💸 Transferência para ${saved.username} (offline) realizada.`, "success");
  }
  player.bankBalance -= amount;
  pushHistory(player, `− Transferência $${amount} para ${toName} → saldo $${player.bankBalance}`);
  emitBank(player, socket);
  ctx.emitSelf("goldUpdate", player.gold);
  ctx.notify(`📤 Você enviou $${amount} para ${target ? target.username : toName}.`, "success");
  ctx.room.dirty = true;
  persistPlayer(room.world, player);
}

function bankLoan(ctx, data) {
  const { player, socket } = ctx;
  if (player.loan) return ctx.notify("Você já tem um empréstimo ativo. Pague-o primeiro.", "error");
  const amount = Math.max(200, Math.min(BANK.maxLoan, parseInt(data.amount, 10) || 0));
  if (!amount) return ctx.notify("Valor de empréstimo inválido.", "error");
  player.loan = { principal: amount, balance: amount, rate: BANK.loanInterestPct, since: Date.now(), dueDay: (ctx.room.world.day || 1) + 14 };
  player.gold += amount;
  player.bankBalance = (player.bankBalance || 0) + 0; // não mexe no banco, vai direto na carteira
  pushHistory(player, `+ Empréstimo $${amount} (juros ${BANK.loanInterestPct}%/estação)`);
  ctx.emitSelf("goldUpdate", player.gold);
  emitBank(player, socket);
  ctx.notify(`🏦 Empréstimo de $${amount} concedido. Você recebe na hora e paga depois pelo banco.`, "success");
  ctx.room.dirty = true;
  persistPlayer(ctx.room.world, player);
}

function bankPayLoan(ctx, data) {
  const { player, socket } = ctx;
  const amount = Math.max(1, Math.min(50000, parseInt(data.amount, 10) || 0));
  if (!player.loan) return ctx.notify("Você não tem empréstimo.", "error");
  if (!amount) return ctx.notify("Informe um valor.", "error");
  // pode pagar com carteira OU saldo bancário
  const from = data.from === "bank" ? "bank" : "cash";
  const available = from === "bank" ? player.bankBalance || 0 : player.gold || 0;
  if (available < amount) return ctx.notify(`Saldo em ${from === "bank" ? "banco" : "carteira"} insuficiente.`, "error");
  if (from === "bank") player.bankBalance -= amount;
  else player.gold -= amount;
  player.loan.balance -= amount;
  pushHistory(player, `− Pagamento empréstimo $${amount} (${from}) → restante $${Math.max(0, player.loan.balance)}`);
  if (player.loan.balance <= 0) {
    ctx.notify(`✅ Empréstimo quitado!`, "success");
    player.loan = null;
  } else {
    ctx.notify(`💳 Pagou $${amount}. Falta $${player.loan.balance}.`, "success");
  }
  ctx.emitSelf("goldUpdate", player.gold);
  emitBank(player, socket);
  ctx.room.dirty = true;
  persistPlayer(ctx.room.world, player);
}

function requestBank(ctx) {
  emitBank(ctx.player, ctx.socket);
}
