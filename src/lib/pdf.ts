import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { AiFinalResult, ClientVisibility, Company, DailyReport, Project } from "@/lib/types";
import { formatBRL, formatDateBR } from "@/lib/utils";

const BRAND: [number, number, number] = [244, 114, 11];
const GRAPHITE: [number, number, number] = [43, 49, 59];
const MUTED: [number, number, number] = [120, 128, 138];
const NAVY: [number, number, number] = [31, 61, 99]; // azul do modelo de relatório

interface Ctx {
  doc: jsPDF;
  company: Company;
  y: number;
  page: number;
  sectionNo: number;
  footerLabel?: string;
}

const M = 15; // margem
const PW = 210;
const PH = 297;

function newDoc(company: Company): Ctx {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  return { doc, company, y: M, page: 1, sectionNo: 0 };
}

function rgb(c: [number, number, number]) { return c; }

function ensureSpace(ctx: Ctx, needed: number) {
  if (ctx.y + needed > PH - 20) addPage(ctx);
}

function addPage(ctx: Ctx) {
  footer(ctx);
  ctx.doc.addPage();
  ctx.page += 1;
  ctx.y = M;
}

function footer(ctx: Ctx) {
  const { doc } = ctx;
  doc.setFontSize(8);
  doc.setTextColor(...rgb(MUTED));
  const left = ctx.footerLabel || `${ctx.company.name}  •  Gerado por ObraReport IA  •  ${formatDateBR(new Date().toISOString())}`;
  doc.text(left, M, PH - 10);
  doc.text(`página ${ctx.page}`, PW - M, PH - 10, { align: "right" });
  doc.setDrawColor(230);
  doc.line(M, PH - 14, PW - M, PH - 14);
}

// Cabeçalho de seção numerado, estilo do modelo de RDO (badge azul + título)
function numberedSection(ctx: Ctx, title: string) {
  ensureSpace(ctx, 16);
  const { doc } = ctx;
  ctx.sectionNo += 1;
  const badge = 6.5;
  doc.setFillColor(...rgb(NAVY));
  doc.roundedRect(M, ctx.y, badge, badge, 1.2, 1.2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(String(ctx.sectionNo), M + badge / 2, ctx.y + badge / 2 + 1.6, { align: "center" });
  doc.setTextColor(...rgb(NAVY));
  doc.setFontSize(11.5);
  doc.text(title.toUpperCase(), M + badge + 3, ctx.y + badge / 2 + 1.6);
  ctx.y += badge + 4;
}

// Bloco de identificação (rótulos em negrito + valores)
function kvBlock(ctx: Ctx, rows: [string, string][]) {
  const { doc } = ctx;
  const colW = (PW - 2 * M) / 2;
  let i = 0;
  while (i < rows.length) {
    ensureSpace(ctx, 6);
    for (let c = 0; c < 2 && i < rows.length; c++, i++) {
      const x = M + c * colW;
      const [label, value] = rows[i];
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...rgb(GRAPHITE));
      const lw = doc.getTextWidth(label + " ");
      doc.text(label, x, ctx.y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...rgb(MUTED));
      const val = doc.splitTextToSize(value, colW - lw - 2)[0] || value;
      doc.text(val, x + lw, ctx.y);
    }
    ctx.y += 5.5;
  }
  ctx.y += 2;
}

function logoBox(ctx: Ctx, x: number, y: number, size = 16) {
  const { doc, company } = ctx;
  doc.setFillColor(...rgb(BRAND));
  doc.roundedRect(x, y, size, size, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(size * 0.42);
  doc.setFont("helvetica", "bold");
  doc.text(company.logoText || company.name.slice(0, 3).toUpperCase(), x + size / 2, y + size / 2 + 1.5, { align: "center" });
}

function sectionTitle(ctx: Ctx, title: string) {
  ensureSpace(ctx, 14);
  const { doc } = ctx;
  doc.setFillColor(...rgb(BRAND));
  doc.rect(M, ctx.y, 3, 6, "F");
  doc.setTextColor(...rgb(GRAPHITE));
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(title, M + 6, ctx.y + 5);
  ctx.y += 10;
}

function paragraph(ctx: Ctx, text: string, opts?: { size?: number; color?: [number, number, number] }) {
  const { doc } = ctx;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(opts?.size ?? 10);
  doc.setTextColor(...rgb(opts?.color ?? GRAPHITE));
  const lines = doc.splitTextToSize(text, PW - 2 * M);
  for (const line of lines) {
    ensureSpace(ctx, 6);
    doc.text(line, M, ctx.y);
    ctx.y += 5;
  }
  ctx.y += 2;
}

function bullets(ctx: Ctx, items: string[], empty = "Nenhum registro.") {
  const { doc } = ctx;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...rgb(GRAPHITE));
  if (items.length === 0) {
    paragraph(ctx, empty, { color: MUTED });
    return;
  }
  for (const item of items) {
    const lines = doc.splitTextToSize(item, PW - 2 * M - 6);
    ensureSpace(ctx, lines.length * 5 + 1);
    doc.setFillColor(...rgb(BRAND));
    doc.circle(M + 1.5, ctx.y - 1.4, 0.8, "F");
    doc.text(lines, M + 6, ctx.y);
    ctx.y += lines.length * 5 + 1;
  }
  ctx.y += 2;
}

function table(ctx: Ctx, head: string[], body: (string | number)[][]) {
  if (body.length === 0) { paragraph(ctx, "Nenhum registro.", { color: MUTED }); return; }
  autoTable(ctx.doc, {
    startY: ctx.y,
    margin: { left: M, right: M },
    head: [head],
    body: body.map((r) => r.map(String)),
    theme: "grid",
    headStyles: { fillColor: GRAPHITE, fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: GRAPHITE },
    styles: { cellPadding: 2 },
    didDrawPage: () => {},
  });
  // @ts-expect-error lastAutoTable é adicionado pelo plugin
  ctx.y = (ctx.doc.lastAutoTable?.finalY ?? ctx.y) + 6;
}

function photoGrid(ctx: Ctx, media: DailyReport["media"]) {
  const photos = media.filter((m) => m.kind === "photo" && m.includeInPdf);
  if (photos.length === 0) { paragraph(ctx, "Sem fotos anexadas.", { color: MUTED }); return; }
  const cols = 2;
  const gap = 5;
  const w = (PW - 2 * M - gap) / cols;
  const h = w * 0.66;
  const rowH = h + 13; // imagem + 2 linhas de legenda
  let col = 0;
  for (const p of photos) {
    ensureSpace(ctx, rowH);
    const x = M + col * (w + gap);
    try {
      if (p.dataUrl) {
        ctx.doc.addImage(p.dataUrl, "JPEG", x, ctx.y, w, h, undefined, "FAST");
      } else {
        // Placeholder neutro (imagem ausente nos dados de demonstração)
        ctx.doc.setFillColor(238, 241, 245);
        ctx.doc.roundedRect(x, ctx.y, w, h, 2, 2, "F");
        ctx.doc.setTextColor(...rgb(MUTED));
        ctx.doc.setFontSize(9);
        ctx.doc.text("Registro fotográfico", x + w / 2, ctx.y + h / 2 - 1, { align: "center" });
        ctx.doc.setFontSize(7.5);
        ctx.doc.text(p.phase.toUpperCase(), x + w / 2, ctx.y + h / 2 + 4, { align: "center" });
      }
    } catch { /* ignora imagem inválida */ }
    ctx.doc.setDrawColor(225);
    ctx.doc.rect(x, ctx.y, w, h);
    ctx.doc.setTextColor(...rgb(MUTED));
    ctx.doc.setFontSize(7.5);
    const cap = ctx.doc.splitTextToSize(p.caption, w).slice(0, 2);
    ctx.doc.text(cap, x, ctx.y + h + 4);
    col += 1;
    if (col >= cols) { col = 0; ctx.y += rowH; }
  }
  if (col !== 0) ctx.y += rowH;
}

// Tabela "Solicitações e Providências" com prioridade colorida
function providenciasTable(ctx: Ctx, rows: { description: string; responsible: string; priority: string }[]) {
  if (rows.length === 0) { paragraph(ctx, "Nenhuma solicitação registrada.", { color: MUTED }); return; }
  autoTable(ctx.doc, {
    startY: ctx.y,
    margin: { left: M, right: M },
    head: [["SOLICITAÇÃO", "RESPONSÁVEL", "PRIORIDADE"]],
    body: rows.map((r) => [r.description, r.responsible, r.priority]),
    theme: "grid",
    headStyles: { fillColor: NAVY, fontSize: 8.5, halign: "left" },
    bodyStyles: { fontSize: 9, textColor: GRAPHITE },
    columnStyles: { 1: { cellWidth: 42 }, 2: { cellWidth: 26, halign: "center" } },
    styles: { cellPadding: 2 },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 2) {
        const v = String(data.cell.raw).toLowerCase();
        if (v.includes("alta")) { data.cell.styles.fillColor = [253, 234, 234]; data.cell.styles.textColor = [197, 48, 48]; }
        else if (v.includes("méd") || v.includes("med")) { data.cell.styles.fillColor = [232, 240, 254]; data.cell.styles.textColor = [37, 99, 235]; }
        else { data.cell.styles.fillColor = [240, 242, 245]; data.cell.styles.textColor = GRAPHITE; }
        data.cell.styles.fontStyle = "bold";
      }
    },
  });
  // @ts-expect-error lastAutoTable é adicionado pelo plugin
  ctx.y = (ctx.doc.lastAutoTable?.finalY ?? ctx.y) + 6;
}

// Assinaturas em 3 colunas: Executora / Contratante / Responsável Técnico
function signatures3(ctx: Ctx, executora: string, executoraSub: string, contratante: string, contratanteSub: string, respTecnico: string) {
  numberedSection(ctx, "Assinaturas");
  ensureSpace(ctx, 30);
  const { doc } = ctx;
  const gap = 8;
  const colW = (PW - 2 * M - 2 * gap) / 3;
  const draw = (x: number, title: string, sub: string) => {
    doc.setDrawColor(150);
    doc.line(x, ctx.y + 12, x + colW, ctx.y + 12);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...rgb(GRAPHITE));
    doc.text(doc.splitTextToSize(title, colW), x + colW / 2, ctx.y + 17, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...rgb(MUTED));
    doc.text(doc.splitTextToSize(sub, colW), x + colW / 2, ctx.y + 21, { align: "center" });
  };
  draw(M, executora, executoraSub);
  draw(M + colW + gap, contratante, contratanteSub);
  draw(M + 2 * (colW + gap), respTecnico, "Data: ____/____/______");
  ctx.y += 28;
}

function hexToRgb(hex: string): [number, number, number] {
  const m = hex.replace("#", "");
  return [parseInt(m.slice(0, 2), 16), parseInt(m.slice(2, 4), 16), parseInt(m.slice(4, 6), 16)];
}

function signatures(ctx: Ctx, report: DailyReport) {
  sectionTitle(ctx, "Assinaturas");
  ensureSpace(ctx, 30);
  const { doc } = ctx;
  const colW = (PW - 2 * M - 10) / 2;
  const drawSig = (x: number, label: string, name?: string) => {
    doc.setDrawColor(180);
    doc.line(x, ctx.y + 14, x + colW, ctx.y + 14);
    doc.setFontSize(9);
    doc.setTextColor(...rgb(GRAPHITE));
    doc.text(name || "_______________________", x, ctx.y + 19);
    doc.setTextColor(...rgb(MUTED));
    doc.setFontSize(8);
    doc.text(label, x, ctx.y + 23);
  };
  const sup = report.signatures.find((s) => s.role === "supervisor");
  const cli = report.signatures.find((s) => s.role === "cliente");
  drawSig(M, "Supervisor / Responsável", sup?.name || report.supervisor);
  drawSig(M + colW + 10, "Cliente / Contratante", cli?.name);
  ctx.y += 28;
}

// ===== RDO diário =====
// Converte uma URL remota (Storage) em data URL base64. O jsPDF só consegue
// embutir base64 — se receber uma URL http, a imagem não entra no PDF.
async function urlToDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string | null>((resolve) => {
      const fr = new FileReader();
      fr.onloadend = () => resolve(typeof fr.result === "string" ? fr.result : null);
      fr.onerror = () => resolve(null);
      fr.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// Prepara a mídia do RDO para o PDF: baixa as fotos que estão como URL remota
// (Supabase Storage) e as transforma em base64. CHAME antes de gerar o PDF.
export async function embedReportImages<T extends { media: DailyReport["media"] }>(report: T): Promise<T> {
  const media = await Promise.all((report.media || []).map(async (m) => {
    if (m.kind === "photo" && m.dataUrl && /^https?:/i.test(m.dataUrl)) {
      const data = await urlToDataUrl(m.dataUrl);
      return data ? { ...m, dataUrl: data } : m;
    }
    return m;
  }));
  return { ...report, media };
}

// `visibility` indefinido = PDF interno completo. Quando informado (versão do
// contratante), as seções sensíveis são omitidas conforme a política da empresa.
export function generateRdoPdf(report: DailyReport, project: Project, company: Company, visibility?: ClientVisibility): jsPDF {
  const v = visibility;
  const ctx = newDoc(company);
  const { doc } = ctx;

  ctx.footerLabel = `Relatório Diário de Obra Nº ${pad(report.number)} — ${project.name.split("—")[0].trim()}`;

  // Cabeçalho — faixa laranja (modelo original / capa do RDO)
  const bannerH = 40;
  doc.setFillColor(...rgb(BRAND));
  doc.rect(0, 0, PW, bannerH, "F");

  // Caixa de logo branca com as iniciais da empresa em laranja
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(M, 11, 18, 18, 3, 3, "F");
  doc.setTextColor(...rgb(BRAND));
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text(
    company.logoText || company.name.slice(0, 3).toUpperCase(),
    M + 9, 21.5, { align: "center" },
  );

  // Título e empresa (branco)
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.text("Relatório Diário de Obra", M + 24, 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.text(`${company.name}${company.city ? `  •  ${company.city}` : ""}`, M + 24, 25.5);

  // Número do RDO e data (branco, à direita)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);
  doc.text(`RDO Nº ${pad(report.number)}`, PW - M, 18, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.text(formatDateBR(report.date), PW - M, 25.5, { align: "right" });

  // Nome da obra (subtítulo, abaixo da faixa)
  ctx.y = bannerH + 9;
  doc.setTextColor(...rgb(NAVY));
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12.5);
  const projName = doc.splitTextToSize(project.name, PW - 2 * M);
  doc.text(projName, M, ctx.y);
  ctx.y += projName.length * 5.5 + 4;

  // Bloco de identificação
  kvBlock(ctx, [
    ["Contratante:", project.client],
    ["Local:", project.address || "—"],
    ["Data:", `${formatDateBR(report.date)}`],
    ["Horário de trabalho:", `${report.arrival || "—"} às ${report.departure || "—"}`],
    ["Responsável pela equipe:", report.supervisor || report.responsible],
    ["Clima / condição:", `${report.weather || "—"}`],
  ]);

  numberedSection(ctx, "Resumo executivo");
  paragraph(ctx, report.executiveSummary || "Sem resumo registrado.");

  if ((!v || v.equipe) && report.team.some((t) => t.present)) {
    numberedSection(ctx, "Equipe / efetivo");
    bullets(ctx, report.team.filter((t) => t.present).map((t) => `${t.name}${t.role ? ` — ${t.role}` : ""}`));
  }

  numberedSection(ctx, "Atividades executadas no dia");
  bullets(ctx, report.activities.map((a) => a.description + (a.status !== "concluida" ? ` (${statusLabel(a.status)})` : "")));

  if (report.materials.length || report.equipment.length) {
    numberedSection(ctx, "Materiais e equipamentos");
    table(ctx, ["Tipo", "Item", "Qtd"], [
      ...report.materials.map((m) => ["Material", m.name, m.quantity || "—"] as string[]),
      ...report.equipment.map((e) => ["Equipamento", e.name, e.quantity || "—"] as string[]),
    ]);
  }

  // Ocorrências/impedimentos (flag "ocorrencias") + observações internas (flag "pendencias").
  const occItems = [
    ...((!v || v.ocorrencias) ? [...report.occurrences, ...report.impediments] : []),
    ...((!v || v.pendencias) && report.notes ? [report.notes] : []),
  ];
  if (!v || occItems.length) {
    numberedSection(ctx, "Ocorrências e observações técnicas");
    bullets(ctx, occItems);
  }

  // Solicitações e providências (estruturado, com prioridade)
  const provs = report.providencias && report.providencias.length
    ? report.providencias.map((p) => ({ description: p.description, responsible: p.responsible, priority: p.priority }))
    : report.clientRequests.map((c) => ({ description: c, responsible: "—", priority: "Média" }));
  if (provs.length) {
    numberedSection(ctx, "Solicitações e providências");
    providenciasTable(ctx, provs);
  }

  if ((!v || v.gastos) && report.expenses.length) {
    numberedSection(ctx, "Gastos");
    table(ctx, ["Categoria", "Descrição", "Valor", "Responsável"],
      report.expenses.map((e) => [e.category, e.description, formatBRL(e.amount), e.responsible]));
  }

  // Próximo dia (sempre compartilhável) tem prioridade; senão pendências (flag "pendencias").
  if (report.nextDayPlan.length) {
    numberedSection(ctx, "Programação para o próximo dia");
    bullets(ctx, report.nextDayPlan);
  } else if (!v || v.pendencias) {
    numberedSection(ctx, "Pendências e próximos passos");
    bullets(ctx, [...report.pending]);
  }

  numberedSection(ctx, "Registro fotográfico");
  photoGrid(ctx, report.media);

  const videos = report.media.filter((m) => m.kind === "video");
  if (videos.length) {
    numberedSection(ctx, "Vídeos");
    bullets(ctx, videos.map((v) => `${v.caption} (vídeo — disponível no app / link compartilhável)`));
  }

  const fieldResp = report.signatures.find((s) => s.role === "supervisor")?.name || report.supervisor;
  signatures3(
    ctx,
    `Executora — ${company.name}`, `Responsável de campo: ${fieldResp}`,
    `Contratante — ${project.client}`, "Representante / Fiscalização",
    "Responsável Técnico",
  );
  footer(ctx);
  return doc;
}

function pad(n: number): string {
  return String(n).padStart(3, "0");
}

// ===== Relatório final consolidado =====
export function generateFinalPdf(
  project: Project, company: Company, ai: AiFinalResult, reports: DailyReport[],
  options: { includeExpenses: boolean; includeVideos: boolean; includeInternalOccurrences: boolean; onlySelectedPhotos: boolean },
): jsPDF {
  const ctx = newDoc(company);
  const { doc } = ctx;

  // Capa
  doc.setFillColor(...rgb(GRAPHITE));
  doc.rect(0, 0, PW, PH, "F");
  logoBox(ctx, M, 30, 24);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(30);
  doc.text("Relatório Final", M, 90);
  doc.text("da Obra", M, 104);
  doc.setFillColor(...rgb(BRAND));
  doc.rect(M, 112, 50, 2, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  const pn = doc.splitTextToSize(project.name, PW - 2 * M);
  doc.text(pn, M, 130);
  doc.setFontSize(11);
  doc.setTextColor(200, 200, 200);
  doc.text(`Cliente: ${project.client}`, M, 130 + pn.length * 7 + 6);
  doc.text(`Período: ${ai.periodo_execucao}`, M, 130 + pn.length * 7 + 13);
  doc.text(`Responsável técnico: ${project.technicalLead || "—"}`, M, 130 + pn.length * 7 + 20);
  doc.text(`${company.name}`, M, PH - 30);
  doc.setFontSize(9);
  doc.text(`Emitido em ${formatDateBR(new Date().toISOString())} • ObraReport IA`, M, PH - 22);

  addPage(ctx);

  // Sumário
  sectionTitle(ctx, "Sumário");
  bullets(ctx, [
    "Resumo executivo da obra", "Dados gerais e período", "Equipe envolvida",
    "Linha do tempo por dia", "Serviços executados", "Materiais e equipamentos",
    options.includeExpenses ? "Gastos por categoria" : "", "Ocorrências e soluções",
    "Pendências (resolvidas e em aberto)", "Galeria de fotos", "Conclusão técnica e termo de entrega",
  ].filter(Boolean));

  sectionTitle(ctx, "Resumo executivo da obra");
  paragraph(ctx, ai.resumo_geral_da_obra);

  sectionTitle(ctx, "Dados gerais da obra");
  table(ctx, ["Campo", "Informação"], [
    ["Obra", project.name], ["Cliente", project.client], ["Endereço", project.address || "—"],
    ["Responsável técnico", project.technicalLead || "—"], ["Supervisor", project.supervisor || "—"],
    ["Período de execução", ai.periodo_execucao], ["Total de RDOs", String(reports.length)],
    ["Status", project.status],
  ]);

  sectionTitle(ctx, "Linha do tempo da obra");
  table(ctx, ["Data", "Resumo do dia"], ai.linha_do_tempo.map((t) => [formatDateBR(t.date), t.resumo]));

  sectionTitle(ctx, "Principais serviços executados");
  bullets(ctx, ai.principais_servicos);

  sectionTitle(ctx, "Materiais e equipamentos relevantes");
  table(ctx, ["Materiais", "Equipamentos"],
    zip(ai.materiais_relevantes, ai.equipamentos_relevantes));

  if (options.includeExpenses) {
    sectionTitle(ctx, "Gastos por categoria");
    const total = ai.gastos_resumidos.reduce((a, g) => a + g.total, 0);
    table(ctx, ["Categoria", "Total"],
      [...ai.gastos_resumidos.map((g) => [g.category, formatBRL(g.total)]), ["TOTAL", formatBRL(total)]]);
  }

  if (options.includeInternalOccurrences) {
    sectionTitle(ctx, "Ocorrências e soluções");
    bullets(ctx, ai.ocorrencias_relevantes);
  }

  sectionTitle(ctx, "Pendências resolvidas");
  bullets(ctx, ai.pendencias_resolvidas, "Nenhuma pendência resolvida registrada.");
  sectionTitle(ctx, "Pendências em aberto");
  bullets(ctx, ai.pendencias_abertas, "Nenhuma pendência em aberto. Obra apta à entrega.");

  // Galeria de fotos consolidada
  sectionTitle(ctx, "Galeria de fotos da obra");
  const allMedia = reports.flatMap((r) => r.media)
    .filter((m) => m.kind === "photo" && (!options.onlySelectedPhotos || m.includeInPdf));
  photoGrid(ctx, allMedia as DailyReport["media"]);

  if (options.includeVideos) {
    const videos = reports.flatMap((r) => r.media).filter((m) => m.kind === "video");
    if (videos.length) {
      sectionTitle(ctx, "Vídeos da obra");
      bullets(ctx, videos.map((v) => `${v.caption} — disponível via link compartilhável`));
    }
  }

  sectionTitle(ctx, "Conclusão técnica");
  paragraph(ctx, ai.conclusao_tecnica);
  sectionTitle(ctx, "Recomendações");
  bullets(ctx, ai.recomendacoes);

  sectionTitle(ctx, "Termo de entrega");
  paragraph(ctx,
    "Declaramos que os serviços descritos neste relatório foram executados e registrados nos respectivos diários de obra. As partes confirmam ciência sobre os serviços, ocorrências, fotos e pendências aqui consolidados.",
    { color: MUTED });

  const fakeReport = { ...reports[0], signatures: [], supervisor: project.supervisor } as DailyReport;
  signatures(ctx, fakeReport);
  footer(ctx);
  return doc;
}

function zip(a: string[], b: string[]): string[][] {
  const n = Math.max(a.length, b.length);
  const out: string[][] = [];
  for (let i = 0; i < n; i++) out.push([a[i] || "—", b[i] || "—"]);
  return out;
}

function statusLabel(s: string): string {
  return s === "concluida" ? "Concluída" : s === "parcial" ? "Parcial" : "Não executada";
}
