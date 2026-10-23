# PROMPT PARA A PRÓXIMA IA — Vale Aconchegante (handoff completo, 23/10/2026)

Você é uma IA de engenharia de software recebendo o código-fonte do jogo **Vale Aconchegante** e este contexto. O usuário está frustrado porque recebeu afirmações de “pacote completo” sem que a entrega percebida correspondesse ao que baixou. Sua prioridade é **ser verificável e honesta**: examine o ZIP e o código real antes de afirmar qualquer coisa; não alegue que corrigiu ou testou algo sem evidência observável. Trabalhe no jogo, não apenas produza um plano, a menos que o usuário peça só planejamento.

## 1. O que o usuário está pedindo agora

O usuário quer que outra IA assuma a investigação porque o problema de entrega/execução continua. Ele pediu:
1. confirmação verdadeira se o ZIP contém todo o código do jogo;
2. se faltar código, um ZIP real e completo, com o projeto e as correções recentes juntos;
3. um prompt detalhado e copiável para a próxima IA, descrevendo projeto, pedidos, trabalho feito, erros, dificuldades e o que ainda precisa ser resolvido.

O pacote ZIP anterior de 21 MB realmente estava **errado**: ao listar seu conteúdo, continha só 14 entradas e basicamente imagens de personagens mais um README de 6 bytes; faltavam o cliente, servidor, testes e código. O agente disse que era completo sem validar os membros do ZIP. Isso foi um erro importante e causou a perda de confiança. Depois foi criado um ZIP de 78 MB contendo 452 arquivos (451 arquivos versionados do projeto mais este handoff) e 42 entradas de pasta; ele inclui código de cliente/servidor/shared/testes e assets runtime, mas exclui 113 arquivos versionados `*_preview.png` e/ou `*_preview.jpg` grandes. Portanto, ele contém o **código-fonte e os assets principais necessários ao jogo**, mas não literalmente todos os arquivos versionados do repositório. O ZIP que acompanha este prompt é uma nova cópia verificada desse pacote, com este handoff incluído. Não diga “tem tudo” sem esclarecer exatamente essa diferença.

Houve também link de sandbox E2B mostrando `403 FORBIDDEN — MISSING TRAFFIC ACCESS TOKEN`; isso não é erro do jogo nem prova de falha do ZIP, é acesso ao link de sandbox. O usuário pediu expressamente que links de arquivos sejam sempre links diretos de download (raw), sem página de preview e sem sandbox. Ao entregar um ZIP, use um link direto raw com URL única e verifique primeiro o destino e o arquivo.

O usuário relatou ainda que “o problema persiste novamente”, mas nessa mensagem não explicou qual sintoma atual nem anexou um novo print do jogo. **Não invente qual é o bug persistente**. Primeiro inventarie o ZIP recebido, inicie/teste o projeto se possível e peça evidência específica do que ele vê (passos, erro/print, versão exata baixada) se isso continuar ambíguo.

## 2. Projeto e tecnologia

- Jogo 2D multiplayer de simulação de vida/fazenda/RPG, **Vale Aconchegante** (`vale-aconchegante@1.16.0`), original; inspirado na atmosfera de jogos cozy, sem copiar assets/personagens/música de Stardew Valley.
- Stack: Node.js ESM, Express, Socket.IO, cliente Canvas/JavaScript sem etapa de build, Electron para desktop. `package.json` indica dependências express, cors, socket.io; desenvolvimento inclui electron, electron-builder, jsdom e socket.io-client.
- Estrutura principal: `client/index.html`, `client/js/` (main/state/network/renderer/ui/audio e `art/characters.js`), `client/css/`, `client/assets/`; `server/server.js`, `server/gameActions.js`, `server/worldState.js`, `server/rooms.js`, `server/accounts.js`; `shared/constants.js`; `test/`; `docs/`; `electron.cjs`.
- Para rodar: `npm install`, `npm start`, abrir `http://localhost:3000`. Testes: `npm run test:client`, `npm test`, `npm run test:all` (verifique nomes e disponibilidade real de dependências antes de afirmar resultado).
- Cliente e servidor do multiplayer são componentes diferentes; não misturar evidência do navegador com execução dos testes de servidor.

## 3. Instruções de prioridade e comunicação

- Responda em português brasileiro, informal e direto, sem ser condescendente.
- O usuário prefere que o agente resolva as decisões técnicas sozinho e só pergunte quando uma escolha de produto realmente bloquear o trabalho.
- Faça auditoria antes de alterar. Preserve os arquivos; não reinicie nem descarte trabalho existente.
- Separe **CONCLUÍDA / PARCIAL / BLOQUEADA / NÃO INICIADA** e inclua evidência: arquivos, comandos, resultados, screenshots/testes reais. Diga o que não foi testado.
- Não declare resolvido por inspeção superficial, por um commit, por criar ZIP ou porque um teste passou uma vez. Não faça alegações sobre download/acesso que não verificou.
- Se um pedido estiver ambíguo, primeiro mostre uma proposta visual/especificação curta para aprovação, conforme os requisitos de arte abaixo. Não gere dezenas de assets em massa sem aprovação.
- Nunca tocar no ícone do executável Windows se o usuário não pedir.
- Antes de empacotar: listar os membros do ZIP, verificar que inclui `client/index.html`, `client/js`, `client/css`, `server/server.js`, `shared/constants.js`, assets usados e README; contar arquivos/tamanho; testar descompactação; fornecer link raw direto. Não reusar nome/URL de ZIP que possa servir conteúdo antigo em cache.

## 4. Preferências visuais mais recentes (substituem conflitos antigos)

A prioridade atual de personagens é **bonequinho pequeno do mapa**, não retrato/foto grande. O usuário corrigiu explicitamente que não quer estilo muito fofo exagerado nem corpo realista grande. Quer sprites pixel art pequenos em tamanho próximo ao que aparece no mapa, aproximadamente nativo 16×24 a 16×32 px; corpo inteiro cabeça-aos-pés visível (a opção de tamanho 1 da folha `bonecos_corpo_mapa.png` foi aprovada). Quer variedade por idade com aparência de bebê de verdade até idoso, sem infantilizar adultos.

Últimos ajustes solicitados e registrados: adulto um pouco mais gordo, adolescente mais fino, bebê menor, recém-nascido representado só por cabeça e cobertor. Prefere revisar duas opções por idade e poder pedir “sugerir/gerar de novo” até aprovar. Dualidade por personagem quando aplicável: sprite de mapa pequeno em quatro direções + retrato de diálogo separado, detalhado, mas não confundir retrato com sprite. Fluxo: gerar proposta → usuário aprova → adicionar ao jogo com animação/movimento.

Requisitos de movimento: animação de pernas andando naturalmente, pés tocando o chão, sem parecer que o boneco está sendo arrastado e sem sombra flutuante. Evitar exagero de balanço/bob. Não priorizar agora chão feio.

Há uma folha aprovada `client/assets/bonecos_corpo_mapa_v2_faces.png` com seis perfis (recém-nascido cobertor, bebê, criança, teen, adulto, idoso); `body_*.png` são crops de sprites. O agente relata ter ajustado `client/js/art/characters.js` para escala/ancoragem nos pés, swing de pernas e sombra no chão. Inspecione implementação e teste em execução; não trate a afirmação anterior como prova de que o usuário viu a mudança.

## 5. Pedidos de produto/arte ainda relevantes

O usuário tem instruções oficiais anteriores (22/10) que continuam valendo, desde que não contradigam as preferências mais recentes de sprites acima:

1. **HUD/hotbar:** corrigir tamanho útil dos ícones. Investigar diferença entre slot ~70 px, conteúdo desenhado/asset (alguns podem ter área útil de ~16 px) e CSS `.slot .icon img`. Preservar proporção e nitidez; não aumentar só o quadrado sem encontrar a causa.
2. **Retratos de diálogo:** pixels nítidos, enquadramento completo e identidade consistente com sprite. A orientação antiga citava fonte 64×64 e exibição de 112 px; confirmar se ainda é aplicável antes de concluir. Não usar sprite pequeno borrado como retrato. Não confundir com tamanho do boneco do mapa.
3. **Bases corporais:** auditar os bodies existentes; propor matriz por idade/apresentação, compatibilidade de layers e quatro direções. Propor e obter aprovação antes de ampliar produção. A proposta histórica falava em bebê + corpos criança/teen/adulto/idoso e variantes; a preferência mais recente é sprites pequenos sem aparência excessivamente fofa/realista.
4. **Roupas:** auditar 21 layers existentes e a meta histórica até 40. Antes de criar assets, apresentar tabela de nome, categoria, apresentação, paleta, estilo e compatibilidade; evitar duplicatas e aguardar aprovação.
5. **Documentação:** atualizar `docs/ART_STYLE_GUIDE.md` e `docs/PROJECT_STATE.md` com preferências informais, autonomia técnica, pixel art acolhedora, distinção retrato/sprite, hotbar, propostas antes de produção e exigência de evidências.
6. **Integridade:** preservar estado existente; auditar primeiro; classificar cada item; não criar massa de assets sem verificar.

Outras preferências previamente registradas: corpos não quadrados minúsculos, escala de NPC coerente; pele representada por quadradinhos pixelados; sem anatomia explícita; não copiar Stardew; casas maiores eram uma preferência histórica; agente deve propor soluções técnicas e documentar decisões. Dê prioridade aos itens que o usuário confirmar como atuais.

## 6. Trabalho recente e fatos técnicos a verificar

- Na branch de trabalho mais recente conhecida, `arena/629415fb-jogo`, o agente fez `3b8b55c` (sprites de personagens de mapa / animação/sombra) e `9b7e935` (cache-busting), além de commits posteriores adicionando arquivos ZIP ao GitHub. O checkout/ZIP mencionado no handoff tem HEAD `2d5b86c`; confira a cópia atual antes de usar esses hashes.
- `client/js/art/characters.js`: relatado código que carrega body/layer assets com query `?v=3b8b55c` para bust cache; drawBody teria sido ajustado porque antes desenhava sprite `W*PIX × H*PIX` dentro de canvas desse tamanho, aparentando 3.8× menor. Relatado draw com escala ancorada nos pés, swing lateral de pernas em 4 frames, aproximadamente 9 fps, bob baixo e elipse de sombra no chão.
- `shared/constants.js`: `BODY_OPTIONS` havia sido ampliado para cerca de 17 opções com scales reportadas de 0.85 a 1.20. Verificar valores realmente existentes e ligação a assets atuais.
- O agente tentou `npm install` e testes, mas a instalação de Electron falhou com `RequestError: unable to verify first certificate`; em seguida `npm test` falhou com `ERR_MODULE_NOT_FOUND` para `express`/`socket.io-client`; servidor não iniciou e tentativa contra localhost:3000 devolveu HTTP 000. Logo, naquela tentativa **não houve validação em jogo nem testes completos**. Reinstale/teste no ambiente disponível, descrevendo qualquer bloqueio real. Não atribua o defeito visual ao usuário/cache sem evidência.
- O pacote de 21 MB (14 entradas) era incompleto; não indicar como pacote de jogo. O de 78 MB tinha 493 entradas e os principais diretórios do jogo, mas excluía imagens `*_preview.png`/`*_preview.jpg`; alegações anteriores de “tudo completo” foram fortes demais. O novo ZIP junto deste prompt deve ser inspecionado por você, não tomado como confiável apenas pelo texto.
- A screenshot mostrada pelo usuário era uma página E2B 403 “MISSING TRAFFIC ACCESS TOKEN” no sandbox. O link solicitado pelo usuário é link raw público direto, não link E2B.

## 7. Histórico de problemas de código (contexto; não misturar com bug visual atual)

Um handoff histórico detalhado está no arquivo `PROMPT_PARA_PROXIMA_IA.md` do ZIP. Ele registra problemas anteriores e contexto de produto. Resumo dos problemas ainda potencialmente relevantes:

- Teste multiplayer intermitente reportado antigamente: falha Regar+Maioria 1/42 na porta 34568; 100 ciclos sequenciais e 50 paralelos passaram em reprodução isolada, mas falha original não reproduzida. Não inventar causa raiz nem declarar corrigido pelos PASS.
- Bug anterior de votos de sono persistentes: reprodução antiga indicou voto individual de uma noite contaminar a seguinte, avançando o dia indevidamente. Não está claro se já foi alterado desde aquele relatório; auditar o código atual e adicionar teste determinístico antes de corrigir. Não mexer em lógica de rega/avanço do dia com correção especulativa.
- `once()` com listener potencialmente mantido após timeout e `sleep(150)` nos testes foram apontados como problemas de higiene/timing; verificar a versão atual. Não aumentar timeouts nem introduzir esperas arbitrárias para esconder intermitência.
- Histórico de seletores/UI e arte contém instruções antigas sobre retratos maiores, nude base bodies e listas de roupa. Essas não superam a especificação mais recente em §4; quando houver conflito, a mais recente vence.

## 8. Plano de trabalho obrigatório para a próxima IA

### Fase A — confirmar a entrega e o estado real
1. Inventariar ZIP recebido e extrair em diretório temporário limpo.
2. Listar top-level e verificar os arquivos essenciais citados; verificar SHA/tamanho/contagem de arquivos.
3. Comparar o ZIP com código-fonte, não com nomes apenas. Confirmar referências e existência dos assets carregados em runtime.
4. Reportar claramente: “contém todo o código-fonte central, mas exclui N previews” ou “faltam estes arquivos essenciais” — sem chamar incompleto de completo.
5. Testar a forma de execução documentada, se dependências disponíveis. Se falhar, colar erro exato e separar instalação, servidor, navegador e comportamento visual.

### Fase B — identificar o problema que persiste
1. Pedir ou obter descrição reproduzível do sintoma atual (página/fluxo, passos, expectativa vs observado, versão/ZIP e screenshot/console). Se já houver evidência no material do usuário, usar essa evidência.
2. Reproduzir com o código e assets extraídos. Inspecionar URLs/network (404/cache), dimensões reais de PNG e canvas/CSS, `drawImage`, escala e anchor; obter screenshot real da execução.
3. Encontrar causa raiz antes de editar. Adicionar repro/teste que falhe antes do fix, sem ampliar timeouts como paliativo.
4. Corrigir a causa, executar testes pertinentes e comparar screenshot antes/depois em mesma escala e cena; se não puder executar, declarar BLOQUEADA e motivo concreto.
5. Não encerrar com “está corrigido” se não houver evidência visual de que o usuário não vê mais o defeito.

### Fase C — pedidos de arte restantes
Auditar primeiro HUD, bodies, layers, diálogo e docs. Fazer proposta por imagem/tabela e pedir aprovação onde o usuário exige; só então gerar/alterar assets. Em sprites, preservar tamanho nativo pequeno, silhuetas e identidade por idade; manter alpha, pixel edges limpos, sem blur. Verificar quatro direções e compatibilidade de roupa na prática.

### Fase D — entrega
Se gerar novo pacote, dê nome novo com versão/hash, zip raiz com uma única pasta `Jogo/`, inclua cliente, servidor, shared, testes, docs, package files e assets usados. Não coloque dentro do ZIP outros ZIPs antigos. Teste `unzip -t`; liste amostra dos membros e conte-os. Informe tamanho e exclusões explícitas. Para link, preferir raw direto que inicia download, nunca sandbox/preview. Não diga “npm start funciona” sem instalar/testar.

## 9. Formato de retorno exigido

Responder ao usuário nesta ordem:
1. confirmação curta e honesta do que o ZIP contém e do que não contém;
2. estado do sintoma atual com evidência (ou pergunta objetiva se faltam dados);
3. tabela por tarefa `CONCLUÍDA / PARCIAL / BLOQUEADA / NÃO INICIADA`, com arquivo/comando/resultado;
4. mudanças executadas e testes efetivamente rodados, incluindo os que falharam;
5. link direto do ZIP apenas depois de validar seus membros e o link, se for solicitado/criado;
6. próximos passos concretos, sem atribuir culpa ao usuário.

## 10. Anexo histórico

Leia também `PROMPT_PARA_PROXIMA_IA.md` para o inventário histórico mais extenso de pedidos e dificuldades anteriores. Esse documento é contexto adicional, pode conter estado/contagens antigos e instruções anteriores conflitantes; use este handoff (23/10/2026) e as preferências mais recentes do usuário como fonte de verdade quando houver divergência.
