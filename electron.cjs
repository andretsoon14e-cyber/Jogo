// Electron - gera o executável .exe do Vale Aconchegante
// Roda o servidor Express + Socket.IO dentro do próprio app e abre a janela do jogo.
const { app, BrowserWindow, Menu, shell, dialog } = require("electron");
const path = require("node:path");
const fs = require("node:fs");

let mainWindow = null;
let gameServer = null;
let gamePort = 3000;

async function startEmbeddedServer() {
  // Pasta gravável para os mundos salvos (fora do app.asar)
  const dataDir = path.join(app.getPath("userData"), "worlds");
  fs.mkdirSync(dataDir, { recursive: true });
  process.env.DATA_DIR = dataDir;
  process.env.PORT = "0"; // porta livre escolhida pelo sistema

  // importa o servidor ESM de dentro do pacote (asar é suportado pelo Electron)
  const mod = await import(path.join(__dirname, "server", "server.js"));
  const srv = mod.server;

  await new Promise((resolve, reject) => {
    srv.once("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      gamePort = srv.address().port;
      gameServer = srv;
      console.log("Servidor embutido na porta", gamePort);
      resolve();
    });
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    backgroundColor: "#87ceeb",
    title: "Vale Aconchegante",
    autoHideMenuBar: true,
    icon: path.join(__dirname, "client", "assets", "icon.png"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  mainWindow.loadURL(`http://127.0.0.1:${gamePort}`);
  mainWindow.on("closed", () => (mainWindow = null));

  // Links externos abrem no navegador padrão, nunca dentro do jogo
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

app.whenReady().then(async () => {
  try {
    await startEmbeddedServer();
    createWindow();
  } catch (err) {
    console.error(err);
    dialog.showErrorBox(
      "Erro ao iniciar o Vale Aconchegante",
      "Não foi possível iniciar o servidor interno.\n\n" + String(err)
    );
    app.quit();
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
