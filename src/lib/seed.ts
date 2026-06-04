import type {
  Checklist, Company, Contact, DailyReport, Equipment, Expense, Incident,
  Material, Project, Task, TeamMember, TimeCard, User, MediaItem, Providencia,
  RdoComment, Role,
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

  // ===== Projeto 3: Paradas de ônibus metálicas — Prefeitura de São João do Monte =====
  const paradas: Project = {
    id: "prj_paradas",
    companyId: COMPANY_ID,
    name: "Prefeitura de São João do Monte — Fabricação e instalação de 4 paradas de ônibus em estrutura metálica",
    client: "Prefeitura de São João do Monte",
    address: "Sede e pontos urbanos — São João do Monte",
    technicalLead: "Eng. Responsável Técnico",
    supervisor: "Ronaldo Ferraz",
    startDate: "2026-05-18",
    expectedEndDate: "2026-06-15",
    status: "em_andamento",
    budget: 185000,
    description:
      "Fabricação em oficina e instalação de 4 abrigos de ônibus em estrutura metálica para a Prefeitura: corte, dobra e soldagem dos pórticos, cobertura, pintura anticorrosiva, transporte e instalação com bases de concreto nos pontos urbanos.",
    coverColor: "#0e7490",
    createdAt: new Date().toISOString(),
  };

  // ===== Projeto 4: Base/estrutura para placas solares — Condomínio Maria Lacerda =====
  const solar: Project = {
    id: "prj_solar",
    companyId: COMPANY_ID,
    name: "Condomínio Maria Lacerda — Instalação de base e estrutura para placas solares (Boa Viagem)",
    client: "Condomínio Maria Lacerda",
    address: "Cobertura do bloco principal — Boa Viagem",
    technicalLead: "Eng. Eletricista Responsável",
    supervisor: "Diego Martins",
    startDate: "2026-05-25",
    expectedEndDate: "2026-06-12",
    status: "em_andamento",
    budget: 96000,
    description:
      "Instalação da estrutura de sustentação para sistema fotovoltaico no Condomínio Maria Lacerda: vistoria da laje, fixação e impermeabilização de suportes, montagem dos perfis de alumínio, aterramento, instalação dos módulos e comissionamento.",
    coverColor: "#16a34a",
    createdAt: new Date().toISOString(),
  };

  // ===== Projeto 5: Galpão industrial metálico — Logística Capixaba (Serra) =====
  const galpao: Project = {
    id: "prj_galpao",
    companyId: COMPANY_ID,
    name: "Logística Capixaba — Estrutura metálica e cobertura termoacústica de galpão (Serra)",
    client: "Logística Capixaba Ltda",
    address: "Distrito Industrial — Serra - ES",
    technicalLead: "Eng. Responsável Técnico",
    supervisor: "Sérgio Lopes",
    startDate: "2026-05-20",
    expectedEndDate: "2026-07-05",
    status: "em_andamento",
    budget: 540000,
    description:
      "Montagem da estrutura metálica de um galpão logístico: içamento de pilares e vigas, tesouras de cobertura, terças, cobertura termoacústica, fechamentos laterais e acabamentos, com trabalho em altura e uso de guindaste.",
    coverColor: "#475569",
    createdAt: new Date().toISOString(),
  };

  // ===== Projeto 6: Revitalização e pintura de fachada — Edifício Oceania (Vitória) =====
  const reforma: Project = {
    id: "prj_reforma",
    companyId: COMPANY_ID,
    name: "Edifício Oceania — Revitalização e pintura de fachada com manutenção predial (Vitória)",
    client: "Edifício Oceania",
    address: "Orla de Camburi — Vitória - ES",
    technicalLead: "Responsável Técnico",
    supervisor: "Anderson Reis",
    startDate: "2026-05-26",
    expectedEndDate: "2026-06-18",
    status: "em_andamento",
    budget: 128000,
    description:
      "Revitalização da fachada do edifício: lavagem e preparação da superfície, tratamento de trincas e oxidação, pintura acrílica em duas demãos, pintura de esquadrias e guarda-corpos metálicos e pequenos reparos de manutenção predial, com trabalho em altura via balancim.",
    coverColor: "#dc2626",
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
    tm("Ronaldo Ferraz", "Encarregado", "27 99999-4001", paradas.id),
    tm("Júnior Alves", "Soldador", "27 99999-4002", paradas.id),
    tm("Cleiton Dias", "Montador", "27 99999-4003", paradas.id),
    tm("Diego Martins", "Encarregado", "27 99999-5001", solar.id),
    tm("Patrick Nunes", "Eletricista", "27 99999-5002", solar.id),
    tm("Wesley Lima", "Ajudante", "27 99999-5003", solar.id),
    tm("Sérgio Lopes", "Encarregado", "27 99999-6001", galpao.id),
    tm("Fábio Rocha", "Montador", "27 99999-6002", galpao.id),
    tm("Edson Maia", "Soldador", "27 99999-6003", galpao.id),
    tm("Anderson Reis", "Encarregado", "27 99999-7001", reforma.id),
    tm("Marcos Vieira", "Pintor", "27 99999-7002", reforma.id),
    tm("Tiago Souza", "Ajudante", "27 99999-7003", reforma.id),
  ];

  const reports: DailyReport[] = [
    ...buildDrywallReports(drywall),
    usinaRdo001(usina),
    usinaRdo002(usina),
    ...buildReports(paradas, PARADAS_DAYS, PARADAS_CFG),
    ...buildReports(solar, SOLAR_DAYS, SOLAR_CFG),
    ...buildReports(galpao, GALPAO_DAYS, GALPAO_CFG),
    ...buildReports(reforma, REFORMA_DAYS, REFORMA_CFG),
  ];

  const tasks: Task[] = [
    task(usina.id, "Comprar 2 plugs/divisores para as lixadeiras", "Suprimentos RF", "urgente", "a_fazer", "2026-06-03"),
    task(usina.id, "Locar jato/lavadora com mangueira de 20m", "Suprimentos RF", "alta", "em_andamento", "2026-06-03"),
    task(usina.id, "Providenciar tinta para a pintura", "Matheus", "alta", "aguardando_material", "2026-06-03"),
    task(usina.id, "Continuar lixamento das áreas pendentes", "Equipe RF", "media", "em_andamento", "2026-06-03"),
    task(drywall.id, "Remover luminárias do próximo trecho", "Alan", "media", "a_fazer", "2026-05-29"),
    task(drywall.id, "Segregar e destinar resíduos da desmontagem", "Equipe RF", "media", "em_andamento", "2026-05-29"),
    task(drywall.id, "Conferir travamento da plataforma JLG", "Alan", "alta", "concluido", "2026-05-28"),
    task(paradas.id, "Confirmar pontos de instalação com a Prefeitura", "Ronaldo Ferraz", "alta", "em_andamento", "2026-05-30"),
    task(paradas.id, "Comprar tinta anticorrosiva para os abrigos", "Ronaldo Ferraz", "media", "concluido", "2026-05-24"),
    task(solar.id, "Agendar comissionamento com a concessionária", "Diego Martins", "media", "a_fazer", "2026-06-05"),
    task(galpao.id, "Conferir torque dos parafusos estruturais", "Sérgio Lopes", "alta", "em_andamento", "2026-05-31"),
    task(reforma.id, "Aprovar cor final da fachada com o síndico", "Anderson Reis", "media", "concluido", "2026-05-28"),
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
    mat(paradas.id, "Tubo metalon 40x40", "barra", "comprado", 48, 60, "Ferro & Aço Capixaba", 86),
    mat(paradas.id, "Tinta anticorrosiva", "balde", "usado", 6, 8, "Tech Tintas", 190),
    mat(solar.id, "Perfil de alumínio (trilho)", "barra", "entregue", 28, 28, "SolarFix", 70),
    mat(solar.id, "Módulo fotovoltaico 550W", "un", "entregue", 24, 24, "SolarFix", 720),
    mat(galpao.id, "Telha termoacústica", "m²", "entregue", 0, 1200, "MetalCobre", 95),
    mat(galpao.id, "Parafuso estrutural", "un", "comprado", 0, 900, "Ferro & Aço Capixaba", 3),
    mat(reforma.id, "Tinta acrílica premium", "balde", "usado", 9, 14, "Tech Tintas", 220),
  ];

  const equipment: Equipment[] = [
    eq(drywall.id, "Plataforma elevatória tipo tesoura JLG", "Elevação", "em_uso", "Alan", "Operacional"),
    eq(usina.id, "Lixadeira pequena (dupla 1)", "Elétrica", "em_uso", "William Costa", "Boa"),
    eq(usina.id, "Lixadeira pequena (dupla 2)", "Elétrica", "em_uso", "Ítalo Ferreira", "Boa"),
    eq(usina.id, "Esmerilhadeira", "Elétrica", "em_uso", "Geidson Souza", "Boa"),
    eq(usina.id, "Caminhão pipa (apoio)", "Apoio", "disponivel", "Lidermac", "Operacional"),
    eq(usina.id, "Guindaste PHD (apoio)", "Apoio", "disponivel", "Lidermac", "Operacional"),
    eq(paradas.id, "Máquina de solda MIG", "Solda", "em_uso", "Júnior Alves", "Operacional"),
    eq(paradas.id, "Caminhão munck", "Apoio", "disponivel", "Ronaldo Ferraz", "Operacional"),
    eq(solar.id, "Chave de torque", "Manual", "em_uso", "Patrick Nunes", "Boa"),
    eq(galpao.id, "Guindaste 30t", "Elevação", "em_uso", "Sérgio Lopes", "Operacional"),
    eq(galpao.id, "Plataforma articulada", "Elevação", "em_uso", "Fábio Rocha", "Operacional"),
    eq(reforma.id, "Balancim elétrico", "Elevação", "em_uso", "Anderson Reis", "Operacional"),
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
    checklist(galpao.id, "Checklist — Montagem de estrutura metálica em altura", "estrutura metálica", "Sérgio Lopes", [
      ["Cinto de segurança e linha de vida instalados", true],
      ["Guindaste inspecionado e operador habilitado", true],
      ["Área de içamento isolada e sinalizada", true],
      ["Prumo e nível dos pilares conferidos", false],
      ["Torque dos parafusos estruturais verificado", false],
    ]),
    checklist(solar.id, "Checklist — Instalação fotovoltaica", "energia solar", "Diego Martins", [
      ["Estrutura de fixação impermeabilizada", true],
      ["Aterramento da estrutura executado", true],
      ["Torque dos módulos conferido", false],
      ["Cabeamento CC identificado e organizado", false],
      ["Comissionamento e testes realizados", false],
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
    inc(paradas.id, "Atraso na entrega do aço", "falta de material", "media",
      "O fornecedor atrasou a entrega dos tubos metalon, impactando o início da fabricação dos pórticos.",
      "Ronaldo Ferraz", "resolvida", "Compra emergencial em fornecedor alternativo para não parar a oficina."),
    inc(solar.id, "Ponto de infiltração na laje", "impedimento técnico", "media",
      "Identificado ponto de infiltração próximo a uma fixação; necessária impermeabilização antes da montagem dos suportes.",
      "Diego Martins", "em_andamento", "Aplicar manta de impermeabilização nos pontos de fixação."),
    inc(galpao.id, "Vento forte na montagem em altura", "risco de segurança", "alta",
      "Rajadas de vento exigiram a interrupção temporária do içamento das tesouras de cobertura.",
      "Sérgio Lopes", "resolvida", "Içamento retomado em janela de tempo favorável, com sinalização reforçada."),
    inc(reforma.id, "Chuva durante a pintura", "chuva", "media",
      "Chuva no período da tarde interrompeu a aplicação da segunda demão na fachada.",
      "Anderson Reis", "em_andamento", "Reprogramar a demão para um dia de tempo firme."),
  ];

  const expenses: Expense[] = [
    exp(usina.id, "Locação de lixadeiras", "locação", 220, "Leone", reports.find((r) => r.projectId === usina.id)!.id),
    exp(usina.id, "Combustível — deslocamento à locadora", "gasolina", 80, "Leone"),
    exp(usina.id, "Almoço da equipe", "alimentação", 95, "Leone"),
    exp(usina.id, "Plugs e extensão", "ferramenta", 156, "Suprimentos RF"),
    exp(drywall.id, "Locação plataforma JLG (diária)", "locação", 680, "Alan"),
    exp(drywall.id, "Discos de corte", "ferramenta", 216, "Alan"),
    exp(drywall.id, "Descarte de resíduos", "transporte", 140, "Alan"),
    exp(paradas.id, "Aço e tubos metalon", "material", 8400, "Ronaldo Ferraz"),
    exp(paradas.id, "Frete das estruturas (caminhão munck)", "transporte", 1200, "Ronaldo Ferraz"),
    exp(solar.id, "Suportes e perfis de alumínio", "material", 3200, "Diego Martins"),
    exp(solar.id, "Locação de andaime", "locação", 450, "Diego Martins"),
    exp(galpao.id, "Locação de guindaste (diária)", "locação", 2400, "Sérgio Lopes"),
    exp(galpao.id, "Telha termoacústica", "material", 18600, "Sérgio Lopes"),
    exp(reforma.id, "Tinta acrílica e fundo preparador", "material", 2750, "Anderson Reis"),
    exp(reforma.id, "Locação de balancim", "locação", 1800, "Anderson Reis"),
  ];

  const contacts: Contact[] = [
    ct("Lidermac", "cliente", "81 3000-0000", "contato@lidermac.com.br", "Lidermac"),
    ct("Shopping Park Vitória", "cliente", "27 3000-0000", "obras@parkvitoria.com.br", "Shopping Park Vitória"),
    ct("Castelos Locações", "locadora", "27 3311-7070", "atendimento@casteloslocacoes.com.br", "Castelos Locações"),
    ct("Tech Tintas", "fornecedor", "27 3322-5050", "vendas@techtintas.com.br", "Tech Tintas"),
    ct("Matheus — Suprimentos", "fornecedor", "27 99999-3001", "suprimentos@rfsolucoes.com.br", "RF Soluções"),
    ct("Leone — Responsável de campo", "equipe", "27 99999-2001", "leone@rfsolucoes.com.br", "RF Soluções"),
    ct("Prefeitura de São João do Monte", "cliente", "33 3333-0000", "obras@saojoaodomonte.gov.br", "Prefeitura de São João do Monte"),
    ct("Condomínio Maria Lacerda", "cliente", "81 3333-1000", "sindico@marialacerda.com.br", "Condomínio Maria Lacerda"),
    ct("Logística Capixaba Ltda", "cliente", "27 3333-2000", "obras@logisticacapixaba.com.br", "Logística Capixaba"),
    ct("Edifício Oceania", "cliente", "27 3333-3000", "sindico@edoceania.com.br", "Edifício Oceania"),
  ];

  return {
    user, company, projects: [drywall, usina, paradas, solar, galpao, reforma], reports, tasks, team, timeCards,
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

function cmt(authorName: string, authorRole: Role, text: string, createdAt: string): RdoComment {
  return { id: uid("cmt"), authorName, authorRole, text, createdAt };
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
    comments: [
      cmt("Leone", "supervisor", "Equipe iniciou a lavagem e o lixamento. Tinta ainda não chegou ao local.", "2026-06-01T18:10:00.000Z"),
      cmt("Carlos Andrade", "client", "Recebido e revisado. Vou agilizar a tinta com o Matheus. RDO aprovado.", "2026-06-01T20:32:00.000Z"),
    ],
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
    comments: [
      cmt("Carlos Andrade", "client", "As tintas da Tech Tintas já foram retiradas? Confirmem antes de eu aprovar este RDO.", "2026-06-02T19:05:00.000Z"),
    ],
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

// ============ Builder genérico de RDOs para as demais obras ============
interface GenDay {
  titulo: string;
  atividades: string[];
  resultado: string;
  ocorrencias?: string[];
  proximo?: string[];
}
interface GenCfg {
  start: string;
  responsible: string;
  arrival: string;
  departure: string;
  weather: string;
  team: { name: string; role: string }[];
  materials: string[];
  equipment: string[];
  risks?: string[];
}

function buildReports(p: Project, days: GenDay[], cfg: GenCfg): DailyReport[] {
  return days.map((d, i) => {
    const number = i + 1;
    const last = i === days.length - 1;
    const phaseSeq: MediaItem["phase"][] = i === 0 ? ["antes", "durante"] : last ? ["durante", "depois", "depois"] : ["durante", "durante"];
    return {
      id: uid("rdo"), companyId: COMPANY_ID, projectId: p.id, number, date: addDays(cfg.start, i),
      responsible: cfg.responsible, supervisor: cfg.responsible,
      arrival: cfg.arrival, departure: cfg.departure,
      weather: cfg.weather, siteCondition: d.titulo,
      team: cfg.team.map((t) => ({ name: t.name, role: t.role, present: true })),
      activities: acts(d.atividades.map((x) => ({ d: x }))),
      materials: items(cfg.materials),
      materialsRequested: [],
      equipment: items(cfg.equipment),
      equipmentRequested: [],
      occurrences: d.ocorrencias || [],
      risks: cfg.risks || [],
      impediments: [],
      clientRequests: [],
      pending: last ? ["Vistoria final e formalização da entrega do trecho concluído"] : ["Continuidade conforme cronograma no próximo dia"],
      nextDayPlan: d.proximo || ["Dar sequência às próximas etapas previstas no cronograma."],
      executiveSummary: d.resultado,
      notes: `Etapa: ${d.titulo}.`,
      media: photos(phaseSeq.map((phase, k) => ({ phase, caption: `${d.titulo} — registro ${k + 1}` }))),
      expenses: [],
      signatures: [],
      status: last ? "pronto_revisao" : number % 6 === 0 ? "enviado" : "aprovado",
      createMode: number % 3 === 0 ? "perguntas" : number % 2 === 0 ? "texto" : "voz",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as DailyReport;
  });
}

// ---- Paradas de ônibus metálicas (Prefeitura de São João do Monte) ----
const PARADAS_CFG: GenCfg = {
  start: "2026-05-18", responsible: "Ronaldo Ferraz", arrival: "07:00", departure: "17:00",
  weather: "Ensolarado",
  team: [
    { name: "Ronaldo Ferraz", role: "Encarregado" },
    { name: "Júnior Alves", role: "Soldador" },
    { name: "Cleiton Dias", role: "Montador" },
  ],
  materials: ["Tubo metalon 40x40", "Chapa de aço", "Eletrodos/arame de solda", "Tinta anticorrosiva"],
  equipment: ["Máquina de solda MIG", "Esmerilhadeira", "Furadeira", "Caminhão munck"],
  risks: ["Soldagem e corte — uso de máscara, luvas e proteção contra fagulhas"],
};
const PARADAS_DAYS: GenDay[] = [
  { titulo: "Mobilização e conferência do projeto", atividades: ["Recebimento do projeto executivo das 4 paradas e conferência de medidas.", "Separação de materiais e organização da oficina.", "Planejamento das frentes de fabricação."], resultado: "Projeto conferido e oficina preparada para iniciar a fabricação dos abrigos." },
  { titulo: "Corte e preparação do aço", atividades: ["Corte dos tubos metalon e perfis conforme projeto.", "Preparação das peças das colunas e travessas.", "Identificação e organização das peças por parada."], resultado: "Peças cortadas e preparadas para a montagem dos pórticos." },
  { titulo: "Montagem dos pórticos (paradas 1 e 2)", atividades: ["Dobra de chapas e montagem dos pórticos das paradas 1 e 2.", "Conferência de esquadro e alinhamento.", "Pré-fixação para soldagem."], resultado: "Pórticos das paradas 1 e 2 montados e alinhados." },
  { titulo: "Soldagem das estruturas", atividades: ["Soldagem dos pórticos e travessas.", "Reforço dos nós estruturais.", "Conferência de nível e esquadro pós-solda."], resultado: "Estruturas soldadas e verificadas estruturalmente.", ocorrencias: ["Necessário reforço em dois nós estruturais identificados na inspeção."] },
  { titulo: "Cobertura e fechamentos", atividades: ["Instalação das telhas/policarbonato de cobertura.", "Montagem dos fechamentos laterais.", "Instalação de bancos das estruturas."], resultado: "Cobertura e fechamentos instalados nas estruturas." },
  { titulo: "Tratamento e pintura", atividades: ["Lixamento e limpeza das estruturas.", "Aplicação de fundo anticorrosivo.", "Pintura final das 4 estruturas."], resultado: "Estruturas tratadas e pintadas, prontas para transporte." },
  { titulo: "Carregamento e transporte", atividades: ["Carregamento das estruturas no caminhão munck.", "Deslocamento até São João do Monte.", "Descarga organizada nos pontos de instalação."], resultado: "Estruturas transportadas e posicionadas para instalação." },
  { titulo: "Parada 1 — base e instalação", atividades: ["Execução da base de concreto e chumbadores (Praça Central).", "Fixação e nivelamento da estrutura da parada 1.", "Instalação de bancos e placa de identificação."], resultado: "Parada 1 instalada e nivelada na Praça Central." },
  { titulo: "Parada 2 — base e instalação", atividades: ["Base de concreto e chumbadores (Av. Brasil).", "Fixação e nivelamento da estrutura da parada 2.", "Acabamento e conferência da cobertura."], resultado: "Parada 2 instalada na Av. Brasil." },
  { titulo: "Parada 3 — base e instalação", atividades: ["Base e chumbadores (Bairro São José).", "Fixação e nivelamento da estrutura da parada 3.", "Conferência de cobertura e fechamentos."], resultado: "Parada 3 instalada no Bairro São José." },
  { titulo: "Parada 4 — base e instalação", atividades: ["Base e chumbadores (Rodoviária).", "Fixação e nivelamento da estrutura da parada 4.", "Instalação de bancos e acabamentos."], resultado: "Parada 4 instalada na Rodoviária." },
  { titulo: "Retoques, limpeza e entrega", atividades: ["Retoques de pintura e ajustes finais nas 4 paradas.", "Limpeza dos pontos de instalação.", "Vistoria final com a equipe da Prefeitura."], resultado: "As 4 paradas concluídas, limpas e vistoriadas com a Prefeitura." },
];

// ---- Base/estrutura para placas solares (Condomínio Maria Lacerda) ----
const SOLAR_CFG: GenCfg = {
  start: "2026-05-25", responsible: "Diego Martins", arrival: "08:00", departure: "16:30",
  weather: "Ensolarado",
  team: [
    { name: "Diego Martins", role: "Encarregado" },
    { name: "Patrick Nunes", role: "Eletricista" },
    { name: "Wesley Lima", role: "Ajudante" },
  ],
  materials: ["Suportes de fixação", "Perfil de alumínio (trilho)", "Módulo fotovoltaico 550W", "Cabo solar CC"],
  equipment: ["Furadeira de impacto", "Chave de torque", "Multímetro", "Andaime"],
  risks: ["Trabalho em cobertura/altura — uso de cinto, linha de vida e calçado adequado"],
};
const SOLAR_DAYS: GenDay[] = [
  { titulo: "Vistoria técnica da cobertura", atividades: ["Vistoria da laje/cobertura e do quadro elétrico.", "Conferência do layout das placas com o projeto.", "Identificação dos pontos de fixação."], resultado: "Cobertura vistoriada e layout dos módulos confirmado." },
  { titulo: "Marcação e locação dos pontos", atividades: ["Marcação dos pontos de fixação dos suportes.", "Conferência de afastamentos e alinhamento.", "Organização do canteiro na cobertura."], resultado: "Pontos de fixação marcados conforme projeto." },
  { titulo: "Fixação e impermeabilização dos suportes", atividades: ["Instalação dos suportes/ganchos de fixação.", "Impermeabilização dos pontos de fixação.", "Conferência de resistência."], resultado: "Suportes fixados e impermeabilizados.", ocorrencias: ["Ponto de infiltração próximo a uma fixação exigiu impermeabilização reforçada."] },
  { titulo: "Montagem da estrutura de alumínio", atividades: ["Montagem dos perfis de alumínio (trilhos).", "Fixação dos trilhos aos suportes.", "Conferência inicial de alinhamento."], resultado: "Estrutura de alumínio montada sobre os suportes." },
  { titulo: "Nivelamento e inclinação", atividades: ["Alinhamento e nivelamento dos trilhos.", "Ajuste da inclinação dos módulos.", "Conferência geométrica da estrutura."], resultado: "Trilhos nivelados e inclinação ajustada." },
  { titulo: "Aterramento", atividades: ["Instalação do sistema de aterramento.", "Equipotencialização da estrutura metálica.", "Teste de continuidade do aterramento."], resultado: "Aterramento executado e testado." },
  { titulo: "Instalação dos módulos (1ª parte)", atividades: ["Içamento e fixação do primeiro bloco de módulos.", "Conferência de torque dos grampos.", "Organização do cabeamento inicial."], resultado: "Primeiro bloco de módulos fixado." },
  { titulo: "Instalação dos módulos (2ª parte)", atividades: ["Fixação do segundo bloco de módulos.", "Conferência de torque e alinhamento.", "Fechamento das fileiras."], resultado: "Todos os módulos instalados e fixados." },
  { titulo: "Cabeamento e conexões", atividades: ["Passagem e organização do cabeamento CC.", "Conexão dos strings.", "Identificação dos circuitos."], resultado: "Cabeamento organizado e strings conectados." },
  { titulo: "Comissionamento e entrega", atividades: ["Conexão ao inversor e testes.", "Comissionamento do sistema.", "Entrega e orientação ao condomínio."], resultado: "Sistema comissionado e entregue ao Condomínio Maria Lacerda." },
];

// ---- Galpão industrial metálico (Logística Capixaba) ----
const GALPAO_CFG: GenCfg = {
  start: "2026-05-20", responsible: "Sérgio Lopes", arrival: "07:00", departure: "17:00",
  weather: "Parcialmente nublado",
  team: [
    { name: "Sérgio Lopes", role: "Encarregado" },
    { name: "Fábio Rocha", role: "Montador" },
    { name: "Edson Maia", role: "Soldador" },
  ],
  materials: ["Pilares metálicos", "Vigas e tesouras", "Telha termoacústica", "Parafuso estrutural"],
  equipment: ["Guindaste 30t", "Plataforma articulada", "Máquina de solda", "Parafusadeira"],
  risks: ["Montagem e içamento em altura — cinto, linha de vida e sinalização obrigatórios"],
};
const GALPAO_DAYS: GenDay[] = [
  { titulo: "Mobilização e conferência das fundações", atividades: ["Conferência das fundações e chumbadores.", "Mobilização da equipe e do guindaste.", "Organização da área de montagem."], resultado: "Fundações conferidas e canteiro pronto para a montagem." },
  { titulo: "Içamento dos pilares", atividades: ["Içamento e fixação dos pilares metálicos.", "Conferência de prumo dos pilares.", "Travamento provisório."], resultado: "Pilares metálicos posicionados e travados." },
  { titulo: "Vigas e contraventamentos", atividades: ["Montagem das vigas principais.", "Instalação dos contraventamentos.", "Aperto inicial das ligações."], resultado: "Vigas e travamentos montados." },
  { titulo: "Tesouras de cobertura (1º vão)", atividades: ["Içamento e fixação das tesouras do primeiro vão.", "Conferência de alinhamento.", "Travamento entre tesouras."], resultado: "Tesouras do primeiro vão montadas.", ocorrencias: ["Rajadas de vento exigiram pausa temporária no içamento."] },
  { titulo: "Tesouras de cobertura (2º vão)", atividades: ["Conclusão das tesouras do segundo vão.", "Conferência de prumo e nível.", "Travamento geral da cobertura."], resultado: "Estrutura de cobertura concluída e travada." },
  { titulo: "Terças e apoios", atividades: ["Instalação das terças.", "Montagem dos apoios para a cobertura.", "Conferência de espaçamentos."], resultado: "Terças instaladas, prontas para receber a telha." },
  { titulo: "Cobertura termoacústica (1ª água)", atividades: ["Instalação das telhas termoacústicas na primeira água.", "Fixação e vedação.", "Conferência de caimento."], resultado: "Primeira água da cobertura instalada." },
  { titulo: "Cobertura termoacústica (2ª água)", atividades: ["Conclusão da cobertura na segunda água.", "Instalação de rufos e calhas.", "Vedação dos encontros."], resultado: "Cobertura concluída com rufos e calhas." },
  { titulo: "Fechamentos laterais", atividades: ["Instalação dos fechamentos laterais em telha trapezoidal.", "Fixação e alinhamento.", "Acabamento das bordas."], resultado: "Fechamentos laterais instalados." },
  { titulo: "Pintura e acabamentos", atividades: ["Retoques de pintura na estrutura.", "Acabamentos e ajustes finais.", "Conferência de parafusos estruturais."], resultado: "Estrutura com acabamentos concluídos." },
  { titulo: "Limpeza e entrega", atividades: ["Limpeza geral do galpão.", "Conferência final da estrutura e cobertura.", "Vistoria de entrega com o cliente."], resultado: "Galpão limpo e vistoriado para entrega à Logística Capixaba." },
];

// ---- Revitalização e pintura de fachada (Edifício Oceania) ----
const REFORMA_CFG: GenCfg = {
  start: "2026-05-26", responsible: "Anderson Reis", arrival: "07:30", departure: "16:30",
  weather: "Ensolarado",
  team: [
    { name: "Anderson Reis", role: "Encarregado" },
    { name: "Marcos Vieira", role: "Pintor" },
    { name: "Tiago Souza", role: "Ajudante" },
  ],
  materials: ["Tinta acrílica", "Fundo preparador", "Lixa e massa", "Selante para trincas"],
  equipment: ["Balancim elétrico", "Lavadora de alta pressão", "Rolos e pincéis", "Lixadeira"],
  risks: ["Trabalho em altura na fachada — balancim inspecionado e EPIs obrigatórios"],
};
const REFORMA_DAYS: GenDay[] = [
  { titulo: "Mobilização e isolamento", atividades: ["Montagem e inspeção do balancim elétrico.", "Isolamento e sinalização da área da fachada.", "Organização dos materiais."], resultado: "Balancim montado e área isolada para início dos serviços." },
  { titulo: "Vistoria e mapeamento da fachada", atividades: ["Mapeamento de trincas, infiltrações e oxidação.", "Registro fotográfico dos pontos críticos.", "Definição da sequência de tratamento."], resultado: "Patologias da fachada mapeadas e planejadas." },
  { titulo: "Preparação da superfície", atividades: ["Lavagem da fachada com alta pressão.", "Raspagem e lixamento das áreas comprometidas.", "Remoção de partes soltas."], resultado: "Superfície lavada e preparada para tratamento." },
  { titulo: "Tratamento de trincas", atividades: ["Tratamento e selagem de trincas.", "Aplicação de fundo preparador.", "Correções pontuais com massa."], resultado: "Trincas tratadas e superfície selada." },
  { titulo: "Tratamento dos elementos metálicos", atividades: ["Lixamento das esquadrias e guarda-corpos.", "Aplicação de fundo anticorrosivo.", "Preparação para pintura metálica."], resultado: "Elementos metálicos tratados contra corrosão.", ocorrencias: ["Chuva no fim da tarde interrompeu parte dos serviços externos."] },
  { titulo: "Pintura — 1ª demão", atividades: ["Aplicação da primeira demão de tinta acrílica.", "Cobertura uniforme dos panos da fachada.", "Conferência de cobertura."], resultado: "Primeira demão aplicada na fachada." },
  { titulo: "Pintura — 2ª demão", atividades: ["Aplicação da segunda demão.", "Uniformização do acabamento.", "Retoques nas bordas e detalhes."], resultado: "Segunda demão concluída com acabamento uniforme." },
  { titulo: "Pintura dos elementos metálicos", atividades: ["Pintura de esquadrias e guarda-corpos.", "Acabamento dos detalhes metálicos.", "Proteção das áreas adjacentes."], resultado: "Elementos metálicos pintados e finalizados." },
  { titulo: "Manutenção predial", atividades: ["Pequenos reparos hidráulicos e elétricos.", "Revisão de rejuntes e vedações.", "Ajustes solicitados pela administração."], resultado: "Reparos de manutenção predial executados." },
  { titulo: "Limpeza e entrega", atividades: ["Desmontagem do balancim.", "Limpeza final da fachada e do entorno.", "Vistoria de entrega com o síndico."], resultado: "Fachada revitalizada, limpa e entregue ao Edifício Oceania." },
];
