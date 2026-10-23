import { createWorldState, saveWorldToDisk, loadWorldFromDisk } from "./worldState.js";
import { START_GOLD, START_INVENTORY, SKILLS } from "../shared/constants.js";
import { ensurePlayerHouse, houseInteriorId, houseByOwner, apartmentByOwner } from "../shared/houses.js";
import { normalizeUsername } from "./accounts.js";

const rooms = new Map();

export function normalizedCode(raw) {
  return String(raw || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);
}

export function getRoom(code) {
  return rooms.get(normalizedCode(code)) || null;
}

export function listRooms() {
  return [...rooms.values()].map((r) => ({
    code: r.roomCode,
    players: r.players.size,
    day: r.world.day,
    season: r.world.seasonIndex,
  }));
}

export function ensureRoom(rawCode, opts = {}) {
  const code = normalizedCode(rawCode);
  if (!code) throw new Error("Código de sala inválido");
  if (rooms.has(code)) return rooms.get(code);
  const world = loadWorldFromDisk(code) || createWorldState(code, opts);
  const room = {
    roomCode: code,
    world,
    players: new Map(),
    hostId: null,
    chat: [],
    sleepVotes: new Set(),
    houseRequests: new Map(),
    reqSeq: 0,
    dirty: false,
    createdAt: Date.now(),
  };
  rooms.set(code, room);
  return room;
}

export function resetRoom(rawCode) {
  const code = normalizedCode(rawCode);
  const room = rooms.get(code);
  if (room && room.players.size > 0) return { ok: false, error: "Há jogadores na sala." };
  const world = createWorldState(code);
  if (room) {
    room.world = world;
    room.dirty = true;
  } else {
    rooms.set(code, {
      roomCode: code, world, players: new Map(), hostId: null, chat: [], sleepVotes: new Set(),
      houseRequests: new Map(), reqSeq: 0, dirty: true, createdAt: Date.now(),
    });
  }
  saveWorldToDisk(code, world);
  return { ok: true };
}

function freshState(username, account) {
  return {
    username,
    account: !!account,
    gold: START_GOLD,
    inventory: { ...START_INVENTORY },
    level: Object.fromEntries(Object.keys(SKILLS).map((k) => [k, 1])),
    xp: Object.fromEntries(Object.keys(SKILLS).map((k) => [k, 0])),
    friendship: {},
    stats: {
      harvested: 0, harvested_nabo: 0, wood: 0, stone: 0, fish: 0, donated: 0,
      friendship: 0, animals: 0, cooked: 0, sold: 0, sold_fish: 0, built: 0, shifts: 0,
    },
    claimedQuests: [],
    // carreiras, culinária, transportes e missões
    region: "vale",
    indoors: null,
    job: null,
    shift: null,
    chainsDone: [],
    talkCount: {},
    vacationPay: 0,
    // banco, moradia e família
    bankBalance: 0,
    bankHistory: [],
    loan: null,
    ownedHouses: [],
    furniture: [], // {id,x,y,rot} para o interior da casa
    relationship: {}, // npcId -> {stage, sinceDay, events[]}
    family: null,
    houseId: null,
    rentApartment: null,
    rentDebt: 0,
    rentPaidDay: 0,
    x: 22,
    y: 21,
  };
}

export function persistPlayer(world, player) {
  if (!player?.account) return;
  world.playerStates[player.username] = {
    username: player.username,
    gold: player.gold,
    inventory: player.inventory,
    level: player.level,
    xp: player.xp,
    friendship: player.friendship,
    stats: player.stats,
    claimedQuests: player.claimedQuests,
    chainsDone: player.chainsDone,
    talkCount: player.talkCount,
    job: player.job,
    vacationPay: player.vacationPay,
    bankBalance: player.bankBalance ?? 0,
    bankHistory: (player.bankHistory||[]).slice(-40),
    loan: player.loan || null,
    ownedHouses: player.ownedHouses||[],
    furniture: player.furniture||[],
    relationship: player.relationship||{},
    family: player.family||null,
    houseId: player.houseId || null,
    rentApartment: player.rentApartment || null,
    rentDebt: player.rentDebt || 0,
    rentPaidDay: player.rentPaidDay || 0,
    region: player.region,
    x: player.x,
    y: player.y,
    skin: player.skin,
    lastSeen: Date.now(),
  };
}

function restorePlayer(world, username) {
  const saved = world.playerStates[username];
  if (!saved) return null;
  const base = freshState(username, true);
  return {
    ...base,
    ...saved,
    inventory: { ...base.inventory, ...(saved.inventory || {}) },
    level: { ...base.level, ...(saved.level || {}) },
    xp: { ...base.xp, ...(saved.xp || {}) },
    stats: { ...base.stats, ...(saved.stats || {}) },
    chainsDone: saved.chainsDone || [],
    talkCount: saved.talkCount || {},
    job: saved.job || null,
    vacationPay: saved.vacationPay || 0,
    bankBalance: saved.bankBalance ?? 0,
    bankHistory: saved.bankHistory || [],
    loan: saved.loan || null,
    ownedHouses: saved.ownedHouses || [],
    furniture: saved.furniture || [],
    relationship: saved.relationship || {},
    family: saved.family || null,
    houseId: saved.houseId || null,
    rentApartment: saved.rentApartment || null,
    rentDebt: saved.rentDebt || 0,
    rentPaidDay: saved.rentPaidDay || 0,
    region: saved.region || "vale",
    x: Number.isFinite(saved.x) ? saved.x : 22,
    y: Number.isFinite(saved.y) ? saved.y : 21,
    indoors: null,
    shift: null,
  };
}

export function joinPlayer(room, socketId, { username, account, tokenUser, skin, look, x, y }) {
  const name = normalizeUsername(username) || `Visitante${Math.floor(Math.random() * 999)}`;
  // Se a conta autenticada existir, o nome da conta manda (evita personificação)
  const finalName = tokenUser || name;
  let player = {
    id: socketId,
    username: finalName,
    account: !!tokenUser,
    skin,
    x: Number.isFinite(x) ? x : 22,
    y: Number.isFinite(y) ? y : 21,
    dir: "down",
    region: "vale",
  };
  if (tokenUser) {
    const saved = restorePlayer(room.world, finalName);
    Object.assign(player, saved || freshState(finalName, true));
  } else {
    Object.assign(player, freshState(finalName, false));
  }
  player.id = socketId;
  player.username = finalName;
  player.account = !!tokenUser;
  player.skin = skin || "s1";
  player.look = look || null;
  player.x = Number.isFinite(player.x) ? player.x : Number.isFinite(x) ? x : 22;
  player.y = Number.isFinite(player.y) ? player.y : Number.isFinite(y) ? y : 21;
  player.dir = "down";
  player.online = true;
  player.indoors = null;
  player.shift = null;

  // ---- moradia: cada jogador nasce dentro da própria casa ----
  const apt = apartmentByOwner(room.world, player.username);
  const own = houseByOwner(room.world, player.username);
  const house = own || (apt ? null : ensurePlayerHouse(room.world, player));
  const spawnHouse = own || apt || house;
  if (spawnHouse) {
    player.region = "vale";
    player.indoors = houseInteriorId(spawnHouse.id);
    player.entryPos = { ...spawnHouse.entry };
    player.x = 8;
    player.y = 9;
    player.houseId = spawnHouse.id;
  }

  room.players.set(socketId, player);
  if (!room.hostId || !room.players.has(room.hostId)) room.hostId = socketId;
  if (tokenUser) persistPlayer(room.world, player);
  room.dirty = true;
  return player;
}

export function leavePlayer(room, socketId) {
  const player = room.players.get(socketId);
  if (!player) return null;
  if (player.account) persistPlayer(room.world, player);
  room.players.delete(socketId);
  room.sleepVotes.delete(socketId);
  if (room.hostId === socketId) {
    room.hostId = room.players.keys().next().value || null;
  }
  room.dirty = true;
  saveWorldToDisk(room.roomCode, room.world);
  return player;
}

export function isHost(room, socketId) {
  return room.hostId === socketId;
}

export function saveRoom(room) {
  saveWorldToDisk(room.roomCode, room.world);
  room.dirty = false;
}

export function saveDirtyRooms() {
  for (const room of rooms.values()) {
    if (room.dirty) saveRoom(room);
  }
}

export function allRooms() {
  return rooms;
}
