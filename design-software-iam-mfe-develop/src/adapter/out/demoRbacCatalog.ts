import type {
  RbacCatalogPort,
  RbacFeature,
  RbacModule,
  RbacRole,
  RbacRoleFeature
} from "../../application/ports/RbacCatalogPort";

const systemAdminId = "00000000-0000-4000-8000-000000000016";
const auditorId = "00000000-0000-4000-8000-000000000017";

const modules: RbacModule[] = [
  {
    code: "IAM",
    name: "Identidad y acceso",
    description: "Módulo de ejemplo para la consulta RBAC.",
    display_order: 1,
    features: [
      {
        code: "IDENTITY_ROLE_VIEW",
        name: "Consultar roles y permisos",
        action_level: "READ",
        scope_type: "GLOBAL",
        description: "Permite consultar la configuración RBAC."
      }
    ]
  }
];

const roles: RbacRole[] = [
  {
    id: systemAdminId,
    name: "SYSTEM_ADMIN",
    display_name: "Administrador del sistema",
    description: "Rol de ejemplo para la demostración.",
    is_system_role: true,
    created_at: "2026-01-01T00:00:00.000Z"
  },
  {
    id: auditorId,
    name: "AUDITOR",
    display_name: "Auditor",
    description: "Rol de ejemplo sin esta feature asignada.",
    is_system_role: true,
    created_at: "2026-01-01T00:00:00.000Z"
  }
];

const roleFeaturesById: Record<string, RbacRoleFeature[]> = {
  [systemAdminId]: [
    {
      feature_code: "IDENTITY_ROLE_VIEW",
      feature_name: "Consultar roles y permisos",
      action_level: "READ",
      scope_type: "GLOBAL"
    }
  ],
  [auditorId]: []
};

function copyFeature(feature: RbacFeature): RbacFeature {
  return { ...feature };
}

export function createDemoRbacCatalog(): RbacCatalogPort {
  return {
    async listModules() {
      return modules.map((module) => ({
        ...module,
        features: module.features.map(copyFeature)
      }));
    },

    async listRoles() {
      return roles.map((role) => ({ ...role }));
    },

    async listRoleFeatures(roleId) {
      return (roleFeaturesById[roleId] ?? []).map((feature) => ({ ...feature }));
    }
  };
}