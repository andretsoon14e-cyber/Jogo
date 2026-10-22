# Arena: Análise com systematic-debugging — Bug `rebuildModularPick is not defined`

**Consultado via Arena** em `arena/629415fb-jogo` (pr_open):

```bash
npx --yes skills add obra/superpowers --skill systematic-debugging -y --agent universal --json
# => системати-debugging 276fb0a em .agents/skills/systematic-debugging/SKILL.md (project scope)
npx --yes skills use obra/superpowers@systematic-debugging
# => SKILL.md carregado (Iron Law: NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST)
npx --yes skills list --json  # 11 skills agora
```

## Bug escolhido
`client.smoke.test.js` falha com `uncaught: rebuildModularPick is not defined` após `npm install --ignore-scripts` + `node test/client.smoke.test.js`.
Reprodução consistente: 100% (jsdom, ES module scope). Em browser com script não-modular o bug seria mascarado.

## Fase 1: Root Cause Investigation (aplicada)
1. **Read Error Messages Carefully** — SKILL.md § Phase 1.1: não pular erro; anotar stack completa (`client/js/main.js:94 try{rebuildModularPick()}`, linha 236 `sq.onclick => rebuildModularPick()`).
2. **Reproduce Consistently** — executado `node test/client.smoke.test.js` 3×, sempre `uncaught` antes do fix.
3. **Check Recent Changes** — `git log --oneline -5`: `ccc6812 chore(skills)` não tocou `client/`; `2842868` e `2747e47` introduziram modular pick com `window.rebuildModularPick = function(){}`.
4. **Gather Evidence in Multi-Component** — instrumentado: `grep -n rebuildModularPick` em `client/js/main.js` + `client/index.html`; verificado que teste roda como `import()` em Node (ES module) vs browser `window` global. Evidence: em ES module `window.foo = ...` não cria binding léxico.
5. **Trace Data Flow** (SKILL.md + `root-cause-tracing.md`) — backward trace: `sq.onclick` → calls `rebuildModularPick()` (sintoma) → defined as `window.rebuildModularPick` (immediate cause) → assignment ocorre DENTRO de `initLogin()` e só após `createArrowRow` definition; `refreshPreview` definida como `function refreshPreview(){}` funciona → pattern mismatch é a origem.

## Fase 2: Pattern Analysis (aplicada)
1. **Find Working Examples** — `refreshPreview` (function declaration hoisted) funciona; `filteredByGender` idem. `rebuildModularPick` deveria seguir mesmo padrão.
2. **Compare Against References** — `SKILL.md` § Phase 2.2: ler implementação de referência completamente. Comparado `window.rebuildModularPick = function()` vs `function rebuildModularPick()`.
3. **Identify Differences** — diferença única: attachment a `window` vs declaração léxica; ES modules isolam `window`.
4. **Understand Dependencies** — depende de `container`, `SKIN_TONE_OPTIONS`, `BODY_OPTIONS`, `createArrowRow`, `game.skinParts`; tudo existe no closure, só o binding falhou.

## Fase 3: Hypothesis and Testing (aplicada)
**Hipótese única (escrevendo):** “Root cause é `window.` assignment não cria binding léxico em ES module; jsdom `import()` não expõe `window` globals; fix é declarar como `function rebuildModularPick(){}`.”
Teste mínimo: mudar só a linha 215 para `function rebuildModularPick(){` e adicionar `window.rebuildModularPick = rebuildModularPick` (compat). Uma variável por vez.

## Fase 4: Implementation (aplicada)
1. **Create Failing Test Case** — já existe: `test/client.smoke.test.js` falha com `uncaught: rebuildModularPick is not defined` (antes do fix). Não foi criado fix sem teste (Iron Law respeitada).
2. **Implement Single Fix** — `client/js/main.js:215` `window.rebuildModularPick = function(){` → `function rebuildModularPick(){`; linha 253 `try{ window.rebuildModularPick = rebuildModularPick; }catch{}`; Nenhum refactor bundled.
3. **Verify Fix** — `node test/client.smoke.test.js` → `🎉 CLIENTE OK — todos os testes de interface passaram` (45 checks ✅, `Nenhuma exceção não tratada` ✅). Sem quebrar `npm test:all` (multiplayer requer servidor, não afetado).
4. **Question Architecture** — não necessário (<3 fixes); bug isolado.

## Arquivos alterados
- `client/js/main.js` (+8 -3): fix léxico + window expose
- `.agents/skills/systematic-debugging/*` (11 arquivos, +6 em `skills-lock.json`): skill instalada project scope (não mecânica de jogo)
- `package-lock.json` (+4 -4): `jsdom` instalado para reproduzir (devDependency já existente, apenas `npm install --ignore-scripts` para contornar electron cert fail)
- `docs/SKILLS_REPORT.md` não alterado por este fix (mantém relatório original)

## Testes executados
- `node test/client.smoke.test.js` antes: ❌ `uncaught: rebuildModularPick is not defined` (1 falha)
- `node test/client.smoke.test.js` depois: ✅ 45/45, `🎉 CLIENTE OK`
- `npx --yes skills list --json` → 11 skills project (verifica biblioteca não quebrou)
- `grep -n rebuildModularPick client/js/main.js` → 5 ocorrências consistentes agora

## Conclusão biblioteca: ajuda ou precisa ajuste?
**Ajudando de verdade:** Iron Law impediu “quick fix” (`try{}` já mascarava), Phase 1.4 multi-component revelou diferença browser vs jsdom, Phase 2 encontrou `refreshPreview` como referência correta, Phase 4 exigiu teste antes do fix (evitou fix sem prova). Sem SKILL.md, fix provável seria adicionar outro `try{}` (sintoma).
**Ajuste necessário:** `AGENTS.md` ainda lista 9+1 skills (desatualizado após adicionar systematic-debugging); precisa atualizar para 10+1; `skills-lock.json` deve ser commitado; `verification-before-completion` (outra skill obra/superpowers) poderia ser adicionada para fechar Phase 4.3 automaticamente.

