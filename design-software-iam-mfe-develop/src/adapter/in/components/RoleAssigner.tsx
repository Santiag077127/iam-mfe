import { useState, type FormEvent } from "react";
import type { RoleOption, UserRole } from "../../../domain/userAdministration";
import styles from "../pages/UsersPage.module.css";

type RoleAssignerProps = {
  roles: RoleOption[];
  assignedRoles: UserRole[];
  loading: boolean;
  error?: string | null;
  submitting: boolean;
  onCancel: () => void;
  onAssign: (roleName: string, trainingCenterId?: string) => Promise<void>;
  onRevoke: (roleName: string) => Promise<void>;
};

export function RoleAssigner({
  roles,
  assignedRoles,
  loading,
  error,
  submitting,
  onCancel,
  onAssign,
  onRevoke
}: RoleAssignerProps) {
  const [roleName, setRoleName] = useState("");
  const [trainingCenterId, setTrainingCenterId] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (roleName) await onAssign(roleName, trainingCenterId.trim() || undefined);
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      {error && <p className={styles.formError} role="alert">{error}</p>}
      <label className={styles.field}>
        <span>Rol</span>
        <select
          value={roleName}
          onChange={(event) => setRoleName(event.target.value)}
          required
          disabled={loading || roles.length === 0}
        >
          <option value="">Selecciona un rol</option>
          {roles.map((role) => (
            <option key={role.name} value={role.name}>
              {role.name}{role.description ? " — " + role.description : ""}
            </option>
          ))}
        </select>
      </label>
      <label className={styles.field}>
        <span>ID del centro de formación (opcional)</span>
        <input
          value={trainingCenterId}
          onChange={(event) => setTrainingCenterId(event.target.value)}
          placeholder="UUID del centro"
          autoComplete="off"
        />
      </label>
      <p className={styles.formHint}>
        La búsqueda de centros desde Reference Data debe conectarse al catálogo oficial cuando esté disponible en el MFE.
      </p>
      {loading && <p className={styles.formHint}>Cargando roles…</p>}
      {!loading && roles.length === 0 && !error && (
        <p className={styles.formHint}>No hay roles disponibles para asignar.</p>
      )}
      <p className={styles.formHint}>
        La revocación de roles asociados a un centro requiere confirmación del contrato backend.
      </p>
      <section className={styles.assignedRoles} aria-labelledby="assigned-roles-title">
        <h3 id="assigned-roles-title">Roles asignados</h3>
        {assignedRoles.length === 0 ? (
          <p className={styles.formHint}>El listado backend no informó roles asignados para este usuario.</p>
        ) : (
          <ul>
            {assignedRoles.map((role) => (
              <li key={role.role_name + "-" + (role.training_center_id ?? "global")}>
                <span>
                  <strong>{role.role_name}</strong>
                  <small>{role.training_center_id ? "Asignado a un centro" : "Asignación global"}</small>
                </span>
                {role.training_center_id ? (
                  <span className={styles.unavailable}>Revocación por centro pendiente</span>
                ) : (
                  <button
                    className={styles.buttonDanger}
                    type="button"
                    disabled={submitting}
                    onClick={() => onRevoke(role.role_name)}
                  >
                    Revocar
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
      <div className={styles.modalActions}>
        <button className={styles.buttonSecondary} type="button" onClick={onCancel} disabled={submitting}>
          Cancelar
        </button>
        <button className={styles.buttonPrimary} type="submit" disabled={submitting || !roleName}>
          {submitting ? "Asignando…" : "Asignar rol"}
        </button>
      </div>
    </form>
  );
}
