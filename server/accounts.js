import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

// Contas locais com senha protegida por scrypt e sessão assinada por HMAC.
// Nenhuma senha em texto puro, nenhum serviço pago, nenhuma credencial externa.

const DATA_DIR = () => process.env.DATA_DIR || path.join("server", "data");
const USERS_FILE = () => path.join(DATA_DIR(), "users.json");
const SECRET_FILE = () => path.join(DATA_DIR(), "secret.key");

let users = null;
let secret = null;

function ensureLoaded() {
  if (users) return;
  const dir = DATA_DIR();
  fs.mkdirSync(dir, { recursive: true });
  try {
    users = fs.existsSync(USERS_FILE()) ? JSON.parse(fs.readFileSync(USERS_FILE(), "utf-8")) : {};
  } catch {
    users = {};
  }
  try {
    if (fs.existsSync(SECRET_FILE())) {
      secret = fs.readFileSync(SECRET_FILE(), "utf-8").trim();
    } else {
      secret = crypto.randomBytes(48).toString("hex");
      fs.writeFileSync(SECRET_FILE(), secret, { mode: 0o600 });
    }
  } catch {
    secret = crypto.randomBytes(48).toString("hex");
  }
}

function persist() {
  const dir = DATA_DIR();
  fs.mkdirSync(dir, { recursive: true });
  const target = USERS_FILE();
  const tmp = target + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(users, null, 2));
  fs.renameSync(tmp, target);
}

export function normalizeUsername(raw) {
  return String(raw || "")
    .replace(/[^\p{L}\p{N}_\- ]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 20);
}

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

export function validateCredentials(rawName, password) {
  const username = normalizeUsername(rawName);
  if (username.length < 3) return { ok: false, error: "O nome precisa ter pelo menos 3 caracteres." };
  if (!password || String(password).length < 4) return { ok: false, error: "A senha precisa ter pelo menos 4 caracteres." };
  if (String(password).length > 200) return { ok: false, error: "Senha muito longa." };
  return { ok: true, username, password: String(password) };
}

export function register(rawName, password) {
  ensureLoaded();
  const v = validateCredentials(rawName, password);
  if (!v.ok) return v;
  const key = v.username.toLowerCase();
  if (users[key]) return { ok: false, error: "Já existe uma conta com esse nome. Faça login." };
  const salt = crypto.randomBytes(16).toString("hex");
  users[key] = {
    username: v.username,
    salt,
    hash: hashPassword(v.password, salt),
    createdAt: new Date().toISOString(),
  };
  persist();
  return { ok: true, username: v.username, token: issueToken(v.username) };
}

export function login(rawName, password) {
  ensureLoaded();
  const username = normalizeUsername(rawName);
  const user = users[username.toLowerCase()];
  if (!user) return { ok: false, error: "Conta não encontrada. Crie uma conta." };
  const hash = hashPassword(String(password || ""), user.salt);
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(user.hash, "hex");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { ok: false, error: "Senha incorreta." };
  }
  return { ok: true, username: user.username, token: issueToken(user.username) };
}

function sign(data) {
  ensureLoaded();
  return crypto.createHmac("sha256", secret).update(data).digest("base64url");
}

export function issueToken(username, days = 30) {
  const payload = Buffer.from(JSON.stringify({ u: username, exp: Date.now() + days * 86400000 })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifyToken(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) return null;
  const [payload, sig] = token.split(".");
  const expected = sign(payload);
  const a = Buffer.from(sig || "");
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"));
    if (!data.exp || data.exp < Date.now()) return null;
    if (!users?.[data.u.toLowerCase()]) return null;
    return data.u;
  } catch {
    return null;
  }
}
