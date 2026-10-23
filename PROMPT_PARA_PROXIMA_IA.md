# PROMPT PARA PRÓXIMA IA — Pedido de ajuda para continuar o projeto Vale Aconchegante

> **Instrução para a próxima IA:** Você está recebendo um prompt de um usuário que tem dificuldade de escrever prompts detalhados + um agente que tem dificuldade de entender pedidos vagos. O usuário quer que você, com base em todo o contexto abaixo, gere **um prompt bem detalhado e acionável** que o agente (eu) possa executar sem ambiguidade, e também dê sugestões de como resolver os bloqueios técnicos e de comunicação.

---

## 1. QUEM SOU E O QUE ESTÁ ACONTECENDO

Eu sou um usuário brasileiro que não tem treinamento para escrever prompts detalhados. Eu falo de forma informal e espero que o agente entenda, mas ele me entrega coisa meia boca. Existe uma **janela falhando na comunicação**: eu não consigo especificar exatamente o que quero com a precisão que o agente precisa, e o agente não consegue inferir a intenção completa a partir do que eu falo.

Minha solução proposta: em vez de tentar adivinhar, quero que o agente atual faça um **raio-X completo do projeto**, listando tudo que eu pedi, o que já existe, o que falta, o que foi resolvido, o que não foi resolvido e **qual foi a dificuldade exata** para não resolver. Com esse raio-X, você (próxima IA) vai criar um **prompt detalhado, tópico por tópico**, que eu possa devolver para o agente executar corretamente.

Meu pedido para você agora: leia as seções 2 a 10 abaixo e me devolva:
1.  Um **prompt único, copiável**, extremamente detalhado, dividido em tópicos prontos para o agente executar (um task por tópico, com critério de aceite).
2.  Sugestões de **como eu (usuário) posso melhorar meus próprios pedidos** no futuro (exemplos de como transformar "tira ▶ do Play" em prompt completo).
3.  Sugestões técnicas de **como resolver os bloqueios** listados na seção 8 e 9 (com abordagem passo a passo, sem chute especulativo).
4.  O **formato de resposta** que você recomenda que eu exija do agente daqui pra frente para não haver mais entrega meia boca.

Responda em português do Brasil, objetivo e prático. Se alguma informação abaixo estiver faltando para você criar o prompt detalhado, liste as perguntas que faltam no final.

---

## 2. O QUE É O PROJETO

**Nome:** Vale Aconchegante (vale-aconchegante@1.16.0)
**Pitch:** Jogo 2D de simulação de vida, fazenda e RPG multiplayer, inspirado na atmosfera de Stardew Valley, mas com identidade própria. Nenhum asset, música, personagem ou texto foi copiado — tudo original ou procedural.
**Status atual:** v1.6 jogável, v1.5 com expansões, em branch `arena/629415fb-jogo` (HEAD `1d1c55e`, PR aberto, status `pr_open`, base `main` em `02a007f`).

**Stack:**
- `Node 22.22.3 + Express 4.19.2 + Socket.IO 4.7.5`, cliente `Socket.IO-client 4.7.5`, `jsdom 30` para testes cliente
- `Electron 28 + electron-builder 24.9` para exe
- `type: module` (ESM)
- Servidor: `server/server.js` (rotas `/health`, `/api/world/:code`, `/api/world/:code/player/:name`, `/api/register`, `/api/login`, `/api/create-room`, `/api/rooms`, Socket handlers `joinRoom`, `tool`, `sleep`, `move`, etc.)
- Mundo: `server/worldState.js`, `server/gameActions.js` (casos `till`, `plant`, `water`, `harvest`, `build`, `chop`, `mine`, `fish`, `donate`), persistência atômica em `server/data/worlds/T*.json` + `saveWorldToDisk/loadWorldFromDisk/advanceDay/advanceWorld`
- Shared: `shared/constants.js` (`BODY_OPTIONS` 15 bodies `body_*.png`, `SHIRT/HAT/HAIR`, `NPC_SPECS` 16 profissões dual, tamanhos `0.70/0.88/1.0-1.08`, 22px player / 16px NPC)
- Cliente: `client/js/art/characters.js` (drawHair, caches `bodyImages/layerImages`, `drawPremiumNpc`, `W*PIX*H*PIX`), assets `client/assets/body_*.png` (chibi 16x32) + `layer_*.png` (21 layers)
- Testes: `test/multiplayer.test.js` (44 testes reais com 2 clientes Socket.IO, helper `once(socket, event, 5s)` com `socket.once + setTimeout` sem `off` no timeout, `waitFor` com predicate, `sleep(150)` após cada `newDay`; loop `d=0..2` testa Regar+Maioria + 3 estágios planta) + `test/client.smoke.test.js` (47 testes jsdom)
- Comandos: `npm start` (porta 3000), `npm test`, `npm run test:client`, `npm run test:all`

**Estrutura relevante:**
```
Jogo/
  server/server.js (rooms Map, sleepVotes Set, sleep handler floor(size/2)+1, advanceWorld)
  server/gameActions.js (water checkDistance<=4, watered=true, broadcast plotUpdate)
  server/worldState.js
  client/js/art/characters.js
  client/assets/body_*.png (15) + layer_*.png (21)
  shared/constants.js
  test/multiplayer.test.js (once/waitFor/sleep)
  .agents/skills/systematic-debugging/SKILL.md + 10 skills vercel + skills/vale-dev-docs/SKILL.md
  skills-lock.json (10 via vercel-labs/agent-skills+obra/superpowers + 1 local)
  docs/imagens/*, docs/COMO_GERAR_EXE.md
  PROMPT_PARA_PROXIMA_IA.md (este arquivo)
```

---

## 3. O QUE EU (USUÁRIO) FALEI QUE QUERO NO PROJETO — Lista consolidada dos meus pedidos

1.  **Identidade visual:** Não quero cópia 1:1 de Stardew, mas quero qualidade similar. Reduzir `fog/island-feel` (neblina genérica), casas maiores, paleta própria.
2.  **Corpos desenhados à mão:** Nada de asset genérico. Quero corpos sem roupa primeiro, depois vestir. Especificamente: bebê genérico + criança M/F + **2 avatares por estágio** criança/teen/adulto/velho, sem roupa, M e F separados (total ~8-9 corpos base + 2 por estágio: criança M 2, criança F 2, teen 2, adulto M 2, adulto F 2, velho M 2, velha F 2 etc), depois adicionar barba/roupa por cima. Hoje temos 15 `body_*.png` genéricos, não no modelo que pedi.
3.  **Roupas/filtragem:** 5 masc + 5 fem para cada categoria `shirts/pants/hats/hair` (total 10 por categoria, 40 layers), com filtro gênero `masc/fem/uni`. Hoje temos 21 layers e filtro já existe mas incompleto (faltam 5+5 por categoria).
4.  **Seleção:** Todos selecionados visíveis ao mesmo tempo (grade), não single. O preview aditivo 70+ já existe mas a UI de seleção atual ainda permite pular automático (bug reportado em v1.51.0).
5.  **Retrato vs sprite:** Retrato realístico grande no diálogo vs sprite mapa pequeno branco estilo Stardew pequeno. Hierarquia de tamanhos NPC: `0.70/0.88/1.0-1.08` tier + peles mini quadradinhos (`PIX` 22px player /16px NPC).
6.  **Botões:** Remover botão `Play` de madeira, deixar só `Jogar` bege. Remover `▶` já foi feito em `2842868`, mas ainda há resquícios em alguns lugares. Remover `PRÉVIA ANIMADA` quadrada/feia que aparece na customização.
7.  **Taskbar:** Ícones muito minúsculos — quadrados aumentaram para 70px mas ícones não acompanharam. Precisa redesenhar ícones proporcionalmente.
8.  **Geral:** Manter `buildCustomSpec` em `constants.js` mapeando `hairAsset/hatAsset`, invalidação de cache em `characters.js` com `drawImage` 9 args, hotbar não minúscula, sem emojis, HUD madeira/pergaminho.

---

## 4. O QUE JÁ TEM (implementado e jogável)

- Tudo listado no README v1.6: contas, criação personagem 6 aparências + nome, mundo 70x50 tiles, movimento WASD+Shift, agricultura 8 culturas, animais 3, economia, multiplayer salas por código com chat e votação sono, salvamento atômico, 6 NPCs com rotina, amizade, 7 missões + 4 cadeias + 4 semanais cooperativas, 4 projetos comunidade (praça/biblioteca/ponte/estradas — ponte libera rio), 6 construções posicionáveis, 6 skills XP, dia/noite+clima 5 climas+estação+festival dia 28, HUD/hotbar 1-9/mochila/loja/mapa/social, áudio procedural Web Audio, 44 multiplayer + 47 client testes.
- Reformulação visual v1.6: sprites 16x24 4 direções 4 quadros walk, pose ferramenta, 10 moradores, construções com telhado duas águas/beiral/chaminé, grama orgânica, 3 árvores balançando, estação primavera/verão/outono/inverno, pássaros/borboletas/gatos/vaga-lumes, interiores com lareira, HUD madeira, partículas, cache chão/luz.
- Expansões v1.5: culinária 10 receitas, interiores jogáveis, empregos 4 carreiras com salário $10-16/h + férias 50% + agenda, barco/avião, 3 regiões (Vila Costeira/Ilha/Cidade) + 4 NPCs (Bia/Tai/Rita/Duda), banco depósito/empréstimo $2000, casas 3 + móveis 7 + relacionamento casável.
- Fix recente crítico: `2ebaee9 fix(client): corrige rebuildModularPick não definido em ES module (systematic-debugging) + adiciona skill obra/superpowers` — sem regressão validado com 45 client + 44 multiplayer OK, auditado em `1d1c55e docs(auditoria): audita 2ebaee9`.

---

## 5. O QUE FALTA (do que eu pedi e ainda não está como pedi)

- Corpos hand-drawn por estágio (meu item 2 acima): ainda não existem 2 por estágio criança/teen/adulto/velho M/F nude base. Hoje 15 bodies genéricos.
- 5+5 por categoria shirts/pants/hats/hair: faltam ~19 layers para completar 40.
- Redução fog/island-feel + casas maiores: não aplicado visualmente.
- Remoção completa botão Play/wod preview quadrada: parcialmente feito (▶ removido) mas usuário ainda vê resquícios.
- Taskbar ícones minúsculos: quadrado 70px mas ícone não escalado.
- Retrato realístico diálogo vs sprite pequeno branco: retratos existem mas não no estilo realístico pedido, ainda chibi.
- Seleção todos visíveis sem pular automático: ainda pula automático (v1.51.0 tentativa não resolveu totalmente).

---

## 6. O QUE EU PEDI PARA O AGENTE RESOLVER E ELE RESOLVEU (com dificuldade ou não)

1.  **▶ no botão Jogar + prévia bodies hand-drawn:** `2842868 fix: tira ▶ do botão Jogar (deixa só Jogar) + corrige prévia para mostrar bodies hand-drawn aprovados (cache + onload + layers cabelo/chapéu)` — **RESOLVIDO**, validado.
2.  **rebuildModularPick não definido em ES module:** `2ebaee9` — investigação com `systematic-debugging` Iron Law, root-cause, condição `ES module scope`, fix com `globalThis` + teste repro, audit `1d1c55e` 44/44 multiplayer — **RESOLVIDO**, confirmado.
3.  **Configurar Agent Skills reusáveis:** `ccc6812 chore(skills): configura biblioteca reusável Agent Skills — instala vercel-labs/agent-skills (9) em .agents/skills + cria AGENTS.md + fallback skills/vale-dev-docs/SKILL.md` — **RESOLVIDO**.
4.  **Lista de skills:** Usuário pediu agora `me liste todas as skills que vc está usando e oq cada uma faz` — **RESOLVIDO** (11 listadas: systematic-debugging + 9 vercel + vale-dev-docs).

---

## 7. O QUE EU PEDI PARA RESOLVER E ELE NÃO CONSEGUIU (ou entregou meia boca)

1.  **Falha intermitente multiplayer 34568 Regar+Maioria (2ebaee9):** Teste `multiplayer.test.js` falha 1/42 na porta 34568 (Regar + Maioria não sincronizam). Agente investigou com `systematic-debugging`:
    - Consultou SKILL.md + inspecionou repo, verificou instrumentação removida e Git limpo.
    - Analisou helper `once()` (timeout 5s sem `off` → listener fantasma, mas broadcast entrega a todos, não rouba evento) e `sleep(150)` (após newDay no loop d=0..2, antipattern mas d=0 ocorre antes, não explica falha).
    - Criou diagnóstico isolado `diagnostic_repro.mjs` (spawn PORT random + DATA_DIR mkdtemp, logs sent/received, roomCode, sleepVotes, posições 23.5,16.25, world plots, stage) + `analyze_helpers.md`.
    - Executou 100 ciclos isolados sequenciais + 50 carga paralela 5 salas → **100/100 PASS + 50/50 PASS**, não reproduziu falha original. Concluiu que não podia declarar resolvido por 100 PASS e não fez fix especulativo.
    - **Não resolvido:** Falha original continua sem causa raiz reproduzida. Agente não soube transformar "1 falha em 42" em evidência acionável sem aumentar timeouts (proibido).

2.  **Persistência indevida de votos de sono:** Investigado e reproduzido com teste dedicado `repro_persist_clean.mjs` (fora de produção, não commitado):
    - Após `onlyOne` (Alice dorme sozinha 1/2, não avança), `sleepVotes={Alice}` persiste para próxima noite. Na noite seguinte, apenas `Beto` sozinho (`1 novo + 1 velho = 2/2`) avança indevidamente para dia 2 (deveria ficar dia 1).
    - Log: `onlyOne newDay=null day=1 → Beto alone newDay={day:2} day=2 ❌ BUG REPRODUZIDO`.
    - **Não resolvido por decisão:** Usuário disse `Até isso acontecer, eu não aplicaria uma correção especulativa à rega ou ao avanço do dia`. Agente **não aplicou fix** (correto pela regra), apenas documentou. Dificuldade: precisa de aprovação explícita e de mecanismo concreto antes de `room.sleepVotes.clear()` na quebra de noite vs no avanço.

3.  **Pedidos de arte (bodies hand-drawn, roupas, fog, casas, taskbar, retrato):** Múltiplos pedidos desde 2026-10-20 (no-copy, fog/island-feel, casas maiores, 2026-10-21 todos selecionados + 5 masc+5 fem + retrato realístico + hierarquia + pele quadradinhos, 2026-10-21 tard remover Play/PRÉVIA quadrada/taskbar ícones + corpos 2 por estágio). Agente entregou partes (15 bodies, 21 layers, 70px hotbar, ▶ removido) mas usuário considera meia boca porque:
    - Não entendeu que `todos selecionados` = grade simultânea sem auto-pulo, não lista única.
    - Não entendeu `corpos à mão sem nada (bebê genérico + criança M/F + 2 avatares criança M, 2 mulher adulta, 2 velha etc)` = base nude por estágio antes de vestir, não genérico único.
    - Ícones taskbar: aumentou quadrado mas esqueceu escalar ícone proporcional.
    - Retrato: entregou chibi pequeno branco estilo Stardew para mapa, mas usuário queria realístico grande no diálogo (confundiu os dois usos).
    - **Dificuldade:** Pedidos artísticos vagos sem referência visual, sem prompt detalhado, sem medidas px, sem exemplo de pose. Agente não tem capacidade de inferir estilo "qualidade similar mas não cópia" sem imagem base.

---

## 8. DIFICULDADE EXATA QUE O AGENTE TÁ TENDO

1.  **Flaky test:** Não consegue transformar uma falha 1/42 intermitente, dependente de timing/porta compartilhada, em reprodução determinística sem violar regra "não aumentar timeouts/adicionar esperas arbitrárias". Instrumentação muda timing e esconde bug. Precisa de evidência do servidor no momento exato do erro, mas não tem coleta automática quando falha original ocorre em porta fixa 34568 com DATA_DIR compartilhado.
2.  **SleepVotes:** Sabe o fix técnico (limpar `sleepVotes` na virada de noite ou no `time` check, não só no `votes>=needed`), mas está bloqueado por regra `Não declarar resolvido + não fix especulativo até investigação original com evidências`. Não sabe se deve limpar em todo `advanceWorld` ou criar `newDayReset` explícito.
3.  **Arte hand-drawn:** Não tem modelo visual de "bebê genérico + 2 por estágio" nem prompt de imagem detalhado (tamanho canvas, paleta, proporção cabeça/corpo, nº de poses, estilo traço). Recebe "desenhar corpos à mão sem nada" e não sabe se deve gerar via `generate_image`, desenhar via canvas code, ou pedir asset externo.
4.  **Filtragem 5+5:** Não sabe quais 5 masc+5 fem faltam por categoria (nomes, cores, chapéus específicos). `shared/constants.js` tem `BODY_OPTIONS` e `SHIRT/HAT/HAIR` mas sem lista fechada do usuário.
5.  **Comunicação:** Usuário fala informal, agente precisa de prompt estruturado com critério de aceite (`Dado/Quando/Então`). Sem isso, agente adivinha e erra.

---

## 9. TUDO QUE AINDA NÃO FOI FEITO E ESTÁ COM DIFICULDADE OU PROBLEMAS IDENTIFICADOS MAS NÃO RESOLVIDOS

- Limpeza de `sleepVotes` diária correta (ver seção 7.2) — identificado, reproduzido, sem fix aplicado.
- `once()` helper com leak (timeout sem `off`) — code smell, não causa perda mas precisa corrigir com `clearTimeout + off` para não acumular listeners (já documentado em `analyze_helpers.md`, não corrigido em `test/multiplayer.test.js:25`).
- `sleep(150)` condition-based-waiting — antipattern, deveria ser `waitFor(newDay)` com predicate, não `sleep` arbitrário (não corrigido, proibido aumentar timeout).
- Corpos por estágio nude base + vestir/barba (item 2 seção 3) — não iniciado, precisa spec de canvas (ex: 16x32, 4 direções? só frente? paleta pele quadradinhos).
- Completar 5+5 shirts/pants/hats/hair (19 layers faltantes) — não iniciado, precisa lista nomes.
- Fog/island-feel + casas maiores — não iniciado, precisa definição de quais tiles/buildings e quanto maior (ex: escala 1.2x).
- Remover 100% resquícios Play/PRÉVIA quadrada + escalar ícones taskbar proporcional 70px — parcialmente feito.
- Retrato realístico diálogo vs sprite mapa pequeno branco — precisa spec tamanho retrato (ex: 64x64) e estilo (realístico vs chibi).
- Teste de persistência em `test/` permanente (hoje só em `/tmp`) — não commitado, para não poluir PR.

---

## 10. SKILLS EM USO

- **Em uso ativo nesta branch:** `systematic-debugging` (obra/superpowers) — Iron Law, root-cause-tracing, condition-based-waiting. Obriga a não propor fix sem causa raiz, a criar teste reprodutível que falha primeiro, a não aumentar timeouts.
- **Instaladas ociosas (10):** `deploy-to-vercel`, `vercel-cli-with-tokens`, `vercel-composition-patterns`, `vercel-optimize`, `vercel-react-best-practices`, `vercel-react-native-skills`, `vercel-react-view-transitions`, `web-design-guidelines`, `writing-guidelines` (todas em `.agents/skills/`, hash em `skills-lock.json`).
- **Local:** `vale-dev-docs` (`skills/vale-dev-docs/SKILL.md`) — regras do Vale (nunca copiar Stardew, 22px/16px, `buildCustomSpec`, só botão Jogar bege, etc.).

---

## 11. PEDIDO ESPECÍFICO PARA VOCÊ (PRÓXIMA IA)

Com base em tudo acima, gere:

1.  **Prompt único detalhado** que eu possa colar no agente atual, dividido em tópicos numerados, cada tópico com: `Objetivo`, `Contexto`, `Passos`, `Critério de aceite (Dado/Quando/Então)`, `Não fazer`. Inclua um tópico separado para cada item pendente das seções 5, 7, 8, 9 (flaky, sleepVotes, corpos por estágio, 5+5, fog/casas, taskbar, retrato).
2.  **Sugestão de como eu (usuário leigo) posso escrever melhor** meus pedidos de arte/código no futuro (mostre antes/depois: meu jeito informal → jeito detalhado que o agente entende, com exemplo real do projeto).
3.  **Sugestão técnica de solução** para cada bloqueio da seção 8 (ex: como corrigir `once()` + `sleep()` sem violar regra, como implementar limpeza diária de votos, como especificar corpos hand-drawn para geração via canvas ou `generate_image`).
4.  **Checklist de resposta** que eu devo exigir do agente para nunca mais receber meia boca (ex: sempre listar comandos executados, resultados por execução, logs, arquivos modificados, testes não executados).
5.  **Perguntas que ainda faltam** para você fechar o prompt (se precisar de tamanho exato de sprite, paleta, nomes das 5 roupas, etc.).

Não invente causa raiz para a falha 34568. Separe fatos comprovados (100/100 PASS, bug persistência reproduzido) de hipóteses. Respeite: não aumentar timeouts, não declarar resolvido por 100 PASS, só propor correção após mecanismo concreto com teste que falha primeiro.

Branch atual: `arena/629415fb-jogo` PR aberto, não fazer alterações permanentes sem aprovação, trabalho salvo automaticamente por turno.

