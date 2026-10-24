# PROMPT DE HANDOFF COMPLETO — Vale Aconchegante (2026-10-24)

> **Para quem pega o projeto do zero.** Leia na ordem. Tudo que existe, tudo que
> foi decidido, tudo que está pronto com evidência, e tudo que ainda falta.
> Este documento é a fonte da verdade junto com `docs/PROJECT_STATE.md`.
> Branch de trabalho: `arena/99b3550e-jogo` • HEAD: `85936e6` • Versão: `1.56.0`

---

## 1. O que é o projeto

**Vale Aconchegante** é um jogo cozy 2D de vida/fazenda/RPG **multiplayer**, com
arte original em pixel art, feito em **JavaScript/Node** puro:

- **Servidor**: Express + Socket.IO (`server/server.js`), porta 3000, bind `0.0.0.0`.
- **Cliente**: HTML + Canvas 2D + JS sem framework (`client/`), comunica por socket.
- **Desktop**: Electron (`electron.cjs`, script `npm run electron`) — decisão do usuário.
- **Sem banco externo**: contas/mundos salvos em JSON em `server/data/` (ignorado no git).
- **Sem microtransações**: economia só com ouro do jogo.

Repositório: https://github.com/andretsoon14e-cyber/Jogo
Branch: https://github.com/andretsoon14e-cyber/Jogo/tree/arena/99b3550e-jogo
PR de acompanhamento: https://github.com/andretsoon14e-cyber/Jogo/pull/1

## 2. Glossário mínimo (para quem não é do ramo)

- **Sprite/rig**: o desenho do personagem. Nosso rig nativo é **24×48 px de arte +
  1px de contorno** (= 26×49), desenhado em código por camadas (`client/js/art/rig.js`).
- **Prancha**: imagem grande com vários sprites lado a lado, para aprovação visual
  (estão em `docs/imagens/`).
- **Zoom 2x/8x/12x**: o jogo renderiza o sprite em escala inteira 2x; as pranchas
  ampliam mais para revisar detalhe.
- **Sala (room)**: partida multiplayer; cada sala tem mundo, dia relógio e jogadores.
- **Hotbar**: barra de 8 slots de itens embaixo da tela.
- **Criador de personagem**: tela em grade (sem auto-pulo) com prévia integrada.

## 3. Como rodar e testar

```bash
npm install                 # em sandbox com TLS restrito: npm ci --ignore-scripts
node server/server.js       # sobe o jogo em http://localhost:3000
npm run test:client         # smoke de interface (jsdom, sem browser)
npm test                    # teste multiplayer ponta a ponta (45 asserções)
npm run test:all            # TUDO: cliente + jobs + caverna + multi + votos + movimento + coop + casas
node .work/nb.mjs           # regenera as pranchas de arte em .work/shots/ (Node puro)
```

- O Electron **não baixa o binário** em sandbox com TLS interceptado (falha no
  postinstall). Não afeta a web; afeta só `npm run electron` e builds de exe.
- **Nunca mexa no ícone do exe do Windows sem perguntar antes.**

## 4. Regras fixas do projeto (não negocia)

1. **Nada copiado de Stardew Valley ou de qualquer jogo** — nem sprites, mapas,
   músicas, textos. Referência de **estilo** é permitida; identidade original é
   obrigatória. (Já houve pedido para "copiar o boneco do SDV": foi recusado e
   resolvido atingindo o mesmo *nível de qualidade* com arte própria.)
2. Responder em **português brasileiro informal**, direto, sem condescendência;
   classificar cada tarefa como **CONCLUÍDA / PARCIAL / BLOQUEADA / NÃO INICIADA**
   com evidência, e dizer o que **não** foi testado.
3. **Não declarar corrigido** por inspeção, commit, ZIP ou teste isolado: tem que
   ter teste/verificação real. Não aumentar timeouts nem dormir (`sleep`) para
   esconder flakiness. Teste determinístico que falha primeiro.
4. **Multiplayer/co-op é a prioridade nº 1** de desenvolvimento.
5. Empregos são **escolha livre** (7 empregos), cada um com salário, turno, dias,
   férias, local e tarefas próprias.
6. Expansões **em etapas**, conectadas a economia/mundo/multiplayer — nada solto.
7. Votos de dormir **não vazam** de um dia para o outro; ações importantes são
   validadas no servidor.
8. Emoji **só fora** de preço/recompensa/status (texto corrido pode ter).
9. Preservar trabalho existente; nunca reiniciar nem descartar.
10. Manter `docs/ART_STYLE_GUIDE.md` e `docs/PROJECT_STATE.md` atualizados.
11. Trabalhar **sempre** no branch `arena/99b3550e-jogo`; push só nele; PR a partir dele.

## 5. O que JÁ EXISTE (com evidência)

### Multiplayer / co-op (prioridade 1) — CONCLUÍDO
Salas com mundo compartilhado, sync de posição/plantio/inventário/ouro, chat,
lista de jogadores, relógio do servidor, reconexão com mundo persistido, missões
cooperativas (mutirão de colheita, torneio de pesca, expedição à mina, obras),
doação comunitária. Evidência: `npm test` → **45/45**.

### Votos de dia — CONCLUÍDO
Maioria avança o dia; voto não vaza entre dias. Evidência: `test/sleepvotes.test.js` → **6/6**.

### Empregos — CONCLUÍDO
7 empregos livres: caixa $12, padeiro $14, pescador $10, ferreiro $16, operário
$13, entregador $11, agricultor $12 — cada um com turno, dias, férias, local e
verbos de tarefa. Evidência: `test/jobs.test.js` → **82/82**.

### Caverna — CONCLUÍDO
3 andares, veios de cristal, escadas com gating por cristais. Evidência: **34/34**.

### Casas por jogador — CONCLUÍDO
Construir casa (ouro 1800 + madeira 20 + pedra 15), aluguel de apartamento ($30,
vira dívida sem ouro), permissões de entrada e baú separadas, transferência de
casa, baú interno. Evidência: `test/houses.test.js` → **CASAS OK**.

### Movimento/validação — CONCLUÍDO
Teleporte bloqueado, ações validadas por proximidade. Evidência: **5/5**.

### Cliente / UI — CONCLUÍDO
Capa → login/conta gratuita → criador em **grade sem auto-pulo** com prévia
integrada → jogo. Hotbar de 8 slots com ícone ampliado sem borrar. Painéis:
inventário, loja (5 abas), construção, missões, comunidade, social, mapa,
configurações, NPC (diálogo + presentes). Minimapa. Evidência: `test:client` verde.

### Arte dos personagens — v5, em aprovação
- **24 corpos**: 4 silhuetas por idade × 6 idades (recém-nascido, bebê, criança,
  adolescente, adulto, idoso). Alturas: 10 / 23 / 30 / 39 / 40–43 / 39 px.
  Adultos no topo do rig com variação; crianças nitidamente menores.
- **Rosto** no modelo dos bonecos da referência (estudo de sprites 16×32, arte
  própria): pálpebra escura 1px + fileira de íris/pupila/esclera, **sem nariz**,
  boca 2px, bochecha sólida, sobrancelha suave. Nada de "óculos" ou olho colado.
- **Cabelo**: 26 penteados com franja em zigue-zague, brilho/sombra de 2px,
  mechas na frente, volume atrás — e **penteado reconhecível de costas**
  (rabo/trança com elástico, marias, coque, nuca raspada no undercut).
- **Roupa**: manga como bloco de tom próprio (braço lê em 2x), gola/carcela/
  botões/bolso/punho/cinto com fivela; costas com pala + prega e bolsos traseiros.
  14 designs de camisa, 6 vestidos, 7 chapéus com detalhe de 2px, colar com
  pingente, pulseira com berloque, mão em luvinha com polegar.
- **Pranchas de aprovação** em `docs/imagens/`: `rig-idades`, `rig-adulto`,
  `rig-adolescente`, `rig-crianca`, `rig-bebe`, `rig-recemnascido`, `rig-idoso`,
  `rig-rostos`, `rig-cabelos` (26), `rig-costas` (26 de trás), `rig-chapeus` (7),
  `rig-camisas` (14), `rig-escala` (2x/3x), `rig-no-mapa` (12x).
- Regras de arte escritas em `docs/ART_STYLE_GUIDE.md`.

### Infra de render das pranchas — CONCLUÍDO
Sem Chromium no sandbox: `.work/shim.mjs` (canvas shim + encoder PNG),
`.work/nb.mjs` (pranchas), `.work/pngdec.mjs` (decodifica PNG para estudar
referências). Roda com `node .work/nb.mjs`, determinístico, ~0,5s.
(`.work/` é intencionalmente **não versionado**; as pranchas finais vão para
`docs/imagens/`.)

## 6. O que AINDA FALTA (roadmap honesto)

1. **Aprovação da arte v5** pelo usuário nas pranchas; ajustes finos de penteado/
   chapéu que não lerem bem **dentro do criador no browser** (não testei clique a
   clique nesta rodada).
2. **Retratos 56×56** de diálogo: existem em arte própria, mas precisam de uma
   revisão para conversar com o rosto novo do boneco.
3. **Teste com 2 navegadores reais** (multiplayer visual) e **mobile** — nunca
   testados; só testes automatizados.
4. **Build desktop Electron** (exe/msi): bloqueado por TLS em sandbox; fazer em
   máquina normal. Não mexer no ícone sem perguntar.
5. **Próxima etapa de expansão** (ilha com caverna já existe): decidir com o
   usuário a próxima fatia conectada (ex.: festivais/estações, novos biomas da
   ilha, profundos da caverna) — sempre ligada a economia/mundo/multi.
6. **NPCs premium**: rotinas/diálogos/amizade/quests/consequências existem em
   nível funcional (painel, presentes, missões); aprofundar consequências
   visíveis e variação de corpo dos NPCs.
7. **Projetos comunitários com mudança visível no mapa**: painel e progresso
   existem; a mudança visual no mundo após concluir ainda é parcial.
8. Manter este documento + `docs/PROJECT_STATE.md` + `docs/ART_STYLE_GUIDE.md`
   atualizados a cada entrega.

## 7. Como trabalhar aqui (ritmo de entrega)

1. Leia `docs/PROJECT_STATE.md` e este prompt antes de tocar em código.
2. Mudança de arte: edite `client/js/art/rig.js`, rode `node .work/nb.mjs`,
   **olhe** as pranchas geradas (read_file na imagem), itere até ler bem em 2x.
3. Toda mudança lógica: teste determinístico que falha antes e passa depois.
4. Rode `npm run test:all` antes de commitar. Commit descritivo em PT-BR,
   push só em `arena/99b3550e-jogo`.
5. Responda ao usuário em PT-BR informal com tabela CONCLUÍDO/PARCIAL/... e o
   que não foi testado. Apresente pranchas para aprovação antes de integrar
   muito asset novo; evite quase-duplicados.

## 8. Números que importam (conferir antes de afirmar)

- Testes: cliente OK • jobs 82/82 • caverna 34/34 • multiplayer 45/45 •
  votos 6/6 • movimento 5/5 • coop 9/9 • casas OK.
- Economia co-op: 30 colheitas/$400, 15 peixes/$420, 25 pedras/$450, 1000 doação/$500.
- Opções do criador: 24 corpos, 26 cabelos, 8 cores de olho, tons de pele,
  14 camisas, calças/saias, 7 chapéus, colares, pulseiras.
- HUD/mapa: fazenda x12–24 y≥30; bairro x27–57 y26–45; centro x25–56 y6–30.

---

*Gerado em 2026-10-24 a pedido do usuário, para passagem de contexto a quem
nunca viu o projeto. Dúvida sobre regra? A seção 4 manda.*
