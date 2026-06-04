// Captura screenshots reais do app (viewport de celular) para uso na
// apresentação em PDF. Os JPEGs ficam versionados em docs/screenshots/, então
// `npm run docs` funciona sem este passo. Para recapturar:
//   1) npm i -D puppeteer   (baixa um Chromium headless)
//   2) npm run build && npm run start   (servir em http://localhost:3000)
//   3) node scripts/capturar-telas.mjs

import puppeteer from "puppeteer";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "docs", "screenshots");
const BASE = "http://localhost:3000";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  headless: "new",
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--hide-scrollbars"],
});

const page = await browser.newPage();
await page.setViewport({ width: 402, height: 900, deviceScaleFactor: 1.5, isMobile: true });

// Faz o navegador "suportar" reconhecimento de voz para os botões de microfone aparecerem.
await page.evaluateOnNewDocument(() => {
  class FakeSR {
    constructor() { this.lang = "pt-BR"; this.continuous = true; this.interimResults = true; }
    start() {} stop() {} abort() {}
    addEventListener() {} removeEventListener() {}
  }
  // @ts-ignore
  window.SpeechRecognition = FakeSR;
  // @ts-ignore
  window.webkitSpeechRecognition = FakeSR;
});

async function shot(name) {
  await sleep(900);
  await page.screenshot({ path: join(OUT, name), type: "jpeg", quality: 82 });
  console.log("📸", name);
}

// 1) Login demo -> Dashboard
await page.goto(`${BASE}/login?demo=1`, { waitUntil: "networkidle2" });
await page.waitForFunction(() => location.pathname === "/app", { timeout: 15000 }).catch(() => {});
await sleep(1200);
await shot("01-dashboard.jpg");

// 2) Criar RDO — seletor de modos
await page.goto(`${BASE}/app/rdo/novo`, { waitUntil: "networkidle2" });
await shot("02-modos.jpg");

// 3) Criar por perguntas (pergunta direcionada + microfone)
await page.goto(`${BASE}/app/rdo/novo?modo=perguntas`, { waitUntil: "networkidle2" });
await shot("03-perguntas.jpg");

// 4) Criar por voz (microfone)
await page.goto(`${BASE}/app/rdo/novo?modo=voz`, { waitUntil: "networkidle2" });
await shot("04-voz.jpg");

// 5) RDO gerado, rolado até as fotos
const rdoId = await page.evaluate(() => {
  try {
    const raw = localStorage.getItem("obrareport-ia-store");
    const data = JSON.parse(raw).state || JSON.parse(raw);
    const withMedia = (data.reports || []).find((r) => (r.media || []).length > 0);
    return (withMedia || data.reports[0]).id;
  } catch { return null; }
});
if (rdoId) {
  await page.goto(`${BASE}/app/rdo/${rdoId}`, { waitUntil: "networkidle2" });
  await sleep(800);
  await page.evaluate(() => {
    const el = [...document.querySelectorAll("h3,h2,p,span")].find((n) => /Fotos e v/i.test(n.textContent || ""));
    if (el) el.scrollIntoView({ block: "center" });
    else window.scrollTo(0, 380);
  });
  await shot("05-rdo-fotos.jpg");
}

await browser.close();
console.log("OK — screenshots em", OUT);
