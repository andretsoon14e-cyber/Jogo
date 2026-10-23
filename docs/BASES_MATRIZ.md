# Matriz de Bases e Roupas — 2026-10-23

> Este documento substitui a auditoria de 2026-10-22, que descrevia 15 arquivos PNG de base.
> **Esses PNGs não são mais usados.** O personagem hoje é desenhado por código no rig (`client/js/art/rig.js`), em saída nativa **26×49** (arte 24×48 com 1px de contorno em cada lado). Não existe mais "base PNG" para importar: toda base é uma `BODY_OPTIONS` com proporções próprias.

## 1. Corpos (12 opções = 2 por idade)

Fonte: `shared/constants.js` → `BODY_OPTIONS` (todas `gender: "uni"`).

| Idade | Opções | Escala | Observação |
|---|---|---|---|
| Recém-nascido | `newborn_A`, `newborn_B` | 0.72 | só cabeça + manta (`bundle: true`), sem pernas; A = cobertor xadrez, B = touca de tricô |
| Bebê | `baby_A`, `baby_B` | 0.80 | claramente menor que a criança; A encorpado (cabeça 9), B franzino (cabeça 8) |
| Criança | `child_A`, `child_B` | 0.88 | cabeça grande, corpo curto; A robusta, B esguia |
| Adolescente | `teen_A`, `teen_B` | 0.95 | mais esguio que adulto; A ombros largos, B tronco fino |
| Adulto | `adult_A`, `adult_B` | 1.00 | A tronco cheio, B cintura marcada e pernas longas |
| Idoso | `elder_A`, `elder_B` | 0.98 | A curvado (`stoop: 1`), B ereto e grisalho |

**Como as duas opções diferem:** silhueta e postura, não gênero (todas as 12 são `uni`). Na prática, `metricsFor()` dá **+1px de corpo e −1px de perna** para a variante A, e o inverso para a B; a cabeça é 1px mais larga em `baby_A`/`adult_A`. `drawNewborn` tem desenho próprio (cabeça redonda + trouxa de pano), sem corpo nem braços.

## 2. Categorias de personalização

| Categoria | Total | Masc | Fem | Uni | Fonte |
|---|---|---|---|---|---|
| Corpo | 12 | — | — | 12 | `BODY_OPTIONS` |
| Cabelo | 20 | 7 | 11 | 2 | `HAIR_STYLE_OPTIONS` |
| Camisa | 16 | 7 | 8 | 1 | `SHIRT_OPTIONS` |
| Calça / saia | 16 | 7 | 7 | 2 | `PANTS_OPTIONS` |
| Chapéu | 17 | 7 | 6 | 4 | `HAT_OPTIONS` |
| Cor do cabelo | 6 | — | — | 6 | `HAIR_COLOR_OPTIONS` |
| Tom de pele | 6 | — | — | 6 | `SKIN_TONE_OPTIONS` |
| Cor dos olhos | 8 | — | — | 8 | `EYE_COLOR_OPTIONS` |
| Colar | 7 | — | — | 7 | `NECKLACE_OPTIONS` |
| Pulseira | 5 | — | — | 5 | `BRACELET_OPTIONS` |
| Animal | 6 | — | — | 6 | `PET_OPTIONS` |

Metas do pedido (~5 masc + ~5 fem em camisa/calça/chapéu/cabelo): **atingidas** em todas as quatro categorias.

## 3. Calças e saias (estilo de desenho)

`PANTS_OPTIONS` carrega `style` e `buildCustomSpec` propaga para `pantsStyle`:

- `skirt` — saia (desenho em sino, sem divisão de perna)
- `shorts` — bermuda (perna curta com `gap` de 1px entre as pernas)
- `long` — calça comprida (padrão)

O rig desenha duas pernas com `legW = (bodyW - 1) / 2` e **gap mínimo de 1px**, tanto no corpo quanto na calça, para não virar bloco único.

## 4. Camadas e ordem de desenho

`rig.js` desenha de trás para frente: cabelo traseiro → corpo → calça/saia → camisa → braços → cabeça → cabelo frontal → chapéu → acessórios. Cada camada tem contorno 1px próprio (`#2a1c12`), nunca herdado de outra peça.

## 5. Retrato (arte separada)

`client/js/art/portrait.js` — **arte própria 56×56**, não é o sprite do mapa ampliado.

- `PORTRAIT_ART = 56`, `PORTRAIT_SIZE = 112` (2×), exibição 168 (3×) em telas grandes.
- Elementos: cabeça (com `faceShape` por idade), cabelo, chapéu, olhos com íris, sobrancelhas, boca, pescoço, ombros e gola.
- `top = 17`, olhos ~y34, boca ~y45, pescoço y41–48, ombros a partir de y45.
- Moldura madeira/pergaminho + placa de nome (12,5% da altura) em `ui-binding.js`.

## 6. Pendências

- A diferença A/B é hoje só de silhueta (±1px) e do chapéu da manta no recém-nascido. Se o usuário quiser contraste maior, o caminho é variar cabelo/roupa inicial por variante, não redesenhar o rig inteiro.
- Avaliar um terceiro corpo de idoso com acessório fixo (bengala) — hoje a bengala não existe no rig.
