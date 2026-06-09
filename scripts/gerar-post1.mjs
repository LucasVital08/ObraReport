// Gera os PNGs do carrossel do Post 1 ("Fim do caderninho de obra").
// Uso: node scripts/gerar-post1.mjs  → docs/posts/post1/slide-N.png
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const W = 1080, H = 1350;
const ORANGE = "#f4720b", GRAPHITE = "#11181f", WHITE = "#ffffff";
const LIGHT = "#f5f6f8", MUTED_D = "#9aa6b2", MUTED_L = "#5b6770", INK = "#11181f";
const OUT = join(process.cwd(), "docs", "posts", "post1");
mkdirSync(OUT, { recursive: true });

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Empilha linhas de texto a partir de y, retornando os <text>.
function lines(arr, x, y, size, color, weight = "700", lh = 1.12) {
  return arr.map((t, i) =>
    `<text x="${x}" y="${y + i * size * lh}" font-family="DejaVu Sans, Arial, sans-serif" font-size="${size}" font-weight="${weight}" fill="${color}">${esc(t)}</text>`,
  ).join("");
}

// Cabeçalho da marca (logo OR + nome)
function brand(color, sub) {
  return `
    <rect x="90" y="96" width="64" height="64" rx="16" fill="${ORANGE}"/>
    <text x="122" y="140" text-anchor="middle" font-family="DejaVu Sans, Arial, sans-serif" font-size="30" font-weight="800" fill="#ffffff">OR</text>
    <text x="172" y="128" font-family="DejaVu Sans, Arial, sans-serif" font-size="30" font-weight="800" fill="${color}">ObraReport IA</text>
    <text x="172" y="156" font-family="DejaVu Sans, Arial, sans-serif" font-size="20" font-weight="600" fill="${sub}">RDO por voz, foto e IA</text>`;
}

function counter(n, color) {
  return `<text x="${W - 90}" y="${H - 70}" text-anchor="end" font-family="DejaVu Sans, Arial, sans-serif" font-size="26" font-weight="700" fill="${color}">${n} / 6</text>`;
}

function slide({ bg, accentDark, kicker, kickerColor, headline, headlineColor, sub, subColor, n, footer, footerColor }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <rect width="${W}" height="${H}" fill="${bg}"/>
    <circle cx="${W + 80}" cy="-60" r="240" fill="${ORANGE}" opacity="0.14"/>
    <circle cx="-80" cy="${H + 80}" r="220" fill="${ORANGE}" opacity="${accentDark ? 0.12 : 0.08}"/>
    ${brand(headlineColor, kickerColor)}
    <rect x="90" y="430" width="120" height="12" rx="6" fill="${ORANGE}"/>
    ${kicker ? `<text x="90" y="400" font-family="DejaVu Sans, Arial, sans-serif" font-size="26" font-weight="800" letter-spacing="2" fill="${kickerColor}">${esc(kicker)}</text>` : ""}
    ${lines(headline, 90, 540, 86, headlineColor, "800", 1.1)}
    ${sub ? lines(sub, 90, 540 + headline.length * 86 * 1.1 + 56, 38, subColor, "600", 1.25) : ""}
    ${footer ? `<text x="90" y="${H - 70}" font-family="DejaVu Sans, Arial, sans-serif" font-size="26" font-weight="700" fill="${footerColor}">${esc(footer)}</text>` : ""}
    ${counter(n, footerColor)}
  </svg>`;
}

const slides = [
  // 1 — Capa (fundo escuro)
  slide({
    bg: GRAPHITE, accentDark: true, kicker: "DIÁRIO DE OBRA", kickerColor: ORANGE,
    headline: ["Fim do", "caderninho", "de obra."], headlineColor: WHITE,
    sub: ["Por que o papel está com", "os dias contados. Arrasta. →"], subColor: MUTED_D,
    n: 1, footer: "obrareport", footerColor: MUTED_D,
  }),
  // 2
  slide({
    bg: LIGHT, kicker: "O PROBLEMA", kickerColor: ORANGE,
    headline: ["Papel molha,", "rasga e some."], headlineColor: INK,
    sub: ["E justo o RDO — que é a sua", "prova — não pode se perder."], subColor: MUTED_L,
    n: 2, footer: "obrareport", footerColor: MUTED_L,
  }),
  // 3
  slide({
    bg: LIGHT, kicker: "O CUSTO", kickerColor: ORANGE,
    headline: ["RDO incompleto", "= prejuízo."], headlineColor: INK,
    sub: ["Falta de registro vira retrabalho", "e dor de cabeça com o cliente."], subColor: MUTED_L,
    n: 3, footer: "obrareport", footerColor: MUTED_L,
  }),
  // 4 — virada (fundo escuro)
  slide({
    bg: GRAPHITE, accentDark: true, kicker: "E SE…", kickerColor: ORANGE,
    headline: ["E se você só", "falasse o que", "aconteceu", "no dia?"], headlineColor: WHITE,
    sub: ["Sem digitar. Sem ficar até tarde."], subColor: MUTED_D,
    n: 4, footer: "obrareport", footerColor: MUTED_D,
  }),
  // 5
  slide({
    bg: LIGHT, kicker: "A SOLUÇÃO", kickerColor: ORANGE,
    headline: ["A IA monta o", "RDO profissional", "pra você."], headlineColor: INK,
    sub: ["Voz + foto → relatório em PDF,", "pronto pra enviar ao contratante."], subColor: MUTED_L,
    n: 5, footer: "obrareport", footerColor: MUTED_L,
  }),
  // 6 — CTA (fundo laranja)
  slide({
    bg: ORANGE, kicker: "COMECE HOJE", kickerColor: "#5a2a00",
    headline: ["Teste grátis.", "Link na bio."], headlineColor: WHITE,
    sub: ["ObraReport IA — faça o RDO", "falando, direto do canteiro."], subColor: "#ffe6d2",
    n: 6, footer: "@obrareport", footerColor: "#ffe6d2",
  }),
];

for (let i = 0; i < slides.length; i++) {
  const file = join(OUT, `slide-${i + 1}.png`);
  await sharp(Buffer.from(slides[i])).png().toFile(file);
  console.log("ok:", file);
}
console.log(`\n${slides.length} slides gerados em docs/posts/post1/`);
