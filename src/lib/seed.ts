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

  // ===== Projeto 1: Shopping Vitória — Reforma do forro / sancas (REAL) =====
  const drywall: Project = {
    id: "prj_drywall",
    companyId: COMPANY_ID,
    name: "Shopping Vitória — Reforma do forro e adequação arquitetônica (sancas iluminadas)",
    client: "Shopping Vitória",
    address: "Corredor central — Shopping Vitória, Vitória - ES",
    technicalLead: "Responsável Técnico",
    supervisor: "Lucas Vital",
    startDate: "2026-05-05",
    expectedEndDate: "2026-06-10",
    status: "em_andamento",
    budget: 320000,
    description:
      "Reforma do forro e adequação arquitetônica do corredor com implantação de sancas iluminadas embutidas, executada em horário noturno para não interferir na operação do shopping. Inclui remoção das quatro treliças metálicas, desmontagem do forro em drywall, abertura e adequação da estrutura superior, contenção e proteção das áreas (quiosques e corredor).",
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
    tm("Lucas Vital", "Responsável / Supervisão operacional", "27 99999-1001", drywall.id),
    tm("Leone", "Drywall, serralheria e soldagem", "27 99999-1002", drywall.id),
    tm("Reginaldo", "Assistência operacional", "27 99999-1003", drywall.id),
    tm("Italo", "Apoio operacional", "27 99999-1004", drywall.id),
    tm("William", "Apoio operacional", "27 99999-1005", drywall.id),
    tm("Bruno", "Apoio operacional", "27 99999-1006", drywall.id),
    tm("Alan", "Encarregado (17º dia)", "27 99999-1007", drywall.id),
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
    ct("Shopping Vitória", "cliente", "27 3000-0000", "obras@shoppingvitoria.com.br", "Shopping Vitória"),
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

// ============ SHOPPING VITÓRIA — RDOs reais (forro/sancas, serviço noturno) ============
// Base comum dos RDOs reais do Shopping Vitória.
function shoppingBase(projectId: string, number: number, date: string, supervisor: string) {
  return {
    id: uid("rdo"), companyId: COMPANY_ID, projectId, number, date,
    responsible: supervisor, supervisor,
    weather: "Indiferente (obra interna / noturna)",
    siteCondition: "Corredor central — Shopping Vitória (serviço noturno)",
    expenses: [], signatures: [],
    createMode: "manual" as const,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
}

// RDOs reais digitalizados (criados fora do app, antes dele existir).
function buildDrywallReports(p: Project): DailyReport[] {
  const dia1: DailyReport = {
    ...shoppingBase(p.id, 1, "2026-05-05", "Lucas Vital"),
    arrival: "21:40", departure: "03:10",
    team: [
      { name: "Lucas Vital", role: "Responsável / Supervisão operacional", present: true },
      { name: "Leone", role: "Drywall e desmontagem estrutural", present: true },
      { name: "Reginaldo", role: "Assistência operacional", present: true },
    ],
    activities: acts([
      { d: "Posicionamento inicial da plataforma elevatória para início dos serviços em altura." },
      { d: "Início da remoção das quatro treliças metálicas do corredor.", s: "parcial" },
      { d: "Desmontagem parcial do forro em drywall existente.", s: "parcial" },
      { d: "Isolamento e proteção da área do corredor para a operação noturna." },
    ]),
    materials: items(["Placas de drywall (remoção)"]),
    materialsRequested: [],
    equipment: items(["Plataforma elevatória"]),
    equipmentRequested: [],
    occurrences: [],
    risks: ["Trabalho em altura com plataforma elevatória — EPIs obrigatórios e área isolada"],
    impediments: [],
    clientRequests: [],
    pending: ["Continuidade da remoção das treliças e da desmontagem do forro nas próximas etapas"],
    nextDayPlan: ["Dar sequência à desmontagem do forro em drywall e à abertura estrutural do corredor."],
    executiveSummary:
      "1º dia (serviço noturno). Execução dos serviços de remoção das quatro treliças metálicas e desmontagem parcial do forro em drywall existente, visando a adequação arquitetônica do corredor para futura implantação de sancas iluminadas embutidas.",
    notes: "Serviço noturno (21h40 às 03h10) para não interferir na operação do shopping.",
    media: photos([
      { phase: "antes", caption: "Figura 1 — Posicionamento inicial da plataforma elevatória para início dos serviços." },
      { phase: "durante", caption: "Figura 2 — Inspeção técnica preliminar da área de intervenção." },
      { phase: "durante", caption: "Figura 3 — Supervisão operacional acompanhando a execução dos serviços." },
    ]),
    status: "aprovado",
  };

  const dia3: DailyReport = {
    ...shoppingBase(p.id, 3, "2026-05-07", "Lucas Vital"),
    team: [
      { name: "Leone", role: "Drywall e desmontagem estrutural", present: true },
      { name: "Reginaldo", role: "Assistência operacional", present: true },
      { name: "Lucas Vital", role: "Responsável / Supervisão operacional", present: true },
    ],
    activities: acts([
      { d: "Continuidade da desmontagem e proteção da área operacional." },
      { d: "Utilização da plataforma elevatória para execução dos serviços em altura." },
      { d: "Alteração da metodologia de retirada das placas de drywall." },
      { d: "Desmontagem completa do lado direito do corredor." },
      { d: "Ampliação da abertura estrutural e exposição total da infraestrutura superior." },
      { d: "Continuidade da instalação e ajuste da lona de contenção." },
      { d: "Organização e limpeza operacional da área." },
    ]),
    materials: items(["Placas de drywall (remoção)", "Lona de contenção"]),
    materialsRequested: [],
    equipment: items(["Plataforma elevatória"]),
    equipmentRequested: [],
    occurrences: [
      "Interrupção temporária das atividades devido à falta de energia elétrica.",
      "Paralisação operacional de aproximadamente 30 minutos.",
      "Serviços retomados normalmente após o restabelecimento da energia.",
    ],
    risks: ["Trabalho em altura com plataforma elevatória — EPIs utilizados; sem acidentes ou incidentes"],
    impediments: [],
    clientRequests: [],
    pending: ["Continuidade das adequações estruturais"],
    nextDayPlan: ["Prosseguir com a desmontagem estrutural e a adequação do corredor."],
    executiveSummary:
      "3º dia. Continuação da desmontagem do forro em drywall e avanço da abertura estrutural do corredor para adequação arquitetônica e futura instalação das sancas. Ao final, drywall lateral direito removido e estrutura superior totalmente exposta.",
    notes:
      "Observações técnicas: a nova metodologia de desmontagem proporcionou maior produtividade; o lado direito do drywall foi totalmente removido; a infraestrutura metálica e de iluminação ficou completamente exposta; não houve registro de acidentes ou incidentes; todos os colaboradores utilizaram EPIs adequados. Status: drywall lateral direito removido; estrutura superior totalmente exposta; abertura estrutural ampliada; área protegida e isolada; pronta para continuidade das adequações. Serviço noturno.",
    media: photos([
      { phase: "durante", caption: "Imagem 1 — Execução operacional da desmontagem estrutural (lado direito)." },
      { phase: "durante", caption: "Imagem 2 — Plataforma elevatória em operação na desmontagem em altura." },
      { phase: "depois", caption: "Imagem 3 — Estrutura superior exposta após a remoção do drywall." },
    ]),
    status: "aprovado",
  };

  const dia5: DailyReport = {
    ...shoppingBase(p.id, 5, "2026-05-13", "Lucas Vital"),
    arrival: "23:00", departure: "03:30",
    team: [
      { name: "Lucas Vital", role: "Responsável / Supervisão operacional", present: true },
      { name: "Italo", role: "Apoio operacional", present: true },
      { name: "William", role: "Apoio operacional", present: true },
      { name: "Bruno", role: "Apoio operacional", present: true },
      { name: "Leone", role: "Supervisão técnica inicial e orientação operacional", present: true },
    ],
    activities: acts([
      { d: "Retirada e reorganização das lonas de contenção operacional." },
      { d: "Continuidade da proteção dos quiosques e áreas inferiores." },
      { d: "Acesso técnico superior através da estrutura interna do forro." },
      { d: "Remoção parcial da estrutura metálica superior." },
      { d: "Corte e desmontagem da treliça metálica principal." },
      { d: "Remoção dos suportes estruturais e perfis metálicos." },
      { d: "Utilização da plataforma elevatória para execução dos trabalhos em altura." },
      { d: "Operação de corte metálico com ferramenta apropriada." },
      { d: "Ampliação do acesso estrutural central do corredor." },
      { d: "Organização operacional e contenção da área ao término da atividade." },
    ]),
    materials: items(["Lona de contenção", "Perfis/suportes metálicos (remoção)"]),
    materialsRequested: [],
    equipment: items(["Plataforma elevatória", "Equipamento de corte metálico"]),
    equipmentRequested: [],
    occurrences: [],
    risks: ["Corte metálico e desmontagem em altura — EPIs, plataforma elevatória e içamento; sem acidentes/incidentes"],
    impediments: [],
    clientRequests: [],
    pending: ["Continuidade da desmontagem estrutural em andamento"],
    nextDayPlan: ["Prosseguir com a remoção estrutural e a adequação arquitetônica do corredor."],
    executiveSummary:
      "5º dia de obra (serviço noturno, 23h00 às 03h30). Continuidade das adequações estruturais superiores com foco na remoção da treliça metálica, desmontagem de componentes estruturais e ampliação do acesso técnico da área central do corredor. Avanço significativo na remoção da estrutura metálica principal.",
    notes:
      "Observações técnicas: Leone compareceu no início da operação no alinhamento técnico e repasse das instruções à equipe; avanço significativo na remoção da estrutura metálica principal; a operação exigiu cortes metálicos e desmontagem controlada devido ao porte da estrutura; equipe executou com EPIs, plataforma elevatória e içamento operacional; sem acidentes/incidentes. Status: remoção da treliça metálica executada; estrutura superior ampliada; desmontagem em andamento; área isolada e protegida; avanço técnico da adequação concluído.",
    media: photos([
      { phase: "durante", caption: "Execução operacional — remoção e corte da treliça metálica principal." },
      { phase: "durante", caption: "Plataforma elevatória no acesso técnico superior do corredor." },
      { phase: "depois", caption: "Contenção e proteção da área ao término da atividade." },
    ]),
    status: "aprovado",
  };

  const dia10: DailyReport = {
    ...shoppingBase(p.id, 10, "2026-05-19", "Lucas Vital"),
    arrival: "23:00", departure: "02:00",
    team: [
      { name: "Lucas Vital", role: "Responsável / Supervisão operacional", present: true },
      { name: "Leone", role: "Serralheria e soldagem", present: true },
      { name: "Bruno", role: "Apoio operacional", present: true },
    ],
    activities: acts([
      { d: "Limpeza da área e organização do canteiro." },
      { d: "Serralheria: cortes e ajustes dimensionais dos perfis metálicos." },
      { d: "Soldagens estruturais para adequação dos perfis que receberão as chapas de drywall." },
      { d: "Montagem e preparação estrutural dos perfis metálicos destinados às sancas em drywall." },
      { d: "Separação e preparação dos materiais para continuidade da instalação." },
    ]),
    materials: items(["Perfis metálicos (preparação)", "Chapas de drywall (sancas)", "Insumos de solda"]),
    materialsRequested: [],
    equipment: items(["Equipamento de solda", "Serra/ferramenta de serralheria"]),
    equipmentRequested: [],
    occurrences: [],
    risks: ["Serralheria e soldagem — uso de EPIs, proteção contra fagulhas e organização do canteiro"],
    impediments: [],
    clientRequests: [],
    pending: ["Instalação das chapas de drywall nos perfis preparados (sancas)"],
    nextDayPlan: ["Iniciar a instalação do drywall nos perfis preparados para as sancas."],
    executiveSummary:
      "10º dia de obra (serviço noturno, 23h00 às 02h00). Executados serviços de limpeza, serralheria, montagem e preparação estrutural dos perfis metálicos destinados à instalação das sancas em drywall — cortes, ajustes dimensionais e soldagens dos perfis que receberão as chapas de drywall. Equipe reduzida em razão do desgaste físico, aproveitando o alto rendimento do dia anterior.",
    notes: "Serviço noturno. Preparação dos perfis para receber o drywall das sancas; separação dos materiais para continuidade da instalação.",
    media: photos([
      { phase: "durante", caption: "Preparação dos perfis metálicos (serralheria/soldagem) para as sancas." },
      { phase: "durante", caption: "Montagem e ajuste dos perfis no local da intervenção." },
    ]),
    status: "aprovado",
  };

  // Dia 17 — 28/05/2026 (real)
  const dia17: DailyReport = {
    ...shoppingBase(p.id, 17, "2026-05-28", "Alan"),
    arrival: "23:00", departure: "03:00",
    team: [
      { name: "Alan", role: "Encarregado", present: true },
      { name: "Equipe de desmontagem", role: "Montadores", present: true },
    ],
    activities: acts([
      { d: "Mobilização da equipe e posicionamento da plataforma elevatória tipo tesoura JLG." },
      { d: "Remoção integral do forro de gesso/drywall existente nos dois lados do corredor principal." },
      { d: "Continuidade da desmontagem dos elementos de fechamento existentes nos dois lados do corredor." },
      { d: "Retirada e segregação dos resíduos gerados pela desmontagem." },
      { d: "Remoção das luminárias existentes na área de intervenção, em apoio à operação do shopping." },
    ]),
    materials: items(["Placas de drywall (remoção)", "Luminárias removidas"]),
    materialsRequested: [],
    equipment: items(["Plataforma elevatória tipo tesoura JLG"]),
    equipmentRequested: [],
    occurrences: [],
    risks: ["Trabalho em altura sobre o corredor — isolamento e EPIs obrigatórios"],
    impediments: [],
    clientRequests: [],
    pending: ["Continuidade da desmontagem e adequação estrutural nos próximos trechos"],
    nextDayPlan: ["Dar sequência à desmontagem e adequação estrutural do corredor."],
    executiveSummary:
      "17º dia de execução. Concluída a retirada de todo o gesso/drywall compreendido entre a 3ª e a última treliça em ambos os lados do corredor principal, além da remoção das luminárias da área, liberando o trecho para as próximas etapas de desmontagem e adequação estrutural.",
    notes: "Serviço noturno (23h00 às 03h00). Local: Corredor Principal do Shopping.",
    media: photos([
      { phase: "durante", caption: "Registro Fotográfico 1 — remoção do forro de drywall no corredor principal." },
      { phase: "depois", caption: "Registro Fotográfico 2 — trecho liberado após a desmontagem (vista do corredor)." },
    ]),
    status: "pronto_revisao",
  };

  // Dias projetados (2, 4, 6–9, 11–16) — coerentes com a cronologia real da obra.
  // Responsável: Lucas Vital (apenas o 17º dia foi do Alan).
  const proj = (
    n: number, date: string, titulo: string,
    ats: string[], resumo: string, ph: { phase: MediaItem["phase"]; caption: string }[],
  ): DailyReport => ({
    ...shoppingBase(p.id, n, date, "Lucas Vital"),
    arrival: "23:00", departure: "03:00",
    siteCondition: `Corredor central — Shopping Vitória (serviço noturno) — ${titulo}`,
    team: [
      { name: "Lucas Vital", role: "Responsável / Supervisão operacional", present: true },
      { name: "Equipe RF", role: "Desmontagem / serralheria", present: true },
    ],
    activities: acts(ats.map((d) => ({ d }))),
    materials: items(["Placas de drywall / perfis metálicos"]),
    materialsRequested: [],
    equipment: items(["Plataforma elevatória"]),
    equipmentRequested: [],
    occurrences: [],
    risks: ["Trabalho em altura / serviço noturno — EPIs obrigatórios e área isolada"],
    impediments: [],
    clientRequests: [],
    pending: ["Continuidade conforme cronograma na próxima etapa"],
    nextDayPlan: ["Dar sequência às próximas etapas previstas."],
    executiveSummary: resumo,
    notes: "Serviço noturno, para não interferir na operação do shopping. (RDO consolidado a partir do registro da obra.)",
    media: photos(ph),
    status: "aprovado",
  });

  const projected: DailyReport[] = [
    proj(2, "2026-05-06", "Desmontagem do forro — lado esquerdo",
      ["Continuidade da desmontagem do forro em drywall do lado esquerdo do corredor.", "Reforço das lonas de contenção e proteção dos quiosques.", "Segregação e descida dos resíduos gerados."],
      "2º dia. Continuidade da desmontagem do forro em drywall (lado esquerdo), com reforço da contenção e proteção das áreas inferiores.",
      [{ phase: "durante", caption: "Desmontagem do forro no lado esquerdo do corredor." }, { phase: "durante", caption: "Reforço das lonas de contenção e proteção dos quiosques." }]),
    proj(4, "2026-05-12", "Remoção de perfis e ampliação da abertura",
      ["Remoção dos perfis metálicos remanescentes do forro.", "Ampliação da abertura estrutural do corredor.", "Organização e limpeza operacional da área."],
      "4º dia. Remoção dos perfis remanescentes do forro e ampliação da abertura estrutural, preparando a remoção das treliças metálicas.",
      [{ phase: "durante", caption: "Remoção dos perfis metálicos remanescentes." }, { phase: "durante", caption: "Ampliação da abertura estrutural do corredor." }]),
    proj(6, "2026-05-14", "Remoção da estrutura metálica superior",
      ["Continuidade da remoção da estrutura metálica superior.", "Corte e remoção de suportes estruturais e perfis.", "Içamento e descida de material com a plataforma."],
      "6º dia. Continuidade da remoção da estrutura metálica superior, com cortes e remoção de suportes.",
      [{ phase: "durante", caption: "Remoção da estrutura metálica superior." }, { phase: "durante", caption: "Corte e descida de perfis com a plataforma elevatória." }]),
    proj(7, "2026-05-15", "Remoção das treliças remanescentes",
      ["Remoção das treliças metálicas remanescentes.", "Limpeza dos pontos de corte e contenção da área.", "Organização operacional ao término da jornada."],
      "7º dia. Remoção das treliças metálicas remanescentes e limpeza dos pontos de corte.",
      [{ phase: "durante", caption: "Remoção das treliças metálicas remanescentes." }, { phase: "depois", caption: "Pontos de corte limpos e área contida." }]),
    proj(8, "2026-05-16", "Conclusão da remoção estrutural superior",
      ["Conclusão da remoção da estrutura metálica superior.", "Conferência do vão livre e do acesso técnico.", "Preparação da área para a etapa de serralheria."],
      "8º dia. Conclusão da remoção estrutural superior e conferência do vão livre para a etapa de serralheria.",
      [{ phase: "durante", caption: "Conclusão da remoção estrutural superior." }, { phase: "depois", caption: "Vão livre conferido para a serralheria." }]),
    proj(9, "2026-05-17", "Limpeza e levantamento de medidas",
      ["Limpeza geral e organização do canteiro.", "Levantamento das medidas para fabricação dos perfis das sancas.", "Separação de materiais e ferramentas para a serralheria."],
      "9º dia. Limpeza geral e levantamento das medidas para a fabricação dos perfis das sancas.",
      [{ phase: "durante", caption: "Limpeza geral e organização do canteiro." }, { phase: "durante", caption: "Levantamento de medidas para os perfis das sancas." }]),
    proj(11, "2026-05-20", "Instalação dos perfis das sancas",
      ["Instalação dos perfis metálicos preparados para as sancas.", "Conferência de alinhamento e nível dos perfis.", "Fixação e travamento da estrutura das sancas."],
      "11º dia. Instalação dos perfis metálicos preparados, iniciando a montagem da estrutura das sancas.",
      [{ phase: "durante", caption: "Instalação dos perfis metálicos das sancas." }, { phase: "durante", caption: "Conferência de alinhamento e nível dos perfis." }]),
    proj(12, "2026-05-21", "Fechamento em drywall das sancas",
      ["Fechamento em chapas de drywall na estrutura das sancas.", "Recorte e ajuste das chapas conforme o projeto.", "Conferência do desenho das sancas iluminadas."],
      "12º dia. Fechamento em drywall da estrutura das sancas, com recorte e ajuste das chapas.",
      [{ phase: "durante", caption: "Fechamento em drywall na estrutura das sancas." }, { phase: "durante", caption: "Recorte e ajuste das chapas conforme o projeto." }]),
    proj(13, "2026-05-22", "Tratamento de juntas e massa",
      ["Tratamento de juntas e fitas das chapas de drywall.", "Aplicação de massa para drywall nas emendas.", "Lixamento inicial das superfícies."],
      "13º dia. Tratamento de juntas, aplicação de massa e lixamento inicial das sancas em drywall.",
      [{ phase: "durante", caption: "Tratamento de juntas e fitas no drywall." }, { phase: "durante", caption: "Aplicação de massa nas emendas." }]),
    proj(14, "2026-05-23", "Acabamento das sancas",
      ["Lixamento final e acabamento das superfícies das sancas.", "Conferência do nivelamento e dos cantos.", "Preparação para a instalação da iluminação."],
      "14º dia. Acabamento das sancas em drywall e preparação para a iluminação embutida.",
      [{ phase: "durante", caption: "Lixamento final e acabamento das sancas." }, { phase: "depois", caption: "Sancas acabadas, prontas para iluminação." }]),
    proj(15, "2026-05-26", "Instalação da iluminação embutida",
      ["Instalação das fitas/luminárias embutidas nas sancas.", "Passagem e organização do cabeamento.", "Testes iniciais de acendimento."],
      "15º dia. Instalação da iluminação embutida nas sancas e testes iniciais de acendimento.",
      [{ phase: "durante", caption: "Instalação da iluminação embutida nas sancas." }, { phase: "durante", caption: "Passagem e organização do cabeamento." }]),
    proj(16, "2026-05-27", "Pintura e ajustes finais",
      ["Pintura das sancas e retoques no corredor.", "Ajustes finais de acabamento e limpeza.", "Conferência geral com a fiscalização."],
      "16º dia. Pintura das sancas, ajustes finais de acabamento e conferência com a fiscalização.",
      [{ phase: "durante", caption: "Pintura das sancas e retoques no corredor." }, { phase: "depois", caption: "Acabamento final conferido com a fiscalização." }]),
  ];

  return [dia1, dia3, dia5, dia10, dia17, ...projected].sort((a, b) => a.number - b.number);
}

/* Gerador sintético antigo desativado — substituído pelos RDOs reais acima.
function _legacyDrywallUnused() {
  const days: DrywallDayLegacy[] = [
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
*/

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
