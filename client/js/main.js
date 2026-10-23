import {
  game, commands, rebuildHotbar, screenToWorld, screenToWorldInterior, tileAt, npcPos, nearbyNpc,
  nearbyBuilding, isNearWater, isNearForest, isNearStone, itemMeta,
  currentRegion, currentRegionDef, currentTiles, currentBuildings, currentNpcs, isIndoors, INTERIOR_W, INTERIOR_H,
} from "./state.js";
import {
  BUILDINGS, BUILD_OPTIONS, CROPS, NPCS_DATA, ALL_NPCS, PLAYER_SKINS, TILE, SEASONS,
} from "../../shared/constants.js";
import { lookFromParts, partsFromLook, DEFAULT_LOOK } from "../../shared/looks.js";
import { mountCreator } from "./creator.js";
import { RECIPES, JOBS, REGION_DEFS } from "../../shared/careers.js";
import { GENDER_OPTIONS, HAT_OPTIONS, SHIRT_OPTIONS, NECKLACE_OPTIONS, BRACELET_OPTIONS, PANTS_OPTIONS, EYE_COLOR_OPTIONS, SKIN_TONE_OPTIONS, HAIR_STYLE_OPTIONS, HAIR_COLOR_OPTIONS, buildCustomSpec, PET_OPTIONS, BODY_OPTIONS } from "../../shared/constants.js";
import { hasFurniturePick, consumeFurniturePick, cancelFurniture } from "./ui.js";
import * as ui from "./ui.js";
import { connect } from "./network.js";
import { render, updateEffects, spawnEffect, tickQuality } from "./renderer.js";
import { initAudio, sfx } from "./audio.js";
import { drawLogo, hydrateIcons, watchIcons, decoratePanelHeaders } from "./art/ui-binding.js";
import { iconize, iconURL } from "./art/icons.js";
import { characterFrames, specForSkin } from "./art/characters.js";
import { initCoverCanvas, stopCoverLoop } from "./art/cover.js";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
let mode = "login";
let started = false;
let lastFrame = performance.now();
let hudClock = 0;
let hintClock = 0;
let wasMoving = false;
let lastHousePrompt = 0;

window.game = game;
// atalhos de depuração/teste (não afetam o jogo)
window.commands = commands;

// ---------------- CONFIGURAÇÕES SALVAS ----------------
try {
  const saved = JSON.parse(localStorage.getItem("vale_settings") || "{}");
  Object.assign(game.settings, saved);
} catch {}

// ---------------- LOGIN ----------------
function initLogin() {
  // skins - base
  const skinPick = document.getElementById("skinPick");
  skinPick.innerHTML = "";
  const savedSkin = localStorage.getItem("vale_skin") || "s1";
  game.skin = PLAYER_SKINS.some((s) => s.id === savedSkin) ? savedSkin : "s1";
  // modular parts
  const defaultParts = { base: savedSkin, hat: HAT_OPTIONS[1]?.id||"none", shirt: SHIRT_OPTIONS[0]?.id||"red", necklace: "none", bracelet: "none", skinTone: SKIN_TONE_OPTIONS[1]?.id||"tone2", hairStyle: HAIR_STYLE_OPTIONS[0]?.id||"long", hairColor: HAIR_COLOR_OPTIONS[0]?.id||"castanho", pants: PANTS_OPTIONS[0]?.id||"jeans", eyeColor: EYE_COLOR_OPTIONS[2]?.id||"brown", farmName: localStorage.getItem("vale_farmName")||"", favorite: localStorage.getItem("vale_favorite")||"", gender: localStorage.getItem("vale_gender")||"fem", pet: localStorage.getItem("vale_pet")||"cat", petName: localStorage.getItem("vale_petName")||"", body: localStorage.getItem("vale_body")||"adult_A" };
  try {
    game.skinParts = JSON.parse(localStorage.getItem("vale_skin_parts")||"null") || defaultParts;
    for(const k of Object.keys(defaultParts)) if(!(k in game.skinParts)) game.skinParts[k]=defaultParts[k];
  } catch { game.skinParts = { ...defaultParts }; }
  if(!PLAYER_SKINS.some(s=>s.id===game.skinParts.base)) game.skinParts.base = "s1";
  // ids antigos de corpo (adult_masc_A) migram para o rig novo (adult_A)
  if(!BODY_OPTIONS.some(b=>b.id===game.skinParts.body)){
    const age = ["adult","elder","teen","child","baby","newborn"].find(a=>String(game.skinParts.body||"").startsWith(a)) || "adult";
    game.skinParts.body = `${age}_A`;
  }

  // sync Stardew-like inputs with login name
  const inpCharName = document.getElementById("inpCharName");
  const inpFarmName = document.getElementById("inpFarmName");
  const inpFavorite = document.getElementById("inpFavorite");
  const inpPetHidden = document.getElementById("inpPetName");
  if(inpCharName){ inpCharName.value = localStorage.getItem("vale_name")||""; inpCharName.addEventListener("input", ()=>{ document.getElementById("inpName").value = inpCharName.value; localStorage.setItem("vale_name", inpCharName.value); }); document.getElementById("inpName")?.addEventListener("input", ()=>{ inpCharName.value = document.getElementById("inpName").value; }); }
  if(inpFarmName){ inpFarmName.value = game.skinParts.farmName||""; inpFarmName.addEventListener("input", ()=>{ game.skinParts.farmName = inpFarmName.value; localStorage.setItem("vale_farmName", inpFarmName.value); localStorage.setItem("vale_skin_parts", JSON.stringify(game.skinParts)); }); }
  if(inpFavorite){ inpFavorite.value = game.skinParts.favorite||""; inpFavorite.addEventListener("input", ()=>{ game.skinParts.favorite = inpFavorite.value; localStorage.setItem("vale_favorite", inpFavorite.value); localStorage.setItem("vale_skin_parts", JSON.stringify(game.skinParts)); }); }
  // pet choice
  document.querySelectorAll(".petOpt").forEach(btn=>{
    btn.classList.toggle("selected", btn.dataset.pet===game.skinParts.pet);
    btn.style.borderColor = btn.dataset.pet===game.skinParts.pet ? "#b8882a" : "#d5bd94";
    btn.style.background = btn.dataset.pet===game.skinParts.pet ? "#ffe9a8" : "#fffdf4";
    btn.onclick=()=>{ game.skinParts.pet = btn.dataset.pet; localStorage.setItem("vale_pet", btn.dataset.pet); if(inpPetHidden) inpPetHidden.value = btn.dataset.pet; localStorage.setItem("vale_skin_parts", JSON.stringify(game.skinParts)); document.querySelectorAll(".petOpt").forEach(b=>{ const sel=b.dataset.pet===btn.dataset.pet; b.classList.toggle("selected", sel); b.style.borderColor=sel?"#b8882a":"#d5bd94"; b.style.background=sel?"#ffe9a8":"#fffdf4"; }); sfx("open"); };
  });
  // gender choice — filtra presets por gênero
  function filteredByGender(opts, gender){
    if(!opts || !opts[0]?.gender) return opts;
    return opts.filter(o=> o.gender===gender || o.gender==="uni");
  }
  document.querySelectorAll(".genderOpt").forEach(btn=>{
    btn.classList.toggle("selected", btn.dataset.gender===game.skinParts.gender);
    btn.style.borderColor = btn.dataset.gender===game.skinParts.gender ? "#b8882a" : "#d5bd94";
    btn.style.background = btn.dataset.gender===game.skinParts.gender ? "#ffe9a8" : "#fffdf4";
    btn.onclick=()=>{
      game.skinParts.gender = btn.dataset.gender;
      localStorage.setItem("vale_gender", btn.dataset.gender);
      localStorage.setItem("vale_skin_parts", JSON.stringify(game.skinParts));
      document.querySelectorAll(".genderOpt").forEach(b=>{
        const sel=b.dataset.gender===btn.dataset.gender;
        b.classList.toggle("selected", sel);
        b.style.borderColor=sel?"#b8882a":"#d5bd94";
        b.style.background=sel?"#ffe9a8":"#fffdf4";
      });
      // se mudar gênero, troca corpo incompatível por equivalente adulto
      const bodyOk = BODY_OPTIONS.find(b=>b.id===game.skinParts.body);
      if(bodyOk && bodyOk.gender!=="uni" && bodyOk.gender!==btn.dataset.gender){
        const alt = BODY_OPTIONS.find(b=>b.gender===btn.dataset.gender && b.age===bodyOk.age) || BODY_OPTIONS.find(b=>b.gender===btn.dataset.gender);
        if(alt) { game.skinParts.body = alt.id; localStorage.setItem("vale_body", alt.id); }
      }
      localStorage.setItem("vale_body", game.skinParts.body);
      try{ creator?.refresh?.(); }catch{}
      refreshPreview(); sfx("open");
    };
  });
  function refreshPreview(){
    const spec = buildCustomSpec(game.skinParts.base, game.skinParts.hat, game.skinParts.shirt, game.skinParts.necklace, game.skinParts.bracelet, game.skinParts.skinTone, game.skinParts.hairStyle, game.skinParts.hairColor, game.skinParts.pants, game.skinParts.eyeColor, game.skinParts.body);
    game.customSpec = spec;
    game.look = lookFromParts(game.skinParts);
    game.skin = game.skinParts.base;
    try {
      localStorage.setItem("vale_skin_parts", JSON.stringify(game.skinParts));
      localStorage.setItem("vale_skin", game.skinParts.base);
    } catch {}
    // a grade já mostra o item selecionado; a prévia grande é desenhada pelo criador
    try { creator?.refresh?.(); } catch {}
  }
  // base antiga (6 skins) fica só como compatibilidade invisível
  skinPick.style.display = "none";
  for (const s of PLAYER_SKINS.slice(0, 6)) {
    const d = document.createElement("div");
    d.className = `skinOpt${s.id === game.skinParts.base ? " selected" : ""}`;
    d.dataset.skin = s.id;
    d.style.display = "none";
    skinPick.appendChild(d);
  }
  // grade de personalização: todas as opções visíveis, prévia integrada
  document.querySelector(".charPreviewStage")?.style.setProperty("display", "none");
  let creator = null;
  try {
    const host = document.getElementById("modularPick");
    creator = mountCreator(host, {
      game,
      sfx: (n) => { try { sfx(n); } catch {} },
      onChange: () => refreshPreview(),
    });
    window.rebuildModularPick = () => creator?.refresh?.();
    const panel = document.querySelector(".creatorPanel");
    for (const sel of [".genderChoiceRow", ".petChoiceRow"]) {
      const el = document.querySelector(sel);
      if (el && panel) panel.appendChild(el);
    }
    const left = document.querySelector(".creatorLeft");
    if (left) left.style.display = "none";
    // ícones dos botões de gênero/animal criados no HTML
    hydrateIcons(document);
  } catch (err) {
    console.warn("criador não montou:", err);
  }
  refreshPreview();

  // tabs
  document.querySelectorAll(".loginTab").forEach((tab) => {
    tab.onclick = () => setMode(tab.dataset.mode);
  });

  // preenche dados salvos
  const savedName = localStorage.getItem("vale_name");
  if (savedName) document.getElementById("inpName").value = savedName;
  const savedRoom = localStorage.getItem("vale_room");
  if (savedRoom) document.getElementById("inpRoom").value = savedRoom;

  const savedToken = localStorage.getItem("vale_token");
  if (savedToken && savedName) {
    game.token = savedToken;
    document.getElementById("modeHint").innerHTML = `Sessão salva de <b>${escapeHtml(savedName)}</b>. Deixe a senha vazia para continuar.`;
  }
  setMode(localStorage.getItem("vale_mode") || "login", true);

  document.getElementById("btnCreateRoom").onclick = createRoom;
  loadRooms();
  setInterval(loadRooms, 15000);
  document.getElementById("btnPlay").onclick = play;
  document.getElementById("inpRoom").addEventListener("keydown", (e) => { if (e.key === "Enter") play(); });
  document.getElementById("inpPassword").addEventListener("keydown", (e) => { if (e.key === "Enter") play(); });
}

function setMode(newMode, silent = false) {
  mode = newMode;
  document.querySelectorAll(".loginTab").forEach((t) => t.classList.toggle("active", t.dataset.mode === mode));
  const accountFields = document.getElementById("accountFields");
  const hint = document.getElementById("modeHint");
  const playBtn = document.getElementById("btnPlay");
  accountFields.style.display = mode === "guest" ? "none" : "block";
  if (mode === "register") {
    hint.textContent = "Crie uma conta gratuita para salvar ouro, itens, amizades e missões.";
    playBtn.textContent = "Criar conta e jogar";
  } else if (mode === "login") {
    hint.textContent = game.token
      ? "Sessão salva encontrada. Deixe a senha vazia para entrar rapidinho."
      : "Entre com sua conta para salvar seu progresso em todos os mundos.";
    playBtn.textContent = "Jogar";
  } else {
    hint.textContent = "Modo visitante: dá para jogar tudo, mas o progresso não é salvo ao sair.";
    playBtn.textContent = "Jogar como visitante";
  }
  if (!silent) document.getElementById("loginError").textContent = "";
  localStorage.setItem("vale_mode", mode);
}

async function loadRooms() {
  const el = document.getElementById("roomList");
  if (!el) return;
  try {
    const rooms = await fetch("/api/rooms").then((r) => r.json());
    el.innerHTML = "";
    if (!Array.isArray(rooms) || rooms.length === 0) {
      el.innerHTML = `<span class="roomEmpty">Nenhum mundo ativo. Crie uma sala e chame seus amigos!</span>`;
      return;
    }
    for (const room of rooms) {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "roomChip";
      chip.innerHTML = `${room.code} <small>${room.players} online · dia ${room.day}</small>`;
      chip.onclick = () => {
        document.getElementById("inpRoom").value = room.code;
        sfx("open");
      };
      el.appendChild(chip);
    }
  } catch {
    el.innerHTML = `<span class="roomEmpty">Servidor offline. Inicie com "npm start".</span>`;
  }
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

async function createRoom() {
  const input = document.getElementById("inpRoom");
  let code = input.value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  if (!code) code = Math.random().toString(36).slice(2, 6).toUpperCase();
  try {
    const res = await fetch("/api/create-room", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Não foi possível criar a sala.");
    input.value = data.code;
    document.getElementById("modeHint").innerHTML = `✅ Sala <b>${data.code}</b> criada! Compartilhe o código com seus amigos.`;
    loadRooms();
    sfx("buy");
  } catch (e) {
    document.getElementById("loginError").textContent = e.message;
    ui.notify(e.message, "error");
  }
}

async function play() {
  const errorEl = document.getElementById("loginError");
  errorEl.textContent = "";
  const nameInput = document.getElementById("inpName").value.trim();
  const password = document.getElementById("inpPassword").value;
  const room = (document.getElementById("inpRoom").value.trim() || "VALE1")
    .toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  if (!room) {
    errorEl.textContent = "Informe um código de sala válido (até 6 letras/números).";
    return;
  }

  let username = nameInput || `Visitante${Math.floor(Math.random() * 900 + 100)}`;
  let token = null;

  if (mode !== "guest") {
    if (!nameInput) {
      errorEl.textContent = "Escolha um nome de jogador.";
      return;
    }
    if (!password && game.token) {
      token = game.token;
      try {
        const res = await fetch("/api/me", { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          username = data.username;
        } else {
          token = null;
          game.token = null;
          errorEl.textContent = "Sessão expirada. Digite sua senha novamente.";
          return;
        }
      } catch {
        errorEl.textContent = "Servidor indisponível. Verifique se o jogo está rodando.";
        return;
      }
    } else {
      if (password.length < 4) {
        errorEl.textContent = "A senha precisa ter pelo menos 4 caracteres.";
        return;
      }
      const endpoint = mode === "register" ? "/api/register" : "/api/login";
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: nameInput, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          errorEl.textContent = data.error || "Não foi possível entrar.";
          return;
        }
        token = data.token;
        username = data.username;
        game.token = token;
        localStorage.setItem("vale_token", token);
      } catch {
        errorEl.textContent = "Servidor indisponível. Verifique se o jogo está rodando.";
        return;
      }
    }
  } else {
    game.token = null;
    localStorage.removeItem("vale_token");
  }

  localStorage.setItem("vale_name", username);
  localStorage.setItem("vale_room", room);
  localStorage.setItem("vale_mode", mode);

  startGame({ username, roomCode: room, token, skin: game.skin, look: lookFromParts(game.skinParts) });
}

// ---------------- INÍCIO DO JOGO ----------------
function startGame(profile) {
  if (started) return;
  started = true;
  game.username = profile.username;
  game.roomCode = profile.roomCode;
  game.skin = profile.skin;
  game.token = profile.token;
  game.isAccount = mode !== "guest" && !!profile.token;

  document.getElementById("loginScreen").classList.remove("active");
  document.getElementById("gameScreen").classList.add("active");
  resize();
  initAudio();
  ui.initUI();
  watchIcons();
  decoratePanelHeaders();
  hydrateIcons(document);
  iconize(document.getElementById("gameScreen"));
  setTimeout(() => { decoratePanelHeaders(); hydrateIcons(document); }, 60);
  setupInput();
  connect(profile);
  game.camera.x = game.x;
  game.camera.y = game.y;
  requestAnimationFrame(loop);
}

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

// ---------------- INPUT ----------------
const MOVE_KEYS = ["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"];

function isTyping() {
  const el = document.activeElement;
  return el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT");
}

function setupInput() {
  window.addEventListener("resize", resize);

  window.addEventListener("keydown", (e) => {
    if (!started) return;
    if (isTyping()) return;
    const key = e.key.toLowerCase();

    if (key === "escape") {
      if(window.hasFurniturePick && window.hasFurniturePick()){ window.cancelFurniture && window.cancelFurniture(); ui.notify("Decoração cancelada."); return; }
      if(document.getElementById("shiftOverlay")?.classList.contains("open")){ closeShiftOverlay(); return; }
      if (game.pendingBuild) {
        game.pendingBuild = null;
        ui.notify("Construção cancelada.");
      } else if (ui.isPanelOpen()) {
        ui.closePanels();
      }
      return;
    }
    if (MOVE_KEYS.includes(key)) {
      game.keys[key] = true;
      if (key.startsWith("arrow")) e.preventDefault();
      return;
    }
    if (e.key >= "1" && e.key <= "9") {
      const i = Number(e.key) - 1;
      if (i < game.hotbar.length) ui.selectSlot(i);
      return;
    }
    if (key === "f" || e.code === "Space") {
      e.preventDefault();
      tryInteract();
      return;
    }
    if (key === "e") return ui.togglePanel("inventoryPanel");
    if (key === "m") return ui.togglePanel("mapPanel");
    if (key === "j") return ui.togglePanel("questPanel");
    if (key === "c") return ui.togglePanel("communityPanel");
    if (key === "p") return ui.togglePanel("socialPanel");
    if (key === "t") return ui.togglePanel("shopPanel");
    if (key === "b") return ui.togglePanel("buildPanel");
    if (key === "o") return ui.togglePanel("jobPanel");
    if (key === "k") return ui.togglePanel("kitchenPanel");
    if (key === "u") return ui.togglePanel("coopPanel");
    if (key === "r") return ui.togglePanel("travelPanel");
    if (key === "y") return ui.togglePanel("bankPanel");
    if (key === "h") return ui.togglePanel("housePanel");
    if (key === "enter") {
      e.preventDefault();
      document.getElementById("chatInput").focus();
    }
  });

  window.addEventListener("keyup", (e) => {
    game.keys[e.key.toLowerCase()] = false;
  });

  canvas.addEventListener("mousedown", (e) => {
    const rect = canvas.getBoundingClientRect();
    game.mouse.x = e.clientX - rect.left;
    game.mouse.y = e.clientY - rect.top;
    game.mouse.down = true;
    handleWorldClick();
  });
  canvas.addEventListener("mouseup", () => (game.mouse.down = false));
  canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    game.mouse.x = e.clientX - rect.left;
    game.mouse.y = e.clientY - rect.top;
  });
  canvas.addEventListener("touchstart", (e) => {
    const touch = e.touches[0];
    if (!touch) return;
    const rect = canvas.getBoundingClientRect();
    game.mouse.x = touch.clientX - rect.left;
    game.mouse.y = touch.clientY - rect.top;
    handleWorldClick();
  }, { passive: true });

  canvas.addEventListener("wheel", (e) => {
    if (ui.isPanelOpen()) return;
    e.preventDefault();
    const dir = e.deltaY > 0 ? 1 : -1;
    const n = Math.max(1, game.hotbar.length);
    ui.selectSlot((game.selected + dir + n) % n);
  }, { passive: false });

  document.getElementById("btnSendChat").onclick = sendChat;
  document.getElementById("chatInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendChat();
    }
    if (e.key === "Escape") e.target.blur();
  });

  // mobile: menu recolhível
  const railToggle = document.getElementById("railToggle");
  if (railToggle) {
    const rail = document.getElementById("menuRail");
    if (window.matchMedia && window.matchMedia("(max-width: 900px)").matches) rail.classList.add("collapsed");
    railToggle.onclick = (e) => { e.stopPropagation(); rail.classList.toggle("collapsed"); };
    rail.querySelectorAll("[data-panel]").forEach((b) => b.addEventListener("click", () => {
      if (window.matchMedia && window.matchMedia("(max-width: 900px)").matches) rail.classList.add("collapsed");
    }));
  }
  // hotbar arrastável — usuário pediu barra móvel
  (function(){
    const hotbar=document.getElementById("hotbar");
    if(!hotbar) return;
    // restaura posição salva
    try{
      const saved=JSON.parse(localStorage.getItem("vale_hotbar_pos")||"null");
      if(saved && saved.left!=null){
        hotbar.style.left=saved.left+"px";
        hotbar.style.top=saved.top+"px";
        hotbar.style.bottom="auto";
        hotbar.style.transform="none";
        hotbar.style.right="auto";
      }
    }catch{}
    let dragging=false, startX=0,startY=0, origLeft=0, origTop=0;
    hotbar.addEventListener("pointerdown",(e)=>{
      // só arrasta se clicar no fundo da barra, não nos slots
      if(e.target.closest("#hotbarSlots")) return;
      dragging=true; hotbar.classList.add("dragging");
      hotbar.setPointerCapture(e.pointerId);
      const rect=hotbar.getBoundingClientRect();
      startX=e.clientX; startY=e.clientY; origLeft=rect.left; origTop=rect.top;
      // fixa posição para poder mover livremente
      hotbar.style.position="fixed";
      hotbar.style.left=origLeft+"px"; hotbar.style.top=origTop+"px";
      hotbar.style.bottom="auto"; hotbar.style.transform="none";
      e.preventDefault();
    });
    hotbar.addEventListener("pointermove",(e)=>{
      if(!dragging) return;
      const dx=e.clientX-startX, dy=e.clientY-startY;
      let nl=origLeft+dx, nt=origTop+dy;
      // limita dentro da tela
      nl=Math.max(4, Math.min(window.innerWidth-hotbar.offsetWidth-4, nl));
      nt=Math.max(4, Math.min(window.innerHeight-hotbar.offsetHeight-4, nt));
      hotbar.style.left=nl+"px"; hotbar.style.top=nt+"px";
    });
    const stop=()=>{
      if(!dragging) return;
      dragging=false; hotbar.classList.remove("dragging");
      try{ localStorage.setItem("vale_hotbar_pos", JSON.stringify({left:parseInt(hotbar.style.left), top:parseInt(hotbar.style.top)})); }catch{}
    };
    hotbar.addEventListener("pointerup", stop);
    hotbar.addEventListener("pointercancel", stop);
    // duplo clique reseta pro centro inferior
    hotbar.addEventListener("dblclick", ()=>{
      hotbar.style.left="50%"; hotbar.style.top=""; hotbar.style.bottom="12px"; hotbar.style.transform="translateX(-50%)";
      try{ localStorage.removeItem("vale_hotbar_pos"); }catch{}
    });
  })();
  document.querySelectorAll("[data-panel]").forEach((btn) => {
    btn.onclick = () => ui.togglePanel(btn.dataset.panel);
  });
  document.querySelectorAll("[data-close]").forEach((btn) => {
    btn.onclick = () => ui.closePanels();
  });

  // botões antigos ocultos — guard para não quebrar caso removidos
  document.getElementById("btnSave")?.addEventListener("click", () => {
    commands.save();
    ui.notify("Salvando o mundo...");
  });
  document.getElementById("btnSleep")?.addEventListener("click", () => {
    commands.sleep();
    ui.notify("🌙 Pedido de dormir enviado. O dia avança quando houver maioria.");
    sfx("sleep");
  });
  // === Sono estilo Stardew: só na cama de casa ===
  window.openSleepOverlay = openSleepOverlay;
  window.closeSleepOverlay = closeSleepOverlay;
  let sleepGoldBefore = null;
  function isNearBed(){
    if(!isIndoors()) return false;
    const bedPositions = { casa_player:[12.2,4.4], casa_simples:[12.2,4.4], casa_familia:[12.2,4.4], chacara:[12.2,4.4], clinica:[11.4,5.0] };
    const pos = bedPositions[game.indoors];
    if(!pos) return false;
    return Math.hypot(game.x - pos[0], game.y - pos[1]) < 1.9;
  }
  function openSleepOverlay(){
    const ov = document.getElementById("sleepOverlay");
    if(!ov) return;
    ov.style.display="flex";
    sleepGoldBefore = game.self?.gold ?? game.gold ?? 0;
    const earnEl = document.getElementById("sleepEarnings");
    if(earnEl) earnEl.innerHTML = "🌙 Boa noite! Calculando o lucro do dia...";
    const achEl = document.getElementById("sleepAchievements");
    if(achEl) achEl.innerHTML = "";
    try{ sfx("sleep"); }catch{}
  }
  function closeSleepOverlay(){
    const ov=document.getElementById("sleepOverlay");
    if(ov) ov.style.display="none";
  }
  document.getElementById("btnSleepConfirm")?.addEventListener("click", ()=>{
    closeSleepOverlay();
    ui.notify("☀️ Bom dia! Novo dia começou.", "success");
  });
  // hook server newDay to preencher overlay
  if(window.__sleepHooked) {} else {
    window.__sleepHooked=true;
    // intercepta newDay via network.js já emitir evento, mas também ouvimos socket diretamente se disponível
    const origOn = window.socketOnNewDay || null;
    // iremos expor função para network.js chamar
    window.onNewDaySleep = (data)=>{
      const ov=document.getElementById("sleepOverlay");
      const earnEl=document.getElementById("sleepEarnings");
      const achEl=document.getElementById("sleepAchievements");
      if(ov && ov.style.display!=="none" && earnEl){
        const before = sleepGoldBefore ?? 0;
        const after = game.self?.gold ?? game.gold ?? before;
        const diff = after - before;
        earnEl.innerHTML = `💰 Ganhos do dia: <b>${diff>=0?"+":""}${diff} ouro</b><br><small>Saldo atual: ${after} ouro</small>`;
        if(achEl && data?.notes && data.notes.length){
          achEl.innerHTML = data.notes.map(n=>`<div>📜 ${n}</div>`).join("");
        } else if(achEl){
          achEl.innerHTML = `<div>🌱 Dia ${data?.day||"?"} • ${["Primavera","Verão","Outono","Inverno"][data?.seasonIndex||0]||""}</div>`;
        }
      }
      // se overlay não estava aberto, abre automaticamente ao avançar dia (caso outro jogador tenha dormido)
      if(ov && ov.style.display==="none"){
        openSleepOverlay();
        setTimeout(()=>{
          const after2 = game.self?.gold ?? game.gold ?? 0;
          const diff2 = after2 - (sleepGoldBefore??after2);
          const e2=document.getElementById("sleepEarnings");
          if(e2) e2.innerHTML = `☀️ Novo dia! ${diff2?`Ganhos: ${diff2} ouro`:""} <br><small>Dia ${data?.day||""}</small>`;
        }, 400);
      }
    };
  }
  document.getElementById("btnLeave").onclick = () => {
    if (!window.confirm("Sair do mundo? Seu progresso de conta já é salvo automaticamente.")) return;
    commands.disconnect();
    setTimeout(() => window.location.reload(), 250);
  };
  document.getElementById("btnHelp").onclick = () => ui.togglePanel("tutorialPanel");
  document.getElementById("btnTutorialStart").onclick = () => {
    ui.closePanels();
    localStorage.setItem("vale_tutorial", "done");
    sfx("levelup");
  };
  document.getElementById("btnOpenShopFromInv").onclick = () => {
    ui.closePanels();
    ui.togglePanel("shopPanel");
  };
  document.getElementById("btnOpenBuildFromInv").onclick = () => {
    ui.closePanels();
    ui.togglePanel("buildPanel");
  };

  // controles móveis
  document.querySelectorAll("#dpad button").forEach((btn) => {
    const dir = btn.dataset.dir;
    const key = { up: "w", down: "s", left: "a", right: "d" }[dir];
    const press = (v) => (game.keys[key] = v);
    btn.addEventListener("pointerdown", (e) => { e.preventDefault(); press(true); });
    btn.addEventListener("pointerup", (e) => { e.preventDefault(); press(false); });
    btn.addEventListener("pointerleave", () => press(false));
    btn.addEventListener("pointercancel", () => press(false));
  });
  const action = document.getElementById("btnAction");
  if (action) action.addEventListener("pointerdown", (e) => { e.preventDefault(); tryInteract(); });
  document.getElementById("btnEndShift")?.addEventListener("click", () => {
    const s=game.shift; if(!s) return;
    commands.interact("finishShift", { served: s.served||0, total: s.total||8 });
    closeShiftOverlay(); sfx("levelup");
  });
  document.getElementById("btnCancelShift")?.addEventListener("click", closeShiftOverlay);
  document.getElementById("btnExitFurniture")?.addEventListener("click", ()=>{ cancelFurniture(); ui.notify("Modo decoração encerrado."); });
}

function sendChat() {
  const input = document.getElementById("chatInput");
  const msg = input.value.trim();
  if (msg) commands.chat(msg);
  input.value = "";
  input.blur();
}

// ---------------- AÇÕES NO MUNDO ----------------
function handleWorldClick() {
  if (document.getElementById("shiftOverlay")?.classList.contains("open")) return;
  if (ui.isPanelOpen()) return;
  if (isIndoors()) {
    // furniture placement mode has priority
    if (window.hasFurniturePick && window.hasFurniturePick()) {
      const ipos2 = screenToWorldInterior(game.mouse.x, game.mouse.y, canvas);
      if (window.consumeFurniturePick) window.consumeFurniturePick(ipos2.x, ipos2.y);
      return;
    }
    const ipos = screenToWorldInterior(game.mouse.x, game.mouse.y, canvas);
    // porta sul (sair)
    if (ipos.y >= INTERIOR_H - 2.2 && ipos.x >= 7 && ipos.x <= 9) {
      tryToggleInterior();
      return;
    }
    // fogão
    if (["casa_player","taverna"].includes(game.indoors) && ipos.y >= 1.4 && ipos.y <= 3.4 && ipos.x >= 6 && ipos.x <= 10) {
      ui.togglePanel("kitchenPanel");
      sfx("open");
      return;
    }
    return;
  }
  const pos = screenToWorld(game.mouse.x, game.mouse.y, canvas);
  const { w: MAP_W, h: MAP_H } = currentRegionDef().size || { w:70, h:50 };
  const tx = Math.floor(pos.x), ty = Math.floor(pos.y);
  if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return;

  if (game.pendingBuild) {
    commands.interact("build", { buildingId: game.pendingBuild, x: tx, y: ty });
    sfx("build");
    game.pendingBuild = null;
    return;
  }

  // caverna: escadas
  const hereTile = tileAt(tx, ty);
  if (hereTile === TILE.CAVE_STAIRS_DOWN || hereTile === TILE.CAVE_STAIRS_UP) {
    const d = Math.hypot(tx + 0.5 - game.x, ty + 0.5 - game.y);
    if (d > 2.6) return ui.notify("Chegue perto da escada.", "error");
    caveStairsStep(hereTile === TILE.CAVE_STAIRS_DOWN ? 1 : -1);
    return;
  }

  // NPCs e prédios da região atual
  for (const npc of currentNpcs()) {
    const p = npcPos(npc);
    if (Math.hypot(p.x - pos.x, p.y - pos.y) < 1.2) {
      const d = Math.hypot(p.x - game.x, p.y - game.y);
      if (d > 3.6) return ui.notify(`${npc.name}: chegue mais perto.`, "error");
      commands.talk(npc.id);
      ui.openNpc(npc.id);
      sfx("chat");
      return;
    }
  }
  // construir? clique em prédio (região)
  for (const b of currentBuildings()) {
    if (tx >= b.x && tx < b.x + b.w && ty >= b.y && ty < b.y + b.h) {
      const d = Math.hypot(b.x + b.w / 2 - game.x, b.y + b.h / 2 - game.y);
      if (d > 6) return ui.notify(`${b.name}: chegue mais perto para interagir.`, "error");
      return interactBuilding(b);
    }
  }

  // planta pronta: colher com qualquer item
  const plot = game.world.plots[`${tx},${ty}`];
  if (plot?.crop && CROPS[plot.crop] && plot.stage >= CROPS[plot.crop].daysToGrow) {
    const d = Math.hypot(tx + 0.5 - game.x, ty + 0.5 - game.y);
    if (d > 4.5) return ui.notify("Chegue mais perto da planta.", "error");
    commands.interact("harvest", { x: tx, y: ty });
    sfx("harvest");
    return;
  }

  const slot = game.hotbar[game.selected];
  if (!slot) return ui.notify("Selecione uma ferramenta ou semente na barra (1–9).", "error");
  const dist = Math.hypot(tx + 0.5 - game.x, ty + 0.5 - game.y);
  if (dist > 4.5) return ui.notify("Muito longe! Chegue mais perto.", "error");

  if (slot.id === "enxada") {
    commands.interact("till", { x: tx, y: ty });
    game.actionUntil = performance.now() + 420;
    game.actionTool = "enxada";
    sfx("till");
  } else if (slot.id === "regador") {
    commands.interact("water", { x: tx, y: ty });
    game.actionUntil = performance.now() + 420;
    game.actionTool = "regador";
    sfx("water");
  } else if (slot.id.endsWith("_seed")) {
    commands.interact("plant", { x: tx, y: ty, seed: slot.id });
    game.actionUntil = performance.now() + 420;
    game.actionTool = "semente";
    sfx("plant");
  } else if (slot.id === "machado") {
    if (!isNearForest()) return ui.notify("Use o machado perto das árvores da floresta (área verde-escura ao noroeste).", "error");
    commands.interact("chop", { x: tx, y: ty });
    game.actionUntil = performance.now() + 420;
    game.actionTool = "machado";
    sfx("chop");
  } else if (slot.id === "picareta") {
    const vein = tileAt(tx, ty) === TILE.CAVE_CRYSTAL;
    if (!vein && !isNearStone()) return ui.notify("Use a picareta nas rochas da mina (nordeste, cinza).", "error");
    if (vein && dist > 3.2) return ui.notify("Chegue mais perto do veio de cristal.", "error");
    commands.interact("mine", { x: tx, y: ty });
    game.actionUntil = performance.now() + 420;
    game.actionTool = "picareta";
    sfx("mine");
  } else if (slot.id === "vara") {
    if (!isNearWater()) return ui.notify("Aproxime-se da água para pescar.", "error");
    commands.interact("fish", {});
    sfx("fish");
    spawnEffect(game.x, game.y, "fish_wait");
  } else if (slot.id === "foice") {
    if (plot?.crop) {
      ui.notify("Essa planta ainda está crescendo. Regue todos os dias!", "error");
    } else {
      ui.notify("A foice é usada para colher plantas maduras.");
    }
  } else {
    ui.notify("Esse item não pode ser usado aqui. Selecione uma ferramenta/semente.");
  }
}

/** Sobe ou desce um andar da caverna (ou volta para o vale, no andar 1). */
function caveStairsStep(dir) {
  const region = currentRegion();
  if (!region.startsWith("caverna")) return;
  const floor = Number(region.replace("caverna", "")) || 1;
  if (dir > 0) {
    if (floor >= 3) return ui.notify("Não há mais fundo: esta é a última galeria.", "info");
    commands.interact("travel", { to: `caverna${floor + 1}` });
  } else if (floor <= 1) {
    commands.interact("travel", { to: "vale" });
  } else {
    commands.interact("travel", { to: `caverna${floor - 1}` });
  }
  sfx("open");
}
window.caveStairsStep = caveStairsStep;

function tryToggleInterior(){
  if(game.indoors){
    // sair: volta para posição externa memorizada
    const last = game._lastOutdoor || { x: game.x, y: game.y };
    game.indoors = null;
    game.x = last.x; game.y = last.y;
    game.camera.x = game.x; game.camera.y = game.y;
    commands.interact("setIndoor", { buildingId: null });
    ui.notify("Você saiu. (F para voltar a entrar)", "info");
    return;
  }
}

function interactBuilding(b) {
  if (["mercado", "carpintaria", "ferraria"].includes(b.id)) {
    // F dentro do prédio entra no interior; clique na fachada abre loja
    if(b.id==="mercado" && window.confirm("Entrar no mercado? (OK = entrar, Cancelar = abrir loja)")){
      enterInterior(b.id); return;
    }
    ui.togglePanel("shopPanel");
    ui.renderShop(b.id === "ferraria" ? "tools" : b.id === "carpintaria" ? "materials" : "seeds");
    sfx("open");
    return;
  }
  if (["casa_player","taverna","carpintaria","ferraria","clinica","prefeitura"].includes(b.id)) {
    enterInterior(b.id);
    return;
  }
  if (b.id === "banco") { ui.togglePanel("bankPanel"); sfx("open"); return; }
  if (b.id === "igreja") { ui.togglePanel("housePanel"); sfx("open"); return; }
  if (b.id === "doca" || b.id === "pier" || b.id === "pier_ilha") {
    // embarque barco
    ui.togglePanel("travelPanel");
    if(window.renderTravel) window.renderTravel = ui.renderTravel;
    ui.renderTravel();
    sfx("open");
    return;
  }
  if (b.id === "aerodromo" || b.id === "aeroporto") {
    ui.togglePanel("travelPanel"); ui.renderTravel(); sfx("open"); return;
  }
  if (b.id === "celeiro") {
    ui.notify("🐔 O celeiro abriga seus animais. Compre animais na aba do Mercado.", "success");
    return;
  }
  if (b.id === "mina") {
    ui.notify("⛰️ A mina fica logo acima. Selecione a picareta e clique nas rochas.", "success");
    return;
  }
  if (b.id === "prefeitura") {
    ui.togglePanel("communityPanel");
    return;
  }
  ui.notify(`${b.icon} ${b.name}`);
}

function enterInterior(buildingId){
  game._lastOutdoor = { x: game.x, y: game.y };
  game.indoors = buildingId;
  // posição inicial dentro do cômodo
  game.x = INTERIOR_W/2; game.y = 8.5;
  game.camera.x = INTERIOR_W/2; game.camera.y = INTERIOR_H/2;
  commands.interact("setIndoor", { buildingId });
  sfx("open");
  ui.notify(`🏠 Você entrou em ${buildingId}. Pressione F para sair.`, "success");
}

function isNearBedGlobal(){
  if(!isIndoors()) return false;
  const bedPositions = { casa_player:[12.2,4.4], casa_simples:[12.2,4.4], casa_familia:[12.2,4.4], chacara:[12.2,4.4], clinica:[11.4,5.0] };
  const pos = bedPositions[game.indoors];
  if(!pos) return false;
  return Math.hypot(game.x - pos[0], game.y - pos[1]) < 1.9;
}
function tryInteract() {
  if (!started || isTyping()) return;
  if (document.getElementById("shiftOverlay")?.classList.contains("open")) return;
  if (document.getElementById("sleepOverlay")?.style.display==="flex") return;
  if (isIndoors()) {
    if(isNearBedGlobal()){
      // dormir só na cama — overlay estilo Stardew
      if(window.openSleepOverlay) window.openSleepOverlay();
      // pequeno delay para animação antes de enviar voto
      setTimeout(()=>{ commands.sleep(); }, 600);
      return;
    }
    tryToggleInterior(); return;
  }
  if (ui.isPanelOpen()) return;
  const npc = nearbyNpc(2.8);
  if (npc) {
    commands.talk(npc.id);
    ui.openNpc(npc.id);
    sfx("chat");
    return;
  }
  const b = nearbyBuilding();
  if (b) return interactBuilding(b);
  if (isNearWater()) {
    if (game.self.inventory.vara) {
      commands.interact("fish", {});
      sfx("fish");
    } else {
      ui.notify("🎣 Compre uma vara de pesca no Mercado para pescar.", "error");
    }
    return;
  }
  if (isNearForest()) {
    if (game.self.inventory.machado) {
      commands.interact("chop", { x: Math.floor(game.x), y: Math.floor(game.y) });
      sfx("chop");
    } else {
      ui.notify("🪓 Compre um machado no Mercado para cortar árvores.", "error");
    }
    return;
  }
  if (isNearStone()) {
    if (game.self.inventory.picareta) {
      commands.interact("mine", { x: Math.floor(game.x), y: Math.floor(game.y) });
      sfx("mine");
    } else {
      ui.notify("⛏️ Compre uma picareta no Mercado para minerar.", "error");
    }
    return;
  }
  // tile à frente
  const dx = game.dir === "left" ? -1 : game.dir === "right" ? 1 : 0;
  const dy = game.dir === "up" ? -1 : game.dir === "down" ? 1 : 0;
  const fx = Math.floor(game.x) + dx;
  const fy = Math.floor(game.y) + dy;
  const plot = game.world.plots[`${fx},${fy}`];
  if (plot?.crop) {
    const def = CROPS[plot.crop];
    if (plot.stage >= def.daysToGrow) {
      commands.interact("harvest", { x: fx, y: fy });
      sfx("harvest");
    } else if (!plot.watered) {
      commands.interact("water", { x: fx, y: fy });
      sfx("water");
    } else {
      ui.notify(`${def.icon} ${def.name}: crescendo (${plot.stage}/${def.daysToGrow}).`);
    }
    return;
  }
  ui.notify("Nada por perto. Use a enxada para preparar a terra e plante sementes!", "info");
}

// ---------------- LOOP ----------------
function loop(ts) {
  const dt = Math.min(0.05, (ts - lastFrame) / 1000 || 0);
  lastFrame = ts;
  if (started) {
    update(dt, ts);
    tickQuality(dt);
    render(canvas, ctx);
  }
  requestAnimationFrame(loop);
}

let shiftState = null; // minigame

function openShiftOverlay(){
  const ov = document.getElementById("shiftOverlay");
  if(!game.shift || !ov) return;
  ov.classList.add("open");
  runShiftRound();
}
function closeShiftOverlay(){ document.getElementById("shiftOverlay")?.classList.remove("open"); }
window.openShiftOverlay = openShiftOverlay;
window.closeShiftOverlay = closeShiftOverlay;
window.cancelFurniture = cancelFurniture;
window.startShift = () => { commands.interact("startShift", {}); };
window.hasFurniturePick = hasFurniturePick;
window.consumeFurniturePick = consumeFurniturePick;

function runShiftRound(){
  if(!game.shift) return;
  const job = game.shift;
  const total = job.total || 8;
  const done = job.served||0;
  const taskEl = document.getElementById("shiftTask");
  const optsEl = document.getElementById("shiftOptions");
  const prog = document.getElementById("shiftProgress");
  const scoreEl = document.getElementById("shiftScore");
  const titleEl = document.getElementById("shiftTitle");
  const timerEl = document.getElementById("shiftTimer");
  if(!taskEl) return;
  titleEl.textContent = `${job.icon||"💼"} ${job.name||"Turno"} — ${job.employer||""}`;
  // pick a random item from tasks
  const pool = job.tasks || ["nabo","batata","tomate"];
  const item = pool[Math.floor(Math.random()*pool.length)];
  const meta = itemMeta(item);
  taskEl.innerHTML = `${job.verb||"Registrar"}: <span style="font-size:22px">${meta.icon} ${meta.name}</span><small>Encontre ${meta.name} entre as opções</small>`;
  // build 4 options, one correct
  const decoys = [...pool].filter(x=>x!==item);
  while(decoys.length<3){ decoys.push(pool[Math.floor(Math.random()*pool.length)]); }
  const options = [item, ...decoys.slice(0,3)];
  // shuffle
  for(let i=options.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [options[i],options[j]]=[options[j],options[i]]; }
  optsEl.innerHTML="";
  for(const opt of options){
    const m=itemMeta(opt);
    const btn=document.createElement("button");
    btn.className="shiftOpt";
    btn.innerHTML=`${m.icon} ${m.name}`;
    btn.onclick=()=>{
      const ok = opt===item;
      if(ok){
        game.shift.served = (game.shift.served||0)+1;
        btn.classList.add("ok");
        sfx("buy");
      } else {
        btn.classList.add("bad");
        sfx("close");
      }
      game.shift.total = total;
      setTimeout(()=>{
        const served = game.shift.served||0;
        scoreEl.textContent = `${served}/${total} corretos`;
        prog.style.width = `${Math.round((served/total)*100)}%`;
        if(served >= total){
          taskEl.innerHTML = `✅ Tudo pronto! Encerre o turno para receber o pagamento.`;
          optsEl.innerHTML="";
        } else {
          runShiftRound();
        }
      }, 260);
    };
    optsEl.appendChild(btn);
  }
  scoreEl.textContent = `${done}/${total} corretos`;
  if(prog) prog.style.width = `${Math.round((done/total)*100)}%`;
  if(timerEl){
    const left = Math.max(0, 120000 - (Date.now() - (game.shift.startedAt||Date.now())));
    timerEl.textContent = `${String(Math.floor(left/60000)).padStart(2,"0")}:${String(Math.floor((left%60000)/1000)).padStart(2,"0")}`;
  }
}

function update(dt, ts) {
  updateEffects(dt);
  // shift timer
  if(game.shift && document.getElementById("shiftOverlay")?.classList.contains("open")){
    const timerEl=document.getElementById("shiftTimer");
    if(timerEl){
      const left=Math.max(0,120000-(Date.now()-(game.shift.startedAt||Date.now())));
      timerEl.textContent=`${String(Math.floor(left/60000)).padStart(2,"0")}:${String(Math.floor((left%60000)/1000)).padStart(2,"0")}`;
    }
  }

  const blockInput = ui.isPanelOpen() || isTyping();
  let mx = 0, my = 0;
  if (!blockInput) {
    if (game.keys["w"] || game.keys["arrowup"]) my -= 1;
    if (game.keys["s"] || game.keys["arrowdown"]) my += 1;
    if (game.keys["a"] || game.keys["arrowleft"]) mx -= 1;
    if (game.keys["d"] || game.keys["arrowright"]) mx += 1;
  }
  if (mx && my) { mx *= 0.7071; my *= 0.7071; }
  const speed = game.speed * (game.keys["shift"] ? 1.7 : 1);
  let moved = false;
  if (mx || my) {
    const nx = game.x + mx * speed * dt;
    const ny = game.y + my * speed * dt;
    if (!isCollidingClient(nx, game.y)) { game.x = nx; moved = true; }
    if (!isCollidingClient(game.x, ny)) { game.y = ny; moved = true; }
    if (mx > 0) game.dir = "right";
    else if (mx < 0) game.dir = "left";
    else if (my < 0) game.dir = "up";
    else if (my > 0) game.dir = "down";
  }
  game.moving = moved;

  // mantém a cópia do próprio jogador na lista sincronizada (minimapa, painéis)
  const meEntry = game.players.get(game.selfId);
  if (meEntry) {
    meEntry.x = game.x; meEntry.y = game.y;
    meEntry.dir = game.dir; meEntry.region = game.region;
  }

  if (moved || wasMoving) {
    const now = performance.now();
    if (now - game.lastMoveEmit > 100) {
      game.lastMoveEmit = now;
      commands.move(game.x, game.y, game.dir);
    }
  }
  wasMoving = moved;

  // câmera suave
  const camLerp = 1 - Math.exp(-8 * dt);
  game.camera.x += (game.x - game.camera.x) * camLerp;
  game.camera.y += (game.y - game.camera.y) * camLerp;

  // interpolação dos outros jogadores
  for (const p of game.players.values()) {
    if (p.id === game.selfId) continue;
    const t = 1 - Math.exp(-12 * dt);
    p.renderX += ((p.x ?? p.renderX) - p.renderX) * t;
    p.renderY += ((p.y ?? p.renderY) - p.renderY) * t;
  }

  // relógio local suave (servidor corrige de tempos em tempos)
  if (window.__timeOverride != null) game.world.time = window.__timeOverride;
  else game.world.time = Math.min(1560, game.world.time + dt * 0.7);

  hudClock += dt;
  if (hudClock > 0.25) {
    hudClock = 0;
    ui.updateHUD();
  }
  hintClock += dt;
  if (hintClock > 0.2) {
    hintClock = 0;
    ui.updateInteractHint();
  }
}

function isCollidingClient(x, y) {
  if(isIndoors()){
    const r=0.28;
    for(const [ox,oy] of [[r,r],[1-r,r],[r,0.9],[1-r,0.9]]){
      const cx=x+ox, cy=y+oy;
      if(cx <0.4|| cy<0.4|| cx>=INTERIOR_W-0.4|| cy>=INTERIOR_H-0.4) return true;
      if(cy <2.6 && cx>=5 && cx<=11 && cy<=3.3){
        if(cx>=6.2 && cx<=9.8 && cy>=1.6 && cy<=2.9) continue;
        // later: mesa não bloqueia completamente
      }
      if(cy >= INTERIOR_H-1.7 && cx>=7 && cx<=9) continue;
    }
    return false;
  }
  // hitbox centrada no sprite (a posição é o centro do personagem, não o canto do tile):
  // 0.40 x 0.40 cabe em corredores de 1 tile, essenciais nas galerias da caverna.
  const r = 0.2;
  const hy0 = 0.04, hy1 = 0.44;
  const { w: MAP_W, h: MAP_H } = currentRegionDef().size || { w:70, h:50 };
  const inCave = currentRegion().startsWith("caverna");
  for (const [ox, oy] of [[-r, hy0], [r, hy0], [-r, hy1], [r, hy1]]) {
    const cx = Math.floor(x + ox), cy = Math.floor(y + oy);
    if (cx < 0 || cy < 0 || cx >= MAP_W || cy >= MAP_H) return true;
    const t = tileAt(cx, cy);
    if (inCave && (t === TILE.CAVE_WALL || t === TILE.CAVE_CRYSTAL)) return true;
    if (t === TILE.WATER) {
      if (cy === 26 && cx >= 58 && cx <= 61 && (game.world.communityProgress.ponte || 0) >= 1000) continue;
      return true;
    }
  }
  for (const b of currentBuildings()) {
    if(b.id==="doca"||b.id==="aerodromo"||b.id==="pier"||b.id==="pier_ilha"||b.id==="aeroporto") continue;
    if (x + r > b.x && x - r < b.x + b.w && y + hy1 > b.y && y + hy0 < b.y + b.h) return true;
  }
  for (const [key, b] of Object.entries(game.world.buildings || {})) {
    const def = BUILD_OPTIONS[b.buildingId];
    if (!def) continue;
    if (b.buildingId === "estufa") continue; // estufa é caminhável por dentro
    if (x + r > b.x && x - r < b.x + def.w && y + hy1 > b.y && y + hy0 < b.y + def.h) return true;
  }
  return false;
}

// ---------------- CAPA ----------------
function initCover() {
  try { initCoverCanvas(); } catch (e) { console.warn("cover", e); }
  const toLogin = () => {
    document.getElementById("coverScreen")?.classList.remove("active");
    document.getElementById("loginScreen")?.classList.add("active");
    try { stopCoverLoop(); } catch {}
    // mostra Continuar se houver save
    const name = localStorage.getItem("vale_name");
    const cont = document.getElementById("btnCoverContinue");
    if (cont) cont.style.display = name ? "inline-flex" : "none";
  };
  const toCover = () => {
    document.getElementById("loginScreen")?.classList.remove("active");
    document.getElementById("coverScreen")?.classList.add("active");
    try { initCoverCanvas(); } catch {}
  };
  document.getElementById("btnCoverPlay")?.addEventListener("click", () => { const loginActive = document.getElementById("loginScreen")?.classList.contains("active"); if (loginActive) { play(); return; } // se já está no criador, Jogar inicia direto
    toLogin(); sfx("open"); });
  document.getElementById("btnCoverContinue")?.addEventListener("click", () => {
    const name = localStorage.getItem("vale_name");
    if (name) document.getElementById("inpName").value = name;
    toLogin(); sfx("open");
  });
  document.getElementById("btnCoverSettings")?.addEventListener("click", () => { toLogin(); setTimeout(()=> ui.togglePanel("settingsPanel"), 120); });
  document.getElementById("btnCoverCredits")?.addEventListener("click", () => {
    const v = document.getElementById("versionTag")?.textContent?.match(/v[\d.]+/)?.[0] || "v1.9.0";
    ui.notify(`Vale Aconchegante ${v} — arte original, multiplayer real, feito no Brasil. Obrigado por jogar!`, "success");
  });
  document.getElementById("btnCoverQuit")?.addEventListener("click", () => {
    if (window.confirm("Sair do jogo?")) window.close();
  });
  // tecla Enter na capa
  window.addEventListener("keydown", (e) => {
    if (!document.getElementById("coverScreen")?.classList.contains("active")) return;
    if (e.key === "Enter") { toLogin(); sfx("open"); }
    if (e.key === "Escape") { /* fica na capa */ }
  });
  // botão Voltar no login (se existir)
  const backBtn = document.getElementById("btnBackToCover");
  if (backBtn) backBtn.addEventListener("click", toCover);
  // expõe para debug
  window.toCover = toCover;
  window.toLogin = toLogin;
}

// ---------------- VERSÃO VISÍVEL (mesma no navegador e no .exe) ----------------
fetch("/api/version", { cache: "no-store" }).then(r=>r.json()).then(d=>{
  const v = d.version ? `v${d.version}` : "v1.9.0";
  const el = document.getElementById("versionTag");
  if (el) el.textContent = `${v} • Pixel art original • Feito com carinho no Brasil`;
  const cr = document.getElementById("creditsTag");
  if (cr) cr.textContent = `${v} • Arte original em pixel art • Multiplayer real`;
  console.log(`%cVale Aconchegante ${v} — client carregado`, "color:#6aa84f;font-weight:700");
  // se o HTML cacheado for antigo, avisa
  const metaV = document.querySelector('meta[name=\"vale-version\"]')?.content;
  if (metaV && d.version && metaV !== d.version) {
    console.warn(`HTML em cache (meta ${metaV} != servidor ${d.version}). Faça Ctrl+Shift+R.`);
  }
}).catch(()=>{});

// ---------------- BOOT ----------------
initCover();
initLogin();
try { drawLogo(); } catch (e) { console.warn("logo", e); }
hydrateIcons(document);

// chat retrátil
document.getElementById("chatToggle")?.addEventListener("click", () => {
  document.getElementById("chatBox")?.classList.toggle("collapsed");
});
