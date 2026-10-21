# Ferramentas de verificação visual (opcional)

Scripts usados para **conferir o resultado real do jogo** em um navegador headless:
capturas do mundo de dia/noite, das 4 estações, dos painéis, dos interiores, do
layout mobile, folha de sprites dos personagens e medição de FPS.

Eles **não fazem parte do jogo** e não são necessários para jogar nem para rodar
`npm test`. As dependências são instaladas à parte:

```bash
npm i --no-save puppeteer-core @sparticuz/chromium
node test/tools/shots.mjs http://localhost:3000 /tmp/shots SALA1
```

| Script | O que verifica |
|---|---|
| `shot.mjs` | Uma captura da tela do jogo |
| `shots.mjs` | Login, dia, pôr do sol, noite, todos os painéis, interiores e 3 regiões |
| `seasons.mjs` | Primavera, verão, outono, inverno e uma noite de verão |
| `zoom.mjs` / `zoom2.mjs` / `zoomtree.mjs` / `church.mjs` | Detalhes de casa, personagem, floresta e igreja |
| `sprites.mjs` | Folha com as 4 direções e a pose de ação de cada personagem |
| `anim.mjs` | Caminhada nas 4 direções |
| `action.mjs` | Pose com a ferramenta na mão |
| `mobile.mjs` | Layout em 420×860 (celular) |
| `perf.mjs` | FPS e memória em 1440×900 |

Em Linux, se o Chromium reclamar de bibliotecas, extraia as libs do pacote:

```bash
node -e "const fs=require('fs'),z=require('zlib');fs.createReadStream('node_modules/@sparticuz/chromium/bin/al2023.tar.br').pipe(z.createBrotliDecompress()).pipe(fs.createWriteStream('/tmp/al2023.tar'))"
mkdir -p /tmp/chromelibs && tar -xf /tmp/al2023.tar -C /tmp/chromelibs
LD_LIBRARY_PATH=/tmp/chromelibs/lib node test/tools/shots.mjs
```
