# 🧱 Arquitetura do Vale Aconchegante

Este documento explica **como o jogo funciona por dentro**, o que é compartilhado entre jogadores e o que é individual, como o multiplayer evita dessincronização e quais são as limitações reais.

---

## 1. Visão geral

```
Navegador / Electron                  Servidor Node.js
┌───────────────────┐   Socket.IO   ┌────────────────────────────┐
│ renderer.js       │  (WebSocket)  │ server.js  (orquestração)  │
│ ui.js             │◄─────────────►│ gameActions.js (regras)    │
│ state.js          │               │ rooms.js  (salas/host)     │
│ network.js        │   HTTP /api   │ worldState.js (mundo/save) │
│ audio.js          │◄─────────────►│ accounts.js (contas)       │
└───────────────────┘               └────────────┬───────────────┘
                                                 │ JSON atômico
                                                 ▼
                                       server/data/worlds/*.json
                                       server/data/users.json
                                       server/data/secret.key
```

- **Canvas 2D puro**, sem engine e sem etapa de build. O cliente importa módulos ES direto.
- **Um único servidor** serve o front-end, a API HTTP e o Socket.IO. Isso simplifica o `.exe` (o Electron embute esse mesmo servidor).
- **Estado do mundo** vive no servidor. O cliente mantém uma cópia para desenhar.

---

## 2. Compartilhado × individual

| Dado | Onde vive | Compartilhado? |
|---|---|---|
| Mapa (tiles), terra arada, plantas | `world.tiles`, `world.plots` | ✅ todos veem |
| Construções e quem as fez | `world.buildings` | ✅ todos veem |
| Animais | `world.animals` | ✅ todos veem |
| Projetos comunitários | `world.communityProgress` | ✅ todos veem |
| Dia, estação, clima, relógio | `world.day/time/season/weather` | ✅ sincronizado pelo servidor |
| Posição e direção dos jogadores | `player.x/y/dir` | ✅ em tempo real |
| Chat | `room.chat` | ✅ (últimas 80 mensagens) |
| **Ouro** | `player.gold` | ❌ individual |
| **Inventário** | `player.inventory` | ❌ individual |
| **Amizades** | `player.friendship` | ❌ individual |
| **Missões e estatísticas** | `player.stats`, `player.claimedQuests` | ❌ individual |
| **Habilidades/XP** | `player.level`, `player.xp` | ❌ individual |
| **Aparência** | `player.skin` | individual |
| **Progresso salvo por conta** | `world.playerStates[nome]` | ❌ por jogador |

**Por que assim?** No gênero fazenda cooperativo o mundo é um só (não podem existir duas versões diferentes da plantação), mas cada pessoa precisa da sua própria economia e história. Quando alguém colhe uma planta, ela desaparece para todos; o item vai só para quem colheu.

---

## 3. Servidor autoritativo — a regra que segura tudo

O cliente **nunca** altera ouro, item ou tile localmente de forma definitiva. Ele envia intenções:

```js
socket.emit("interact", { type: "plant", data: { x: 22, y: 15, seed: "nabo_seed" } });
socket.emit("interact", { type: "buy",   data: { item: "vara", qty: 1 } });
```

O servidor (`server/gameActions.js`) verifica:

1. A ação existe e o jogador está numa sala;
2. O jogador está perto (`checkDistance`, máx. 4–5 tiles);
3. O custo existe e foi pago (ouro, semente, material);
4. O cooldown da ação (pesca, machado, mineração) não está ativo;
5. O tile/estado permite (terra arada, planta madura, estação correta, espaço livre);
6. Só então altera o mundo e emite os eventos para todos.

Depois de cada ação, o jogador é persistido (`persistPlayer`) e a sala é marcada como "suja" para autosave. Isso elimina duplicação de item, ouro infinito e dessincronização.

### Eventos principais

| Direção | Evento | Função |
|---|---|---|
| C→S | `joinRoom`, `move`, `chat`, `interact`, `sleep`, `requestSave` | intenções do jogador |
| S→C | `joined` | estado completo inicial (mapa + self + jogadores) |
| S→C | `playersUpdate`, `playerJoined`, `playerLeft`, `playerMoved` | presença e posição |
| S→C | `tileUpdate`, `plotUpdate`, `buildingsUpdate`, `animalsUpdate`, `tilesReload` | mundo compartilhado |
| S→C | `inventoryUpdate`, `goldUpdate`, `skillsUpdate`, `statsUpdate`, `friendshipUpdate` | estado privado |
| S→C | `communityUpdate`, `newDay`, `timeUpdate`, `sleepVote` | mundo/tempo |
| S→C | `notify`, `notifyAll`, `effect`, `chatMsg` | feedback e efeitos |

---

## 4. Multiplayer: ciclo de vida da sala

1. **Criar sala** — `POST /api/create-room` (ou criada implicitamente ao entrar num código novo).
2. **Entrar** — `joinRoom` normaliza o código (A–Z, 0–9, até 6), valida token, resolve nome (conta não pode ser personificada por visitante) e restaura o estado salvo do jogador se for conta.
3. **Host** — o primeiro a entrar é anfitrião. Se ele desconectar, o servidor promove o próximo da fila e avisa com `promotedHost`. **O mundo não depende do host estar online**: ele vive no servidor.
4. **Dormir** — cada jogador vota; quando a maioria vota, o dia avança (`advanceWorld`) para todos. Se o relógio chegar a 02:00, o dia avança automaticamente.
5. **Salvar** — autosave a cada 5 s (salas alteradas) e backup completo a cada 30 s, com escrita atômica (`tmp` → `rename`).
6. **Sala vazia** — o mundo fica em memória, é salvo e pode ser retomado depois pelo mesmo código.

### Latência e suavidade
- Movimento do jogador local é imediato (client-side prediction simples).
- Outros jogadores são interpolados visualmente (`renderX/renderY` → `x/y`) com easing, em vez de "teleportar".
- Posição é enviada a ~10 Hz; eventos de ação são instantâneos.
- O relógio local anda sozinho e é corrigido pelo `timeUpdate` quando a diferença passa de ~12 minutos.

### Limitações honestas
- **Hospedagem**: para amigos em redes diferentes é necessário o servidor rodar num host acessível (LAN não basta). Opções gratuitas no guia do `.exe`.
- **Persistência**: os arquivos JSON ficam no disco do servidor. Se o host usar um plano com disco efêmero (alguns free tiers), faça backup ou monte um volume.
- **Escala**: o desenho é para **salas cooperativas de poucos jogadores** (2–8). Não há sharding, matchmaking público nem anti-cheat avançado.
- **Salas públicas**: a lista já existe via API e aparece na tela de login; ainda não há moderação/filtros.
- **Reconexão**: volta ao mesmo código e recupera o progresso da conta. O que foi feito sem conta (visitante) não é salvo por design.

---

## 5. Tempo, crescimento e clima

- `world.time` em minutos; começa 06:00 e termina 26:00 (02:00 do dia seguinte).
- O servidor avança o relógio a cada 2 s e emite `timeUpdate`.
- Ao dormir/amanhecer (`advanceDay` em `worldState.js`):
  1. `day++`; se passar de 28, muda a estação (`seasonIndex`).
  2. Sorteia o clima (inclui neve no inverno).
  3. Chuva/neve **regam tudo** automaticamente.
  4. Planta regada cresce 1 estágio; planta fora da estação morre, **exceto dentro de estufa**.
  5. Animais produzem para o dono (com ou sem o dono online, se tiver conta).
  6. Dia 28 = Festival da Colheita (decoração na praça).
- O crescimento não usa timers por planta: é determinístico por dia, o que evita milhares de timers e facilita salvar/carregar.

---

## 6. Mapa determinístico

`createEmptyMap()` usa um PRNG com semente fixa (`mulberry32(20261019)`). Consequências:
- Todos os clientes e o servidor geram **exatamente** o mesmo mapa, mesmo sem baixar um arquivo.
- Salvar o mundo não precisa guardar o mapa inteiro (mas guardamos, por segurança de migração).
- É fácil criar mapas novos: basta outro seed + outra função de layout (regiões futuras).

---

## 7. Contas e segurança

- Senha: `scrypt` com salt aleatório de 16 bytes; hash comparado com `timingSafeEqual`.
- Sessão: token `HMAC-SHA256` com validade de 30 dias, assinado por um segredo local (`server/data/secret.key`, modo 600, **fora do Git**).
- Token é guardado no `localStorage` do jogador; o servidor **nunca** confia no nome enviado quando há token válido.
- Visitante não pode usar o nome de uma conta existente (recebe sufixo), evitando personificação.
- Entradas são saneadas: nome com limite de 20 caracteres e remoção de símbolos; chat sem caracteres de controle e limitado a 200; JSON limitado a 32 KB.
- Nenhuma credencial externa, nenhum serviço pago.

**O que este projeto NÃO faz (e você deve saber):**
- Não há e-mail de recuperação de senha (não há serviço de e-mail). Se perder a senha, a conta fica inacessível — em produção, adicione verificação por e-mail ou "chave de recuperação".
- Não há HTTPS embutido. Em produção, coloque atrás de um proxy (Caddy/Nginx/Cloudflare) — o `.exe` local não precisa.
- Não há proteção contra DDoS nem rate limit distribuído. Para um jogo entre amigos, o rate limit simples por socket é suficiente.

---

## 8. Onde adicionar coisas novas (receitas)

| Quero adicionar… | Onde |
|---|---|
| Nova cultura | `shared/constants.js` → `CROPS` (o resto do jogo já lê daí) |
| Nova construção | `shared/constants.js` → `BUILD_OPTIONS` + (se tiver arte especial) `renderer.js` |
| Novo NPC/diálogo | `shared/constants.js` → `NPCS_DATA`, `NPC_DIALOGS`, rotinas |
| Nova missão | `shared/constants.js` → `QUESTS` + estatística em `gameActions.js` |
| Novo projeto comunitário | `COMMUNITY_PROJECTS` + `gameActions.js` (efeito no mundo) |
| Nova região | `worldState.js` (layout por seed) + `renderer.js` (paleta/objetos) + portais |
| Nova profissão | `SKILLS` + ações específicas em `gameActions.js` |
| Item novo | `ITEM_INFO` (ícone, preço) + regra de obtenção em `gameActions.js` |

Nenhuma dessas adições exige mexer no loop principal ou no netcode.


---

## 🎨 Camada de arte (`client/js/art/`)

Toda a arte é **pixel art original desenhada por código** em canvas offscreen, ampliada 2× com `imageSmoothingEnabled = false`. Não há PNGs externos nem emojis no mundo.

| Arquivo | Responsabilidade |
|---|---|
| `palette.js` | Paleta-mãe, paletas por estação e utilitários de cor (`shade`, `mix`, `alpha`). |
| `pixel.js` | Canvas offscreen, sprites a partir de "ASCII", cache, sombras, `blit` com snap de pixel e texto com contorno. |
| `characters.js` | Sprites 16×24 × 4 direções × 4 quadros, pose de ação com ferramenta, 6 visuais de jogador e 10 moradores. |
| `buildings.js` | Prédios procedurais por tipo (telhado em duas águas, chaminé, vitrine, toldo, placa) + máscara de janelas iluminadas à noite. |
| `props.js` | Árvores (3 silhuetas, tronco e copa separados para balançar), arbustos, pedras, flores, cercas, postes, poço, fonte, estátua, barril, caixote, espantalho, píer, coqueiro. |
| `ground.js` | Chão pré-renderizado em canvas (grama, caminho com auto-tiling, praça, areia, ponte, floresta), transição orgânica grama↔floresta, mar fora do mapa e água animada. |
| `critters.js` | Galinha, vaca, ovelha, gato, pássaro, borboleta, abelha e fumaça. |
| `ambient.js` | Comportamentos ambientais (pássaros que fogem, gatos que dormem, vaga-lumes) e partículas de vento. |
| `lighting.js` | Estado de luz por minuto do dia, luz quente direcional, luar, brilho aditivo cacheado e vinheta. |
| `interior.js` | Cômodos com piso, papel de parede, janelas, lareira, móveis por tipo de estabelecimento e iluminação. |
| `icons.js` | Ícones 16×16 em pixel art gerados por código e servidos como data-URL; substitui emojis em toda a UI. |
| `ui-binding.js` | Liga a arte ao DOM (`data-icon`, `iconize`, retratos de NPC, emblema da tela inicial). |

### Profundidade e escala

- Cada objeto entra numa lista `drawables` com uma chave `y` (base do objeto) e a lista é ordenada antes de desenhar: é o *Y-sort*, que faz o jogador passar atrás ou na frente de árvores, cercas e prédios.
- Escala fixa: 1 tile = 32 px = 2× de 16 "pixels de arte". Personagem = 16×24 de arte (32×48 px), casa = 5×4 tiles.
- O chão é desenhado em um canvas único por região+estação (cache invalidado quando os tiles mudam), evitando milhares de `fillRect` por frame.

### Desempenho

- Sprites cacheados por chave (estação, variante, seed).
- Gradientes de luz armazenados em sprites pequenos e reutilizados.
- Qualidade adaptativa (`tickQuality`): se o frame passar de 34 ms por 90 frames, partículas secundárias são desligadas.
- Medido no navegador headless do sandbox: **~52 FPS com 1440×900** (renderer por software, sem GPU) e ~10 MB de heap.

---

## 🎣 v1.7 — Ferramentas com poses + retratos grandes + NPC sazonal

### Ferramentas com poses distintas
Cada ferramenta ganhou sprite dedicado com variação por direção (down/up/left/right) e pose de ação:

| Ferramenta | Detalhe visual |
|---|---|
| **Enxada** | Cabo de madeira com sombreamento + lâmina larga cinza-azulada com dentes; vista frontal vertical e lateral horizontal |
| **Machado** | Cabeça grande prateada com fio afiado claro e cabo longo; balanço lateral |
| **Picareta** | Cabeça em T pontiaguda com brilho metálico; ergue acima da cabeça |
| **Regador** | Corpo teal com bico alongado, alça e jato d'água em gotas semi-transparentes inclinadas |
| **Vara** | Vara segmentada com carretilha, linha azul clara e boia vermelha/branca; estendida à frente |
| **Foice** | Lâmina curva prateada com fio destacado e cabo curto; varredura baixa |
| **Sementes** | Saco bege com faixa verde |

O `drawTool` agora desenha cabo com highlight/sombra + cabeça metálica com 3 tons (base/dark/highlight). A pose de ação ergue os braços (`drawBody` com `tool`) e o `actionFrames` cacheia por `tool+dir`. Em `renderer.js` a ação anima com 3 fases (erguer 0-40%, golpear 40-70% com tremor, recolher 70-100%) e partículas extras (terra da enxada, água do regador).

### Retratos grandes
O diálogo usava `npcPortrait(npc,68)` — avatar 68×68 com fundo xadrez simples e recorte pequeno. Agora `npcPortrait(npc,112,{seasonIndex})`:

- Fundo em degradê por estação (primavera verde-claro, verão amarelo, outono laranja, inverno azul-neve) com padrão xadrez branco sutil
- Ícone sazonal no canto: flor (primavera), sol com raios (verão), folha (outono), floco (inverno)
- Busto ampliado: recorte 0.02–0.68h, escala 0.92×, sombra elíptica atrás do personagem
- Moldura dupla: borda madeira #6b4a2e 3px + interior pergaminho #d9c79a 2px + filete fino
- Placa de nome na base: fundo marrom 92% opaco, texto centralizado, tamanho proporcional ao portrait
- Painel `.npcAvatar` passou de 68×68 para 116×132 com `flex-direction:column`, sombra externa e `gap`
- Tooltip e badge textual abaixo: "🌸 Primavera" / "☀ Verão" / etc.

### Variação sazonal dos NPCs
Novos `SEASON_NPC_OVERRIDES` em `characters.js` para cada uma das 4 estações × 10 moradores. Exemplos:

- **Maria** (prefeita): primavera sem casaco, verão vestido claro, outono casaco marrom + cachecol, inverno casaco escuro + gorro + cachecol
- **João/Luna/Carlos**: camisas mais claras no verão, casacos escuros e cachecóis no inverno, tons terrosos no outono
- **Ana/Bia/Tai**: chapéus trocam (flor no verão, bandana no inverno)
- `seasonSpec(npcId, seasonIndex, baseSpec)` mescla override sobre `NPC_SPECS` base; `atlasForNpc(npc, season)` e `npcPortrait(..., {seasonIndex})` consomem. O `coatBack`/`scarf`/`hat` são desenhados em `drawBody`/`drawHat`.

Todos os gameplay anteriores (multiplayer autoritativo, economia, construção, empregos, banco, social, viagens, interiores) permanecem idênticos.

---

## 🎬 v1.8 — Capa animada Stardew-style + texturas da fazenda

### Capa antes do login
O jogo não abre mais direto no login. Agora existe `coverScreen` ativa por padrão (`index.html` com `coverCanvas` + `coverLogoCanvas`):

- Fundo animado em `client/js/art/cover.js`: céu degradê dia, sol com halo pulsante e raios, montanhas em paralaxe (3 camadas), campo arenoso `#e8cfa0` com grãozinhos, faixas de grama `#6aa84f`/`#7cb958` nas bordas como na referência, casa de madeira com telha vermelha `#c14f42`, chaminé com fumaça, árvores balançando (`Math.sin`), cerca baixa marrom, canteiros retangulares com bordas, poço, borboletas e pássaro cruzando
- Nuvens CSS `.cloud` com animação `drift` 38–65s linear infinita, vinheta e `coverShade` radial
- Logo em tabuleta de madeira (`coverLogoCanvas`): moldura `#6b4a2f` + pergaminho `#f9f1de` + borda dourada `#e8b44a`, parafusos, títulos `VALE` / `ACONCHEGANTE` com sombra, hint `Pressione Enter`
- Menu: `Jogar` (vai para login), `Continuar` (aparece se `vale_name` no localStorage), `Ajustes`/`Créditos`/`Sair`, tecla Enter atalha
- `main.js:initCover()` gerencia `coverScreen ⇄ loginScreen` com `stopCoverLoop()` e botão `← Voltar à capa` dentro do card de login

### Texturas bonitas como a referência
- `ground.js:grassTile` agora varia base por `hash` + manchas orgânicas e tufos mais densos com brilho `leafLight`, pedrinhas raras
- `tilledTile` virado em canteiro de fazenda: borda 2px `#4f3620`, sulcos 4×8px com crista clara `#e8d2a0` e versão aguada `#6b4a2e` + brilho d'água
- `renderer.js:drawCrop` com borda de canteiro marrom e treliça vertical para tomate/milho/abóbora/morango (trave de madeira + travessa) e broto duplo no estágio 0, mais fiel à foto anexa
- Casa, cerca e poço da capa usam mesma paleta quente da fazenda real

Tudo preserva multiplayer autoritativo, economia e construção.
