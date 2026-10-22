# Relatório — Biblioteca reusável Agent Skills (Vale Aconchegante)

Data: 2026-10-22 — branch `arena/629415fb-jogo` (ccc6812) — PR #1 OPEN https://github.com/andretsoon14e-cyber/Jogo/pull/1

## 1. Comandos executados

**Ambiente (E2B iu4lsmh8ipubdge2jzgu0)**
```bash
pwd; ls -la /home/user/Jogo
env | sort
which git gh node npm npx; ls /usr/local/bin
git remote -v; git branch -a; cat Jogo/package.json
ls Jogo/.claude Jogo/.cursor Jogo/.github Jogo/docs
gh api user/repos --jq '.[].full_name'  # só andretsoon14e-cyber/Jogo
gh search repos --owner andretsoon14e-cyber skills  # []
npm view skills  # 1.7.4 MIT tar https://registry.npmjs.org/skills/-/skills-1.7.4.tgz deps tar+yaml
npm view @vercel/skills  # 404
npx --yes skills --help  # 1.7.4 ok
npx --yes skills list --json  # [] antes
npx --yes skills experimental_sync --dry-run  # Nothing to sync
```

**Docs oficiais (via egress permitido github.com/api.github.com)**
```bash
gh api repos/vercel-labs/skills/contents/README.md --jq '.content' | base64 -d
gh api repos/vercel-labs/skills/contents/docs/creating-skills.md --jq '.content' | base64 -d
gh api repos/vercel-labs/skills/contents/docs/agents.md --jq '.content' | base64 -d
gh api repos/vercel-labs/skills/contents/docs/commands.md --jq '.content' | base64 -d
gh api repos/vercel-labs/agent-skills/contents/skills --jq '.[].name' # 9 skills
node -v # v22.22.3 (requere 22.20+ OK)
```

**Instalador — compatibilidade Arena + projeto**
```bash
npx --yes skills add vercel-labs/agent-skills --list -y --json  # teste detecção
# 1ª tentativa fora de Jogo falhou de escopo (instalou em ~/.agents) — rm -rf ~/.agents
cd Jogo && npx --yes skills add vercel-labs/agent-skills -y --agent universal --json  # OK clone github
ls -la .agents/skills  # 9 dirs
cat .agents/skills/vercel-optimize/SKILL.md | head -n 15  # frontmatter name/description ok
npx --yes skills list --json  # 10 (9 + 1 local fallback)
```

**Fallback explícito + instrução**
```bash
mkdir -p skills/vale-dev-docs
cat > skills/vale-dev-docs/SKILL.md  # formato oficial name/description + regras 22px/16px/BODY_OPTIONS
cat > AGENTS.md  # só após verificar que .agents/skills é padrão Universal/Amp/Cursor (docs/agents.md) e que Jogo não tinha AGENTS.md
git add AGENTS.md skills/ skills-lock.json .agents/
git commit -m "chore(skills): ..."
git push origin arena/629415fb-jogo  # 2842868..ccc6812
```

## 2. Arquivos criados/alterados

- `AGENTS.md` (novo, 3.1K) — orienta agente, lista skills, explica consulta e formato agentskills.io, documenta fallback.
- `.agents/skills/*` (9 skills commitadas, 302 arquivos) — cópia via instalador em scope `project`:
  `deploy-to-vercel`, `vercel-cli-with-tokens`, `vercel-composition-patterns`, `vercel-optimize`, `vercel-react-best-practices`, `vercel-react-native-skills`, `vercel-react-view-transitions`, `web-design-guidelines`, `writing-guidelines`
- `skills-lock.json` (novo, 59 linhas) — lock do instalador.
- `skills/vale-dev-docs/SKILL.md` (novo, 25 linhas) — skill local explícita do jogo (não precisa instalador), segue mesmo formato e guarda regras: não copiar Stardew 1:1, 15 bodies 16×32 + 21 layers, BODY_OPTIONS/HAT/HAIR asset mapping, NPC_SPECS 0.70/0.88/1.0, só botão Jogar bege, hotbar 70px.
- Nenhum arquivo `client/`, `server/`, `shared/` alterado neste commit (verificado `git diff --cached --name-only` sem match).

## 3. Verificações

- `npx skills list --json` antes: `[]` (0). Depois: 10 skills `scope project` (paths `/home/user/Jogo/.agents/skills/*` e `/home/user/Jogo/skills/vale-dev-docs`). Prova: output JSON com name/path/scope.
- Frontmatter validado: `---\nname: vale-dev-docs\ndescription: ...` idêntico ao spec; `vercel-optimize` exemplo com 322 linhas legível.
- `AGENTS.md` verificado inexistente antes (`ls` falhou) e `.agents` inexistente antes — só criado após checar `docs/agents.md` (tabela: Amp/Replit/Universal `.agents/skills/`, Claude `.claude/skills/`, etc). Escolhido `.agents/skills` + `AGENTS.md` (reconhecido por 75 agentes, genérico Arena).
- Instalador compatível: Node 22.22.3 >=22.20, egress `github.com`/`registry.npmjs.org` liberado (clone + npm view ok), `experimental_sync --dry-run` funciona, `add --agent universal -y --json` sem prompt.
- Push verificado: `git push origin arena/629415fb-jogo` 2842868..ccc6812 OK. PR segue OPEN.

## 4. Como consultar as skills

1. `npx skills list --json` ou `npx skills ls --json -a universal` — vê nome+descrição (carregamento lazy).
2. Ler ` .agents/skills/<nome>/SKILL.md` (instaladas) ou `skills/<nome>/SKILL.md` (fallback) quando descrição casar com tarefa.
3. Sem instalar: `npx skills use vercel-labs/agent-skills@vercel-optimize --agent claude-code` ou pipe `| claude`.
4. Biblioteca externa futura: `npx skills add andretsoon14e-cyber/vale-skills --skill <nome> -y --agent universal` (mesmo padrão). Atual `vale-dev-docs` já demonstra reuso entre repos sem publicar pacote.

## 5. Limitações / não declarado completo sem evidência

- **Sem segundo repo de biblioteca ainda**: `gh api user/repos` e `gh search repos owner:andretsoon14e-cyber skills` retornam só `Jogo`; sem `skills-lock.json` prévio e sem diretório `skills/` no remote. Instrução diz “contém, ou conterá” — tratado como ainda não criado; criado exemplo local `skills/vale-dev-docs` como modelo reusável e deixado instrução para `andretsoon14e-cyber/vale-skills` futuro. Não há o que analisar de válido além dos 9 skills de demo.
- `skills` não está global (`~/.agents` removido) — scope `project` exige commit; `skills-lock.json` commitado garante `experimental_install`.
- PR #1 não mergeado automaticamente: novo commit empurrado requer re-verificação do jogo (v1.54.0 + skills). Merge pendente a seu critério (`gh pr merge 1 --merge`).
- Integração completa exigiria publicar `vale-skills` separado e adicionar `skills` field em `package.json` para `experimental_sync` de npm — fora do escopo sem segundo repo existente.
