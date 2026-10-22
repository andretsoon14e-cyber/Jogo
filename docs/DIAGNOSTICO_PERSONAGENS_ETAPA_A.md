# ETAPA A — Diagnóstico: por que os personagens parecem simples

**Data:** 2026-10-23 — Branch `arena/629415fb-jogo`  
**Mapa:** Vale Aconchegante — `client/js/art/characters.js` + `shared/constants.js` + `client/assets/body_*.png`

## 1. Dimensões reais confirmadas

- **Base lógica:** `W=16, H=24` (`client/js/art/characters.js:8`)
- **PIX:** `3.8` (`client/js/art/palette.js:8`) → canvas `W*PIX = 60.8px × 91.2px` por personagem
- **Atlas:** `characterFrames` gera `mkCanvas(W*PIX, H*PIX)` para cada `dir` em `["down","up","left","right"]` com `4 frames/dir` (`:783-785`). Verificado via `cached` key `char:...`
- **Exibição:** `drawCharacter` em `:865` desenha `ctx.drawImage(img, x, y)` sem re-escala; escala vinha só de `bodyScale` aplicado em `drawBody:326-329` (`sw=W*PIX*s`)

> **Conclusão:** tamanho final no mapa é ~61×91px por boneco, casas ~3× maior. Não é “câmera pequena”; é escala artística. Aumentar só `scale` não cria detalhe.

## 2. Por que parecem genéricos — problemas confirmados (código + assets)

### 2.1 Desenho-base simples
- `drawBody:274-320` usa `rect()` com cores chapadas `shirt, pants, skin`. Pernas: 2 rects + sapato 3 rects. Torso: 1-2 rects + gola. Sem contorno intencional, sem grouping de pixels, sem luz/sombra em clusters.
- `drawFace` + `drawHair` usam 2-4 rects por estilo (`long_masc: 4,8×4,8`). Cabelo sem mechas, volume ou brilho; rosto sem olhos legíveis na escala 60px (olhos são 1px `rect` sem pálpebra).
- **Evidência:** `body_adult_masc_A.png` atual é 1254×1254 gerado com áreas lisas, pouca variação de tom; `identify` mostra sem dithering.

### 2.2 Assets ignoram direção
- `drawBody:322-329` quando `spec.bodyAsset` existe faz `g.clearRect` + `g.drawImage(bImg, 0,0, natW,natH, sx0,sy0, sw,sh)` **ignorando `dir` e `frame`**. Mesmo PNG para `down/up/left/right`. Side view idêntica a front → silhueta não muda, boneco parece “carimbo”.
- Camadas `shirtAsset/pantsAsset/hairAsset` em `:335-347` também fixas em `0,6*PIX` etc., sem flip por `side`.
- **Confirmado:** grepping `dir` dentro do bloco `bodyAsset` → 0 ocorrências.

### 2.3 Falta de detalhe de roupa/acessório
- `shirtDesign` (`plaid`, `solid` etc.) desenha 1-2 linhas por cima do torso já coberto pelo PNG → invisível quando `bodyAsset` limpa o canvas.
- Acessórios (`necklace, bracelet, badge`) são 1 rect; não há `cinto, bolso, gola elaborada, manga, camada` distinguível a 60px.

### 2.4 Paleta e contraste
- `SKIN_SPECS/NPC_SPECS` usam 3-4 tons por personagem, mas todos saturados similares; sem `outline` escuro para separar cabelo/pele/fundo verde `TILE.GRASS`.
- Fundo `body_*.png` anterior com halo branco (corrigido hoje via flood fill), mas ainda sem sombra projetada sutil.

### 2.5 Hipóteses descartadas
- ❌ “É só aumentar `scale`”: testado 0.72→1.60, boneco cresce mas continua liso (print do usuário 23/10 mostra mesmo).
- ❌ “É câmera/tiles”: `MAP_W=70, TILE=16px`, personagem já ~1 tile; aumentar tiles deformaria casas.
- ❌ “PNG de alta resolução resolve”: 1254px redimensionado para 61px perde detalhe se o desenho interno não for planejado em clusters de 2-3px.

## 3. O que a referência 1 tem e falta aqui
| Referência (desejado) | Atual (mapa) | Gap |
|---|---|---|
| Cabelo com volume/mechas/contorno | 1 rect achatado | +3 tons + outline |
| Olhos com íris/pálpebra distinguível | ponto 1px | + forma 2×2px |
| Roupa com gola/manga/cinto/bolso | rect único | +3-4 recortes |
| Luz/sombra em clusters intencionais | cor chapada | + shade 15-20% |
| Silhueta distinta por personagem | mesma silhueta PNG | + ombros/cintura variáveis |

## 4. Proposta de preservação (não quebrar)
- Manter `buildCustomSpec`, `characterFrames` cache, `W/H/PIX`, colisão/movimento/multiplayer, HUD/hotbar.
- Alteração localizada: só `drawBody`/`drawHair`/`drawFace` e **1 asset** (`body_adult_masc_A.png` — boneco do usuário “andre”) para teste.
- 4 direções + 4 frames continuam; novo PNG será **folha 4×1 direções** ou **1 PNG direcional** se necessário, mas para teste inicial manter 1 PNG (front) já mostra ganho de acabamento sem reescrever atlas inteiro.

**Status Etapa A:** CONCLUÍDA — diagnóstico com evidências de código e assets.
