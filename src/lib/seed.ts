import type {
  Checklist, Company, Contact, DailyReport, Equipment, Expense, Incident,
  Material, Project, Task, TeamMember, TimeCard, User, MediaItem,
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

function photos(captions: { phase: MediaItem["phase"]; caption: string }[]): MediaItem[] {
  return captions.map((c, i) => ({
    id: uid("med"),
    kind: "photo" as const,
    phase: c.phase,
    caption: c.caption,
    color: colorFromString(c.caption + i),
    author: "Lucas Vital",
    createdAt: new Date().toISOString(),
    includeInPdf: true,
  }));
}

function video(caption: string): MediaItem {
  return {
    id: uid("med"),
    kind: "video",
    phase: "durante",
    caption,
    color: colorFromString(caption),
    author: "Lucas Vital",
    createdAt: new Date().toISOString(),
    includeInPdf: true,
  };
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
    name: overrides?.companyName || "AKS Enterprise Obras e Serviços",
    logoText: "AKS",
    brandColor: "#f4720b",
    plan: "profissional",
    city: "Vitória - ES",
    createdAt: new Date().toISOString(),
  };

  const p1: Project = {
    id: "prj_shopping",
    companyId: COMPANY_ID,
    name: "Shopping Vitória — Pintura e manutenção da usina de asfalto",
    client: "Shopping Vitória",
    address: "Av. Américo Buaiz, 200 — Enseada do Suá, Vitória - ES",
    technicalLead: "Eng. Marcos Andrade",
    supervisor: "Lucas Vital",
    startDate: addDays(-12),
    expectedEndDate: addDays(6),
    status: "em_andamento",
    budget: 84000,
    description:
      "Pintura industrial, preparação de superfície e manutenção da usina de asfalto, com limpeza técnica e organização das áreas de circulação.",
    coverColor: "#f4720b",
    createdAt: new Date().toISOString(),
  };

  const p2: Project = {
    id: "prj_solar",
    companyId: COMPANY_ID,
    name: "Residencial Mata da Praia — Instalação de energia solar",
    client: "Condomínio Mata da Praia",
    address: "R. Aleixo Netto, 1500 — Mata da Praia, Vitória - ES",
    technicalLead: "Eng. Patrícia Lima",
    supervisor: "Geidson Souza",
    startDate: addDays(-4),
    expectedEndDate: addDays(15),
    status: "aguardando_material",
    budget: 120000,
    description:
      "Instalação de sistema fotovoltaico de 45 kWp, incluindo estrutura, inversores e comissionamento.",
    coverColor: "#2563eb",
    createdAt: new Date().toISOString(),
  };

  const p3: Project = {
    id: "prj_drywall",
    companyId: COMPANY_ID,
    name: "Clínica OdontoCenter — Reforma e drywall",
    client: "OdontoCenter Ltda.",
    address: "R. Chapot Presvot, 80 — Praia do Canto, Vitória - ES",
    technicalLead: "Arq. Renata Dias",
    supervisor: "Ítalo Ferreira",
    startDate: addDays(-30),
    expectedEndDate: addDays(-2),
    realEndDate: addDays(-1),
    status: "concluida",
    budget: 56000,
    description:
      "Reforma completa com divisórias em drywall, forro, elétrica e pintura para 6 consultórios.",
    coverColor: "#16a34a",
    createdAt: new Date().toISOString(),
  };

  const team: TeamMember[] = [
    tm("Lucas Vital", "Supervisor", "27 99999-0001", p1.id),
    tm("William Costa", "Pintor", "27 99999-0002", p1.id),
    tm("Ítalo Ferreira", "Encarregado", "27 99999-0003", p3.id),
    tm("Geidson Souza", "Eletricista", "27 99999-0004", p2.id),
    tm("Hopkins Almeida", "Ajudante", "27 99999-0005", p1.id),
    tm("Rafael Nunes", "Servente", "27 99999-0006", p1.id),
  ];

  const reports: DailyReport[] = [
    rdoShopping1(p1),
    rdoShopping2(p1),
    rdoShopping3(p1),
    rdoSolar1(p2),
    rdoDrywall1(p3),
  ];

  const tasks: Task[] = [
    task(p1, "Comprar duas extensões de 20m", "William", "alta", "a_fazer", 1),
    task(p1, "Solicitar jato com mangueira de 20m", "Lucas Vital", "urgente", "em_andamento", 0),
    task(p1, "Concluir lixamento da ala leste", "Hopkins Almeida", "media", "em_andamento", 2),
    task(p1, "Aplicar primer na usina de asfalto", "William", "alta", "a_fazer", 3),
    task(p1, "Limpeza técnica final do setor A", "Rafael Nunes", "baixa", "a_fazer", 5),
    task(p2, "Receber inversores do fornecedor", "Geidson Souza", "alta", "aguardando_material", 2),
    task(p2, "Montar estrutura de fixação dos módulos", "Geidson Souza", "media", "a_fazer", 4),
    task(p3, "Vistoria final com cliente", "Ítalo Ferreira", "alta", "concluido", -2),
    task(p3, "Pintura de acabamento dos consultórios", "Ítalo Ferreira", "media", "concluido", -3),
    task(p1, "Aprovar RDO do dia com engenheiro", "Lucas Vital", "media", "aguardando_aprovacao", 0),
  ];

  const timeCards: TimeCard[] = team
    .filter((t) => t.projectId === p1.id)
    .map((t) => ({
      id: uid("tc"),
      companyId: COMPANY_ID,
      projectId: p1.id,
      memberName: t.name,
      date: today(),
      checkIn: "07:30",
      checkOut: "17:00",
      breakMinutes: 60,
      note: "",
    }));

  const materials: Material[] = [
    mat(p1, "Tinta acrílica industrial", "balde 18L", "comprado", 6, 6, "Tech Tintas", 280),
    mat(p1, "Lixa grão 80", "unidade", "usado", 40, 50, "Castelo Locações", 4),
    mat(p1, "Selador acrílico", "galão 3,6L", "comprado", 4, 4, "Tech Tintas", 95),
    mat(p1, "Extensão elétrica 20m", "unidade", "solicitado", 0, 2, "—", 120),
    mat(p2, "Módulo fotovoltaico 550W", "unidade", "solicitado", 0, 82, "SolarMax", 780),
    mat(p3, "Placa de drywall", "unidade", "usado", 120, 120, "Casa do Construtor", 48),
  ];

  const equipment: Equipment[] = [
    eq(p1, "Lixadeira pequena", "Elétrica", "em_uso", "William Costa", "Boa"),
    eq(p1, "Lixadeira pequena (2)", "Elétrica", "em_uso", "Hopkins Almeida", "Boa"),
    eq(p1, "Jato de água alta pressão", "Hidráulica", "manutencao", "Lucas Vital", "Aguardando mangueira"),
    eq(p1, "Compressor de ar", "Pneumática", "disponivel", "—", "Boa"),
    eq(p2, "Furadeira de impacto", "Elétrica", "disponivel", "Geidson Souza", "Boa"),
  ];

  const checklists: Checklist[] = [
    checklist(p1, "Checklist de Segurança — Pintura", "segurança", "Lucas Vital", [
      ["EPIs disponíveis para toda a equipe", true],
      ["Área isolada e sinalizada", true],
      ["Extintor de incêndio próximo", false],
      ["Ventilação adequada para pintura", true],
      ["Andaimes travados e nivelados", true],
    ]),
    checklist(p1, "Início de Obra — Setor A", "início de obra", "Lucas Vital", [
      ["Materiais conferidos", true],
      ["Equipamentos testados", true],
      ["Equipe instruída", true],
      ["Ponto de energia liberado", false],
    ]),
    checklist(p3, "Checklist de Entrega — OdontoCenter", "entrega", "Ítalo Ferreira", [
      ["Acabamento revisado", true],
      ["Limpeza final concluída", true],
      ["Elétrica testada", true],
      ["Cliente vistoriou", true],
      ["Termo de entrega assinado", true],
    ]),
  ];

  const incidents: Incident[] = [
    inc(p1, "Falta de extensão elétrica na loja", "falta de material", "media",
      "Ao chegar na Castelo Locações havia apenas uma extensão disponível. William ficou de providenciar a segunda.",
      "William Costa", "em_andamento", "Comprar duas extensões de 20m até amanhã."),
    inc(p1, "Solicitação de jato com mangueira de 20m", "solicitação do contratante", "baixa",
      "Necessário jato com mangueira de pelo menos 20 metros e dois plugs para dividir o ponto de energia entre as lixadeiras.",
      "Lucas Vital", "aberta", "Locar mangueira de 20m e adquirir 2 plugs."),
    inc(p1, "Atraso por troca de equipamento", "atraso", "baixa",
      "Equipe precisou se deslocar até a locadora para trocar a lixadeira grande por duas pequenas, atrasando o início.",
      "Lucas Vital", "resolvida", "Deslocamento concluído, serviço iniciado."),
    inc(p2, "Atraso na entrega dos módulos", "falta de material", "alta",
      "Fornecedor informou atraso de 5 dias na entrega dos módulos fotovoltaicos.",
      "Geidson Souza", "aberta", "Acionar fornecedor alternativo SolarMax."),
    inc(p1, "Chuva no fim da tarde", "chuva", "baixa",
      "Chuva leve no fim da tarde interrompeu a pintura externa por 40 minutos.",
      "Lucas Vital", "resolvida", "Atividade retomada após estiagem."),
  ];

  const expenses: Expense[] = [
    exp(p1, "Gasolina — deslocamento à locadora", "gasolina", 80, "Lucas Vital", reports[0].id),
    exp(p1, "Almoço da equipe", "alimentação", 95, "Lucas Vital", reports[0].id),
    exp(p1, "Lanche da tarde", "alimentação", 38, "Hopkins Almeida", reports[1].id),
    exp(p1, "Locação de lixadeiras", "locação", 220, "Lucas Vital", reports[0].id),
    exp(p1, "Tintas industriais", "material", 1680, "Lucas Vital", reports[1].id),
    exp(p1, "Pedágio", "pedágio", 12, "William Costa", reports[2].id),
    exp(p1, "Plugs elétricos", "ferramenta", 36, "William Costa", reports[2].id),
    exp(p2, "Diária de instalador", "diária", 280, "Geidson Souza"),
    exp(p3, "Material de acabamento", "material", 540, "Ítalo Ferreira"),
    exp(p1, "Estacionamento", "estacionamento", 25, "Lucas Vital", reports[1].id),
  ];

  const contacts: Contact[] = [
    ct("Shopping Vitória", "cliente", "27 3344-0000", "contato@shoppingvitoria.com.br", "Shopping Vitória"),
    ct("Eng. Marcos Andrade", "engenheiro", "27 98888-1010", "marcos@aksenterprise.com.br", "AKS Enterprise"),
    ct("Tech Tintas", "fornecedor", "27 3322-5050", "vendas@techtintas.com.br", "Tech Tintas"),
    ct("Castelo Locações", "locadora", "27 3311-7070", "atendimento@castelolocacoes.com.br", "Castelo Locações"),
    ct("SolarMax Distribuidora", "fornecedor", "27 3300-9090", "comercial@solarmax.com.br", "SolarMax"),
    ct("Defesa Civil", "contatos de emergência", "199", "", "Prefeitura de Vitória"),
  ];

  return { user, company, projects: [p1, p2, p3], reports, tasks, team, timeCards, materials, equipment, checklists, incidents, expenses, contacts };

  // ---- helpers locais ----
  function tm(name: string, role: string, phone: string, projectId: string): TeamMember {
    return { id: uid("tm"), companyId: COMPANY_ID, name, role, phone, active: true, projectId };
  }
  function task(p: Project, title: string, assignee: string, priority: Task["priority"], status: Task["status"], dueOffset: number): Task {
    return { id: uid("tsk"), companyId: COMPANY_ID, projectId: p.id, title, description: "", assignee, priority, dueDate: addDays(dueOffset), status, createdAt: new Date().toISOString() };
  }
  function mat(p: Project, name: string, unit: string, status: Material["status"], used: number, req: number, supplier: string, val: number): Material {
    return { id: uid("mt"), companyId: COMPANY_ID, projectId: p.id, name, unit, quantityUsed: used, quantityRequested: req, supplier, estimatedValue: val, status };
  }
  function eq(p: Project, name: string, type: string, status: Equipment["status"], responsible: string, cond: string): Equipment {
    return { id: uid("eq"), companyId: COMPANY_ID, projectId: p.id, name, type, responsible, conditionOut: cond, status, pickupDate: addDays(-3) };
  }
  function checklist(p: Project, title: string, template: string, responsible: string, items: [string, boolean][]): Checklist {
    return { id: uid("ck"), companyId: COMPANY_ID, projectId: p.id, title, template, responsible, date: today(), status: items.every((i) => i[1]) ? "concluido" : "aberto", items: items.map(([label, checked]) => ({ id: uid("cki"), label, checked })) };
  }
  function inc(p: Project, title: string, category: string, severity: Incident["severity"], description: string, responsible: string, status: Incident["status"], solution: string): Incident {
    return { id: uid("inc"), companyId: COMPANY_ID, projectId: p.id, title, category, severity, description, responsible, status, proposedSolution: solution, createdAt: new Date().toISOString(), resolvedAt: status === "resolvida" ? new Date().toISOString() : undefined };
  }
  function exp(p: Project, description: string, category: string, amount: number, responsible: string, rdoId?: string): Expense {
    return { id: uid("exp"), companyId: COMPANY_ID, projectId: p.id, rdoId, date: today(), category, description, amount, paymentMethod: "PIX", responsible, hasReceipt: true };
  }
  function ct(name: string, type: string, phone: string, email: string, company: string): Contact {
    return { id: uid("ct"), companyId: COMPANY_ID, name, type, phone, whatsapp: phone, email, company };
  }
}

// ---- RDOs detalhados ----
function baseRdo(p: Project, number: number, dayOffset: number): Pick<DailyReport, "id" | "companyId" | "projectId" | "number" | "date" | "responsible" | "supervisor" | "createdAt" | "updatedAt"> {
  const d = addDays(dayOffset);
  return {
    id: uid("rdo"),
    companyId: COMPANY_ID,
    projectId: p.id,
    number,
    date: d,
    responsible: p.supervisor,
    supervisor: p.supervisor,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function rdoShopping1(p: Project): DailyReport {
  return {
    ...baseRdo(p, 1, -3),
    arrival: "09:30",
    departure: "17:00",
    weather: "Ensolarado",
    siteCondition: "Área liberada para trabalho",
    team: [
      { name: "Lucas Vital", role: "Supervisor", present: true },
      { name: "William Costa", role: "Pintor", present: true },
      { name: "Ítalo Ferreira", role: "Encarregado", present: true },
      { name: "Geidson Souza", role: "Eletricista", present: true },
      { name: "Hopkins Almeida", role: "Ajudante", present: true },
    ],
    activities: [
      { id: uid("act"), description: "Deslocamento à Castelo Locações para troca da lixadeira grande por duas lixadeiras pequenas", status: "concluida" },
      { id: uid("act"), description: "Início do lixamento e preparação da superfície", status: "parcial", note: "Continua amanhã" },
      { id: uid("act"), description: "Busca das tintas na Tech Tintas fornecidas pelo contratante", status: "concluida" },
    ],
    materials: [{ id: uid("it"), name: "Lixa grão 80", quantity: "20 un" }, { id: uid("it"), name: "Tinta acrílica industrial", quantity: "6 baldes" }],
    materialsRequested: [{ id: uid("it"), name: "Extensão elétrica 20m", quantity: "2 un" }],
    equipment: [{ id: uid("it"), name: "Lixadeira pequena", quantity: "2 un" }],
    equipmentRequested: [{ id: uid("it"), name: "Jato com mangueira de 20m", quantity: "1 un" }],
    occurrences: [
      "Ao chegar na loja só havia uma extensão; William ficou de trazer outra.",
      "Foi solicitado um jato com mangueira de pelo menos 20 metros e dois plugs para dividir o ponto de energia entre as lixadeiras.",
    ],
    risks: [],
    impediments: ["Falta de extensão elétrica para a segunda lixadeira"],
    clientRequests: ["Jato com mangueira de 20m e dois plugs"],
    pending: ["Concluir lixamento e preparação da superfície", "Trazer segunda extensão de 20m"],
    nextDayPlan: ["Finalizar preparação da superfície", "Iniciar aplicação de selador"],
    executiveSummary:
      "Equipe iniciou a preparação da superfície na usina de asfalto. Foi necessário trocar equipamentos na locadora e buscar as tintas. Pendências de extensão e jato com mangueira foram registradas.",
    notes: "Contratante acompanhou parte dos serviços no período da manhã.",
    media: photos([
      { phase: "antes", caption: "Superfície antes do lixamento" },
      { phase: "durante", caption: "Equipe lixando a superfície" },
      { phase: "durante", caption: "Tintas recebidas na Tech Tintas" },
    ]).concat(video("Lixamento da ala leste em andamento")),
    expenses: [],
    signatures: [],
    status: "assinado",
    createMode: "voz",
    rawInput:
      "Hoje a equipe chegou por volta das 9h30. Estavam presentes William, Ítalo, Geidson, Hopkins e Lucas como supervisor. Antes de iniciar o serviço, a equipe foi até a Castelo Locações para trocar a lixadeira grande por duas lixadeiras pequenas. Ao chegar na loja só havia uma extensão, então William ficou de trazer outra. Na obra foi iniciado o lixamento e preparação da superfície. Também fui até a Tech Tintas buscar as tintas fornecidas pelo contratante. Foi solicitado um jato com mangueira de pelo menos 20 metros e dois plugs para dividir o ponto de energia entre as lixadeiras.",
  };
}

function rdoShopping2(p: Project): DailyReport {
  return {
    ...baseRdo(p, 2, -2),
    arrival: "07:30",
    departure: "17:00",
    weather: "Parcialmente nublado",
    siteCondition: "Área liberada",
    team: [
      { name: "Lucas Vital", role: "Supervisor", present: true },
      { name: "William Costa", role: "Pintor", present: true },
      { name: "Hopkins Almeida", role: "Ajudante", present: true },
      { name: "Rafael Nunes", role: "Servente", present: true },
    ],
    activities: [
      { id: uid("act"), description: "Conclusão do lixamento da superfície", status: "concluida" },
      { id: uid("act"), description: "Aplicação de selador acrílico", status: "concluida" },
      { id: uid("act"), description: "Organização e limpeza técnica da área", status: "concluida" },
    ],
    materials: [{ id: uid("it"), name: "Selador acrílico", quantity: "4 galões" }],
    materialsRequested: [],
    equipment: [{ id: uid("it"), name: "Lixadeira pequena", quantity: "2 un" }, { id: uid("it"), name: "Compressor de ar" }],
    equipmentRequested: [],
    occurrences: ["Chuva leve no fim da tarde interrompeu a pintura externa por 40 minutos."],
    risks: [],
    impediments: [],
    clientRequests: [],
    pending: ["Iniciar pintura de acabamento da usina"],
    nextDayPlan: ["Aplicar primeira demão de tinta industrial"],
    executiveSummary: "Lixamento concluído e selador aplicado em toda a superfície. Limpeza técnica realizada. Chuva leve interrompeu brevemente os trabalhos externos.",
    notes: "",
    media: photos([
      { phase: "durante", caption: "Aplicação do selador" },
      { phase: "depois", caption: "Superfície selada e limpa" },
    ]),
    expenses: [],
    signatures: [],
    status: "aprovado",
    createMode: "texto",
  };
}

function rdoShopping3(p: Project): DailyReport {
  return {
    ...baseRdo(p, 3, -1),
    arrival: "07:30",
    departure: "16:30",
    weather: "Ensolarado",
    siteCondition: "Área liberada",
    team: [
      { name: "Lucas Vital", role: "Supervisor", present: true },
      { name: "William Costa", role: "Pintor", present: true },
      { name: "Hopkins Almeida", role: "Ajudante", present: true },
    ],
    activities: [
      { id: uid("act"), description: "Aplicação da primeira demão de tinta industrial", status: "concluida" },
      { id: uid("act"), description: "Instalação dos plugs para divisão do ponto de energia", status: "concluida" },
    ],
    materials: [{ id: uid("it"), name: "Tinta acrílica industrial", quantity: "3 baldes" }],
    materialsRequested: [],
    equipment: [{ id: uid("it"), name: "Rolo e pincéis" }],
    equipmentRequested: [],
    occurrences: [],
    risks: [],
    impediments: [],
    clientRequests: [],
    pending: ["Aplicar segunda demão", "Revisão final de acabamento"],
    nextDayPlan: ["Aplicar segunda demão de tinta", "Vistoria com contratante"],
    executiveSummary: "Primeira demão de tinta industrial aplicada com sucesso. Plugs instalados e ponto de energia dividido entre as lixadeiras.",
    notes: "",
    media: photos([
      { phase: "durante", caption: "Aplicação da primeira demão" },
      { phase: "depois", caption: "Resultado da primeira demão" },
    ]),
    expenses: [],
    signatures: [],
    status: "pronto_revisao",
    createMode: "perguntas",
  };
}

function rdoSolar1(p: Project): DailyReport {
  return {
    ...baseRdo(p, 1, -2),
    arrival: "08:00",
    departure: "16:00",
    weather: "Ensolarado",
    siteCondition: "Telhado liberado para acesso",
    team: [
      { name: "Geidson Souza", role: "Eletricista", present: true },
      { name: "Rafael Nunes", role: "Ajudante", present: true },
    ],
    activities: [
      { id: uid("act"), description: "Levantamento e medição do telhado para fixação dos módulos", status: "concluida" },
      { id: uid("act"), description: "Marcação dos pontos de fixação da estrutura", status: "concluida" },
    ],
    materials: [],
    materialsRequested: [{ id: uid("it"), name: "Módulo fotovoltaico 550W", quantity: "82 un" }],
    equipment: [{ id: uid("it"), name: "Furadeira de impacto" }],
    equipmentRequested: [],
    occurrences: ["Fornecedor informou atraso de 5 dias na entrega dos módulos fotovoltaicos."],
    risks: ["Trabalho em altura — uso obrigatório de cinto de segurança"],
    impediments: ["Aguardando entrega dos módulos para iniciar a montagem"],
    clientRequests: [],
    pending: ["Iniciar montagem da estrutura após chegada dos módulos"],
    nextDayPlan: ["Acionar fornecedor alternativo"],
    executiveSummary: "Levantamento e marcação do telhado concluídos. Obra aguardando entrega dos módulos fotovoltaicos, com atraso reportado pelo fornecedor.",
    notes: "",
    media: photos([{ phase: "antes", caption: "Telhado antes da instalação" }]),
    expenses: [],
    signatures: [],
    status: "enviado",
    createMode: "perguntas",
  };
}

function rdoDrywall1(p: Project): DailyReport {
  return {
    ...baseRdo(p, 1, -2),
    arrival: "07:00",
    departure: "18:00",
    weather: "Indiferente (obra interna)",
    siteCondition: "Obra interna",
    team: [
      { name: "Ítalo Ferreira", role: "Encarregado", present: true },
      { name: "Rafael Nunes", role: "Servente", present: true },
    ],
    activities: [
      { id: uid("act"), description: "Pintura de acabamento dos consultórios", status: "concluida" },
      { id: uid("act"), description: "Limpeza final e organização", status: "concluida" },
      { id: uid("act"), description: "Vistoria final acompanhada pelo cliente", status: "concluida" },
    ],
    materials: [{ id: uid("it"), name: "Placa de drywall", quantity: "120 un" }],
    materialsRequested: [],
    equipment: [],
    equipmentRequested: [],
    occurrences: [],
    risks: [],
    impediments: [],
    clientRequests: [],
    pending: [],
    nextDayPlan: [],
    executiveSummary: "Obra finalizada. Pintura de acabamento concluída, limpeza final realizada e vistoria aprovada pelo cliente. Termo de entrega assinado.",
    notes: "Cliente aprovou a entrega sem ressalvas.",
    media: photos([
      { phase: "antes", caption: "Consultório antes da reforma" },
      { phase: "depois", caption: "Consultório finalizado" },
      { phase: "depois", caption: "Recepção entregue" },
    ]),
    expenses: [],
    signatures: [
      { id: uid("sig"), role: "supervisor", name: "Ítalo Ferreira", dataUrl: "", signedAt: new Date().toISOString(), accepted: true },
      { id: uid("sig"), role: "cliente", name: "OdontoCenter Ltda.", dataUrl: "", signedAt: new Date().toISOString(), accepted: true },
    ],
    status: "aprovado",
    createMode: "manual",
  };
}

// ---- datas ----
function today(): string {
  return new Date().toISOString().slice(0, 10);
}
function addDays(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
