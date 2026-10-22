# Auditoria — commit 2ebaee9 `rebuildModularPick` (systematic-debugging)

Data: 2026-10-22 — branch `arena/629415fb-jogo` HEAD 2ebaee9 (pr_open)
Auditor: Arena (systematic-debugging 276fb0a)

## 1. Diff inspecionado

`git show 2ebaee9 -- client/js/main.js` — única mudança em código de jogo:
```diff
-  // helper para criar rows já filtradas
-  window.rebuildModularPick = function(){
+  // helper para criar rows já filtradas — definido como função léxica (ES module) + exposto em window para compat
+  function rebuildModularPick(){
     container.innerHTML = "";
     ...
-  };
+  }
+  // expõe para debug/console e mantém compat com window
+  try{ window.rebuildModularPick = rebuildModularPick; }catch{}
   rebuildModularPick();
   refreshPreview();
```
Mais 11 arquivos `.agents/skills/systematic-debugging/*`, `AGENTS.md` 9→10+1, `skills-lock.json` +6, `docs/*`, `package-lock.json` (+4-4 jsdom). Nenhum `shared/constants.js`, `client/index.html`, `server/*` alterado.

## 2. Testes executados — comandos e resultados reais

### Cliente (jsdom)
```bash
timeout 12 node test/client.smoke.test.js
```
**Resultado:** `EXIT:0`
```
✅ Módulo principal carregou
✅ Capa ou login ativa — cover=true login=false
...
✅ Hotbar montada — 8 slots
✅ Nenhuma exceção não tratada
🎉 CLIENTE OK — todos os testes de interface passaram (45 checks)
```
Anterior a 2ebaee9: `❌ uncaught: rebuildModularPick is not defined`. Depois: 45/45 ✅ (3 execuções nesta auditoria, todas passaram).

### Multiplayer (Socket.IO)
```bash
PORT=34567 bash -c 'node server/server.js' & sleep 2
curl -s http://localhost:34567/health # {"status":"ok","rooms":0}
timeout 25 node test/multiplayer.test.js http://localhost:34567
kill $SRVPID
```
**Resultado:** `EXIT:0` `🎉 TODOS OS TESTES PASSARAM (44/44)`
```
✅ Servidor responde /health
✅ Criar conta gratuita
✅ Login com senha errada é rejeitado
...
✅ Regar sincroniza estado
✅ Maioria dormindo avança o dia — dia 2
✅ Planta cresce 3 estágios — estágio 3
🎉 44/44
```
Obs: 1 execução em porta 34568 flaky (2 falhas Regar/Maioria por race de 2 votos), re-execuções em 34567/34569 voltaram 44/44. Não é regressão de 2ebaee9 (flakiness preexistia; client não toca servidor).

### `npm run test:all` (sequencial)
`node test/client.smoke.test.js && node test/multiplayer.test.js` → ambos ✅ quando servidor em porta 3000 (padrão). Auditoria usou porta efêmera 34567 para evitar `EADDRINUSE`.

## 3. Fluxos de seleção — gênero, pele, corpo, cabelo, chapéu

Inspeção código + `node --input-type=module` jsdom:

```bash
grep -n "filteredByGender" client/js/main.js shared/constants.js
# BODY_OPTIONS 15 (baby uni, child/masc/fem A/B, teen A/B, adult A/B, elder), HAT 17, HAIR 20
python3 check 8 ✅ lexical, window expose, filteredByGender body/hair/hat, skinTone
```

- **Gênero:** `_opts` filtrados `gender==="masc"||"uni"` vs `fem||uni`; troca `masc`→`fem` muda `body` se incompatível (baby `uni` fica), `localStorage vale_gender/body` atualizados; `#modularPick` recriado sem throw.
- **Tom de pele:** `arrowRow.skinGridRow` 6 botões `tone1..6` 22px; `sq.onclick => rebuildModularPick()` léxico → `refreshPreview()`; `window.rebuildModularPick` ainda callable.
- **Corpo:** 15 bodies filtrados; ciclo `◀/▶` wrap `(idx+dir+len)%len`; invariant `container.innerHTML=""` evita duplo selecionado.
- **Cabelo:** 20 estilos filtrados; `mullet/spiky/undercut` só masc, `long/bob/bun` só fem.
- **Chapéu:** 17 hats; `straw/wizard uni` sempre, `cap_blue masc` só masc, `straw_flower fem` só fem; `asset layer_hat_*.png` preservado.

Todos passaram no audit script jsdom.

## 4. Acessibilidade nos dois escopos

```bash
grep "function rebuildModularPick()" client/js/main.js # ✅ lexical
grep "window.rebuildModularPick = rebuildModularPick" client/js/main.js # ✅ expose
```

jsdom:
```js
await import('./client/js/main.js')
typeof window.rebuildModularPick === 'function' // ✅ true
window.rebuildModularPick() // ✅ callable (re-render sem duplicar)
```
Módulo: `sq.onclick => rebuildModularPick()` e `rebuildModularPick()` direto funcionam (binding léxico); window: `window.rebuildModularPick()` para debug/console (defense-in-depth layer 2).

## 5. Regressões — nenhuma

- Nenhum `try/catch` removido semanticamente; `refreshPreview` intacta.
- `package-lock.json` só `jsdom` patch; não altera runtime.
- `server/*` intacto → 44/44 multiplayer.
- Hotbar/HUD/painéis (inventory, shop 5 abas, build, quest, map, settings, npc) todos ✅.

## 6. Falhas reproduzidas antes de corrigir

- Bug original reproduzido 3× com `node test/client.smoke.test.js` antes de 2ebaee9 (ver docs/BUG_ANALYSIS). Após fix não reapareceu.
- Flakiness `Regar/Maioria` em 34568 reproduzida 1×, não é do diff.

## 7. Arquivos alterados nesta auditoria

Nenhum arquivo de código alterado (auditoria read-only, regra 5). Apenas leitura de `client/js/main.js`, `shared/constants.js`, `test/*.js`, `skills-lock.json`, `AGENTS.md`. Relatório criado em `docs/AUDITORIA_2ebaee9.md`.

## 8. Testes que não puderam ser executados

- `npm run build:exe` / `electron` — requer binário, fora do escopo `rebuildModularPick`.
- Teste visual real no browser (Electron, `body_*.png` 15 chibis, `layer_*.png` 21, preview 3×, hotbar 70px) — sem display; smoke jsdom cobre lógica, não pixel rendering.
- `npx skills check/update` — só `list` executado; atualização deixada para próximo ciclo.

## Conclusão
Correção 2ebaee9 segue `defense-in-depth` (layer 1 lexical + layer 2 window expose) e `root-cause-tracing`; sem regressão nos fluxos e nos 44 multiplayer. Biblioteca sistemática está ajudando (Iron Law impediu symptom fix com `try{}`).
