// ============================================================
//  Casas dos jogadores — dados e regras compartilhadas
//  - cada mundo nasce com uma casa por jogador escolhido no lobby
//  - quem entra depois ganha uma casa nova (ou aluga um apartamento)
//  - a casa é do dono: só ele dorme, e visitas precisam de permissão
// ============================================================

export const HOUSE_W = 6;
export const HOUSE_H = 5;

// Lotes livres no vale (conferidos contra água, prédios e caminhos).
export const HOUSE_LOTS = [
  { x: 30, y: 28 },
  { x: 37, y: 28 },
  { x: 45, y: 28 },
  { x: 30, y: 34 },
  { x: 37, y: 34 },
  { x: 30, y: 40 },
  { x: 37, y: 40 },
  { x: 45, y: 41 },
  { x: 52, y: 41 },
];

export const HOUSE_PALETTE = [
  { color: "#f3dcc4", roof: "#8e4a3a" },
  { color: "#dfe9f2", roof: "#45617a" },
  { color: "#f7e7b9", roof: "#8a6a2a" },
  { color: "#e4f0d9", roof: "#4c6b3d" },
  { color: "#f1ddf0", roof: "#6e4a72" },
  { color: "#f9e4cb", roof: "#9a6a34" },
];

export const MAX_HOUSES = HOUSE_LOTS.length;

export const HOUSE_PREFIX = "casa:";
export const houseInteriorId = (houseId) => `${HOUSE_PREFIX}${houseId}`;
export const isHouseInterior = (id) => typeof id === "string" && id.startsWith(HOUSE_PREFIX);
export const houseIdFromInterior = (id) => (isHouseInterior(id) ? id.slice(HOUSE_PREFIX.length) : null);

export const APARTMENT_RENT = 30;
export const HOUSE_BUILD_COST = { gold: 1800, madeira: 20, pedra: 15 };

// Apartamento sai na porta da Prefeitura, que administra os imóveis.
export const APARTMENT_DOOR = { x: 33.5, y: 14.9 };

export function houseLabel(house) {
  if (!house) return "Casa";
  if (house.apartment) return `Apartamento de ${house.owner || "ninguém"}`;
  return house.owner ? `Casa de ${house.owner}` : "Casa vazia";
}

export function publicHouse(h) {
  return {
    id: h.id, owner: h.owner || null, apartment: !!h.apartment,
    x: h.x, y: h.y, w: h.w, h: h.h, color: h.color, roof: h.roof,
    entry: h.entry, builtDay: h.builtDay, label: houseLabel(h),
  };
}

export function publicHouses(world) {
  return (world.houses || []).map(publicHouse);
}

export function houseById(world, id) {
  return (world.houses || []).find((h) => h.id === id) || null;
}

export function houseByOwner(world, username) {
  if (!username) return null;
  return (world.houses || []).find((h) => h.owner === username && !h.apartment) || null;
}

export function apartmentByOwner(world, username) {
  if (!username) return null;
  return (world.houses || []).find((h) => h.owner === username && h.apartment) || null;
}

export function canEnterHouse(house, username) {
  if (!house) return false;
  if (house.owner === username) return true;
  return !!house.access?.[username]?.enter;
}

export function canUseChest(house, username) {
  if (!house) return false;
  if (house.owner === username) return true;
  return !!house.access?.[username]?.chest;
}

export function nearHouse(player, house, radius = 3.4) {
  if (!house) return false;
  if (house.apartment) return player.indoors === houseInteriorId(house.id);
  const d = Math.hypot((house.entry?.x ?? house.x) - player.x, (house.entry?.y ?? house.y) - player.y);
  return d <= radius;
}

function lotTaken(world, lot) {
  for (const h of world.houses || []) {
    if (h.apartment || !Number.isFinite(h.x)) continue;
    if (lot.x < h.x + h.w && lot.x + HOUSE_W > h.x && lot.y < h.y + h.h && lot.y + HOUSE_H > h.y) return true;
  }
  for (const key in world.buildings || {}) {
    const b = world.buildings[key];
    if (!b || !Number.isFinite(b.x)) continue;
    const bw = b.w || 1, bh = b.h || 1;
    if (lot.x < b.x + bw && lot.x + HOUSE_W > b.x && lot.y < b.y + bh && lot.y + HOUSE_H > b.y) return true;
  }
  for (let y = lot.y; y < lot.y + HOUSE_H; y++) {
    for (let x = lot.x; x < lot.x + HOUSE_W; x++) {
      if (world.plots?.[`${x},${y}`]) return true;
    }
  }
  return false;
}

export function freeLot(world) {
  for (const lot of HOUSE_LOTS) {
    if (!lotTaken(world, lot)) return { ...lot };
  }
  return null;
}

export function newHouse(world, { owner = null, apartment = false, x, y } = {}) {
  if (!apartment && !Number.isFinite(x)) {
    const lot = freeLot(world);
    if (!lot) return null;
    x = lot.x; y = lot.y;
  }
  const seq = world.nextHouseSeq || 1;
  const palette = HOUSE_PALETTE[(seq - 1) % HOUSE_PALETTE.length];
  const house = {
    id: apartment ? `apto_${seq}` : `casa_${seq}`,
    owner: owner || null,
    apartment: !!apartment,
    x: apartment ? null : x,
    y: apartment ? null : y,
    w: HOUSE_W,
    h: HOUSE_H,
    color: palette.color,
    roof: palette.roof,
    entry: apartment ? { ...APARTMENT_DOOR } : { x: x + HOUSE_W / 2, y: y + HOUSE_H + 0.9 },
    chest: {},
    access: {},
    builtDay: world.day || 1,
  };
  world.nextHouseSeq = seq + 1;
  world.houses ||= [];
  world.houses.push(house);
  return house;
}

/** Cria as casas vazias prometidas na criação do mundo. */
export function initHouses(world, slots = 2) {
  world.houses ||= [];
  world.nextHouseSeq ||= 1;
  const want = Math.max(1, Math.min(MAX_HOUSES, Number(slots) || 2));
  world.houseSlots = world.houseSlots || want;
  let vazias = world.houses.filter((h) => !h.apartment && !h.owner).length;
  while (vazias < world.houseSlots && world.houses.filter((h) => !h.apartment).length < MAX_HOUSES) {
    if (!newHouse(world)) break;
    vazias++;
  }
  return world.houses;
}

/** Garante uma casa própria para o jogador. Cria uma nova se não houver livre. */
export function ensurePlayerHouse(world, player) {
  let house = houseById(world, player.houseId);
  if (house && house.owner && house.owner !== player.username) house = null;
  if (house && !house.apartment) return house;
  house = houseByOwner(world, player.username);
  if (house) {
    player.houseId = house.id;
    return house;
  }
  house = (world.houses || []).find((h) => !h.apartment && !h.owner) || null;
  if (!house) house = newHouse(world, { owner: player.username });
  if (house) {
    house.owner = player.username;
    player.houseId = house.id;
  }
  return house;
}
