# ETAPA B — Proposta visual: só no meu boneco (teste)

**Princípio:** inspiração na qualidade da Imagem 1, sem copiar Stardew, adaptado à perspectiva real 3/4 top-down do Vale (`W=16,H=24, PIX=3.8`).

## Transformação que será feita (com minhas palavras)
Vou pegar o boneco atual do jogador (andre — `body_adult_masc_A`, camisa vermelha, calça azul, chapéu bege) que hoje é um bloco de cor lisa com cabelo chapado, e redesenhar como um **pixel art caprichado em 16×24 lógico** mas com **clusters intencionais visíveis a 61×91px**: cabelo com volume e 2 tons + outline, olhos 2px com brilho, pele com sombra suave, camisa com gola/manga/cinto/bolso, calça com dobra, sapato com sola. Cada elemento terá paleta própria para reconhecer o personagem andando, sem aumentar câmera/tiles.

## Como melhorar cada parte
- **Cabeça/cabelo/rosto:** trocar 1 rect por forma `8×5px` com `h0/h1` + outline `h1*0.7`, franja com 2 mechas; olhos `2×2px` com íris `eyeColor` + brilho 1px; sobrancelha 1px; boca 1px; orelha 1px quando `side`.
- **Corpo/roupa:** manter silhueta `6.8×6.8` torso mas adicionar `gola V` com 2 tons, `manga` com vinco, `cinto` `1px` marrom, `bolso` com botão, `barra` da calça; sombra lateral `0.5px` para volume.
- **Luz/sombra sem borrar:** só `shade()` em steps de 12-18%, clusters 2-3px, dithering manual com `rect` alternado, sem `filter:blur`.
- **Diferenciar jogador vs NPC:** jogador mantém chapéu bege com faixa vermelha + bota marrom; NPCs usarão paletas diferentes (ex.: Larissa verde, Ana amarelo) já existentes em `NPC_SPECS`.
- **Direções:** para teste, manter 1 PNG front bem acabado; `side` ganhará flip automático (`flip=dir==="right"`) + cabelo lateral com volume; `up` mostra nuca/ chapéu por trás. Se aprovado, gerar folha 4×4 completa.
- **Compatibilidade camadas:** novo `body_adult_masc_A.png` continuará sendo base; `shirtAsset/pantsAsset` não serão limpos por `clearRect` se desenharmos **por cima** do PNG (inverter ordem: desenhar PNG, depois recortes de roupa por cima para camada funcionar).
- **Consistência:** usar `C.skin`, `shade`, `PIX` existentes; paleta harmônica mas distinta por personagem (vermelho/verde/azul).

## Dimensões e proporções antes de produzir em massa
- Nativo: 16×24 (não mudar, preserva colisão)
- Exibição: 61×91px (60.8×91.2)
- Personagem ocupa ~85% altura do canvas (cabeça 8px, torso 7px, pernas 9px) → proporcional a porta 3 tiles, não gigante.
- Detalhe mínimo legível: 1px = 3.8px tela, então olho 2px = 7.6px tela → visível sem zoom.

## Prévia representativa
Será gerado novo `body_adult_masc_A.png` detalhado (1024×1024 com fundo transparente, mas desenhado para encolher nítido para 16×24). Comparação lado a lado ampliada 4× será incluída em Etapa D.

## Risco controlado
Só 1 arquivo substituído; se falhar, rollback via `git checkout`. Sistema `buildCustomSpec` e `cached` preservados.

**Status Etapa B:** PROPOSTA APROVADA PARA TESTE — aguardando geração do asset único.
