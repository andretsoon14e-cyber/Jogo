// ============================================================
//  Criador de personagem — grade de opções visível, sem auto-pulo.
//  Cada botão mostra o próprio item aplicado ao personagem atual,
//  e a prévia grande fica ao lado, integrada ao pergaminho.
// ============================================================
import {
  BODY_OPTIONS, HAIR_STYLE_OPTIONS, HAIR_COLOR_OPTIONS, HAT_OPTIONS,
  SHIRT_OPTIONS, PANTS_OPTIONS, SKIN_TONE_OPTIONS, EYE_COLOR_OPTIONS,
  NECKLACE_OPTIONS, BRACELET_OPTIONS, buildCustomSpec,
} from "../../shared/constants.js";
import { rigSprite, RIG_OUT_W, RIG_OUT_H } from "./art/rig.js";

const SECTIONS = [
  { key: "body", label: "Corpo", field: "body", opts: () => BODY_OPTIONS, crop: [0, 33], scale: 2, kind: "body" },
  { key: "hairStyle", label: "Cabelo", field: "hairStyle", opts: (g) => byGender(HAIR_STYLE_OPTIONS, g), crop: [0, 15], scale: 4, kind: "head" },
  { key: "hairColor", label: "Cor do cabelo", field: "hairColor", opts: () => HAIR_COLOR_OPTIONS, kind: "swatch", colorOf: (o) => o.hair },
  { key: "shirt", label: "Camisa", field: "shirt", opts: (g) => byGender(SHIRT_OPTIONS, g), crop: [8, 22], scale: 4, kind: "torso" },
  { key: "pants", label: "Calça / saia", field: "pants", opts: (g) => byGender(PANTS_OPTIONS, g), crop: [18, 33], scale: 4, kind: "legs" },
  { key: "hat", label: "Chapéu", field: "hat", opts: (g) => byGender(HAT_OPTIONS, g), crop: [0, 15], scale: 4, kind: "head" },
  { key: "skinTone", label: "Pele", field: "skinTone", opts: () => SKIN_TONE_OPTIONS, kind: "swatch", colorOf: (o) => o.skin },
  { key: "eyeColor", label: "Olhos", field: "eyeColor", opts: () => EYE_COLOR_OPTIONS, kind: "swatch", colorOf: (o) => o.eye },
  { key: "necklace", label: "Colar", field: "necklace", opts: () => NECKLACE_OPTIONS, kind: "swatch", colorOf: (o) => o.necklace || "#e8e2d0" },
  { key: "bracelet", label: "Pulseira", field: "bracelet", opts: () => BRACELET_OPTIONS, kind: "swatch", colorOf: (o) => o.bracelet || "#e8e2d0" },
];

function byGender(list, gender) {
  if (gender === "todos" || !gender) return list;
  const filtered = list.filter((o) => !o.gender || o.gender === gender || o.gender === "uni");
  return filtered.length ? filtered : list;
}

function specFromParts(parts) {
  return buildCustomSpec(
    parts.base, parts.hat, parts.shirt, parts.necklace, parts.bracelet,
    parts.skinTone, parts.hairStyle, parts.hairColor, parts.pants, parts.eyeColor, parts.body,
  );
}

function drawThumb(canvas, spec, { crop, scale = 3 }) {
  const g = canvas.getContext("2d");
  g.imageSmoothingEnabled = false;
  g.clearRect(0, 0, canvas.width, canvas.height);
  const sprite = rigSprite(spec, "down", 0);
  const [y0, y1] = crop || [0, RIG_OUT_H];
  const sy = y0;
  const sh = Math.min(y1, RIG_OUT_H) - sy;
  const dw = Math.round(RIG_OUT_W * scale);
  const dh = Math.round(sh * scale);
  if (canvas.width !== dw || canvas.height !== dh) { canvas.width = dw; canvas.height = dh; }
  g.imageSmoothingEnabled = false;
  g.drawImage(sprite, 0, sy, RIG_OUT_W, sh, 0, 0, dw, dh);
}

export function mountCreator(host, { game, onChange, sfx = () => {} }) {
  if (!host) return null;
  host.innerHTML = "";
  const state = { filter: game.skinParts.gender === "masc" ? "todos" : "todos" };
  let activeTab = "body";

  const wrap = document.createElement("div");
  wrap.className = "creatorGrid";
  host.appendChild(wrap);

  // ---- coluna esquerda: prévia ----
  const stage = document.createElement("div");
  stage.className = "creatorStage";
  wrap.appendChild(stage);

  const previewCanvas = document.createElement("canvas");
  previewCanvas.className = "creatorPreviewCanvas";
  stage.appendChild(previewCanvas);

  const nameLine = document.createElement("div");
  nameLine.className = "creatorNameLine";
  stage.appendChild(nameLine);

  const hint = document.createElement("div");
  hint.className = "creatorHint";
  hint.textContent = "Clique nas opções ao lado. Tudo aparece no mapa do mesmo jeito.";
  stage.appendChild(hint);

  // ---- coluna direita: abas + grade ----
  const panel = document.createElement("div");
  panel.className = "creatorPanel";
  wrap.appendChild(panel);

  const tabs = document.createElement("div");
  tabs.className = "creatorTabs";
  panel.appendChild(tabs);

  const grid = document.createElement("div");
  grid.className = "creatorOptions";
  panel.appendChild(grid);

  function currentLook() {
    return specFromParts(game.skinParts);
  }

  function renderPreview() {
    const spec = currentLook();
    const scale = 4;
    previewCanvas.width = RIG_OUT_W * scale;
    previewCanvas.height = RIG_OUT_H * scale;
    const g = previewCanvas.getContext("2d");
    g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    const sprite = rigSprite(spec, "down", 0);
    g.drawImage(sprite, 0, 0, previewCanvas.width, previewCanvas.height);
    const body = BODY_OPTIONS.find((b) => b.id === game.skinParts.body);
    nameLine.textContent = body ? body.name : "";
  }

  function select(section, opt) {
    game.skinParts[section.field] = opt.id;
    try { localStorage.setItem("vale_skin_parts", JSON.stringify(game.skinParts)); } catch {}
    renderPreview();
    renderGrid();
    onChange && onChange();
    sfx("open");
  }

  function renderTabs() {
    tabs.innerHTML = "";
    for (const s of SECTIONS) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "creatorTab" + (s.key === activeTab ? " active" : "");
      b.textContent = s.label;
      b.onclick = () => { activeTab = s.key; renderTabs(); renderGrid(); };
      tabs.appendChild(b);
    }
    // filtro de apresentação
    const filter = document.createElement("select");
    filter.className = "creatorFilter";
    filter.innerHTML = `<option value="todos">Todos os estilos</option>
      <option value="fem">Feminino</option>
      <option value="masc">Masculino</option>`;
    filter.value = state.filter;
    filter.onchange = () => { state.filter = filter.value; renderGrid(); };
    tabs.appendChild(filter);
  }

  function renderGrid() {
    const section = SECTIONS.find((s) => s.key === activeTab) || SECTIONS[0];
    const opts = section.opts(state.filter);
    grid.innerHTML = "";
    const current = game.skinParts[section.field];
    for (const opt of opts) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "creatorOpt" + (opt.id === current ? " selected" : "");
      b.title = opt.name + (opt.desc ? ` — ${opt.desc}` : "");

      if (section.kind === "swatch") {
        const dot = document.createElement("span");
        dot.className = "creatorSwatch";
        dot.style.background = section.colorOf(opt);
        b.appendChild(dot);
      } else {
        const c = document.createElement("canvas");
        c.className = "creatorThumb";
        const spec = specFromParts({ ...game.skinParts, [section.field]: opt.id });
        drawThumb(c, spec, { crop: section.crop, scale: section.scale || 3 });
        b.appendChild(c);
      }

      const label = document.createElement("span");
      label.className = "creatorOptLabel";
      label.textContent = opt.name;
      b.appendChild(label);

      if (opt.gender && opt.gender !== "uni") {
        const tag = document.createElement("span");
        tag.className = "creatorTag";
        tag.textContent = opt.gender === "fem" ? "fem" : "masc";
        b.appendChild(tag);
      }

      b.onclick = () => select(section, opt);
      grid.appendChild(b);
    }
    const count = document.createElement("div");
    count.className = "creatorCount";
    count.textContent = `${opts.length} opções em ${section.label.toLowerCase()}`;
    grid.appendChild(count);
  }

  renderTabs();
  renderGrid();
  renderPreview();

  return {
    refresh() { renderPreview(); renderGrid(); },
    destroy() { host.innerHTML = ""; },
  };
}
