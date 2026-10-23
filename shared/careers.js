// ============================================================
// Vale Aconchegante — carreiras, culinária, transportes e missões
// Todos os dados são originais do projeto.
// ============================================================

// ---------- Calendário ----------
export const WEEKDAY_NAMES = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
export const WEEKDAY_SHORT = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
export const DAYS_PER_SEASON = 28;
export const SEASONS_PER_YEAR = 4;

/** Total de dias corridos desde o início do jogo (dia 1 = dia 0). */
export function totalDaysElapsed(day, seasonIndex) {
  return (seasonIndex || 0) * DAYS_PER_SEASON + (day - 1);
}

/** 0 = Segunda ... 6 = Domingo. */
export function weekdayIndex(day, seasonIndex) {
  return totalDaysElapsed(day, seasonIndex) % 7;
}

export function weekdayName(day, seasonIndex) {
  return WEEKDAY_NAMES[weekdayIndex(day, seasonIndex)];
}

export function isSameWeek(a, b) {
  return Math.floor(a / 7) === Math.floor(b / 7);
}

// ---------- Empregos ----------
// wagePerHour em dólares; shift em minutos do dia; workdays 0=seg..6=dom;
// vacationDays = dias do mês (1-28) em que o jogador está de férias naquela estação.
export const JOBS = {
  caixa: {
    id: "caixa",
    name: "Caixa de Supermercado",
    short: "Caixa",
    employer: "Mercado Central",
    icon: "🧾",
    building: "mercado",
    wagePerHour: 12,
    shift: { start: 8 * 60, end: 14 * 60 },
    workdays: [0, 2, 4],
    vacationDays: { 0: [20, 21], 1: [11, 12], 2: [17, 18], 3: [5, 6] },
    desc: "Atenda os clientes no caixa do Mercado: confira os itens do pedido e feche a compra.",
    bonus: "Gorjeta por atendimento rápido e sem erros.",
    tasks: ["nabo", "batata", "tomate", "milho", "peixe", "ovo", "morango", "pao"],
    verb: "Registrar item",
    skill: "commerce",
  },
  padeiro: {
    id: "padeiro",
    name: "Ajudante de Padaria",
    short: "Padeiro",
    employer: "Taverna do Vale",
    icon: "🥖",
    building: "taverna",
    wagePerHour: 14,
    shift: { start: 6 * 60, end: 10 * 60 },
    workdays: [1, 3, 5],
    vacationDays: { 0: [8], 1: [22], 2: [3], 3: [26] },
    desc: "Prepare os pedidos da padaria antes do amanhecer e sirva os moradores.",
    bonus: "Bônus por sequência de pedidos corretos.",
    tasks: ["pao", "trigo", "ovo", "leite", "mel", "morango", "queijo"],
    verb: "Preparar",
    skill: "cooking",
  },
  pescador: {
    id: "pescador",
    name: "Ajudante de Pesca",
    short: "Pescador",
    employer: "Píer do Vale",
    icon: "🎣",
    building: "doca",
    wagePerHour: 10,
    shift: { start: 7 * 60, end: 13 * 60 },
    workdays: [0, 1, 2],
    vacationDays: { 0: [26], 1: [9], 2: [24], 3: [14] },
    desc: "Ajude a organizar a pesca do dia: separe as espécies e confira a carga.",
    bonus: "Gorjeta extra por carga perfeita.",
    tasks: ["peixe", "peixe", "vara", "ovo", "peixe", "cogumelo"],
    verb: "Separar",
    skill: "fishing",
  },
  ferreiro: {
    id: "ferreiro",
    name: "Ajudante de Ferraria",
    short: "Ferreiro",
    employer: "Ferraria do Carlos",
    icon: "🔨",
    building: "ferraria",
    wagePerHour: 16,
    shift: { start: 9 * 60, end: 15 * 60 },
    workdays: [3, 4],
    vacationDays: { 0: [5], 1: [16], 2: [21], 3: [9] },
    desc: "Separe minério, carvão e ferramentas para o Seu Carlos.",
    bonus: "Bônus por peças sem defeito.",
    tasks: ["pedra", "minerio", "machado", "picareta", "pedra", "madeira"],
    verb: "Forjar",
    skill: "mining",
  },
};

export function jobShiftHours(job) {
  const hours = (job.shift.end - job.shift.start) / 60;
  return Math.max(1, Math.round(hours * 10) / 10);
}

export function isWorkday(job, day, seasonIndex) {
  return job.workdays.includes(weekdayIndex(day, seasonIndex));
}

export function isVacationDay(job, day, seasonIndex) {
  const list = job.vacationDays?.[seasonIndex] || [];
  return list.includes(day);
}

export function isOnShiftNow(job, minutes) {
  // turno atravessa a madrugada? nenhum dos nossos casos, então basta a faixa
  return minutes >= job.shift.start && minutes < job.shift.end;
}

/** Texto curto do estado do emprego no dia atual. */
export function jobDayStatus(job, day, seasonIndex, minutes) {
  if (!job) return { key: "unemployed", label: "Sem emprego", detail: "Procure o quadro de empregos" };
  if (isVacationDay(job, day, seasonIndex)) {
    return { key: "vacation", label: "Férias 🌴", detail: "Aproveite! Você recebe metade do turno." };
  }
  if (!isWorkday(job, day, seasonIndex)) {
    return { key: "off", label: "Folga 😴", detail: "Hoje não é dia de trabalho." };
  }
  if (isOnShiftNow(job, minutes)) {
    return { key: "working", label: "Em turno 💼", detail: "Vá até o local e comece o turno." };
  }
  if (minutes < job.shift.start) {
    return { key: "before", label: "Trabalho mais tarde", detail: `Turno às ${fmtHour(job.shift.start)}.` };
  }
  return { key: "late", label: "Turno encerrado", detail: `O turno era até ${fmtHour(job.shift.end)}.` };
}

export function fmtHour(minutes) {
  const h = Math.floor(minutes / 60) % 24;
  const m = Math.floor(minutes % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// ---------- Culinária ----------
// station: "kitchen" (fogão), "oven" (forno) ou "pot" (panela)
export const RECIPES = [
  { id: "queijo", name: "Queijo Fresco", icon: "🧀", ingredients: { leite: 1 }, sell: 70, skill: 1, xp: 10, station: "kitchen", desc: "Leite coalhado e prensado na cozinha." },
  { id: "pao_caseiro", name: "Pão Caseiro", icon: "🍞", ingredients: { trigo: 2 }, sell: 85, skill: 1, xp: 12, station: "oven", desc: "Trigo moído e assado no forno." },
  { id: "salada", name: "Salada da Horta", icon: "🥗", ingredients: { nabo: 1, tomate: 1 }, sell: 115, skill: 1, xp: 14, station: "kitchen", desc: "Fresca, direto da sua fazenda." },
  { id: "sopa", name: "Sopa de Batata", icon: "🍲", ingredients: { batata: 2, nabo: 1 }, sell: 140, skill: 2, xp: 20, station: "pot", desc: "Reconfortante em dia de chuva." },
  { id: "omelete", name: "Omelete do Vale", icon: "🍳", ingredients: { ovo: 2, tomate: 1 }, sell: 150, skill: 2, xp: 22, station: "oven", desc: "Café da manhã dos campeões." },
  { id: "peixe_grelhado", name: "Peixe Grelhado", icon: "🐟", ingredients: { peixe: 1, tomate: 1 }, sell: 185, skill: 2, xp: 26, station: "kitchen", desc: "O orgulho da Luna." },
  { id: "torta_morango", name: "Torta de Morango", icon: "🍰", ingredients: { morango: 2, trigo: 1, ovo: 1 }, sell: 240, skill: 3, xp: 34, station: "oven", desc: "Doce favorito da Ana." },
  { id: "doce_mel", name: "Doce de Mel", icon: "🍯", ingredients: { mel: 1, trigo: 1, morango: 1 }, sell: 220, skill: 3, xp: 30, station: "kitchen", desc: "Receita antiga da vovó do vale." },
  { id: "pizza_fazenda", name: "Pizza da Fazenda", icon: "🍕", ingredients: { trigo: 2, tomate: 1, queijo: 1 }, sell: 300, skill: 3, xp: 40, station: "oven", desc: "Para dividir com os amigos." },
  { id: "banquete", name: "Banquete do Vale", icon: "🍱", ingredients: { peixe: 1, milho: 1, batata: 1, queijo: 1 }, sell: 480, skill: 4, xp: 60, station: "pot", desc: "O prato dos festivais." },
];

export function recipeById(id) {
  return RECIPES.find((r) => r.id === id);
}

export function canCook(recipe, inventory, cookingLevel) {
  if (!recipe) return { ok: false, error: "Receita inválida" };
  if ((cookingLevel || 1) < recipe.skill) {
    return { ok: false, error: `Precisa de Culinária nível ${recipe.skill}` };
  }
  for (const [item, qty] of Object.entries(recipe.ingredients)) {
    if ((inventory[item] || 0) < qty) return { ok: false, error: `Falta ${item}` };
  }
  return { ok: true };
}

// ---------- Missões cooperativas ----------
export const COOP_MISSIONS = [
  { id: "colheita", name: "Mutirão da Colheita", icon: "🌾", stat: "harvested", goal: 30, reward: 400, desc: "Juntos, colham 30 vegetais na fazenda." },
  { id: "pesca", name: "Torneio de Pesca do Vale", icon: "🎣", stat: "fish", goal: 15, reward: 420, desc: "Juntos, pesquem 15 peixes." },
  { id: "pedra", name: "Expedição à Mina", icon: "⛏️", stat: "stone", goal: 25, reward: 450, desc: "Juntos, extraiam 25 pedras." },
  { id: "doacao", name: "Obras Comunitárias", icon: "🏗️", stat: "donated", goal: 1000, reward: 500, desc: "Juntos, doem 1000 dólares para a cidade." },
];

export const COOP_WEEKLY_REWARDS = true;

// ---------- Missões em cadeia ----------
// type "stat" usa player.stats; type "talk" conta conversas; type "cook" conta receitas feitas.
export const QUEST_CHAINS = [
  {
    id: "nova_era",
    title: "Uma Nova Era no Vale",
    npc: "maria",
    icon: "🏛️",
    desc: "Maria quer reerguer o vale. Ajude-a nas quatro etapas.",
    steps: [
      { desc: "Converse com a Prefeita Maria", type: "talk", target: "maria", need: 1 },
      { desc: "Entregue 10 madeiras (colete)", type: "stat", stat: "wood", need: 10 },
      { desc: "Doe 300 dólares na praça", type: "stat", stat: "donated", need: 300 },
      { desc: "Colha 15 vegetais", type: "stat", stat: "harvested", need: 15 },
    ],
    reward: { gold: 700, xp: 200, skill: "commerce", item: "torta_morango" },
  },
  {
    id: "receita_luna",
    title: "O Peixe-Lua",
    npc: "luna",
    icon: "🎣",
    desc: "Luna procura o peixe lendário. Prove que você é um bom pescador.",
    steps: [
      { desc: "Converse com a Luna", type: "talk", target: "luna", need: 1 },
      { desc: "Pesque 8 peixes", type: "stat", stat: "fish", need: 8 },
      { desc: "Prepare 3 refeições na cozinha", type: "stat", stat: "cooked", need: 3 },
      { desc: "Venda 5 peixes ao mercado", type: "stat", stat: "sold_fish", need: 5 },
    ],
    reward: { gold: 600, xp: 180, skill: "fishing", item: "banquete" },
  },
  {
    id: "carpinteiro",
    title: "O Projeto Secreto do João",
    npc: "joao",
    icon: "🪵",
    desc: "João guarda um projeto na gaveta. Convença-o a compartilhar.",
    steps: [
      { desc: "Converse com o João", type: "talk", target: "joao", need: 1 },
      { desc: "Colete 25 madeiras", type: "stat", stat: "wood", need: 25 },
      { desc: "Construa algo na sua fazenda", type: "stat", stat: "built", need: 1 },
      { desc: "Doe 200 dólares na biblioteca", type: "stat", stat: "donated", need: 200 },
    ],
    reward: { gold: 800, xp: 220, skill: "building", item: "pizza_fazenda" },
  },
  {
    id: "capita",
    title: "A Rota do Barco",
    npc: "bia",
    icon: "⛵",
    desc: "Capitã Bia precisa de uma tripulação e de provisões para a nova rota.",
    steps: [
      { desc: "Converse com a Capitã Bia (Vila Costeira)", type: "talk", target: "bia", need: 1 },
      { desc: "Venda 10 itens no mercado", type: "stat", stat: "sold", need: 10 },
      { desc: "Prepare 5 refeições", type: "stat", stat: "cooked", need: 5 },
      { desc: "Complete 2 turnos de trabalho", type: "stat", stat: "shifts", need: 2 },
    ],
    reward: { gold: 900, xp: 260, skill: "commerce", item: "banquete" },
  },
];

// ---------- Transportes e regiões ----------
export const TRANSPORT = {
  barco: {
    id: "barco",
    name: "Barco de Passageiros",
    icon: "⛵",
    project: "porto",
    originBuilding: "doca",
    destinations: ["vila", "ilha"],
    price: 0,
    desc: "Viagens gratuitas para a Vila Costeira e a Ilha Tropical.",
  },
  aviao: {
    id: "aviao",
    name: "Avião Regional",
    icon: "✈️",
    project: "estacao",
    originBuilding: "aerodromo",
    destinations: ["cidade"],
    price: 20,
    desc: "Voo para a Cidade Grande por 20 dólares.",
  },
};

export const REGION_DEFS = {
  vale: { id: "vale", name: "Vale Aconchegante", icon: "🌾", size: { w: 70, h: 50 } },
  vila: {
    id: "vila", name: "Vila Costeira", icon: "⛵",
    size: { w: 46, h: 28 },
    desc: "Vilarejo de pescadores, com mercado de frutos do mar e a Capitã Bia.",
    portal: "barco",
    npcs: ["bia"],
    buildings: [
      { id: "peixaria", name: "Peixaria da Vila", x: 12, y: 8, w: 6, h: 4, color: "#a9cce3", roof: "#1f618d", icon: "🐟" },
      { id: "casa_bia", name: "Casa da Capitã", x: 26, y: 8, w: 5, h: 4, color: "#f5cba7", roof: "#943126", icon: "🏠" },
      { id: "pousada", name: "Pousada Maré Alta", x: 34, y: 12, w: 6, h: 4, color: "#f9e79f", roof: "#b7950b", icon: "🛏️" },
      { id: "pier", name: "Píer de Retorno", x: 20, y: 23, w: 5, h: 3, color: "#d2a679", roof: "#5d4037", icon: "⛵" },
    ],
  },
  ilha: {
    id: "ilha", name: "Ilha Tropical", icon: "🏝️",
    size: { w: 42, h: 26 },
    desc: "Ilha selvagem com pesca rara, conchas e ruínas escondidas.",
    portal: "barco",
    npcs: ["tai"],
    buildings: [
      { id: "barraca_tai", name: "Barraca do Tai", x: 18, y: 6, w: 5, h: 4, color: "#d5f5b7", roof: "#4e7a2a", icon: "🛖" },
      { id: "ruinas", name: "Ruínas Antigas", x: 31, y: 5, w: 6, h: 4, color: "#b8b3a5", roof: "#6e6a5e", icon: "🏛️" },
      { id: "pier_ilha", name: "Píer da Ilha", x: 18, y: 21, w: 5, h: 3, color: "#d2a679", roof: "#5d4037", icon: "⛵" },
    ],
  },
  cidade: {
    id: "cidade", name: "Cidade Grande", icon: "🏙️",
    size: { w: 48, h: 28 },
    desc: "Centro urbano com loja de ferramentas premium e o aeroporto regional.",
    portal: "aviao",
    npcs: ["rita", "duda"],
    buildings: [
      { id: "loja_premium", name: "Loja das Ferramentas", x: 10, y: 7, w: 7, h: 4, color: "#d7dbdd", roof: "#2874a6", icon: "🛠️" },
      { id: "mercado_cidade", name: "Empório Urbano", x: 22, y: 7, w: 7, h: 4, color: "#f9e79f", roof: "#b7950b", icon: "🏬" },
      { id: "banco", name: "Banco do Vale", x: 34, y: 7, w: 6, h: 4, color: "#d5d8dc", roof: "#7f8c8d", icon: "🏦" },
      { id: "aeroporto", name: "Aeroporto Regional", x: 17, y: 20, w: 8, h: 4, color: "#aed6f1", roof: "#21618c", icon: "✈️" },
    ],
  },
};

// Novos NPCs regionais (os do vale continuam em constants.js)
export const REGION_NPCS = [
  {
    id: "bia", name: "Capitã Bia", role: "Capitã do Barco", color: "#2e86c1", accent: "#154360",
    region: "vila", personality: "Direta, experiente e adora histórias de tempestade.",
    likes: ["peixe", "banquete"], dislikes: ["nabo"],
    story: "Bia navega desde os 16 anos e sonha em mapear todas as ilhas do arquipélago.",
    home: { x: 27, y: 13 },
    routine: [
      { from: 6 * 60, to: 12 * 60, x: 22, y: 22, label: "no píer" },
      { from: 12 * 60, to: 18 * 60, x: 15, y: 13, label: "na peixaria" },
      { from: 18 * 60, to: 26 * 60, x: 28, y: 13, label: "em casa" },
    ],
  },
  {
    id: "tai", name: "Tai", role: "Guia da Ilha", color: "#16a085", accent: "#0b5345",
    region: "ilha", personality: "Fala com o mar e conhece cada pedra da ilha.",
    likes: ["cogumelo", "peixe", "concha"], dislikes: ["pedra"],
    story: "Tai guarda o segredo das ruínas antigas e só conta a quem ajudar a ilha.",
    home: { x: 20, y: 11 },
    routine: [
      { from: 6 * 60, to: 17 * 60, x: 20, y: 11, label: "na barraca" },
      { from: 17 * 60, to: 21 * 60, x: 33, y: 10, label: "nas ruínas" },
      { from: 21 * 60, to: 26 * 60, x: 20, y: 11, label: "em casa" },
    ],
  },
  {
    id: "rita", name: "Rita", role: "Comerciante Urbana", color: "#af7ac5", accent: "#512e5f",
    region: "cidade", personality: "Negociadora nata, sempre com uma proposta melhor.",
    likes: ["queijo", "pizza_fazenda"], dislikes: ["ovo"],
    story: "Rita trocou a fazenda da família pela cidade e agora quer investir no vale.",
    home: { x: 25, y: 11 },
    routine: [
      { from: 8 * 60, to: 19 * 60, x: 25, y: 11, label: "no Empório" },
      { from: 19 * 60, to: 22 * 60, x: 31, y: 14, label: "na praça" },
      { from: 22 * 60, to: 26 * 60, x: 37, y: 12, label: "em casa" },
    ],
  },
  {
    id: "duda", name: "Duda", role: "Pilota", color: "#f5b041", accent: "#7e5109",
    region: "cidade", personality: "Animada, apaixonada por aviões e por mapas.",
    likes: ["mel", "pao_caseiro"], dislikes: ["peixe"],
    story: "Duda é a pilota mais jovem da região e sonha em voar até a ilha.",
    home: { x: 20, y: 17 },
    routine: [
      { from: 7 * 60, to: 18 * 60, x: 21, y: 19, label: "no aeroporto" },
      { from: 18 * 60, to: 21 * 60, x: 31, y: 14, label: "na praça" },
      { from: 21 * 60, to: 26 * 60, x: 20, y: 17, label: "em casa" },
    ],
  },
];

// ---------- Consumo de refeições ----------
export const MEALS = RECIPES.map((r) => r.id);

export function totalRecipes() {
  return RECIPES.length;
}
