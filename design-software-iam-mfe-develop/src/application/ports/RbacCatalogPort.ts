import type { components } from "../../contracts/generated/iam";

export type RbacModule = components["schemas"]["Module"];
export type RbacFeature = components["schemas"]["Feature"];
export type RbacRole = components["schemas"]["Role"];
export type RbacRoleFeature = components["schemas"]["RoleFeature"];

/**
 * HU-IAM-016: catálogo RBAC de solo lectura.
 * El contrato actual no expone mutaciones de features por rol.
 */
export interface RbacCatalogPort {
  listModules(): Promise<RbacModule[]>;
  listRoles(): Promise<RbacRole[]>;
  listRoleFeatures(roleId: string): Promise<RbacRoleFeature[]>;
}