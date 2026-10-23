# Estado do Projeto — Vale Aconchegante

Atualizado: **2026-10-23 (3)** • branch `arena/99b3550e-jogo` • servidor em `node server/server.js` (porta 3000)

> Documento anterior (2026-10-22) descrevia bases PNG e hotbar com `transform: scale`. Nada disso existe mais. O que está abaixo foi conferido no código e em execução.

## Classificação das tarefas

| # | Tarefa | Status | Evidência |
|---|--------|--------|-----------|
| 1 | Hotbar com ícones grandes e nítidos | **CONCLUÍDA** | `iconTag(id,64)` em `ui-binding.js`, `.slot` 76 / `.icon` 66 / `img` 64 em `style.css`, sem `transform`. Os PNGs de foice/picareta/machado foram removidos de `icons.js` — eram eles que deixavam 3 ícones borrados. Evidência visual: `.work/shots/game2.png`. |
| 2 | Retratos de diálogo em pixel art própria | **CONCLUÍDA** | `client/js/art/portrait.js` desenha arte 56×56 (não é o sprite do mapa ampliado); exibição 112 (2×) no painel e 168 (3×) na prancha. Moldura + placa de nome em `ui-binding.js`. Evidência: `.work/shots/portraits.png` (20 NPCs) e `.work/shots/dialogue.png` (painel real com Larissa). |
| 3 | Duas bases por idade | **CONCLUÍDA (aguardando seu ok visual)** | `BODY_OPTIONS` tem 12 corpos (2 por idade, todos `uni`), desenhados pelo rig. `client/proposta-idades.html` mostra as 12 com zoom e caminhada. Detalhes em `docs/BASES_MATRIZ.md`. |
| 4 | Roupas — variedade por categoria | **CONCLUÍDA (números), PARCIAL (revisão)** | Camisa 16 (8F/7M/1U), Calça-saia 16 (7F/7M/2U), Chapéu 17 (6F/7M/4U), Cabelo 20 (11F/7M/2U). Meta de ~5 por gênero batida. Proposta em `docs/PROPOSTA_ROUPAS.md`. |
| 5 | Criador em grade, sem auto-pulo | **CONCLUÍDA** | 10 abas, opções em grade (`minmax(74px,1fr)`), prévia ao lado, clique marca a opção e não avança sozinho. Coberto por teste (`test/client.smoke.test.js`). |
| 6 | Retrato sem emoji e estação fora da arte | **PARCIAL** | `.portraitSeason` desativado; estação virou `.seasonChip` ao lado do nome. Botões de animal agora usam ícone próprio e "Casas & Família" perdeu o 🏠. **Ainda há emoji em painéis internos** (💰 em preços/recompensas, ✅ em missões, 🏠 em textos de interior) — 108 ocorrências em `ui.js`, 20 em `main.js`. HUD, hotbar, inventário e criador estão limpos. |
| 7 | Versão cliente/servidor coerente | **CONCLUÍDA** | `index.html` usa o token `__APP_VERSION__`; `server.js` injeta a versão do `package.json` (agora 1.55.0) em `/` e no fallback. `fs` estava sem import e a leitura falhava em silêncio (servidor sempre dizia 1.16.0); corrigido. `curl /api/version` → `{"version":"1.55.0"}`; console do navegador sem o aviso "HTML em cache". |
| 8 | Votos de descanso não vazam para o dia seguinte | **CONCLUÍDA (teste de regressão criado)** | `test/sleepvotes.test.js`: 3 jogadores, dois dias, sincronizado por eventos (sem `sleep` arbitrário). Passa 6/6 em 3 execuções seguidas. O bug descrito no handoff **não se reproduz neste HEAD** — `advanceWorld()` limpa `sleepVotes` e `leavePlayer()` remove o voto de quem sai. |
| 9 | Documentação atualizada | **CONCLUÍDA** | Este arquivo + `docs/ART_STYLE_GUIDE.md` + `docs/BASES_MATRIZ.md` reescritos em 2026-10-23. |
| 10 | Proporções por idade com alturas distintas | **CONCLUÍDA** | Tabela explícita `VARIANT_SHAPE` no rig: recém-nascido 6px, bebê 12–13, criança 17–19, adolescente 21–23, adulto 26/29, idoso 24/25. Coberto por 7 asserções novas em `test/client.smoke.test.js`. Prancha: `.work/shots/rigsheet.png`. |
| 11 | Servidor valida movimento (anti-teleporte) | **CONCLUÍDA** | `server.js` limita a 9 tiles/s + 1,2 de folga; excedente é aparado e a posição do servidor prevalece no `checkDistance` das ações. Viagem/entrar em casa marcam `tpUntil`. Teste `test/movement.test.js` (5/5) e casos de uso no multiplayer ajustados para caminhar de verdade. |
| 12 | Trabalhar em qualquer área, com troca livre | **CONCLUÍDA** | 7 áreas em `shared/careers.js` (caixa, padeiro, pescador, ferreiro, operário, entregador, agricultor). `applyJob` agora troca de área sem exigir demissão e guarda `jobHistory`. Teste `test/jobs.test.js` (82/82) valida salário, turno, escala, férias, local existente e tarefas com itens reais. |
| 13 | Emoji fora dos pontos importantes | **CONCLUÍDA (HUD/painéis de sistema)** | Preço/recompensa/status agora usam ícones desenhados (moeda, estrela, check). Abas da loja, emprego, agenda e dormir limpos. Sobra emoji em textos narrativos de NPC/missão — proposital por enquanto. |
| 14 | Caverna: 3 andares ligados ao vale | **CONCLUÍDA (andares 1 e 2 jogados de ponta a ponta)** | Vale → Mina → `caverna1` → 3 cristais → `caverna2` → volta → vale, com cliques reais no navegador. `test/cave.test.js` 34/34. Andar 3 existe e é gerado/testado por unidade, mas não foi percorrido no cliente. |
| 15 | Cristal só sai de veio e some do mapa | **CONCLUÍDA** | Clique no veio com picareta → tile vira piso, +1 cristal, XP 18, aviso para a sala; o `tileUpdate` agora leva `region` e atualiza o mapa da região certa no cliente (antes caía sempre no vale). Confirmado com 2 navegadores: quem não minerou viu o veio sumir. |
| 16 | Escadas entram/saem de verdade | **CONCLUÍDA** | Corrigido `travelCave()`: descer e subir caíam no mesmo teste de "andar anterior" e sempre respondiam "Para subir, use a escada do andar". Agora entrar, descer, subir e sair têm regras separadas (proximidade + cristais). A escada funciona por clique (até 2,6 tiles) ou pela tecla F em cima dela. Teste determinístico cobre os 4 caminhos. |
| 17 | Clique e colisão coerentes com o desenho | **CONCLUÍDA** | `screenToWorld`/`worldToScreen` usavam 32px fixo enquanto o mundo é desenhado com `TS = 75.2`; cliques/hover caíam longe do alvo. O renderer agora publica `game.view` (overworld) e `game.viewInterior` (casa/loja) e a conversão usa a mesma transformação. Hitbox do jogador recentrada (0,40 × 0,40 em volta dos pés) — corredores de 1 tile da caverna e passagens do vale ficaram transitáveis sem atravessar prédios. |
| 18 | Sincronização de jogadores entre regiões | **CONCLUÍDA** | `playerMoved` leva `region` e o cliente ignora pacote de outra região; `playerRegionChanged` aplica x/y. Antes, quem entrava na caverna continuava aparecendo na posição do vale para os outros. Aviso duplicado "Chegou em..." removido. |

## Testes (executados agora)

```
npm run test:client  -> 🎉 CLIENTE OK
node test/jobs.test.js -> 🎉 TRABALHOS OK (82/82)
node test/cave.test.js -> 🎉 CAVERNA OK (34/34)
npm test             -> 🎉 TODOS OS TESTES PASSARAM (44/44)
node test/sleepvotes.test.js -> 🎉 VOTOS DE DESCANSO OK (6/6)
node test/movement.test.js   -> 🎉 MOVIMENTO OK (5/5)
node test/coop.test.js       -> 🎉 CO-OP OK (9/9)
```

Scripts: `npm run test:all` roda todos nessa ordem (cliente, trabalhos, caverna, rede, votos, movimento, co-op); `npm run test:cave` só a caverna; `npm run test:net` só os de rede.

## O que NÃO foi testado

- Jogo com 4+ jogadores simultâneos em rede real (só local, 2–3 conexões).
- Save/load após reinício do servidor com múltiplos quartos ativos.
- Telas de celular reais (só viewport reduzido no Chromium).
- Seasons/festivais de ponta a ponta (existem no código, sem teste automatizado).
- Andar 3 da caverna no cliente (o servidor e o gerador estão cobertos; falta jogar o caminho `caverna2 → caverna3`, que pede 8 cristais).
- Pesca no lago subterrâneo do andar 2, dormir dentro da caverna e ver o ciclo de dia/noite lá dentro.
- Partículas de mineração e brilho dos cristais em telas de celular.

## Pendências / decisões em aberto

1. **App desktop em C#** — o usuário respondeu que quer um app desktop. Hoje existe `electron.cjs` + `build:exe`. Antes de criar qualquer coisa em C# preciso confirmar: launcher que abre o navegador, ou installer nativo? Enquanto isso, o caminho Electron continua funcionando.
2. **NPC premium (médico, bombeiro) fora do padrão 16×32** — aguardando: o usuário preferiu manter o rig atual com alturas variando dentro de 16×32 (feito). NPC maior exigiria outro pipeline de arte.
3. **Arte do exe do Windows** — intocada, como pedido.

## Próximo foco combinado com o usuário

Ordem: **multiplayer/co-op primeiro**, depois NPCs+vila junto com o loop da fazenda, depois a ilha com caverna e novas áreas por progressão. Mundo começa com **uma ilha só** (com caverna) e cresce.
