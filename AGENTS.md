# AGENTS.md — Vale Aconchegante (Jogo)

Este arquivo orienta agentes de código trabalhando neste repositório.

## Stack e comandos
- Node 22.22.3 + Express 4 + Socket.IO 4 (server/server.js, shared/constants.js)
- `npm start` / `npm run dev` — servidor (porta 3000)
- `npm test` / `npm run test:all` — multiplayer + smoke client
- Branch de trabalho: `arena/*` — não alterar `main` direto; PR #1 aberto

## Agent Skills — como consultar

Skills são instruções reusáveis instaladas via `npx skills` (vercel-labs/skills 1.7.4, Node >=22.20).

### Instaladas neste projeto (scope `project`, commitadas)
Local: `.agents/skills/<nome>/SKILL.md` (padrão `Universal`/`Amp`/`Cursor`/`Codex` compartilhado em `.agents/skills`).
Listar: `npx skills list --json` ou `npx skills ls --json -a universal`
Verificar atualizações: `npx skills check`
Atualizar: `npx skills update -y`
Remover: `npx skills remove <nome>`

Instaladas agora (9 via `vercel-labs/agent-skills` + 1 local):
- `deploy-to-vercel`, `vercel-cli-with-tokens`, `vercel-composition-patterns`, `vercel-optimize`, `vercel-react-best-practices`, `vercel-react-native-skills`, `vercel-react-view-transitions`, `web-design-guidelines`, `writing-guidelines`
- `vale-dev-docs` (local em `skills/vale-dev-docs/SKILL.md` — padrão explícito, não depende do instalador)

### Como um agente deve usar
1. Ler `npx skills list --json` para ver nomes/descrições disponíveis (só nome+descrição carregam por padrão).
2. Quando a tarefa casar com a descrição, ler o `SKILL.md` completo correspondente antes de agir.
3. Para skills de fora sem instalar: `npx skills use <origem>@<skill> | claude` ou `npx skills use vercel-labs/agent-skills@vercel-optimize --agent claude-code`
4. Biblioteca reusável externa: se um segundo repo `skills` for criado (ex.: `andretsoon14e-cyber/vale-skills`), instalar com `npx skills add andretsoon14e-cyber/vale-skills --skill <nome> -y --agent universal`

### Formato oficial (Agent Skills spec)
`SKILL.md` com frontmatter:
```markdown
---
name: my-skill
description: O que faz e quando usar
---

# My Skill
Passos...
```
Descoberta: `skills/<nome>/SKILL.md`, `skills/<cat>/<nome>/SKILL.md` ou `skills/<cat>/<cat>/<nome>/SKILL.md` (até 3 níveis), ou raiz `SKILL.md`. Ver `docs/creating-skills.md` e https://agentskills.io .

### Fallback explícito (sem instalador)
Se o instalador não estiver disponível (egress bloqueado ou Node <22.20), use o `SKILL.md` em `skills/<nome>/SKILL.md` diretamente — ele segue o mesmo formato e pode ser comitado. Exemplo atual: `skills/vale-dev-docs/SKILL.md` documenta tamanhos de sprite (22px/16px), BODY_OPTIONS 15, cache de characters.js e regra “só botão Jogar”.

## Padrões do jogo (não quebrar)
- Corpos chibi hand-drawn 16×32 `body_*.png` (15) + layers 21 — manter asset mapping em `shared/constants.js` (`hairAsset`/`hatAsset` + `buildCustomSpec`).
- Filtro gênero masc/fem/uni (5+5 por categoria) e 70+ previews additive.
- NPC 16 profissões dual `NPC_SPECS` com tier 0.70/0.88/1.0-1.08.
- UI: só botão beige Jogar; sem wood Play, sem ▶, sem PREVIEW quadrada; hotbar 70px.

