// Gera os PNGs dos posts 2 a 6 (carrosséis de imagem, máx 4 slides cada).
// Uso: node scripts/gerar-posts.mjs  → docs/posts/postN/slide-K.png
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const W = 1080, H = 1350;
const ORANGE = "#f4720b", GRAPHITE = "#11181f", WHITE = "#ffffff";
const LIGHT = "#f5f6f8", MUTED_D = "#9aa6b2", MUTED_L = "#5b6770", INK = "#11181f";

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function lines(arr, x, y, size, color, weight = "800", lh = 1.12) {
  return arr.map((t, i) =>
    `<text x="${x}" y="${y + i * size * lh}" font-family="DejaVu Sans, Arial, sans-serif" font-size="${size}" font-weight="${weight}" fill="${color}">${esc(t)}</text>`,
  ).join("");
}
function brand(color, sub) {
  return `
    <rect x="90" y="96" width="64" height="64" rx="16" fill="${ORANGE}"/>
    <text x="122" y="140" text-anchor="middle" font-family="DejaVu Sans, Arial, sans-serif" font-size="30" font-weight="800" fill="#ffffff">OR</text>
    <text x="172" y="128" font-family="DejaVu Sans, Arial, sans-serif" font-size="30" font-weight="800" fill="${color}">ObraReport IA</text>
    <text x="172" y="156" font-family="DejaVu Sans, Arial, sans-serif" font-size="20" font-weight="600" fill="${sub}">RDO por voz, foto e IA</text>`;
}

function slide(s) {
  const size = s.size || 86;
  const subY = 540 + s.headline.length * size * 1.1 + 54;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <rect width="${W}" height="${H}" fill="${s.bg}"/>
    <circle cx="${W + 80}" cy="-60" r="240" fill="${ORANGE}" opacity="0.13"/>
    <circle cx="-80" cy="${H + 80}" r="220" fill="${ORANGE}" opacity="0.08"/>
    ${brand(s.headlineColor, s.kickerColor)}
    <text x="90" y="400" font-family="DejaVu Sans, Arial, sans-serif" font-size="26" font-weight="800" letter-spacing="2" fill="${s.kickerColor}">${esc(s.kicker)}</text>
    <rect x="90" y="430" width="120" height="12" rx="6" fill="${ORANGE}"/>
    ${lines(s.headline, 90, 540, size, s.headlineColor, "800", 1.1)}
    ${s.sub ? lines(s.sub, 90, subY, 38, s.subColor, "600", 1.25) : ""}
    <text x="90" y="${H - 70}" font-family="DejaVu Sans, Arial, sans-serif" font-size="26" font-weight="700" fill="${s.footerColor}">${esc(s.footer || "obrareport")}</text>
    <text x="${W - 90}" y="${H - 70}" text-anchor="end" font-family="DejaVu Sans, Arial, sans-serif" font-size="26" font-weight="700" fill="${s.footerColor}">${s.n} / ${s.total}</text>
  </svg>`;
}

// Atalhos de paleta
const dark = (o) => ({ bg: GRAPHITE, headlineColor: WHITE, kickerColor: ORANGE, subColor: MUTED_D, footerColor: MUTED_D, ...o });
const light = (o) => ({ bg: LIGHT, headlineColor: INK, kickerColor: ORANGE, subColor: MUTED_L, footerColor: MUTED_L, ...o });
const cta = (o) => ({ bg: ORANGE, headlineColor: WHITE, kickerColor: "#5a2a00", subColor: "#ffe6d2", footerColor: "#ffe6d2", footer: "@obrareport", ...o });

const posts = {
  post2: [
    dark({ kicker: "ADEUS, RELATÓRIO À NOITE", headline: ["Faça o RDO", "falando."], sub: ["Do canteiro pro PDF, sem digitar."] }),
    light({ kicker: "ANTES", headline: ["22h digitando", "o relatório."], sub: ["Cansado, no fim do dia,", "no caderno ou na planilha."] }),
    light({ kicker: "AGORA", headline: ["É só falar."], sub: ["Voz + foto no canteiro e a IA", "monta o RDO profissional."] }),
    cta({ kicker: "EM MINUTOS", headline: ["Do áudio ao", "PDF pronto."], sub: ["Teste grátis. Link na bio."] }),
  ],
  post3: [
    dark({ kicker: "PROTEÇÃO JURÍDICA", headline: ["O Diário de", "Obra é a", "sua prova."], sub: ["Não é burocracia — é defesa."] }),
    light({ kicker: "A REGRA", headline: ["O que não está", "registrado,", "não aconteceu."], sub: ["Atraso, aditivo, paralisação,", "ocorrência: tudo precisa de RDO."] }),
    light({ kicker: "POR QUÊ", headline: ["Defende a", "medição.", "Evita glosa."], sub: ["E organiza a obra de verdade."] }),
    cta({ kicker: "REGISTRAR É PROTEGER", headline: ["RDO completo,", "todo dia."], sub: ["ObraReport — facilite o registro.", "Link na bio."] }),
  ],
  post4: [
    dark({ kicker: "CHECKLIST", headline: ["5 itens que", "todo RDO", "precisa ter."], sub: ["Salva pra usar amanhã."] }),
    light({ size: 58, kicker: "ITENS 1 E 2", headline: ["1. Efetivo presente", "no dia", "2. Atividades + status"], sub: ["O básico que não pode faltar."] }),
    light({ size: 58, kicker: "ITENS 3, 4 E 5", headline: ["3. Ocorrências", "4. Materiais e", "equipamentos", "5. Fotos com legenda"] }),
    cta({ kicker: "FACILITA TUDO", headline: ["O ObraReport", "preenche por", "você."], sub: ["Teste grátis. Link na bio."] }),
  ],
  post5: [
    dark({ kicker: "COMPARA AÍ", headline: ["Planilha", "× ObraReport."], sub: ["Qual te faz perder menos tempo?"] }),
    light({ size: 60, kicker: "PLANILHA", headline: ["Trava, perde", "versão e", "ninguém", "preenche."], sub: ["E no canteiro fica pior ainda."] }),
    light({ size: 60, kicker: "OBRAREPORT", headline: ["Fala, foto,", "PDF pronto."], sub: ["E o contratante acompanha", "pelo app, em tempo real."] }),
    cta({ kicker: "MUDE HOJE", headline: ["Troque a", "planilha."], sub: ["14 dias grátis. Link na bio."] }),
  ],
  post6: [
    dark({ kicker: "ROTINA DE CANTEIRO", headline: ["Um dia de", "obra com o", "ObraReport."], sub: ["Do café à entrega do RDO."] }),
    light({ size: 60, kicker: "MANHÃ", headline: ["Foto da frente", "de serviço.", "Registro feito."], sub: ["O 'antes' documentado em 1 toque."] }),
    light({ size: 60, kicker: "IMPREVISTO", headline: ["Faltou", "material?", "Registra em 10s."], sub: ["A ocorrência entra no RDO do dia."] }),
    cta({ kicker: "FIM DO DIA", headline: ["PDF no zap do", "contratante."], sub: ["Relatório do dia: feito.", "Teste grátis. Link na bio."] }),
  ],
};

let total = 0;
for (const [dir, slides] of Object.entries(posts)) {
  const out = join(process.cwd(), "docs", "posts", dir);
  mkdirSync(out, { recursive: true });
  for (let i = 0; i < slides.length; i++) {
    const svg = slide({ ...slides[i], n: i + 1, total: slides.length });
    const file = join(out, `slide-${i + 1}.png`);
    await sharp(Buffer.from(svg)).png().toFile(file);
    total++;
  }
  console.log(`${dir}: ${slides.length} slides`);
}
console.log(`\nTotal: ${total} imagens em docs/posts/`);
