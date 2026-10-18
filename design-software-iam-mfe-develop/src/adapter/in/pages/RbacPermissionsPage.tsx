import { useEffect, useMemo, useState } from "react";
import type { RbacCatalogPort } from "../../../application/ports/RbacCatalogPort";
import { useRbacCatalog } from "../../../application/rbac/useRbacCatalog";
import { useRoleFeatures } from "../../../application/rbac/useRoleFeatures";
import styles from "./RbacPermissionsPage.module.css";

type Props = {
  api: RbacCatalogPort;
  demoMode?: boolean;
};

export function RbacPermissionsPage({ api, demoMode = false }: Props) {
  const {
    modules,
    roles,
    loading: catalogLoading,
    error: catalogError,
    reload: reloadCatalog
  } = useRbacCatalog(api, true);

  const [selectedRoleId, setSelectedRoleId] = useState("");

  useEffect(() => {
    if (roles.length === 0) {
      setSelectedRoleId("");
      return;
    }

    if (!roles.some((role) => role.id === selectedRoleId)) {
      setSelectedRoleId(roles[0].id);
    }
  }, [roles, selectedRoleId]);

  const {
    features: roleFeatures,
    loading: featuresLoading,
    error: featuresError,
    reload: reloadFeatures
  } = useRoleFeatures(api, selectedRoleId || null, Boolean(selectedRoleId));

  const assignmentsByCode = useMemo(() => {
    const assignments = new Map<
      string,
      typeof roleFeatures
    >();

    for (const assignment of roleFeatures) {
      const current = assignments.get(assignment.feature_code) ?? [];
      assignments.set(assignment.feature_code, [...current, assignment]);
    }

    return assignments;
  }, [roleFeatures]);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Administración de acceso</p>
          <h1>RBAC — roles y permisos</h1>
          <p className={styles.description}>
            Consulta los módulos, sus funcionalidades y los permisos asignados
            a cada rol.
          </p>
        </div>
        <span className={styles.readOnlyBadge}>Solo lectura</span>
      </header>

      {demoMode && (
        <p className={styles.demoBanner} role="note">
          DEMO local: datos en memoria, sin conexión con backend y sin guardar cambios.
          Los datos se reinician al recargar.
        </p>
      )}

      <section className={styles.rolePanel} aria-label="Selección de rol">
        <label htmlFor="rbac-role">Rol</label>
        <select
          id="rbac-role"
          value={selectedRoleId}
          onChange={(event) => setSelectedRoleId(event.target.value)}
          disabled={catalogLoading || roles.length === 0}
        >
          {roles.length === 0 ? (
            <option value="">No hay roles disponibles</option>
          ) : (
            roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.display_name} ({role.name})
              </option>
            ))
          )}
        </select>
        {selectedRoleId && (
          <p className={styles.roleDescription}>
            {roles.find((role) => role.id === selectedRoleId)?.description ||
              "Sin descripción para este rol."}
          </p>
        )}
      </section>

      {catalogLoading && (
        <p className={styles.message} role="status">
          Cargando módulos y roles…
        </p>
      )}

      {catalogError && (
        <div className={styles.error} role="alert">
          <p>{catalogError}</p>
          <button type="button" onClick={reloadCatalog}>
            Reintentar
          </button>
        </div>
      )}

      {!catalogLoading && !catalogError && roles.length === 0 && (
        <p className={styles.message}>El catálogo no contiene roles.</p>
      )}

      {featuresLoading && (
        <p className={styles.message} role="status">
          Cargando permisos del rol…
        </p>
      )}

      {featuresError && (
        <div className={styles.error} role="alert">
          <p>{featuresError}</p>
          <button type="button" onClick={reloadFeatures}>
            Reintentar
          </button>
        </div>
      )}

      {!catalogLoading &&
        !catalogError &&
        modules.map((module) => (
          <section className={styles.moduleCard} key={module.code}>
            <div className={styles.moduleHeading}>
              <div>
                <h2>{module.name}</h2>
                {module.description && <p>{module.description}</p>}
              </div>
              <span className={styles.moduleCode}>{module.code}</span>
            </div>

            {module.features.length === 0 ? (
              <p className={styles.message}>
                Este módulo no tiene funcionalidades en el catálogo.
              </p>
            ) : (
              <div className={styles.tableWrapper}>
                <table>
                  <caption className={styles.visuallyHidden}>
                    Funcionalidades y permisos de {module.name}
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Funcionalidad</th>
                      <th scope="col">Acción</th>
                      <th scope="col">Alcance asignado</th>
                      <th scope="col">Estado en el rol</th>
                    </tr>
                  </thead>
                  <tbody>
                    {module.features.map((feature) => {
                      const assignments =
                        assignmentsByCode.get(feature.code) ?? [];

                      return (
                        <tr key={feature.code}>
                          <td>
                            <strong>{feature.name}</strong>
                            <span className={styles.featureCode}>
                              {feature.code}
                            </span>
                          </td>
                          <td>{feature.action_level}</td>
                          <td>
                            {assignments.length > 0
                              ? assignments
                                  .map((assignment) => assignment.scope_type)
                                  .join(", ")
                              : "—"}
                          </td>
                          <td>
                            <span
                              className={
                                assignments.length > 0
                                  ? styles.assigned
                                  : styles.unassigned
                              }
                            >
                              {assignments.length > 0
                                ? "Asignada"
                                : "No asignada"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ))}

      <p className={styles.readOnlyNote}>
        {demoMode
          ? "Los registros visibles son datos de ejemplo en memoria. La edición no está disponible porque el contrato actual no define una operación de escritura para features por rol."
          : "Esta pantalla consulta los módulos y features del catálogo, y las features asignadas al rol. La edición no está disponible porque el contrato actual no define una operación de escritura para features por rol."}
      </p>
    </main>
  );
}
