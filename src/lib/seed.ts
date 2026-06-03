import type {
  Checklist, Company, Contact, DailyReport, Equipment, Expense, Incident,
  Material, Project, Task, TeamMember, TimeCard, User, MediaItem, Providencia,
} from "@/lib/types";
import { colorFromString, uid } from "@/lib/utils";

export interface AppData {
  user: User;
  company: Company;
  projects: Project[];
  reports: DailyReport[];
  tasks: Task[];
  team: TeamMember[];
  timeCards: TimeCard[];
  materials: Material[];
  equipment: Equipment[];
  checklists: Checklist[];
  incidents: Incident[];
  expenses: Expense[];
  contacts: Contact[];
}

const COMPANY_ID = "cmp_demo";

function photos(caps: { phase: MediaItem["phase"]; caption: string }[]): MediaItem[] {
  return caps.map((c, i) => ({
    id: uid("med"),
    kind: "photo" as const,
    phase: c.phase,
    caption: c.caption,
    color: colorFromString(c.caption + i),
    author: "Equipe RF",
    createdAt: new Date().toISOString(),
    includeInPdf: true,
  }));
}

function items(names: string[]): { id: string; name: string; quantity?: string }[] {
  return names.map((name) => ({ id: uid("it"), name }));
}
function acts(list: { d: string; s?: "concluida" | "parcial" | "nao_executada" }[]) {
  return list.map((a) => ({ id: uid("act"), description: a.d, status: a.s || ("concluida" as const) }));
}

export function createSeedData(overrides?: Partial<Pick<User, "name" | "email">> & { companyName?: string }): AppData {
  const user: User = {
    id: "usr_demo",
    name: overrides?.name || "Lucas Vital",
    email: overrides?.email || "gestor360@aksenterprise.com.br",
    role: "owner",
    companyId: COMPANY_ID,
    avatarColor: "#f4720b",
  };

  const company: Company = {
    id: COMPANY_ID,
    name: overrides?.companyName || "RF Soluções",
    logoText: "RF",
    brandColor: "#f4720b",
    plan: "profissional",
    city: "Vitória - ES",
    createdAt: new Date().toISOString(),
  };

  // ===== Projeto 1: Drywall / desmontagem — Shopping Park Vitória =====
  const drywall: Project = {
    id: "prj_drywall",
    companyId: COMPANY_ID,
    name: "Shopping Park Vitória — Troca de drywall e desmontagem estrutural do Mall",
    client: "Shopping Park Vitória",
    address: "Corredor Principal — Shopping Park Vitória, Vitória - ES",
    technicalLead: "Eng. responsável técnico",
    supervisor: "Alan",
    startDate: "2026-05-12",
    expectedEndDate: "2026-06-10",
    status: "em_andamento",
    budget: 320000,
    description:
      "Desmontagem estrutural do mall e troca de forro de gesso/drywall no corredor principal, executada em horário noturno (23h às 03h) para não interferir na operação do shopping. Inclui remoção de perfis metálicos, policarbonato, luminárias e segregação de resíduos.",
    coverColor: "#2563eb",
    createdAt: new Date().toISOString(),
  };

  // ===== Projeto 2: Revitalização da Usina de Asfalto — Lidermac/Muribeca =====
  const usina: Project = {
    id: "prj_usina",
    companyId: COMPANY_ID,
    name: "Revitalização da Usina de Asfalto — Lidermac / Muribeca",
    client: "Lidermac",
    address: "Pátio de manutenção — Lidermac, Muribeca",
    technicalLead: "Responsável Técnico",
    supervisor: "Leone",
    startDate: "2026-06-01",
    expectedEndDate: "2026-06-20",
    status: "em_andamento",
    budget: 145000,
    description:
      "Revitalização e tratamento da estrutura metálica da usina de piche/asfalto: lavagem, lixamento, remoção de oxidação, preparação da superfície e pintura. Atuação simultânea da equipe em diferentes frentes (pontos superiores, laterais, internos e inferiores).",
    coverColor: "#f4720b",
    createdAt: new Date().toISOString(),
  };

  const team: TeamMember[] = [
    tm("Alan", "Encarregado", "27 99999-1001", drywall.id),
    tm("Leone", "Responsável de campo", "27 99999-2001", usina.id),
    tm("Ítalo Ferreira", "Lixador", "27 99999-2002", usina.id),
    tm("Hopkins Almeida", "Ajudante", "27 99999-2003", usina.id),
    tm("William Costa", "Lixador", "27 99999-2004", usina.id),
    tm("Geidson Souza", "Ajudante", "27 99999-2005", usina.id),
    tm("Matheus", "Suprimentos", "27 99999-3001", usina.id),
  ];

  const reports: DailyReport[] = [
    ...buildDrywallReports(drywall),
    usinaRdo001(usina),
    usinaRdo002(usina),
  ];

  const tasks: Task[] = [
    task(usina.id, "Comprar 2 plugs/divisores para as lixadeiras", "Suprimentos RF", "urgente", "a_fazer", "2026-06-03"),
    task(usina.id, "Locar jato/lavadora com mangueira de 20m", "Suprimentos RF", "alta", "em_andamento", "2026-06-03"),
    task(usina.id, "Providenciar tinta para a pintura", "Matheus", "alta", "aguardando_material", "2026-06-03"),
    task(usina.id, "Continuar lixamento das áreas pendentes", "Equipe RF", "media", "em_andamento", "2026-06-03"),
    task(drywall.id, "Remover luminárias do próximo trecho", "Alan", "media", "a_fazer", "2026-05-29"),
    task(drywall.id, "Segregar e destinar resíduos da desmontagem", "Equipe RF", "media", "em_andamento", "2026-05-29"),
    task(drywall.id, "Conferir travamento da plataforma JLG", "Alan", "alta", "concluido", "2026-05-28"),
  ];

  const timeCards: TimeCard[] = [
    tc(usina.id, "Leone", "2026-06-02", "07:30", "17:00"),
    tc(usina.id, "Ítalo Ferreira", "2026-06-02", "09:30", "17:00"),
    tc(usina.id, "William Costa", "2026-06-02", "07:30", "17:00"),
    tc(usina.id, "Geidson Souza", "2026-06-02", "07:30", "17:00"),
    tc(drywall.id, "Alan", "2026-05-28", "23:00", "03:00", 0),
  ];

  const materials: Material[] = [
    mat(usina.id, "Lixadeira/esmerilhadeira", "un", "usado", 2, 4, "Castelos Locações", 0),
    mat(usina.id, "Extensão elétrica", "un", "solicitado", 1, 2, "Suprimentos RF", 120),
    mat(usina.id, "Espátula para limpeza", "un", "solicitado", 0, 4, "Suprimentos RF", 18),
    mat(usina.id, "Tinta para pintura", "balde", "pendente", 0, 8, "Matheus", 280),
    mat(usina.id, "Plug/divisor de energia", "un", "solicitado", 0, 2, "Suprimentos RF", 36),
    mat(drywall.id, "Placa de drywall/gesso", "un", "usado", 0, 0, "—", 0),
    mat(drywall.id, "Disco de corte", "un", "usado", 24, 30, "Suprimentos RF", 9),
  ];

  const equipment: Equipment[] = [
    eq(drywall.id, "Plataforma elevatória tipo tesoura JLG", "Elevação", "em_uso", "Alan", "Operacional"),
    eq(usina.id, "Lixadeira pequena (dupla 1)", "Elétrica", "em_uso", "William Costa", "Boa"),
    eq(usina.id, "Lixadeira pequena (dupla 2)", "Elétrica", "em_uso", "Ítalo Ferreira", "Boa"),
    eq(usina.id, "Esmerilhadeira", "Elétrica", "em_uso", "Geidson Souza", "Boa"),
    eq(usina.id, "Caminhão pipa (apoio)", "Apoio", "disponivel", "Lidermac", "Operacional"),
    eq(usina.id, "Guindaste PHD (apoio)", "Apoio", "disponivel", "Lidermac", "Operacional"),
  ];

  const checklists: Checklist[] = [
    checklist(usina.id, "Checklist de Segurança — Trabalho em altura", "segurança", "Leone", [
      ["EPIs e cinto de segurança para toda a equipe", true],
      ["Área de acesso organizada e sinalizada", true],
      ["Cabos e extensões protegidos", false],
      ["Escada/acesso à parte superior seguro", true],
      ["Pontos de energia identificados", false],
    ]),
    checklist(drywall.id, "Checklist Noturno — Desmontagem", "início de obra", "Alan", [
      ["Plataforma JLG inspecionada e travada", true],
      ["Área isolada do fluxo do shopping", true],
      ["Resíduos segregados ao final", true],
      ["Luminárias removidas com segurança", true],
      ["Trecho liberado para a próxima etapa", true],
    ]),
  ];

  const incidents: Incident[] = [
    inc(usina.id, "Jato de água insuficiente", "problema com equipamento", "media",
      "A lavagem com o caminhão pipa foi realizada, porém o jato mostrou-se insuficiente para a limpeza mais profunda da estrutura.",
      "Leone", "em_andamento", "Solicitar jato/lavadora de pressão com mangueira de pelo menos 20m."),
    inc(usina.id, "Ausência de tinta no local", "falta de material", "alta",
      "A tinta não estava disponível no canteiro, o que impossibilitou o início da pintura após o lixamento.",
      "Matheus", "aberta", "Providenciar a tinta para a pintura."),
    inc(usina.id, "Extensão insuficiente na locadora", "falta de material", "media",
      "Ao chegar à Castelos Locações havia apenas uma extensão disponível, exigindo complementação pela própria equipe.",
      "Suprimentos RF", "em_andamento", "Comprar extensão adicional e 2 plugs/divisores."),
    inc(drywall.id, "Trabalho em altura no corredor", "risco de segurança", "media",
      "Desmontagem em altura com plataforma elevatória sobre o corredor principal exige atenção contínua aos EPIs e isolamento da área.",
      "Alan", "resolvida", "Área isolada e plataforma travada antes da operação."),
  ];

  const expenses: Expense[] = [
    exp(usina.id, "Locação de lixadeiras", "locação", 220, "Leone", reports.find((r) => r.projectId === usina.id)!.id),
    exp(usina.id, "Combustível — deslocamento à locadora", "gasolina", 80, "Leone"),
    exp(usina.id, "Almoço da equipe", "alimentação", 95, "Leone"),
    exp(usina.id, "Plugs e extensão", "ferramenta", 156, "Suprimentos RF"),
    exp(drywall.id, "Locação plataforma JLG (diária)", "locação", 680, "Alan"),
    exp(drywall.id, "Discos de corte", "ferramenta", 216, "Alan"),
    exp(drywall.id, "Descarte de resíduos", "transporte", 140, "Alan"),
  ];

  const contacts: Contact[] = [
    ct("Lidermac", "cliente", "81 3000-0000", "contato@lidermac.com.br", "Lidermac"),
    ct("Shopping Park Vitória", "cliente", "27 3000-0000", "obras@parkvitoria.com.br", "Shopping Park Vitória"),
    ct("Castelos Locações", "locadora", "27 3311-7070", "atendimento@casteloslocacoes.com.br", "Castelos Locações"),
    ct("Tech Tintas", "fornecedor", "27 3322-5050", "vendas@techtintas.com.br", "Tech Tintas"),
    ct("Matheus — Suprimentos", "fornecedor", "27 99999-3001", "suprimentos@rfsolucoes.com.br", "RF Soluções"),
    ct("Leone — Responsável de campo", "equipe", "27 99999-2001", "leone@rfsolucoes.com.br", "RF Soluções"),
  ];

  return {
    user, company, projects: [drywall, usina], reports, tasks, team, timeCards,
    materials, equipment, checklists, incidents, expenses, contacts,
  };

  // ---- helpers locais ----
  function tm(name: string, role: string, phone: string, projectId: string): TeamMember {
    return { id: uid("tm"), companyId: COMPANY_ID, name, role, phone, active: true, projectId };
  }
  function task(projectId: string, title: string, assignee: string, priority: Task["priority"], status: Task["status"], dueDate: string): Task {
    return { id: uid("tsk"), companyId: COMPANY_ID, projectId, title, description: "", assignee, priority, dueDate, status, createdAt: new Date().toISOString() };
  }
  function tc(projectId: string, memberName: string, date: string, checkIn: string, checkOut: string, breakMinutes = 60): TimeCard {
    return { id: uid("tc"), companyId: COMPANY_ID, projectId, memberName, date, checkIn, checkOut, breakMinutes, note: "" };
  }
  function mat(projectId: string, name: string, unit: string, status: Material["status"], used: number, req: number, supplier: string, val: number): Material {
    return { id: uid("mt"), companyId: COMPANY_ID, projectId, name, unit, quantityUsed: used, quantityRequested: req, supplier, estimatedValue: val, status };
  }
  function eq(projectId: string, name: string, type: string, status: Equipment["status"], responsible: string, cond: string): Equipment {
    return { id: uid("eq"), companyId: COMPANY_ID, projectId, name, type, responsible, conditionOut: cond, status, pickupDate: "2026-05-20" };
  }
  function checklist(projectId: string, title: string, template: string, responsible: string, list: [string, boolean][]): Checklist {
    return { id: uid("ck"), companyId: COMPANY_ID, projectId, title, template, responsible, date: "2026-06-02", status: list.every((i) => i[1]) ? "concluido" : "aberto", items: list.map(([label, checked]) => ({ id: uid("cki"), label, checked })) };
  }
  function inc(projectId: string, title: string, category: string, severity: Incident["severity"], description: string, responsible: string, status: Incident["status"], solution: string): Incident {
    return { id: uid("inc"), companyId: COMPANY_ID, projectId, title, category, severity, description, responsible, status, proposedSolution: solution, createdAt: new Date().toISOString(), resolvedAt: status === "resolvida" ? new Date().toISOString() : undefined };
  }
  function exp(projectId: string, description: string, category: string, amount: number, responsible: string, rdoId?: string): Expense {
    return { id: uid("exp"), companyId: COMPANY_ID, projectId, rdoId, date: "2026-06-02", category, description, amount, paymentMethod: "PIX", responsible, hasReceipt: true };
  }
  function ct(name: string, type: string, phone: string, email: string, comp: string): Contact {
    return { id: uid("ct"), companyId: COMPANY_ID, name, type, phone, whatsapp: phone, email, company: comp };
  }
}

// ============ USINA — RDO Nº 001 (01/06/2026) ============
function usinaBase(projectId: string, number: number, date: string) {
  return {
    id: uid("rdo"), companyId: COMPANY_ID, projectId, number, date,
    responsible: "Leone", supervisor: "Leone",
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
}

function prov(description: string, responsible: string, priority: Providencia["priority"]): Providencia {
  return { description, responsible, priority };
}

function usinaRdo001(p: Project): DailyReport {
  return {
    ...usinaBase(p.id, 1, "2026-06-01"),
    arrival: "07:30", departure: "17:00",
    weather: "Ensolarado", siteCondition: "Pátio da Lidermac, Muribeca",
    team: [
      { name: "Leone", role: "Responsável de campo", present: true },
      { name: "William Costa", role: "Lixador", present: true },
      { name: "Geidson Souza", role: "Ajudante", present: true },
    ],
    activities: acts([
      { d: "Lavagem da estrutura com água do caminhão pipa para remoção de sujeira superficial." },
      { d: "Início do lixamento — remoção de tinta e oxidação com esmerilhadeira." },
      { d: "Tratamento da estrutura metálica e acesso à parte superior com escada." },
      { d: "Inspeção da calha/esteira da usina e organização do canteiro." },
    ]),
    materials: items(["Esmerilhadeira", "Lixadeira"]),
    materialsRequested: items(["Tinta para pintura", "Espátula para limpeza"]),
    equipment: items(["Caminhão pipa", "Guindaste PHD (apoio)"]),
    equipmentRequested: items(["Jato / lavadora de pressão"]),
    occurrences: [
      "Jato de água insuficiente: a lavagem com o caminhão pipa foi realizada, porém o jato mostrou-se insuficiente para a limpeza mais profunda da estrutura.",
      "Ausência de tinta no local: a tinta não estava disponível no canteiro, o que impossibilitou o início da pintura após o lixamento.",
      "Esteira: recomenda-se a retirada e posterior recolocação da esteira pela equipe da Lidermac, a fim de permitir limpeza mais profunda.",
    ],
    risks: ["Trabalho em altura — uso obrigatório de EPIs e acesso seguro"],
    impediments: ["Pintura não iniciada por ausência de tinta no local"],
    clientRequests: ["Retirada e recolocação da esteira pela equipe Lidermac"],
    providencias: [
      prov("1 lixadeira adicional (1 por dupla — 4 colaboradores amanhã)", "Suprimentos RF", "Alta"),
      prov("1 extensão elétrica adicional", "Suprimentos RF", "Média"),
      prov("Espátula(s) para limpeza", "Suprimentos RF", "Média"),
      prov("Jato / lavadora de pressão (limpeza profunda)", "Suprimentos RF", "Alta"),
      prov("Retirada e recolocação da esteira para limpeza profunda", "Equipe Lidermac", "Média"),
      prov("Providenciar tinta para a pintura", "Matheus", "Alta"),
    ],
    pending: ["Continuidade do lixamento", "Limpeza profunda da estrutura", "Início da pintura após disponibilização da tinta"],
    nextDayPlan: [
      "Comparecimento previsto de 4 colaboradores (incluindo Ítalo e, se possível, Hopkins).",
      "Disponibilizar as ferramentas solicitadas — 1 lixadeira por dupla, extensão, espátulas e jato de pressão.",
      "Continuidade do lixamento e da limpeza profunda da estrutura.",
      "Iniciar a pintura assim que a tinta for disponibilizada por Matheus.",
    ],
    executiveSummary:
      "Primeiro dia de revitalização da usina de piche. Realizada a lavagem da estrutura com caminhão pipa e iniciado o lixamento/remoção de oxidação com esmerilhadeira. O jato de água mostrou-se insuficiente para limpeza profunda e a tinta não estava disponível no local, impossibilitando o início da pintura.",
    notes: "Trabalho realizado em altura e em áreas internas, com atenção contínua aos EPIs e à organização do canteiro.",
    media: photos([
      { phase: "antes", caption: "Vista geral (aérea) — estrutura da usina de piche no pátio da Lidermac, Muribeca." },
      { phase: "durante", caption: "Lavagem — limpeza da estrutura com água do caminhão pipa." },
      { phase: "durante", caption: "Lavagem (detalhe) — jato insuficiente para limpeza mais profunda." },
      { phase: "durante", caption: "Início do lixamento — remoção de tinta/oxidação com esmerilhadeira." },
      { phase: "durante", caption: "Lixamento — tratamento da estrutura metálica." },
      { phase: "durante", caption: "Estrutura — acesso à parte superior com escada." },
      { phase: "durante", caption: "Vista superior — inspeção da calha/esteira da usina." },
      { phase: "durante", caption: "Apoio — guindaste (PHD) e equipe no pátio de manutenção." },
    ]),
    expenses: [],
    signatures: [],
    status: "aprovado",
    createMode: "voz",
  };
}

function usinaRdo002(p: Project): DailyReport {
  return {
    ...usinaBase(p.id, 2, "2026-06-02"),
    arrival: "09:30", departure: "17:00",
    weather: "Parcialmente nublado", siteCondition: "Pátio da Lidermac, Muribeca",
    team: [
      { name: "Leone", role: "Responsável de campo", present: true },
      { name: "Ítalo Ferreira", role: "Lixador", present: true },
      { name: "William Costa", role: "Lixador", present: true },
      { name: "Geidson Souza", role: "Ajudante", present: true },
    ],
    activities: acts([
      { d: "Deslocamento para troca de ferramenta — antes do serviço, a equipe foi até a Castelos Locações para trocar a lixadeira grande por duas lixadeiras pequenas, buscando maior produtividade na obra." },
      { d: "Retirada das ferramentas — foram retiradas duas lixadeiras pequenas e uma extensão; como havia apenas uma extensão, a equipe ficou de levar sua própria extensão." },
      { d: "A equipe chegou à obra por volta de 9h30, iniciando o lixamento e o tratamento da estrutura." },
      { d: "Deslocamento até a Tech Tintas para buscar as tintas fornecidas pelo contratante e levá-las ao local da execução." },
      { d: "Continuidade do lixamento — execução em pontos superiores, laterais, internos e inferiores da estrutura, com atuação simultânea da equipe em diferentes frentes." },
    ]),
    materials: items(["Lixadeiras pequenas (2)", "Tintas (fornecidas pelo contratante)"]),
    materialsRequested: items(["Plugs/divisores de energia (2)", "Extensão adicional"]),
    equipment: items(["Lixadeira pequena (dupla 1)", "Lixadeira pequena (dupla 2)"]),
    equipmentRequested: items(["Jato / lavadora com mangueira de 20m"]),
    occurrences: [
      "Extensão insuficiente na locadora: ao chegar à Castelos Locações, havia apenas uma extensão disponível, exigindo complementação pela própria equipe.",
      "Necessidade de divisão do ponto de energia: será necessário comprar dois plugs/divisores para permitir o uso simultâneo das lixadeiras.",
      "Lavagem da estrutura: a equipe solicitou jato/lavadora com mangueira de pelo menos 20 m para lavagem efetiva da usina de asfalto.",
      "Trabalho em altura e em área interna: as fotos evidenciam execução em pontos elevados e áreas internas da estrutura, exigindo atenção contínua aos EPIs, acesso seguro, cabos e organização do canteiro.",
    ],
    risks: ["Trabalho em altura e em área interna — atenção a EPIs, acesso seguro e cabos"],
    impediments: ["Uso simultâneo das lixadeiras limitado pela falta de plugs/divisores"],
    clientRequests: ["Jato/lavadora com mangueira de pelo menos 20m para lavagem efetiva"],
    providencias: [
      prov("Disponibilizar jato/lavadora com mangueira de pelo menos 20 m para lavagem efetiva.", "Suprimentos RF / Lidermac", "Alta"),
      prov("Comprar 2 plugs/divisores para alimentar as lixadeiras de forma simultânea.", "Suprimentos RF", "Alta"),
      prov("Confirmar extensão elétrica adequada para uso simultâneo das duas lixadeiras.", "Suprimentos RF", "Média"),
      prov("Organizar cabos, área de acesso e pontos de apoio durante o lixamento.", "Equipe RF", "Média"),
      prov("Dar continuidade ao lixamento e preparar as áreas para pintura conforme liberação técnica.", "Equipe RF", "Alta"),
    ],
    pending: ["Lixamento das áreas pendentes da estrutura metálica", "Lavagem efetiva da estrutura", "Início da pintura nas áreas liberadas"],
    nextDayPlan: [
      "Manter efetivo operacional com 4 colaboradores, se possível, para dar continuidade às frentes simultâneas.",
      "Concluir o lixamento e o tratamento das áreas pendentes da estrutura metálica.",
      "Realizar lavagem efetiva da estrutura com jato/lavadora de pressão e mangueira longa, caso disponibilizado.",
      "Organizar pontos de energia, plugs e extensões para uso seguro das lixadeiras.",
      "Avaliar início da pintura nas áreas liberadas e devidamente preparadas.",
    ],
    executiveSummary:
      "Segundo dia de obra com a equipe atuando simultaneamente em diferentes frentes (pontos superiores, laterais, internos e inferiores). Houve troca de ferramentas na locadora, busca das tintas na Tech Tintas e continuidade do lixamento e tratamento da estrutura metálica.",
    notes: "Necessária a divisão do ponto de energia (2 plugs) e jato com mangueira de 20m para a próxima lavagem.",
    media: photos([
      { phase: "durante", caption: "Vista geral — estrutura da usina de piche com equipe em execução do lixamento no segundo dia de obra." },
      { phase: "durante", caption: "Vista lateral — estrutura metálica da usina e área de execução." },
      { phase: "durante", caption: "Lixamento superior — uso de lixadeira na parte alta da estrutura." },
      { phase: "durante", caption: "Lixamento interno — tratamento de chapa e pontos de oxidação." },
      { phase: "durante", caption: "Execução simultânea — equipe atuando em frentes distintas." },
      { phase: "durante", caption: "Vista geral — avanço do lixamento e organização da frente de trabalho." },
      { phase: "durante", caption: "Tratamento da estrutura — atuação em parte inferior e superior." },
      { phase: "durante", caption: "Área de execução — equipe, ferramentas e estrutura em operação." },
      { phase: "durante", caption: "Vista superior — inspeção da calha/esteira e pontos de lixamento." },
    ]),
    expenses: [],
    signatures: [],
    status: "enviado",
    createMode: "voz",
  };
}

// ============ DRYWALL — 17 RDOs (12/05 a 28/05/2026) ============
interface DrywallDay {
  trecho: string;
  atividades: string[];
  resultado: string;
  ocorrencias?: string[];
  proximo?: string[];
}

function buildDrywallReports(p: Project): DailyReport[] {
  const days: DrywallDay[] = [
    { trecho: "Mobilização e isolamento", atividades: ["Mobilização da equipe e montagem do canteiro noturno.", "Isolamento e sinalização da área de trabalho no corredor principal.", "Inspeção e posicionamento da plataforma elevatória tipo tesoura JLG."], resultado: "Área isolada e canteiro montado; plataforma liberada para uso." },
    { trecho: "Mapeamento estrutural", atividades: ["Mapeamento dos elementos a desmontar entre as treliças.", "Marcação dos pontos de corte e remoção.", "Conferência dos pontos de energia e iluminação provisória."], resultado: "Plano de desmontagem definido e pontos de corte marcados." },
    { trecho: "1ª treliça — forro", atividades: ["Remoção do forro de gesso/drywall na 1ª treliça.", "Retirada e segregação dos resíduos gerados.", "Remoção de luminárias da área de intervenção."], resultado: "Forro da 1ª treliça removido e resíduos segregados." },
    { trecho: "1ª treliça — perfis", atividades: ["Corte e remoção de perfis metálicos remanescentes.", "Desmontagem dos elementos de fechamento laterais.", "Organização e descida de material."], resultado: "Perfis e fechamentos da 1ª treliça desmontados." },
    { trecho: "Entre 1ª e 2ª treliça", atividades: ["Remoção do policarbonato entre a 1ª e a 2ª treliça.", "Desmontagem em altura com plataforma JLG.", "Retirada de elementos remanescentes do sistema antigo."], resultado: "Trecho entre 1ª e 2ª treliça liberado." },
    { trecho: "2ª treliça — forro", atividades: ["Remoção integral do forro de gesso/drywall na 2ª treliça.", "Remoção das luminárias existentes.", "Segregação dos resíduos."], resultado: "Forro da 2ª treliça removido em ambos os lados." },
    { trecho: "2ª treliça — perfis", atividades: ["Cortes estruturais e remoção de perfis metálicos.", "Retirada de elementos de fechamento dos dois lados.", "Limpeza da área."], resultado: "Perfis da 2ª treliça desmontados; área limpa." },
    { trecho: "Apoio e logística", atividades: ["Recebimento e conferência de materiais de apoio.", "Manutenção preventiva da plataforma JLG.", "Reorganização do isolamento da área."], resultado: "Logística e equipamentos prontos para a próxima etapa.", ocorrencias: ["Necessário reforço de iluminação provisória no trecho central."] },
    { trecho: "Entre 2ª e 3ª treliça", atividades: ["Retirada integral do policarbonato entre a 2ª e a 3ª treliça.", "Remoção de perfis metálicos vermelhos do caranguejo.", "Desmontagem em altura com plataforma elevatória."], resultado: "Policarbonato e perfis do trecho removidos." },
    { trecho: "3ª treliça — forro", atividades: ["Remoção do forro de gesso/drywall na 3ª treliça.", "Remoção de luminárias.", "Segregação e descida de resíduos."], resultado: "Forro da 3ª treliça removido." },
    { trecho: "3ª treliça — perfis", atividades: ["Cortes e remoção de perfis metálicos da 3ª treliça.", "Desmontagem dos fechamentos laterais.", "Limpeza e organização."], resultado: "Perfis da 3ª treliça desmontados." },
    { trecho: "Inspeção parcial", atividades: ["Inspeção do trecho desmontado com a fiscalização.", "Ajustes pontuais e remoção de remanescentes.", "Registro fotográfico do avanço."], resultado: "Trecho aprovado pela fiscalização para sequência." },
    { trecho: "Reforço e segurança", atividades: ["Verificação de travamentos e EPIs.", "Reforço do isolamento e sinalização.", "Continuidade da remoção de fechamentos."], resultado: "Condições de segurança reforçadas; avanço mantido." },
    { trecho: "Limpeza geral", atividades: ["Limpeza geral do trecho intervindo.", "Retirada e destinação de resíduos acumulados.", "Organização de materiais reaproveitáveis."], resultado: "Trecho limpo e resíduos destinados." },
    { trecho: "Preparação 3ª–4ª treliça", atividades: ["Marcação dos cortes entre a 3ª e a 4ª (última) treliça.", "Posicionamento da plataforma e iluminação.", "Início da desmontagem dos fechamentos."], resultado: "Trecho 3ª–4ª preparado para desmontagem do forro." },
    { trecho: "Desmontagem Estrutural do Mall",
      atividades: ["Remoção de perfis metálicos vermelhos do caranguejo.", "Retirada integral do policarbonato entre a 2ª e a 3ª treliça.", "Cortes estruturais e desmontagem em altura com plataforma elevatória tipo tesoura.", "Retirada de elementos remanescentes do sistema antigo e limpeza da área."],
      resultado: "Durante o período executado foram realizados cortes estruturais, desmontagem em altura, remoção de perfis metálicos, retirada de elementos remanescentes do sistema antigo e limpeza da área. Ao final dos trabalhos o trecho compreendido entre a 2ª e a 3ª treliça encontrava-se totalmente desmontado e liberado para continuidade da obra." },
    { trecho: "Corredor Principal do Shopping",
      atividades: ["Mobilização da equipe e posicionamento da plataforma elevatória tipo tesoura JLG.", "Remoção integral do forro de gesso/drywall compreendido entre a 3ª e a 4ª (última) treliça da estrutura central.", "Continuidade da desmontagem dos elementos de fechamento existentes nos dois lados do corredor principal.", "Retirada e segregação dos resíduos gerados pela desmontagem.", "Remoção das luminárias existentes na área de intervenção, em apoio à operação do shopping."],
      resultado: "Ao término da jornada foi concluída a retirada de todo o gesso/drywall compreendido entre a 3ª e a última treliça em ambos os lados da estrutura. Também foram removidas as luminárias existentes na área afetada, liberando o trecho para continuidade das próximas etapas de desmontagem e adequação estrutural." },
  ];

  return days.map((d, i) => {
    const number = i + 1;
    const date = addDays("2026-05-12", i);
    const phaseSeq: MediaItem["phase"][] = i === 0 ? ["antes", "durante"] : ["durante", "durante", "depois"];
    return {
      id: uid("rdo"), companyId: COMPANY_ID, projectId: p.id, number, date,
      responsible: "Alan", supervisor: "Alan",
      arrival: "23:00", departure: "03:00",
      weather: "Indiferente (obra interna / noturna)", siteCondition: d.trecho,
      team: [
        { name: "Alan", role: "Encarregado", present: true },
        { name: "Equipe de desmontagem", role: "Montadores", present: true },
      ],
      activities: acts(d.atividades.map((x) => ({ d: x }))),
      materials: items(["Discos de corte"]),
      materialsRequested: [],
      equipment: items(["Plataforma elevatória tipo tesoura JLG"]),
      equipmentRequested: [],
      occurrences: d.ocorrencias || [],
      risks: ["Trabalho em altura sobre o corredor — isolamento e EPIs obrigatórios"],
      impediments: [],
      clientRequests: [],
      pending: number >= 17 ? ["Continuidade da desmontagem e adequação estrutural nos próximos trechos"] : ["Continuidade da desmontagem no próximo trecho"],
      nextDayPlan: d.proximo || ["Dar sequência à desmontagem do próximo trecho em horário noturno."],
      executiveSummary: d.resultado,
      notes: `Execução em horário noturno (23h às 03h) para não interferir na operação do shopping. Trecho: ${d.trecho}.`,
      media: photos(
        phaseSeq.map((phase, k) => ({ phase, caption: `${d.trecho} — registro ${k + 1} (desmontagem noturna)` })),
      ),
      expenses: [],
      signatures: [],
      status: number >= 17 ? "pronto_revisao" : "aprovado",
      createMode: number % 3 === 0 ? "perguntas" : number % 2 === 0 ? "texto" : "voz",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as DailyReport;
  });
}

function addDays(iso: string, n: number): string {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
