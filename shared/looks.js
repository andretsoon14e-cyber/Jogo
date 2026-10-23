// ============================================================
//  Aparência do jogador — normalizada no cliente e no servidor.
//  O servidor só aceita ids conhecidos: nada de payload livre
//  virando textura, cor arbitrária ou tamanho estranho no mapa.
// ============================================================
import {
  BODY_OPTIONS, HAIR_STYLE_OPTIONS, HAIR_COLOR_OPTIONS, HAT_OPTIONS,
  SHIRT_OPTIONS, PANTS_OPTIONS, SKIN_TONE_OPTIONS, EYE_COLOR_OPTIONS,
  NECKLACE_OPTIONS, BRACELET_OPTIONS,
} from "./constants.js";

const FIELDS = {
  body: BODY_OPTIONS,
  hair: HAIR_STYLE_OPTIONS,
  hairColor: HAIR_COLOR_OPTIONS,
  hat: HAT_OPTIONS,
  shirt: SHIRT_OPTIONS,
  pants: PANTS_OPTIONS,
  skin: SKIN_TONE_OPTIONS,
  eye: EYE_COLOR_OPTIONS,
  necklace: NECKLACE_OPTIONS,
  bracelet: BRACELET_OPTIONS,
};

export const DEFAULT_LOOK = {
  body: "adult_A",
  hair: "long",
  hairColor: "castanho",
  hat: "straw",
  shirt: "red",
  pants: "jeans",
  skin: "tone2",
  eye: "verde",
  necklace: "none",
  bracelet: "none",
};

const idsOf = (list) => new Set((list || []).map((o) => o.id));

/** Mantém apenas ids válidos; qualquer outro campo cai no padrão. */
export function sanitizeLook(raw) {
  const out = {};
  for (const [field, list] of Object.entries(FIELDS)) {
    const ids = idsOf(list);
    const value = raw && typeof raw === "object" ? raw[field] : null;
    out[field] = ids.has(value) ? value : DEFAULT_LOOK[field];
  }
  return out;
}

export function looksEqual(a, b) {
  return JSON.stringify(sanitizeLook(a)) === JSON.stringify(sanitizeLook(b));
}

/** Converte as partes do criador (nomes antigos) no look normalizado. */
export function lookFromParts(parts = {}) {
  return sanitizeLook({
    body: parts.body,
    hair: parts.hairStyle,
    hairColor: parts.hairColor,
    hat: parts.hat,
    shirt: parts.shirt,
    pants: parts.pants,
    skin: parts.skinTone,
    eye: parts.eyeColor,
    necklace: parts.necklace,
    bracelet: parts.bracelet,
  });
}

/** Caminho inverso: usado para reabrir o criador com o visual atual. */
export function partsFromLook(look) {
  const l = sanitizeLook(look);
  return {
    body: l.body, hairStyle: l.hair, hairColor: l.hairColor, hat: l.hat,
    shirt: l.shirt, pants: l.pants, skinTone: l.skin, eyeColor: l.eye,
    necklace: l.necklace, bracelet: l.bracelet,
  };
}
