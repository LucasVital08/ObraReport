// Modelo de dados do ObraReport IA
// Local-first: tudo é persistido em localStorage via store, mas a modelagem
// reflete as tabelas previstas para o Supabase/PostgreSQL.

export type ID = string;

export type Role =
  | "owner" // Dono da empresa
  | "admin" // Administrador
  | "supervisor" // Supervisor de obra
  | "member" // Membro da equipe
  | "client"; // Cliente / contratante

export const ROLE_LABELS: Record<Role, string> = {
  owner: "Dono da empresa",
  admin: "Administrador",
  supervisor: "Supervisor de obra",
  member: "Membro da equipe",
  client: "Cliente / contratante",
};

export interface User {
  id: ID;
  name: string;
  email: string;
  role: Role;
  avatarColor?: string;
  companyId: ID;
  // Quando o usuário é um contratante (role "client"), lista as obras que ele
  // pode acompanhar. Para owner/admin fica indefinido (enxerga tudo).
  clientProjectIds?: ID[];
}

export type PlanId = "free" | "basico" | "profissional" | "empresa";

// ===== Multi-empresa (em desenvolvimento na branch claude/multi-empresa) =====
// Um perfil pode pertencer a VÁRIAS empresas (memberships). As obras pertencem a
// empresas. O acesso a uma obra vem de: (a) ser membro interno da empresa
// (vê/edita todas as obras) OU (b) ter acesso à obra específica (project_member),
// como "view" (acompanha) ou "edit" (edita/cria RDO só naquela obra).
export type CompanyRole = "owner" | "admin" | "supervisor" | "member";
export type ProjectPermission = "view" | "edit";

export interface Membership {
  id: ID;
  userId: ID;
  companyId: ID;
  companyName?: string;
  role: CompanyRole;
  createdAt: string;
}

export interface ProjectMember {
  id: ID;
  companyId: ID;
  projectId: ID;
  userId: ID;
  permission: ProjectPermission;
  createdAt: string;
}

// Visibilidade do RDO para o contratante (papel "client"). Cada flag = a seção
// é COMPARTILHADA com o contratante. O time interno sempre vê tudo. O padrão
// (DEFAULT_CLIENT_VISIBILITY em src/lib/visibility.ts) esconde o que é sensível.
export interface ClientVisibility {
  equipe: boolean; // Equipe e presença (faltas/atrasos)
  ocorrencias: boolean; // Ocorrências, impedimentos e riscos
  pendencias: boolean; // Pendências + observações internas (notes)
  gastos: boolean; // Gastos + materiais/equipamentos solicitados (faltantes)
}

export interface Company {
  id: ID;
  name: string;
  logoText: string; // iniciais para logo simulada
  logoUrl?: string; // logo da empresa (data URL) — sai no PDF e no topo
  brandColor: string;
  plan: PlanId;
  document?: string;
  city?: string;
  createdAt: string;
  clientVisibility?: ClientVisibility;
}

export type ProjectStatus =
  | "planejamento"
  | "em_andamento"
  | "pausada"
  | "aguardando_material"
  | "aguardando_cliente"
  | "em_vistoria"
  | "concluida"
  | "entregue"
  | "cancelada";

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  planejamento: "Planejamento",
  em_andamento: "Em andamento",
  pausada: "Pausada",
  aguardando_material: "Aguardando material",
  aguardando_cliente: "Aguardando cliente",
  em_vistoria: "Em vistoria",
  concluida: "Concluída",
  entregue: "Entregue",
  cancelada: "Cancelada",
};

export interface Project {
  id: ID;
  companyId: ID;
  name: string;
  client: string;
  clientContactId?: ID;
  address: string;
  technicalLead: string;
  supervisor: string;
  startDate: string;
  expectedEndDate: string;
  realEndDate?: string;
  status: ProjectStatus;
  budget?: number;
  description: string;
  coverColor: string;
  createdAt: string;
}

// ---- RDO (Relatório Diário de Obra) ----

export type RdoStatus =
  | "rascunho"
  | "incompleto"
  | "pronto_revisao"
  | "enviado"
  | "assinado"
  | "aprovado"
  | "rejeitado"
  | "arquivado";

export const RDO_STATUS_LABELS: Record<RdoStatus, string> = {
  rascunho: "Rascunho",
  incompleto: "Incompleto",
  pronto_revisao: "Pronto para revisão",
  enviado: "Enviado",
  assinado: "Assinado",
  aprovado: "Aprovado",
  rejeitado: "Rejeitado",
  arquivado: "Arquivado",
};

export type ActivityStatus = "concluida" | "parcial" | "nao_executada";

export interface RdoActivity {
  id: ID;
  description: string;
  status: ActivityStatus;
  note?: string;
}

export interface RdoTeamEntry {
  name: string;
  role?: string;
  present: boolean;
}

export interface RdoItem {
  id: ID;
  name: string;
  quantity?: string;
  note?: string;
  status?: string;
}

export type ProvidenciaPriority = "Alta" | "Média" | "Baixa";

// Solicitação/providência estruturada (coluna do PDF: Solicitação | Responsável | Prioridade)
export interface Providencia {
  description: string;
  responsible: string;
  priority: ProvidenciaPriority;
}

// Comentário/observação feito sobre um RDO (ex.: o contratante comenta o que
// foi lançado pelo contratado, criando uma conversa anexada ao relatório).
export interface RdoComment {
  id: ID;
  authorName: string;
  authorRole: Role;
  text: string;
  createdAt: string;
}

export interface Signature {
  id: ID;
  role: "supervisor" | "cliente" | "responsavel" | "testemunha";
  name: string;
  document?: string;
  dataUrl: string; // assinatura desenhada (png base64)
  signedAt: string;
  accepted: boolean;
}

export type MediaPhase = "antes" | "durante" | "depois";
export type MediaKind = "photo" | "video";

export interface MediaItem {
  id: ID;
  kind: MediaKind;
  phase: MediaPhase;
  caption: string;
  // imagem placeholder gerada (gradiente) ou dataURL real
  color?: string;
  dataUrl?: string;
  author?: string;
  createdAt: string;
  includeInPdf: boolean;
}

export interface DailyReport {
  id: ID;
  companyId: ID;
  projectId: ID;
  number: number;
  date: string;
  responsible: string;
  supervisor: string;
  arrival?: string;
  departure?: string;
  weather?: string;
  siteCondition?: string;
  team: RdoTeamEntry[];
  activities: RdoActivity[];
  materials: RdoItem[];
  materialsRequested: RdoItem[];
  equipment: RdoItem[];
  equipmentRequested: RdoItem[];
  occurrences: string[];
  risks: string[];
  impediments: string[];
  clientRequests: string[];
  // Solicitações e providências com responsável e prioridade (opcional;
  // quando ausente, o PDF usa clientRequests como fallback)
  providencias?: Providencia[];
  pending: string[];
  nextDayPlan: string[];
  executiveSummary: string;
  notes: string;
  media: MediaItem[];
  expenses: Expense[];
  // Observações/comentários (ex.: do contratante) anexados ao RDO
  comments?: RdoComment[];
  signatures: Signature[];
  status: RdoStatus;
  createMode: "voz" | "texto" | "perguntas" | "manual";
  rawInput?: string; // texto/transcrição original
  createdAt: string;
  updatedAt: string;
}

// ---- Tarefas ----
export type TaskStatus =
  | "a_fazer"
  | "em_andamento"
  | "aguardando_material"
  | "aguardando_aprovacao"
  | "concluido"
  | "cancelado";

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  a_fazer: "A fazer",
  em_andamento: "Em andamento",
  aguardando_material: "Aguardando material",
  aguardando_aprovacao: "Aguardando aprovação",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

export type Priority = "baixa" | "media" | "alta" | "urgente";

export interface Task {
  id: ID;
  companyId: ID;
  projectId: ID;
  title: string;
  description: string;
  assignee: string;
  priority: Priority;
  dueDate?: string;
  status: TaskStatus;
  createdAt: string;
}

// ---- Equipe / Ponto ----
export interface TeamMember {
  id: ID;
  companyId: ID;
  name: string;
  role: string;
  phone?: string;
  email?: string;
  document?: string;
  active: boolean;
  projectId?: ID;
}

export interface TimeCard {
  id: ID;
  companyId: ID;
  projectId: ID;
  memberName: string;
  date: string;
  checkIn: string;
  checkOut: string;
  breakMinutes: number;
  note?: string;
}

// ---- Materiais ----
export type MaterialStatus =
  | "solicitado"
  | "comprado"
  | "entregue"
  | "usado"
  | "devolvido"
  | "pendente";

export interface Material {
  id: ID;
  companyId: ID;
  projectId: ID;
  name: string;
  unit: string;
  quantityUsed?: number;
  quantityRequested?: number;
  supplier?: string;
  estimatedValue?: number;
  status: MaterialStatus;
}

// ---- Equipamentos ----
export type EquipmentStatus =
  | "disponivel"
  | "em_uso"
  | "manutencao"
  | "devolvido"
  | "perdido"
  | "danificado";

export interface Equipment {
  id: ID;
  companyId: ID;
  projectId: ID;
  name: string;
  type: string;
  responsible?: string;
  pickupDate?: string;
  returnDate?: string;
  conditionOut?: string;
  conditionIn?: string;
  note?: string;
  status: EquipmentStatus;
}

// ---- Checklists ----
export interface ChecklistItem {
  id: ID;
  label: string;
  checked: boolean;
  note?: string;
}

export interface Checklist {
  id: ID;
  companyId: ID;
  projectId: ID;
  title: string;
  template: string;
  responsible: string;
  date: string;
  items: ChecklistItem[];
  status: "aberto" | "concluido";
}

// ---- Ocorrências ----
export type IncidentSeverity = "baixa" | "media" | "alta" | "critica";
export type IncidentStatus = "aberta" | "em_andamento" | "resolvida";

export interface Incident {
  id: ID;
  companyId: ID;
  projectId: ID;
  title: string;
  category: string;
  severity: IncidentSeverity;
  description: string;
  responsible?: string;
  status: IncidentStatus;
  proposedSolution?: string;
  resolvedAt?: string;
  createdAt: string;
}

// ---- Gastos ----
export interface Expense {
  id: ID;
  companyId: ID;
  projectId: ID;
  rdoId?: ID;
  date: string;
  category: string;
  description: string;
  amount: number;
  paymentMethod: string;
  responsible: string;
  hasReceipt: boolean;
  note?: string;
}

export const EXPENSE_CATEGORIES = [
  "alimentação",
  "gasolina",
  "ferramenta",
  "material",
  "transporte",
  "diária",
  "hospedagem",
  "equipamento",
  "locação",
  "emergência",
  "pedágio",
  "estacionamento",
  "outros",
] as const;

// ---- Documentos do projeto (importados, ex.: PDFs prontos) ----
export interface ProjectDocument {
  id: ID;
  companyId: ID;
  projectId: ID;
  name: string;
  mimeType: string;
  size: number; // bytes
  dataUrl: string; // conteúdo em base64 (data URL)
  uploadedAt: string;
}

// ---- Contatos ----
export interface Contact {
  id: ID;
  companyId: ID;
  name: string;
  type: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  company?: string;
  address?: string;
  note?: string;
}

// ---- Relatório final ----
export interface FinalReport {
  id: ID;
  companyId: ID;
  projectId: ID;
  generatedAt: string;
  executiveSummary: string;
  technicalConclusion: string;
  recommendations: string[];
  options: {
    includeExpenses: boolean;
    includeVideos: boolean;
    includeInternalOccurrences: boolean;
    onlySelectedPhotos: boolean;
  };
}

// ---- Estrutura de saída da IA ----
export interface AiActivity {
  descricao: string;
  status?: "concluida" | "parcial" | "nao_executada";
}

export interface AiRdoResult {
  resumo_executivo: string;
  clima: string;
  condicao_canteiro: string;
  horarios: { chegada?: string; saida?: string };
  equipe_presente: { name: string; role?: string }[];
  atividades_executadas: AiActivity[];
  materiais_utilizados: string[];
  materiais_solicitados: string[];
  equipamentos_utilizados: string[];
  ocorrencias: string[];
  impedimentos: string[];
  riscos: string[];
  solicitacoes: string[];
  gastos: { description: string; amount?: number; category?: string }[];
  pendencias: string[];
  plano_proximo_dia: string[];
  observacoes_tecnicas: string;
  campos_faltantes: string[];
  perguntas_complementares: string[];
}

export interface AiFinalResult {
  resumo_geral_da_obra: string;
  periodo_execucao: string;
  principais_servicos: string[];
  linha_do_tempo: { date: string; resumo: string }[];
  pendencias_resolvidas: string[];
  pendencias_abertas: string[];
  ocorrencias_relevantes: string[];
  materiais_relevantes: string[];
  equipamentos_relevantes: string[];
  gastos_resumidos: { category: string; total: number }[];
  conclusao_tecnica: string;
  recomendacoes: string[];
}
