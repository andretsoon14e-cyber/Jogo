---
name: vale-dev-docs
description: Documentação e padrões do Vale Aconchegante — use ao alterar lógica multiplayer, tamanho de sprites (22px/16px), ou assets chibi hand-drawn para manter consistência
---

# Vale Dev Docs

Instruções reusáveis para agentes trabalhando no Vale Aconchegante (Stardew-inspired chibi multiplayer).

## Quando usar
- Alterar `shared/constants.js` (BODY_OPTIONS, SHIRT/HAT/HAIR, NPC_SPECS, tamanhos 0.70/0.88/1.0)
- Adicionar/editar assets em `client/assets/body_*.png` ou `layer_*.png`
- Mexer em `client/js/art/characters.js` (drawHair, caches)
- Criar testes multiplayer ou preview de customização (70+ additive)
- Antes de commit: verificar que filtro de gênero (masc/fem/uni) continua funcionando e que hotbar não ficou minúscula

## Padrões obrigatórios
1. Nunca copiar assets 1:1 de Stardew — qualidade similar, mas corpos desenhados à mão (bebê genérico + 2 por estágio criança/teen/adulto/velho M/F, 8-9 total sem roupa antes de vestir).
2. Manter paleta pele em quadradinhos mini 22px (player) / 16px (NPC) e hierarquia NPC 64×64+chibi tier.
3. `buildCustomSpec` em constants.js deve mapear hairAsset/hatAsset; cache-invalidação em characters.js com 9-arg drawImage.
4. Botões: só beige Jogar — sem wood Play, sem ▶, sem PREVIEW quadrada feia.
5. Testar via `npm test` e `npm run test:client`; verificar branch `arena/*` antes de merge.

## Como consultar
Leia este arquivo quando o escopo tocar sprites, constantes ou multiplayer. Para uso externo, instale via `npx skills add andretsoon14e-cyber/Jogo --skill vale-dev-docs`.
