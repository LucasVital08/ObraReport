// Gera os PDFs de documentação e pitch do ObraReport IA usando o mesmo
// motor (jsPDF) já utilizado no app, garantindo identidade visual da marca.
// Uso: npm run docs  ->  cria os arquivos em docs/.

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "docs");

// ---- Paleta (igual src/lib/pdf.ts) ----
const BRAND = [244, 114, 11];
const GRAPHITE = [43, 49, 59];
const MUTED = [120, 128, 138];
const NAVY = [31, 61, 99];
const LIGHT = [238, 241, 245];

const PW = 210, PH = 297, M = 18;
const HOJE = new Date().toLocaleDateString("pt-BR");

function newCtx(footerLabel) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  return { doc, y: M, page: 1, footerLabel };
}

function footer(ctx) {
  const { doc } = ctx;
  doc.setDrawColor(225);
  doc.line(M, PH - 14, PW - M, PH - 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(ctx.footerLabel, M, PH - 9);
  const pageNum = doc.internal.getCurrentPageInfo?.().pageNumber ?? ctx.page;
  doc.text(`página ${pageNum}`, PW - M, PH - 9, { align: "right" });
}

function addPage(ctx) {
  footer(ctx);
  ctx.doc.addPage();
  ctx.page += 1;
  ctx.y = M;
}

function ensure(ctx, needed) {
  if (ctx.y + needed > PH - 20) addPage(ctx);
}

// Título de seção numerado: badge navy + texto
function section(ctx, n, title) {
  ensure(ctx, 18);
  const { doc } = ctx;
  ctx.y += 2;
  const badge = 7;
  doc.setFillColor(...NAVY);
  doc.roundedRect(M, ctx.y, badge, badge, 1.3, 1.3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.text(String(n), M + badge / 2, ctx.y + badge / 2 + 1.7, { align: "center" });
  doc.setTextColor(...NAVY);
  doc.setFontSize(13);
  doc.text(title.toUpperCase(), M + badge + 4, ctx.y + badge / 2 + 1.8);
  ctx.y += badge + 5;
}

function subheading(ctx, text) {
  ensure(ctx, 10);
  const { doc } = ctx;
  doc.setFillColor(...BRAND);
  doc.rect(M, ctx.y - 0.5, 2.5, 5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...GRAPHITE);
  doc.text(text, M + 5, ctx.y + 3.5);
  ctx.y += 9;
}

function paragraph(ctx, text, opts = {}) {
  const { doc } = ctx;
  doc.setFont("helvetica", opts.bold ? "bold" : "normal");
  doc.setFontSize(opts.size ?? 10);
  doc.setTextColor(...(opts.color ?? GRAPHITE));
  const lines = doc.splitTextToSize(text, PW - 2 * M);
  for (const line of lines) {
    ensure(ctx, 5.6);
    doc.text(line, M, ctx.y);
    ctx.y += 5.2;
  }
  ctx.y += 2.5;
}

function bullets(ctx, items, opts = {}) {
  const { doc } = ctx;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(opts.size ?? 10);
  doc.setTextColor(...GRAPHITE);
  for (const item of items) {
    const lines = doc.splitTextToSize(item, PW - 2 * M - 6);
    ensure(ctx, lines.length * 5.1 + 1.5);
    doc.setFillColor(...BRAND);
    doc.circle(M + 1.4, ctx.y - 1.3, 0.85, "F");
    doc.setTextColor(...GRAPHITE);
    doc.text(lines, M + 5.5, ctx.y);
    ctx.y += lines.length * 5.1 + 1.5;
  }
  ctx.y += 2;
}

// Caixa de destaque
function callout(ctx, title, text) {
  const { doc } = ctx;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  const bodyLines = doc.splitTextToSize(text, PW - 2 * M - 10);
  const h = 10 + bodyLines.length * 4.8 + 4;
  ensure(ctx, h + 3);
  doc.setFillColor(...LIGHT);
  doc.roundedRect(M, ctx.y, PW - 2 * M, h, 2.5, 2.5, "F");
  doc.setFillColor(...BRAND);
  doc.roundedRect(M, ctx.y, 2.5, h, 1, 1, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...NAVY);
  doc.text(title, M + 7, ctx.y + 7);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...GRAPHITE);
  doc.text(bodyLines, M + 7, ctx.y + 13);
  ctx.y += h + 5;
}

function simpleTable(ctx, head, body, opts = {}) {
  autoTable(ctx.doc, {
    startY: ctx.y,
    margin: { left: M, right: M },
    head: [head],
    body,
    theme: "grid",
    headStyles: { fillColor: NAVY, fontSize: 9, halign: "left", textColor: [255, 255, 255] },
    bodyStyles: { fontSize: 9, textColor: GRAPHITE },
    alternateRowStyles: { fillColor: [248, 249, 251] },
    styles: { cellPadding: 2.2, lineColor: [225, 228, 232] },
    columnStyles: opts.columnStyles || {},
  });
  ctx.y = (ctx.doc.lastAutoTable?.finalY ?? ctx.y) + 6;
}

function logoBox(doc, x, y, size, fill = BRAND, txtColor = [255, 255, 255]) {
  doc.setFillColor(...fill);
  doc.roundedRect(x, y, size, size, size * 0.18, size * 0.18, "F");
  doc.setTextColor(...txtColor);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(size * 0.42);
  doc.text("OR", x + size / 2, y + size / 2 + size * 0.15, { align: "center" });
}

function cover(ctx, kicker, title1, title2, subtitle) {
  const { doc } = ctx;
  // Fundo grafite
  doc.setFillColor(...GRAPHITE);
  doc.rect(0, 0, PW, PH, "F");
  // Faixa laranja superior
  doc.setFillColor(...BRAND);
  doc.rect(0, 0, PW, 6, "F");
  logoBox(doc, M, 32, 22);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text("ObraReport IA", M + 28, 42);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(200, 205, 210);
  doc.text("RDO inteligente feito para o Brasil", M + 28, 48);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...BRAND);
  doc.text(kicker.toUpperCase(), M, 108);
  doc.setFontSize(34);
  doc.setTextColor(255, 255, 255);
  doc.text(title1, M, 124);
  if (title2) doc.text(title2, M, 138);
  doc.setFillColor(...BRAND);
  doc.rect(M, title2 ? 146 : 132, 54, 2.4, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(210, 214, 219);
  const sub = doc.splitTextToSize(subtitle, PW - 2 * M - 30);
  doc.text(sub, M, (title2 ? 160 : 146));

  doc.setFontSize(9.5);
  doc.setTextColor(180, 186, 192);
  doc.text("obra-report.vercel.app", M, PH - 34);
  doc.text(`Documento gerado em ${HOJE}`, M, PH - 27);
  doc.text("Confidencial — uso interno e comercial", M, PH - 20);
  addPage(ctx);
}

// =====================================================================
//  DADOS DE PRODUTO (espelham o código real do app)
// =====================================================================
const PLANS = [
  ["Free", "Grátis", "—", "1 obra, 2 RDOs/mês, PDF básico, sem IA, 1 usuário"],
  ["Básico", "R$ 79", "R$ 699", "1 obra, 30 RDOs/mês, IA incluída, PDF profissional, assinatura digital"],
  ["Profissional", "R$ 199", "R$ 1.799", "5 obras, RDOs ilimitados, IA completa, relatório final, acesso do contratante, até 10 usuários"],
  ["Empresa", "R$ 399", "R$ 3.599", "Obras e usuários ilimitados, contratantes ilimitados, marca própria, suporte prioritário"],
];

const MODULOS = [
  ["Obras", "Hub da obra com 12 abas: visão geral, RDOs, linha do tempo, equipe, fotos, materiais, gastos, checklists, ocorrências, documentos e relatório final."],
  ["RDO (Diário)", "Criação por voz, texto, perguntas guiadas ou manual; revisão, assinatura e exportação em PDF."],
  ["Tarefas", "Quadro kanban com 5 estágios e prioridades."],
  ["Equipe & Ponto", "Cadastro de colaboradores e registro de horas (entrada/saída/intervalo)."],
  ["Materiais & Equipamentos", "Controle de status, fornecedor, quantidades e ciclo de vida dos equipamentos."],
  ["Gastos", "Lançamentos por categoria, com gráficos por categoria e por responsável e exportação CSV."],
  ["Ocorrências", "Registro de problemas/riscos com gravidade, categoria e solução proposta."],
  ["Checklists", "13 modelos (segurança, drywall, elétrica, energia solar, entrega...) com progresso."],
  ["Fotos & Vídeos", "Galeria por data e fase (antes/durante/depois) ligada aos RDOs."],
  ["Contatos & Insights", "Diretório de contatos e painel de indicadores com gráficos."],
];

// =====================================================================
//  DOCUMENTO 1 — DOCUMENTAÇÃO COMPLETA
// =====================================================================
function buildDocumentacao() {
  const ctx = newCtx("ObraReport IA — Documentação do produto");
  cover(ctx, "Documentação completa", "Documentação", "do Produto", "Visão de produto, funcionalidades, planos e diferenciais do ObraReport IA — a plataforma de RDO inteligente para a construção brasileira.");

  let n = 0;

  // Sumário
  section(ctx, ++n, "Sumário");
  bullets(ctx, [
    "O que é o ObraReport IA",
    "O problema que resolvemos",
    "A solução e a proposta de valor",
    "RDO inteligente — os 4 modos de criação",
    "Inteligência artificial sem alucinação",
    "Camadas: o contratante acompanha, comenta e aprova",
    "Funcionalidades por módulo",
    "Relatórios e PDF profissional",
    "Assinaturas e compartilhamento",
    "Planos e preços",
    "Segurança, privacidade e LGPD",
    "Arquitetura, tecnologia e roadmap",
    "Mercado e público-alvo",
  ]);

  section(ctx, ++n, "O que é o ObraReport IA");
  paragraph(ctx, "O ObraReport IA é um SaaS que transforma o relato do dia a dia da obra em um Relatório Diário de Obra (RDO) profissional. O profissional fala ou escreve o que aconteceu e a inteligência artificial organiza tudo — equipe, horários, atividades, materiais, ocorrências, gastos e pendências — em um documento padronizado, com fotos, assinaturas e exportação em PDF. Ao final, consolida todos os RDOs em um relatório final completo da obra.");
  callout(ctx, "Em uma frase", "Fale o que aconteceu na obra. A IA monta o RDO profissional, organiza fotos e, no fim, gera o relatório completo da obra.");

  section(ctx, ++n, "O problema que resolvemos");
  paragraph(ctx, "No canteiro, o registro diário costuma ser informal e se perde: anotações em papel, fotos espalhadas no celular, áudios no WhatsApp e relatórios feitos só no fim do mês. Isso gera retrabalho, falta de comprovação e conflitos com o contratante.");
  bullets(ctx, [
    "Fotos e informações dispersas, sem rastreabilidade.",
    "RDOs feitos tarde, de memória, com lacunas.",
    "Dificuldade de comprovar serviços, ocorrências e pedidos.",
    "Contratante sem visibilidade do andamento da obra.",
    "Tempo do engenheiro/encarregado gasto formatando documento em vez de executar.",
  ]);

  section(ctx, ++n, "A solução e a proposta de valor");
  bullets(ctx, [
    "Registro em segundos: por voz, texto, perguntas guiadas ou manual.",
    "Padronização automática: a IA estrutura o relato em um RDO completo.",
    "Comprovação visual: fotos e vídeos por fase (antes/durante/depois).",
    "Transparência com o contratante: acompanhamento, comentários e aprovação.",
    "Documento pronto: PDF profissional do RDO e relatório final consolidado.",
    "Feito para o Brasil: linguagem, termos e fluxo do RDO nacionais.",
  ]);

  section(ctx, ++n, "RDO inteligente — os 4 modos de criação");
  subheading(ctx, "1. Por voz");
  paragraph(ctx, "O usuário toca no microfone e fala naturalmente. A transcrição em português (pt-BR) aparece em tempo real e a IA organiza o conteúdo no RDO.");
  subheading(ctx, "2. Por texto");
  paragraph(ctx, "Cola ou digita um relato livre (ex.: a mensagem que mandaria no WhatsApp). A IA interpreta e estrutura os campos.");
  subheading(ctx, "3. Por perguntas guiadas");
  paragraph(ctx, "Um fluxo de perguntas objetivas (o que foi executado, quem esteve presente, horários, problemas, solicitações, gastos, pendências...) com entrada por voz ou texto em cada etapa.");
  subheading(ctx, "4. Manual");
  paragraph(ctx, "Edição direta no formulário completo, para quem prefere preencher campo a campo.");

  section(ctx, ++n, "Inteligência artificial sem alucinação");
  paragraph(ctx, "O motor de IA foi desenhado para extrair, não inventar. Quando uma informação não está clara no relato, o campo fica vazio e a plataforma gera perguntas complementares, em vez de preencher com dados fictícios. O parser em português reconhece horários, nomes e funções da equipe, atividades, materiais, equipamentos, gastos por categoria, ocorrências, riscos, solicitações e pendências.");
  bullets(ctx, [
    "Extração determinística (mesmo relato gera o mesmo resultado).",
    "Detecção de campos faltantes + perguntas de complemento.",
    "Pontuação de qualidade/completude de cada RDO.",
    "Pronto para nuvem: rota de IA que usa o motor local por padrão e pode acionar a OpenAI quando configurada, com fallback automático.",
  ]);

  section(ctx, ++n, "Camadas: o contratante acompanha, comenta e aprova");
  paragraph(ctx, "Além da construtora (contratada), que lança os RDOs, o ObraReport IA oferece uma camada para o contratante (cliente). Com login próprio, o contratante acessa apenas as obras vinculadas a ele e acompanha a execução de perto.");
  bullets(ctx, [
    "Visualiza os RDOs lançados pela contratada.",
    "Comenta e registra observações em cada RDO.",
    "Aprova e assina digitalmente o relatório.",
    "Acompanha a linha do tempo da obra gerada por IA.",
  ]);
  callout(ctx, "Como funciona na prática", "A contratada (ex.: equipe de campo) lança o RDO do dia. O contratante recebe, comenta, pede ajustes e aprova — criando um histórico transparente da execução da obra, do início à entrega.");

  section(ctx, ++n, "Funcionalidades por módulo");
  simpleTable(ctx, ["Módulo", "O que faz"], MODULOS, { columnStyles: { 0: { cellWidth: 42, fontStyle: "bold" } } });

  section(ctx, ++n, "Relatórios e PDF profissional");
  subheading(ctx, "RDO diário em PDF");
  paragraph(ctx, "Cada RDO gera um PDF com a identidade da empresa: faixa de cabeçalho, número e data, identificação da obra, resumo executivo, equipe, atividades, materiais/equipamentos, ocorrências, solicitações e providências (com prioridade), gastos, programação do próximo dia, registro fotográfico e bloco de assinaturas (Executora / Contratante / Responsável técnico).");
  subheading(ctx, "Relatório final consolidado");
  paragraph(ctx, "Reúne todos os RDOs da obra em um único documento: resumo geral, dados da obra, linha do tempo dia a dia, principais serviços, materiais e equipamentos, gastos por categoria, ocorrências, pendências resolvidas e em aberto, galeria de fotos, conclusão técnica, recomendações e termo de entrega — com opções para incluir/ocultar gastos, vídeos e ocorrências internas.");

  section(ctx, ++n, "Assinaturas e compartilhamento");
  bullets(ctx, [
    "Assinatura eletrônica com papel (cliente, supervisor, responsável técnico, testemunha), nome, documento e termo de ciência.",
    "Aprovação do contratante muda o status do RDO para “aprovado”.",
    "Compartilhamento por WhatsApp, e-mail, link e download em PDF.",
  ]);

  section(ctx, ++n, "Planos e preços");
  paragraph(ctx, "Quatro níveis, do gratuito ao corporativo. A inteligência artificial já está incluída a partir do plano Básico. Valores mensais (com opção anual com desconto):");
  simpleTable(ctx, ["Plano", "Mensal", "Anual", "Principais benefícios"],
    PLANS, { columnStyles: { 0: { cellWidth: 26, fontStyle: "bold" }, 1: { cellWidth: 20 }, 2: { cellWidth: 22 } } });

  section(ctx, ++n, "Segurança, privacidade e LGPD");
  paragraph(ctx, "A versão atual é local-first: os dados ficam no dispositivo do usuário (armazenamento do navegador), o que dá controle e privacidade. O usuário pode recarregar os dados de demonstração ou excluir todos os dados a qualquer momento. A modelagem já reflete as tabelas previstas para um banco em nuvem (Supabase/PostgreSQL), preparando a evolução para sincronização multiusuário.");

  section(ctx, ++n, "Arquitetura, tecnologia e roadmap");
  bullets(ctx, [
    "Front-end: Next.js 16 (App Router), React 19, TypeScript e TailwindCSS.",
    "Estado e persistência local: Zustand com middleware de persistência.",
    "PDF: jsPDF + jspdf-autotable (geração no próprio cliente).",
    "Voz: Web Speech API em português (pt-BR).",
    "IA: motor heurístico local em português, com rota pronta para a OpenAI.",
  ]);
  subheading(ctx, "Próximos passos");
  bullets(ctx, [
    "Sincronização em nuvem e multiusuário real (Supabase/Auth).",
    "Pagamentos integrados (Mercado Pago, Stripe, Asaas).",
    "IA ampliada para sugestões e análise de risco.",
  ]);

  section(ctx, ++n, "Mercado e público-alvo");
  paragraph(ctx, "Construtoras, empreiteiros, engenheiros e arquitetos, além de equipes de pintura, drywall, elétrica, hidráulica, energia solar, climatização e manutenção predial — qualquer operação que precise comprovar e organizar o dia a dia da obra com agilidade.");

  footer(ctx);
  return ctx.doc;
}

// =====================================================================
//  DOCUMENTO 2 — PITCH EXECUTIVO (3 MIN)
// =====================================================================
function pitchBlock(ctx, time, title, fala, visual) {
  const { doc } = ctx;
  ensure(ctx, 40);
  // tag de tempo
  doc.setFillColor(...NAVY);
  doc.roundedRect(M, ctx.y, 26, 7, 1.5, 1.5, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(time, M + 13, ctx.y + 4.8, { align: "center" });
  doc.setTextColor(...GRAPHITE);
  doc.setFontSize(12);
  doc.text(title, M + 31, ctx.y + 5);
  ctx.y += 11;

  // Fala (destaque)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  const falaLines = doc.splitTextToSize(fala, PW - 2 * M - 9);
  const h = falaLines.length * 5.2 + 6;
  ensure(ctx, h + 2);
  doc.setFillColor(...LIGHT);
  doc.roundedRect(M, ctx.y, PW - 2 * M, h, 2.5, 2.5, "F");
  doc.setFillColor(...BRAND);
  doc.roundedRect(M, ctx.y, 2.5, h, 1, 1, "F");
  doc.setTextColor(...GRAPHITE);
  doc.text(falaLines, M + 7, ctx.y + 6.5);
  ctx.y += h + 3;

  // Nota visual
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8.8);
  doc.setTextColor(...MUTED);
  const vLines = doc.splitTextToSize("Tela / visual: " + visual, PW - 2 * M - 6);
  ensure(ctx, vLines.length * 4.4 + 4);
  doc.text(vLines, M + 6, ctx.y);
  ctx.y += vLines.length * 4.4 + 7;
  doc.setFont("helvetica", "normal");
}

function buildPitch() {
  const ctx = newCtx("ObraReport IA — Pitch executivo (3 min)");
  cover(ctx, "Pitch executivo", "Roteiro de", "Apresentação", "Script cronometrado de 3 minutos para apresentar o ObraReport IA a clientes e investidores, com falas prontas e notas de tela.");

  // Intro
  ctx.doc.setFont("helvetica", "bold");
  ctx.doc.setFontSize(13);
  ctx.doc.setTextColor(...NAVY);
  ctx.doc.text("ROTEIRO — 3 MINUTOS", M, ctx.y + 4);
  ctx.y += 9;
  paragraph(ctx, "Ritmo de fala confortável (~150 palavras/min). Cada bloco traz a fala sugerida e o que mostrar na tela. Os tempos somam 3 minutos.");

  pitchBlock(ctx, "0:00–0:20", "Gancho",
    "Imagine que toda obra pudesse ser registrada só falando. O encarregado abre o app, diz o que aconteceu no dia, e em segundos tem um relatório diário profissional, com fotos e assinatura. É isso que o ObraReport IA faz.",
    "Logo do ObraReport IA + frase “Fale o que aconteceu. A IA faz o resto.”");

  pitchBlock(ctx, "0:20–0:45", "O problema",
    "Hoje o registro da obra se perde: anotação em papel, foto no celular, áudio no WhatsApp. O RDO acaba feito de memória, no fim do mês, com lacunas. Resultado: retrabalho, falta de comprovação e atrito com o contratante.",
    "Imagens de bagunça: papel, fotos soltas, prints de WhatsApp.");

  pitchBlock(ctx, "0:45–1:15", "A solução",
    "O ObraReport IA transforma o relato do dia em um RDO completo. São quatro formas de registrar: por voz, por texto, por perguntas guiadas ou manual. A inteligência artificial organiza equipe, horários, atividades, materiais, gastos, ocorrências e pendências — sem inventar nada: o que não está claro, ela pergunta.",
    "Tela inicial com os modos de criação; destaque no botão de voz.");

  pitchBlock(ctx, "1:15–2:00", "Como funciona (demo)",
    "Veja: eu falo — “Hoje a equipe do Leone lixou a estrutura da usina, faltou tinta e precisamos de uma lavadora de pressão.” Pronto: a IA montou o RDO, separou as atividades, a ocorrência e a solicitação com prioridade, e já gerou o PDF profissional com a marca da empresa. Tudo isso em segundos.",
    "Gravação de voz, depois o RDO preenchido e o download do PDF com cabeçalho laranja.");

  pitchBlock(ctx, "2:00–2:30", "Diferenciais",
    "Três coisas nos tornam únicos: é feito para o Brasil, no formato de RDO que o setor usa; é mobile-first, para usar no canteiro; e tem camadas — o contratante entra com login próprio, acompanha a obra, comenta e aprova cada relatório, com uma linha do tempo gerada por IA.",
    "Split: visão da construtora x visão do contratante (aprovando um RDO).");

  pitchBlock(ctx, "2:30–2:50", "Mercado e modelo",
    "O público é amplo: construtoras, empreiteiros, engenheiros e equipes de drywall, elétrica, solar e manutenção. O modelo é SaaS por assinatura, do plano Free ao Empresa — com IA já incluída a partir de 79 reais por mês.",
    "Tabela de planos: Free, Básico R$79, Profissional R$199, Empresa R$399.");

  pitchBlock(ctx, "2:50–3:00", "Fechamento",
    "ObraReport IA: menos tempo formatando relatório, mais obra comprovada e cliente satisfeito. Vamos começar a sua demonstração agora?",
    "Logo + QR/endereço: obra-report.vercel.app + “Começar grátis”.");

  // Página de apoio
  addPage(ctx);
  ctx.doc.setFont("helvetica", "bold");
  ctx.doc.setFontSize(13);
  ctx.doc.setTextColor(...NAVY);
  ctx.doc.text("RESUMO DOS TEMPOS", M, ctx.y + 4);
  ctx.y += 10;
  simpleTable(ctx, ["Tempo", "Bloco", "Objetivo"], [
    ["0:00–0:20", "Gancho", "Prender a atenção com a promessa central"],
    ["0:20–0:45", "Problema", "Mostrar a dor do registro manual"],
    ["0:45–1:15", "Solução", "Apresentar os 4 modos e a IA"],
    ["1:15–2:00", "Demo", "Provar valor ao vivo (voz vira PDF)"],
    ["2:00–2:30", "Diferenciais", "Brasil, mobile-first e camadas"],
    ["2:30–2:50", "Mercado/modelo", "Público e planos"],
    ["2:50–3:00", "Fechamento", "Chamada para ação"],
  ], { columnStyles: { 0: { cellWidth: 28 }, 1: { cellWidth: 34, fontStyle: "bold" } } });

  subheading(ctx, "Dicas de entrega");
  bullets(ctx, [
    "Faça a demo de voz de verdade — é o momento mais convincente.",
    "Fale devagar nos números (preços e tempo de criação do RDO).",
    "Enfatize “sem alucinação”: a IA pergunta em vez de inventar.",
    "Conecte o diferencial das camadas à confiança do contratante.",
    "Termine sempre com uma pergunta que abra a próxima conversa.",
  ]);

  footer(ctx);
  return ctx.doc;
}

// =====================================================================
//  DOCUMENTO 3 — PITCH EXECUTIVO (2 LAUDAS)
// =====================================================================
function bandHeader(ctx, title) {
  const { doc } = ctx;
  const h = 34;
  doc.setFillColor(...GRAPHITE);
  doc.rect(0, 0, PW, h, "F");
  doc.setFillColor(...BRAND);
  doc.rect(0, 0, PW, 4, "F");
  // logo
  doc.setFillColor(...BRAND);
  doc.roundedRect(M, 9, 16, 16, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text("OR", M + 8, 18.4, { align: "center" });
  // nome + tagline
  doc.setFontSize(14);
  doc.text("ObraReport IA", M + 21, 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(200, 205, 210);
  doc.text("RDO inteligente para a construção brasileira", M + 21, 22);
  // selo do tipo de documento (direita)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...BRAND);
  doc.text(title.toUpperCase(), PW - M, 17, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(200, 205, 210);
  doc.text(`Atualizado em ${HOJE}`, PW - M, 23, { align: "right" });
  ctx.y = h + 8;
}

function buildPitchExecutivo() {
  const ctx = newCtx("ObraReport IA — Pitch Executivo");
  bandHeader(ctx, "Pitch Executivo");

  // Posicionamento (frase de valor)
  ctx.doc.setFont("helvetica", "bold");
  ctx.doc.setFontSize(12);
  ctx.doc.setTextColor(...NAVY);
  const pos = ctx.doc.splitTextToSize(
    "Fale o que aconteceu na obra. A IA transforma em um Relatório Diário de Obra (RDO) profissional — com fotos, assinaturas e relatório final consolidado.",
    PW - 2 * M,
  );
  for (const line of pos) { ctx.doc.text(line, M, ctx.y); ctx.y += 6; }
  ctx.y += 3;

  subheading(ctx, "O problema");
  bullets(ctx, [
    "Registro informal e disperso: anotações em papel, fotos soltas no celular e áudios no WhatsApp.",
    "RDOs feitos de memória, no fim do mês, com lacunas — sem comprovação técnica e jurídica.",
    "Contratante sem visibilidade do andamento, gerando atrito, retrabalho e disputas.",
  ]);

  subheading(ctx, "A solução");
  paragraph(ctx,
    "O ObraReport IA registra o dia da obra em segundos, por voz ou texto, e a inteligência artificial estrutura tudo — equipe, horários, atividades, materiais, ocorrências, gastos e pendências — em um RDO padronizado. A IA não inventa: o que não está claro, ela pergunta.");

  subheading(ctx, "Como funciona, em 3 passos");
  bullets(ctx, [
    "1. Registre por voz, texto, perguntas guiadas ou manual.",
    "2. A IA organiza o conteúdo e gera o RDO com fotos e pontuação de qualidade.",
    "3. Compartilhe (WhatsApp/e-mail/link), colete a assinatura e exporte o PDF profissional.",
  ]);

  callout(ctx, "O grande diferencial",
    "Feito para o Brasil, mobile-first e com camadas: a contratada lança os RDOs e o contratante acessa com login próprio para acompanhar, comentar e aprovar cada relatório — com uma linha do tempo da obra gerada por IA.");

  // ---- Página 2 ----
  addPage(ctx);

  subheading(ctx, "Por que ganhamos (diferenciais)");
  bullets(ctx, [
    "Feito para o Brasil: formato, termos e fluxo do RDO nacional.",
    "IA sem alucinação: extrai, não inventa — e pergunta o que falta.",
    "Camadas/contratante: transparência que reduz atrito e acelera aprovações.",
    "Relatório final consolidado: linha do tempo, fotos, gastos e termo de entrega.",
    "Local-first e LGPD; arquitetura pronta para nuvem (Supabase) e OpenAI.",
  ]);

  subheading(ctx, "Mercado e público-alvo");
  paragraph(ctx,
    "Construtoras, empreiteiros, engenheiros e arquitetos, além de equipes de drywall, elétrica, energia solar, pintura e manutenção predial. Um mercado amplo, capilarizado e ainda pouco digitalizado, com forte dor de comprovação e prestação de contas.");

  subheading(ctx, "Modelo de negócio");
  simpleTable(ctx, ["Plano", "Mensal", "Inclui"], [
    ["Free", "Grátis", "1 obra, 2 RDOs/mês, sem IA"],
    ["Básico", "R$ 79", "1 obra, 30 RDOs/mês, IA incluída, PDF profissional"],
    ["Profissional", "R$ 199", "5 obras, RDOs ilimitados, equipe/gastos, acesso do contratante"],
    ["Empresa", "R$ 399", "Obras e usuários ilimitados, marca própria, suporte prioritário"],
  ], { columnStyles: { 0: { cellWidth: 28, fontStyle: "bold" }, 1: { cellWidth: 22 } } });
  paragraph(ctx, "SaaS por assinatura recorrente (mensal/anual), com IA já incluída a partir do plano Básico. Planos anuais com desconto.", { size: 9, color: MUTED });

  subheading(ctx, "Tração e roadmap");
  bullets(ctx, [
    "Produto funcional ponta a ponta: criação de RDO por voz/texto, fotos, assinatura e PDF.",
    "Próximos passos: nuvem multiusuário (Supabase), pagamentos (Pix/Stripe/Asaas) e IA ampliada (análise de risco).",
    "Por que agora: voz + IA acessíveis tornam o registro instantâneo — o timing de adoção é este.",
  ]);

  callout(ctx, "Próximo passo",
    "Faça uma demonstração de 3 minutos: fale o relato de um dia de obra e veja o RDO profissional pronto na hora. Teste grátis em obra-report.vercel.app.");

  footer(ctx);
  return ctx.doc;
}

// =====================================================================
//  DOCUMENTO 4 — APRESENTAÇÃO COMPLETA (5 PÁGINAS, COM MOCKUPS)
// =====================================================================

// --- primitivos de desenho ---
function rr(doc, x, y, w, h, r, rgb, mode = "F") { doc.setFillColor(...rgb); doc.roundedRect(x, y, w, h, r, r, mode); }
function tx(doc, str, x, y, size, rgb = GRAPHITE, bold = false, align) {
  doc.setFont("helvetica", bold ? "bold" : "normal"); doc.setFontSize(size); doc.setTextColor(...rgb);
  doc.text(str, x, y, align ? { align } : undefined);
}
function strokeRect(doc, x, y, w, h, r, rgb = [232, 234, 237]) {
  doc.setDrawColor(...rgb); doc.setLineWidth(0.25); doc.roundedRect(x, y, w, h, r, r, "S");
}
function micGlyph(doc, cx, cy, sc, rgb) {
  rr(doc, cx - 1 * sc, cy - 2.2 * sc, 2 * sc, 2.8 * sc, 1 * sc, rgb);
  doc.setDrawColor(...rgb); doc.setLineWidth(0.3 * sc);
  doc.line(cx, cy + 0.7 * sc, cx, cy + 1.9 * sc);
  doc.line(cx - 1.3 * sc, cy + 1.9 * sc, cx + 1.3 * sc, cy + 1.9 * sc);
  doc.setLineWidth(0.2);
}

// Embute um screenshot real do app dentro de uma moldura de celular.
// Retorna a altura ocupada (mm). Cai num placeholder se a imagem não existir.
function deviceImage(doc, x, y, w, file) {
  const ratio = 1800 / 804; // proporção do viewport capturado (h/w)
  const h = w * ratio;
  rr(doc, x - 1.8, y - 1.8, w + 3.6, h + 3.6, 4.5, GRAPHITE);
  const path = join(OUT_DIR, "screenshots", file);
  if (existsSync(path)) {
    const b64 = readFileSync(path).toString("base64");
    doc.addImage(`data:image/jpeg;base64,${b64}`, "JPEG", x, y, w, h);
  } else {
    rr(doc, x, y, w, h, 3, [246, 247, 249]);
    tx(doc, "(tela do app)", x + w / 2, y + h / 2, 8, MUTED, false, "center");
  }
  return h;
}

// moldura do celular -> retorna a área útil da tela
function phone(doc, x, y, w, dark = false) {
  const h = w * 2.04;
  doc.setFillColor(...(dark ? [17, 20, 26] : GRAPHITE));
  doc.roundedRect(x, y, w, h, 5, 5, "F");
  const pad = 2.2;
  const s = { sx: x + pad, sy: y + pad, sw: w - 2 * pad, sh: h - 2 * pad };
  rr(doc, s.sx, s.sy, s.sw, s.sh, 3.5, [246, 247, 249]);
  doc.setFillColor(...GRAPHITE);
  doc.roundedRect(x + w / 2 - 6, y + 2.7, 12, 2.1, 1, 1, "F");
  return s;
}
function phoneTop(doc, s) {
  rr(doc, s.sx + 3, s.sy + 3, 5, 5, 2.5, BRAND);
  rr(doc, s.sx + s.sw - 12, s.sy + 3.2, 4.4, 4.4, 2.2, [228, 230, 233]);
  rr(doc, s.sx + s.sw - 6.6, s.sy + 3, 5, 5, 2.5, BRAND);
  doc.setDrawColor(234); doc.setLineWidth(0.25); doc.line(s.sx, s.sy + 9.2, s.sx + s.sw, s.sy + 9.2);
}
function phoneNav(doc, s, activeIdx = 0) {
  const ny = s.sy + s.sh - 9.5;
  doc.setDrawColor(234); doc.setLineWidth(0.25); doc.line(s.sx, ny, s.sx + s.sw, ny);
  const cw = s.sw / 5;
  for (let i = 0; i < 5; i++) {
    if (i === 2) continue;
    const cx = s.sx + cw * i + cw / 2;
    rr(doc, cx - 1.5, ny + 3, 3, 3, 0.7, i === activeIdx ? BRAND : [205, 209, 214]);
  }
  rr(doc, s.sx + s.sw / 2 - 4.6, ny - 2.6, 9.2, 9.2, 4.6, BRAND);
  tx(doc, "+", s.sx + s.sw / 2, ny + 3.4, 10, [255, 255, 255], true, "center");
}

// --- texto em coluna (ao lado do mockup) ---
function ch(ctx, cx, text) {
  const { doc } = ctx; doc.setFillColor(...BRAND); doc.rect(cx, ctx.y - 0.5, 2.4, 4.8, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(11.5); doc.setTextColor(...NAVY);
  doc.text(text, cx + 4.5, ctx.y + 3.4); ctx.y += 8.5;
}
function cp(ctx, cx, cw, text, opts = {}) {
  const { doc } = ctx; doc.setFont("helvetica", opts.bold ? "bold" : "normal");
  doc.setFontSize(opts.size ?? 9.5); doc.setTextColor(...(opts.color ?? GRAPHITE));
  for (const l of doc.splitTextToSize(text, cw)) { doc.text(l, cx, ctx.y); ctx.y += 4.9; }
  ctx.y += 2.4;
}
function cb(ctx, cx, cw, items) {
  const { doc } = ctx; doc.setFont("helvetica", "normal"); doc.setFontSize(9.5);
  for (const it of items) {
    const lines = doc.splitTextToSize(it, cw - 5.5);
    doc.setFillColor(...BRAND); doc.circle(cx + 1.3, ctx.y - 1.2, 0.85, "F");
    doc.setTextColor(...GRAPHITE); doc.text(lines, cx + 5.5, ctx.y);
    ctx.y += lines.length * 4.7 + 1.6;
  }
  ctx.y += 1.5;
}
function colCallout(ctx, cx, cw, title, text) {
  const { doc } = ctx;
  doc.setFont("helvetica", "normal"); doc.setFontSize(9.5);
  const bodyLines = doc.splitTextToSize(text, cw - 10);
  const h = 10 + bodyLines.length * 4.8 + 4;
  doc.setFillColor(...LIGHT); doc.roundedRect(cx, ctx.y, cw, h, 2.5, 2.5, "F");
  doc.setFillColor(...BRAND); doc.roundedRect(cx, ctx.y, 2.5, h, 1, 1, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...NAVY);
  doc.text(title, cx + 7, ctx.y + 7);
  doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor(...GRAPHITE);
  doc.text(bodyLines, cx + 7, ctx.y + 13);
  ctx.y += h + 5;
}
function pageTitle(ctx, num, title) {
  const { doc } = ctx;
  rr(doc, M, ctx.y, 7, 7, 1.4, NAVY);
  tx(doc, String(num), M + 3.5, ctx.y + 4.9, 11, [255, 255, 255], true, "center");
  tx(doc, title, M + 11, ctx.y + 5.4, 15, NAVY, true);
  ctx.y += 9;
  doc.setDrawColor(...BRAND); doc.setLineWidth(0.8); doc.line(M, ctx.y, M + 24, ctx.y);
  doc.setLineWidth(0.2);
  ctx.y += 6;
}

// ---- telas (mockups) ----
function drawDashboard(doc, s) {
  phoneTop(doc, s);
  let y = s.sy + 14;
  tx(doc, "Olá, Lucas", s.sx + 3, y, 7, GRAPHITE, true); y += 3.2;
  tx(doc, "Resumo das obras hoje", s.sx + 3, y, 4.2, MUTED); y += 4.5;
  // ação rápida (voz)
  rr(doc, s.sx + 3, y, s.sw - 6, 9.5, 2, [255, 255, 255]); strokeRect(doc, s.sx + 3, y, s.sw - 6, 9.5, 2);
  rr(doc, s.sx + 5, y + 2.2, 5.2, 5.2, 1.5, [255, 237, 222]); micGlyph(doc, s.sx + 7.6, y + 4.8, 1.0, BRAND);
  tx(doc, "Criar RDO por voz", s.sx + 12.5, y + 3.8, 4.8, GRAPHITE, true);
  tx(doc, "Fale o que aconteceu", s.sx + 12.5, y + 7, 3.9, MUTED); y += 12;
  // grade de stats 2x2
  const gw = (s.sw - 6 - 3) / 2;
  const stats = [["Obras ativas", "6", BRAND], ["RDOs/mês", "9", [37, 99, 235]], ["A assinar", "10", [217, 119, 6]], ["Tarefas", "9", GRAPHITE]];
  for (let i = 0; i < 4; i++) {
    const col = i % 2, row = Math.floor(i / 2);
    const cx = s.sx + 3 + col * (gw + 3), cy = y + row * 12.5;
    rr(doc, cx, cy, gw, 11, 2, [255, 255, 255]); strokeRect(doc, cx, cy, gw, 11, 2);
    tx(doc, stats[i][0], cx + 2.2, cy + 3.3, 3.7, MUTED);
    tx(doc, stats[i][1], cx + 2.2, cy + 8.6, 6.5, stats[i][2], true);
  }
  y += 12.5 * 2 + 1.5;
  // mini gráfico
  rr(doc, s.sx + 3, y, s.sw - 6, 18, 2, [255, 255, 255]); strokeRect(doc, s.sx + 3, y, s.sw - 6, 18, 2);
  tx(doc, "Atividade (14 dias)", s.sx + 5, y + 4, 4, GRAPHITE, true);
  const pts = [0.4, 0.4, 0.45, 0.72, 0.92, 0.92, 0.92, 0.72, 0.42, 0.42, 0.6, 0.6, 0.5, 0.28];
  const cx0 = s.sx + 5, cw = s.sw - 10, ct = y + 7, chh = 8.5;
  doc.setDrawColor(...BRAND); doc.setLineWidth(0.5);
  for (let i = 0; i < pts.length - 1; i++) {
    const x1 = cx0 + cw * (i / (pts.length - 1)), x2 = cx0 + cw * ((i + 1) / (pts.length - 1));
    doc.line(x1, ct + chh * (1 - pts[i]), x2, ct + chh * (1 - pts[i + 1]));
  }
  doc.setLineWidth(0.2);
  phoneNav(doc, s, 0);
}

function drawModes(doc, s) {
  phoneTop(doc, s);
  let y = s.sy + 14;
  tx(doc, "Criar RDO", s.sx + 3, y, 7, GRAPHITE, true); y += 4.5;
  // seletor de obra
  rr(doc, s.sx + 3, y, s.sw - 6, 7, 1.8, [255, 255, 255]); strokeRect(doc, s.sx + 3, y, s.sw - 6, 7, 1.8);
  tx(doc, "Obra / projeto", s.sx + 5, y + 4.4, 4.2, MUTED); y += 9.5;
  const modes = [["Criar com IA por voz", "Recomendado", true], ["Criar com IA por texto", "", false], ["Criar por perguntas", "", false], ["Criar manualmente", "", false]];
  for (let i = 0; i < modes.length; i++) {
    const cy = y + i * 12.5;
    const hi = modes[i][2];
    rr(doc, s.sx + 3, cy, s.sw - 6, 11, 2, hi ? [255, 237, 222] : [255, 255, 255]);
    strokeRect(doc, s.sx + 3, cy, s.sw - 6, 11, 2, hi ? BRAND : [232, 234, 237]);
    rr(doc, s.sx + 5.5, cy + 2.5, 6, 6, 1.8, hi ? BRAND : [255, 237, 222]);
    if (i === 0) micGlyph(doc, s.sx + 8.5, cy + 5.5, 1.0, hi ? [255, 255, 255] : BRAND);
    else { tx(doc, ["", "T", "?", "✎"][i] || "", s.sx + 8.5, cy + 6.6, 5, BRAND, true, "center"); }
    tx(doc, modes[i][0], s.sx + 14, cy + 5, 4.7, GRAPHITE, true);
    if (modes[i][1]) tx(doc, modes[i][1], s.sx + 14, cy + 8.3, 3.8, BRAND, true);
  }
  phoneNav(doc, s, 2);
}

function drawVoice(doc, s) {
  phoneTop(doc, s);
  let y = s.sy + 14;
  tx(doc, "RDO por voz", s.sx + 3, y, 6.5, GRAPHITE, true); y += 7;
  // grande botão de microfone
  const cx = s.sx + s.sw / 2, cy = y + 13;
  rr(doc, cx - 11, cy - 11, 22, 22, 11, BRAND);
  micGlyph(doc, cx, cy, 2.4, [255, 255, 255]);
  y = cy + 15;
  tx(doc, "Ouvindo… 0:18", cx, y, 5, GRAPHITE, true, "center"); y += 4.5;
  tx(doc, "Fale: equipe, horários, atividades,", cx, y, 3.8, MUTED, false, "center"); y += 3.6;
  tx(doc, "materiais, ocorrências e pendências.", cx, y, 3.8, MUTED, false, "center"); y += 6;
  // caixa de transcrição
  rr(doc, s.sx + 3, y, s.sw - 6, 18, 2, [240, 241, 243]);
  tx(doc, "TRANSCRIÇÃO", s.sx + 5, y + 4, 3.4, MUTED, true);
  doc.setFillColor(...[210, 214, 219]);
  for (let i = 0; i < 4; i++) doc.roundedRect(s.sx + 5, y + 6.5 + i * 2.6, (s.sw - 10) * [0.95, 0.88, 0.7, 0.5][i], 1.4, 0.7, 0.7, "F");
  y += 21;
  // botão organizar
  rr(doc, s.sx + 3, y, s.sw - 6, 8.5, 2, BRAND);
  tx(doc, "Organizar com IA", cx, y + 5.5, 4.8, [255, 255, 255], true, "center");
  phoneNav(doc, s, 2);
}

function drawQuestions(doc, s) {
  phoneTop(doc, s);
  let y = s.sy + 13;
  tx(doc, "Pergunta 6 de 12", s.sx + 3, y, 5, GRAPHITE, true); y += 4;
  // barra de progresso
  rr(doc, s.sx + 3, y, s.sw - 6, 1.6, 0.8, [225, 228, 232]);
  rr(doc, s.sx + 3, y, (s.sw - 6) * 0.5, 1.6, 0.8, BRAND); y += 7;
  tx(doc, "Houve solicitação do", s.sx + 3, y, 6, GRAPHITE, true); y += 4.2;
  tx(doc, "cliente/contratante?", s.sx + 3, y, 6, GRAPHITE, true); y += 6;
  // caixa de resposta + microfone
  const boxW = s.sw - 6 - 11;
  rr(doc, s.sx + 3, y, boxW, 16, 2, [255, 255, 255]); strokeRect(doc, s.sx + 3, y, boxW, 16, 2);
  doc.setFillColor(...[214, 218, 222]);
  for (let i = 0; i < 3; i++) doc.roundedRect(s.sx + 5, y + 3.5 + i * 3, boxW * [0.85, 0.7, 0.45][i], 1.4, 0.7, 0.7, "F");
  // botão de microfone à direita
  rr(doc, s.sx + s.sw - 11.5, y, 8.5, 16, 2.5, BRAND);
  micGlyph(doc, s.sx + s.sw - 7.25, y + 8, 1.3, [255, 255, 255]);
  y += 18.5;
  tx(doc, "Ouvindo… fale a resposta", s.sx + 3, y, 3.7, BRAND, true); y += 6;
  // navegação
  rr(doc, s.sx + 3, y, (s.sw - 6) * 0.42, 8, 2, [255, 255, 255]); strokeRect(doc, s.sx + 3, y, (s.sw - 6) * 0.42, 8, 2);
  tx(doc, "Pular", s.sx + 3 + (s.sw - 6) * 0.21, y + 5.2, 4.3, MUTED, true, "center");
  rr(doc, s.sx + 3 + (s.sw - 6) * 0.46, y, (s.sw - 6) * 0.54, 8, 2, BRAND);
  tx(doc, "Próxima", s.sx + 3 + (s.sw - 6) * 0.73, y + 5.2, 4.3, [255, 255, 255], true, "center");
  phoneNav(doc, s, 2);
}

function drawResult(doc, s) {
  phoneTop(doc, s);
  let y = s.sy + 13;
  tx(doc, "RDO #18", s.sx + 3, y, 6.5, GRAPHITE, true);
  rr(doc, s.sx + s.sw - 20, y - 3.6, 17, 5, 2.5, [223, 247, 233]);
  tx(doc, "Aprovado", s.sx + s.sw - 11.5, y, 3.6, [22, 130, 70], true, "center"); y += 5.5;
  // resumo executivo
  rr(doc, s.sx + 3, y, s.sw - 6, 13, 2, [255, 255, 255]); strokeRect(doc, s.sx + 3, y, s.sw - 6, 13, 2);
  tx(doc, "Resumo executivo (IA)", s.sx + 5, y + 3.5, 3.8, NAVY, true);
  doc.setFillColor(...[214, 218, 222]);
  for (let i = 0; i < 3; i++) doc.roundedRect(s.sx + 5, y + 5.8 + i * 2.4, (s.sw - 10) * [0.92, 0.8, 0.55][i], 1.3, 0.6, 0.6, "F");
  y += 15.5;
  // registro fotográfico
  tx(doc, "Registro fotográfico", s.sx + 3, y, 4, GRAPHITE, true); y += 2.5;
  const cols = 3, gap = 2, pw = (s.sw - 6 - gap * (cols - 1)) / cols, ph = pw * 0.72;
  const colors = [[37, 99, 235], BRAND, [22, 130, 70], [124, 58, 237], [217, 119, 6], [8, 145, 178]];
  for (let i = 0; i < 6; i++) {
    const col = i % cols, row = Math.floor(i / cols);
    rr(doc, s.sx + 3 + col * (pw + gap), y + row * (ph + gap), pw, ph, 1.5, colors[i]);
  }
  y += (ph + gap) * 2 + 2;
  // assinaturas
  rr(doc, s.sx + 3, y, s.sw - 6, 12, 2, [255, 255, 255]); strokeRect(doc, s.sx + 3, y, s.sw - 6, 12, 2);
  tx(doc, "Assinaturas", s.sx + 5, y + 3.3, 3.8, GRAPHITE, true);
  doc.setDrawColor(170); doc.setLineWidth(0.3);
  doc.line(s.sx + 5, y + 9, s.sx + s.sw / 2 - 3, y + 9);
  doc.line(s.sx + s.sw / 2 + 1, y + 9, s.sx + s.sw - 5, y + 9);
  doc.setLineWidth(0.2);
  tx(doc, "Executora", s.sx + 5, y + 11, 3.2, MUTED);
  tx(doc, "Contratante", s.sx + s.sw / 2 + 1, y + 11, 3.2, MUTED);
  phoneNav(doc, s, 1);
}

function buildApresentacao() {
  const ctx = newCtx("ObraReport IA — Apresentação do produto");
  const { doc } = ctx;
  const IMGW = 56;
  const COLX = M + IMGW + 10, COLW = PW - M - COLX;

  // ===== Página 1 — Capa com screenshot real =====
  doc.setFillColor(...GRAPHITE); doc.rect(0, 0, PW, PH, "F");
  doc.setFillColor(...BRAND); doc.rect(0, 0, PW, 6, "F");
  logoBox(doc, M, 24, 20);
  tx(doc, "ObraReport IA", M + 26, 34, 15, [255, 255, 255], true);
  tx(doc, "RDO inteligente para a construção brasileira", M + 26, 41, 10, [200, 205, 210]);
  tx(doc, "APRESENTAÇÃO DO PRODUTO", M, 86, 12, BRAND, true);
  tx(doc, "Responda, fale e pronto:", M, 102, 22, [255, 255, 255], true);
  tx(doc, "o RDO montado por IA", M, 114, 18, [255, 255, 255], true);
  doc.setFillColor(...BRAND); doc.rect(M, 122, 50, 2.2, "F");
  doc.setFont("helvetica", "normal"); doc.setFontSize(11); doc.setTextColor(210, 214, 219);
  doc.text(doc.splitTextToSize(
    "O ObraReport IA pergunta o que o relatório precisa, deixa o profissional responder por texto ou áudio e a inteligência artificial monta o Relatório Diário de Obra — com fotos, assinaturas e relatório final.",
    106), M, 136);
  deviceImage(doc, PW - M - IMGW, 96, IMGW, "01-dashboard.jpg");
  tx(doc, "obra-report.vercel.app", M, PH - 28, 9.5, [180, 186, 192]);
  tx(doc, `Documento gerado em ${HOJE}`, M, PH - 21, 9, [150, 156, 162]);

  // ===== Página 2 — Criar o RDO: começa em 1 toque =====
  doc.addPage(); ctx.page += 1; ctx.y = M;
  pageTitle(ctx, 1, "Criar o RDO começa em 1 toque");
  const t2 = ctx.y;
  deviceImage(doc, M, t2, IMGW, "02-modos.jpg");
  ctx.y = t2;
  ch(ctx, COLX, "Escolha como registrar");
  cp(ctx, COLX, COLW, "Direto do painel ou da obra, o profissional abre \"Criar RDO\" e escolhe o jeito mais cômodo para o dia — tudo desenhado para o canteiro, no celular.");
  cb(ctx, COLX, COLW, [
    "Por voz: fale o que aconteceu.",
    "Por perguntas: responda passo a passo (foco deste material).",
    "Por texto: cole um relato livre.",
    "Manual: preencha o formulário completo.",
  ]);
  colCallout(ctx, COLX, COLW, "Por que perguntas?", "Quem está na obra nem sempre sabe o que um RDO precisa conter. As perguntas guiam o registro para que nada importante fique de fora — e o resultado sai padronizado.");

  // ===== Página 3 — Perguntas direcionadas ao que o RDO precisa =====
  addPage(ctx);
  pageTitle(ctx, 2, "Perguntas direcionadas ao RDO");
  const t3 = ctx.y;
  deviceImage(doc, M, t3, IMGW, "03-perguntas.jpg");
  ctx.y = t3;
  ch(ctx, COLX, "As perguntas certas, na ordem certa");
  cp(ctx, COLX, COLW, "Um roteiro de 12 perguntas objetivas cobre exatamente o que um Relatório Diário de Obra exige — o usuário só responde, sem precisar lembrar a estrutura do documento:");
  cb(ctx, COLX, COLW, [
    "O que foi executado e quem esteve presente.",
    "Horários de chegada e saída.",
    "Problemas, atrasos e impedimentos.",
    "Solicitações do cliente e materiais/equipamentos.",
    "Gastos, segurança e pendências para o próximo dia.",
  ]);
  ch(ctx, COLX, "No seu ritmo");
  cp(ctx, COLX, COLW, "Dá para pular, voltar e revisar. A barra de progresso mostra quanto falta — e o registro do dia é concluído em poucos minutos.");

  // ===== Página 4 — Responder por áudio + IA trata tudo =====
  addPage(ctx);
  pageTitle(ctx, 3, "Responda por áudio — a IA trata tudo");
  const t4 = ctx.y;
  deviceImage(doc, M, t4, IMGW, "04-voz.jpg");
  ctx.y = t4;
  ch(ctx, COLX, "Cada resposta pode ser falada");
  cp(ctx, COLX, COLW, "Em qualquer pergunta basta tocar no microfone e responder em voz alta (pt-BR). A transcrição aparece na hora e pode ser misturada com texto — ideal para quem está com as mãos ocupadas na obra.");
  ch(ctx, COLX, "A IA processa as respostas");
  cb(ctx, COLX, COLW, [
    "Compila todas as perguntas e respostas em um relato único.",
    "Classifica cada informação no campo certo: atividades, equipe, ocorrências, solicitações, materiais, gastos, riscos e pendências.",
    "Preenche horários e observações automaticamente.",
    "Não inventa: descarta respostas vazias ou negativas e, se faltar algo, sinaliza.",
  ]);
  colCallout(ctx, COLX, COLW, "Sem alucinação", "A IA organiza e padroniza o que foi dito — ela não cria fatos. O que não foi informado fica em branco para revisão.");

  // ===== Página 5 — RDO gerado, com fotos =====
  addPage(ctx);
  pageTitle(ctx, 4, "O RDO montado, com fotos");
  const t5 = ctx.y;
  deviceImage(doc, M, t5, IMGW, "05-rdo-fotos.jpg");
  ctx.y = t5;
  ch(ctx, COLX, "Tudo estruturado em segundos");
  cp(ctx, COLX, COLW, "As respostas viram um RDO completo: resumo executivo, atividades com status, equipe, materiais, ocorrências, solicitações, gastos e o registro fotográfico do dia — com pontuação de qualidade que indica o que ainda falta.");
  ch(ctx, COLX, "Fotos, assinatura e PDF");
  cb(ctx, COLX, COLW, [
    "Fotos e vídeos por fase (antes/durante/depois) no relatório.",
    "Assinatura digital do responsável e do contratante.",
    "Exportação em PDF profissional com a marca da empresa.",
    "Compartilhamento por WhatsApp, e-mail ou link.",
  ]);
  ch(ctx, COLX, "Contratante e relatório final");
  cp(ctx, COLX, COLW, "O contratante acompanha por login próprio: vê os RDOs, comenta, aprova e assina. Ao fim da obra, todos os RDOs viram um relatório final consolidado com linha do tempo gerada por IA.");
  colCallout(ctx, COLX, COLW, "Comece agora", "Teste grátis em obra-report.vercel.app — responda as perguntas por áudio e veja o RDO pronto na hora.");

  footer(ctx);
  return doc;
}

// =====================================================================
//  DOCUMENTO 5 — PROJEÇÕES FINANCEIRAS + ANÁLISE DE MERCADO
// =====================================================================
// Mini gráfico de barras (faturamento por ano)
function barChart(ctx, items) {
  const { doc } = ctx;
  const h = 44, top = ctx.y, left = M + 2, w = PW - 2 * M - 4;
  ensure(ctx, h + 6);
  const max = Math.max(...items.map((i) => i.value));
  const bw = w / items.length;
  // linha de base
  doc.setDrawColor(225); doc.setLineWidth(0.3); doc.line(left, top + h - 8, left + w, top + h - 8);
  items.forEach((it, i) => {
    const bh = Math.max(1.5, (it.value / max) * (h - 16));
    const bwid = bw * 0.5;
    const x = left + i * bw + (bw - bwid) / 2;
    const y = top + (h - 8) - bh;
    rr(doc, x, y, bwid, bh, 1, BRAND);
    tx(doc, it.top, x + bwid / 2, y - 1.6, 7, GRAPHITE, true, "center");
    tx(doc, it.label, x + bwid / 2, top + h - 3, 7, MUTED, false, "center");
  });
  ctx.y = top + h + 4;
}

function buildProjecoesMercado() {
  const ctx = newCtx("ObraReport IA — Projeções financeiras e análise de mercado");
  cover(ctx, "Projeções & Mercado", "Projeções de", "receita e mercado",
    "Modelo otimista de receita, faturamento e lucro (bruto e líquido) com custos reais, e a análise do mercado de construção no Brasil — com o percentual que o ObraReport IA pode representar.");

  let n = 0;

  // ---- 1. Mercado (Brasil) ----
  section(ctx, ++n, "O mercado de construção no Brasil");
  paragraph(ctx, "A construção civil responde por cerca de 5,8% do PIB brasileiro (R$ 359,5 bi em 2024). É um setor enorme, capilarizado e ainda pouco digitalizado — o terreno ideal para um RDO simples, barato e por voz.");
  simpleTable(ctx, ["Indicador", "Número", "Fonte (ano)"], [
    ["Construção no PIB", "5,8% — R$ 359,5 bi", "IBGE / CBIC (2024)"],
    ["Empresas formais (CNAE F)", "~165.800", "IBGE PAIC (2023)"],
    ["MEIs de construção (estim.)", "~800 mil", "Sebrae / Receita (2024)"],
    ["Trabalhadores formais do setor", "~2,9 milhões", "CBIC / CAGED (2024)"],
    ["Engenheiros civis (CONFEA)", "~369 mil", "CONFEA (2024)"],
    ["Arquitetos (CAU)", "~242 mil", "CAU/BR (2024)"],
    ["Construtechs (com IA)", "267 (apenas ~29)", "Liga Ventures (2025)"],
    ["Adoção de software de obra", "~61% (gap de ~39%)", "Liga Ventures (2024)"],
  ], { columnStyles: { 0: { cellWidth: 58, fontStyle: "bold" }, 1: { cellWidth: 50 } } });
  paragraph(ctx, "Mesmo entre empresas que já usam algum software, 39% ainda não têm controle digital de obra — e a maioria das soluções é cara ou complexa.", { size: 9, color: MUTED });

  // ---- 2. TAM / SAM / SOM ----
  section(ctx, ++n, "Tamanho de mercado e participação (TAM/SAM/SOM)");
  simpleTable(ctx, ["Camada", "Definição", "Tamanho", "ObraReport"], [
    ["TAM", "Empresas formais + MEIs de construção", "~1,06 milhão", "—"],
    ["SAM", "Empresas/MPE digitalizáveis (alvo realista)", "~250–300 mil", "—"],
    ["SOM Ano 1", "Clientes pagantes", "500", "~0,2% do SAM"],
    ["SOM Ano 3", "Clientes pagantes", "5.000", "~2% do SAM"],
    ["SOM Ano 5", "Clientes pagantes", "15.000", "~5–6% do SAM"],
  ], { columnStyles: { 0: { cellWidth: 24, fontStyle: "bold" }, 2: { cellWidth: 30 }, 3: { cellWidth: 34 } } });
  paragraph(ctx, "Em 5 anos, 15.000 clientes representam cerca de 9% das empresas formais de construção do país — ainda deixando a maior parte do mercado em aberto. É uma meta ambiciosa, porém pequena diante do tamanho total: há muito espaço para crescer.", { size: 9.5 });

  // ---- 3. Concorrência e lacuna ----
  section(ctx, ++n, "Concorrência e a lacuna que ocupamos");
  simpleTable(ctx, ["Solução", "Foco", "Preço aprox."], [
    ["Sienge (Softplan)", "Ecossistema da incorporação (enterprise)", "Sob consulta"],
    ["Mobuss Construção", "Gestão do canteiro ao pós-obra (enterprise)", "Sob consulta"],
    ["Construpoint (Sienge)", "Diário de obra mobile (add-on do ecossistema)", "Incluso"],
    ["App Diário de Obra / Obrafit", "RDO/diário acessível, manual", "Dezenas/mês"],
    ["Vobi / OrçaFascio", "Financeiro / orçamento de obra", "~R$ 100–300/mês"],
    ["ObraReport IA (nós)", "RDO por voz + IA, mobile, contratante", "R$ 79–399/mês"],
  ], { columnStyles: { 0: { cellWidth: 46, fontStyle: "bold" }, 2: { cellWidth: 34 } } });
  callout(ctx, "A lacuna (gap)", "As soluções completas (Sienge, Mobuss) são caras e voltadas para grandes construtoras; os apps baratos são manuais. Não há um líder claro de \"RDO por voz + IA, mobile-first e barato\" com camada de contratante — exatamente o nosso posicionamento.");

  // ---- 4. Premissas do modelo (custos reais) ----
  section(ctx, ++n, "Premissas do modelo (otimista, custos reais)");
  bullets(ctx, [
    "Preços reais do app: Free R$ 0, Básico R$ 79, Profissional R$ 199, Empresa R$ 399/mês.",
    "Receita média por cliente pagante (ARPU) ~ R$ 152/mês (mix 55% Básico, 35% Profissional, 10% Empresa).",
    "Custos diretos reais: taxa de pagamento ~3,5% da receita (Pix ~1% / cartão ~4,5%) e infraestrutura < 1% (Vercel/Supabase/IA só quando ativados — hoje ~R$ 0).",
    "Impostos: Simples Nacional ~6% no início; ao ultrapassar o teto (R$ 4,8 mi/ano), migra para Lucro Presumido (~14% efetivo).",
  ]);
  callout(ctx, "Sem inventar custos", "Hoje não há folha de pagamento, marketing pago nem servidores caros — por isso a margem é alta e real. Os custos de equipe e anúncios entram apenas como cenário de crescimento (opcional), nunca como despesa atual fictícia.");

  // ---- 5. Projeção Ano 1 (mês a mês) ----
  section(ctx, ++n, "Projeção do Ano 1 (mês a mês)");
  const meses = [
    ["Mês 1", "10", "1.520", "1.520"], ["Mês 2", "20", "3.040", "4.560"],
    ["Mês 3", "35", "5.320", "9.880"], ["Mês 4", "55", "8.360", "18.240"],
    ["Mês 5", "80", "12.160", "30.400"], ["Mês 6", "110", "16.720", "47.120"],
    ["Mês 7", "150", "22.800", "69.920"], ["Mês 8", "200", "30.400", "100.320"],
    ["Mês 9", "260", "39.520", "139.840"], ["Mês 10", "330", "50.160", "190.000"],
    ["Mês 11", "410", "62.320", "252.320"], ["Mês 12", "500", "76.000", "328.320"],
  ];
  simpleTable(ctx, ["Mês", "Pagantes", "MRR (R$)", "Receita acum. (R$)"], meses,
    { columnStyles: { 1: { halign: "center" }, 2: { halign: "right" }, 3: { halign: "right" } } });
  paragraph(ctx, "Fim do Ano 1: 500 clientes pagantes, MRR de R$ 76 mil (ARR ~R$ 912 mil). Faturamento do ano ~R$ 328 mil; lucro bruto ~R$ 316 mil; lucro líquido ~R$ 296 mil (margem ~90%).", { size: 9.5 });

  // ---- 6. Consolidado 5 anos + expansão ----
  section(ctx, ++n, "Projeção de 3 a 5 anos e expansão");
  simpleTable(ctx, ["Ano", "Pagantes", "Faturamento", "Lucro bruto", "Lucro líquido", "Margem"], [
    ["1", "500", "R$ 328 mil", "R$ 316 mil", "R$ 296 mil", "90%"],
    ["2", "2.000", "R$ 2,10 mi", "R$ 2,02 mi", "R$ 1,77 mi", "84%"],
    ["3", "5.000", "R$ 6,02 mi", "R$ 5,78 mi", "R$ 4,94 mi", "82%"],
    ["4", "9.000", "R$ 12,77 mi", "R$ 12,26 mi", "R$ 10,47 mi", "82%"],
    ["5", "15.000", "R$ 21,89 mi", "R$ 21,00 mi", "R$ 17,94 mi", "82%"],
  ], { columnStyles: { 0: { cellWidth: 12, halign: "center", fontStyle: "bold" } } });
  barChart(ctx, [
    { label: "Ano 1", value: 0.33, top: "R$0,3mi" },
    { label: "Ano 2", value: 2.10, top: "R$2,1mi" },
    { label: "Ano 3", value: 6.02, top: "R$6,0mi" },
    { label: "Ano 4", value: 12.77, top: "R$12,8mi" },
    { label: "Ano 5", value: 21.89, top: "R$21,9mi" },
  ]);
  subheading(ctx, "Anos 3–5: consolidação nacional e ida internacional");
  bullets(ctx, [
    "Anos 1–3: foco no Brasil — virar referência em RDO por voz/IA para MPE e autônomos.",
    "Anos 3–5: expansão nacional + entrada na América Latina (mercados de língua espanhola, mesma dor de obra).",
    "O mercado global de software de gestão de construção é de ~US$ 9,5–10,8 bi (2025), crescendo ~8–10% ao ano até ~US$ 14–18 bi em 2030–31 (Mordor, MarketsandMarkets, Technavio).",
    "No Ano 5, ~R$ 27 mi de ARR equivalem a ~US$ 5 mi — cerca de 0,03–0,05% do mercado global: a barreira é execução e distribuição, não tamanho de mercado.",
  ]);
  callout(ctx, "Leitura honesta dos números", "São projeções otimistas, baseadas em premissas explícitas de adoção e ARPU — não são garantia. A margem alta reflete a operação enxuta atual; com equipe e investimento em aquisição, a margem líquida cai, mas o faturamento tende a crescer mais rápido.");

  footer(ctx);
  return ctx.doc;
}

// ---- Execução ----
mkdirSync(OUT_DIR, { recursive: true });
const doc1 = buildDocumentacao();
const p1 = join(OUT_DIR, "ObraReport-IA-Documentacao.pdf");
writeFileSync(p1, Buffer.from(doc1.output("arraybuffer")));

const doc2 = buildPitch();
const p2 = join(OUT_DIR, "ObraReport-IA-Pitch-Executivo-3min.pdf");
writeFileSync(p2, Buffer.from(doc2.output("arraybuffer")));

const doc3 = buildPitchExecutivo();
const p3 = join(OUT_DIR, "ObraReport-IA-Pitch-Executivo-2laudas.pdf");
writeFileSync(p3, Buffer.from(doc3.output("arraybuffer")));

const doc4 = buildApresentacao();
const p4 = join(OUT_DIR, "ObraReport-IA-Apresentacao-5paginas.pdf");
writeFileSync(p4, Buffer.from(doc4.output("arraybuffer")));

const doc5 = buildProjecoesMercado();
const p5 = join(OUT_DIR, "ObraReport-IA-Projecoes-e-Mercado.pdf");
writeFileSync(p5, Buffer.from(doc5.output("arraybuffer")));

console.log("PDFs gerados:");
console.log(" -", p1, `(${doc1.getNumberOfPages()} páginas)`);
console.log(" -", p2, `(${doc2.getNumberOfPages()} páginas)`);
console.log(" -", p3, `(${doc3.getNumberOfPages()} páginas)`);
console.log(" -", p5, `(${doc5.getNumberOfPages()} páginas)`);
console.log(" -", p4, `(${doc4.getNumberOfPages()} páginas)`);
