# 🗺️ Roadmap — do protótipo ao jogo completo

O desenvolvimento segue as fases do projeto original. Cada fase entrega algo **jogável e testável**, sem quebrar o multiplayer.

Legenda: ✅ entregue nesta versão • 🟡 parcial • ⬜ planejado

---

## Fase 1 — Protótipo jogável ✅

- ✅ Tela inicial, criação de personagem, escolha de sala
- ✅ Mapa inicial completo (cidade, fazenda, floresta, lago, mina, praia)
- ✅ Movimentação, colisão, câmera, ciclo dia/noite, clima, estações
- ✅ Plantio, rega, colheita, inventário, hotbar, economia
- ✅ Primeiros NPCs com rotina e diálogos
- ✅ Salvamento funcional (autosave + manual)

## Fase 2 — Multiplayer funcional ✅

- ✅ Criar e entrar em sala por código
- ✅ Sincronização de jogadores em tempo real
- ✅ Mundo compartilhado (tiles, plantações, construções, animais, projetos)
- ✅ Estado individual (inventário, ouro, amizades, missões, skills)
- ✅ Salvamento e recuperação do mundo; host pode sair sem corromper
- ✅ Testes reais com dois clientes Socket.IO (desconexão, reconexão, persistência)

Melhorias recomendadas para a fase 2.5:
- ⬜ Reconexão "transparente" com reentrada automática sem F5
- ⬜ Lista de salas dentro do jogo (a API já existe) e salas públicas moderadas
- ⬜ WebRTC/voice chat opcional (fora do escopo atual)

## Fase 3 — Vida na cidade 🟡

- ✅ Lojas funcionais (sementes, ferramentas, animais, materiais, venda)
- ✅ Diálogos variados por NPC + gostos/desgostos
- ✅ Sistema de amizade com ganho por conversa/presente
- ✅ Pedidos dos moradores (missões com estatísticas)
- ✅ Calendário, ciclo diário e relógio sincronizado
- ⬜ Profissões completas com tarefas diárias e especializações
- ⬜ Culinária com receitas e máquinas (forno, barril, geleia)
- ⬜ Mais NPCs (meta: 12) e arcos pessoais em múltiplas etapas

## Fase 4 — Construção e comunidade 🟡

- ✅ Construções na fazenda com custo, validação e prévia
- ✅ Projetos comunitários com progresso compartilhado
- ✅ Mudanças visíveis (praça com fonte, biblioteca, estradas, ponte abrindo o rio)
- ⬜ Interiores das construções (entrar de verdade)
- ⬜ Tempo de obra e ajudantes NPC
- ⬜ Mais tipos de construção (moinho, apiário, oficina de queijos)

## Fase 5 — Expansão de conteúdo ⬜

- ⬜ Vila costeira + porto (pesca marítima)
- ⬜ Ilha com ruínas e quebra-cabeças
- ⬜ Região de inverno com atividades exclusivas
- ⬜ Cavernas em níveis com minérios raros e criaturas
- ⬜ Festivais sazonais jogáveis (campeonato de pesca, feira culinária)
- ⬜ Mais profissões: padeiro, apicultor, bibliotecário, mensageiro, guarda, médico ativo
- ⬜ Missões cooperativas com objetivo conjunto em tempo real
- ⬜ Coleções, conquistas e museu

## Fase 6 — Polimento ⬜

- ⬜ Sprites pixel-art dedicados (hoje o visual é procedural/vetorial estilizado)
- ⬜ Mais camadas de áudio (trilha por região/estação, ambiências)
- ⬜ Balanceamento econômico com telemetria de partidas
- ⬜ Acessibilidade (remap de teclas, escala de UI, daltonismo)
- ⬜ Otimização de render (chunks, culling já existe parcialmente)
- ⬜ Localização (PT-BR atual; EN/ES futuramente)

---

## Prioridades sugeridas para as próximas entregas

1. **Culinária + máquinas de produção** — fecha o ciclo econômico (leite → queijo, trigo → pão).
2. **Interiores e tempo de obra** — dá peso às construções e ao dinheiro.
3. **Profissões com tarefas diárias** — transforma "atividades" em carreiras.
4. **Segunda região (vila costeira)** — valida o sistema de expansão de mapa.
5. **Salas públicas e reconexão suave** — melhora a experiência multiplayer.

Cada item é independente o suficiente para entrar sozinho numa atualização.
