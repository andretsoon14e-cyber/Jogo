# Guia de Estilo Visual — Vale Aconchegante

## Identidade
Pixel art acolhedora e original, inspirada em atmosfera de fazenda, sem cópia 1:1 de Stardew. Paleta quente, madeira/pergaminho, pixels nítidos.

## Sprites de Mapa
- Player 22px base, NPC 16px base, tier 0.70/0.88/1.0-1.08.
- Corpo chibi 16x24, 4 direções, 4 quadros walk, pose ferramenta.
- Base nude por estágio antes de vestir (não sexualizada, especialmente menores).

## Retratos de Diálogo
**Decisão 2026-10-22:** Pixel art detalhada, maior que sprite de mapa. Não realista fora do estilo.
- Referência: 64x64 px aquivo-fonte, exibição ~112px (ver `client/js/ui.js:560 portraitSize=112`, `client/js/art/ui-binding.js:258`).
- Preservar bordas nítidas, `image-rendering: pixelated`, sem borrão ao ampliar.
- Enquadramento: rosto + torso, sem cortar topo/cabeça, corresponde a identidade do sprite mapa.

## HUD / Hotbar
**Decisão 2026-10-22:** Problema é na HUD/hotbar do jogo, não ícone do .exe Windows.
- Container `.slot` 80x80 (62x62 mobile), gap 6px, padding 8px.
- Ícone asset 16x16 base (`client/js/art/icons.js` S=16), exibido como `<img>` 70x70 dentro de `.icon` 60x60.
- Dimensão útil do desenho < tamanho do arquivo: desenho centralizado com padding interno (ex: 3-13px usados), causa ícone pequeno visual mesmo com quadrado 70px.
- Correção: investigar `client/js/art/icons.js` desenho útil vs `client/js/ui.js:192 iconHtml` scale 60x60 vs `client/css/style.css:443 .slot .icon img 70x70` + `client/css/style.css:418 #hotbarSlots` container.
- Manter proporções, alinhamento, nitidez; verificar em resoluções.

## Bases Corporais
- Auditoria 2026-10-22: 15 bodies existentes (`body_baby_generic.png` + child_masc_A/B, child_fem_A/B, teen_masc_A/B, teen_fem_A/B, adult_masc_A/B, adult_fem_A/B, elder_masc_A, elder_fem_A) — faltam elder_fem_B, elder_masc_B para completar hipótese 9 bases (1 bebê + 2x4 estágios).
- Estilo atual: chibi hand-drawn, paleta pele quadradinhos, compatível com layers.
- Organização proposta sob responsabilidade do agente, verificar compatibilidade cabelo/chapéu/camisa/calça antes de produzir massa.

## Roupas
- Meta: 5 masc + 5 fem por categoria (shirts/pants/hats/hair) = 40, filtro masc/fem/uni.
- Existente: 21 layers verificados em `client/assets/layer_*.png` + `shared/constants.js` HAT/SHIRT/PANTS/HAIR_OPTIONS.
- Requer proposta de nomes/cores/estilos antes da produção final, sem duplicação, diferença visual intencional.

## Comunicação
Usuário informal, não precisa conhecer terminologia técnica. Agente interpreta intenção, propõe solução coerente, não transfere decisão técnica que pode resolver por inspeção.

## Critérios Gerais
Toda tarefa tem critério de aceite e evidência verificável. Diferenciar proposta → prévia → aprovação → integração → validação final.
