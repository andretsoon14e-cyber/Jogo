# 🖥️ Como gerar o `.exe` e jogar online

O jogo é **um site + um servidor Node**. O Electron empacota os dois num programa Windows: ao abrir o `.exe`, o servidor sobe internamente numa porta livre e a janela carrega o jogo. Não é preciso instalar Node na máquina de quem joga.

---

## 1. Gerar o executável no Windows (caminho feliz)

Pré-requisitos na máquina que vai **compilar**:

- Node.js 18+ (recomendado 20/22 LTS)
- Windows 10/11 (o build de Windows é mais confiável rodando no próprio Windows)

```bash
npm install
npm run build:exe
```

Resultado em `dist/`:

- `Vale Aconchegante Setup 1.0.0.exe` → instalador (cria atalho na área de trabalho)
- `Vale Aconchegante 1.0.0.exe` → versão portátil (não instala nada)

### Só o portátil (mais rápido)

```bash
npm run build:exe:portable
```

### Testar como desktop sem empacotar

```bash
npm run electron
```

> Na primeira execução, o `npm install` baixa o binário do Electron (~90 MB). Se sua rede bloqueia, use `ELECTRON_SKIP_BINARY_DOWNLOAD=1 npm install` apenas para instalar as dependências do servidor e rode o jogo no navegador com `npm start`.

---

## 2. Gerar `.exe` estando em Linux/macOS

O `electron-builder` consegue cross-compilar Windows, mas precisa de **Wine** para assinar/embutir alguns recursos.

```bash
# Ubuntu/Debian (exemplo)
sudo apt install wine64
npm install
npm run build:exe
```

Se o Wine não estiver disponível, o caminho mais simples é rodar o build numa máquina Windows, numa VM, ou usar GitHub Actions com `runs-on: windows-latest`.

### Exemplo de GitHub Actions (build automático)

Crie `.github/workflows/build.yml`:

```yaml
name: build-windows
on:
  push:
    tags: ["v*"]
  workflow_dispatch:
jobs:
  build:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install
      - run: npm run build:exe
      - uses: actions/upload-artifact@v4
        with:
          name: vale-aconchegante-win
          path: dist/*.exe
```

---

## 3. Configurações do empacotamento

Já estão em `package.json` → chave `build`:

```json
{
  "appId": "com.valeaconchegante.jogo",
  "productName": "Vale Aconchegante",
  "asar": true,
  "files": ["client/**/*", "server/**/*", "shared/**/*", "electron.cjs", "package.json"],
  "win": { "target": ["nsis", "portable"], "icon": "client/assets/icon.png" }
}
```

- **Ícone**: `client/assets/icon.png` (512×512). Para um `.ico` próprio, coloque `build/icon.ico`.
- **Dados salvos**: no app empacotado, os mundos e contas vão para a pasta de dados do usuário (ex.: `%APPDATA%/Vale Aconchegante/worlds`), fora do `.exe`. Atualizações não apagam o save.
- **Tamanho**: cerca de 70–90 MB por causa do Chromium embutido.

---

## 4. Jogar online com amigos (host gratuito)

O `.exe` serve o jogo para a máquina local. Para amigos em outras casas, alguém precisa hospedar o servidor. Opções **gratuitas**:

### Opção A — Render (free tier), mais simples

1. Suba o projeto no GitHub.
2. Em [render.com](https://render.com): **New → Web Service** → conecte o repositório.
3. Configurações:
   - Build: `npm install`
   - Start: `npm start`
   - Health check: `/health`
4. Pronto: a URL `https://seu-jogo.onrender.com` abre o jogo para todos.

> No plano free o serviço "dorme" após inatividade (acorda em ~30–60 s). O disco é efêmero: **os mundos podem ser perdidos em um redeploy**. Para saves persistentes, use um disco pago ou faça backup periódico do JSON.

### Opção B — Fly.io / Railway / VPS pequena

Melhor para saves persistentes (volume). Comando típico:

```bash
# Dockerfile mínimo
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
ENV PORT=3000 DATA_DIR=/data
VOLUME /data
CMD ["node", "server/server.js"]
```

Monte um volume em `/data` e defina `DATA_DIR=/data`. Assim `users.json`, `secret.key` e os mundos sobrevivem.

### Opção C — túnel temporário a partir da sua máquina

```bash
npm start
# em outro terminal, com cloudflared instalado:
cloudflared tunnel --url http://localhost:3000
```

Ideal para jogar uma tarde com amigos, sem hospedagem. O link expira quando você fecha o túnel.

### Variáveis de ambiente suportadas

| Variável | Padrão | Para que serve |
|---|---|---|
| `PORT` | `3000` | porta do servidor (Render/Railway injetam) |
| `DATA_DIR` | `server/data` | pasta de contas, segredo e mundos |

---

## 5. Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| `EADDRINUSE` | já existe outro Node na porta | feche o outro processo ou use `PORT=3001 npm start` |
| Janela branca no Electron | servidor embutido falhou | abra o app pelo terminal (`npm run electron`) e leia o erro |
| Amigos não conectam | servidor só em `localhost` | hospede (Opção A/B/C) ou use a rede local com o IP da máquina |
| Save sumiu em produção | disco efêmero do host | use volume/`DATA_DIR` persistente e backups |
| Antivírus reclama do `.exe` | executável não assinado | normal em builds caseiros; assine com certificado se distribuir |
| `npm install` falha no Electron | rede/proxy bloqueando o download | `ELECTRON_SKIP_BINARY_DOWNLOAD=1 npm install` e jogue no navegador |

---

## 6. Checklist antes de compartilhar

- [ ] `npm test` e `npm run test:client` passando.
- [ ] Trocou a senha dos jogadores? (não há senha padrão — cada conta é criada pelo jogador)
- [ ] Se for público: colocou HTTPS na frente (provedor ou Cloudflare).
- [ ] Se for público: fez backup de `DATA_DIR`.
- [ ] Não commitou `server/data/` (já está no `.gitignore`).
