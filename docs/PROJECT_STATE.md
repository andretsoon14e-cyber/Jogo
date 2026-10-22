# Estado do Projeto — Vale Aconchegante (arena/629415fb-jogo)

Atualizado: 2026-10-22 — PR aberto, HEAD 1d1c55e

## Decisões Confirmadas (Prompt Mestre Atualização Oficial)
- HUD/hotbar: ícones ocuparem containers 70-80px, causa é desenho útil < arquivo, não ícone .exe.
- Retratos: pixel art detalhada 64x64 ref, exibição ~112px, maior que sprite mapa, sem realismo.
- Bases: agente propõe melhor organização, hipótese 9 bases (1 bebê + 2x4 estágios), auditar 15 existentes.
- Roupas: proposta obrigatória nomes/cores/estilos antes da produção, 5 masc+5 fem por categoria (meta 40, existente 21 layers), sem inventar 19 faltantes antes de auditoria.
- Documentação persistente em `docs/ART_STYLE_GUIDE.md` + `docs/PROJECT_STATE.md`, não só memória interna.
- Regra execução: não reiniciar, não descartar, auditorias primeiro, classificar CONCLUÍDA/PARCIAL/BLOQUEADA/NÃO INICIADA com evidência.

## Classificação Atual das Tarefas

| # | Tarefa | Status | Evidência / Pendência |
|---|--------|--------|------------------------|
| 1 | HUD e hotbar — ícones proporcionais | **PARCIAL — FIX APLICADO** | Fix aplicado: CSS `.slot .icon img 68x68` + CSS `.slot .icon 70x70` + JS `icon div 70x70 / img 68x68` (era 60). Causa confirmada padding interno asset 16x16. Pendente validar em execução com `npm start` (hotbar 80x80, ícone 68 preenchendo, sem esticar/borrar, madeira/pergaminho mantido). |
| 2 | Retratos diálogo pixel art | **PARCIAL — AUDITORIA FEITA** | Dimensões nativas 64x64 ref, exibição 112px (`ui.js:560`), render via `npcPortrait` canvas com `image-rendering pixelated`. Falta spec enquadramento/paleta e validar sem borrão na interface real. |
| 3 | Bases corporais — matriz 9 bases | **PARCIAL — INVENTÁRIO FEITO** | 15 bodies: baby_generic 1, child M2/F2, teen M2/F2, adult M2/F2, elder M1/F1. Faltam elder_masc_B/fem_B para 9 hipótese. Proposta visual pendente, folha contato/prévia pendente. |
| 4 | Roupas — proposta antes produção | **PARCIAL — PROPOSTA ENVIADA** | Inventário auditado: HAT 17(3 PNG), SHIRT 16(2), PANTS 16(5), HAIR 20(6), BODY 15, assets 21. Lacunas: sem PNG = procedural cor. Proposta 20 nomes/cores/estilos enviada em `docs/PROPOSTA_ROUPAS.md` aguardando sua revisão antes de produzir PNG finais — sem duplicação, filtros mantidos. |
| 5 | Documentação persistente | **CONCLUÍDA** | `docs/ART_STYLE_GUIDE.md` e `docs/PROJECT_STATE.md` criados 2026-10-22 com preferências (comunicação informal, agente propõe, pixel art acolhedora, etc.). |
| 6 | Regra execução / auditoria repo | **PARCIAL** | Spec atualizada, branch arena/629415fb-jogo preservada, sem descarte. Falha flaky 34568 1/42 e bug persistência sleepVotes documentados em `PROMPT_PARA_PROXIMA_IA.md` + `repro_persist` log, sem fix especulativo aplicado. |

## Inventário Verificável

**Bodies (15):**
- `body_baby_generic.png`, `body_child_masc_A/B`, `body_child_fem_A/B`, `body_teen_masc_A/B`, `body_teen_fem_A/B`, `body_adult_masc_A/B`, `body_adult_fem_A/B`, `body_elder_masc_A`, `body_elder_fem_A`
- Reaproveitáveis: todos 15. Ausentes confirmados: `body_elder_masc_B.png`, `body_elder_fem_B.png` (para 9 hipótese; se matriz for 9 bases com 2 variações cada, total teórico 9, mas contagem atual 15 indica variações já excedem hipótese — ver auditoria).

**Layers (21):**
- `layer_hat_straw/wizard/cowboy/bandana...`, `layer_shirt_yellow/white...`, `layer_pants_black/cargo/skirt_denim/floral/beige...`, `layer_hair_mullet/afropuff...`
- Listagem completa em `shared/constants.js:329-429` e `client/assets/layer_*.png`.

**HUD/Hotbar Auditoria:**
- `client/css/style.css:413 #hotbar`, `418 #hotbarSlots` (flex gap6 pad8), `443 .slot .icon img 70x70` vs `client/js/ui.js:192 icon div 60x60` — mismatch 10px + padding interno ícone 16x16.

**Retrato Auditoria:**
- `client/js/art/ui-binding.js:258` escala ampliada para retrato grande, `client/js/ui.js:560 portraitSize=112` canvas, `image-rendering pixelated` ok, recorte rosto preservado.

## Testes Executados
- Multiplayer: `diagnostic_repro.mjs` 100 sequenciais + 50 paralelas → 100/100 + 50/50 PASS (não reproduziu flaky original, evidência em `/tmp/diag*.log`).
- Persistência: `repro_persist_clean.mjs` reproduziu bug `sleepVotes={Alice}` persiste → `Beto alone day1→2` ❌ REPRODUZIDO, log 2026-10-22.
- Nenhum fix aplicado a `server/server.js:316 sleepVotes` ou `gameActions.js:214 water` conforme regra não especulativo.

## Pendências com Aprovação Necessária
- Proposta bases corporais (matriz + prévia visual) — aguardando confirmação hipótese 9 bases.
- Proposta roupas (tabela nomes/cores/estilos por categoria) — aguardando revisão usuário antes de gerar assets finais.

## Preferências Mantidas
- Usuário informal, agente interpreta e propõe.
- Identidade visual pixel art acolhedora original.
- Retratos pixel art detalhada > sprite mapa.
- Ícones HUD/hotbar, não ícone Windows.
- Agente define bases respeitando estilo.
- Roupas com proposta prévia.
- Toda tarefa com critério de aceite e evidência.

