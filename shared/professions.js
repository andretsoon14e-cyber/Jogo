// Profissões — catálogo extensível (arquitetura por Fase 3 spec)
// Cada profissão tem níveis, ferramentas e especializações futuras
export const PROFESSIONS = {
  agricultor: { id: "agricultor", name: "Agricultor", icon: "🌾", skill: "farming", desc: "Plantio, colheita e estufas" },
  pescador: { id: "pescador", name: "Pescador", icon: "🎣", skill: "fishing", desc: "Pesca no lago e no mar" },
  minerador: { id: "minerador", name: "Minerador", icon: "⛏️", skill: "mining", desc: "Cavernas e minérios" },
  lenhador: { id: "lenhador", name: "Lenhador", icon: "🪵", skill: "building", desc: "Madeira e construção" },
  cozinheiro: { id: "cozinheiro", name: "Cozinheiro", icon: "🍳", skill: "cooking", desc: "Receitas e forno" },
  ferreiro: { id: "ferreiro", name: "Ferreiro", icon: "🔨", skill: "commerce", desc: "Ferramentas e comércio" },
};

export const BUSINESS_TYPES = [
  { id: "quitanda", name: "Quitanda", desc: "Venda de colheitas", need: "agricultor", cost: 1800, icon: "🥕" },
  { id: "peixaria", name: "Peixaria", desc: "Venda de pescado", need: "pescador", cost: 2200, icon: "🐟" },
  { id: "padaria", name: "Padaria", desc: "Pães e bolos", need: "cozinheiro", cost: 2600, icon: "🥖" },
  { id: "oficina", name: "Oficina", desc: "Ferramentas e móveis", need: "ferreiro", cost: 3000, icon: "🔧" },
];
