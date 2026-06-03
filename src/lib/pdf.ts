import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { AiFinalResult, Company, DailyReport, Project } from "@/lib/types";
import { formatBRL, formatDateBR } from "@/lib/utils";

const BRAND: [number, number, number] = [244, 114, 11];
const GRAPHITE: [number, number, number] = [43, 49, 59];
const MUTED: [number, number, number] = [120, 128, 138];

interface Ctx {
  doc: jsPDF;
  company: Company;
  y: number;
  page: number;
}

const M = 15; // margem
const PW = 210;
const PH = 297;

function newDoc(company: Company): Ctx {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  return { doc, company, y: M, page: 1 };
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
  doc.text(
    `${ctx.company.name}  •  Gerado por ObraReport IA  •  ${formatDateBR(new Date().toISOString())}`,
    M, PH - 10,
  );
  doc.text(`Página ${ctx.page}`, PW - M, PH - 10, { align: "right" });
  doc.setDrawColor(230);
  doc.line(M, PH - 14, PW - M, PH - 14);
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
  let col = 0;
  for (const p of photos) {
    ensureSpace(ctx, h + 8);
    const x = M + col * (w + gap);
    try {
      if (p.dataUrl) {
        ctx.doc.addImage(p.dataUrl, "JPEG", x, ctx.y, w, h, undefined, "FAST");
      } else {
        const c = hexToRgb(p.color || "#cccccc");
        ctx.doc.setFillColor(c[0], c[1], c[2]);
        ctx.doc.roundedRect(x, ctx.y, w, h, 2, 2, "F");
        ctx.doc.setTextColor(255, 255, 255);
        ctx.doc.setFontSize(8);
        ctx.doc.text(p.phase.toUpperCase(), x + 3, ctx.y + 6);
      }
    } catch { /* ignora imagem inválida */ }
    ctx.doc.setTextColor(...rgb(MUTED));
    ctx.doc.setFontSize(8);
    const cap = ctx.doc.splitTextToSize(`[${p.phase}] ${p.caption}`, w);
    ctx.doc.text(cap[0] || "", x, ctx.y + h + 4);
    col += 1;
    if (col >= cols) { col = 0; ctx.y += h + 9; }
  }
  if (col !== 0) ctx.y += h + 9;
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
export function generateRdoPdf(report: DailyReport, project: Project, company: Company): jsPDF {
  const ctx = newDoc(company);
  const { doc } = ctx;

  // Capa
  doc.setFillColor(...rgb(BRAND));
  doc.rect(0, 0, PW, 55, "F");
  logoBox(ctx, M, 14, 20);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Relatório Diário de Obra", M + 26, 24);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(company.name, M + 26, 32);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(`RDO #${report.number}`, PW - M, 24, { align: "right" });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(formatDateBR(report.date), PW - M, 32, { align: "right" });

  ctx.y = 64;
  doc.setTextColor(...rgb(GRAPHITE));
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  const projName = doc.splitTextToSize(project.name, PW - 2 * M);
  doc.text(projName, M, ctx.y);
  ctx.y += projName.length * 6 + 2;

  // Tabela de cabeçalho
  table(ctx, ["Campo", "Informação"], [
    ["Cliente", project.client],
    ["Endereço", project.address || "—"],
    ["Responsável", report.responsible],
    ["Supervisor", report.supervisor],
    ["Horário", `${report.arrival || "—"} às ${report.departure || "—"}`],
    ["Clima", report.weather || "—"],
    ["Condição do local", report.siteCondition || "—"],
    ["Status do RDO", report.status],
  ]);

  sectionTitle(ctx, "Resumo executivo");
  paragraph(ctx, report.executiveSummary || "Sem resumo registrado.");

  sectionTitle(ctx, "Equipe");
  table(ctx, ["Nome", "Função", "Presença"],
    report.team.map((t) => [t.name, t.role || "—", t.present ? "Presente" : "Ausente"]));

  sectionTitle(ctx, "Atividades executadas");
  table(ctx, ["Atividade", "Status", "Obs."],
    report.activities.map((a) => [a.description, statusLabel(a.status), a.note || "—"]));

  if (report.materials.length || report.equipment.length) {
    sectionTitle(ctx, "Materiais e equipamentos");
    table(ctx, ["Tipo", "Item", "Qtd"], [
      ...report.materials.map((m) => ["Material", m.name, m.quantity || "—"] as string[]),
      ...report.equipment.map((e) => ["Equipamento", e.name, e.quantity || "—"] as string[]),
    ]);
  }

  sectionTitle(ctx, "Ocorrências e impedimentos");
  bullets(ctx, [...report.occurrences, ...report.impediments]);

  if (report.clientRequests.length) {
    sectionTitle(ctx, "Solicitações do cliente");
    bullets(ctx, report.clientRequests);
  }

  if (report.expenses.length) {
    sectionTitle(ctx, "Gastos");
    table(ctx, ["Categoria", "Descrição", "Valor", "Responsável"],
      report.expenses.map((e) => [e.category, e.description, formatBRL(e.amount), e.responsible]));
  }

  sectionTitle(ctx, "Fotos");
  photoGrid(ctx, report.media);

  const videos = report.media.filter((m) => m.kind === "video");
  if (videos.length) {
    sectionTitle(ctx, "Vídeos");
    bullets(ctx, videos.map((v) => `${v.caption} (vídeo — disponível no app/link compartilhável)`));
  }

  sectionTitle(ctx, "Pendências e próximos passos");
  bullets(ctx, [...report.pending, ...report.nextDayPlan]);

  if (report.notes) {
    sectionTitle(ctx, "Observações gerais");
    paragraph(ctx, report.notes);
  }

  signatures(ctx, report);
  footer(ctx);
  return doc;
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
