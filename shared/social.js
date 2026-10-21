// Relacionamentos estendidos — etapas românticas
export const REL_STAGES = {
  stranger: { id: "stranger", label: "Conhecido", min: 0, icon: "👋" },
  friend: { id: "friend", label: "Amigo", min: 20, icon: "🙂" },
  close: { id: "close", label: "Muito amigo", min: 40, icon: "💛" },
  crush: { id: "crush", label: "Interesse", min: 60, icon: "😊" },
  dating: { id: "dating", label: "Namorando", min: 80, icon: "💕" },
  engaged: { id: "engaged", label: "Noivo(a)", min: 90, icon: "💍" },
  married: { id: "married", label: "Casado(a)", min: 100, icon: "💒" },
};

export const REL_STAGE_ORDER = ["stranger","friend","close","crush","dating","engaged","married"];

export function stageFor(pts) {
  let cur = REL_STAGES.stranger;
  for (const id of REL_STAGE_ORDER) {
    const st = REL_STAGES[id];
    if (pts >= st.min) cur = st;
  }
  return cur;
}

export const ROMANCEABLE = new Set(["luna","ana","bia","rita","duda","joao","pedro","carlos"]);
export const KIDS = [
  { id: "kid1", name: "Sol", icon: "👶", trait: "Curioso(a)" },
  { id: "kid2", name: "Luna Jr.", icon: "🧒", trait: "Aventureiro(a)" },
];

export const DIALOG_CHOICES = {
  talk: [
    { id: "howday", label: "Como foi seu dia?", delta: 2 },
    { id: "compliment", label: "Você está ótimo hoje!", delta: 2 },
    { id: "work", label: "Como está o trabalho?", delta: 1 },
    { id: "festival", label: "Quer ir ao festival comigo?", delta: 3 },
    { id: "help", label: "Posso ajudar com alguma coisa?", delta: 3 },
  ],
  romantic: [
    { id: "like", label: "Gosto de passar tempo com você.", delta: 4 },
    { id: "invite", label: "Quer passear comigo?", delta: 4 },
    { id: "gift", label: "Tenho um presente para você.", delta: 3 },
  ],
  date: [
    { id: "cinema", label: "Vamos à praça?", delta: 5 },
    { id: "beach", label: "Quer visitar a praia comigo?", delta: 5 },
    { id: "restaurant", label: "Jantar na taverna?", delta: 5 },
  ],
};
