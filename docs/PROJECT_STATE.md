# Estado do Projeto — Vale Aconchegante

Atualizado: **2026-10-23** • branch `arena/99b3550e-jogo` • servidor em `node server/server.js` (porta 3000)

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
| 7 | Versão cliente/servidor coerente | **CONCLUÍDA** | `index.html` usa o token `__APP_VERSION__`; `server.js` injeta a versão do `package.json` (agora 1.54.0) em `/` e no fallback. `fs` estava sem import e a leitura falhava em silêncio (servidor sempre dizia 1.16.0); corrigido. `curl /api/version` → `{"version":"1.54.0"}`; console do navegador sem o aviso "HTML em cache". |
| 8 | Votos de descanso não vazam para o dia seguinte | **CONCLUÍDA (teste de regressão criado)** | `test/sleepvotes.test.js`: 3 jogadores, dois dias, sincronizado por eventos (sem `sleep` arbitrário). Passa 6/6 em 3 execuções seguidas. O bug descrito no handoff **não se reproduz neste HEAD** — `advanceWorld()` limpa `sleepVotes` e `leavePlayer()` remove o voto de quem sai. |
| 9 | Documentação atualizada | **CONCLUÍDA** | Este arquivo + `docs/ART_STYLE_GUIDE.md` + `docs/BASES_MATRIZ.md` reescritos em 2026-10-23. |
| 10 | Multiplexação de estado / flaky 1/42 | **NÃO INICIADA** | Falha histórica nunca reproduzida; sem alteração. |

## Testes (executados agora)

```
npm run test:client  -> 🎉 CLIENTE OK (todas as asserções)
npm test             -> 🎉 TODOS OS TESTES PASSARAM (44/44)
node test/sleepvotes.test.js -> 🎉 VOTOS DE DESCANSO OK (6/6)   [3x seguidas]
```

Scripts: `npm run test:all` roda cliente + multiplayer + votos de descanso, nesta ordem.

## O que NÃO foi testado

- Jogo com 4+ jogadores simultâneos em rede real (só local, 2–3 conexões).
- Save/load após reinício do servidor com múltiplos quartos ativos.
- Telas de celular reais (só viewport reduzido no Chromium).
- Seasons/festivais de ponta a ponta (existem no código, sem teste automatizado).

## Pendências / decisões em aberto

1. **"Arquivos/sistemas em C#"** — o projeto é 100% JavaScript (Node + Canvas + Socket.IO). Não existe nenhum `.cs` no repositório. Preciso saber se essa linha veio de outro contexto antes de mexer em qualquer coisa.
2. **NPC premium (médico, bombeiro) fora do padrão 16×32** — o rig atual só desenha até 33px de altura. Fazer NPC maior exigiria outro pipeline de arte; não comecei.
3. **Arte do exe do Windows** — intocada, como pedido.
