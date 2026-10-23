import {
  MAP_W, MAP_H, TILE, CROPS, ITEM_INFO, TOOLS, ANIMALS, BUILD_OPTIONS,
  NPCS_DATA, COMMUNITY_PROJECTS, QUESTS, FRIENDSHIP, SKILLS, npcPosition,
  ALL_NPCS, NPC_BY_ID,
} from "../shared/constants.js";
import { publicHouses } from "../shared/houses.js";
import { isEstufaAt, isTileFreeForBuilding, ensureRegions } from "./worldState.js";
import { persistPlayer } from "./rooms.js";
import { RECIPES, recipeById } from "../shared/careers.js";
import {
  handleCareerAction, sendCareerState, chainSnapshot, coopSnapshot,
  recordCoop, npcListFor,
} from "./careers.js";

/** Tiles da região em que o jogador está. */
function tilesOf(world, player) {
  const region = player.region || "vale";
  if (region === "vale") return world.tiles;
  ensureRegions(world);
  return world.regions[region]?.tiles || world.tiles;
}

export function publicPlayer(p) {
  return {
    id: p.id,
    username: p.username,
    skin: p.skin,
    look: p.look || null,
    x: p.x,
    y: p.y,
    dir: p.dir,
    level: p.level,
    account: p.account,
    animals: p.stats?.animals || 0,
    region: p.region || "vale",
    indoors: p.indoors || null,
    job: p.job?.id || null,
  };
}

export function publicWorld(world) {
  return {
    roomCode: world.roomCode,
    day: world.day,
    seasonIndex: world.seasonIndex,
    weather: world.weather,
    time: world.time,
    tiles: world.tiles,
    plots: world.plots,
    buildings: world.buildings,
    houses: publicHouses(world),
    animals: world.animals,
    communityProgress: world.communityProgress,
    festival: world.festival,
    regions: {
      vila: { tiles: world.regions?.vila?.tiles },
      ilha: { tiles: world.regions?.ilha?.tiles },
      cidade: { tiles: world.regions?.cidade?.tiles },
    },
    coop: coopSnapshot(world),
    updatedAt: world.updatedAt,
  };
}

export function sellPrice(item) {
  if (CROPS[item]) return CROPS[item].sellPrice;
  if (typeof item === "string" && item.endsWith("_seed")) {
    const crop = CROPS[item.replace(/_seed$/, "")];
    if (crop) return Math.floor(crop.seedPrice / 2);
  }
  const recipe = RECIPES.find((r) => r.id === item);
  if (recipe) return Math.floor(recipe.sell * 0.75);
  return ITEM_INFO[item]?.sellPrice ?? 0;
}

function addItem(player, item, qty = 1) {
  player.inventory[item] = (player.inventory[item] || 0) + qty;
}

function removeItem(player, item, qty = 1) {
  if ((player.inventory[item] || 0) < qty) return false;
  player.inventory[item] -= qty;
  if (player.inventory[item] <= 0) delete player.inventory[item];
  return true;
}

export function addXp(ctx, skill, amount) {
  const p = ctx.player;
  if (!p.xp[skill] && p.xp[skill] !== 0) p.xp[skill] = 0;
  p.xp[skill] += amount;
  const need = (p.level[skill] || 1) * 100;
  if (p.xp[skill] >= need) {
    p.level[skill] = (p.level[skill] || 1) + 1;
    p.xp[skill] -= need;
    ctx.emitSelf("notify", { msg: `⭐ ${SKILLS[skill]?.name || skill} subiu para o nível ${p.level[skill]}!`, type: "success" });
  }
  ctx.emitSelf("skillsUpdate", { level: p.level, xp: p.xp });
}

function nearWater(world, player) {
  const tiles = tilesOf(world, player);
  const tx = Math.floor(player.x), ty = Math.floor(player.y);
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      if (tiles[ty + dy]?.[tx + dx] === TILE.WATER) return true;
    }
  }
  return false;
}

function nearForest(world, player) {
  const tiles = tilesOf(world, player);
  const tx = Math.floor(player.x), ty = Math.floor(player.y);
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      if (tiles[ty + dy]?.[tx + dx] === TILE.DARK_GRASS) return true;
    }
  }
  return false;
}

function nearStone(world, player) {
  const tiles = tilesOf(world, player);
  const tx = Math.floor(player.x), ty = Math.floor(player.y);
  const cave = String(player.region || "").startsWith("caverna");
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      const t = tiles[ty + dy]?.[tx + dx];
      if (t === TILE.STONE) return true;
      // dentro da caverna, parede e veio de cristal são a rocha disponível
      if (cave && (t === TILE.CAVE_WALL || t === TILE.CAVE_CRYSTAL)) return true;
    }
  }
  return false;
}

/** O veio clicado está ao alcance da picareta? */
function veinsClose(player, x, y) {
  return Math.hypot(x + 0.5 - player.x, y + 0.5 - player.y) <= 3.2;
}

/** True se há um veio de cristal ao alcance (só na caverna). */
function nearCrystal(tiles, player) {
  const tx = Math.floor(player.x), ty = Math.floor(player.y);
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      if (tiles[ty + dy]?.[tx + dx] === TILE.CAVE_CRYSTAL) return { x: tx + dx, y: ty + dy };
    }
  }
  return null;
}

function cooldown(ctx, key, ms) {
  const now = Date.now();
  ctx.player.cooldowns ||= {};
  if ((ctx.player.cooldowns[key] || 0) > now) return false;
  ctx.player.cooldowns[key] = now + ms;
  return true;
}

function checkDistance(ctx, x, y, max = 4) {
  return Math.hypot(x - ctx.player.x, y - ctx.player.y) <= max;
}

function afterChange(ctx) {
  ctx.room.dirty = true;
  persistPlayer(ctx.room.world, ctx.player);
  ctx.emitSelf("inventoryUpdate", ctx.player.inventory);
  ctx.emitSelf("goldUpdate", ctx.player.gold);
  ctx.emitSelf("statsUpdate", { stats: ctx.player.stats, claimedQuests: ctx.player.claimedQuests });
  ctx.emitSelf("chainsUpdate", chainSnapshot(ctx.player));
}

const FARM_ONLY = new Set(["till", "plant", "water", "harvest", "build"]);
const OUTDOOR_ONLY = new Set(["till", "plant", "water", "harvest", "chop", "mine", "fish", "build", "donate"]);

export { sendCareerState };

export function handleAction(ctx, type, data = {}) {
  const { room, player, socket } = ctx;
  const world = room.world;

  // ---- carreiras, culinária, transportes e missões em cadeia ----
  const careerResult = handleCareerAction(ctx, type, data);
  if (careerResult !== undefined) return careerResult;

  // ---- regras de ambiente ----
  if (OUTDOOR_ONLY.has(type) && player.indoors) {
    return ctx.notify("Saia do prédio para fazer isso.", "error");
  }
  if (FARM_ONLY.has(type) && (player.region || "vale") !== "vale") {
    return ctx.notify("Isso só funciona na sua fazenda, no Vale.", "error");
  }
  const tiles = tilesOf(world, player);

  switch (type) {
    // ---------------- FAZENDA ----------------
    case "till": {
      const { x, y } = data;
      if (!Number.isInteger(x) || !Number.isInteger(y)) return;
      if (!checkDistance(ctx, x, y)) return ctx.notify("Muito longe para usar a enxada.", "error");
      if (tiles[y]?.[x] !== TILE.GRASS) return;
      tiles[y][x] = TILE.TILLED;
      world.plots[`${x},${y}`] = { crop: null, stage: 0, watered: false, plantedDay: null, owner: player.username };
      addXp(ctx, "farming", 2);
      afterChange(ctx);
      ctx.broadcast("tileUpdate", { x, y, tile: TILE.TILLED, region: player.region || "vale" });
      ctx.broadcast("plotUpdate", { key: `${x},${y}`, plot: world.plots[`${x},${y}`] });
      break;
    }

    case "plant": {
      const { x, y, seed } = data;
      const cropId = String(seed || "").replace(/_seed$/, "");
      const cropDef = CROPS[cropId];
      if (!cropDef) return;
      if (!player.inventory[seed]) return ctx.notify("Você não tem essa semente.", "error");
      if (tiles[y]?.[x] !== TILE.TILLED && tiles[y]?.[x] !== TILE.TILLED_WATERED) {
        return ctx.notify("Prepare a terra com a enxada primeiro.", "error");
      }
      const key = `${x},${y}`;
      if (world.plots[key]?.crop) return ctx.notify("Já há uma planta aqui.", "error");
      const greenhouse = isEstufaAt(world, x, y);
      if (!greenhouse && cropDef.season !== world.seasonIndex) {
        const seasonName = ["Primavera", "Verão", "Outono", "Inverno"][cropDef.season];
        return ctx.notify(`${cropDef.name} só cresce na ${seasonName}. Construa uma estufa!`, "error");
      }
      if (!checkDistance(ctx, x, y)) return;
      removeItem(player, seed, 1);
      world.plots[key] = { crop: cropId, stage: 0, watered: false, plantedDay: world.day, owner: player.username };
      addXp(ctx, "farming", 4);
      afterChange(ctx);
      ctx.broadcast("plotUpdate", { key, plot: world.plots[key] });
      break;
    }

    case "water": {
      const { x, y } = data;
      const key = `${x},${y}`;
      const plot = world.plots[key];
      if (!plot?.crop) return;
      if (!checkDistance(ctx, x, y)) return;
      plot.watered = true;
      if (tiles[y]?.[x] === TILE.TILLED) {
        tiles[y][x] = TILE.TILLED_WATERED;
        ctx.broadcast("tileUpdate", { x, y, tile: TILE.TILLED_WATERED, region: player.region || "vale" });
      }
      addXp(ctx, "farming", 1);
      afterChange(ctx);
      ctx.broadcast("plotUpdate", { key, plot });
      break;
    }

    case "harvest": {
      const { x, y } = data;
      const key = `${x},${y}`;
      const plot = world.plots[key];
      if (!plot?.crop) return;
      const cropDef = CROPS[plot.crop];
      if (!cropDef || plot.stage < cropDef.daysToGrow) {
        return ctx.notify("Ainda não está pronta para colher.", "error");
      }
      if (!checkDistance(ctx, x, y)) return;
      const qty = Math.random() < 0.2 ? 2 : 1;
      addItem(player, plot.crop, qty);
      player.stats.harvested += qty;
      player.stats[`harvested_${plot.crop}`] = (player.stats[`harvested_${plot.crop}`] || 0) + qty;
      // co-op: o mutirão da colheita conta a soma de todo mundo na sala
      recordCoop(room, "harvested", qty, ctx.io);
      addXp(ctx, "farming", 10);
      tiles[y][x] = TILE.TILLED;
      world.plots[key] = { crop: null, stage: 0, watered: false, plantedDay: null, owner: player.username };
      afterChange(ctx);
      ctx.broadcast("tileUpdate", { x, y, tile: TILE.TILLED, region: player.region || "vale" });
      ctx.broadcast("plotUpdate", { key, plot: world.plots[key] });
      ctx.broadcast("effect", { x, y, type: "harvest" });
      ctx.notify(`Você colheu ${qty}x ${cropDef.name}!`, "success");
      break;
    }

    case "chop": {
      if (!cooldown(ctx, "chop", 900)) return;
      const { x, y } = data;
      if (!checkDistance(ctx, x, y) || !nearForest(world, player)) {
        return ctx.notify("Fique perto de uma árvore da floresta.", "error");
      }
      if (Number.isInteger(x) && Number.isInteger(y) && tiles[y]?.[x] === TILE.DARK_GRASS && Math.random() < 0.5) {
        tiles[y][x] = TILE.GRASS;
        ctx.broadcast("tileUpdate", { x, y, tile: TILE.GRASS, region: player.region || "vale" });
      }
      const qty = 2 + Math.floor(Math.random() * 2);
      addItem(player, "madeira", qty);
      player.stats.wood += qty;
      recordCoop(room, "wood", qty, ctx.io);
      addXp(ctx, "building", 6);
      afterChange(ctx);
      ctx.broadcast("effect", { x: player.x, y: player.y, type: "chop" });
      ctx.notify(`🪵 +${qty} madeira`, "success");
      break;
    }

    case "mine": {
      if (!cooldown(ctx, "mine", 900)) return;
      if (!nearStone(world, player)) return ctx.notify("Fique perto das rochas da mina.", "error");
      const { x, y } = data;
      const inCave = String(player.region || "").startsWith("caverna");
      const floor = inCave ? Number(player.region.replace("caverna", "")) || 1 : 0;

      // ---- veio de cristal: clicou nele e está perto ----
      const vein = inCave ? nearCrystal(tiles, player) : null;
      const targetVein = inCave && Number.isInteger(x) && Number.isInteger(y) &&
        tiles[y]?.[x] === TILE.CAVE_CRYSTAL && veinsClose(player, x, y);

      if (targetVein || (vein && !Number.isInteger(x))) {
        const vx = targetVein ? x : vein.x;
        const vy = targetVein ? y : vein.y;
        tiles[vy][vx] = TILE.CAVE_FLOOR;
        ctx.broadcast("tileUpdate", { x: vx, y: vy, tile: TILE.CAVE_FLOOR, region: player.region || "vale" });
        addItem(player, "cristal", 1);
        world.cave ||= { deepest: 0, crystals: 0 };
        world.cave.crystals = (world.cave.crystals || 0) + 1;
        addXp(ctx, "mining", 18);
        afterChange(ctx);
        ctx.room.dirty = true;
        ctx.broadcast("effect", { x: player.x, y: player.y, type: "mine" });
        ctx.broadcast("notifyAll", { msg: `${player.username} extraiu um cristal no andar ${floor}.`, type: "success" });
        break;
      }

      if (Number.isInteger(x) && Number.isInteger(y) && tiles[y]?.[x] === TILE.STONE && Math.random() < 0.35) {
        tiles[y][x] = TILE.GRASS;
        ctx.broadcast("tileUpdate", { x, y, tile: TILE.GRASS, region: player.region || "vale" });
      }
      const qty = 2 + Math.floor(Math.random() * 2);
      addItem(player, "pedra", qty);
      player.stats.stone += qty;
      recordCoop(room, "stone", qty, ctx.io);
      // andares mais fundos rendem mais minério
      if (Math.random() < 0.18 + floor * 0.12) addItem(player, "minerio", 1);
      if (inCave && Math.random() < 0.10 + floor * 0.07) addItem(player, "carvao", 1);
      addXp(ctx, "mining", 7 + floor * 2);
      afterChange(ctx);
      ctx.broadcast("effect", { x: player.x, y: player.y, type: "mine" });
      ctx.notify(`+${qty} pedra`, "success");
      break;
    }

    case "fish": {
      if (!cooldown(ctx, "fish", 1800)) return;
      if (!player.inventory.vara) return ctx.notify("Você precisa de uma vara de pesca. Compre no Mercado.", "error");
      if (!nearWater(world, player)) return ctx.notify("Aproxime-se da água para pescar.", "error");
      const rain = world.weather === "Chuvoso";
      const night = world.time >= 19 * 60 || world.time < 6 * 60;
      let chance = 0.62 + (rain ? 0.12 : 0) + (night ? 0.06 : 0);
      chance += Math.min(0.12, (player.level.fishing - 1) * 0.02);
      if (Math.random() < chance) {
        addItem(player, "peixe", 1);
        player.stats.fish += 1;
        recordCoop(room, "fish", 1, ctx.io);
        addXp(ctx, "fishing", 9);
        ctx.notify("🐟 Você pescou um peixe!", "success");
        ctx.broadcast("effect", { x: player.x, y: player.y, type: "fish_catch" });
      } else {
        addXp(ctx, "fishing", 3);
        ctx.notify("O peixe escapou... tente de novo!", "error");
        ctx.broadcast("effect", { x: player.x, y: player.y, type: "fish_miss" });
      }
      afterChange(ctx);
      break;
    }

    // ---------------- ECONOMIA ----------------
    case "buy": {
      const { item, qty } = data;
      const amount = Math.max(1, Math.min(50, parseInt(qty, 10) || 1));
      let price = 0;
      let invKey = item;
      if (CROPS[item]) { price = CROPS[item].seedPrice; invKey = `${item}_seed`; }
      else if (TOOLS[item] && TOOLS[item].price > 0) { price = TOOLS[item].price; }
      else if (item === "madeira") price = 15;
      else if (item === "pedra") price = 10;
      else if (ANIMALS[item]) price = ANIMALS[item].price;
      else return;
      if (ANIMALS[item]) {
        if (amount !== 1) return;
        const owned = Object.values(world.buildings).some((b) => b.owner === player.username && (b.buildingId === "celeiro" || b.buildingId === "pocilga"));
        if (!owned) return ctx.notify("Construa um celeiro antes de comprar animais.", "error");
        if (player.gold < price) return ctx.notify("Ouros insuficientes.", "error");
        player.gold -= price;
        player.stats.animals += 1;
        const stable = Object.values(world.buildings).find((b) => b.owner === player.username && (b.buildingId === "celeiro" || b.buildingId === "pocilga"));
        world.animals.push({
          id: `a${Date.now()}${Math.floor(Math.random() * 100)}`,
          type: item,
          owner: player.username,
          x: stable.x + 1 + Math.random() * 2,
          y: stable.y + (BUILD_OPTIONS[stable.buildingId]?.h || 3) + 1,
          bornDay: world.day,
        });
        afterChange(ctx);
        ctx.broadcast("animalsUpdate", world.animals);
        ctx.notify(`🐔 Você comprou uma ${ANIMALS[item].name}!`, "success");
        return;
      }
      if (TOOLS[item] && player.inventory[item]) return ctx.notify("Você já possui essa ferramenta.", "error");
      const total = price * amount;
      if (player.gold < total) return ctx.notify("Ouros insuficientes.", "error");
      player.gold -= total;
      addItem(player, invKey, amount);
      addXp(ctx, "commerce", 2);
      afterChange(ctx);
      ctx.emitSelf("notify", { msg: `🛒 Comprou ${amount}x ${CROPS[item]?.name || TOOLS[item]?.name || ITEM_INFO[item]?.name || item} por ${total} ouros.`, type: "success" });
      break;
    }

    case "sell": {
      const { item, qty } = data;
      const amount = Math.max(1, Math.min(999, parseInt(qty, 10) || 1));
      const price = sellPrice(item);
      if (!price) return;
      if ((player.inventory[item] || 0) < amount) return;
      removeItem(player, item, amount);
      player.gold += price * amount;
      player.stats.sold = (player.stats.sold || 0) + amount;
      if (item === "peixe") player.stats.sold_fish = (player.stats.sold_fish || 0) + amount;
      addXp(ctx, "commerce", 3);
      afterChange(ctx);
      ctx.emitSelf("notify", { msg: `💰 Vendeu ${amount}x ${CROPS[item]?.name || ITEM_INFO[item]?.name || item} por ${price * amount} ouros.`, type: "success" });
      break;
    }

    // ---------------- CONSTRUÇÃO ----------------
    case "build": {
      const { buildingId, x, y } = data;
      const def = BUILD_OPTIONS[buildingId];
      if (!def) return;
      if (!Number.isInteger(x) || !Number.isInteger(y)) return;
      const mine = Object.values(world.buildings).filter((b) => b.owner === player.username && b.buildingId === buildingId);
      if (mine.length >= def.max) return ctx.notify(`Limite de ${def.name} atingido.`, "error");
      if (!isTileFreeForBuilding(world, x, y, def.w, def.h)) {
        return ctx.notify("Local inválido: escolha um espaço livre de grama.", "error");
      }
      const costs = { ...def.cost };
      if (costs.gold && player.gold < costs.gold) return ctx.notify("Ouros insuficientes.", "error");
      for (const [mat, need] of Object.entries(costs)) {
        if (mat === "gold") continue;
        if ((player.inventory[mat] || 0) < need) return ctx.notify(`Faltam ${need} ${mat}.`, "error");
      }
      if (costs.gold) player.gold -= costs.gold;
      for (const [mat, need] of Object.entries(costs)) {
        if (mat === "gold") continue;
        removeItem(player, mat, need);
      }
      const key = `b_${Date.now()}_${Math.floor(Math.random() * 999)}`;
      world.buildings[key] = { buildingId, x, y, owner: player.username, builtDay: world.day };
      addXp(ctx, "building", 35);
      player.stats.built = (player.stats.built || 0) + 1;
      afterChange(ctx);
      ctx.broadcast("buildingsUpdate", world.buildings);
      ctx.broadcast("notifyAll", { msg: `🏗️ ${player.username} construiu ${def.name}!`, type: "success" });
      break;
    }

    // ---------------- COMUNIDADE ----------------
    case "donate": {
      const { project, amount } = data;
      const p = COMMUNITY_PROJECTS[project];
      if (!p) return;
      const value = Math.max(10, Math.min(500, parseInt(amount, 10) || 0));
      if (player.gold < value) return ctx.notify("Você não tem ouros suficientes.", "error");
      const before = world.communityProgress[project] || 0;
      if (before >= p.goal) return ctx.notify("Esse projeto já está concluído!", "success");
      player.gold -= value;
      world.communityProgress[project] = Math.min(p.goal, before + value);
      player.stats.donated += value;
      addXp(ctx, "commerce", 8);
      recordCoop(room, "donated", value, ctx.io);
      afterChange(ctx);
      ctx.broadcast("communityUpdate", world.communityProgress);
      if (world.communityProgress[project] >= p.goal) {
        ctx.broadcast("notifyAll", { msg: `🎉 Projeto concluído: ${p.name}! A cidade mudou.`, type: "success" });
        if (project === "ponte") {
          // abre o vau do rio como ponte
          for (let x = 58; x <= 61; x++) {
            if (world.tiles[26][x] !== TILE.STONE) world.tiles[26][x] = TILE.BRIDGE;
          }
          ctx.broadcast("tilesReload", { tiles: world.tiles });
        }
      } else {
        ctx.notify(`🏛️ ${p.name}: ${world.communityProgress[project]}/${p.goal} ouros.`, "success");
      }
      break;
    }

    // ---------------- SOCIAL ----------------
    case "talk": {
      const npc = NPC_BY_ID[data.npcId];
      if (!npc) return;
      if ((npc.region || "vale") !== (player.region || "vale")) return;
      const pos = npcPosition(npc, world.time);
      if (Math.hypot(pos.x - player.x, pos.y - player.y) > 6) return; // anti-cheat simples
      player.talkCount ||= {};
      player.talkCount[npc.id] = (player.talkCount[npc.id] || 0) + 1;
      player.talkedToday ||= {};
      if (player.talkedToday[npc.id]) return;
      player.talkedToday[npc.id] = true;
      player.friendship[npc.id] = Math.min(FRIENDSHIP.MAX, (player.friendship[npc.id] || 0) + FRIENDSHIP.TALK);
      player.stats.friendship = Object.values(player.friendship).reduce((a, b) => a + b, 0);
      afterChange(ctx);
      ctx.emitSelf("friendshipUpdate", player.friendship);
      break;
    }

    case "gift": {
      const { npcId, item } = data;
      const npc = NPC_BY_ID[npcId];
      if (!npc || !player.inventory[item]) return;
      if ((npc.region || "vale") !== (player.region || "vale")) return;
      if (!removeItem(player, item, 1)) return;
      const liked = npc.likes.includes(item);
      const disliked = npc.dislikes.includes(item);
      let gain = FRIENDSHIP.GIFT + (liked ? FRIENDSHIP.LIKE_BONUS : 0) - (disliked ? FRIENDSHIP.DISLIKE_PENALTY : 0);
      gain = Math.max(1, gain);
      player.friendship[npcId] = Math.min(FRIENDSHIP.MAX, (player.friendship[npcId] || 0) + gain);
      player.stats.friendship = Object.values(player.friendship).reduce((a, b) => a + b, 0);
      afterChange(ctx);
      ctx.emitSelf("friendshipUpdate", player.friendship);
      const msg = disliked
        ? `${npc.name} não gostou muito de ${item}... +${gain} amizade.`
        : liked
          ? `${npc.name} adorou ${item}! +${gain} amizade. 💚`
          : `${npc.name} gostou do presente. +${gain} amizade.`;
      ctx.notify(msg, disliked ? "error" : "success");
      break;
    }

    // ---------------- MISSÕES ----------------
    case "claimQuest": {
      const quest = QUESTS.find((q) => q.id === data.questId);
      if (!quest) return;
      if (player.claimedQuests.includes(quest.id)) return ctx.notify("Missão já concluída.", "error");
      const progress = player.stats[quest.stat] || 0;
      if (progress < quest.need) return ctx.notify("Objetivo ainda não concluído.", "error");
      player.claimedQuests.push(quest.id);
      player.gold += quest.reward;
      if (quest.xp && quest.skill) addXp(ctx, quest.skill, quest.xp);
      afterChange(ctx);
      ctx.emitSelf("questsUpdate", { claimedQuests: player.claimedQuests });
      ctx.notify(`📜 Missão concluída: ${quest.title}! +${quest.reward} ouros`, "success");
      break;
    }

    default:
      break;
  }
}
