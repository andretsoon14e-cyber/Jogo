import {
  game, commands, itemMeta, itemIcon, sellPriceClient, rebuildHotbar, formatTime,
  npcPos, nearbyNpc, nearbyBuilding, isNearWater, isNearForest, isNearStone,
} from "./state.js";
import {
  CROPS, TOOLS, BUILD_OPTIONS, BUILDINGS, NPCS_DATA, NPC_DIALOGS, QUESTS,
  SKILLS, COMMUNITY_PROJECTS, SEASONS, PLAYER_SKINS, ANIMALS, FRIENDSHIP, ALL_NPCS, NPC_BY_ID,
} from "../../shared/constants.js";
import { sfx, applyAudioSettings } from "./audio.js";
import { RECIPES, JOBS, QUEST_CHAINS, COOP_MISSIONS, TRANSPORT, REGION_DEFS, WEEKDAY_NAMES, weekdayName } from "../../shared/careers.js";
import { BANK } from "../../shared/bank.js";
import { REL_STAGES, ROMANCEABLE, DIALOG_CHOICES } from "../../shared/social.js";
import { renderMiniMap } from "./renderer.js";
import { setIcon, npcPortrait, iconTag } from "./art/ui-binding.js";
import { iconImg } from "./art/icons.js";
import { characterFrames, NPC_SPECS } from "./art/characters.js";
import { C } from "./art/palette.js";

/** Ícone de moeda/estrela/check em tamanho de texto (sem emoji). */

/** Ícone desenhado para cada área de trabalho (sem emoji). */
const JOB_ICON = {
  caixa: "bag", padeiro: "pao", pescador: "peixe", ferreiro: "hammer",
  operario: "madeira", entregador: "bag", agricultor: "sprout",
};
const jobIcon = (id, n = 16) => iconTag(JOB_ICON[id] || "job", n);
const coinIco = (n = 14) => iconTag("coin", n);
const starIco = (n = 14) => iconTag("star", n);
const checkIco = (n = 14) => iconTag("check", n);

const $ = (id) => document.getElementById(id);
let toastTimer = null;

export function initUI() {
  rebuildHotbar();
  updateHotbar();
  updateHUD();
  updatePlayerList();
  renderInventory();
  renderQuests();
  renderCommunity();
  renderSocial();
  renderBuild();
  renderShop("seeds");
  renderBank(); renderHouses();
  initSettings();
  renderAgenda();
  updateInteractHint();
  $("giftSelect").innerHTML = "";
  initHouseUI();
  game.uiReady = true;
}

// ---------------- NOTIFICAÇÕES ----------------
export function notify(msg, type = "info") {
  const c = $("notifications");
  if (!c) return;
  const d = document.createElement("div");
  d.className = `notif ${type}`;
  d.textContent = msg;
  c.appendChild(d);
  setTimeout(() => {
    d.style.opacity = "0";
    d.style.transform = "translateY(-6px)";
    d.style.transition = "all .3s";
    setTimeout(() => d.remove(), 320);
  }, 3200);
  if (c.children.length > 6) c.firstElementChild.remove();
}

export function toast(msg, type = "info") { notify(msg, type); }

// ---------------- HUD ----------------
const WEATHER_ICON = { Ensolarado: "☀️", Nublado: "☁️", Chuvoso: "🌧️", Nevoa: "🌫️", Neve: "❄️" };

export function updateHUD() {
  const self = game.self;
  const w = game.world;
  $("hudGold").textContent = `$${self.gold ?? 0}` + (game.bank?.balance ? `  ·  banco $${game.bank.balance}` : "");
  $("hudTime").textContent = formatTime(w.time);
  $("hudDay").textContent = `Dia ${w.day}`;
  const weekday = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"][(w.day - 1) % 7];
  $("hudWeekday").textContent = weekday;
  renderAgenda();
  updateInteriorBanner();
  $("hudSeason").textContent = SEASONS[w.seasonIndex || 0];
  setIcon($("hudWeather"), WEATHER_ICON[w.weather] || "sun", 16);
  $("hudOnline").textContent = `${game.players.size} online`;
  $("hudLocation").textContent = currentLocation();
  const fest = $("festivalBadge");
  if (w.festival) {
    fest.style.display = "inline-flex";
    fest.textContent = `🎉 ${w.festival.name}!`;
  } else {
    fest.style.display = "none";
  }
}

function renderAgenda(){
  const head = $("agendaHead"), body = $("agendaBody"), acts = $("agendaActions");
  if(!head||!body) return;
  const w = game.world;
  const weekday = WEEKDAY_NAMES[((w.seasonIndex||0)*28 + (w.day-1))%7] || "Segunda";
  const seasonName = SEASONS[w.seasonIndex||0];
  const timeStr = formatTime(w.time);
  const indoorsTag = game.indoors ? ` • 🏠 ${game.indoors}` : "";
  const regionTag = game.region && game.region!=="vale" ? ` • ${REGION_DEFS[game.region]?.icon||"🗺️"} ${REGION_DEFS[game.region]?.name||game.region}` : "";
  head.innerHTML = `${weekday} <small>${w.day}/28 • ${seasonName} • ${timeStr}${indoorsTag}${regionTag}</small>`;

  let html = "";
  const job = game.job;
  if(!job || !job.job){
    html += `<div>💼 <b>Sem emprego</b> — abra <b>Empregos (O)</b> para se candidatar.</div>`;
  } else {
    const wdShort = ["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"];
    const wdIdx = ((w.seasonIndex||0)*28 + (w.day-1))%7;
    const isVac = job.isVacation;
    const isWork = job.isWorkday;
    const inWin = job.inShiftWindow;
    let tag="", detail="";
    if(isVac){ tag=`<span class="agendaTag vacation">FÉRIAS</span>`; detail=`Férias pagas hoje (+50% do turno). Aproveite o descanso!`;}
    else if(!isWork){ tag=`<span class="agendaTag off">FOLGA</span>`; detail=`Hoje é folga. Próximo turno: ${wdShort.filter((_,i)=>job.workdays.includes(i)).join(", ") || "—"}.`;}
    else if(inWin){ tag=`<span class="agendaTag working">EM TURNO</span>`; detail=`Vá até <b>${job.job.employer}</b> e comece o turno!`;}
    else { const hm = `${String(Math.floor(job.shift.start/60)).padStart(2,"0")}:${String(job.shift.start%60).padStart(2,"0")}–${String(Math.floor(job.shift.end/60)).padStart(2,"0")}:${String(job.shift.end%60).padStart(2,"0")}`; tag=`<span class="agendaTag work">TRABALHO</span>`; detail=`🕘 Turno <b>${hm}</b> no ${job.job.employer}.`;}

    html += `<div>${jobIcon(job.job.id)} <b>${job.job.name}</b>${tag}</div><div style="margin-top:2px">${detail}</div>`;
    html += `<div style="margin-top:4px">Turnos: <b>${job.shiftsWorked||0}</b> • Ganhos: <b>$${job.totalEarned||0}</b> • Rep: <b>${job.reputation||50}/100</b></div>`;
  }
  // week strips
  if(job && job.workdays){
    html+=`<div class="jobSchedule" style="margin-top:6px">`;
    for(let i=0;i<7;i++){
      const isWork = job.workdays.includes(i);
      const isVacDay = (job.vacationDays||[]).includes(w.day) && isWork;
      const isToday = (((w.seasonIndex||0)*28+(w.day-1))%7)===i;
      const cls = isVacDay?"vacation": isWork?"workday":"";
      html+=`<span class="dayPill ${cls} ${isToday?"today":""}">${["S","T","Q","Q","S","S","D"][i]}<br>${["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"][i].slice(0,3)}</span>`;
    }
    html+=`</div>`;
  }
  body.innerHTML = html;

  if(acts){
    acts.innerHTML="";
    if(job && job.job && !job.isVacation && job.isWorkday){
      const b = document.createElement("button");
      b.className="btn small primary";
      b.textContent= job.inShiftWindow? "Começar turno" : `Turno ${String(Math.floor(job.shift.start/60)).padStart(2,"0")}:${String(job.shift.start%60).padStart(2,"0")}`;
      b.onclick=()=>{ if(window.startShift) window.startShift(); else commands.interact("startShift",{}); };
      if(!job.inShiftWindow) b.disabled=true;
      acts.appendChild(b);
    }
    if(game.shift){
      const b=document.createElement("button"); b.className="btn small primary"; b.textContent="⏱️ Ver turno"; b.onclick=()=> window.openShiftOverlay && window.openShiftOverlay(); acts.appendChild(b);
    }
    if(game.region!=="vale"){
      const b=document.createElement("button"); b.className="btn small secondary"; b.textContent="⛵ Voltar ao Vale"; b.onclick=()=> commands.interact("travel",{to:"vale"}); acts.appendChild(b);
    }
  }
}

function updateInteriorBanner(){
  const el=$("interiorBanner");
  if(!el) return;
  if(game.indoors){
    el.classList.add("show");
    let def = {casa_player:"Sua Casa", taverna:"Taverna", mercado:"Mercado", carpintaria:"Carpintaria", ferraria:"Ferraria", clinica:"Clínica", prefeitura:"Prefeitura"}[game.indoors] || game.indoors;
    if (String(game.indoors).startsWith("casa:")) {
      const h = (game.world?.houses || []).find((x) => `casa:${x.id}` === game.indoors);
      if (h) def = h.apartment ? `Apartamento de ${h.owner || "?"}` : `Casa de ${h.owner || "?"}`;
    }
    el.innerHTML=`🏠 Dentro: <b>${def}</b> — pressione <b>F</b> ou <b>Esc</b> para sair${["casa_player","taverna"].includes(game.indoors)?" • <b>K</b> cozinhar":""}`;
  } else el.classList.remove("show");
}

function currentLocation() {
  const { x, y } = game;
  if (game.indoors) {
    const names = { casa_player: "Sua Casa", taverna: "Taverna do Vale", mercado: "Mercado Central", banco: "Banco do Vale", igreja: "Igreja do Vale", ferraria: "Ferraria", clinica: "Clínica", prefeitura: "Prefeitura", carpintaria: "Carpintaria", casa_simples: "Casa Simples", casa_familia: "Casa de Família", chacara: "Chácara" };
    return names[game.indoors] || "Interior";
  }
  const region = game.region || "vale";
  if (region !== "vale") {
    // regiões nomeadas (vila, ilha, cidade e os andares da caverna)
    return REGION_DEFS[region]?.name || "Interior";
  }
  if (x > 50 && y < 13) return "Mina do Vale";
  if (x < 15 && y < 15) return "Floresta Sussurrante";
  if (y > 45) return "Praia do Vale";
  if (y > 32 && x > 6 && x < 30) return "Lago do Vale";
  if (y >= 30 && x >= 12 && x <= 24) return "Sua Fazenda";
  // lotes das casas dos jogadores (ver HOUSE_LOTS em shared/houses.js)
  if (x >= 27 && x <= 57 && y >= 26 && y <= 45) return "Bairro Residencial";
  if (x >= 25 && x <= 56 && y >= 6 && y <= 30) return "Centro da Cidade";
  if (x >= 58 && y >= 20 && y <= 32) return "Margem Leste";
  return "Sua Fazenda";
}

// ---------------- HOTBAR ----------------
export function updateHotbar() {
  const c = $("hotbarSlots");
  if (!c) return;
  c.innerHTML = "";
  for (let i = 0; i < 9; i++) {
    const slot = game.hotbar[i];
    const d = document.createElement("div");
    d.className = `slot${i === game.selected ? " selected" : ""}${slot ? "" : " empty"}`;
    if (slot) {
      const meta = itemMeta(slot.id);
      // ícone em escala inteira (16px de arte × 4 = 64px): sem esticar nem borrar
      const iconHtml = iconTag(slot.id, 64);
      d.innerHTML = `
        <div class="key">${i + 1}</div>
        <div class="icon">${iconHtml}</div>
        ${slot.qty > 1 ? `<div class="count">x${slot.qty}</div>` : ""}`;
      d.title = meta.name;
      d.onclick = () => selectSlot(i);
    } else {
      d.innerHTML = `<div class="key">${i + 1}</div>`;
      d.style.opacity = "0.35";
    }
    c.appendChild(d);
  }
}

export function selectSlot(i) {
  game.selected = i;
  updateHotbar();
  sfx("open");
}

// ---------------- INVENTÁRIO / HABILIDADES ----------------
export function renderInventory() {
  const grid = $("invGrid");
  if (!grid) return;
  grid.innerHTML = "";
  const inv = game.self.inventory || {};
  const entries = Object.entries(inv).filter(([, q]) => q > 0);
  if (entries.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1;opacity:.6;font-size:13px">Sua mochila está vazia. Plante, colha, pesque ou minere!</div>`;
  }
  for (const [id, qty] of entries) {
    const meta = itemMeta(id);
    const d = document.createElement("div");
    d.className = "invSlot";
    // usa ícone pixelado Stardew-like se disponível, senão emoji
    d.innerHTML = `<div class="ico">${iconTag(id, 32)}</div><div class="nm">${meta.name}</div><div class="qty">x${qty}</div>`;
    d.title = `${meta.name} — vende por ${meta.sell || "?"} ouros`;
    d.onclick = () => {
      const idx = game.hotbar.findIndex((s) => s.id === id);
      if (idx >= 0) { game.selected = idx; updateHotbar(); }
      notify(`${meta.name}: x${qty}`);
    };
    grid.appendChild(d);
  }
  // ferramentas
  for (const t of ["enxada", "regador", "foice"]) {
    const meta = itemMeta(t);
    const d = document.createElement("div");
    d.className = "invSlot tool";
    d.innerHTML = `<div class="ico">${iconTag(t, 32)}</div><div class="nm">${meta.name}</div>`;
    d.onclick = () => togglePanel("inventoryPanel");
    grid.appendChild(d);
  }
  const toolsOwned = ["machado", "picareta", "vara"].filter((t) => inv[t]);
  for (const t of toolsOwned) {
    const meta = itemMeta(t);
    const d = document.createElement("div");
    d.className = "invSlot tool owned";
    d.innerHTML = `<div class="ico">${iconTag(t, 32)}</div><div class="nm">${meta.name}</div>`;
    grid.appendChild(d);
  }
  updateSkills();
  updateStatsLine();
}

export function updateSkills() {
  const c = $("skillsList");
  if (!c) return;
  c.innerHTML = "";
  for (const [key, def] of Object.entries(SKILLS)) {
    const lvl = game.self.level[key] || 1;
    const xp = game.self.xp[key] || 0;
    const need = lvl * 100;
    const row = document.createElement("div");
    row.className = "skillRow";
    row.innerHTML = `<span class="skillName">${def.icon} ${def.name}</span>
      <div class="bar"><div style="width:${Math.min(100, (xp / need) * 100)}%"></div></div>
      <span class="lvl">Nv ${lvl}</span>`;
    row.title = `${xp}/${need} XP`;
    c.appendChild(row);
  }
}

function updateStatsLine() {
  const el = $("statsLine");
  if (!el) return;
  const s = game.self.stats || {};
  el.textContent = `🌾 ${s.harvested || 0} colhidos • 🎣 ${s.fish || 0} peixes • 🪵 ${s.wood || 0} madeiras • 🪨 ${s.stone || 0} pedras • 🐔 ${s.animals || 0} animais`;
}

// ---------------- LOJA ----------------
const SHOP_TABS = [
  { id: "seeds", label: "Sementes", icon: "sprout" },
  { id: "tools", label: "Ferramentas", icon: "hammer" },
  { id: "animals", label: "Animais", icon: "animal" },
  { id: "materials", label: "Materiais", icon: "madeira" },
  { id: "sell", label: "Vender", icon: "coin" },
];

export function renderShop(tab = game.shopTab) {
  game.shopTab = tab;
  const tabsEl = $("shopTabs");
  if (tabsEl) {
    tabsEl.innerHTML = "";
    for (const t of SHOP_TABS) {
      const b = document.createElement("button");
      b.className = `tab${t.id === tab ? " active" : ""}`;
      b.innerHTML = `${iconTag(t.icon, 17)} ${t.label}`;
      b.onclick = () => { renderShop(t.id); sfx("open"); };
      tabsEl.appendChild(b);
    }
  }
  const c = $("shopContent");
  if (!c) return;
  c.innerHTML = "";
  if (tab === "seeds") {
    const season = game.world.seasonIndex;
    for (const [id, crop] of Object.entries(CROPS)) {
      const inSeason = crop.season === season;
      const row = document.createElement("div");
      row.className = "shopItem";
      row.innerHTML = `
        <div class="shopInfo"><b>${crop.icon} ${crop.name}</b>
          <div class="sub">${crop.daysToGrow} dias • ${SEASONS[crop.season]} ${inSeason ? "" : "• não cresce agora"} • vende por ${crop.sellPrice}</div>
        </div>
        <div class="shopBuy">
          <span class="price">${coinIco()} ${crop.seedPrice}</span>
          <button class="btn small primary" data-buy="${id}" data-qty="1">+1</button>
          <button class="btn small secondary" data-buy="${id}" data-qty="5">+5</button>
        </div>`;
      c.appendChild(row);
    }
    c.insertAdjacentHTML("beforeend", `<p class="hintLine">💡 Sementes fora de estação não crescem, a menos que você plante dentro de uma estufa. Sementes compradas ficam no inventário.</p>`);
  } else if (tab === "tools") {
    const tools = [
      { id: "machado", ...TOOLS.machado },
      { id: "picareta", ...TOOLS.picareta },
      { id: "vara", ...TOOLS.vara },
    ];
    for (const t of tools) {
      const owned = !!game.self.inventory[t.id];
      const row = document.createElement("div");
      row.className = "shopItem";
      row.innerHTML = `
        <div class="shopInfo"><b>${t.icon} ${t.name}</b><div class="sub">${t.id === "vara" ? "Pesque no lago e nos rios" : t.id === "machado" ? "Corte árvores na floresta" : "Minere rochas na mina"}</div></div>
        <div class="shopBuy">
          <span class="price">${coinIco()} ${t.price}</span>
          <button class="btn small ${owned ? "disabled" : "primary"}" ${owned ? "disabled" : ""} data-buy="${t.id}" data-qty="1">${owned ? "Já possui" : "Comprar"}</button>
        </div>`;
      c.appendChild(row);
    }
    c.insertAdjacentHTML("beforeend", `<p class="hintLine">🔨 Enxada, regador e foice já vêm com você.</p>`);
  } else if (tab === "animals") {
    const hasStable = Object.values(game.world.buildings).some((b) => b.owner === game.username && (b.buildingId === "celeiro" || b.buildingId === "pocilga"));
    for (const [id, a] of Object.entries(ANIMALS)) {
      const row = document.createElement("div");
      row.className = "shopItem";
      row.innerHTML = `
        <div class="shopInfo"><b>${a.icon} ${a.name}</b><div class="sub">Produz ${itemMeta(a.product).icon} ${itemMeta(a.product).name} todo dia • precisa de celeiro</div></div>
        <div class="shopBuy">
          <span class="price">${coinIco()} ${a.price}</span>
          <button class="btn small ${hasStable ? "primary" : "secondary"}" ${hasStable ? "" : "disabled"} data-buy="${id}" data-qty="1">${hasStable ? "Comprar" : "Sem celeiro"}</button>
        </div>`;
      c.appendChild(row);
    }
    c.insertAdjacentHTML("beforeend", `<p class="hintLine">🐔 Compre um celeiro na aba Construir (B) para criar animais. Eles produzem enquanto você joga.</p>`);
  } else if (tab === "materials") {
    const mats = [{ id: "madeira", qty: 10, price: 150, icon: "🪵", name: "Madeira x10" }, { id: "pedra", qty: 10, price: 100, icon: "🪨", name: "Pedra x10" }];
    for (const m of mats) {
      const row = document.createElement("div");
      row.className = "shopItem";
      row.innerHTML = `<div class="shopInfo"><b>${m.icon} ${m.name}</b><div class="sub">Material de construção</div></div>
        <div class="shopBuy"><span class="price">${coinIco()} ${m.price}</span><button class="btn small primary" data-buy="${m.id}" data-qty="${m.qty}">Comprar</button></div>`;
      c.appendChild(row);
    }
  } else if (tab === "sell") {
    c.innerHTML = `<p class="hintLine">Venda o que você produziu. Produtos de melhor qualidade valem mais!</p>`;
    const entries = Object.entries(game.self.inventory || {}).filter(([id, q]) => q > 0 && sellPriceClient(id) > 0);
    if (!entries.length) c.insertAdjacentHTML("beforeend", `<p style="opacity:.6;font-size:13px">Nada para vender ainda. Colha, pesque ou minere!</p>`);
    for (const [id, qty] of entries) {
      const meta = itemMeta(id);
      const price = sellPriceClient(id);
      const row = document.createElement("div");
      row.className = "shopItem";
      row.innerHTML = `<div class="shopInfo"><b>${meta.icon} ${meta.name}</b><div class="sub">Você tem ${qty} • ${price} ouros cada</div></div>
        <div class="shopBuy"><button class="btn small secondary" data-sell="${id}" data-qty="1">1</button>
        <button class="btn small secondary" data-sell="${id}" data-qty="5">5</button>
        <button class="btn small primary" data-sell="${id}" data-qty="${qty}">Tudo</button></div>`;
      c.appendChild(row);
    }
  }
  c.querySelectorAll("[data-buy]").forEach((b) => {
    b.onclick = () => {
      commands.interact("buy", { item: b.dataset.buy, qty: Number(b.dataset.qty) });
      sfx("buy");
    };
  });
  c.querySelectorAll("[data-sell]").forEach((b) => {
    b.onclick = () => {
      commands.interact("sell", { item: b.dataset.sell, qty: Number(b.dataset.qty) });
      sfx("sell");
    };
  });
}

// ---------------- CONSTRUÇÃO ----------------
export function renderBuild() {
  const c = $("buildContent");
  if (!c) return;
  c.innerHTML = `<p class="hintLine">Escolha uma construção, confira o custo e clique em um espaço livre da sua fazenda. Todos no multiplayer veem a obra.</p>`;
  for (const [id, def] of Object.entries(BUILD_OPTIONS)) {
    const owned = Object.values(game.world.buildings).filter((b) => b.owner === game.username && b.buildingId === id).length;
    const costText = Object.entries(def.cost).map(([m, v]) => m === "gold" ? `${coinIco()} ${v}` : `${itemMeta(m).icon} ${v}`).join(" • ");
    const canAfford = Object.entries(def.cost).every(([m, v]) => m === "gold" ? game.self.gold >= v : (game.self.inventory[m] || 0) >= v);
    const full = owned >= def.max;
    const row = document.createElement("div");
    row.className = "shopItem buildRow";
    row.innerHTML = `<div class="shopInfo"><b>${def.icon} ${def.name} ${owned}/${def.max}</b><div class="sub">${def.desc} • ${def.w}x${def.h} tiles<br>${costText}</div></div>
      <button class="btn small ${full || !canAfford ? "secondary" : "primary"}" ${full || !canAfford ? "disabled" : ""}>${full ? "Limite" : "Posicionar"}</button>`;
    row.querySelector("button").onclick = () => {
      game.pendingBuild = id;
      togglePanel("buildPanel");
      notify(`🏗️ Clique no mapa para posicionar: ${def.name}. Esc cancela.`, "success");
      sfx("open");
    };
    c.appendChild(row);
  }
}

// ---------------- MISSÕES ----------------
export function renderQuests() {
  const c = $("questContent");
  if (!c) return;
  c.innerHTML = `<p class="hintLine">Missões acumulam progresso enquanto você joga. Resgate a recompensa quando o objetivo for cumprido.</p>`;
  // coop resumo compacto no topo do diário
  if((game.career?.coop||[]).length){
    const doneCount=(game.career.coop||[]).filter(x=>x.completed).length;
    const summary=document.createElement("div");
    summary.className="statsLine";
    summary.style.cursor="pointer";
    summary.innerHTML=`🤝 Cooperativo da semana: <b>${doneCount}/${game.career.coop.length}</b> concluídas • <span style="color:#2e9e5b">clique para ver</span>`;
    summary.onclick=()=> togglePanel("coopPanel");
    c.appendChild(summary);
  }
  for (const q of QUESTS) {
    const prog = Math.min(q.need, game.self.stats[q.stat] || 0);
    const done = prog >= q.need;
    const claimed = (game.self.claimedQuests || []).includes(q.id);
    const row = document.createElement("div");
    row.className = `questCard${claimed ? " claimed" : ""}`;
    row.innerHTML = `
      <div class="questTop"><h4>${claimed ? checkIco(13) : done ? "🎁" : "📌"} ${q.title}</h4>
      <span class="reward">${coinIco()} ${q.reward} • ${starIco()} ${q.xp} ${SKILLS[q.skill]?.icon || ""}</span></div>
      <div class="questDesc">${q.desc}</div>
      <div class="progress"><div style="width:${(prog / q.need) * 100}%"></div></div>
      <div class="questBottom"><span>${prog}/${q.need}</span>
      ${claimed ? `<span class="doneTag">Concluída</span>` : `<button class="btn small ${done ? "primary" : "secondary"}" ${done ? "" : "disabled"} data-quest="${q.id}">${done ? "Resgatar recompensa" : "Em andamento"}</button>`}</div>`;
    c.appendChild(row);
  }
  c.querySelectorAll("[data-quest]").forEach((b) => {
    b.onclick = () => { commands.interact("claimQuest", { questId: b.dataset.quest }); sfx("buy"); };
  });
  renderChainsExtra(c);
}

// ---------------- COMUNIDADE ----------------
export function renderCommunity() {
  const c = $("communityContent");
  if (!c) return;
  c.innerHTML = `<p class="hintLine">Projetos comunitários são compartilhados: todo mundo contribui e todos veem a cidade mudar.</p>`;
  const prog = game.world.communityProgress || {};
  for (const [id, p] of Object.entries(COMMUNITY_PROJECTS)) {
    const value = prog[id] || 0;
    const done = value >= p.goal;
    const row = document.createElement("div");
    row.className = `questCard${done ? " claimed" : ""}`;
    row.innerHTML = `
      <div class="questTop"><h4>${p.icon} ${p.name} ${done ? checkIco(13) : ""}</h4><span class="reward">${value}/${p.goal} ${coinIco()}</span></div>
      <div class="questDesc">${p.desc}</div>
      <div class="progress"><div style="width:${Math.min(100, (value / p.goal) * 100)}%"></div></div>
      <div class="questBottom"><span>${done ? "Projeto concluído!" : "Contribua com ouros"}</span>
      ${done ? "" : `<span class="donateBtns">
        <button class="btn small secondary" data-donate="${id}" data-amount="50">+50</button>
        <button class="btn small secondary" data-donate="${id}" data-amount="100">+100</button>
        <button class="btn small primary" data-donate="${id}" data-amount="250">+250</button>
      </span>`}</div>`;
    c.appendChild(row);
  }
  c.querySelectorAll("[data-donate]").forEach((b) => {
    b.onclick = () => { commands.interact("donate", { project: b.dataset.donate, amount: Number(b.dataset.amount) }); sfx("buy"); };
  });
}

// ---------------- SOCIAL / NPC ----------------
export function renderSocial() {
  const c = $("socialContent");
  if (!c) return;
  // família no topo
  const soc = game.social;
  if (soc.family) {
    const f = soc.family;
    c.innerHTML = `<div class="childBadge">Bebê: ${f.kidName} — ${f.trait} • estágio ${f.stage} • desde dia ${f.sinceDay}</div>`;
  } else c.innerHTML = "";
  c.innerHTML += `<h4>Jogadores no mundo</h4>`;
  const selfRow = document.createElement("div");
  selfRow.className = "shopItem";
  selfRow.innerHTML = `<div class="shopInfo"><b>${game.isAccount ? "★" : "•"} ${game.username} (você)</b><div class="sub">Sala ${game.roomCode} • ${game.isHost ? "Anfitrião" : "Convidado"} • ${game.isAccount ? "conta salva" : "visitante (progresso não salvo)"}</div></div>`;
  c.appendChild(selfRow);
  for (const p of game.players.values()) {
    if (p.id === game.selfId) continue;
    const row = document.createElement("div");
    row.className = "shopItem";
    row.innerHTML = `<div class="shopInfo"><b>${p.account ? "★" : "•"} ${p.username}</b><div class="sub">Nv ${p.level?.farming || 1} agricultura • ${p.animals || 0} animais</div></div>`;
    c.appendChild(row);
  }
  c.insertAdjacentHTML("beforeend", `<h4 style="margin-top:14px">Moradores e amizades</h4>`);
  for (const npc of ALL_NPCS) {
    const pts = game.self.friendship[npc.id] || 0;
    const rel = soc.relationships?.[npc.id];
    const stageLabel = rel ? `${rel.icon} ${rel.stageLabel}` : "";
    const hearts = Math.round((pts / FRIENDSHIP.MAX) * 5);
    const row = document.createElement("div");
    row.className = "shopItem";
    // avatar mini (usa portrait pequeno)
    const avatarId = `mini-${npc.id}`;
    row.innerHTML = `<div style="display:flex;gap:8px;align-items:center;flex:1"><canvas id="${avatarId}" width="56" height="56" style="width:56px;height:56px;image-rendering:pixelated;border:1.5px solid #c9a06a;border-radius:8px;background:#fff8dc;flex-shrink:0"></canvas><div class="shopInfo"><b>${npc.name} ${stageLabel? "• "+stageLabel:""}</b><div class="sub">${npc.role} • <span class="heartsRow" title="${pts}/${FRIENDSHIP.MAX}"><span style="color:#c9564a">${"★".repeat(hearts)}</span><span style="opacity:.3">${"★".repeat(5 - hearts)}</span></span> ${pts}/${FRIENDSHIP.MAX}</div></div></div>
      <button class="btn small secondary">Conversar</button>`;
    // desenha avatar pequeno usando characterFrames importado
    try{
      const cv = row.querySelector(`#${avatarId}`);
      const small = npcPortrait(npc, 56, { seasonIndex: game.world.seasonIndex || 0, plain: true });
      const g = cv.getContext("2d");
      g.imageSmoothingEnabled = false;
      g.drawImage(small, 0, 0, cv.width, cv.height);
    }catch(e){}
    row.querySelector("button").onclick = () => openNpc(npc.id);
    c.appendChild(row);
  }
  // botão casas
  const houseBtn=document.createElement("button"); houseBtn.className="btn small primary"; houseBtn.style.marginTop="10px"; houseBtn.textContent="Casas & Família";
  houseBtn.onclick=()=> togglePanel("housePanel");
  c.appendChild(houseBtn);
}

export function openNpc(id) {
  const npc = NPC_BY_ID[id] || ALL_NPCS.find((n)=>n.id===id);
  if (!npc) return;
  game.currentNpc = id;
  const pos = npcPos(npc);
  const dialogs = NPC_DIALOGS[id] || ["Olá!"];
  const line = dialogs[Math.floor(Math.random() * dialogs.length)].replaceAll("{name}", game.username);
  $("npcName").textContent = `${npc.name} — ${npc.role}`;
  const npcAvatarWrap = $("npcAvatar");
  npcAvatarWrap.title = npc.role;
  const avatarEl = $("npcAvatar");
  avatarEl.style.background = "transparent";
  avatarEl.innerHTML = "";
  // retrato grande com variação sazonal
  const seasonIdx = (window.__seasonOverride != null ? window.__seasonOverride : (game.world.seasonIndex || 0));
  const portraitSize = 112;
  const portraitCanvas = npcPortrait(npc, portraitSize, { seasonIndex: seasonIdx });
  // estação como atributo para tooltip
  portraitCanvas.title = ["Primavera","Verão","Outono","Inverno"][seasonIdx] || "";
  portraitCanvas.className = "npcPortraitCanvas";
  avatarEl.appendChild(portraitCanvas);
  // estação aparece como etiqueta ao lado do nome (não sobrepõe o retrato)
  const seasonName = ["Primavera", "Verão", "Outono", "Inverno"][seasonIdx] || "";
  const seasonChip = document.createElement("span");
  seasonChip.className = "seasonChip";
  seasonChip.textContent = seasonName;
  $("npcName").appendChild(seasonChip);
  $("npcDialog").textContent = `“${line}”`;
  $("npcMeta").innerHTML = `<b>${pos.label}</b> • ${npc.personality}<br><span class="story">${npc.story}</span>`;
  $("npcLikes").textContent = `Gosta: ${npc.likes.map((l) => itemMeta(l).name).join(", ")} • Não gosta: ${npc.dislikes.map((l) => itemMeta(l).name).join(", ")}`;
  const pts = game.self.friendship[id] || 0;
  $("npcFriend").innerHTML = `<span>Amizade ${pts}/${FRIENDSHIP.MAX}</span><div class="bar"><div style="width:${pts}%"></div></div>`;
  const gift = $("giftSelect");
  gift.innerHTML = "";
  const items = Object.entries(game.self.inventory || {}).filter(([, q]) => q > 0);
  if (!items.length) {
    gift.innerHTML = `<option value="">Sem itens para presentear</option>`;
  }
  for (const [item, qty] of items) {
    const o = document.createElement("option");
    o.value = item;
    o.textContent = `${itemMeta(item).name} (x${qty})`;
    gift.appendChild(o);
  }
  $("btnGift").onclick = () => {
    const item = gift.value;
    if (!item) return notify("Escolha um item para presentear.", "error");
    commands.interact("gift", { npcId: id, item });
    sfx("buy");
  };
  $("btnTalk").onclick = () => {
    commands.talk(id);
    const again = dialogs[Math.floor(Math.random() * dialogs.length)].replaceAll("{name}", game.username);
    $("npcDialog").textContent = `“${again}”`;
    sfx("chat");
  };
  // escolhas de diálogo
  const dialogWrap=document.getElementById("npcDialog");
  let choiceBox=document.getElementById("npcChoices");
  if(!choiceBox){
    choiceBox=document.createElement("div"); choiceBox.id="npcChoices"; choiceBox.style.display="flex"; choiceBox.style.flexWrap="wrap"; choiceBox.style.gap="6px"; choiceBox.style.marginTop="8px";
    dialogWrap.parentNode.insertBefore(choiceBox, dialogWrap.nextSibling);
  }
  choiceBox.innerHTML="";
  const relStage = game.social.relationships?.[id]?.stage || "stranger";
  const isRom = ROMANCEABLE.has(id);
  const pool = isRom && ["dating","engaged","married"].includes(relStage) ? DIALOG_CHOICES.date : isRom ? DIALOG_CHOICES.romantic : DIALOG_CHOICES.talk;
  for(const ch of pool.slice(0,4)){
    const btn=document.createElement("button"); btn.className="btn small secondary"; btn.textContent=ch.label;
    btn.onclick=()=> commands.interact("dialogChoice",{npcId:id, choiceId: ch.id, delta: ch.delta});
    choiceBox.appendChild(btn);
  }
  // ações românticas
  let romBox=document.getElementById("npcRomance");
  if(!romBox){ romBox=document.createElement("div"); romBox.id="npcRomance"; romBox.style.display="flex"; romBox.style.flexWrap="wrap"; romBox.style.gap="6px"; romBox.style.marginTop="8px"; choiceBox.parentNode.insertBefore(romBox, choiceBox.nextSibling); }
  romBox.innerHTML="";
  const mk=(txt, cb)=>{ const b=document.createElement("button"); b.className="btn small primary"; b.textContent=txt; b.onclick=cb; romBox.appendChild(b); };
  mk("🤗 Abraçar", ()=> commands.interact("hug",{npcId:id}));
  if(ROMANCEABLE.has(id)){
    const pts=game.self.friendship[id]||0;
    const stage=game.social.relationships?.[id]?.stage||"stranger";
    if(stage==="stranger"||stage==="friend"||stage==="close"||stage==="crush"){
      mk(`💕 Pedir em namoro (${pts}/65)`, ()=> commands.interact("proposeDating",{npcId:id}));
    } else if(stage==="dating"){
      mk(`💍 Pedir em noivado (${pts}/88)`, ()=> commands.interact("proposeMarriage",{npcId:id}));
    } else if(stage==="engaged"){
      mk(`💒 Casar na Igreja`, ()=> commands.interact("confirmMarriage",{npcId:id}));
    } else if(stage==="married"){
      mk(`💋 Beijar`, ()=> commands.interact("kiss",{npcId:id}));
    }
  }
  $("btnNpcShop").style.display = ["ana", "carlos", "joao"].includes(id) ? "inline-block" : "none";
  $("btnNpcShop").onclick = () => { togglePanel("shopPanel"); renderShop(id === "carlos" ? "tools" : "seeds"); };
  togglePanel("npcPanel");
}

// ---------------- MAPA ----------------
export function renderMap() {
  const c = $("miniMap");
  if (!c) return;
  try { renderMiniMap(c); } catch (e) { console.warn("minimap", e); }
  const list = $("mapPlayers");
  if (list) {
    list.innerHTML = "";
    for (const p of game.players.values()) {
      const chip = document.createElement("span");
      chip.className = "mapLegendChip";
      chip.textContent = `${p.username}${p.id === game.selfId ? " (você)" : ""}`;
      chip.style.borderColor = p.id === game.selfId ? "#e8b44a" : "#b9d6a0";
      list.appendChild(chip);
    }
  }
}

export function addChat(entry) {
  const log = $("chatLog");
  if (!log) return;
  const div = document.createElement("div");
  div.className = "chatLine";
  const name = document.createElement("b");
  name.textContent = entry.username + ": ";
  name.style.color = entry.username === game.username ? "#2e7d32" : "#8e5a2b";
  const text = document.createElement("span");
  text.textContent = entry.msg;
  div.appendChild(name);
  div.appendChild(text);
  log.appendChild(div);
  while (log.children.length > 50) log.firstElementChild.remove();
  log.scrollTop = log.scrollHeight;
  if (entry.username !== game.username) sfx("chat");
}

export function updatePlayerList() {
  const el = $("playerList");
  if (!el) return;
  el.innerHTML = "";
  const me = document.createElement("div");
  me.className = "playerChip self";
  me.textContent = `${game.isAccount ? "★" : "🧑"} ${game.username}`;
  el.appendChild(me);
  for (const p of game.players.values()) {
    if (p.id === game.selfId) continue;
    const d = document.createElement("div");
    d.className = "playerChip";
    d.textContent = `👤 ${p.username}`;
    el.appendChild(d);
  }
}

// ---------------- DICAS DE INTERAÇÃO ----------------
export function updateInteractHint() {
  const hint = $("interactHint");
  if (!hint) return;
  let text = "";
  const npc = nearbyNpc(2.6);
  const b = nearbyBuilding();
  if (npc) text = `💬 <b>${npc.name}</b> — clique nele ou pressione <b>F</b>`;
  else if (b) {
    if (["mercado", "carpintaria", "ferraria"].includes(b.id)) text = `${b.icon} <b>${b.name}</b> — <b>F</b> para abrir a loja`;
    else if (b.id === "casa_player") text = `🏠 <b>Sua casa</b> — <b>F</b> para dormir`;
    else text = `${b.icon} <b>${b.name}</b>`;
  } else if (isNearWater()) text = "🎣 Água por perto — selecione a vara e clique, ou <b>F</b>";
  else if (isNearForest()) text = "🌲 Floresta — selecione o machado e clique";
  else if (isNearStone()) text = "⛏️ Rochas — selecione a picareta e clique";
  hint.innerHTML = text;
  hint.style.display = text ? "block" : "none";
}

// ---------------- PAINÉIS ----------------
let currentPanel = null;

export function togglePanel(id) {
  const el = $(id);
  if (!el) return;
  if (currentPanel === id && el.classList.contains("open")) {
    closePanels();
    return;
  }
  closePanels(true);
  el.classList.add("open");
  currentPanel = id;
  if (id === "inventoryPanel") renderInventory();
  if (id === "shopPanel") renderShop(game.shopTab);
  if (id === "questPanel") renderQuests();
  if (id === "communityPanel") renderCommunity();
  if (id === "socialPanel") renderSocial();
  if (id === "buildPanel") renderBuild();
  if (id === "mapPanel") renderMap();
  if (id === "jobPanel") renderJobs();
  if (id === "kitchenPanel") renderKitchen();
  if (id === "coopPanel") renderCoop();
  if (id === "travelPanel") renderTravel();
  if (id === "shiftPanel") renderShiftPanel();
  if (id === "bankPanel") renderBank();
  if (id === "housePanel") { requestHouseInfo(); renderHouses(); }
  sfx("open");
}

export function closePanels(silent = false) {
  document.querySelectorAll(".panel.open").forEach((p) => p.classList.remove("open"));
  currentPanel = null;
  if (!silent) sfx("close");
}

export function isPanelOpen() {
  return !!document.querySelector(".panel.open");
}

export function panelIs(id) {
  return currentPanel === id;
}

// ---------------- CONFIGURAÇÕES ----------------
export function refreshAll() {
  rebuildHotbar();
  updateHotbar();
  updateHUD();
  updatePlayerList();
  renderInventory();
  renderQuests();
  renderCommunity();
  renderSocial();
  renderBuild();
  if (panelIs("shopPanel")) renderShop(game.shopTab);
  if (panelIs("mapPanel")) renderMap();
}


// ---------------- COZINHA ----------------
export function renderKitchen(){
  const c=$("kitchenContent"); if(!c) return;
  c.innerHTML="";
  const insideKitchen = ["casa_player","taverna"].includes(game.indoors);
  const banner=document.createElement("div");
  banner.className="hintLine";
  banner.innerHTML= insideKitchen
    ? `👩‍🍳 Você está na cozinha! Escolha uma receita e clique em <b>Cozinhar</b>.`
    : `⚠️ Entre na <b>sua casa</b> (F) ou na <b>Taverna</b> para cozinhar. Você pode ver as receitas mesmo de fora.`;
  c.appendChild(banner);
  const lvl = game.career?.cookingLevel || game.self.level.cooking || 1;
  const lvlInfo=document.createElement("div");
  lvlInfo.className="statsLine";
  lvlInfo.textContent=`🍳 Nível de Culinária: ${lvl} • Receitas: ${RECIPES.length} • Refeições feitas: ${game.self.stats.cooked||0}`;
  c.appendChild(lvlInfo);

  for(const r of RECIPES){
    const need = Object.entries(r.ingredients);
    const locked = lvl < r.skill;
    const canMake = !locked && need.every(([it,q])=> (game.self.inventory[it]||0)>=q);
    const row=document.createElement("div");
    row.className=`recipeCard ${locked?"locked": canMake?"canCook":""}`;
    const ingHtml = need.map(([it,q])=>{
      const have=game.self.inventory[it]||0; const meta=itemMeta(it);
      return `<span class="needChip ${have>=q?"have":"missing"}">${meta.icon} ${meta.name} ${have}/${q}</span>`;
    }).join("");
    row.innerHTML=`<div class="recipeMain"><b>${r.icon} ${r.name}</b> ${locked?`<span class="agendaTag off">Nv ${r.skill}</span>`:""}<div class="sub">${r.desc} • Vende por ~$${r.sell} • +${r.xp} XP</div><div class="recipeNeed">${ingHtml}</div><div class="sub" style="margin-top:4px">Estação: ${r.station=== "oven"?"🔥 Forno": r.station==="pot"?"🍲 Panela":"🍳 Fogão"}</div></div><div class="recipeBuy"><button class="btn small ${canMake && insideKitchen?"primary":locked?"secondary":"secondary"}" ${(!canMake || !insideKitchen || locked)?"disabled":""} data-cook="${r.id}">${locked?`Nv ${r.skill}`:"Cozinhar"}</button><button class="btn small secondary" ${!game.self.inventory[r.id]?"disabled":""} data-eat="${r.id}">Comer</button></div>`;
    c.appendChild(row);
  }
  c.querySelectorAll("[data-cook]").forEach(b=> b.onclick=()=> { commands.interact("cook",{recipeId:b.dataset.cook}); sfx("buy"); });
  c.querySelectorAll("[data-eat]").forEach(b=> b.onclick=()=> { commands.interact("eat",{recipeId:b.dataset.eat}); sfx("levelup"); });
}

// ---------------- EMPREGOS ----------------
export function renderJobs(){
  const c=$("jobContent"); if(!c) return;
  c.innerHTML="";
  const cur = game.job;
  if(cur && cur.job){
    const card=document.createElement("div");
    card.className="jobCard active";
    card.innerHTML=`<div class="jobTop"><h4>${jobIcon(cur.job.id)} ${cur.job.name} — ${cur.job.employer}</h4><span class="agendaTag work">ATUAL</span></div><div class="jobMeta">Salário <b>${coinIco()} ${cur.wagePerHour}/h</b> • Turno ${String(Math.floor(cur.shift.start/60)).padStart(2,"0")}:${String(cur.shift.start%60).padStart(2,"0")}–${String(Math.floor(cur.shift.end/60)).padStart(2,"0")}:${String(cur.shift.end%60).padStart(2,"0")} • ${cur.isVacation ? "Férias hoje" : cur.isWorkday ? (cur.inShiftWindow ? "Em horário de turno" : "Hoje é dia de trabalho") : "Folga hoje"}</div><div class="jobSalary">Turnos feitos: ${cur.shiftsWorked||0} • Total ganho: $${cur.totalEarned||0} • Reputação ${cur.reputation||50}/100</div><div class="panelActions"><button class="btn small primary" id="btnStartShift2" ${!cur.inShiftWindow || cur.isVacation || !cur.isWorkday?"disabled":""}>▶ Começar turno</button><button class="btn small danger" id="btnQuitJob">Pedir demissão</button></div>`;
    c.appendChild(card);
    setTimeout(()=>{
      const b1=document.getElementById("btnStartShift2"); if(b1) b1.onclick=()=> window.startShift?window.startShift():commands.interact("startShift",{});
      const b2=document.getElementById("btnQuitJob"); if(b2) b2.onclick=()=> { if(confirm("Pedir demissão? Você perderá a escala e os benefícios.")) commands.interact("quitJob",{}); };
    },0);
  }

  const curJobId = cur?.job?.id || null;
  c.insertAdjacentHTML("beforeend", `<div class="sectionTitle">${cur?.job ? "Outras áreas" : "Vagas disponíveis"}</div><p class="hintLine">Vá até o local (mercado, carpintaria, celeiro, píer, taverna, ferraria) e candidate-se. Você pode trabalhar no que quiser: trocar de área a qualquer momento não custa nada, e cada uma tem salário, escala e tarefa próprios.</p>`);
  for(const [id,job] of Object.entries(JOBS)){
    if(cur?.job?.id===id) continue;
    const days = ["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"];
    const wdHtml = [0,1,2,3,4,5,6].map(i=> `<span class="dayPill ${job.workdays.includes(i)?"workday":""}">${days[i]}</span>`).join("");
    const row=document.createElement("div");
    row.className="jobCard";
    row.innerHTML=`<div class="jobTop"><h4>${jobIcon(job.id)} ${job.name}</h4><span class="price">${coinIco()} ${job.wagePerHour}/h</span></div><div class="jobMeta">${job.desc}<br>${iconTag("casa", 14)} ${job.employer} • ${iconTag("clock", 14)} ${String(Math.floor(job.shift.start/60)).padStart(2,"0")}:${String(job.shift.start%60).padStart(2,"0")}–${String(Math.floor(job.shift.end/60)).padStart(2,"0")}:${String(job.shift.end%60).padStart(2,"0")} • <b>${job.workdays.map(i=>days[i]).join(", ")}</b><br>${job.bonus}</div><div class="jobSchedule">${wdHtml}</div><div class="jobMeta" style="margin-top:4px">Férias nos dias: ${Object.entries(job.vacationDays).map(([s,days])=> SEASONS[s]+": "+days.join(",")).join(" • ")}</div><div class="panelActions"><button class="btn small primary" data-apply="${id}">${curJobId === id ? "Empregado" : curJobId ? "Trocar para esta área" : "Candidatar-se"}</button></div>`;
    c.appendChild(row);
  }
  c.querySelectorAll("[data-apply]").forEach(b=> b.onclick=()=> { commands.interact("applyJob",{jobId:b.dataset.apply}); sfx("buy"); });
}

// ---------------- VIAGENS ----------------
export function renderTravel(){
  const c=$("travelContent"); if(!c) return;
  c.innerHTML=`<p class="hintLine">Libere rotas com projetos comunitários e embarque no píer ou no aeródromo.</p>`;
  const prog=game.world.communityProgress||{};
  for(const [tid, tr] of Object.entries(TRANSPORT)){
    const done = (prog[tr.project]||0) >= (COMMUNITY_PROJECTS[tr.project]?.goal||9999);
    const cost = tr.price?` • Passagem $${tr.price}`:" • Grátis";
    const card=document.createElement("div");
    card.className=`travelCard ${done?"":"locked"}`;
    const dests = tr.destinations.map(d=> `${REGION_DEFS[d]?.icon||"📍"} ${REGION_DEFS[d]?.name||d}`).join(", ");
    card.innerHTML=`<div class="questTop"><h4>${tr.icon} ${tr.name}</h4><span class="reward">${done ? checkIco(13) : "Bloqueado"}</span></div><div class="questDesc">${tr.desc}<br>Destinos: ${dests}${cost}<br>Projeto: ${COMMUNITY_PROJECTS[tr.project]?.name||tr.project} (${prog[tr.project]||0}/${COMMUNITY_PROJECTS[tr.project]?.goal||"?"})<br>Embarque: ${(BUILDINGS.find(b=>b.id===tr.originBuilding)?.name)||tr.originBuilding}</div><div class="panelActions">${tr.destinations.map(d=> `<button class="btn small ${done?"primary":"secondary"}" ${done?"":"disabled"} data-travel="${d}">${REGION_DEFS[d]?.icon||"✈️"} Ir para ${REGION_DEFS[d]?.name||d}</button>`).join("")} ${game.region!=="vale"?`<button class="btn small secondary" data-travel="vale">🏠 Voltar ao Vale</button>`:""}</div>`;
    c.appendChild(card);
  }
  // lista de regiões visitáveis
  for(const [id,def] of Object.entries(REGION_DEFS)){
    if(id==="vale") continue;
    const doneBtn = (prog[def.portal==="barco"?"porto":"estacao"]||0) >= (COMMUNITY_PROJECTS[def.portal==="barco"?"porto":"estacao"]?.goal||9999);
    if(!doneBtn) continue;
  }
  c.querySelectorAll("[data-travel]").forEach(b=> b.onclick=()=> { commands.interact("travel",{to:b.dataset.travel}); togglePanel("travelPanel"); sfx("open"); });
}

// ---------------- COOPERATIVO ----------------
export function renderCoop(){
  const c=$("coopContent"); if(!c) return;
  const progList = game.career?.coop || [];
  c.innerHTML=`<p class="hintLine">Metas da semana em equipe: todo mundo contribui, todos ganham. A cada segunda o quadro renova.</p>`;
  if(!progList.length) c.innerHTML+=`<p style="opacity:.6;font-size:13px">Carregando...</p>`;
  for(const m of progList){
    const pct=Math.round((m.progress/m.goal)*100);
    const done=m.completed;
    const row=document.createElement("div");
    row.className=`questCard ${done?"claimed":""}`;
    row.innerHTML=`<div class="questTop"><h4>${m.icon} ${m.name} ${done ? checkIco(13) : ""}</h4><span class="reward">${m.progress}/${m.goal} • $${m.reward}</span></div><div class="questDesc">${m.desc}</div><div class="progress"><div style="width:${pct}%"></div></div><div class="questBottom"><span>${done?"Concluída! Recompensa paga a todos.":"Progresso da sala nesta semana"}</span><span class="reward">${pct}%</span></div>`;
    c.appendChild(row);
  }
}

// ---------------- MISSÕES EM CADEIA (estendido nas quests) ----------------
export function renderChainsExtra(container){
  const chains = game.career?.chains || [];
  if(!chains.length) return;
  const wrap=document.createElement("div");
  wrap.innerHTML=`<h4 style="margin:12px 0 6px">🗺️ Jornadas — missões em cadeia</h4><p class="hintLine">Converse com quem indicou, complete cada etapa e resgate uma recompensa grande.</p>`;
  container.appendChild(wrap);
  for(const chain of chains){
    const done=chain.claimed, allDone=chain.allDone;
    const card=document.createElement("div");
    card.className=`questCard ${done?"claimed":""}`;
    const stepsHtml = chain.steps.map((s,i)=>{
      const cur = Math.min(s.current, s.need);
      const stepClass = s.done ? checkIco(12) : (i === chain.currentStep ? "▶" : "○");
      const barW = Math.round((cur/s.need)*100);
      return `<div style="display:flex;justify-content:space-between;gap:8px;align-items:center;margin:4px 0"><span style="font-size:11.5px;flex:1">${stepClass} ${s.desc}: <b>${cur}/${s.need}</b></span><span style="min-width:54px;text-align:right;font-size:10px;color:${s.done?"#2e9e5b":"#8a7a60"}">${s.done?"feito":`${barW}%`}</span></div><div class="progress" style="height:6px;margin:2px 0 4px"><div style="width:${barW}%"></div></div>`;
    }).join("");
    card.innerHTML=`<div class="questTop"><h4>${chain.icon} ${chain.title} ${done ? checkIco(13) : ""}</h4><span class="reward">${coinIco()} ${chain.reward.gold} • ${starIco()} ${chain.reward.xp}</span></div><div class="questDesc">${chain.desc} • NPC: ${(NPC_BY_ID[chain.npc]?.name)||chain.npc}</div>${stepsHtml}<div class="questBottom"><span>${done?"Concluída": allDone?"Pronta para resgatar":`Etapa ${chain.currentStep+1}/${chain.steps.length}`}</span>${done?`<span class="doneTag">Resgatada</span>`: `<button class="btn small ${allDone?"primary":"secondary"}" ${allDone?"":"disabled"} data-chain="${chain.id}">${allDone?"Resgatar":"Em andamento"}</button>`}</div>`;
    container.appendChild(card);
  }
  container.querySelectorAll("[data-chain]").forEach(b=> b.onclick=()=> { commands.interact("claimChain",{chainId:b.dataset.chain}); sfx("buy"); });
}

function renderShiftPanel(){
  const c=$("shiftContent"); if(!c) return;
  if(!game.shift){
    c.innerHTML=`<p class="hintLine">Nenhum turno ativo. Abra o painel de Empregos (O) ou a agenda no canto superior para começar quando for dia de trabalho e estiver no horário.</p>`;
    return;
  }
  c.innerHTML=`<p>Turno em andamento — feche este painel e use a sobreposição de trabalho.</p><button class="btn primary" id="btnOpenShiftOverlay">Abrir turno</button>`;
  setTimeout(()=> { const b=document.getElementById("btnOpenShiftOverlay"); if(b) b.onclick=()=> window.openShiftOverlay && window.openShiftOverlay(); },0);
}

export function getAgendaRender(){ renderAgenda(); }


// ---------------- BANCO ----------------
export function renderBank(){
  const c=$("bankContent"); if(!c) return;
  const b=game.bank || {balance:0, cash: game.self.gold||0, loan:null, history:[]};
  const ownedLoan = b.loan;
  c.innerHTML="";
  const grid=document.createElement("div"); grid.className="bankGrid";
  grid.innerHTML=`<div class="bankCard"><h4>${coinIco(16)} Carteira</h4><div style="font-size:22px;font-weight:900">$${game.self.gold||0}</div><div class="sub" style="font-size:11px;color:#8a7a60">Dinheiro com você</div></div><div class="bankCard"><h4>🏦 Saldo bancário</h4><div style="font-size:22px;font-weight:900">$${b.balance||0}</div><div class="sub" style="font-size:11px;color:#8a7a60">Seguro, rende sem risco</div></div>`;
  c.appendChild(grid);

  const actions=document.createElement("div");
  actions.innerHTML=`
    <div class="bankRow"><input id="bankAmount" type="number" min="1" max="50000" placeholder="Valor em $ (ex: 200)" value="200"><button class="btn small primary" id="btnDeposit">Depositar</button><button class="btn small secondary" id="btnWithdraw">Sacar</button></div>
    <div class="bankRow"><input id="bankTransferTo" placeholder="Enviar para (nome do jogador)" style="flex:1.2"><input id="bankTransferAmount" type="number" placeholder="$" style="max-width:90px"><button class="btn small primary" id="btnTransfer">Enviar</button></div>
  `;
  c.appendChild(actions);
  if(ownedLoan){
    const loanDiv=document.createElement("div");
    loanDiv.className="bankCard";
    loanDiv.style.marginTop="8px";
    loanDiv.innerHTML=`<h4>📄 Empréstimo ativo</h4><div>Principal: $${ownedLoan.principal} • Restante: <b>$${ownedLoan.balance}</b> • Juros ${ownedLoan.rate}%/estação</div><div class="bankRow" style="margin-top:8px"><input id="bankPayAmount" type="number" placeholder="Pagar (cash)" value="${Math.min(200, ownedLoan.balance)}"><button class="btn small primary" id="btnPayLoan">Pagar</button><button class="btn small secondary" id="btnPayLoanBank">Pagar com saldo</button></div>`;
    c.appendChild(loanDiv);
  } else {
    const loanDiv=document.createElement("div");
    loanDiv.className="bankCard"; loanDiv.style.marginTop="8px";
    loanDiv.innerHTML=`<h4>🏦 Solicitar empréstimo</h4><div class="sub">Até $${BANK.maxLoan} • juros ${BANK.loanInterestPct}% por estação • pague em até 14 dias sem multa extra.</div><div class="bankRow" style="margin-top:8px"><input id="bankLoanAmount" type="number" min="200" max="${BANK.maxLoan}" value="800"><button class="btn small primary" id="btnLoan">Pegar $${BANK.maxLoan} máx</button></div>`;
    c.appendChild(loanDiv);
  }
  const hist=document.createElement("div"); hist.className="bankHistory";
  const hlist=(b.history||[]).slice(-18).reverse();
  hist.innerHTML = hlist.length ? hlist.map(h=>`<div>• ${new Date(h.at).toLocaleTimeString("pt-BR")} — ${h.text}</div>`).join("") : `<div style="opacity:.6">Nenhuma movimentação ainda.</div>`;
  c.appendChild(hist);

  setTimeout(()=>{
    $("btnDeposit")&& ($("btnDeposit").onclick=()=>{ const v=parseInt($("bankAmount").value,10); if(v) commands.interact("bankDeposit",{amount:v}); });
    $("btnWithdraw")&& ($("btnWithdraw").onclick=()=>{ const v=parseInt($("bankAmount").value,10); if(v) commands.interact("bankWithdraw",{amount:v}); });
    $("btnTransfer")&& ($("btnTransfer").onclick=()=>{ const to=$("bankTransferTo").value.trim(); const v=parseInt($("bankTransferAmount").value,10); if(to&&v) commands.interact("bankTransfer",{to, amount:v}); });
    $("btnLoan")&& ($("btnLoan").onclick=()=>{ const v=parseInt($("bankLoanAmount").value,10); if(v) commands.interact("bankLoan",{amount:v}); });
    $("btnPayLoan")&& ($("btnPayLoan").onclick=()=>{ const v=parseInt($("bankPayAmount").value,10); if(v) commands.interact("bankPayLoan",{amount:v, from:"cash"}); });
    $("btnPayLoanBank")&& ($("btnPayLoanBank").onclick=()=>{ const v=parseInt($("bankPayAmount").value,10); if(v) commands.interact("bankPayLoan",{amount:v, from:"bank"}); });
  },0);
}

// ---------------- CASAS & MÓVEIS ----------------
let furniturePick = null;
export function startFurniturePlace(itemId){
  furniturePick=itemId;
  $("furnitureHud")?.classList.add("show");
  notify(`Clique dentro de casa para colocar ${itemId}. ESC cancela.`, "info");
}
export function cancelFurniture(){ furniturePick=null; $("furnitureHud")?.classList.remove("show"); }
export function hasFurniturePick(){ return !!furniturePick; }
export function consumeFurniturePick(x,y){
  if(!furniturePick) return false;
  commands.interact("placeFurniture",{itemId: furniturePick, x, y});
  cancelFurniture();
  return true;
}

// ---------------- MORADIA / CASAS DOS JOGADORES ----------------
function initHouseUI() {
  const allow = $("pmAllow"), deny = $("pmDeny");
  if (allow) allow.onclick = () => answerHouseRequest(true);
  if (deny) deny.onclick = () => answerHouseRequest(false);
}

export function requestHouseInfo() {
  commands.interact("houseInfo", {});
}

export function openHouseRequest(req) {
  game.pendingHouseRequest = req;
  const modal = $("houseRequestModal");
  if (!modal) return;
  const kind = $("pmKind"), text = $("pmText");
  if (kind) kind.textContent = req.kind === "chest" ? "Pedido de baú" : "Pedido de visita";
  if (text) {
    text.textContent = req.kind === "chest"
      ? `${req.from} quer abrir o baú da sua casa. Permitir?`
      : `${req.from} quer entrar na sua casa. Permitir?`;
  }
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  sfx("open");
}

export function answerHouseRequest(allow) {
  const modal = $("houseRequestModal");
  if (modal) { modal.classList.remove("open"); modal.setAttribute("aria-hidden", "true"); }
  const req = game.pendingHouseRequest;
  game.pendingHouseRequest = null;
  if (req) commands.interact("answerHouse", { requestId: req.id, allow: !!allow });
  sfx(allow ? "levelup" : "close");
}

export function openChest(data) {
  game.openChest = data;
  renderChest();
  togglePanel("chestPanel");
}

function chestRows(items, dir) {
  const rows = Object.entries(items || {}).filter(([, qty]) => qty > 0);
  if (!rows.length) return `<div class="sub" style="opacity:.6;font-size:11px">vazio</div>`;
  return rows.map(([id, qty]) => {
    const meta = itemMeta(id);
    return `<div class="chestItem"><span>${meta.icon}</span><span>${meta.name}</span><span class="qty">${qty}</span>
      <button class="btn small ${dir === "deposit" ? "primary" : "secondary"}" data-chest="${id}" data-dir="${dir}" data-qty="1">${dir === "deposit" ? "Guardar" : "Pegar"}</button></div>`;
  }).join("");
}

export function renderChest() {
  const c = $("chestContent");
  if (!c) return;
  const d = game.openChest;
  if (!d) { c.innerHTML = `<p class="hintLine">Baú indisponível.</p>`; return; }
  const inv = {};
  for (const [id, qty] of Object.entries(game.self.inventory || {})) {
    if (TOOLS[id] || qty <= 0) continue;
    inv[id] = qty;
  }
  c.innerHTML = `<p class="hintLine">${d.label} · o baú é privado: só o dono e quem ele liberar mexe aqui.</p>
    <div class="chestCols">
      <div class="chestCol"><h4>No baú</h4><div id="chestInside">${chestRows(d.items, "withdraw")}</div></div>
      <div class="chestCol"><h4>Sua mochila</h4><div id="chestBag">${chestRows(inv, "deposit")}</div></div>
    </div>`;
  c.querySelectorAll("[data-chest]").forEach((b) => {
    b.onclick = () => commands.interact("chestMove", {
      houseId: d.houseId, dir: b.dataset.dir, item: b.dataset.chest, qty: 1,
    });
  });
}

export function renderHouses(){
  const c=$("houseContent"); if(!c) return;
  const soc=game.social;
  c.innerHTML="";
  // ---- moradia do jogador ----
  const hi = game.houseInfo;
  const owns = (game.world.houses || []).find((h) => h.owner === game.username && !h.apartment);
  const apt = (game.world.houses || []).find((h) => h.owner === game.username && h.apartment);
  const card = document.createElement("div");
  card.className = "moradiaCard";
  const acesso = hi?.access ? Object.keys(hi.access) : [];
  card.innerHTML = `<h4>Minha moradia</h4>
    <div class="sub">${owns ? `Casa própria: ${owns.label || "sua casa"}` : "Você ainda não tem casa própria."}${
      apt ? ` · Apartamento alugado ($${hi?.rent ?? 30}/dia${hi?.debt ? ` · dívida $${hi.debt}` : ""})` : ""}</div>
    ${acesso.length ? `<div class="sub" style="margin-top:6px"><b>Quem pode entrar:</b> ${acesso.map((u) => `<span class="houseAccessRow"><span>${u}</span><button class="btn small secondary" data-revoke="${u}">remover</button></span>`).join(" ")}</div>` : ""}
    <div class="moradiaBtns">
      ${owns ? `<button class="btn small secondary" data-give="1">Dar minha casa a…</button>` : ""}
      ${owns ? `<button class="btn small primary" data-give-apartment="1">Construir casa para…</button>` : `<button class="btn small primary" data-build="1">Construir casa ($${hi?.buildCost?.gold ?? 1800})</button>`}
      ${apt ? `<button class="btn small primary" data-enter-apt="${apt.id}">Entrar no apartamento</button><button class="btn small secondary" data-leave-apt="1">Deixar o apartamento</button>` : `<button class="btn small secondary" data-rent="1">Alugar apartamento ($${hi?.rent ?? 30}/dia)</button>`}
    </div>`;
  c.appendChild(card);
  card.querySelectorAll("[data-revoke]").forEach((b) => b.onclick = () => {
    commands.interact("revokeAccess", { username: b.dataset.revoke });
    setTimeout(requestHouseInfo, 200);
  });
  card.querySelector("[data-rent]")?.addEventListener("click", () => commands.interact("rentApartment", {}));
  card.querySelector("[data-enter-apt]")?.addEventListener("click", (ev) => {
    commands.interact("enterHouse", { houseId: ev.currentTarget.dataset.enterApt });
    closePanels();
  });
  card.querySelector("[data-leave-apt]")?.addEventListener("click", () => commands.interact("leaveApartment", {}));
  card.querySelector("[data-build]")?.addEventListener("click", () => commands.interact("buildHouse", {}));
  const giveBtn = card.querySelector("[data-give-apartment]");
  if (giveBtn) giveBtn.onclick = () => {
    const who = prompt("Construir uma casa para qual jogador online? (nome exato)");
    if (who) commands.interact("buildHouse", { forUser: who.trim() });
  };
  const giveOwn = card.querySelector("[data-give]");
  if (giveOwn) giveOwn.onclick = () => {
    const who = prompt("Dar sua casa para qual jogador online? (você fica sem casa)");
    if (who) commands.interact("giveHouse", { toUser: who.trim() });
  };
  c.insertAdjacentHTML("beforeend", `<p class="hintLine">Visitas precisam da sua permissão para entrar e, de novo, para abrir o baú. Móveis são colocados dentro de casa (entrar e clicar).</p>`);
  const owned = new Set(soc.ownedHouses||[]);
  const cat = soc.houseCatalog || [];
  if(cat.length){
    const grid=document.createElement("div"); grid.className="houseCatalog";
    for(const h of cat){
      const isOwned=owned.has(h.id);
      const card=document.createElement("div"); card.className="houseCard"+(isOwned?" owned":"");
      card.innerHTML=`<div style="font-size:20px">${h.icon}</div><b>${h.name}</b><div class="sub">${h.desc}</div><div class="price" style="margin-top:6px">$${h.price}</div><button class="btn small ${isOwned?"secondary":"primary"}" ${isOwned?"disabled":""} data-house="${h.id}">${isOwned?"Já possui":"Comprar"}</button>`;
      grid.appendChild(card);
    }
    c.appendChild(grid);
    grid.querySelectorAll("[data-house]").forEach(b=> b.onclick=()=> commands.interact("buyHouse",{houseId:b.dataset.house}));
  }
  // família
  if(soc.family){
    const f=soc.family;
    const wrap=document.createElement("div"); wrap.className="bankCard"; wrap.style.marginTop="10px";
    wrap.innerHTML=`<h4>👶 Família</h4><div class="childBadge">${f.kidName} • ${f.trait} • ${f.stage}</div><div class="sub">Desde o dia ${f.sinceDay}</div>`;
    c.appendChild(wrap);
  } else if(Object.values(soc.relationships||{}).some(r=>r.stage==="married")){
    const btn=document.createElement("button"); btn.className="btn small primary"; btn.style.marginTop="8px"; btn.textContent="👶 Preparar quarto da criança ($800)";
    btn.onclick=()=> commands.interact("adoptKid",{});
    c.appendChild(btn);
  }
  // móveis
  const fcat=soc.furnitureCatalog||[];
  if(fcat.length){
    c.insertAdjacentHTML("beforeend", `<h4 style="margin:12px 0 6px">🪑 Móveis para casa</h4><p class="hintLine">Compre e clique no chão da sua casa para posicionar. Reembolso de 60% ao remover.</p>`);
    const grid2=document.createElement("div"); grid2.className="furnitureGrid";
    for(const f of fcat){
      const card=document.createElement("div"); card.className="furnCard";
      card.innerHTML=`<div style="font-size:22px">${f.icon}</div><b style="font-size:12px">${f.name}</b><div class="price" style="font-size:11px">$${f.price}</div><button class="btn small primary" data-furn="${f.id}">Comprar + colocar</button>`;
      grid2.appendChild(card);
    }
    c.appendChild(grid2);
    grid2.querySelectorAll("[data-furn]").forEach(b=> b.onclick=()=> startFurniturePlace(b.dataset.furn));
    // lista de móveis já colocados
    const list=soc.furniture||[];
    if(list.length){
      const ul=document.createElement("div"); ul.style.marginTop="10px";
      ul.innerHTML=`<h4>Móveis na casa (${list.length})</h4>`;
      list.forEach((it, idx)=>{
        const row=document.createElement("div"); row.className="shopItem";
        row.innerHTML=`<div class="shopInfo"><b>${it.icon} ${it.name}</b><div class="sub">@ ${it.x.toFixed(1)}, ${it.y.toFixed(1)}</div></div><button class="btn small secondary" data-rem="${idx}">Remover</button>`;
        ul.appendChild(row);
      });
      c.appendChild(ul);
      ul.querySelectorAll("[data-rem]").forEach(b=> b.onclick=()=> commands.interact("removeFurniture",{index: parseInt(b.dataset.rem,10)}));
    }
  }
}

function initSettings() {
  const music = $("chkMusic");
  const sfxChk = $("chkSfx");
  const vol = $("rngVolume");
  if (!music) return;
  music.checked = game.settings.music;
  sfxChk.checked = game.settings.sfx;
  vol.value = Math.round(game.settings.volume * 100);
  const apply = () => {
    game.settings.music = music.checked;
    game.settings.sfx = sfxChk.checked;
    game.settings.volume = Number(vol.value) / 100;
    applyAudioSettings();
    try { localStorage.setItem("vale_settings", JSON.stringify(game.settings)); } catch {}
  };
  music.onchange = apply;
  sfxChk.onchange = apply;
  vol.oninput = apply;
}

export function onSleepVote({ votes, needed, by }) {
  notify(`${by} quer dormir (${votes}/${needed}). Pressione "Dormir" nas configurações para acompanhar.`);
}

export function showDisconnected() {
  const el = $("connectionBanner");
  if (el) {
    el.style.display = "flex";
    el.textContent = "⚠️ Conexão perdida. Tentando reconectar...";
  }
}

export function hideDisconnected() {
  const el = $("connectionBanner");
  if (el) el.style.display = "none";
}

export function showConnecting(text = "Conectando ao vale...") {
  const el = $("connectionBanner");
  if (el) {
    el.style.display = "flex";
    el.textContent = `🌾 ${text}`;
  }
}


try { window.togglePanel = togglePanel; window.closePanels = closePanels; window.openNpc = openNpc; } catch {}
