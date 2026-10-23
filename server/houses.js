// ============================================================
//  Casas dos jogadores — ações de servidor
//  Entrada com permissão, baú privado, aluguel, construção e doação.
// ============================================================
import {
  HOUSE_LOTS, APARTMENT_RENT, APARTMENT_DOOR, HOUSE_BUILD_COST,
  houseInteriorId, isHouseInterior, houseIdFromInterior, houseLabel,
  houseById, houseByOwner, apartmentByOwner, canEnterHouse, canUseChest,
  nearHouse, publicHouse, publicHouses, freeLot, newHouse,
} from "../shared/houses.js";
import { publicPlayer } from "./gameActions.js";

const REQ_TTL = 60 * 1000;

function emitTo(ctx, player, ev, payload) {
  const s = ctx.io.sockets.sockets.get(player.id);
  if (s) s.emit(ev, payload);
}

function socketOf(io, room, username) {
  for (const [id, p] of room.players) {
    if (p.username !== username) continue;
    const s = io.sockets.sockets.get(id);
    if (s) return s;
  }
  return null;
}

function broadcastPlayers(ctx) {
  ctx.broadcast("playersUpdate", [...ctx.room.players.values()].map(publicPlayer));
}

function broadcastHouses(ctx) {
  ctx.broadcast("housesUpdate", publicHouses(ctx.room.world));
}

function pruneRequests(room) {
  room.houseRequests ||= new Map();
  const now = Date.now();
  for (const [id, r] of room.houseRequests) {
    if (now - r.at > REQ_TTL) room.houseRequests.delete(id);
  }
}

export function enterHouseFor(ctx, player, house) {
  if (player.indoors) return false;
  player.entryPos = { x: house.entry.x, y: house.entry.y };
  player.indoors = houseInteriorId(house.id);
  player.x = 8;
  player.y = 9;
  player.tpUntil = Date.now() + 1500;
  ctx.room.dirty = true;
  emitTo(ctx, player, "houseEntered", {
    houseId: house.id,
    owner: house.owner || null,
    apartment: !!house.apartment,
    isOwner: house.owner === player.username,
    label: houseLabel(house),
  });
  broadcastPlayers(ctx);
  return true;
}

export function leaveHouseFor(ctx, player) {
  if (!isHouseInterior(player.indoors)) return false;
  const house = houseById(ctx.room.world, houseIdFromInterior(player.indoors));
  const back = player.entryPos || house?.entry || APARTMENT_DOOR;
  player.indoors = null;
  player.x = back.x;
  player.y = back.y;
  player.tpUntil = Date.now() + 1500;
  emitTo(ctx, player, "houseLeft", { x: back.x, y: back.y });
  broadcastPlayers(ctx);
  return true;
}

function askPermission(ctx, house, kind) {
  const { room, player, io } = ctx;
  pruneRequests(room);
  for (const r of room.houseRequests.values()) {
    if (r.houseId === house.id && r.from === player.username && r.kind === kind) {
      ctx.notify("Você já pediu permissão. Aguarde a resposta do dono.", "info");
      return false;
    }
  }
  if (!house.owner) return false;
  room.reqSeq = (room.reqSeq || 0) + 1;
  const req = {
    id: `pedido_${room.reqSeq}`,
    kind, houseId: house.id, houseLabel: houseLabel(house),
    from: player.username, fromId: player.id, to: house.owner, at: Date.now(),
  };
  room.houseRequests.set(req.id, req);
  const ownerSocket = socketOf(io, room, house.owner);
  ownerSocket?.emit("houseRequest", req);
  ctx.notify(
    ownerSocket
      ? `Pedido enviado para ${house.owner}. Aguardando a resposta…`
      : `${house.owner} não está online agora.`,
    ownerSocket ? "info" : "error"
  );
  return true;
}

function houseStateFor(world, player) {
  const own = houseByOwner(world, player.username);
  const apt = apartmentByOwner(world, player.username);
  const house = own || (apt ? null : houseById(world, player.houseId));
  return {
    house: house ? publicHouse(house) : null,
    apartment: apt ? publicHouse(apt) : null,
    access: house?.access || {},
    chestCount: Object.keys(house?.chest || {}).length,
    rent: APARTMENT_RENT,
    debt: player.rentDebt || 0,
    freeLots: HOUSE_LOTS.length - (world.houses || []).filter((h) => !h.apartment).length,
    buildCost: HOUSE_BUILD_COST,
  };
}

export function handleHouseAction(ctx, type, data) {
  const { player, room } = ctx;
  const world = room.world;

  switch (type) {
    case "enterHouse": {
      const house = houseById(world, String(data.houseId || ""));
      if (!house) return ctx.notify("Essa casa não existe.", "error"), true;
      if (player.indoors) return true;
      if (!canEnterHouse(house, player.username) && !nearHouse(player, house)) {
        return ctx.notify("Chegue até a porta da casa.", "error"), true;
      }
      if (canEnterHouse(house, player.username)) {
        enterHouseFor(ctx, player, house);
        return true;
      }
      askPermission(ctx, house, "enter");
      return true;
    }

    case "answerHouse": {
      pruneRequests(room);
      const req = room.houseRequests.get(String(data.requestId || ""));
      if (!req || req.to !== player.username) return true;
      room.houseRequests.delete(req.id);
      const house = houseById(world, req.houseId);
      if (!house || house.owner !== player.username) return true;
      const requester = [...room.players.values()].find((p) => p.username === req.from);
      const rsocket = requester ? ctx.io.sockets.sockets.get(requester.id) : null;
      if (data.allow) {
        house.access ||= {};
        house.access[req.from] ||= {};
        house.access[req.from][req.kind === "chest" ? "chest" : "enter"] = true;
        room.dirty = true;
        if (rsocket) {
          rsocket.emit("houseAccess", {
            houseId: house.id, kind: req.kind, allowed: true,
            by: player.username, label: houseLabel(house),
          });
          if (req.kind === "enter" && requester && !requester.indoors) {
            enterHouseFor({ ...ctx, player: requester }, requester, house);
          }
          if (req.kind === "chest") {
            rsocket.emit("chestOpen", {
              houseId: house.id, items: { ...house.chest },
              label: houseLabel(house), owner: house.owner,
            });
          }
        }
        ctx.notify(`Você liberou ${req.from}.`, "success");
      } else {
        rsocket?.emit("notify", { msg: `${player.username} não permitiu o acesso.`, type: "error" });
        ctx.notify(`Pedido de ${req.from} recusado.`, "info");
      }
      return true;
    }

    case "openChest": {
      const house = houseById(world, String(data.houseId || "")) ||
        houseById(world, houseIdFromInterior(player.indoors));
      if (!house) return true;
      if (!canUseChest(house, player.username)) {
        if (canEnterHouse(house, player.username)) askPermission(ctx, house, "chest");
        return true;
      }
      ctx.emitSelf("chestOpen", {
        houseId: house.id, items: { ...house.chest },
        label: houseLabel(house), owner: house.owner,
      });
      return true;
    }

    case "chestMove": {
      const house = houseById(world, String(data.houseId || ""));
      if (!house || !canUseChest(house, player.username)) {
        return ctx.notify("O baú está trancado.", "error"), true;
      }
      const item = String(data.item || "");
      const qty = Math.max(1, Math.min(99, Math.floor(Number(data.qty) || 1)));
      if (!item) return true;
      house.chest ||= {};
      if (data.dir === "deposit") {
        const has = player.inventory[item] || 0;
        if (has < qty) return true;
        player.inventory[item] -= qty;
        if (player.inventory[item] <= 0) delete player.inventory[item];
        house.chest[item] = (house.chest[item] || 0) + qty;
      } else {
        const has = house.chest[item] || 0;
        if (has < qty) return true;
        house.chest[item] -= qty;
        if (house.chest[item] <= 0) delete house.chest[item];
        player.inventory[item] = (player.inventory[item] || 0) + qty;
      }
      ctx.emitSelf("inventoryUpdate", player.inventory);
      ctx.emitSelf("chestOpen", {
        houseId: house.id, items: { ...house.chest },
        label: houseLabel(house), owner: house.owner,
      });
      room.dirty = true;
      return true;
    }

    case "houseInfo": {
      ctx.emitSelf("houseInfo", houseStateFor(world, player));
      return true;
    }

    case "revokeAccess": {
      const house = houseByOwner(world, player.username);
      if (!house) return true;
      const who = String(data.username || "");
      if (house.access?.[who]) {
        delete house.access[who];
        room.dirty = true;
        ctx.notify(`Acesso de ${who} removido.`, "info");
        socketOf(ctx.io, room, who)?.emit("notify", {
          msg: `${player.username} removeu seu acesso à casa.`, type: "info",
        });
      }
      return true;
    }

    case "rentApartment": {
      if (apartmentByOwner(world, player.username)) {
        return ctx.notify("Você já aluga um apartamento.", "info"), true;
      }
      const apt = newHouse(world, { owner: player.username, apartment: true });
      if (!apt) return true;
      player.houseId = apt.id;
      player.rentApartment = apt.id;
      player.rentDebt = 0;
      player.rentPaidDay = world.day;
      room.dirty = true;
      broadcastHouses(ctx);
      ctx.emitSelf("houseUpdate", { action: "rented", houseId: apt.id, rent: APARTMENT_RENT });
      ctx.notify(`Você alugou um apartamento por $${APARTMENT_RENT}/dia.`, "success");
      return true;
    }

    case "leaveApartment": {
      const apt = apartmentByOwner(world, player.username);
      if (!apt) return true;
      world.houses = (world.houses || []).filter((h) => h.id !== apt.id);
      const own = houseByOwner(world, player.username);
      player.houseId = own ? own.id : null;
      player.rentApartment = null;
      player.rentDebt = 0;
      if (player.indoors === houseInteriorId(apt.id)) {
        const back = apt.entry || APARTMENT_DOOR;
        player.indoors = null;
        player.x = back.x;
        player.y = back.y;
        player.tpUntil = Date.now() + 1500;
        ctx.emitSelf("houseLeft", { x: back.x, y: back.y });
        broadcastPlayers(ctx);
      }
      room.dirty = true;
      broadcastHouses(ctx);
      ctx.emitSelf("houseUpdate", { action: "leftRent" });
      ctx.notify("Você deixou o apartamento.", "info");
      return true;
    }

    case "buildHouse": {
      const target = String(data.forUser || player.username);
      if (houseByOwner(world, target)) {
        return ctx.notify(`${target} já tem casa no vale.`, "error"), true;
      }
      const lot = freeLot(world);
      if (!lot) return ctx.notify("Não há mais lotes livres no vale.", "error"), true;
      const targetPlayer = target === player.username
        ? player
        : [...room.players.values()].find((p) => p.username === target);
      if (!targetPlayer) return ctx.notify("Essa pessoa não está no mundo agora.", "error"), true;
      if ((player.gold || 0) < HOUSE_BUILD_COST.gold) {
        return ctx.notify(`Faltam $${HOUSE_BUILD_COST.gold - player.gold}.`, "error"), true;
      }
      for (const [item, qty] of Object.entries(HOUSE_BUILD_COST)) {
        if (item === "gold") continue;
        if ((player.inventory[item] || 0) < qty) {
          return ctx.notify(`Faltam ${qty - (player.inventory[item] || 0)} de ${item}.`, "error"), true;
        }
      }
      player.gold -= HOUSE_BUILD_COST.gold;
      for (const [item, qty] of Object.entries(HOUSE_BUILD_COST)) {
        if (item === "gold") continue;
        player.inventory[item] -= qty;
        if (player.inventory[item] <= 0) delete player.inventory[item];
      }
      const house = newHouse(world, { owner: target });
      targetPlayer.houseId = house.id;
      ctx.emitSelf("inventoryUpdate", player.inventory);
      ctx.emitSelf("goldUpdate", player.gold);
      ctx.io.sockets.sockets.get(targetPlayer.id)?.emit("houseUpdate", {
        action: "assigned", houseId: house.id,
      });
      room.dirty = true;
      broadcastHouses(ctx);
      ctx.broadcast("notifyAll", {
        msg: `${player.username} construiu uma casa para ${target}!`, type: "success",
      });
      return true;
    }

    case "giveHouse": {
      const house = houseByOwner(world, player.username);
      if (!house) return true;
      const to = String(data.toUser || "");
      const online = [...room.players.values()].find((p) => p.username === to);
      if (!online) return ctx.notify("Essa pessoa não está no mundo agora.", "error"), true;
      if (houseByOwner(world, to)) return ctx.notify(`${to} já tem casa no vale.`, "error"), true;
      house.owner = to;
      house.access = {};
      player.houseId = apartmentByOwner(world, player.username)?.id || null;
      online.houseId = house.id;
      room.dirty = true;
      broadcastHouses(ctx);
      ctx.broadcast("notifyAll", {
        msg: `${player.username} deu a casa para ${to}!`, type: "success",
      });
      return true;
    }

    default:
      return undefined;
  }
}

/** Cobra o aluguel no avanço do dia e devolve os avisos. */
export function applyDailyRent(world, room, io) {
  const notes = [];
  for (const p of room.players.values()) {
    const apt = apartmentByOwner(world, p.username);
    if (!apt || p.rentPaidDay === world.day) continue;
    p.rentPaidDay = world.day;
    const socket = io.sockets.sockets.get(p.id);
    if ((p.gold || 0) >= APARTMENT_RENT) {
      p.gold -= APARTMENT_RENT;
      p.rentDebt = 0;
      socket?.emit("goldUpdate", p.gold);
      notes.push(`Aluguel de ${p.username}: -$${APARTMENT_RENT}.`);
    } else {
      p.rentDebt = (p.rentDebt || 0) + APARTMENT_RENT;
      notes.push(`${p.username} está devendo $${p.rentDebt} de aluguel.`);
      socket?.emit("notify", {
        msg: `Você não conseguiu pagar o aluguel. Dívida: $${p.rentDebt}.`,
        type: "error",
      });
    }
  }
  return notes;
}
