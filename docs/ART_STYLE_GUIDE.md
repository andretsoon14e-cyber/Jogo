# Guia de Estilo Visual — Vale Aconchegante

## Identidade
Pixel art acolhedora e original, inspirada em atmosfera de fazenda, sem cópia 1:1 de Stardew. Paleta quente, madeira/pergaminho, pixels nítidos.

## Sprites de Mapa
- Player 22px base, NPC 16px base, tier 0.70/0.88/1.0-1.08.
- Corpo chibi 16x24, 4 direções, 4 quadros walk, pose ferramenta.
- Base nude por estágio antes de vestir (não sexualizada, especialmente menores).

## Retratos de Diálogo
**Decisão 2026-10-22:** Pixel art detalhada, maior que sprite de mapa. Não realista fora do estilo.
**Auditoria 2026-10-22:**
- Sprite mapa: 16x24 base (W=16 H=24, PIX=1), exibição em mapa ~16*PIX*scale (0.7-1.08 tier), 4 direções, 4 quadros walk.
- Retrato atual: `client/js/art/ui-binding.js:177 npcPortrait(npc,size=96)` → `size=112` em `client/js/ui.js:560 portraitSize=112`, canvas 112x112, recorte `cropH = sh*0.68` (busto rosto+torso), escala `scale = size/sw` → dw=112, dh≈76, sombra elíptica, moldura dupla madeira #6b4a2e(3px)+#d9c79a(2px)+#6b4a2e25%(1px), placa nome 16% altura.
- Renderização: `image-rendering: pixelated; crisp-edges`, `drawImage` com `imageSmoothingEnabled=false`, sem `filter: blur`, preserva pixels nítidos.
**Especificação visual retrato:**
- Enquadramento: busto centralizado (face + ombros + parte tronco), não corta topo cabeça, olhos 1/3 superior, queixo 60% altura, margem 8px borda interna.
- Expressão: neutra acolhedora (base), variação sazonal via `seasonSpec` (cachecol/paleta), sem animação facial além de piscar sutil se cols>=7.
- Detalhes: 1.75x mais pixels que mapa (112 vs 64 ref), permite íris, brilho olho, sobrancelha, textura cabelo/chapéu visível, colar/brinco.
- Paleta: mesma `shared/constants.js` NPC_SPECS (pele #ffe0bd→#5a3a28, cabelo, camisa), consistência garantida via `characterFrames(baseSpec)` → mesmo `spec` do sprite mapa.
- Resolução: 64x64 arquivo-fonte como referência inicial é **adequada** mas **112 canvas é superior** — justifica manter 112: comporta moldura dupla (6px) + placa nome (17px) + margem, sem precisar upscale 64→112 (=1.75x) que introduziria pixel duplicado 1.75 (fração). Render direto em 112 com `scale=size/sw` mantém pixels inteiros quando sw=16 → 112/16=7x inteiro, sem borrão. Se migrar para arquivo PNG 64x64, exibição 112 exigiria 1.75x fracionado → borrão ou padding; portanto manter geração procedural em 112 é técnica correta para pixel art nítida.
- Correspondência: `baseSpec = NPC_SPECS[npc.id] || fallback` + `seasonSpec` → mesmo `shirt/pants/skin/hair/hat` do sprite mapa, garantido por `characterFrames` compartilhado.

## HUD / Hotbar
**Decisão 2026-10-22:** Problema é na HUD/hotbar do jogo, não ícone do .exe Windows.
- Container `.slot` 80x80 (62x62 mobile), `#hotbarSlots` gap6 pad8, fundo pergaminho.
- Ícone asset 16x16 (`client/js/art/icons.js` S=16), desenho útil ~10px (3-13px), exibido como `<img>` 78x78 + `transform scale1.55` dentro `.icon 78x78 overflow:hidden` → visível ~66px toca 2 extremidades (foice diagonais, pequeno cima/baixo).
- Correção aplicada 22/10: CSS `.slot .icon 78x78` + `img 78x78 scale1.55` + JS `iconImg 78x78/div 78x78` (era 60), validado visual, sem esticar/borrar, madeira/pergaminho mantido.

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
