import type { User, ID } from "./types";

/**
 * Modelo de acesso POR OBRA — nunca global.
 *
 * O aplicativo é sempre completo para qualquer pessoa: todo usuário pode criar
 * suas próprias obras, lançar RDOs, subir fotos e usar todos os módulos. O fato
 * de alguém ter sido adicionado como contratante (ou membro sem edição) de UMA
 * obra não pode capar o app inteiro dele.
 *
 * Uma obra específica fica em modo "somente acompanhamento" quando o usuário foi
 * vinculado a ela como contratante — ou seja, ela consta em user.clientProjectIds.
 * Nesse caso ele visualiza, comenta e aprova/assina aquela obra, mas não a edita.
 * As obras próprias (que não estão nessa lista) permanecem totalmente editáveis.
 */
export function isWatchedProject(user: Pick<User, "clientProjectIds">, projectId: ID | undefined | null): boolean {
  if (!projectId) return false;
  const watched = user.clientProjectIds;
  // clientProjectIds indefinido = usuário sem vínculos de contratante (edita tudo).
  return Array.isArray(watched) && watched.includes(projectId);
}

/** Pode editar a obra quando NÃO é apenas um acompanhamento de contratante. */
export function canEditProject(user: Pick<User, "clientProjectIds">, projectId: ID | undefined | null): boolean {
  return !isWatchedProject(user, projectId);
}
