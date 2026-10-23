# Matriz Bases Corporais — Auditoria 2026-10-22

## Hipótese vs Realidade
**Hipótese inicial:** 9 bases (1 bebê genérico + 2 variações × 4 estágios criança/teen/adulto/idoso = 9).
**Realidade auditada:** 15 bodies com gênero separado. Cálculo correto com gênero: 1 bebê uni + 2 variações × 4 estágios × 2 gêneros = 17. Temos 15, faltam 2.

## Inventário Verificável (15 existentes)

| Estágio | Variação | Arquivo | Dimensão | Escala | Estilo | Uso | Compatibilidade | Status |
|---|---|---|---|---|---|---|---|---|
| bebê | genérico | body_baby_generic.png | 1024×1024 | 0.72 | Peach blob sem face, sem roupa, placeholder | Criação personagem bebê | Todas roupas (nenhuma) | ⚠️ Reaproveitável mas precisa detalhe facial |
| criança | masc A | body_child_masc_A.png | 1024×1024 | 0.82 | Peach block sem face, placeholder | Seleção criança M | Cabelo/chapéu/camisa/calça | ❌ Placeholder — refazer |
| criança | masc B | body_child_masc_B.png | 887×1774 | 0.82 | Menino túnica branca + cinto marrom, cabelo castanho, 4 direções? | Seleção criança M | Compatível layers | ✅ Reaproveitável |
| criança | fem A | body_child_fem_A.png | 1408×768 | 0.81 | Cena interior (não isolada) menina cabelo castanho vestido branco, fundo sala — não é body isolado | — | Incompatível (fundo) | ❌ Não reaproveitável — recortar |
| criança | fem B | body_child_fem_B.png | 720×1456 | 0.81 | Menina cabelo curto castanho túnica creme | Seleção criança F | Compatível | ✅ Reaproveitável |
| adolescente | masc A | body_teen_masc_A.png | 1024×1024 | 0.90 | Menino túnica branca cinto marrom, cabelo castanho curto | Seleção teen M | Compatível | ✅ Reaproveitável |
| adolescente | masc B | body_teen_masc_B.png | 1024×1536 | 0.90 | Mesmo que A mas pernas mais longas, fundo cinza | Seleção teen M | Compatível | ✅ Reaproveitável (ajustar proporção) |
| adolescente | fem A | body_teen_fem_A.png | 1280×1280 | 0.89 | Menina cabelo médio castanho vestido creme, detalhada | Seleção teen F | Compatível | ✅ Reaproveitável |
| adolescente | fem B | body_teen_fem_B.png | 1254×1254 | 0.89 | Menina rabo alto castanho vestido creme | Seleção teen F | Compatível | ✅ Reaproveitável |
| adulto | masc A | body_adult_masc_A.png | 1254×1254 | 1.00 | Homem túnica creme cinto, barba castanha, cabelo curto | Seleção adulto M | Compatível | ✅ Reaproveitável |
| adulto | masc B | body_adult_masc_B.png | 1254×1254 | 1.00 | Idêntico a A (duplicado) — mesma imagem? | Seleção adulto M | Compatível | ⚠️ Duplicado — criar variação real (ex: sem barba ou corpo atlético) |
| adulto | fem A | body_adult_fem_A.png | 1408×768 | 0.98 | Adulto fem coque alto azul-escuro vestido azul claro, fundo branco | Seleção adulto F | Compatível | ✅ Reaproveitável |
| adulto | fem B | body_adult_fem_B.png | 1776×2368 | 0.98 | Adulto fem cabelo longo castanho vestido creme? (duplicado teen?) | Seleção adulto F | Compatível | ⚠️ Duplicado teen — criar variação (ex: cabelo curto) |
| idoso | masc A | body_elder_masc_A.png | 1254×1254 | 0.97 | Velhinho barba branca túnica creme, bengala? | Seleção idoso M | Compatível | ✅ Reaproveitável |
| idoso | fem A | body_elder_fem_A.png | 1223×1286 | 0.95 | Velhinha cabelo branco coque vestido creme bengala | Seleção idoso F | Compatível | ✅ Reaproveitável |

**Total reaproveitáveis sem alteração:** 9 (child_masc_B, child_fem_B, teen_masc_A/B, teen_fem_A/B, adult_masc_A, adult_fem_A, elder_masc/fem_A)
**Precisam refazer/ajustar:** 4 (baby_generic sem face, child_masc_A placeholder, child_fem_A fundo, adult_masc_B/fem_B duplicados)
**Ausentes confirmados:** 2 (body_elder_masc_B.png, body_elder_fem_B.png) para fechar 17 com gênero, ou 0 se aceitar 9 sem gênero — mas estilo atual exige gênero, então faltam 2.

## Proposta Coerente (sob responsabilidade do agente)

**Manter identidade:** chibi 16×24 base, escala 0.72-1.00, paleta pele quadradinhos (#ffe0bd→#5a3a28), 4 direções, 3-4 quadros walk, sem anatomia explícita.

**Matriz proposta (17 bases, respeita gênero + 2 variações por estágio):**
- bebê 1 (uni) — refazer com face simples, manter 0.72
- criança 4 (M2/F2) — manter 3, refazer 1 (child_masc_A), recortar 1 (child_fem_A)
- adolescente 4 — manter 4, ajustar proporção teen_masc_B
- adulto 4 — manter 2, criar 2 variações distintas (adult_masc_B sem barba/atleta, adult_fem_B cabelo curto)
- idoso 4 — manter 2, criar 2 variações (elder_masc_B sem barba com boina, elder_fem_B cabelo curto cacheado)

**Próximos passos:** Folha de contato já gerada (`/tmp/contact_bodies.png`), verificação alinhamento cabelo/chapéu/camisa/calça ok (layers 21 testados em `characters.js:331-340` drawImage 0,0,W,H*scale), implementar bases aprovadas com 4 direções/quadros.

