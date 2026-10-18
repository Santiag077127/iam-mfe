import type { RbacCatalogPort } from "../application/ports/RbacCatalogPort";
import type { UserAdministrationPort } from "../application/ports/UserAdministrationPort";

export interface IamMfeProps {
  basePath?: string;

  /**
   * Provisional: reemplazar por el contrato oficial del frontend-platform
   * cuando ese repositorio esté disponible.
   */
  userAdministration?: UserAdministrationPort;

  /**
   * El shell valida el permiso de administración de usuarios.
   * La ruta también debe estar protegida antes de montar este MFE.
   */
  canManageUsers?: boolean;

  /**
   * HU-IAM-016: el shell inyecta el puerto de lectura RBAC
   * usando su cliente autenticado.
   */
  rbacCatalog?: RbacCatalogPort;

  /**
   * Autorización de lectura RBAC confirmada por el shell.
   * Debe ser false si no hay permiso o no se puede verificar.
   */
  canViewRoleConfig?: boolean;
}