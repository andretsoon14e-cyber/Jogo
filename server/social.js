import { FRIENDSHIP, NPC_BY_ID } from "../shared/constants.js";
import { ROMANCEABLE, REL_STAGES, stageFor, KIDS } from "../shared/social.js";
import { persistPlayer } from "./rooms.js";

function relState(player, npcId) {
  player.relationship ||= {};
  if (!player.relationship[npcId]) {
    player.relationship[npcId] = { stage: "stranger", sinceDay: 0, events: [], datingSince: null, marriedSince: null };
  }
  return player.relationship[npcId];
}

function ptsFor(player, npcId) {
  return player.friendship?.[npcId] || 0;
}

function maybeAdvanceStage(player, npcId) {
  const pts = ptsFor(player, npcId);
  const cur = stageFor(pts);
  const rel = relState(player, npcId);
  // não avança automaticamente para dating/engaged/married — precisa de ação
  if (["dating","engaged","married"].includes(cur.id)) return rel;
  if (cur.min > (REL_STAGES[rel.stage]?.min ?? 0)) {
    rel.stage = cur.id;
  }
  return rel;
}

export function handleSocialAction(ctx, type, data) {
  switch (type) {
    case "dialogChoice": return dialogChoice(ctx, data);
    case "hug": return doHug(ctx, data);
    case "kiss": return doKiss(ctx, data);
    case "proposeDating": return proposeDating(ctx, data);
    case "proposeMarriage": return proposeMarriage(ctx, data);
    case "confirmMarriage": return confirmMarriage(ctx, data);
    case "adoptKid": return adoptKid(ctx, data);
    case "buyHouse": return buyHouse(ctx, data);
    case "placeFurniture": return placeFurniture(ctx, data);
    case "removeFurniture": return removeFurniture(ctx, data);
    case "requestSocial": return sendSocial(ctx);
    default: return undefined;
  }
}

function dialogChoice(ctx, data) {
  const { player, room } = ctx;
  const npc = NPC_BY_ID[data.npcId];
  if (!npc) return;
  const choice = data.choiceId || "howday";
  const delta = Math.max(1, Math.min(6, parseInt(data.delta, 10) || 2));
  // cooldown leve: só 1 conversa com bônus por minuto? simplificado
  player.friendship ||= {};
  const before = player.friendship[npc.id] || 0;
  player.friendship[npc.id] = Math.min(FRIENDSHIP.MAX, before + delta);
  player.stats.friendship = Object.values(player.friendship).reduce((a,b)=>a+b,0);
  maybeAdvanceStage(player, npc.id);
  ctx.emitSelf("friendshipUpdate", player.friendship);
  ctx.emitSelf("socialUpdate", buildSnapshot(player));
  const stage = stageFor(player.friendship[npc.id]);
  ctx.notify(`${npc.name}: "${choice}" ${stage.icon} +${delta} amizade (${player.friendship[npc.id]}/100 — ${stage.label})`, "success");
  room.dirty = true;
  persistPlayer(room.world, player);
}

function doHug(ctx, data) {
  const npc = NPC_BY_ID[data.npcId];
  if (!npc) return;
  const pts = ptsFor(ctx.player, npc.id);
  if (pts < 35) return ctx.notify(`${npc.name} ainda não se sente à vontade para abraços. Converse mais!`, "error");
  const gain = 2;
  ctx.player.friendship[npc.id] = Math.min(FRIENDSHIP.MAX, pts + gain);
  ctx.emitSelf("friendshipUpdate", ctx.player.friendship);
  ctx.emitSelf("socialUpdate", buildSnapshot(ctx.player));
  ctx.broadcast("notifyAll", { msg: `🤗 ${ctx.player.username} abraçou ${npc.name}!`, type: "info" });
  ctx.notify(`🤗 Abraço caloroso com ${npc.name}! +${gain}`, "success");
  ctx.room.dirty = true;
  persistPlayer(ctx.room.world, ctx.player);
}

function doKiss(ctx, data) {
  const npc = NPC_BY_ID[data.npcId];
  if (!npc) return;
  const rel = relState(ctx.player, npc.id);
  const pts = ptsFor(ctx.player, npc.id);
  if (!ROMANCEABLE.has(npc.id)) return ctx.notify(`${npc.name} prefere manter amizade.`, "error");
  if (!["dating","engaged","married"].includes(rel.stage)) return ctx.notify(`Vocês precisam estar namorando para esse gesto.`, "error");
  if (pts < 85) return ctx.notify(`O momento ainda não é o ideal... fortaleça o vínculo.`, "error");
  ctx.player.friendship[npc.id] = Math.min(FRIENDSHIP.MAX, pts + 1);
  ctx.emitSelf("friendshipUpdate", ctx.player.friendship);
  ctx.notify(`💋 Momento especial com ${npc.name}!`, "success");
  ctx.room.dirty = true;
  persistPlayer(ctx.room.world, ctx.player);
}

function proposeDating(ctx, data) {
  const npc = NPC_BY_ID[data.npcId];
  if (!npc) return;
  if (!ROMANCEABLE.has(npc.id)) return ctx.notify(`${npc.name} não está disponível para romance.`, "error");
  const pts = ptsFor(ctx.player, npc.id);
  if (pts < 65) return ctx.notify(`${npc.name}: "Acho você legal, mas ainda não é a hora..." (precisa 65 pts)`, "error");
  const rel = relState(ctx.player, npc.id);
  if (["dating","engaged","married"].includes(rel.stage)) return ctx.notify(`Vocês já estão em um relacionamento!`, "error");
  rel.stage = "dating";
  rel.datingSince = ctx.room.world.day;
  rel.events.push({ at: Date.now(), kind: "dating", desc: `Começaram a namorar no dia ${ctx.room.world.day}` });
  ctx.player.friendship[npc.id] = Math.min(FRIENDSHIP.MAX, pts + 8);
  ctx.emitSelf("friendshipUpdate", ctx.player.friendship);
  ctx.emitSelf("socialUpdate", buildSnapshot(ctx.player));
  ctx.notify(`💕 ${npc.name} aceitou seu convite para namorar!`, "success");
  ctx.broadcast("notifyAll", { msg: `💘 ${ctx.player.username} e ${npc.name} estão namorando!`, type: "success" });
  ctx.room.dirty = true;
  persistPlayer(ctx.room.world, ctx.player);
}

function proposeMarriage(ctx, data) {
  const npc = NPC_BY_ID[data.npcId];
  if (!npc) return;
  if (!ROMANCEABLE.has(npc.id)) return ctx.notify(`Esse personagem não é casável.`, "error");
  const rel = relState(ctx.player, npc.id);
  if (rel.stage !== "dating") return ctx.notify(`Vocês precisam estar namorando antes de noivar.`, "error");
  const pts = ptsFor(ctx.player, npc.id);
  if (pts < 88) return ctx.notify(`Fortaleçam o namoro antes do pedido (88 pts). Atual: ${pts}.`, "error");
  // custo do anel / preparativo
  if ((ctx.player.gold || 0) < 1200) return ctx.notify(`O pedido precisa de um anel: $1200.`, "error");
  ctx.player.gold -= 1200;
  rel.stage = "engaged";
  rel.events.push({ at: Date.now(), kind: "engaged", desc: `Noivado no dia ${ctx.room.world.day}` });
  ctx.emitSelf("goldUpdate", ctx.player.gold);
  ctx.emitSelf("socialUpdate", buildSnapshot(ctx.player));
  ctx.notify(`💍 ${npc.name} disse SIM! Vocês estão noivos. Agora escolham a data na Igreja.`, "success");
  ctx.broadcast("notifyAll", { msg: `💍 ${ctx.player.username} e ${npc.name} ficaram noivos!`, type: "success" });
  ctx.room.dirty = true;
  persistPlayer(ctx.room.world, ctx.player);
}

function confirmMarriage(ctx, data) {
  const npc = NPC_BY_ID[data.npcId];
  if (!npc) return;
  const rel = relState(ctx.player, npc.id);
  if (rel.stage !== "engaged") return ctx.notify(`Faça o pedido de noivado primeiro.`, "error");
  // cerimônia: custo simbólico + exige casa
  if ((ctx.player.ownedHouses||[]).length === 0 && !ctx.player.furniture) {
    // não bloqueante, só avisa
  }
  rel.stage = "married";
  rel.marriedSince = ctx.room.world.day;
  rel.events.push({ at: Date.now(), kind: "married", desc: `Casaram no dia ${ctx.room.world.day}` });
  // bônus: +10 amizade + evento familiar
  ctx.player.friendship[npc.id] = Math.min(FRIENDSHIP.MAX, (ctx.player.friendship[npc.id]||0) + 10);
  ctx.emitSelf("friendshipUpdate", ctx.player.friendship);
  ctx.emitSelf("socialUpdate", buildSnapshot(ctx.player));
  ctx.broadcast("notifyAll", { msg: `💒 Casamento! ${ctx.player.username} e ${npc.name} se casaram no dia ${ctx.room.world.day}!`, type: "success" });
  ctx.notify(`💒 Cerimônia linda na Igreja! Vocês agora são uma família.`, "success");
  ctx.room.dirty = true;
  persistPlayer(ctx.room.world, ctx.player);
}

function adoptKid(ctx, data) {
  const { player } = ctx;
  if (!player.relationship || !Object.values(player.relationship).some(r=>r.stage==="married")) {
    return ctx.notify(`Você precisa estar casado para formar família aqui.`, "error");
  }
  if (player.family) return ctx.notify(`Sua família já tem uma criança: ${player.family.kidName}.`, "error");
  if ((player.gold||0) < 800) return ctx.notify(`Para preparar o quarto da criança custa $800.`, "error");
  player.gold -= 800;
  const kid = KIDS[Math.floor(Math.random()*KIDS.length)];
  player.family = { kidId: kid.id, kidName: kid.name, trait: kid.trait, sinceDay: ctx.room.world.day, stage: "baby" };
  ctx.emitSelf("goldUpdate", player.gold);
  ctx.emitSelf("socialUpdate", buildSnapshot(player));
  ctx.broadcast("notifyAll", { msg: `👶 ${player.username} aumentou a família! Bem-vindo(a) ${kid.name}!`, type: "success" });
  ctx.notify(`👶 ${kid.name} chegou! ${kid.trait}. Prepare a casa.`, "success");
  ctx.room.dirty = true;
  persistPlayer(ctx.room.world, player);
}

const HOUSE_CATALOG = [
  { id: "casa_simples", name: "Casa Simples", desc: "1 quarto, aconchegante", price: 1500, icon: "🏠" },
  { id: "casa_familia", name: "Casa de Família", desc: "2 quartos + quintal", price: 3200, icon: "🏡" },
  { id: "chacara", name: "Chácara do Vale", desc: "Grande, com anexo", price: 6000, icon: "🏘️" },
];

function buyHouse(ctx, data) {
  const id = String(data.houseId||"");
  const house = HOUSE_CATALOG.find(h=>h.id===id);
  if (!house) return ctx.notify("Casa inválida.", "error");
  if ((ctx.player.ownedHouses||[]).includes(id)) return ctx.notify("Você já possui esta casa.", "error");
  if ((ctx.player.gold||0) < house.price) return ctx.notify(`Custa $${house.price}. Você tem $${ctx.player.gold}.`, "error");
  ctx.player.gold -= house.price;
  ctx.player.ownedHouses ||= [];
  ctx.player.ownedHouses.push(id);
  ctx.emitSelf("goldUpdate", ctx.player.gold);
  ctx.emitSelf("socialUpdate", buildSnapshot(ctx.player));
  ctx.notify(`🏠 Você comprou ${house.name}!`, "success");
  ctx.room.dirty = true;
  persistPlayer(ctx.room.world, ctx.player);
}

const FURNITURE_CATALOG = [
  { id: "cama", name: "Cama", price: 220, icon: "🛏️" },
  { id: "mesa", name: "Mesa", price: 120, icon: "🪵" },
  { id: "cadeira", name: "Cadeira", price: 80, icon: "🪑" },
  { id: "estante", name: "Estante", price: 180, icon: "📚" },
  { id: "tapete", name: "Tapete", price: 60, icon: "🧶" },
  { id: "sofa", name: "Sofá", price: 260, icon: "🛋️" },
  { id: "quadro", name: "Quadro", price: 90, icon: "🖼️" },
];

function placeFurniture(ctx, data) {
  const id = String(data.itemId||"");
  const item = FURNITURE_CATALOG.find(f=>f.id===id);
  if (!item) return;
  // compra: desconta ouro; coloca em posição livre do interior
  if ((ctx.player.gold||0) < item.price) return ctx.notify(`Custa $${item.price}.`, "error");
  ctx.player.gold -= item.price;
  ctx.player.furniture ||= [];
  const x = Math.max(0.5, Math.min(14, Number(data.x)||4));
  const y = Math.max(0.5, Math.min(10, Number(data.y)||4));
  ctx.player.furniture.push({ id: item.id, icon: item.icon, name: item.name, x, y, rot: 0, at: Date.now() });
  ctx.emitSelf("goldUpdate", ctx.player.gold);
  ctx.emitSelf("furnitureUpdate", ctx.player.furniture);
  ctx.notify(`🪑 ${item.name} colocado!`, "success");
  ctx.room.dirty = true;
  persistPlayer(ctx.room.world, ctx.player);
}

function removeFurniture(ctx, data) {
  const idx = parseInt(data.index,10);
  if (!Number.isFinite(idx)) return;
  ctx.player.furniture ||= [];
  if (idx<0|| idx>=ctx.player.furniture.length) return;
  const removed = ctx.player.furniture.splice(idx,1)[0];
  // reembolso parcial
  const cat = FURNITURE_CATALOG.find(f=>f.id===removed.id);
  const refund = cat ? Math.floor(cat.price*0.6) : 0;
  ctx.player.gold += refund;
  ctx.emitSelf("goldUpdate", ctx.player.gold);
  ctx.emitSelf("furnitureUpdate", ctx.player.furniture);
  ctx.notify(`${removed.icon} removido. Reembolso $${refund}.`, "info");
  ctx.room.dirty = true;
  persistPlayer(ctx.room.world, ctx.player);
}

function buildSnapshot(player) {
  const rel = {};
  for (const [npcId, st] of Object.entries(player.relationship||{})) {
    const pts = player.friendship?.[npcId]||0;
    rel[npcId] = { ...st, pts, stageLabel: (REL_STAGES[st.stage]?.label)||st.stage, icon: REL_STAGES[st.stage]?.icon||"👋" };
  }
  return {
    relationships: rel,
    family: player.family||null,
    ownedHouses: player.ownedHouses||[],
    furniture: player.furniture||[],
    houseCatalog: HOUSE_CATALOG,
    furnitureCatalog: FURNITURE_CATALOG,
  };
}

function sendSocial(ctx) {
  ctx.socket.emit("socialUpdate", buildSnapshot(ctx.player));
  ctx.socket.emit("furnitureUpdate", ctx.player.furniture||[]);
}

export { buildSnapshot as socialSnapshot, HOUSE_CATALOG, FURNITURE_CATALOG };
