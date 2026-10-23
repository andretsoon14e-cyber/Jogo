# Guia de Estilo Visual — Vale Aconchegante

Atualizado: **2026-10-23**. Substitui a versão de 2026-10-22 (que citava PNGs de base e `transform: scale` na hotbar).

## Identidade

Pixel art acolhedora e original: paleta quente (verde-oliva, madeira, pergaminho, terracota), contorno marrom-escuro (`#32241a` no retrato, `#2a1c12` no rig), nada de cópia de outros jogos. Tudo que aparece na tela é desenhado por código — não há sprite importado de personagem.

## Sprites de mapa

- Saída nativa **18×33** (`rig.js`: rig 16×32 + 1px de contorno em cada lado), `RIG_SCALE = 3` → 54×99 ao desenhar.
- 6 idades, 2 silhuetas por idade (`newborn_A/B` … `elder_A/B`), 4 direções, 4 quadros de caminhada + pose de ferramenta.
- Pés sempre na linha 31 do rig: nenhum quadro flutua; sombra elíptica discreta embaixo.
- Pernas com `legW = (bodyW - 1) / 2` e **gap mínimo de 1px** entre elas (corpo e calça).
- Recém-nascido é desenhado por função própria: cabeça + trouxa de pano, sem pernas nem braços.
- Idoso tem `stoop: 1` (costas curvadas); adolescente é mais estreito que adulto.

## Retratos de diálogo

- **Arte separada**, `client/js/art/portrait.js`, 56×56 nativos — cerca de 3,5× mais pixels que o sprite do mapa. O sprite **nunca** é ampliado para virar retrato.
- Exibição: painel 112px (2×), prancha de conferência 168px (3×). `image-rendering: pixelated`.
- Enquadramento: busto. `top = 17`, olhos em ~y34, boca ~y45, pescoço y41–48, ombros a partir de y45, gola da camisa em y47.
- Elementos: formato de rosto por idade (`faceShape`), cabelo com sombra, chapéu, olhos com íris e brilho, sobrancelhas, boca, orelhas, pescoço, ombros.
- Moldura: madeira `#6b4a2e` + filete claro + placa de nome com 12,5% da altura, tudo dentro da arte (nada por cima do rosto).
- A estação do ano aparece como etiqueta ao lado do nome (`.seasonChip`), fora do retrato.

## HUD / Hotbar

- `.slot` 76px, `.icon` 66px, imagem 64×64 `image-rendering: pixelated`. Sem `transform: scale`, sem esticar.
- `iconTag(id, 64)` gera o `<img>`; o ícone é desenhado em 16×16 e ampliado 4× exato.
- Ícones de ferramenta são todos desenhados por código (`icons.js`); os overrides PNG de foice, picareta e machado foram removidos porque borravam.
- Inventário usa `iconTag(id, 32)`.
- Madeira e pergaminho na moldura, texto escuro — prioridade é legibilidade.

## Criador de personagem

- Prévia à esquerda (rig em tamanho de jogo), opções em **grade** à direita.
- 10 abas: Corpo, Cabelo, Cor do cabelo, Camisa, Calça/saia, Chapéu, Pele, Olhos, Colar, Pulseira.
- Grade `minmax(74px, 1fr)`, altura máxima 332px com rolagem — todas as opções visíveis, sem esconder nada.
- Clicar marca a opção (`.creatorOpt.selected`, borda `#4f8a52`) e **não** avança sozinho.

## Bases e roupas

Números e diferenças entre variantes em `docs/BASES_MATRIZ.md`.

- Corpo 12 (2 por idade, neutros), Cabelo 20, Camisa 16, Calça/saia 16, Chapéu 17, Pele 6, Olhos 8, Colar 7, Pulseira 5.
- Calça/saia carrega `style`: `skirt`, `shorts` ou `long` — muda o desenho, não só a cor.
- Ordem de desenho: cabelo de trás → corpo → calça → camisa → braços → cabeça → cabelo da frente → chapéu → acessórios.

## Caverna

- **Piso** `#463c34` / `#433930` / `#41372f` com pedriscos e musgo em alpha baixo; **parede** em blocos de rocha mais escuros, sem grama, flores, vento ou mar.
- Fora do mapa: rocha maciça `#1d1815` com gradiente de sombra de 26px nas bordas (`drawCaveBorder`).
- Escuridão com halo de lanterna: `dark = min(0.86, 0.66 + 0.06·andar)`, raio interno `max(90, 190 − 30·andar)`, flicker suave de 3,1 Hz.
- **Escadas** (12/13): boca chanfrada escura, 5 degraus com topo iluminado e sombra embaixo; descer escurece para o fundo, subir clareia. Pedras soltas nos cantos em vez de moldura. Seta no piso: amarela ↑ para subir, azul ↓ para descer.
- **Veios de cristal** (14): aglomerado de 3 lascas em pirâmide (ponta em cima, base larga), faceta iluminada à esquerda, sombra à direita, ponta branca e brilho difuso. Nada de retângulo/janela.
- Props: estalagmite (pedra + musgo escuro `#31402a`), pedrinhas, ossadas — só sobre piso, nunca sobre parede.
- Sem retratos novos: a caverna não tem NPCs (os três andares são de exploração/mineração).

## Regras de ouro

1. Nada de ampliar sprite pequeno para tela grande: cada arte tem sua resolução nativa.
2. Contorno 1px em toda peça nova, na cor `#2a1c12`.
3. Sem emoji em HUD, hotbar, inventário e criador. (Painéis internos de missão/loja ainda têm — pendência registrada em `PROJECT_STATE.md`.)
4. Antes de produzir arte em massa: prancha de conferência + aprovação.
5. Toda mudança visual se comprova com screenshot em `.work/shots/`.
