/**
 * Agregado raiz (thin) do contexto Identidade.
 *
 * Firebase é a source of truth da autenticação — esta entidade carrega apenas o
 * recorte do usuário que o domínio precisa, sem nenhum tipo vindo de libs externas.
 */
export interface AuthenticatedUser {
  readonly uid: string;
  readonly email: string | null;
  readonly displayName: string | null;
  /** Provedor que originou a sessão (ex.: `google.com`, `password`). */
  readonly provider: string;
}
