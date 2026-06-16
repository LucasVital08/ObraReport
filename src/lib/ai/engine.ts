// Motor de IA do ObraReport — "Assistente RDO IA"
//
// MODO SIMULADO (padrão): um parser heurístico em português que extrai
// horários, equipe, atividades, materiais, equipamentos, ocorrências,
// pendências, solicitações e gastos a partir de voz/texto livre. Não inventa
// fatos — quando algo não está claro, marca como campo faltante e gera
// perguntas complementares.
//
// MODO OPENAI (opcional): se uma chave estiver configurada, a função
// `organizeRdoText` pode encaminhar para o endpoint /api/ai (ver rota) que
// chama a OpenAI com o mesmo schema de saída (AiRdoResult).

import type { AiRdoResult, DailyReport, Project, AiFinalResult } from "@/lib/types";

const STOPWORDS = new Set([
  "a", "o", "e", "de", "da", "do", "das", "dos", "que", "para", "com", "em",
  "no", "na", "nos", "nas", "um", "uma", "as", "os", "ao", "à", "se", "por",
  "foi", "foram", "estava", "estavam", "ficou", "ficaram", "também", "ja",
  "já", "mas", "pois", "como", "sua", "seu", "the", "hoje",
]);

// Vocabulários de domínio (obra) — usados para classificar trechos.
const ACTIVITY_VERBS = [
  "lixamento", "lixar", "lixou", "pintura", "pintar", "pintou", "preparação",
  "preparar", "preparou", "limpeza", "limpar", "instalação", "instalar",
  "instalou", "remoção", "remover", "removeu", "montagem", "montar",
  "demolição", "demolir", "concretagem", "concretar", "alvenaria",
  "acabamento", "vistoria", "vistoriar", "execução", "executar", "executou",
  "aplicação", "aplicar", "aplicou", "iniciado", "iniciou", "iniciada",
  "realizado", "realizou", "realizada", "feito", "feita", "organização",
  "organizar", "fundação", "escavação", "reboco", "emassamento", "selagem",
  "impermeabilização", "soldagem", "corte", "perfuração", "nivelamento",
];

const MATERIAL_WORDS = [
  "tinta", "tintas", "cimento", "areia", "brita", "massa", "verniz", "selador",
  "lixa", "lixas", "rolo", "pincel", "fita", "parafuso", "parafusos", "prego",
  "pregos", "cano", "canos", "fio", "fios", "cabo", "cabos", "tubo", "tubos",
  "gesso", "drywall", "placa", "placas", "tijolo", "tijolos", "argamassa",
  "rejunte", "silicone", "cola", "extensão", "extensões", "plug", "plugs",
  "mangueira", "mangueiras", "diluente", "solvente", "primer", "epóxi",
];

const EQUIPMENT_WORDS = [
  "lixadeira", "lixadeiras", "furadeira", "furadeiras", "betoneira",
  "andaime", "andaimes", "compressor", "gerador", "jato", "escada", "escadas",
  "serra", "esmerilhadeira", "martelete", "guincho", "empilhadeira",
  "plataforma", "rolo compressor", "vibrador", "policorte", "makita",
  "parafusadeira", "soprador",
];

const OCCURRENCE_HINTS = [
  "atraso", "atrasou", "atrasada", "problema", "faltou", "falta", "sem ",
  "quebrou", "quebrado", "danificado", "chuva", "chovendo", "parou",
  "impedimento", "impediu", "acidente", "risco", "perigo", "não havia",
  "só havia", "indisponível", "indisponivel", "interrompido", "vazamento",
  "defeito", "queda", "bloqueio", "divergência",
];

const REQUEST_HINTS = [
  "foi solicitado", "solicitado", "solicitação", "solicitou", "pediu",
  "pedido", "pedido de", "necessário", "necessita", "precisa de", "ficou de",
  "deve trazer", "trazer", "providenciar", "cliente pediu",
  "contratante pediu", "contratante solicitou",
];

const PENDING_HINTS = [
  "pendente", "pendência", "ficou pendente", "faltou", "não foi concluído",
  "amanhã", "próximo dia", "próxima", "continuar", "retomar", "será feito",
  "ainda falta", "resta", "restou",
];

const EXPENSE_HINTS: { word: string; category: string }[] = [
  { word: "gasolina", category: "gasolina" },
  { word: "combustível", category: "gasolina" },
  { word: "almoço", category: "alimentação" },
  { word: "lanche", category: "alimentação" },
  { word: "alimentação", category: "alimentação" },
  { word: "comida", category: "alimentação" },
  { word: "pedágio", category: "pedágio" },
  { word: "estacionamento", category: "estacionamento" },
  { word: "locação", category: "locação" },
  { word: "aluguel", category: "locação" },
  { word: "hospedagem", category: "hospedagem" },
  { word: "diária", category: "diária" },
  { word: "ferramenta", category: "ferramenta" },
];

function splitSentences(text: string): string[] {
  return text
    .replace(/\n+/g, ". ")
    .split(/(?<=[.!?;])\s+|\.\s*/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);
}

function clean(s: string): string {
  return s.replace(/\s+/g, " ").trim().replace(/^[,;.\s]+|[,;.\s]+$/g, "");
}

function capitalizeFirst(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Extrai horários no formato 9h, 9h30, 9:30, "às 9 horas", "17 horas"
function extractTimes(text: string): { chegada?: string; saida?: string } {
  const result: { chegada?: string; saida?: string } = {};
  const timeRe = /(\d{1,2})\s*(?:h|horas|:)\s*(\d{0,2})/gi;

  const lower = text.toLowerCase();
  const sentences = splitSentences(lower);

  const fmt = (h: string, m: string) =>
    `${h.padStart(2, "0")}:${(m || "00").padStart(2, "0")}`;

  for (const sentence of sentences) {
    const arrivalCtx = /(cheg|inici|começ|comec|entrada|abertura|às\s|as\s)/.test(
      sentence,
    );
    const departCtx = /(saí|sai|encerr|termin|fim|final|saída|saida|fechamento|fomos embora)/.test(
      sentence,
    );
    let m: RegExpExecArray | null;
    timeRe.lastIndex = 0;
    while ((m = timeRe.exec(sentence)) !== null) {
      const value = fmt(m[1], m[2]);
      if (departCtx && !result.saida) result.saida = value;
      else if (arrivalCtx && !result.chegada) result.chegada = value;
      else if (!result.chegada) result.chegada = value;
    }
  }
  return result;
}

// Heurística para nomes próprios: tokens capitalizados que não iniciam frase
// e não são palavras de domínio. Também capta listas após "presentes".
function extractTeam(text: string): { name: string; role?: string }[] {
  const names = new Map<string, string | undefined>();

  // Frases que listam presença (inclusive "cheguei com X e Y", "estava com…")
  const presenceMatch = text.match(
    /(?:presentes?|equipe|estavam|estava com|compareceram|contou com|cheguei com|fui com|com a equipe|comigo)[^.]*?([A-Za-zÀ-ÿ]+(?:[\s,]+(?:e\s+)?[A-Za-zÀ-ÿ]+)*)/i,
  );

  const harvest = (chunk: string) => {
    const parts = chunk.split(/,|\se\s|\sE\s/);
    for (const p of parts) {
      const tokens = p.trim().split(/\s+/);
      for (let i = 0; i < tokens.length; i++) {
        const tk = tokens[i].replace(/[^A-Za-zÀ-ÿ]/g, "");
        // nomes próprios: token capitalizado que não é palavra de domínio.
        // Mantém-se conservador para não inventar pessoas a partir de verbos.
        if (
          /^[A-ZÀ-Ý][a-zà-ÿ]{2,}$/.test(tk) &&
          !isDomainWord(tk.toLowerCase())
        ) {
          // função: "Lucas como supervisor"
          let role: string | undefined;
          const after = tokens.slice(i + 1, i + 3).join(" ").toLowerCase();
          const roleMatch = after.match(
            /como\s+(supervisor|encarregado|mestre|ajudante|pintor|eletricista|servente|engenheiro|técnico|tecnico)/,
          );
          if (roleMatch) role = capitalizeFirst(roleMatch[1]);
          if (!names.has(tk)) names.set(tk, role);
        }
      }
    }
  };

  if (presenceMatch) harvest(presenceMatch[1]);

  return Array.from(names.entries()).map(([name, role]) => ({ name, role }));
}

function isDomainWord(w: string): boolean {
  return (
    STOPWORDS.has(w) ||
    ACTIVITY_VERBS.includes(w) ||
    MATERIAL_WORDS.includes(w) ||
    EQUIPMENT_WORDS.includes(w) ||
    [
      "obra", "loja", "equipe", "serviço", "servico", "material", "supervisor",
      "castelo", "tech", "tintas", "locações", "locacoes", "ponto", "energia",
      "superfície", "superficie",
    ].includes(w)
  );
}

function matchAny(sentence: string, list: string[]): boolean {
  const s = sentence.toLowerCase();
  return list.some((w) => s.includes(w));
}

function extractByWords(text: string, words: string[]): string[] {
  const found = new Set<string>();
  const lower = text.toLowerCase();
  for (const w of words) {
    const re = new RegExp(`\\b${w}\\b`, "i");
    if (re.test(lower)) found.add(capitalizeFirst(w));
  }
  return Array.from(found);
}

function parseExpenses(
  text: string,
): { description: string; amount?: number; category?: string }[] {
  const out: { description: string; amount?: number; category?: string }[] = [];
  const lower = text.toLowerCase();
  for (const { word, category } of EXPENSE_HINTS) {
    if (lower.includes(word)) {
      // valor após a palavra: "gasolina R$ 80", "gasolina 80 reais"
      const after = new RegExp(`${word}[^.]{0,40}?(?:r\\$\\s*)?(\\d+[.,]?\\d*)\\s*(?:reais)?`, "i");
      // valor antes da palavra: "gastei 80 de gasolina", "R$ 80 de gasolina"
      const before = new RegExp(`(?:r\\$\\s*)?(\\d+[.,]?\\d*)\\s*(?:reais)?[^.\\d]{0,15}?${word}`, "i");
      // "before" tem prioridade: número colado à palavra é sinal mais forte.
      const m = lower.match(before) || lower.match(after);
      const amount = m ? parseFloat(m[1].replace(",", ".")) : undefined;
      out.push({ description: capitalizeFirst(word), amount, category });
    }
  }
  return out;
}

/**
 * Organiza um texto bruto (voz ou texto) em um RDO estruturado.
 * Modo simulado, determinístico, em português. Não inventa fatos.
 */
export function organizeRdoText(text: string): AiRdoResult {
  const sentences = splitSentences(text);
  const times = extractTimes(text);
  const team = extractTeam(text);

  const activities: string[] = [];
  const occurrences: string[] = [];
  const requests: string[] = [];
  const pending: string[] = [];
  const risks: string[] = [];

  for (const raw of sentences) {
    const s = clean(raw);
    if (s.length < 4) continue;
    const lower = s.toLowerCase();

    let classified = false;

    if (matchAny(lower, REQUEST_HINTS)) {
      requests.push(capitalizeFirst(s));
      classified = true;
    }
    if (matchAny(lower, PENDING_HINTS)) {
      pending.push(capitalizeFirst(s));
      classified = true;
    }
    if (matchAny(lower, OCCURRENCE_HINTS)) {
      occurrences.push(capitalizeFirst(s));
      if (/risco|perigo|acidente|segurança|seguranca|queda/.test(lower)) {
        risks.push(capitalizeFirst(s));
      }
      classified = true;
    }
    // atividade: contém verbo de obra e não é só ocorrência/solicitação
    if (matchAny(lower, ACTIVITY_VERBS)) {
      activities.push(capitalizeFirst(s));
      classified = true;
    }
    // frase de deslocamento/compra também é relevante como atividade
    if (
      !classified &&
      /(fui até|foi até|deslocamento|buscar|trocar|comprar|comprou|retirar)/.test(
        lower,
      )
    ) {
      activities.push(capitalizeFirst(s));
    }
  }

  const materials = extractByWords(text, MATERIAL_WORDS);
  const equipment = extractByWords(text, EQUIPMENT_WORDS);
  const expenses = parseExpenses(text);

  // Resumo executivo: 1-2 frases sintetizadas a partir do que foi detectado.
  const summaryParts: string[] = [];
  if (activities.length) {
    summaryParts.push(
      `Equipe executou ${activities.length} frente(s) de trabalho, incluindo ${activities
        .slice(0, 2)
        .map((a) => a.toLowerCase())
        .join(" e ")}.`,
    );
  }
  if (occurrences.length) {
    summaryParts.push(`Foram registradas ${occurrences.length} ocorrência(s).`);
  }
  if (pending.length) {
    summaryParts.push(`${pending.length} pendência(s) para o próximo dia.`);
  }
  const executiveSummary =
    summaryParts.join(" ") ||
    "Dia de trabalho registrado. Revise as informações e complemente os campos faltantes.";

  // Detecção de campos faltantes essenciais.
  const missing: string[] = [];
  if (!times.chegada) missing.push("Horário de chegada");
  if (!times.saida) missing.push("Horário de saída");
  if (team.length === 0) missing.push("Equipe presente");
  if (activities.length === 0) missing.push("Atividades executadas");
  if (!/(chuva|sol|nublado|tempo|clima|chov)/i.test(text))
    missing.push("Clima do dia");
  if (pending.length === 0) missing.push("Pendências / planejamento do próximo dia");

  // Perguntas complementares a partir dos campos faltantes.
  const questionMap: Record<string, string> = {
    "Horário de chegada": "Qual foi o horário de chegada da equipe?",
    "Horário de saída": "Qual foi o horário de saída?",
    "Equipe presente": "Quem esteve presente na obra hoje?",
    "Atividades executadas": "Quais atividades foram executadas?",
    "Clima do dia": "O clima interferiu na execução do serviço?",
    "Pendências / planejamento do próximo dia":
      "O que ficou pendente para o próximo dia?",
  };
  const questions = missing.map((m) => questionMap[m]).filter(Boolean);
  questions.push("Houve acidente ou problema de segurança?");
  questions.push("Algum gasto foi realizado na obra hoje?");

  return {
    resumo_executivo: executiveSummary,
    clima: "",
    condicao_canteiro: "",
    horarios: times,
    equipe_presente: team,
    atividades_executadas: dedupe(activities).map((descricao) => ({ descricao, status: "concluida" as const })),
    materiais_utilizados: materials,
    materiais_solicitados: [],
    equipamentos_utilizados: equipment,
    ocorrencias: dedupe(occurrences),
    impedimentos: [],
    riscos: dedupe(risks),
    solicitacoes: dedupe(requests),
    gastos: expenses,
    pendencias: dedupe(pending),
    plano_proximo_dia: [],
    observacoes_tecnicas: "",
    campos_faltantes: missing,
    perguntas_complementares: dedupe(questions),
  };
}

function dedupe(arr: string[]): string[] {
  return Array.from(new Set(arr.map((a) => a.trim()))).filter(Boolean);
}

/** Corrige/melhora linguagem informal para tom técnico (simples). */
export function improveLanguage(text: string): string {
  return capitalizeFirst(
    text
      .replace(/\bpra\b/gi, "para")
      .replace(/\bvc\b/gi, "você")
      .replace(/\bq\b/gi, "que")
      .replace(/\btb\b/gi, "também")
      .replace(/\bblz\b/gi, "tudo certo")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

// ---- Relatório final consolidado ----
export function buildFinalReport(
  project: Project,
  reports: DailyReport[],
): AiFinalResult {
  const sorted = [...reports].sort((a, b) => a.date.localeCompare(b.date));
  const allActivities = sorted.flatMap((r) =>
    r.activities.map((a) => a.description),
  );
  const resolved: string[] = [];
  const openPending: string[] = [];
  sorted.forEach((r, idx) => {
    // pendência considerada resolvida se aparece atividade semelhante depois
    r.pending.forEach((p) => {
      const laterDone = sorted
        .slice(idx + 1)
        .some((later) =>
          later.activities.some((a) =>
            similar(a.description, p),
          ),
        );
      if (laterDone) resolved.push(p);
      else openPending.push(p);
    });
  });

  const occurrences = dedupe(sorted.flatMap((r) => r.occurrences));
  const materials = dedupe(sorted.flatMap((r) => r.materials.map((m) => m.name)));
  const equipment = dedupe(sorted.flatMap((r) => r.equipment.map((m) => m.name)));

  const expenseByCat = new Map<string, number>();
  sorted
    .flatMap((r) => r.expenses)
    .forEach((e) =>
      expenseByCat.set(e.category, (expenseByCat.get(e.category) || 0) + e.amount),
    );

  const timeline = sorted.map((r) => ({
    date: r.date,
    resumo:
      r.executiveSummary ||
      r.activities.map((a) => a.description).slice(0, 2).join("; ") ||
      "Sem resumo registrado.",
  }));

  const period =
    sorted.length > 0
      ? `${formatBR(sorted[0].date)} a ${formatBR(sorted[sorted.length - 1].date)}`
      : "—";

  return {
    resumo_geral_da_obra: `A obra "${project.name}" para o cliente ${project.client} contou com ${sorted.length} diário(s) de obra registrados no período de ${period}. Foram executadas ${allActivities.length} atividades, com ${resolved.length} pendência(s) resolvida(s) e ${openPending.length} em aberto.`,
    periodo_execucao: period,
    principais_servicos: dedupe(allActivities).slice(0, 12),
    linha_do_tempo: timeline,
    pendencias_resolvidas: dedupe(resolved),
    pendencias_abertas: dedupe(openPending),
    ocorrencias_relevantes: occurrences.slice(0, 10),
    materiais_relevantes: materials,
    equipamentos_relevantes: equipment,
    gastos_resumidos: Array.from(expenseByCat.entries()).map(([category, total]) => ({
      category,
      total,
    })),
    conclusao_tecnica: `Os serviços previstos foram executados conforme registrado nos diários de obra. ${openPending.length === 0 ? "Não há pendências em aberto, indicando obra apta à entrega." : `Restam ${openPending.length} pendência(s) a serem tratadas antes da entrega final.`}`,
    recomendacoes: [
      openPending.length > 0
        ? "Concluir as pendências em aberto antes do termo de entrega."
        : "Realizar vistoria final com o cliente para formalizar a entrega.",
      "Arquivar todas as fotos e comprovantes para fins de prestação de contas.",
      "Coletar a assinatura do cliente no relatório final.",
    ],
  };
}

function similar(a: string, b: string): boolean {
  const norm = (s: string) =>
    s.toLowerCase().replace(/[^a-zà-ÿ\s]/g, "").split(/\s+/).filter(Boolean);
  const sa = new Set(norm(a));
  const sb = norm(b);
  const common = sb.filter((w) => sa.has(w) && w.length > 3).length;
  return common >= 2;
}

function formatBR(iso: string): string {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

// Score de completude do RDO (Checklist Inteligente).
export interface CompletenessResult {
  score: number; // 0-100
  level: "incompleto" | "basico" | "bom" | "profissional" | "excelente";
  levelLabel: string;
  missingRequired: string[];
  missingRecommended: string[];
  message: string;
}

export function evaluateCompleteness(r: DailyReport): CompletenessResult {
  const required: { label: string; ok: boolean }[] = [
    { label: "Obra", ok: !!r.projectId },
    { label: "Data", ok: !!r.date },
    { label: "Responsável", ok: !!r.responsible },
    { label: "Equipe presente", ok: r.team.some((t) => t.present) },
    { label: "Horário de início", ok: !!r.arrival },
    { label: "Horário de término", ok: !!r.departure },
    { label: "Atividades executadas", ok: r.activities.length > 0 },
    { label: "Status do serviço", ok: r.activities.length > 0 },
    { label: "Resumo do dia", ok: !!r.executiveSummary },
    { label: "Fotos", ok: r.media.some((m) => m.kind === "photo") },
    { label: "Assinatura", ok: r.signatures.length > 0 },
  ];
  const recommended: { label: string; ok: boolean }[] = [
    { label: "Clima", ok: !!r.weather },
    { label: "Materiais usados", ok: r.materials.length > 0 },
    { label: "Equipamentos usados", ok: r.equipment.length > 0 },
    { label: "Gastos", ok: r.expenses.length > 0 },
    { label: "Vídeos", ok: r.media.some((m) => m.kind === "video") },
    { label: "Ocorrências", ok: r.occurrences.length > 0 },
    { label: "Solicitação do cliente", ok: r.clientRequests.length > 0 },
    { label: "Pendências / próximo dia", ok: r.pending.length > 0 || r.nextDayPlan.length > 0 },
    { label: "Observações técnicas", ok: !!r.notes },
  ];

  const reqOk = required.filter((x) => x.ok).length;
  const recOk = recommended.filter((x) => x.ok).length;

  // Pesos: obrigatórios valem 70%, recomendados 30%.
  const score = Math.round(
    (reqOk / required.length) * 70 + (recOk / recommended.length) * 30,
  );

  let level: CompletenessResult["level"];
  let levelLabel: string;
  if (score < 40) { level = "incompleto"; levelLabel = "RDO incompleto"; }
  else if (score < 60) { level = "basico"; levelLabel = "RDO básico"; }
  else if (score < 80) { level = "bom"; levelLabel = "RDO bom"; }
  else if (score < 95) { level = "profissional"; levelLabel = "RDO profissional"; }
  else { level = "excelente"; levelLabel = "RDO excelente"; }

  const missingRequired = required.filter((x) => !x.ok).map((x) => x.label);
  const missingRecommended = recommended.filter((x) => !x.ok).map((x) => x.label);

  const tips = [...missingRequired, ...missingRecommended].slice(0, 3);
  const message =
    score >= 95
      ? "Excelente! Seu RDO está completo e pronto para ser enviado ao cliente."
      : `Seu RDO está ${score}% completo. Para deixá-lo mais profissional, adicione ${tips
          .map((t) => t.toLowerCase())
          .join(", ")}.`;

  return { score, level, levelLabel, missingRequired, missingRecommended, message };
}
