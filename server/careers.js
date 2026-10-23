import {
  JOBS, RECIPES, recipeById, canCook, totalDaysElapsed, weekdayIndex, isWorkday,
  isVacationDay, isOnShiftNow, jobShiftHours, QUEST_CHAINS, COOP_MISSIONS, TRANSPORT,
  REGION_DEFS, REGION_NPCS, fmtHour,
} from "../shared/careers.js";
import { BUILDINGS, ITEM_INFO, TILE, ALL_NPCS, NPC_BY_ID, COMMUNITY_PROJECTS } from "../shared/constants.js";
import { persistPlayer } from "./rooms.js";

// ------------------------------------------------------------
// Utilidades
// ------------------------------------------------------------
export function npcListFor(region) {
  return ALL_NPCS.filter((n) => (n.region || "vale") === region);
}

export function buildingsFor(region) {
  if (region === "vale") return BUILDINGS;
  return REGION_DEFS[region]?.buildings || [];
}

function nearBuilding(player, buildingId, radius = 4.5) {
  const b = buildingsFor(player.region || "vale").find((x) => x.id === buildingId);
  if (!b) return false;
  const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
  return Math.hypot(cx - player.x, cy - player.y) <= Math.max(radius, b.w);
}

export function currentJob(player) {
  if (!player.job?.id) return null;
  return JOBS[player.job.id] || null;
}

export function jobSnapshot(player, world) {
  const job = currentJob(player);
  if (!job) return { job: null, status: null };
  const day = world.day, season = world.seasonIndex;
  return {
    job: { id: job.id, name: job.name, icon: job.icon, employer: job.employer },
    shift: job.shift,
    workdays: job.workdays,
    wagePerHour: job.wagePerHour,
    vacationDays: job.vacationDays?.[season] || [],
    isWorkday: isWorkday(job, day, season),
    isVacation: isVacationDay(job, day, season),
    inShiftWindow: isOnShiftNow(job, world.time),
    weekday: weekdayIndex(day, season),
    hiredDay: player.job.hiredDay,
    shiftsWorked: player.job.shiftsWorked || 0,
    totalEarned: player.job.totalEarned || 0,
    reputation: player.job.reputation ?? 50,
  };
}

/** Progresso das missões em cadeia calculado a partir das estatísticas. */
export function chainSnapshot(player) {
  return QUEST_CHAINS.map((chain) => {
    const done = (player.chainsDone || []).includes(chain.id);
    const steps = chain.steps.map((step) => {
      const current = step.type === "talk"
        ? (player.talkCount?.[step.target] || 0)
        : (player.stats?.[step.stat] || 0);
      return {
        desc: step.desc,
        type: step.type,
        need: step.need,
        current: Math.min(current, step.need),
        done: current >= step.need,
      };
    });
    const firstPending = steps.findIndex((s) => !s.done);
    return {
      id: chain.id,
      title: chain.title,
      icon: chain.icon,
      desc: chain.desc,
      npc: chain.npc,
      steps,
      currentStep: done ? steps.length : firstPending === -1 ? steps.length : firstPending,
      allDone: firstPending === -1,
      claimed: done,
      reward: chain.reward,
    };
  });
}

export function coopSnapshot(world) {
  const coop = world.coop || { progress: {}, completed: [] };
  return COOP_MISSIONS.map((m) => ({
    ...m,
    progress: Math.min(m.goal, coop.progress?.[m.id] || 0),
    completed: (coop.completed || []).includes(m.id),
  }));
}

/** Soma progresso nas missões cooperativas da semana e recompensa a todos. */
export function recordCoop(room, stat, amount, io) {
  if (!amount) return;
  const world = room.world;
  world.coop ||= { week: 0, progress: {}, completed: [] };
  world.coop.progress ||= {};
  world.coop.completed ||= [];
  for (const mission of COOP_MISSIONS) {
    if (mission.stat !== stat) continue;
    if (world.coop.completed.includes(mission.id)) continue;
    world.coop.progress[mission.id] = (world.coop.progress[mission.id] || 0) + amount;
    const now = world.coop.progress[mission.id];
    if (now >= mission.goal) {
      world.coop.completed.push(mission.id);
      for (const p of room.players.values()) {
        p.gold += mission.reward;
        if (!p.account) continue;
        persistPlayer(world, p);
        const s = io?.sockets?.sockets?.get(p.id);
        if (s) s.emit("goldUpdate", p.gold);
      }
      if (io) {
        io.to(room.roomCode).emit("notifyAll", {
          msg: `🤝 Missão cooperativa concluída: ${mission.name}! Todos receberam $${mission.reward}.`,
          type: "success",
        });
      }
    }
  }
  if (io) io.to(room.roomCode).emit("coopUpdate", coopSnapshot(world));
  room.dirty = true;
}

/** Chamado ao amanhecer: férias remuneradas + reset semanal das missões coop. */
export function dailyCareerEffects(room, io) {
  const world = room.world;
  const notes = [];
  const day = world.day, season = world.seasonIndex;

  for (const p of room.players.values()) {
    const job = currentJob(p);
    if (!job) continue;
    const vacation = isVacationDay(job, day, season);
    if (vacation) {
      const pay = Math.round(job.wagePerHour * jobShiftHours(job) * 0.5);
      p.gold += pay;
      p.vacationPay = (p.vacationPay || 0) + pay;
      p.job.reputation = Math.min(100, (p.job.reputation ?? 50) + 1);
      if (p.account) persistPlayer(world, p);
      const s = io?.sockets?.sockets?.get(p.id);
      if (s) {
        s.emit("goldUpdate", p.gold);
        s.emit("notify", { msg: `🌴 Férias remuneradas: +$${pay} do ${job.employer}.`, type: "success" });
      }
      notes.push(`Férias de ${p.username}: +$${pay}`);
    }
  }

  const week = Math.floor(totalDaysElapsed(day, season) / 7);
  world.coop ||= { week, progress: {}, completed: [] };
  if (world.coop.week !== week) {
    world.coop.week = week;
    world.coop.progress = {};
    world.coop.completed = [];
    io?.to(room.roomCode).emit("coopUpdate", coopSnapshot(world));
    notes.push("Nova semana de missões cooperativas!");
  }
  return notes;
}

// ------------------------------------------------------------
// Ações
// ------------------------------------------------------------
export function handleCareerAction(ctx, type, data) {
  switch (type) {
    case "applyJob": return applyJob(ctx, data);
    case "quitJob": return quitJob(ctx);
    case "startShift": return startShift(ctx, data);
    case "finishShift": return finishShift(ctx, data);
    case "cook": return cook(ctx, data);
    case "eat": return eat(ctx, data);
    case "setIndoor": return setIndoor(ctx, data);
    case "travel": return travel(ctx, data);
    case "claimChain": return claimChain(ctx, data);
    default: return undefined;
  }
}

function applyJob(ctx, data) {
  const { player, room } = ctx;
  const job = JOBS[data.jobId];
  if (!job) return;
  if (player.job?.id === job.id) return ctx.notify("Você já trabalha aqui.", "error");
  if (player.job) return ctx.notify("Peça demissão do emprego atual antes de assumir outro.", "error");
  if (!nearBuilding(player, job.building) && player.indoors !== job.building) {
    return ctx.notify(`Vá até o local de trabalho (${job.employer}) para se candidatar.`, "error");
  }
  player.job = {
    id: job.id,
    hiredDay: room.world.day,
    hiredSeason: room.world.seasonIndex,
    shiftsWorked: 0,
    totalEarned: 0,
    reputation: 50,
  };
  ctx.emitSelf("jobUpdate", jobSnapshot(player, room.world));
  ctx.emitSelf("notify", {
    msg: `💼 Contratado como ${job.name}! Turno ${fmtHour(job.shift.start)}–${fmtHour(job.shift.end)}, $${job.wagePerHour}/h.`,
    type: "success",
  });
  ctx.room.dirty = true;
  persistPlayer(room.world, player);
}

function quitJob(ctx) {
  const { player, room } = ctx;
  if (!player.job) return ctx.notify("Você não tem emprego.", "error");
  const job = currentJob(player);
  player.job = null;
  player.shift = null;
  ctx.emitSelf("jobUpdate", jobSnapshot(player, room.world));
  ctx.emitSelf("notify", { msg: `📄 Você pediu demissão de ${job?.name || "seu emprego"}.`, type: "info" });
  room.dirty = true;
  persistPlayer(room.world, player);
}

function startShift(ctx, data) {
  const { player, room, io } = ctx;
  const job = currentJob(player);
  if (!job) return ctx.notify("Procure um emprego primeiro (quadro de empregos).", "error");
  const world = room.world;
  if (isVacationDay(job, world.day, world.seasonIndex)) {
    return ctx.notify("🌴 Você está de férias hoje. Aproveite o descanso!", "error");
  }
  if (!isWorkday(job, world.day, world.seasonIndex)) {
    return ctx.notify("😴 Hoje é sua folga. Volte no próximo dia de trabalho.", "error");
  }
  if (!isOnShiftNow(job, world.time)) {
    return ctx.notify(`⏰ Seu turno é das ${fmtHour(job.shift.start)} às ${fmtHour(job.shift.end)}.`, "error");
  }
  if (!nearBuilding(player, job.building) && player.indoors !== job.building) {
    return ctx.notify(`Vá até ${job.employer} para bater o ponto.`, "error");
  }
  if (player.shift) return ctx.notify("Você já está em um turno.", "error");
  player.shift = {
    jobId: job.id,
    startedAt: Date.now(),
    startDay: world.day,
    startSeason: world.seasonIndex,
    customers: 0,
    bestStreak: 0,
  };
  const s = io?.sockets?.sockets?.get(player.id);
  s?.emit("shiftStarted", {
    job: {
      id: job.id, name: job.name, employer: job.employer, icon: job.icon,
      tasks: job.tasks, verb: job.verb, wagePerHour: job.wagePerHour,
      hours: jobShiftHours(job),
    },
  });
}

function finishShift(ctx, data) {
  const { player, room } = ctx;
  const job = currentJob(player);
  if (!job || !player.shift || player.shift.jobId !== job.id) {
    return ctx.notify("Nenhum turno em andamento.", "error");
  }
  const elapsed = Date.now() - player.shift.startedAt;
  const served = Math.max(0, Math.min(12, parseInt(data.served, 10) || 0));
  const total = Math.max(1, Math.min(12, parseInt(data.total, 10) || 8));
  if (served === 0) {
    player.shift = null;
    return ctx.notify("Turno encerrado sem atender ninguém. Sem pagamento hoje.", "error");
  }
  if (elapsed < 4000) return ctx.notify("Termine o turno no jogo primeiro.", "error");

  const base = job.wagePerHour * jobShiftHours(job);
  const accuracy = Math.min(1, served / total);
  const tip = Math.round(base * 0.3 * accuracy);
  const repGain = accuracy >= 0.8 ? 4 : accuracy >= 0.5 ? 2 : 1;
  const pay = Math.round(base + tip);
  player.gold += pay;
  player.job.shiftsWorked = (player.job.shiftsWorked || 0) + 1;
  player.job.totalEarned = (player.job.totalEarned || 0) + pay;
  player.job.reputation = Math.min(100, (player.job.reputation ?? 50) + repGain);
  player.stats.shifts = (player.stats.shifts || 0) + 1;
  player.shift = null;

  ctx.emitSelf("goldUpdate", player.gold);
  ctx.emitSelf("jobUpdate", jobSnapshot(player, room.world));
  ctx.emitSelf("statsUpdate", { stats: player.stats, claimedQuests: player.claimedQuests });
  ctx.emitSelf("skillsUpdate", { level: player.level, xp: player.xp });
  ctx.emitSelf("notify", {
    msg: `💵 Turno concluído! Salário $${base} + gorjeta $${tip} = $${pay}.`,
    type: "success",
  });
  ctx.broadcast("notifyAll", { msg: `💼 ${player.username} terminou o turno de ${job.short}.`, type: "info" });
  room.dirty = true;
  persistPlayer(room.world, player);
}

function cook(ctx, data) {
  const { player, room } = ctx;
  const recipe = recipeById(data.recipeId);
  if (!recipe) return;
  if (!["casa_player", "taverna"].includes(player.indoors)) {
    return ctx.notify("Entre na sua casa (ou na taverna) para cozinhar.", "error");
  }
  const check = canCook(recipe, player.inventory, player.level.cooking || 1);
  if (!check.ok) return ctx.notify(check.error, "error");
  for (const [item, qty] of Object.entries(recipe.ingredients)) {
    player.inventory[item] -= qty;
    if (player.inventory[item] <= 0) delete player.inventory[item];
  }
  player.inventory[recipe.id] = (player.inventory[recipe.id] || 0) + 1;
  player.stats.cooked = (player.stats.cooked || 0) + 1;
  // XP de culinária
  player.xp.cooking = (player.xp.cooking || 0) + recipe.xp;
  const need = (player.level.cooking || 1) * 100;
  if (player.xp.cooking >= need) {
    player.level.cooking = (player.level.cooking || 1) + 1;
    player.xp.cooking -= need;
    ctx.emitSelf("notify", { msg: `🍳 Culinária subiu para o nível ${player.level.cooking}!`, type: "success" });
  }
  ctx.emitSelf("inventoryUpdate", player.inventory);
  ctx.emitSelf("skillsUpdate", { level: player.level, xp: player.xp });
  ctx.emitSelf("statsUpdate", { stats: player.stats, claimedQuests: player.claimedQuests });
  ctx.emitSelf("notify", { msg: `${recipe.icon} Você preparou ${recipe.name}!`, type: "success" });
  room.dirty = true;
  persistPlayer(room.world, player);
}

function eat(ctx, data) {
  const { player } = ctx;
  const recipe = recipeById(data.recipeId);
  if (!recipe) return;
  if (!player.inventory[recipe.id]) return;
  player.inventory[recipe.id] -= 1;
  if (player.inventory[recipe.id] <= 0) delete player.inventory[recipe.id];
  // refeição dá um pequeno bônus de XP na habilidade da receita
  ctx.emitSelf("inventoryUpdate", player.inventory);
  ctx.emitSelf("notify", { msg: `${recipe.icon} Você saboreou ${recipe.name}. Que delícia!`, type: "success" });
}

function setIndoor(ctx, data) {
  const { player } = ctx;
  const buildingId = data.buildingId;
  if (!buildingId) {
    player.indoors = null;
    ctx.broadcast("playersUpdate", [...ctx.room.players.values()].map(publicPlayerSafe));
    return;
  }
  const allowed = ["casa_player", "mercado", "taverna", "carpintaria", "ferraria", "clinica", "prefeitura"];
  if (!allowed.includes(buildingId)) return;
  if (!nearBuilding(player, buildingId, 5.5)) return;
  player.indoors = buildingId;
  ctx.broadcast("playersUpdate", [...ctx.room.players.values()].map(publicPlayerSafe));
}

function publicPlayerSafe(p) {
  return {
    id: p.id, username: p.username, skin: p.skin, look: p.look || null, x: p.x, y: p.y, dir: p.dir,
    level: p.level, account: p.account, animals: p.stats?.animals || 0,
    region: p.region || "vale", indoors: p.indoors || null,
  };
}

function travel(ctx, data) {
  const { player, room } = ctx;
  const world = room.world;
  const to = String(data.to || "");
  if (!REGION_DEFS[to]) return ctx.notify("Destino inválido.", "error");
  if (player.region === to) return ctx.notify("Você já está aí.", "error");
  const from = player.region || "vale";

  // Descobrir qual transporte liga origem e destino
  let transport = null;
  if (from === "vale") {
    for (const t of Object.values(TRANSPORT)) {
      const region = REGION_DEFS[to];
      if (t.destinations.includes(to) && region?.portal === t.id) transport = t;
    }
  } else if (to === "vale") {
    const portal = REGION_DEFS[from]?.portal;
    transport = Object.values(TRANSPORT).find((t) => t.id === portal) || null;
  } else {
    return ctx.notify("Não há rota direta entre essas regiões. Volte ao vale primeiro.", "error");
  }
  if (!transport) return ctx.notify("Rota indisponível.", "error");

  const progress = world.communityProgress[transport.project] || 0;
  const goal = COMMUNITY_PROJECTS[transport.project]?.goal || 1;
  if (progress < goal) {
    return ctx.notify(
      `A rota para ${REGION_DEFS[to].name} ainda está fechada. Conclua o projeto "${COMMUNITY_PROJECTS[transport.project]?.name}" (${progress}/${goal}).`,
      "error"
    );
  }
  const originBuilding = from === "vale" ? transport.originBuilding : REGION_DEFS[from].buildings.find((b) => b.icon === "⛵" || b.icon === "✈️")?.id;
  if (originBuilding && !nearBuilding(player, originBuilding, 6)) {
    return ctx.notify(`Vá até o ponto de embarque (${transport.name}).`, "error");
  }
  if (transport.price && player.gold < transport.price) {
    return ctx.notify(`Passagem custa $${transport.price}.`, "error");
  }
  if (transport.price) {
    player.gold -= transport.price;
    ctx.emitSelf("goldUpdate", player.gold);
  }

  player.region = to;
  player.indoors = null;
  // posição de chegada
  const spawns = {
    vila: { x: 22, y: 19 }, ilha: { x: 20, y: 20 }, cidade: { x: 21, y: 19 }, vale: { x: 31.5, y: 44.5 },
  };
  const sp = spawns[to] || { x: 22, y: 20 };
  player.x = sp.x;
  player.y = sp.y;
  player.dir = "up";

  ctx.emitSelf("traveled", {
    region: to,
    x: player.x,
    y: player.y,
    regionDef: REGION_DEFS[to],
    tiles: to === "vale" ? world.tiles : world.regions[to]?.tiles,
  });
  ctx.broadcast("playerRegionChanged", { id: player.id, region: to, x: player.x, y: player.y });
  ctx.emitSelf("notify", { msg: `${transport.icon} Você chegou em ${REGION_DEFS[to].name}!`, type: "success" });
  room.dirty = true;
  persistPlayer(world, player);
}

function claimChain(ctx, data) {
  const { player, room } = ctx;
  const chain = QUEST_CHAINS.find((c) => c.id === data.chainId);
  if (!chain) return;
  if ((player.chainsDone || []).includes(chain.id)) return ctx.notify("Recompensa já resgatada.", "error");
  const snap = chainSnapshot(player).find((c) => c.id === chain.id);
  if (!snap?.allDone) return ctx.notify("Ainda faltam etapas nessa missão.", "error");
  player.chainsDone = [...(player.chainsDone || []), chain.id];
  player.gold += chain.reward.gold;
  const skill = chain.reward.skill;
  if (skill) {
    player.xp[skill] = (player.xp[skill] || 0) + (chain.reward.xp || 0);
    const need = (player.level[skill] || 1) * 100;
    while (player.xp[skill] >= need) {
      player.level[skill] += 1;
      player.xp[skill] -= need;
    }
  }
  if (chain.reward.item && RECIPES.some((r) => r.id === chain.reward.item)) {
    player.inventory[chain.reward.item] = (player.inventory[chain.reward.item] || 0) + 1;
  }
  ctx.emitSelf("goldUpdate", player.gold);
  ctx.emitSelf("inventoryUpdate", player.inventory);
  ctx.emitSelf("skillsUpdate", { level: player.level, xp: player.xp });
  ctx.emitSelf("chainsUpdate", chainSnapshot(player));
  ctx.emitSelf("notify", { msg: `🏅 Missão concluída: ${chain.title}! +$${chain.reward.gold}`, type: "success" });
  room.dirty = true;
  persistPlayer(room.world, player);
}

/** Executado quando o jogador entra: envia todos os dados de carreira. */
export function sendCareerState(ctx) {
  const { player, room, socket } = ctx;
  socket.emit("jobUpdate", jobSnapshot(player, room.world));
  socket.emit("chainsUpdate", chainSnapshot(player));
  socket.emit("coopUpdate", coopSnapshot(room.world));
  socket.emit("cookbook", {
    recipes: RECIPES,
    cookingLevel: player.level.cooking || 1,
  });
}
