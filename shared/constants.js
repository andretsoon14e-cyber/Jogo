import { REGION_NPCS } from "./careers.js";

// ============================================================
// Vale Aconchegante — constantes compartilhadas cliente/servidor
// Tudo aqui é original do projeto. Nenhum asset de terceiros.
// ============================================================

export const TILE_SIZE = 32;
export const MAP_W = 80;
export const MAP_H = 60;

export const TILE = {
  GRASS: 0,
  TILLED: 1,
  WATER: 2,
  PATH: 3,
  SAND: 4,
  WOOD: 5,
  STONE: 6,
  TILLED_WATERED: 7,
  DARK_GRASS: 8,
  BRIDGE: 9,
};

export const SEASONS = ["Primavera", "Verão", "Outono", "Inverno"];
export const SEASON_COLORS = ["#7ac74f", "#5fb85f", "#c9a227", "#dfe9f3"];
export const WEATHER = ["Ensolarado", "Nublado", "Chuvoso", "Nevoa", "Neve"];
export const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

// Culturas: preço de semente, venda, dias, estação
export const CROPS = {
  nabo: { name: "Nabo", seedPrice: 20, sellPrice: 60, daysToGrow: 3, season: 0, color: "#ff6b6b", icon: "🥕" },
  batata: { name: "Batata", seedPrice: 30, sellPrice: 85, daysToGrow: 4, season: 0, color: "#d2a679", icon: "🥔" },
  morango: { name: "Morango", seedPrice: 50, sellPrice: 120, daysToGrow: 5, season: 0, color: "#ff2e63", icon: "🍓" },
  tomate: { name: "Tomate", seedPrice: 40, sellPrice: 90, daysToGrow: 4, season: 1, color: "#e74c3c", icon: "🍅" },
  milho: { name: "Milho", seedPrice: 45, sellPrice: 110, daysToGrow: 5, season: 1, color: "#f1c40f", icon: "🌽" },
  abobora: { name: "Abóbora", seedPrice: 60, sellPrice: 150, daysToGrow: 6, season: 2, color: "#e67e22", icon: "🎃" },
  trigo: { name: "Trigo", seedPrice: 25, sellPrice: 70, daysToGrow: 4, season: 1, color: "#f5d76e", icon: "🌾" },
  repolho: { name: "Repolho", seedPrice: 35, sellPrice: 95, daysToGrow: 5, season: 3, color: "#a8d08d", icon: "🥬" },
};

export const ITEM_INFO = {
  madeira: { name: "Madeira", icon: "🪵", sellPrice: 8 },
  pedra: { name: "Pedra", icon: "🪨", sellPrice: 5 },
  peixe: { name: "Peixe", icon: "🐟", sellPrice: 40 },
  ovo: { name: "Ovo", icon: "🥚", sellPrice: 25 },
  leite: { name: "Leite", icon: "🥛", sellPrice: 45 },
  la: { name: "Lã", icon: "🧶", sellPrice: 60 },
  minerio: { name: "Minério", icon: "💎", sellPrice: 70 },
  cogumelo: { name: "Cogumelo", icon: "🍄", sellPrice: 30 },
  mel: { name: "Mel", icon: "🍯", sellPrice: 80 },
  queijo: { name: "Queijo", icon: "🧀", sellPrice: 70 },
  concha: { name: "Concha", icon: "🐚", sellPrice: 35 },
  carvao: { name: "Carvão", icon: "🪨", sellPrice: 12 },
};

export const TOOLS = {
  enxada: { name: "Enxada", icon: "⛏️", price: 0 },
  regador: { name: "Regador", icon: "🚿", price: 0 },
  foice: { name: "Foice", icon: "🌾", price: 0 },
  machado: { name: "Machado", icon: "🪓", price: 150 },
  picareta: { name: "Picareta", icon: "⛏", price: 150 },
  vara: { name: "Vara de pesca", icon: "🎣", price: 100 },
};

// ---------- Cidade ----------
// Layout pensado para não haver sobreposição e para todos os prédios
// terem porta acessível a partir dos caminhos.
export const BUILDINGS = [
  { id: "prefeitura", name: "Prefeitura", x: 30, y: 8, w: 8, h: 6, color: "#d5d8dc", roof: "#c0392b", icon: "🏛️" },
  { id: "clinica", name: "Clínica", x: 39, y: 8, w: 6, h: 5, color: "#a9cce3", roof: "#2980b9", icon: "🏥" },
  { id: "carpintaria", name: "Carpintaria", x: 47, y: 8, w: 7, h: 5, color: "#e59866", roof: "#784212", icon: "🪵" },
  { id: "mercado", name: "Mercado Central", x: 27, y: 16, w: 7, h: 5, color: "#f9e79f", roof: "#d4ac0d", icon: "🏪" },
  { id: "taverna", name: "Taverna", x: 37, y: 17, w: 7, h: 5, color: "#f5b041", roof: "#7d6608", icon: "🍺" },
  { id: "ferraria", name: "Ferraria", x: 47, y: 17, w: 7, h: 5, color: "#aab7b8", roof: "#2c3e50", icon: "🔨" },
  { id: "casa_player", name: "Sua Casa (abandonada)", x: 8, y: 38, w: 6, h: 5, color: "#d5a6a6", roof: "#6b2f2f", icon: "🏚️" },
  { id: "celeiro", name: "Celeiro Comunitário", x: 13, y: 29, w: 8, h: 5, color: "#f0b27a", roof: "#7e5109", icon: "🚜" },
  { id: "banco", name: "Banco do Vale", x: 39, y: 24, w: 5, h: 4, color: "#d5d8dc", roof: "#7f8c8d", icon: "🏦" },
  { id: "igreja", name: "Igreja / Cerimônias", x: 30, y: 24, w: 5, h: 4, color: "#fef9e7", roof: "#aeb6bf", icon: "⛪" },
  { id: "mina", name: "Mina do Vale", x: 53, y: 3, w: 5, h: 4, color: "#95a5a6", roof: "#34495e", icon: "⛰️" },
  { id: "doca", name: "Píer do Vale", x: 29, y: 46, w: 5, h: 3, color: "#d2a679", roof: "#5d4037", icon: "⛵" },
  { id: "aerodromo", name: "Aeródromo", x: 49, y: 33, w: 6, h: 3, color: "#aed6f1", roof: "#21618c", icon: "✈️" },
];

export const BUILD_OPTIONS = {
  cerca: { name: "Cerca", desc: "Delimita seu terreno", w: 1, h: 1, cost: { madeira: 5 }, icon: "🪵", max: 60 },
  bau: { name: "Baú", desc: "Guarda itens (madeira clara)", w: 1, h: 1, cost: { madeira: 10 }, icon: "📦", color: "#d9b06a", max: 8 },
  bau_branco: { name: "Baú branco", desc: "Baú pintado - mesma receita", w: 1, h: 1, cost: { madeira: 10 }, icon: "📦", color: "#f5f5f0", max: 8 },
  bau_pinheiro: { name: "Baú pinheiro", desc: "Madeira clara de pinheiro", w: 1, h: 1, cost: { madeira: 10 }, icon: "📦", color: "#e8d5a8", max: 8 },
  bau_carvalho: { name: "Baú carvalho", desc: "Madeira nobre escura", w: 1, h: 1, cost: { madeira: 10 }, icon: "📦", color: "#b78d5a", max: 8 },
  bau_nogueira: { name: "Baú nogueira", desc: "Madeira escura", w: 1, h: 1, cost: { madeira: 10 }, icon: "📦", color: "#6b4a2f", max: 8 },
  bau_cerejeira: { name: "Baú cerejeira", desc: "Tom rosado", w: 1, h: 1, cost: { madeira: 10 }, icon: "📦", color: "#d9a0a0", max: 8 },
  celeiro: { name: "Celeiro", desc: "Abriga animais e produção", w: 4, h: 3, cost: { madeira: 30, pedra: 15, gold: 800 }, icon: "🏚️", max: 2 },
  estufa: { name: "Estufa", desc: "Plante em qualquer estação", w: 4, h: 3, cost: { madeira: 40, pedra: 20, gold: 1200 }, icon: "🌿", max: 2 },
  oficina: { name: "Oficina", desc: "Produção e artesanato", w: 3, h: 3, cost: { madeira: 25, pedra: 10, gold: 600 }, icon: "🔧", max: 2 },
  casa_exp: { name: "Expansão da Casa", desc: "+1 cômodo", w: 3, h: 3, cost: { madeira: 20, pedra: 10, gold: 500 }, icon: "🏠", max: 1 },
  pocilga: { name: "Pocilga", desc: "Criação de porcos", w: 3, h: 2, cost: { madeira: 20, pedra: 5, gold: 500 }, icon: "🐷", max: 2 },
};

export const ANIMALS = {
  galinha: { name: "Galinha", icon: "🐔", price: 250, product: "ovo", productChance: 0.85 },
  vaca: { name: "Vaca", icon: "🐄", price: 600, product: "leite", productChance: 0.8 },
  ovelha: { name: "Ovelha", icon: "🐑", price: 500, product: "la", productChance: 0.7 },
};

// ---------- NPCs ----------
// pos = posição base; rotina = faixas de horário com destino.
// A posição exibida é calculada no cliente de forma determinística,
// então todos os jogadores veem o mesmo morador no mesmo lugar.
export const NPCS_DATA = [
  {
    id: "maria", name: "Maria", role: "Prefeita", age: "adulto", size: 1.0, color: "#e74c3c", accent: "#7b241c", region: "vale",
    personality: "Acolhedora e organizada. Cuida da cidade há 10 anos.",
    likes: ["morango", "cogumelo"], dislikes: ["pedra"],
    story: "Maria cresceu na praça e sonha em ver o vale cheio de festivais novamente.",
    home: { x: 33, y: 15 },
    routine: [
      { from: 8 * 60, to: 18 * 60, x: 33, y: 15, label: "na Prefeitura" },
      { from: 18 * 60, to: 22 * 60, x: 37, y: 23, label: "na Praça" },
      { from: 22 * 60, to: 26 * 60, x: 31, y: 22, label: "em casa" },
    ],
  },
  {
    id: "joao", name: "João Lenhador", role: "Carpinteiro", age: "adulto", size: 1.05, color: "#8b4513", accent: "#3e2723", region: "vale",
    personality: "Calmo, fala pouco mas ajuda sempre. Adora madeira rara.",
    likes: ["madeira", "cogumelo"], dislikes: ["peixe"],
    story: "João aprendeu o ofício com o pai e guarda um projeto secreto na gaveta.",
    home: { x: 50, y: 13 },
    routine: [
      { from: 7 * 60, to: 17 * 60, x: 50, y: 13, label: "na Carpintaria" },
      { from: 17 * 60, to: 20 * 60, x: 42, y: 14, label: "na praça" },
      { from: 20 * 60, to: 26 * 60, x: 47, y: 22, label: "em casa" },
    ],
  },
  {
    id: "ana", name: "Ana", role: "Mercadora", age: "adolescente", size: 0.88, color: "#f1c40f", accent: "#7d6608", region: "vale",
    personality: "Energética, conhece todos os preços. Filha da Maria.",
    likes: ["milho", "artesanato"], dislikes: ["pedra"],
    story: "Ana quer abrir um mercado maior e vive anotando ideias num caderno.",
    home: { x: 31, y: 22 },
    routine: [
      { from: 8 * 60, to: 20 * 60, x: 31, y: 22, label: "no Mercado" },
      { from: 20 * 60, to: 23 * 60, x: 37, y: 23, label: "na Praça" },
      { from: 23 * 60, to: 26 * 60, x: 31, y: 22, label: "em casa" },
    ],
  },
  {
    id: "carlos", name: "Seu Carlos", role: "Ferreiro", age: "adulto", size: 1.08, color: "#7f8c8d", accent: "#2c3e50", region: "vale",
    personality: "Ranzinza mas com coração bom. Ex-minerador.",
    likes: ["minerio", "pedra"], dislikes: ["nabo"],
    story: "Carlos abandonou a mina após um acidente. Talvez volte se alguém o convencer.",
    home: { x: 50, y: 22 },
    routine: [
      { from: 9 * 60, to: 18 * 60, x: 50, y: 22, label: "na Ferraria" },
      { from: 18 * 60, to: 20 * 60, x: 44, y: 23, label: "na Taverna" },
      { from: 20 * 60, to: 26 * 60, x: 44, y: 22, label: "em casa" },
    ],
  },
  {
    id: "luna", name: "Luna", role: "Pescadora", age: "adulto", size: 0.95, color: "#3498db", accent: "#1a5276", region: "vale",
    personality: "Aventureira, conhece todos os rios e lendas do lago.",
    likes: ["peixe", "concha"], dislikes: ["ovo"],
    story: "Luna procura o lendário Peixe-Lua que só aparece em noites de chuva.",
    home: { x: 14, y: 33 },
    routine: [
      { from: 6 * 60, to: 19 * 60, x: 14, y: 33, label: "no Lago" },
      { from: 19 * 60, to: 22 * 60, x: 24, y: 26, label: "na praça" },
      { from: 22 * 60, to: 26 * 60, x: 21, y: 30, label: "em casa" },
    ],
  },
  {
    id: "pedro", name: "Pedro", role: "Médico", age: "adulto", size: 1.02, color: "#1abc9c", accent: "#0e6251", region: "vale",
    personality: "Gentil, cuida da clínica. Gosta de chás de ervas.",
    likes: ["mel", "cogumelo"], dislikes: ["minerio"],
    story: "Pedro pesquisa as plantas medicinais da floresta para um livro.",
    home: { x: 41, y: 13 },
    routine: [
      { from: 8 * 60, to: 18 * 60, x: 41, y: 13, label: "na Clínica" },
      { from: 18 * 60, to: 21 * 60, x: 38, y: 14, label: "na praça" },
      { from: 21 * 60, to: 26 * 60, x: 39, y: 22, label: "em casa" },
    ],
  },
  { id: "sofia", name: "Sofia", role: "Professora", color: "#9b59b6", accent: "#4a235a", region: "vale", age: "adulto", size: 0.96, personality: "Doce, adora livros e ensina as crianças na biblioteca.", likes: ["mel","cogumelo"], dislikes: ["carvao"], story: "Sofia veio da cidade para abrir a escolinha do vale.", home: { x: 32, y: 12 }, routine: [{ from: 8*60, to: 16*60, x:32, y:12, label:"na Escola" }, { from:16*60,to:19*60,x:37,y:23,label:"na Praça"}, {from:19*60,to:26*60,x:32,y:12,label:"em casa"}] },
  { id: "marcos", name: "Marcos", role: "Bombeiro", color: "#e74c3c", accent: "#7b241c", region: "vale", age: "adulto", size: 1.0, personality: "Corajoso, sempre pronto para ajudar em emergências.", likes: ["madeira","pedra"], dislikes: ["peixe"], story: "Marcos cuida da segurança do vale e treina voluntários.", home: { x: 44, y: 28 }, routine: [{ from: 7*60,to:15*60,x:44,y:28,label:"no Quartel"}, {from:15*60,to:20*60,x:37,y:24,label:"na Praça"}, {from:20*60,to:26*60,x:44,y:28,label:"em casa"}] },
  { id: "helena", name: "Helena", role: "Enfermeira", color: "#ffffff", accent: "#a9cce3", region: "vale", age: "adulto", size: 0.96, personality: "Atenciosa, trabalha com o Pedro na clínica.", likes: ["queijo","mel"], dislikes: ["minerio"], story: "Helena aprendeu enfermagem com a avó curandeira.", home: { x: 42, y: 12 }, routine: [{ from: 8*60,to:18*60,x:42,y:12,label:"na Clínica"}, {from:18*60,to:21*60,x:42,y:14,label:"no Jardim"}, {from:21*60,to:26*60,x:42,y:12,label:"em casa"}] },
  { id: "rafael", name: "Rafael", role: "Veterinário", color: "#1abc9c", accent: "#0e6251", region: "vale", age: "adulto", size: 1.0, personality: "Calmo com animais, cuida do celeiro.", likes: ["leite","ovo"], dislikes: ["pedra"], story: "Rafael sonha em abrir um abrigo para animais silvestres.", home: { x: 14, y: 32 }, routine: [{ from: 6*60,to:17*60,x:14,y:32,label:"no Celeiro"}, {from:17*60,to:20*60,x:24,y:26,label:"na Praça"}, {from:20*60,to:26*60,x:14,y:32,label:"em casa"}] },
  { id: "clara", name: "Clara", role: "Artista", color: "#f39c12", accent: "#7e5109", region: "vale", age: "adulto", size: 1.0, personality: "Criativa, pinta murais pela vila.", likes: ["flor","concha"], dislikes: ["madeira"], story: "Clara expõe suas obras na igreja nos festivais.", home: { x: 31, y: 27 }, routine: [{ from: 9*60,to:17*60,x:31,y:27,label:"no Ateliê"}, {from:17*60,to:20*60,x:37,y:23,label:"na Praça"}, {from:20*60,to:26*60,x:31,y:27,label:"em casa"}] },
  { id: "edu", name: "Edu", role: "Músico", color: "#2ecc71", accent: "#145a32", region: "vale", age: "adulto", size: 1.0, personality: "Boêmio, toca violão na taverna à noite.", likes: ["vinho","peixe"], dislikes: ["pedra"], story: "Edu compõe canções sobre o vale e seus moradores.", home: { x: 38, y: 19 }, routine: [{ from:10*60,to:16*60,x:38,y:19,label:"na Taverna"}, {from:16*60,to:20*60,x:37,y:23,label:"na Praça"}, {from:20*60,to:26*60,x:38,y:19,label:"em casa"}] },
  { id: "paulo", name: "Paulo", role: "Padeiro", color: "#d35400", accent: "#7e5109", region: "vale", age: "adulto", size: 1.0, personality: "Madrugador, aroma de pão fresco às 5h.", likes: ["trigo","mel"], dislikes: ["peixe"], story: "Paulo herdou a padaria do pai e testa receitas novas.", home: { x: 27, y: 19 }, routine: [{ from:5*60,to:14*60,x:27,y:19,label:"na Padaria"}, {from:14*60,to:18*60,x:37,y:23,label:"na Praça"}, {from:18*60,to:26*60,x:27,y:19,label:"em casa"}] },
  { id: "larissa", name: "Larissa", role: "Jardineira", color: "#27ae60", accent: "#1e8449", region: "vale", age: "adulto", size: 1.0, personality: "Apaixonada por flores, cuida dos canteiros.", likes: ["morango","mel"], dislikes: ["carvao"], story: "Larissa quer criar o jardim mais bonito do vale.", home: { x: 18, y: 20 }, routine: [{ from:6*60,to:18*60,x:18,y:20,label:"no Jardim"}, {from:18*60,to:21*60,x:37,y:23,label:"na Praça"}, {from:21*60,to:26*60,x:18,y:20,label:"em casa"}] },
  { id: "roberto", name: "Roberto", role: "Pescador Velho", color: "#5d6d7e", accent: "#2c3e50", region: "vale", age: "adulto", size: 1.0, personality: "Sábio do mar, conta lendas do rio.", likes: ["peixe","concha"], dislikes: ["ovo"], story: "Roberto conhece cada curva do Rio do Vale.", home: { x: 30, y: 46 }, routine: [{ from:5*60,to:19*60,x:30,y:46,label:"no Píer"}, {from:19*60,to:22*60,x:37,y:23,label:"na Taverna"}, {from:22*60,to:26*60,x:30,y:46,label:"em casa"}] },
  { id: "fernanda", name: "Fernanda", role: "Bibliotecária", color: "#8e44ad", accent: "#4a235a", region: "vale", age: "adulto", size: 1.0, personality: "Quieta, guarda histórias antigas.", likes: ["cogumelo","queijo"], dislikes: ["peixe"], story: "Fernanda organiza o acervo da biblioteca restaurada.", home: { x: 33, y: 11 }, routine: [{ from:8*60,to:17*60,x:33,y:11,label:"na Biblioteca"}, {from:17*60,to:20*60,x:37,y:23,label:"na Praça"}, {from:20*60,to:26*60,x:33,y:11,label:"em casa"}] },
];

export const NPC_DIALOGS = {
  bia: [
    "O mar hoje está manso. Quer uma carona até a ilha?",
    "Um bom marinheiro sabe quando voltar para casa.",
    "Trouxe peixe? A peixaria da vila paga bem.",
    "Já pensou em trabalhar comigo? A rota nova precisa de gente.",
  ],
  tai: [
    "As ruínas falam com quem escuta o vento.",
    "Conchas brilhantes aparecem depois da chuva.",
    "Se trouxer 3 peixes, te mostro o caminho secreto.",
    "A ilha dá tudo para quem cuida dela.",
  ],
  rita: [
    "Na cidade, o preço bom está em quem negocia bem.",
    "Compro queijo e tortas por um valor justo. Interessa?",
    "Vim do vale, sabia? Quero investir de volta.",
    "Traga uma pizza da fazenda e conversamos.",
  ],
  duda: [
    "Voar é ver o vale inteiro de uma vez!",
    "O avião sai às 9h. Não se atrase.",
    "Um dia vou pousar na ilha, você vai ver.",
    "Trouxe mel? Adoro um pão com mel antes do voo.",
  ],
  maria: [
    "Olá, {name}! Bem-vindo ao nosso vale. A praça precisa de ajuda quando tiver um tempinho.",
    "Que dia lindo! Já regou suas plantas hoje?",
    "Você conheceu a Luna, no lago? Ela conta histórias incríveis.",
    "Cada estação traz novas sementes. A primavera é só o começo!",
    "Se todos contribuírem, a cidade volta a ter festivais como antigamente.",
  ],
  joao: [
    "Oi. Madeira boa é vida. Preciso de ajuda com a carpintaria.",
    "Cuidado com as árvores grandes. Use o machado certo.",
    "A floresta ao norte esconde cogumelos raros quando chove.",
    "Um celeiro bem feito dura gerações. É o que meu pai dizia.",
    "Se trouxer madeira suficiente, posso te ensinar uma receita nova.",
  ],
  ana: [
    "Bem-vindo ao Mercado! Sementes frescas todo dia. Vende seus produtos aqui também!",
    "Meu melhor preço hoje: morangos!",
    "Se trouxer peixe, pago bem!",
    "A praça cheia de gente é o que faz a economia girar.",
    "Você sabia que dá para vender ovos e leite também?",
  ],
  carlos: [
    "Hm. Quer melhorar ferramentas? Traga minério e ouro.",
    "A mina está cheia de pedras. Cuidado com a escuridão.",
    "Já pescou hoje? Luna vai te ensinar.",
    "Ferraria boa não fecha cedo. Mas eu fecho.",
    "Pedra boa faz parede boa. Madeira boa faz telhado.",
  ],
  luna: [
    "O lago está ótimo hoje! Quer pescar? Equipamento na cabana.",
    "Dizem que um peixe lendário aparece na chuva, de noite...",
    "Se pegar 3 peixes, te ensino um segredo!",
    "A água conta histórias para quem sabe escutar.",
    "Já viu o pôr do sol da praia? É o melhor do vale.",
  ],
  pedro: [
    "Cuide da saúde! Ervas na floresta fazem ótimos chás.",
    "A clínica está aberta 8h-18h se precisar.",
    "Mel + ervas = energia extra para trabalhar.",
    "Estou escrevendo um livro sobre as plantas do vale.",
    "Durma cedo. A fazenda agradece. Seu corpo também.",
  ],
  sofia: ["As crianças adoram histórias do vale. Quer ajudar na escola?", "Ler abre portas. Visite a biblioteca!", "Um dia o vale terá sua própria universidade. Sonhar não custa."] ,
  marcos: ["Segurança primeiro! Já testou seu extintor?", "Treino de bombeiros todo sábado. Venha!", "Fogo na lareira é aconchegante, mas cuidado."] ,
  helena: ["Tome muita água e descanse. Sua saúde importa.", "A clínica agora tem chás especiais da floresta.", "Pedro e eu estamos pesquisando uma cura rara."] ,
  rafael: ["Seus animais estão bem? Posso dar uma olhada.", "Uma vaca feliz dá mais leite. Cuide bem dela.", "O celeiro precisa de feno fresco todo dia."] ,
  clara: ["As cores do outono me inspiram. Já pintou hoje?", "Vou expor meu mural novo na igreja no festival.", "Arte é como plantar: precisa paciência."] ,
  edu: ["♪ Uma canção para alegrar seu dia? ♪", "Toco na taverna todas as noites às 19h. Venha!", "Música e boa companhia curam qualquer tristeza."] ,
  paulo: ["Pão quentinho saindo! Quer provar?", "Acordo às 5h para preparar a fornada. Vale a pena.", "Trigo fresco da sua fazenda faz o melhor pão."] ,
  larissa: ["Essas flores precisam de água. Você pode ajudar?", "O jardim da praça vai ficar lindo na primavera!", "Cada flor tem uma história. Quer ouvir?"] ,
  roberto: ["O Rio do Vale esconde segredos antigos. Já pescou lá?", "Pesquei um peixe de 2 metros uma vez. Juro!", "O píer precisa de reparos. Traga madeira."] ,
  fernanda: ["Shh, a biblioteca é lugar de silêncio e descoberta.", "Encontrei um mapa antigo do vale. Quer ver?", "Livros guardam a memória do vale. Ajude a preservá-la."] ,
};

// Presentes: multiplicador de amizade
export const FRIENDSHIP = {
  GIFT: 8,
  LIKE_BONUS: 6,
  DISLIKE_PENALTY: 4,
  TALK: 2,
  MAX: 100,
};

// ---------- Missões ----------
// stats acumulam ações (colheitas, peixes, madeira...) e nunca diminuem.
export const QUESTS = [
  { id: "q1", title: "Primeira Colheita", desc: "Colha 5 vegetais na sua fazenda", stat: "harvested", need: 5, reward: 200, xp: 50, skill: "farming" },
  { id: "q2", title: "Ajuda na Carpintaria", desc: "Colete 10 madeiras", stat: "wood", need: 10, reward: 300, xp: 70, skill: "building" },
  { id: "q3", title: "Peixe para Luna", desc: "Pesque 3 peixes", stat: "fish", need: 3, reward: 250, xp: 60, skill: "fishing" },
  { id: "q4", title: "Pedra da Mina", desc: "Minere 15 pedras", stat: "stone", need: 15, reward: 350, xp: 80, skill: "mining" },
  { id: "q5", title: "Reforma da Praça", desc: "Contribua com 500 ouros na praça", stat: "donated", need: 500, reward: 0, xp: 100, skill: "commerce" },
  { id: "q6", title: "Fazendeiro Dedicado", desc: "Colha 10 nabos", stat: "harvested_nabo", need: 10, reward: 500, xp: 120, skill: "farming" },
  { id: "q7", title: "Amigo do Vale", desc: "Conquiste 30 pontos de amizade com moradores", stat: "friendship", need: 30, reward: 300, xp: 80, skill: "commerce" },
];

export const SKILLS = {
  farming: { name: "Agricultura", icon: "🌱" },
  fishing: { name: "Pesca", icon: "🎣" },
  mining: { name: "Mineração", icon: "⛏️" },
  building: { name: "Construção", icon: "🔨" },
  cooking: { name: "Culinária", icon: "🍳" },
  commerce: { name: "Comércio", icon: "💰" },
};

export const COMMUNITY_PROJECTS = {
  praca: { name: "Reforma da Praça", desc: "Libera festivais e a feira de produtores.", goal: 500, icon: "⛲" },
  biblioteca: { name: "Restaurar Biblioteca", desc: "Desbloqueia pesquisas e novas receitas.", goal: 800, icon: "📚" },
  ponte: { name: "Construir a Ponte", desc: "Abre o acesso à outra margem do rio.", goal: 1000, icon: "🌉" },
  estrada: { name: "Melhorar as Estradas", desc: "Deixa a cidade mais bonita e rápida de atravessar.", goal: 600, icon: "🛣️" },
  porto: { name: "Porto e Rotas Marítimas", desc: "Libera o barco para a Vila Costeira e a Ilha Tropical.", goal: 1200, icon: "⚓" },
  estacao: { name: "Estação de Transporte", desc: "Libera o avião regional para a Cidade Grande.", goal: 1800, icon: "✈️" },
};

export const PLAYER_SKINS = [
  { id: "s1", color: "#ff9a9e", hat: "#e74c3c" },
  { id: "s2", color: "#a1c4fd", hat: "#2980b9" },
  { id: "s3", color: "#ffecd2", hat: "#7d6608" },
  { id: "s4", color: "#84fab0", hat: "#1e8449" },
  { id: "s5", color: "#fccb90", hat: "#6e2c00" },
  { id: "s6", color: "#d299c2", hat: "#6c3483" },
  { id: "s7", color: "#ff9a9e", hat: "#e74c3c", necklace: "#e8b44a" },
  { id: "s8", color: "#a1c4fd", hat: "#2980b9", necklace: "#c0c0c0" },
  { id: "s9", color: "#84fab0", hat: "#1e8449", necklace: "#e8b44a" },
  { id: "s10", color: "#fccb90", hat: "#6e2c00", necklace: "#ff6b9e" },
  { id: "s11", color: "#d299c2", hat: "#6c3483", necklace: "#ffd700" },
  { id: "s12", color: "#ffecd2", hat: "#7d6608", necklace: "#a8d8ff" },
];


export const HAT_OPTIONS = [
  { id: "none", name: "Sem chapéu", hat: { type: "none" }, gender: "uni" },
  { id: "straw", name: "Chapéu palha", hat: { type: "straw", color: "#e6c979" }, gender: "uni", asset: "layer_hat_straw.png" },
  { id: "straw_red", name: "Palha vermelha", hat: { type: "straw", color: "#d9a86a" }, gender: "uni" },
  { id: "straw_flower", name: "Palha com flor", hat: { type: "flower", color: "#e6c979", color2: "#ff6b8a" }, gender: "fem" },
  { id: "cap_blue", name: "Boné azul", hat: { type: "cap", color: "#3f6f9e" }, gender: "masc" },
  { id: "cap_red", name: "Boné vermelho", hat: { type: "cap", color: "#c0392b" }, gender: "masc" },
  { id: "beanie", name: "Touca cinza", hat: { type: "cap", color: "#7a7a7a" }, gender: "masc" },
  { id: "bandana", name: "Bandana", hat: { type: "bandana", color: "#d9b06a" }, gender: "fem" },
  { id: "bandana_red", name: "Bandana vermelha", hat: { type: "bandana", color: "#c0392b" }, gender: "fem" },
  { id: "flower", name: "Coroa floral", hat: { type: "flower", color: "#8fc46a", color2: "#ffc6dd" }, gender: "fem" },
  { id: "tiara_fem", name: "Tiara pérola", hat: { type: "flower", color: "#fff8dc", color2: "#e8d5a8" }, gender: "fem" },
  { id: "sailor", name: "Marinheiro", hat: { type: "sailor", color: "#3b6f9e" }, gender: "masc" },
  { id: "sailor_white", name: "Marinheiro branco", hat: { type: "sailor", color: "#ffffff" }, gender: "masc" },
  { id: "wizard", name: "Bruxo roxo", hat: { type: "cap", color: "#6c3483" }, gender: "uni", asset: "layer_hat_wizard.png" },
  { id: "goggles", name: "Óculos", hat: { type: "goggles", color: "#6b4a2f" }, gender: "masc" },
  { id: "cowboy", name: "Cowboy marrom", hat: { type: "straw", color: "#8d6e63" }, gender: "masc", asset: "layer_hat_cowboy.png" },
  { id: "chapeu_sol_fem", name: "Chapéu sol", hat: { type: "straw", color: "#f5e6b8" }, gender: "fem" },
];
export const SHIRT_OPTIONS = [
  { id: "red", name: "Xadrez morango", shirt: "#e2695e", shirtDark: "#b74d46", design: "plaid", desc: "Xadrez vermelho", gender: "fem" },
  { id: "blue", name: "Laço azul", shirt: "#5b9bd5", shirtDark: "#3f79ad", design: "bow", desc: "Azul com laço", gender: "fem" },
  { id: "yellow", name: "Floral amarela", shirt: "#e8c15c", shirtDark: "#c19a3d", design: "floral", desc: "Amarela floral", gender: "fem" },
  { id: "green", name: "Suéter cogumelo", shirt: "#7cb98a", shirtDark: "#5a9470", design: "sweater", desc: "Verde tricô", gender: "fem", asset: "layer_shirt_yellow.png" },
  { id: "purple", name: "Babados lilás", shirt: "#b58fd1", shirtDark: "#8f6bab", design: "ruffled", desc: "Lilás babados", gender: "fem", asset: "layer_shirt_white.png" },
  { id: "pink", name: "Corações rosa", shirt: "#ff9a9e", shirtDark: "#c97a7e", design: "hearts", desc: "Rosa corações", gender: "fem" },
  { id: "cream", name: "Jardineira trigo", shirt: "#ffecd2", shirtDark: "#c9a86a", design: "jumpsuit", desc: "Creme trigo", gender: "fem" },
  { id: "blusa_fem", name: "Blusa amarela", shirt: "#f1c40f", shirtDark: "#b7950b", design: "solid", desc: "Amarela solta", gender: "fem" },
  { id: "orange", name: "Fazenda laranja", shirt: "#e89a5c", shirtDark: "#c07740", design: "western", desc: "Laranja bolsos", gender: "masc" },
  { id: "denim", name: "Jeans azul", shirt: "#6b8fb0", shirtDark: "#4a6b8a", design: "denim", desc: "Jeans clássico", gender: "masc" },
  { id: "striped", name: "Listrado navy", shirt: "#4a6fa5", shirtDark: "#34495e", design: "striped", desc: "Listras navy", gender: "masc" },
  { id: "overalls", name: "Macacão marrom", shirt: "#a67c52", shirtDark: "#8a6540", design: "overalls", desc: "Macacão fazenda", gender: "masc" },
  { id: "hoodie", name: "Moletom verde", shirt: "#6aa84f", shirtDark: "#4a7c2e", design: "hoodie", desc: "Moletom floresta", gender: "masc" },
  { id: "flanel_masc", name: "Flanela lenhador", shirt: "#c0392b", shirtDark: "#7b241c", design: "plaid", desc: "Vermelho lenhador", gender: "masc" },
  { id: "polo_masc", name: "Polo cáqui", shirt: "#d9c9a4", shirtDark: "#a89a7a", design: "solid", desc: "Polo leve", gender: "masc" },
  { id: "vestido_fem", name: "Vestido flor", shirt: "#8fc46a", shirtDark: "#5a8f3a", design: "floral", desc: "Floral leve", gender: "uni" },
];
export const NECKLACE_OPTIONS = [
  { id: "none", name: "Sem colar", necklace: null },
  { id: "gold", name: "Ouro", necklace: "#e8b44a" },
  { id: "silver", name: "Prata", necklace: "#c0c0c0" },
  { id: "gold2", name: "Ouro claro", necklace: "#ffd700" },
  { id: "pinkcol", name: "Rosa", necklace: "#ff6b9e" },
  { id: "ice", name: "Gelo", necklace: "#a8d8ff" },
  { id: "emerald", name: "Esmeralda", necklace: "#4ecb7a" },
];
export const BRACELET_OPTIONS = [
  { id: "none", name: "Sem pulseira", bracelet: null },
  { id: "goldB", name: "Ouro", bracelet: "#e8b44a" },
  { id: "silverB", name: "Prata", bracelet: "#c0c0c0" },
  { id: "leather", name: "Couro", bracelet: "#6e2c00" },
  { id: "bead", name: "Miçanga", bracelet: "#ff6b9e" },
];
export const PANTS_OPTIONS = [
  { id: "jeans", name: "Jeans", pants: "#43506b", desc: "Jeans clássico", gender: "masc" },
  { id: "bege", name: "Bege", pants: "#d9c9a4", desc: "Sarja clara", gender: "masc" },
  { id: "marrom", name: "Marrom", pants: "#6b4a2f", desc: "Marrom terra", gender: "masc" },
  { id: "jeans_claro", name: "Jeans claro", pants: "#6b7d9c", desc: "Jeans lavado", gender: "masc", asset: "layer_pants_black.png" },
  { id: "caqui", name: "Cáqui", pants: "#c2a46a", desc: "Cáqui campo", gender: "masc", asset: "layer_pants_cargo.png" },
  { id: "bermuda", name: "Bermuda cáqui", pants: "#c2b280", desc: "Bermuda verão", gender: "masc" },
  { id: "cargo_masc", name: "Cargo verde", pants: "#4a5a3a", desc: "Cargo militar", gender: "masc" },
  { id: "preto", name: "Preto", pants: "#2b2b2b", desc: "Preto urbano", gender: "uni" },
  { id: "cinza", name: "Cinza", pants: "#7a7a7a", desc: "Cinza pedra", gender: "uni", asset: "layer_skirt_denim.png" },
  { id: "saia_azul", name: "Saia azul", pants: "#4a6fa5", desc: "Saia plissada azul", gender: "fem", asset: "layer_skirt_floral.png" },
  { id: "saia_rosa", name: "Saia rosa", pants: "#e89a9e", desc: "Saia rodada rosa", gender: "fem" },
  { id: "saia_verde", name: "Saia verde", pants: "#5a8f5a", desc: "Saia longa verde", gender: "fem", asset: "layer_skirt_beige.png" },
  { id: "saia_longa_fem", name: "Saia longa preta", pants: "#2b2b2b", desc: "Saia midi", gender: "fem" },
  { id: "legging_fem", name: "Legging vinho", pants: "#6b2630", desc: "Legging justa", gender: "fem" },
  { id: "calca_flare_fem", name: "Calça flare", pants: "#6b5a4a", desc: "Calça flare", gender: "fem" },
  { id: "short_fem", name: "Short jeans", pants: "#5d7fa0", desc: "Short curto", gender: "fem" },
];
export const EYE_COLOR_OPTIONS = [
  { id: "castanho", name: "Castanho", eye: "#5a3a1e", eyeLight: "#8a6240" },
  { id: "azul", name: "Azul", eye: "#3f7f9e", eyeLight: "#6fb3d6" },
  { id: "verde", name: "Verde", eye: "#3a6b3a", eyeLight: "#6bb06b" },
  { id: "mel", name: "Mel", eye: "#b5892e", eyeLight: "#e0b85a" },
  { id: "cinza", name: "Cinza", eye: "#6b6b6b", eyeLight: "#a0a0a0" },
  { id: "preto", name: "Preto", eye: "#1a1a1a", eyeLight: "#3a3a3a" },
  { id: "violeta", name: "Violeta", eye: "#5a3a8a", eyeLight: "#8a6bd6" },
  { id: "avela", name: "Avelã", eye: "#7a5a30", eyeLight: "#b8965a" },
];

export const SKIN_TONE_OPTIONS = [
  { id: "tone1", name: "Clara rosada", skin: "#ffe0bd", skinShade: "#e0b892" },
  { id: "tone2", name: "Clara bege", skin: "#f6c99b", skinShade: "#dba97e" },
  { id: "tone3", name: "Média", skin: "#dfa273", skinShade: "#c98d5f" },
  { id: "tone4", name: "Morena", skin: "#b97a4e", skinShade: "#a8683f" },
  { id: "tone5", name: "Marrom", skin: "#8a5434", skinShade: "#71402a" },
  { id: "tone6", name: "Retinta", skin: "#5a3a28", skinShade: "#3e2618" },
];
export const HAIR_STYLE_OPTIONS = [
  { id: "long", name: "Longo liso", gender: "fem" },
  { id: "short", name: "Curto", gender: "masc" },
  { id: "bob", name: "Bob", gender: "fem" },
  { id: "bun", name: "Coque", gender: "fem" },
  { id: "ponytail", name: "Rabo alto", gender: "fem" },
  { id: "wavy", name: "Ondulado", gender: "fem" },
  { id: "braided", name: "Tranças", gender: "fem" },
  { id: "curly", name: "Cacheado afro", gender: "uni" },
  { id: "pixie", name: "Pixie", gender: "fem" },
  { id: "mullet", name: "Mullet", gender: "masc", asset: "layer_hair_mullet.png" },
  { id: "spiky", name: "Espetado", gender: "masc", asset: "layer_hair_spiky.png" },
  { id: "bangs", name: "Franja", gender: "fem", asset: "layer_hair_bangs.png" },
  { id: "twin", name: "Maria-chiquinha", gender: "fem" },
  { id: "messy", name: "Desgrenhado", gender: "masc" },
  { id: "long_masc", name: "Longo solto", gender: "masc" },
  { id: "side_sweep", name: "Franja lateral", gender: "fem" },
  { id: "afro_puff", name: "Afro puff", gender: "uni", asset: "layer_hair_afro.png" },
  { id: "undercut", name: "Undercut", gender: "masc", asset: "layer_hair_undercut.png" },
  { id: "long_wavy_masc", name: "Longo ondulado", gender: "masc" },
  { id: "braid_long", name: "Trança longa", gender: "fem" },
];
export const BODY_OPTIONS = [
  { id: "baby_generic", name: "Bebê genérico", age: "baby", gender: "uni", asset: "body_baby_generic.png", scale: 1.05 },
  { id: "child_masc_A", name: "Menino criança A", age: "child", gender: "masc", asset: "body_child_masc_A.png", scale: 1.30 },
  { id: "child_masc_B", name: "Menino criança B", age: "child", gender: "masc", asset: "body_child_masc_B.png", scale: 1.30 },
  { id: "child_fem_A", name: "Menina criança A", age: "child", gender: "fem", asset: "body_child_fem_A.png", scale: 1.28 },
  { id: "child_fem_B", name: "Menina criança B", age: "child", gender: "fem", asset: "body_child_fem_B.png", scale: 1.28 },
  { id: "teen_masc_A", name: "Adolescente menino A", age: "teen", gender: "masc", asset: "body_teen_masc_A.png", scale: 1.45 },
  { id: "teen_masc_B", name: "Adolescente menino B", age: "teen", gender: "masc", asset: "body_teen_masc_B.png", scale: 1.45 },
  { id: "teen_fem_A", name: "Adolescente menina A", age: "teen", gender: "fem", asset: "body_teen_fem_A.png", scale: 1.42 },
  { id: "teen_fem_B", name: "Adolescente menina B", age: "teen", gender: "fem", asset: "body_teen_fem_B.png", scale: 1.42 },
  { id: "adult_masc_A", name: "Adulto homem A", age: "adult", gender: "masc", asset: "body_adult_masc_A.png", scale: 1.60 },
  { id: "adult_masc_B", name: "Adulto homem B", age: "adult", gender: "masc", asset: "body_adult_masc_B.png", scale: 1.60 },
  { id: "adult_fem_A", name: "Adulto mulher A", age: "adult", gender: "fem", asset: "body_adult_fem_A.png", scale: 1.55 },
  { id: "adult_fem_B", name: "Adulto mulher B", age: "adult", gender: "fem", asset: "body_adult_fem_B.png", scale: 1.55 },
  { id: "elder_masc_A", name: "Velhinho", age: "elder", gender: "masc", asset: "body_elder_masc_A.png", scale: 1.45 },
  { id: "elder_masc_B", name: "Velhinho B", age: "elder", gender: "masc", asset: "body_elder_masc_B.png", scale: 1.45 },
  { id: "elder_fem_A", name: "Velhinha", age: "elder", gender: "fem", asset: "body_elder_fem_A.png", scale: 1.42 },
  { id: "elder_fem_B", name: "Velhinha B", age: "elder", gender: "fem", asset: "body_elder_fem_B.png", scale: 1.42 },
];
export const GENDER_OPTIONS = [
  { id: "fem", name: "Feminino" },
  { id: "masc", name: "Masculino" },
];
export const HAIR_COLOR_OPTIONS = [
  { id: "castanho", name: "Castanho", hair: "#6b4226", hairDark: "#4a2c18" },
  { id: "loiro", name: "Loiro", hair: "#d9b06a", hairDark: "#a9814a" },
  { id: "ruivo", name: "Ruivo", hair: "#a45c2c", hairDark: "#7a3f1b" },
  { id: "preto", name: "Preto", hair: "#1f1612", hairDark: "#120c09" },
  { id: "rosa", name: "Rosa", hair: "#ff9a9e", hairDark: "#c76a6a" },
  { id: "branco", name: "Platinado", hair: "#f2e6cc", hairDark: "#d9b06a" },
];

export const PET_OPTIONS = [
  { id: "cat", name: "Gato", icon: "🐱" },
  { id: "dog", name: "Cão", icon: "🐶" },
  { id: "turtle", name: "Tartaruga", icon: "🐢" },
  { id: "parrot", name: "Papagaio", icon: "🦜" },
  { id: "fish", name: "Peixinho", icon: "🐠" },
  { id: "horse", name: "Cavalo", icon: "🐴", mount: true },
];
export const CHEST_COLOR_OPTIONS = [
  { id: "bau_pinheiro", name: "Baú pinheiro claro", color: "#e8d5a8", desc: "Madeira de pinheiro" },
  { id: "bau_carvalho", name: "Baú carvalho", color: "#b78d5a", desc: "Madeira nobre escura" },
  { id: "bau_branco", name: "Baú branco", color: "#f5f5f0", desc: "Pintado branco" },
  { id: "bau_nogueira", name: "Baú nogueira", color: "#6b4a2f", desc: "Madeira escura" },
  { id: "bau_cerejeira", name: "Baú cerejeira", color: "#d9a0a0", desc: "Tom rosado" },
];
export const START_INVENTORY = { nabo_seed: 5, batata_seed: 3, madeira: 5, pedra: 3 };
export const START_GOLD = 500;

const SKIN_FALLBACKS = {
  s1: { pants: "#43506b", skin: "#f6c99b", skinShade: "#dba97e", hair: "#6b4226", hairDark: "#4a2c18", hairStyle: "long" },
  s2: { pants: "#4a3f55", skin: "#ffe0bd", skinShade: "#e0b892", hair: "#d9b06a", hairDark: "#a9814a", hairStyle: "short" },
  s3: { pants: "#5a5140", skin: "#dfa273", skinShade: "#c98d5f", hair: "#3a2b22", hairDark: "#241a14", hairStyle: "bun" },
  s4: { pants: "#3f4f63", skin: "#b97a4e", skinShade: "#a8683f", hair: "#2b1d17", hairDark: "#1b120e", hairStyle: "short" },
  s5: { pants: "#4b4256", skin: "#ffe0bd", skinShade: "#e0b892", hair: "#a45c2c", hairDark: "#7a3f1b", hairStyle: "ponytail" },
  s6: { pants: "#455e52", skin: "#8a5434", skinShade: "#71402a", hair: "#1f1612", hairDark: "#120c09", hairStyle: "long" },
  s7: { pants: "#43506b", skin: "#f6c99b", skinShade: "#dba97e", hair: "#6b4226", hairDark: "#4a2c18", hairStyle: "long" },
  s8: { pants: "#4a3f55", skin: "#ffe0bd", skinShade: "#e0b892", hair: "#f2e6cc", hairDark: "#d9b06a", hairStyle: "ponytail" },
  s9: { pants: "#3f4f63", skin: "#b97a4e", skinShade: "#a8683f", hair: "#ff9a9e", hairDark: "#c76a6a", hairStyle: "short" },
  s10: { pants: "#5a5140", skin: "#dfa273", skinShade: "#c98d5f", hair: "#3a2b22", hairDark: "#241a14", hairStyle: "bun" },
  s11: { pants: "#4b4256", skin: "#ffe0bd", skinShade: "#e0b892", hair: "#2b1d17", hairDark: "#1b120e", hairStyle: "short" },
  s12: { pants: "#5a5140", skin: "#f6c99b", skinShade: "#dba97e", hair: "#1a1a2e", hairDark: "#0f0f1a", hairStyle: "long" },
};
export function buildCustomSpec(baseId, hatId, shirtId, necklaceId, braceletId, skinToneId, hairStyleId, hairColorId, pantsId, eyeColorId, bodyId) {
  const base = PLAYER_SKINS.find(s=>s.id===baseId) || PLAYER_SKINS[0];
  const fb = SKIN_FALLBACKS[baseId] || SKIN_FALLBACKS.s1;
  const hatOpt = HAT_OPTIONS.find(h=>h.id===hatId) || HAT_OPTIONS[0];
  const shirtOpt = SHIRT_OPTIONS.find(s=>s.id===shirtId) || SHIRT_OPTIONS[0];
  const neckOpt = NECKLACE_OPTIONS.find(n=>n.id===necklaceId) || NECKLACE_OPTIONS[0];
  const braceOpt = BRACELET_OPTIONS.find(b=>b.id===braceletId) || BRACELET_OPTIONS[0];
  const skinOpt = SKIN_TONE_OPTIONS.find(s=>s.id===skinToneId) || null;
  const hairStyleOpt = HAIR_STYLE_OPTIONS.find(h=>h.id===hairStyleId) || null;
  const hairColorOpt = HAIR_COLOR_OPTIONS.find(h=>h.id===hairColorId) || null;
  const pantsOpt = PANTS_OPTIONS.find(p=>p.id===pantsId) || null;
  const eyeOpt = EYE_COLOR_OPTIONS.find(e=>e.id===eyeColorId) || null;
  const bodyOpt = BODY_OPTIONS.find(b=>b.id===bodyId) || BODY_OPTIONS.find(b=>b.id==="adult_masc_A") || null;
  const skin = skinOpt ? skinOpt.skin : fb.skin;
  const skinShade = skinOpt ? skinOpt.skinShade : fb.skinShade;
  const hairStyle = hairStyleOpt ? hairStyleOpt.id : fb.hairStyle;
  const hair = hairColorOpt ? hairColorOpt.hair : fb.hair;
  const hairDark = hairColorOpt ? hairColorOpt.hairDark : fb.hairDark;
  const pants = pantsOpt ? pantsOpt.pants : fb.pants;
  const eyeColor = eyeOpt ? eyeOpt.eye : "#5a3a1e";
  const eyeLight = eyeOpt ? eyeOpt.eyeLight : "#8a6240";
  const bodyAsset = bodyOpt ? bodyOpt.asset : null;
  const bodyScale = bodyOpt ? bodyOpt.scale : 1;
  const bodyAge = bodyOpt ? bodyOpt.age : "adult";
  const hairAsset = hairStyleOpt ? hairStyleOpt.asset : null;
  const hatAsset = hatOpt ? hatOpt.asset : null;
  return { id: baseId, ...base, ...fb, skin, skinShade, hairStyle, hair, hairDark, shirt: shirtOpt.shirt, shirtDark: shirtOpt.shirtDark, shirtDesign: shirtOpt.design || "solid", shirtAsset: shirtOpt.asset || null, pantsAsset: pantsOpt ? pantsOpt.asset : null, pants, eyeColor, eyeLight, hat: hatOpt.hat, hatAsset, hairAsset, necklace: neckOpt.necklace, bracelet: braceOpt.bracelet, bodyAsset, bodyScale, bodyAge, bodyId: bodyOpt ? bodyOpt.id : "adult_masc_A", _customKey: `${baseId}|${hatId}|${shirtId}|${necklaceId}|${braceletId}|${skinToneId||""}|${hairStyleId||""}|${hairColorId||""}|${pantsId||""}|${eyeColorId||""}|${bodyId||""}` };
}


// Conversão de tempo
export const GAME_START_MINUTES = 6 * 60; // 06:00
export const GAME_END_MINUTES = 26 * 60; // 02:00 do dia seguinte

/**
 * Posição de um morador em determinado minuto do dia.
 * Determinística e compartilhada entre todos os clientes e o servidor.
 */
export function npcPosition(npc, minutes) {
  const m = Math.max(0, Math.min(26 * 60, minutes));
  for (const slot of npc.routine || []) {
    if (m >= slot.from && m < slot.to) {
      // passeio visível: NPC anda em patrulha 2.2 tiles em volta do destino
      const phase = (m - slot.from) / Math.max(1, slot.to - slot.from);
      // trajetória em "8" para variar direção constantemente
      const t = phase * Math.PI * 4 + npc.id.charCodeAt(0) * 0.35;
      const wobble = Math.sin(t) * 1.1;
      const wobbleY = Math.cos(t * 1.4) * 0.65;
      // micro-pausa andando: a cada 20% de phase dá uma paradinha curta (simula entrar em casa)
      const pause = Math.sin(phase * Math.PI * 10) > 0.85 ? 0.3 : 1;
      return { x: slot.x + wobble * pause, y: slot.y + wobbleY * pause, label: slot.label };
    }
  }
  return { x: npc.home.x, y: npc.home.y, label: "em casa" };
}


// ---------- Novos NPCs de região ----------
export const ALL_NPCS = [...NPCS_DATA, ...REGION_NPCS];
export const NPC_BY_ID = Object.fromEntries(ALL_NPCS.map((n) => [n.id, n]));
