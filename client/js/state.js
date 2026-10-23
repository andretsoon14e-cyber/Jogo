import {
  MAP_W, MAP_H, TILE, BUILDINGS, BUILD_OPTIONS, NPCS_DATA, ALL_NPCS, NPC_BY_ID, CROPS,
  ITEM_INFO, TOOLS, SKILLS, npcPosition, GAME_START_MINUTES, COMMUNITY_PROJECTS,
} from "../../shared/constants.js";
import { RECIPES, REGION_DEFS, JOBS, QUEST_CHAINS, COOP_MISSIONS, WEEKDAY_NAMES, WEEKDAY_SHORT } from "../../shared/careers.js";
import { BANK } from "../../shared/bank.js";
import { REL_STAGES, ROMANCEABLE, KIDS, DIALOG_CHOICES } from "../../shared/social.js";

export const game = {
  // identidade
  username: "",
  skin: "s1",
  roomCode: "VALE1",
  token: null,
  isAccount: false,
  selfId: null,
  isHost: false,
  connected: false,

  // posição / movimento
  x: 22,
  y: 21,
  dir: "down",
  speed: 4.2,
  keys: {},
  mouse: { x: 0, y: 0, down: false },
  camera: { x: 22, y: 21 },
  moving: false,
  animTime: 0,
  lastMoveEmit: 0,

  // estado do jogador (privado)
  self: {
    gold: 500,
    bankBalance: 0,
    inventory: {},
    level: Object.fromEntries(Object.keys(SKILLS).map((k) => [k, 1])),
    xp: Object.fromEntries(Object.keys(SKILLS).map((k) => [k, 0])),
    friendship: {},
    stats: { harvested: 0, harvested_nabo: 0, wood: 0, stone: 0, fish: 0, donated: 0, friendship: 0, animals: 0 },
    claimedQuests: [],
  },

  // mundo compartilhado
  world: {
    roomCode: "VALE1",
    tiles: [],
    plots: {},
    buildings: {},
    animals: [],
    communityProgress: { praca: 0, biblioteca: 0, ponte: 0, estrada: 0 },
    time: GAME_START_MINUTES,
    day: 1,
    seasonIndex: 0,
    weather: "Ensolarado",
    festival: null,
  },

  players: new Map(),

  // carreiras, culinária, transportes e missões
  region: "vale",
  regions: {},
  indoors: null,
  interiorPos: { x: 8, y: 7 },
  job: null,
  career: {
    chains: [],
    coop: [],
    recipes: RECIPES,
    cookingLevel: 1,
  },
  shift: null,
  travelDef: REGION_DEFS,
  recentlyBuilt: [],
  bank: { balance: 0, cash: 500, loan: null, history: [] },
  social: { relationships: {}, family: null, ownedHouses: [], furniture: [], houseCatalog: [], furnitureCatalog: [] },
  furniture: [],
  effects: [],
  floatingTexts: [],
  pendingBuild: null,
  currentNpc: null,
  hotbar: [],
  selected: 0,
  shopTab: "seeds",
  uiReady: false,
  settings: { music: true, sfx: true, volume: 0.6 },
};

/** Comandos de rede são injetados pelo main.js (evita imports circulares). */
export const commands = {
  interact: () => {},
  chat: () => {},
  move: () => {},
  sleep: () => {},
  save: () => {},
  talk: () => {},
  disconnect: () => {},
};

export const TOOL_ITEMS = ["enxada", "regador", "foice", "machado", "picareta", "vara"];

export function tileAt(x, y) {
  return currentTiles()?.[y]?.[x];
}

export function buildingDefById(id) {
  return BUILD_OPTIONS[id] || BUILDINGS.find((b) => b.id === id);
}

export function isSolidTile(x, y) {
  const t = tileAt(x, y);
  return t === TILE.WATER;
}

export function currentMapSize() {
  const def = currentRegionDef();
  return { w: def.size?.w || MAP_W, h: def.size?.h || MAP_H };
}

export function isColliding(x, y) {
  if (isIndoors()) return isCollidingIndoor(x, y);
  const { w, h } = currentMapSize();
  if (x < 0.3 || y < 0.3 || x >= w - 0.3 || y >= h - 0.3) return true;
  const tx = Math.floor(x), ty = Math.floor(y);
  // cantos do personagem
  for (const [ox, oy] of [[0.22, 0.18], [0.78, 0.18], [0.22, 0.8], [0.78, 0.8]]) {
    const cx = Math.floor(x + ox), cy = Math.floor(y + oy);
    const t = tileAt(cx, cy);
    if (t === TILE.WATER) {
      // ponte/vau liberados pelo projeto comunitário
      if (cy === 26 && cx >= 58 && cx <= 61 && (game.world.communityProgress.ponte || 0) >= 1000) continue;
      return true;
    }
  }
  for (const b of currentBuildings()) {
    if (b.id === "doca" || b.id === "aerodromo" || b.id === "pier" || b.id === "pier_ilha" || b.id === "aeroporto") continue;
    if (x > b.x - 0.35 && x < b.x + b.w + 0.35 - 0.35 && y > b.y - 0.35 && y < b.y + b.h + 0.35 - 0.35) return true;
  }
  for (const b of customBuildingsList()) {
    if (x > b.x - 0.2 && x < b.x + b.def.w - 0.8 && y > b.y - 0.2 && y < b.y + b.def.h - 0.8) return true;
  }
  return false;
}

/**
 * Transformação usada para desenhar o mundo neste frame.
 * O renderer atualiza isso; o clique e o hover usam a mesma conta.
 */
game.view = { ox: 0, oy: 0, scale: 32 };
game.viewInterior = null;

export function screenToWorld(sx, sy, canvas) {
  const v = game.view || { ox: 0, oy: 0, scale: 32 };
  return {
    x: (sx - v.ox) / v.scale,
    y: (sy - v.oy) / v.scale,
  };
}

export function worldToScreen(wx, wy, canvas) {
  const v = game.view || { ox: 0, oy: 0, scale: 32 };
  return {
    x: wx * v.scale + v.ox,
    y: wy * v.scale + v.oy,
  };
}

export function npcPos(npc) {
  return npcPosition(npc, game.world.time);
}

export function nearbyNpc(radius = 2.6) {
  let best = null, bestD = radius;
  for (const npc of currentNpcs()) {
    const pos = npcPos(npc);
    const d = Math.hypot(pos.x - game.x, pos.y - game.y);
    if (d < bestD) { best = npc; bestD = d; }
  }
  return best;
}

export function nearbyBuilding() {
  let best = null, bestD = 3.2;
  for (const b of currentBuildings()) {
    // casa de jogador: o alvo é a porta, não o centro do telhado
    const cx = b.houseId ? b.entry.x : b.x + b.w / 2;
    const cy = b.houseId ? b.entry.y : b.y + b.h / 2;
    const d = Math.hypot(cx - game.x, cy - game.y);
    if (d < bestD) { best = b; bestD = d; }
  }
  return best;
}

export function isNearWater() {
  const tx = Math.floor(game.x), ty = Math.floor(game.y);
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
    if (tileAt(tx + dx, ty + dy) === TILE.WATER) return true;
  }
  return false;
}

export function isNearForest() {
  const tx = Math.floor(game.x), ty = Math.floor(game.y);
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
    if (tileAt(tx + dx, ty + dy) === TILE.DARK_GRASS) return true;
  }
  return false;
}

export function isNearStone() {
  const tx = Math.floor(game.x), ty = Math.floor(game.y);
  const cave = String(game.region || "").startsWith("caverna");
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
    const t = tileAt(tx + dx, ty + dy);
    if (t === TILE.STONE) return true;
    // na caverna a rocha é a parede e o veio de cristal
    if (cave && (t === TILE.CAVE_WALL || t === TILE.CAVE_CRYSTAL)) return true;
  }
  return false;
}

export function itemMeta(item) {
  const recipe = RECIPES.find((r) => r.id === item);
  if (recipe) return { icon: recipe.icon, name: recipe.name, sell: Math.floor(recipe.sell * 0.75) };
  if (CROPS[item]) return { icon: CROPS[item].icon, name: CROPS[item].name, sell: CROPS[item].sellPrice };
  if (item.endsWith("_seed")) {
    const crop = CROPS[item.replace("_seed", "")];
    if (crop) return { icon: "🌱", name: `Semente de ${crop.name}`, sell: Math.floor(crop.seedPrice / 2) };
  }
  if (ITEM_INFO[item]) return { icon: ITEM_INFO[item].icon, name: ITEM_INFO[item].name, sell: ITEM_INFO[item].sellPrice };
  if (TOOLS[item]) return { icon: TOOLS[item].icon, name: TOOLS[item].name, sell: 0 };
  return { icon: "📦", name: item, sell: 0 };
}

export function itemIcon(item) {
  return itemMeta(item).icon;
}

export function sellPriceClient(item) {
  return itemMeta(item).sell || 0;
}

export function rebuildHotbar() {
  const inv = game.self.inventory || {};
  const slots = [];
  for (const t of TOOL_ITEMS) {
    if (t === "machado" || t === "picareta" || t === "vara") {
      if (inv[t]) slots.push({ id: t, qty: 1 });
    } else {
      slots.push({ id: t, qty: 1 });
    }
  }
  for (const [id, qty] of Object.entries(inv)) {
    if (qty <= 0) continue;
    if (TOOL_ITEMS.includes(id)) continue;
    slots.push({ id, qty });
  }
  // 9 slots na barra rápida + resto só no inventário
  game.hotbar = slots.slice(0, 9);
  if (game.selected >= game.hotbar.length) game.selected = 0;
}

export function formatTime(minutes) {
  const total = Math.floor(minutes) % (24 * 60);
  const h = Math.floor(total / 60);
  const m = Math.floor(total % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function notificationSafe() {}


// ---------------- Região atual ----------------
export function currentRegion() {
  return game.region || "vale";
}

export function currentRegionDef() {
  return REGION_DEFS[currentRegion()] || REGION_DEFS.vale;
}

export function isIndoors() {
  return !!game.indoors;
}

/** Tiles da região em que o jogador está (o vale usa world.tiles). */
export function currentTiles() {
  const region = currentRegion();
  if (region === "vale") return game.world.tiles;
  return game.regions?.[region]?.tiles || [];
}

/** Casas dos jogadores (só no vale) já no formato de construção. */
export function houseBuildings() {
  if (currentRegion() !== "vale") return [];
  return (game.world.houses || [])
    .filter((h) => !h.apartment && Number.isFinite(h.x))
    .map((h) => ({
      id: "casa_player",
      house: true,
      houseId: h.id,
      owner: h.owner || null,
      apartment: false,
      name: h.label || (h.owner ? `Casa de ${h.owner}` : "Casa vazia"),
      x: h.x, y: h.y, w: h.w, h: h.h,
      color: h.color, roof: h.roof, icon: "🏠",
      entry: h.entry,
    }));
}

/** Construções da região atual (prédios fixos + casas dos jogadores). */
export function currentBuildings() {
  const region = currentRegion();
  if (region === "vale") return [...BUILDINGS, ...houseBuildings()];
  return REGION_DEFS[region]?.buildings || [];
}

/** Moradores da região atual. */
export function currentNpcs() {
  const region = currentRegion();
  return ALL_NPCS.filter((n) => (n.region || "vale") === region);
}

export function isCustomBuilding(b) {
  return !!BUILD_OPTIONS[b.buildingId];
}

/** Construções do jogador (somente no vale). */
export function customBuildingsList() {
  if (currentRegion() !== "vale") return [];
  return Object.entries(game.world.buildings || {}).map(([key, b]) => ({
    key, ...b, def: BUILD_OPTIONS[b.buildingId],
  })).filter((b) => b.def);
}

/** Checagem de projeto comunitário concluído. */
export function projectDone(id) {
  const goal = COMMUNITY_PROJECTS[id]?.goal || 1;
  return (game.world.communityProgress?.[id] || 0) >= goal;
}

/** Receita a partir do id do item. */
export function recipeMeta(item) {
  return RECIPES.find((r) => r.id === item) || null;
}

// Interior: 16x12 grid com paredes, mesa e fogão
export const INTERIOR_W = 16, INTERIOR_H = 12;
export const INTERIOR_DEFS = {
  casa_player: { name: "Sua Casa", color: "#fff8e7" },
  taverna: { name: "Taverna", color: "#fff2cc" },
  mercado: { name: "Mercado", color: "#e8f5e9" },
  carpintaria: { name: "Carpintaria", color: "#fff3e0" },
  ferraria: { name: "Ferraria", color: "#eceff1" },
  clinica: { name: "Clínica", color: "#e3f2fd" },
  prefeitura: { name: "Prefeitura", color: "#f3e5f5" },
  banco: { name: "Banco do Vale", color: "#f4f6f7" },
  igreja: { name: "Igreja / Cerimônias", color: "#fdf2f8" },
  casa_simples: { name: "Casa Simples", color: "#fff8e7" },
  casa_familia: { name: "Casa de Família", color: "#fff8e7" },
  chacara: { name: "Chácara", color: "#fff8e7" },
};

/** Definição do interior atual (casas de jogador entram como casa_player). */
export function interiorDef(id = game.indoors) {
  if (!id) return { name: "Interior", color: "#fff8e7" };
  if (String(id).startsWith("casa:")) {
    const house = (game.world.houses || []).find((h) => `casa:${h.id}` === id);
    return { name: house?.label || "Casa", color: "#fff8e7" };
  }
  return INTERIOR_DEFS[id] || { name: "Interior", color: "#fff8e7" };
}

export function isMyHouseInterior(id = game.indoors) {
  if (!id || !String(id).startsWith("casa:")) return false;
  const house = (game.world.houses || []).find((h) => `casa:${h.id}` === id);
  return !!house && house.owner === game.username;
}

function isCollidingIndoor(x, y) {
  if (x < 0.4 || y < 0.4 || x >= INTERIOR_W - 0.4 || y >= INTERIOR_H - 0.4) return true;
  // paredes/bancadas centrais
  if (y < 2.5) {
    if (x >= 5 && x <= 11 && y <= 3.2) {
      // mesa do fogão não bloqueia totalmente — só borda
      if (x >= 6.2 && x <= 9.8 && y >= 1.6 && y <= 2.9) return false;
    }
  }
  // porta (saída) no sul central — nunca bloqueia
  if (y >= INTERIOR_H - 1.7 && x >= 7 && x <= 9) return false;
  return false;
}

export function screenToWorldInterior(sx, sy, canvas) {
  const v = game.viewInterior;
  if (v) return { x: (sx - v.ox) / v.scale, y: (sy - v.oy) / v.scale };
  // fallback: câmera fixa centrada
  const cx = INTERIOR_W / 2, cy = INTERIOR_H / 2;
  return {
    x: (sx - canvas.width / 2) / 32 + cx,
    y: (sy - canvas.height / 2) / 32 + cy,
  };
}

export function weekdayShort(day, seasonIndex) {
  const idx = ((seasonIndex || 0) * 28 + (day - 1)) % 7;
  return WEEKDAY_SHORT[idx];
}

