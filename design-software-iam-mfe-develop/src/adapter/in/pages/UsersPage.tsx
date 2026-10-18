import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  KeyRound,
  Pencil,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  X
} from "lucide-react";
import type {
  CreateUserInput,
  ManagedUser,
  UpdateUserInput,
  UserFormErrors,
  UserStatusFilter
} from "../../../domain/userAdministration";
import { toActiveFilter } from "../../../domain/userAdministration";
import { useAssignRole } from "../../../application/useAssignRole";
import { useCreateUser } from "../../../application/useCreateUser";
import { useDeactivateUser } from "../../../application/useDeactivateUser";
import { useRoles } from "../../../application/useRoles";
import { useSessions } from "../../../application/useSessions";
import { useUpdateUser } from "../../../application/useUpdateUser";
import { useUsers } from "../../../application/useUsers";
import type { UserAdministrationPort } from "../../../application/ports/UserAdministrationPort";
import { EditUserForm } from "../components/EditUserForm";
import { RoleAssigner } from "../components/RoleAssigner";
import { UserForm } from "../components/UserForm";
import styles from "./UsersPage.module.css";
type UsersPageProps = {
  api?: UserAdministrationPort;
};
type DialogState =
  | { kind: "create" }
  | { kind: "edit"; user: ManagedUser }
  | { kind: "roles"; user: ManagedUser }
  | { kind: "sessions"; user: ManagedUser }
  | { kind: "deactivate"; user: ManagedUser }
  | null;
const PAGE_SIZE = 10;
function actorLabel(type: ManagedUser["actor_type"]) {
  if (type === "INSTRUCTOR") return "Instructor";
  if (type === "LEARNER") return "Aprendiz";
  return "Usuario";
}
export function UsersPage({ api }: UsersPageProps) {
  const [status, setStatus] = useState<UserStatusFilter>("all");
  const [pageNumber, setPageNumber] = useState(1);
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState<DialogState>(null);
  const [sessionToClose, setSessionToClose] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<UserFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const query = useMemo(
    () => ({
      page: pageNumber,
      page_size: PAGE_SIZE,
      is_active: toActiveFilter(status),
      search: search.trim() || undefined
    }),
    [pageNumber, search, status]
  );
  const users = useUsers(api, query);
  const createUser = useCreateUser(api);
  const updateUser = useUpdateUser(api);
  const roleAssigner = useAssignRole(api);
  const deactivateUser = useDeactivateUser(api);
  const roles = useRoles(api, dialog?.kind === "roles");
  const sessions = useSessions(api, dialog?.kind === "sessions" ? dialog.user.id : null);
  const visibleUsers = users.page?.items ?? [];
  async function handleCreate(input: CreateUserInput) {
    setFieldErrors({});
    setFormError(null);
    const result = await createUser.create(input);
    if (result.errors) {
      setFieldErrors(result.errors);
      return;
    }
    if (result.formError) {
      setFormError(result.formError);
      return;
    }
    setDialog(null);
    setNotice("Cuenta IAM creada. La creación del perfil de actor puede tardar unos instantes.");
    setPageNumber(1);
    users.refresh();
  }
  async function handleUpdate(input: UpdateUserInput) {
    if (dialog?.kind !== "edit") return;
    const succeeded = await updateUser.update(dialog.user.id, input);
    if (succeeded) {
      setDialog(null);
      setNotice("Usuario actualizado correctamente.");
      users.refresh();
    }
  }
  async function handleAssign(roleName: string, trainingCenterId?: string) {
    if (dialog?.kind !== "roles") return;
    const succeeded = await roleAssigner.assign(dialog.user.id, {
      role_name: roleName,
      ...(trainingCenterId ? { training_center_id: trainingCenterId } : {})
    });
    if (succeeded) {
      setDialog(null);
      setNotice("Rol asignado correctamente.");
      users.refresh();
    }
  }
  async function handleRevoke(roleName: string) {
    if (dialog?.kind !== "roles") return;
    const succeeded = await roleAssigner.revokeGlobal(dialog.user.id, roleName);
    if (succeeded) {
      setDialog(null);
      setNotice("Rol global revocado correctamente.");
      users.refresh();
    }
  }
  async function handleDeactivate() {
    if (dialog?.kind !== "deactivate") return;
    const succeeded = await deactivateUser.deactivate(dialog.user.id);
    if (succeeded) {
      setDialog(null);
      setNotice("Usuario desactivado. La fila se conserva y puede consultarse con el filtro Inactivos.");
      users.refresh();
    }
  }
  const totalPages = users.page ? Math.max(1, Math.ceil(users.page.total / users.page.page_size)) : 1;
  return (
    <main className={styles.page} data-mfe="iam">
      <div className={styles.content}>
        <header className={styles.pageHeader}>
          <div>
            <p className={styles.eyebrow}>IAM / Usuarios</p>
            <h1>Administración de usuarios</h1>
            <p className={styles.subtitle}>Crea cuentas y administra roles y sesiones de acceso.</p>
          </div>
          <button
            className={styles.buttonPrimary}
            type="button"
            onClick={() => {
              setFieldErrors({});
              setFormError(null);
              setDialog({ kind: "create" });
            }}
            disabled={!api}
          >
            <span className={styles.buttonPlus} aria-hidden="true">
              +
            </span>
            Nuevo usuario
          </button>
        </header>
        {notice && (
          <div className={styles.notice} role="status">
            <span>{notice}</span>
            <button className={styles.iconButton} type="button" aria-label="Cerrar mensaje" onClick={() => setNotice(null)}>
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        )}
        {!api && (
          <div className={styles.integrationNotice} role="status">
            <AlertCircle size={20} aria-hidden="true" />
            <div>
              <strong>Integración backend pendiente</strong>
              <p>La pantalla está preparada, pero el MFE aún no recibe el cliente oficial de frontend-platform.</p>
            </div>
          </div>
        )}
        <section className={styles.panel} aria-labelledby="users-heading">
          <div className={styles.panelHeader}>
            <div>
              <h2 id="users-heading">Usuarios</h2>
              <p>{users.page ? users.page.total + " registros" : "Listado de cuentas IAM"}</p>
            </div>
            <button className={styles.iconButton} type="button" onClick={users.refresh} disabled={!api || users.loading} aria-label="Actualizar listado">
              <RefreshCw size={17} aria-hidden="true" />
            </button>
          </div>
          <div className={styles.filters}>
            <label className={styles.searchField}>
              <Search size={17} aria-hidden="true" />
              <span className={styles.srOnly}>Buscar usuarios en todas las páginas</span>
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPageNumber(1);
                }}
                placeholder="Buscar por nombre o correo"
                disabled={!api}
              />
            </label>
            <label className={styles.statusFilter}>
              <span>Estado</span>
              <select
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value as UserStatusFilter);
                  setPageNumber(1);
                }}
              >
                <option value="all">Todos</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </select>
            </label>
          </div>
          {users.error ? (
            <div className={styles.stateMessage} role="alert">
              <AlertCircle size={20} aria-hidden="true" />
              <span>{users.error}</span>
              {api && <button className={styles.buttonSecondary} type="button" onClick={users.refresh}>Reintentar</button>}
            </div>
          ) : users.loading ? (
            <div className={styles.stateMessage} role="status">Cargando usuarios…</div>
          ) : !visibleUsers.length ? (
            <div className={styles.emptyState}>
              <UserRound size={24} aria-hidden="true" />
              <strong>{search ? "No hay coincidencias en esta página" : "No hay usuarios para mostrar"}</strong>
              <span>{search ? "Prueba con otro nombre o correo." : "Cuando existan cuentas, aparecerán en este listado."}</span>
            </div>
          ) : (
            <div className={styles.tableScroller}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Usuario</th>
                    <th scope="col">Tipo</th>
                    <th scope="col">Roles asignados</th>
                    <th scope="col">Estado</th>
                    <th scope="col"><span className={styles.srOnly}>Acciones</span></th>
                  </tr>
                </thead>
                <tbody>
                  {visibleUsers.map((user) => (
                    <tr key={user.id}>
                      <td data-label="Usuario">
                        <div className={styles.userCell}>
                          <span className={styles.avatar} aria-hidden="true">
                            {user.first_name.slice(0, 1)}{user.last_name.slice(0, 1)}
                          </span>
                          <span>
                            <strong>{user.first_name} {user.last_name}</strong>
                            <small>{user.email}</small>
                          </span>
                        </div>
                      </td>
                      <td data-label="Tipo">{actorLabel(user.actor_type)}</td>
                      <td data-label="Roles asignados">
                        {user.roles?.length ? (
                          <div className={styles.roleList}>
                            {user.roles.map((role) => (
                              <span className={styles.roleBadge} key={role.role_name + "-" + (role.training_center_id ?? "global")}>
                                {role.role_name}
                              </span>
                            ))}
                          </div>
                        ) : user.roles === undefined ? (
                          <span className={styles.unavailable}>No reportados por el API</span>
                        ) : (
                          <span className={styles.unavailable}>Sin roles asignados</span>
                        )}
                      </td>
                      <td data-label="Estado"><span className={user.is_active ? styles.activeBadge : styles.inactiveBadge}>{user.is_active ? "Activo" : "Inactivo"}</span></td>
                      <td data-label="Acciones">
                        <div className={styles.rowActions}>
                          <button
                            type="button"
                            className={styles.rowAction}
                            onClick={() => {
                              updateUser.clearError();
                              setDialog({ kind: "edit", user });
                            }}
                            disabled={!api}
                            aria-label={"Editar " + user.email}
                            title={"Editar usuario " + user.email}
                          >
                            <Pencil size={17} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className={styles.rowAction}
                            onClick={() => {
                              roleAssigner.clearError();
                              setDialog({ kind: "roles", user });
                            }}
                            disabled={!api}
                            aria-label={"Asignar rol a " + user.email}
                            title={"Administrar roles de " + user.email}
                          >
                            <ShieldCheck size={17} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className={styles.rowAction}
                            onClick={() => setDialog({ kind: "sessions", user })}
                            disabled={!api}
                            aria-label={"Ver sesiones de " + user.email}
                            title={"Ver sesiones de " + user.email}
                          >
                            <KeyRound size={17} aria-hidden="true" />
                          </button>
                          {user.is_active && (
                            <button
                              type="button"
                              className={styles.rowActionDanger}
                              onClick={() => {
                                deactivateUser.clearError();
                                setDialog({ kind: "deactivate", user });
                              }}
                              disabled={!api}
                              aria-label={"Desactivar " + user.email}
                              title={"Desactivar " + user.email}
                            >
                              Desactivar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <footer className={styles.pagination}>
            <span>Página {users.page?.page ?? pageNumber} de {totalPages}</span>
            <div>
              <button className={styles.buttonSecondary} type="button" onClick={() => setPageNumber((current) => Math.max(1, current - 1))} disabled={!api || users.loading || pageNumber <= 1}>
                <ChevronLeft size={16} aria-hidden="true" /> Anterior
              </button>
              <button className={styles.buttonSecondary} type="button" onClick={() => setPageNumber((current) => Math.min(totalPages, current + 1))} disabled={!api || users.loading || pageNumber >= totalPages}>
                Siguiente <ChevronRight size={16} aria-hidden="true" />
              </button>
            </div>
          </footer>
        </section>
      </div>
      {dialog?.kind === "create" && (
        <Dialog title="Crear usuario" onClose={() => setDialog(null)}>
          <UserForm
            submitting={createUser.submitting}
            fieldErrors={fieldErrors}
            formError={formError}
            onCancel={() => setDialog(null)}
            onSubmit={handleCreate}
          />
        </Dialog>
      )}
      {dialog?.kind === "edit" && (
        <Dialog title={"Editar usuario — " + dialog.user.email} onClose={() => setDialog(null)}>
          <EditUserForm
            user={dialog.user}
            submitting={updateUser.submitting}
            error={updateUser.error}
            onCancel={() => setDialog(null)}
            onSubmit={handleUpdate}
          />
        </Dialog>
      )}
      {dialog?.kind === "roles" && (
        <Dialog title={"Asignar rol — " + dialog.user.email} onClose={() => setDialog(null)}>
          <RoleAssigner
            roles={roles.roles}
            assignedRoles={dialog.user.roles ?? []}
            loading={roles.loading}
            error={roles.error || roleAssigner.error}
            submitting={roleAssigner.submitting}
            onCancel={() => setDialog(null)}
            onAssign={handleAssign}
            onRevoke={handleRevoke}
          />
        </Dialog>
      )}
      {dialog?.kind === "sessions" && (
        <Dialog title={"Sesiones — " + dialog.user.email} onClose={() => {
          setDialog(null);
          setSessionToClose(null);
        }}>
          {sessions.loading ? (
            <p role="status">Cargando sesiones…</p>
          ) : sessions.error ? (
            <div className={styles.stateMessage} role="alert">
              <span>{sessions.error}</span>
              <button className={styles.buttonSecondary} type="button" onClick={sessions.refresh}>Reintentar</button>
            </div>
          ) : !sessions.sessions.length ? (
            <p className={styles.formHint}>No hay sesiones activas para mostrar.</p>
          ) : (
            <ul className={styles.sessionList}>
              {sessions.sessions.map((session) => (
                <li key={session.id}>
                  <div>
                    <strong>{session.user_agent || "Sesión activa"}</strong>
                    <span>{session.ip_address || "Dirección IP no informada"}</span>
                    <small>{session.last_activity_at ? "Actividad: " + session.last_activity_at : "Sesión " + session.id}</small>
                  </div>
                  <button
                    className={styles.buttonDanger}
                    type="button"
                    onClick={() => setSessionToClose(session.id)}
                  >
                    Cerrar sesión
                  </button>
                </li>
              ))}
            </ul>
          )}
          {sessionToClose && (
            <section className={styles.sessionConfirm} aria-label="Confirmar cierre de sesión">
              <p className={styles.confirmText}>
                Esta acción cerrará la sesión seleccionada. La persona deberá autenticarse de nuevo en ese dispositivo.
              </p>
              <div className={styles.modalActions}>
                <button className={styles.buttonSecondary} type="button" onClick={() => setSessionToClose(null)} disabled={sessions.closing}>
                  Cancelar
                </button>
                <button
                  className={styles.buttonDanger}
                  type="button"
                  disabled={sessions.closing}
                  onClick={async () => {
                    const closed = await sessions.closeSession(sessionToClose);
                    if (closed) {
                      setSessionToClose(null);
                      setNotice("Sesión cerrada correctamente.");
                    }
                  }}
                >
                  {sessions.closing ? "Cerrando…" : "Confirmar cierre"}
                </button>
              </div>
            </section>
          )}
          <div className={styles.modalActions}>
            <button className={styles.buttonSecondary} type="button" onClick={() => setDialog(null)}>Cerrar</button>
          </div>
        </Dialog>
      )}
      {dialog?.kind === "deactivate" && (
        <Dialog title="Desactivar usuario" onClose={() => setDialog(null)}>
          <p className={styles.confirmText}>
            ¿Desactivar la cuenta de <strong>{dialog.user.email}</strong>? La fila seguirá disponible en el filtro de usuarios inactivos.
          </p>
          {deactivateUser.error && <p className={styles.formError} role="alert">{deactivateUser.error}</p>}
          <div className={styles.modalActions}>
            <button className={styles.buttonSecondary} type="button" onClick={() => setDialog(null)} disabled={deactivateUser.submitting}>Cancelar</button>
            <button className={styles.buttonDanger} type="button" onClick={handleDeactivate} disabled={deactivateUser.submitting}>
              {deactivateUser.submitting ? "Desactivando…" : "Confirmar desactivación"}
            </button>
          </div>
        </Dialog>
      )}
    </main>
  );
}
function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const titleId = useId();
  const dialogRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const firstFocusable = dialogRef.current?.querySelector<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
    );
    (firstFocusable ?? dialogRef.current)?.focus();
    return () => previousFocus?.focus();
  }, []);
  function handleKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
      ) ?? []
    );
    if (!focusable.length) {
      event.preventDefault();
      dialogRef.current?.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
  return (
    <div
      className={styles.overlay}
      onKeyDown={handleKeyDown}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className={styles.dialog} ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className={styles.dialogHeader}>
          <h2 id={titleId}>{title}</h2>
          <button className={styles.iconButton} type="button" onClick={onClose} aria-label="Cerrar diálogo">
            <X size={18} aria-hidden="true" />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
