// Gera os PDFs de documentação e pitch do ObraReport IA usando o mesmo
// motor (jsPDF) já utilizado no app, garantindo identidade visual da marca.
// Uso: npm run docs  ->  cria os arquivos em docs/.

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { mkdirSync, writeFileSync } from "node:fs";
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
  doc.text(`página ${ctx.page}`, PW - M, PH - 9, { align: "right" });
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

// ---- Execução ----
mkdirSync(OUT_DIR, { recursive: true });

const doc1 = buildDocumentacao();
const p1 = join(OUT_DIR, "ObraReport-IA-Documentacao.pdf");
writeFileSync(p1, Buffer.from(doc1.output("arraybuffer")));

const doc2 = buildPitch();
const p2 = join(OUT_DIR, "ObraReport-IA-Pitch-Executivo-3min.pdf");
writeFileSync(p2, Buffer.from(doc2.output("arraybuffer")));

console.log("PDFs gerados:");
console.log(" -", p1, `(${doc1.getNumberOfPages()} páginas)`);
console.log(" -", p2, `(${doc2.getNumberOfPages()} páginas)`);
