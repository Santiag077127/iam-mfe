import { useState, type FormEvent } from "react";
import type {
  ActorType,
  ManagedUser,
  UpdateUserInput
} from "../../../domain/userAdministration";
import styles from "../pages/UsersPage.module.css";

type EditUserFormProps = {
  user: ManagedUser;
  submitting: boolean;
  error?: string | null;
  onCancel: () => void;
  onSubmit: (input: UpdateUserInput) => Promise<void>;
};

export function EditUserForm({
  user,
  submitting,
  error,
  onCancel,
  onSubmit
}: EditUserFormProps) {
  const [firstName, setFirstName] = useState(user.first_name);
  const [lastName, setLastName] = useState(user.last_name);
  const [actorType, setActorType] = useState<ActorType>(user.actor_type);
  const [actorId, setActorId] = useState(user.actor_id ?? "");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    void onSubmit({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      actor_type: actorType,
      actor_id: actorId.trim() || null
    });
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      {error && <p className={styles.formError} role="alert">{error}</p>}

      <label className={styles.field}>
        <span>Correo electrónico</span>
        <input type="email" value={user.email} disabled />
        <small>El contrato IAM no permite editar el correo.</small>
      </label>

      <label className={styles.field}>
        <span>Nombres</span>
        <input
          value={firstName}
          onChange={(event) => setFirstName(event.target.value)}
          required
          maxLength={100}
        />
      </label>

      <label className={styles.field}>
        <span>Apellidos</span>
        <input
          value={lastName}
          onChange={(event) => setLastName(event.target.value)}
          required
          maxLength={100}
        />
      </label>

      <label className={styles.field}>
        <span>Tipo de usuario</span>
        <select
          value={actorType}
          onChange={(event) => setActorType(event.target.value as ActorType)}
        >
          <option value="USER">Usuario</option>
          <option value="INSTRUCTOR">Instructor</option>
          <option value="LEARNER">Aprendiz</option>
        </select>
      </label>

      <label className={styles.field}>
        <span>ID de actor</span>
        <input
          value={actorId}
          onChange={(event) => setActorId(event.target.value)}
          placeholder="UUID del actor, si aplica"
        />
      </label>

      <p className={styles.formHint}>
        El contrato de actualización no incluye tipo ni número de documento.
      </p>

      <div className={styles.modalActions}>
        <button
          className={styles.buttonSecondary}
          type="button"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancelar
        </button>
        <button className={styles.buttonPrimary} type="submit" disabled={submitting}>
          {submitting ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}