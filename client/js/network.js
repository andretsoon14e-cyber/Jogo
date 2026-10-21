import { game, commands, rebuildHotbar } from "./state.js";
import * as ui from "./ui.js";
import { spawnEffect, spawnFloatingText } from "./renderer.js";
import { sfx } from "./audio.js";

let socket = null;
let everJoined = false;

export function isSocketConnected() {
  return !!socket?.connected;
}

export function connect(profile) {
  const lib = window.io;
  if (!lib) {
    ui.notify("Biblioteca de rede não carregou. Recarregue a página.", "error");
    return;
  }
  socket = lib({
    reconnection: true,
    reconnectionDelay: 700,
    reconnectionDelayMax: 4000,
    timeout: 15000,
  });

  socket.on("connect", () => {
    ui.showConnecting(everJoined ? "Reconectando ao vale..." : "Entrando no vale...");
    socket.emit("joinRoom", {
      roomCode: profile.roomCode,
      username: profile.username,
      token: profile.token || null,
      skin: profile.skin,
      x: 22,
      y: 21,
    });
  });

  socket.on("joined", (data) => {
    everJoined = true;
    game.selfId = data.selfId;
    game.isHost = data.isHost;
    game.self = data.self;
    game.isAccount = !!data.self.account;
    game.world = data.world;
    game.regions = data.world.regions || {};
    game.region = data.self.region || "vale";
    game.bank = data.self.bank || game.bank;
    game.social = data.self.social || game.social;
    game.furniture = data.self.furniture || [];
    game.indoors = data.self.indoors || null;
    game.x = data.self.x;
    game.y = data.self.y;
    game.camera.x = game.x;
    game.camera.y = game.y;
    game.dir = data.self.dir || "down";
    game.players.clear();
    for (const p of data.players) {
      game.players.set(p.id, { ...p, renderX: p.x, renderY: p.y });
    }
    game.connected = true;
    rebuildHotbar();
    ui.refreshAll();
    ui.hideDisconnected();
    ui.notify(`🌾 Bem-vindo ao vale, ${game.username}!`, "success");
    if (game.isHost) ui.notify("👑 Você é o anfitrião desta sala.", "success");
    if (!localStorage.getItem("vale_tutorial")) setTimeout(() => ui.togglePanel("tutorialPanel"), 350);
    if (!game.isAccount) ui.notify("Você está como visitante: crie uma conta para salvar o progresso.", "info");
    sfx("levelup");
  });

  socket.on("playerJoined", (p) => {
    game.players.set(p.id, { ...p, renderX: p.x, renderY: p.y });
    ui.updatePlayerList();
    ui.updateHUD();
    ui.notify(`👋 ${p.username} entrou no mundo!`, "success");
    sfx("chat");
  });

  socket.on("playerLeft", (id) => {
    const p = game.players.get(id);
    if (p) ui.notify(`👋 ${p.username} saiu do mundo.`);
    game.players.delete(id);
    ui.updatePlayerList();
    ui.updateHUD();
  });

  socket.on("playerMoved", ({ id, x, y, dir }) => {
    const p = game.players.get(id);
    if (!p) return;
    p.x = x; p.y = y; p.dir = dir;
    if (p.renderX === undefined) { p.renderX = x; p.renderY = y; }
  });

  socket.on("timeUpdate", (d) => {
    game.world.day = d.day;
    game.world.seasonIndex = d.seasonIndex;
    game.world.weather = d.weather;
    // corrige apenas se o relógio local estiver muito fora
    if (Math.abs(game.world.time - d.time) > 12) game.world.time = d.time;
  });

  socket.on("newDay", (d) => {
    game.world.day = d.day;
    game.world.seasonIndex = d.seasonIndex;
    game.world.weather = d.weather;
    game.world.plots = d.plots || {};
    game.world.animals = d.animals || game.world.animals;
    game.world.festival = d.festival || null;
    game.world.time = 6 * 60;
    game.camera.x = game.x;
    game.camera.y = game.y;
    for (const note of d.notes || []) ui.notify(note, "success");
    if (!d.notes?.length) ui.notify(`☀️ Novo dia! Dia ${d.day}`, "success");
    ui.updateHUD(); ui.renderAgenda&&ui.renderAgenda(); ui.renderCommunity(); sfx("sleep");
    try{ if(window.onNewDaySleep) window.onNewDaySleep(d); }catch{}
  });

  socket.on("tileUpdate", ({ x, y, tile }) => {
    if (game.world.tiles[y]) game.world.tiles[y][x] = tile;
  });

  socket.on("tilesReload", ({ tiles }) => { game.world.tiles = tiles; ui.notify("🌉 A paisagem mudou!", "success"); });
  socket.on("regionTiles", ({ region, tiles })=>{ if(!game.regions) game.regions={}; game.regions[region]={tiles}; });


  socket.on("plotUpdate", ({ key, plot }) => {
    game.world.plots[key] = plot;
  });

  socket.on("buildingsUpdate", (buildings) => {
    game.world.buildings = buildings;
    ui.renderBuild();
    if (ui.panelIs("shopPanel")) ui.renderShop(game.shopTab);
    sfx("build");
  });

  socket.on("animalsUpdate", (animals) => {
    game.world.animals = animals;
  });

  socket.on("communityUpdate", (progress) => {
    game.world.communityProgress = progress;
    ui.renderCommunity();
    if (ui.panelIs("questPanel")) ui.renderQuests();
  });

  socket.on("inventoryUpdate", (inv) => {
    game.self.inventory = inv || {};
    rebuildHotbar();
    ui.updateHotbar();
    if (ui.panelIs("inventoryPanel")) ui.renderInventory();
    if (ui.panelIs("shopPanel") && game.shopTab === "sell") ui.renderShop("sell");
    if (ui.panelIs("buildPanel")) ui.renderBuild();
  });

  socket.on("goldUpdate", (gold) => {
    game.self.gold = gold;
    ui.updateHUD();
    if (ui.panelIs("shopPanel")) ui.renderShop(game.shopTab);
  });

  socket.on("skillsUpdate", ({ level, xp }) => {
    const old = game.self.level || {};
    game.self.level = level;
    game.self.xp = xp;
    for (const k in level) {
      if ((old[k] || 1) < level[k]) sfx("levelup");
    }
    ui.updateSkills();
  });

  socket.on("statsUpdate", ({ stats, claimedQuests }) => {
    game.self.stats = stats;
    game.self.claimedQuests = claimedQuests || [];
    ui.renderQuests();
    if (ui.panelIs("inventoryPanel")) ui.renderInventory();
  });

  socket.on("questsUpdate", ({ claimedQuests }) => {
    game.self.claimedQuests = claimedQuests;
    ui.renderQuests();
  });

  socket.on("friendshipUpdate", (friendship) => {
    game.self.friendship = friendship;
    if (ui.panelIs("socialPanel")) ui.renderSocial();
    sfx("levelup");
  });

  socket.on("notify", ({ msg, type }) => ui.notify(msg, type));
  socket.on("notifyAll", ({ msg, type }) => ui.notify(msg, type));

  socket.on("effect", ({ x, y, type }) => {
    spawnEffect(x, y, type);
    if (type === "harvest") spawnFloatingText(x, y, "+1", "#c8f7a0");
    if (type === "fish_catch") spawnFloatingText(x, y, "🐟", "#b8e6fe");
    if (type === "chop") spawnFloatingText(x, y, "+madeira", "#e8c39e");
    if (type === "mine") spawnFloatingText(x, y, "+pedra", "#ddd");
    sfx(type === "fish_catch" ? "fish" : type === "chop" ? "chop" : type === "mine" ? "mine" : "harvest");
  });

  socket.on("chatMsg", (entry) => ui.addChat(entry));
  socket.on("chatHistory", (messages) => {
    for (const m of messages) ui.addChat(m);
  });

  socket.on("sleepVote", (d) => ui.onSleepVote(d));

  socket.on("promotedHost", () => {
    game.isHost = true;
    ui.notify("👑 Você agora é o anfitrião do mundo.", "success");
  });

  socket.on("jobUpdate", (j)=>{ game.job=j; ui.renderAgenda&&ui.renderAgenda(); if(ui.panelIs("jobPanel")) ui.renderJobs(); });
  socket.on("chainsUpdate", (chains)=>{ game.career.chains=chains; if(ui.panelIs("questPanel")) ui.renderQuests(); });
  socket.on("coopUpdate", (coop)=>{ game.career.coop=coop; ui.renderAgenda&&ui.renderAgenda(); if(ui.panelIs("coopPanel")) ui.renderCoop(); if(ui.panelIs("questPanel")) ui.renderQuests(); });
  socket.on("cookbook", ({recipes, cookingLevel})=>{ game.career.recipes=recipes; game.career.cookingLevel=cookingLevel; });
  socket.on("shiftStarted", (d)=>{
    game.shift={ ...d.job, served:0, total:8, startedAt: Date.now() };
    ui.notify(`💼 Turno iniciado em ${d.job.employer}! Complete os pedidos e encerre para receber.`, "success");
    if(window.openShiftOverlay) window.openShiftOverlay();
    else ui.notify("Pressione O (Empregos) para ver o turno.", "info");
  });
  socket.on("bankUpdate", (b)=>{ game.bank=b; game.self.gold=b.cash; if(window.ui && window.ui.updateHUD) try{ window.ui.updateHUD(); }catch{}; if(game.uiReady) try{ ui.updateHUD(); ui.renderAgenda&&ui.renderAgenda(); if(panelIsSafe("bankPanel")) ui.renderBank(); }catch{}; });
  socket.on("socialUpdate", (soc)=>{ game.social=soc; if(game.uiReady) try{ if(panelIsSafe("socialPanel")) ui.renderSocial(); if(panelIsSafe("housePanel")) ui.renderHouses(); }catch{}; });
  socket.on("furnitureUpdate", (list)=>{ game.furniture=list; game.social.furniture=list; });
  function panelIsSafe(id){ try{ return ui.panelIs(id); }catch{ return false; }}
  socket.on("traveled", ({region, x,y, regionDef, tiles})=>{
    game.region=region;
    game.x=x; game.y=y;
    game.camera.x=x; game.camera.y=y;
    game.indoors=null;
    // guarda os tiles da região para renderizar o mapa novo sem piscar
    if (tiles) {
      if (region === "vale") game.world.tiles = tiles;
      else { game.regions ||= {}; game.regions[region] = { ...(game.regions[region]||{}), tiles }; }
    }
    ui.updateHUD(); ui.updatePlayerList(); ui.notify(`Chegou em ${regionDef.name}!`, "success"); sfx("levelup");
    if(ui.panelIs("mapPanel")) ui.renderMap();
    ui.renderAgenda&&ui.renderAgenda();
  });
  socket.on("playersUpdate", (list) => {
    const old = new Map(game.players);
    game.players.clear();
    for (const p of list) {
      const prev = old.get(p.id);
      game.players.set(p.id, { ...p, renderX: prev?.renderX ?? p.x, renderY: prev?.renderY ?? p.y });
    }
    ui.updatePlayerList(); ui.updateHUD(); ui.renderAgenda&&ui.renderAgenda();
    if (ui.panelIs("socialPanel")) ui.renderSocial();
    if (ui.panelIs("mapPanel")) ui.renderMap();
  });

  socket.on("playerRegionChanged", ({id, region})=>{
    const p=game.players.get(id); if(p) p.region=region;
    ui.updatePlayerList();
  });
  socket.on("joinError", ({ error }) => {
    ui.notify(error || "Não foi possível entrar na sala.", "error");
    setTimeout(() => window.location.reload(), 2200);
  });

  socket.on("disconnect", () => {
    game.connected = false;
    ui.showDisconnected();
  });

  socket.on("connect_error", () => {
    ui.showConnecting("Servidor indisponível. Tentando novamente...");
  });

  // comandos usados pela interface
  commands.move = (x, y, dir) => socket?.emit("move", { x, y, dir });
  commands.interact = (type, data) => socket?.emit("interact", { type, data });
  commands.chat = (msg) => socket?.emit("chat", { msg });
  commands.sleep = () => socket?.emit("sleep");
  commands.save = () => socket?.emit("requestSave");
  commands.talk = (npcId) => socket?.emit("interact", { type: "talk", data: { npcId } });
  commands.disconnect = () => socket?.disconnect();
}
