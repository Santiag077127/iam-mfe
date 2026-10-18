import { useState, type FormEvent } from "react";
import type {
  ActorType,
  CreateUserInput,
  UserFormErrors
} from "../../../domain/userAdministration";
import styles from "../pages/UsersPage.module.css";

type UserFormProps = {
  submitting: boolean;
  fieldErrors?: UserFormErrors;
  formError?: string | null;
  onCancel: () => void;
  onSubmit: (input: CreateUserInput) => Promise<void>;
};

export function UserForm({
  submitting,
  fieldErrors = {},
  formError,
  onCancel,
  onSubmit
}: UserFormProps) {
  const [actorType, setActorType] = useState<ActorType>("USER");
  const [values, setValues] = useState({
    email: "",
    first_name: "",
    last_name: "",
    document_type: "",
    document_number: "",
    default_max_hours_per_week: ""
  });

  function update(field: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit({
      email: values.email.trim(),
      first_name: values.first_name.trim(),
      last_name: values.last_name.trim(),
      actor_type: actorType,
      ...(actorType === "LEARNER" || actorType === "INSTRUCTOR"
        ? {
            document_type: values.document_type.trim(),
            document_number: values.document_number.trim()
          }
        : {}),
      ...(actorType === "INSTRUCTOR"
        ? { default_max_hours_per_week: Number(values.default_max_hours_per_week) }
        : {})
    });
  }

  function fieldError(field: keyof CreateUserInput) {
    const message = fieldErrors[field];
    return message ? (
      <span className={styles.fieldError} id={String(field) + "-error"}>{message}</span>
    ) : null;
  }

  const requiresDocument = actorType === "LEARNER" || actorType === "INSTRUCTOR";

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      {formError && <p className={styles.formError} role="alert">{formError}</p>}
      <div className={styles.formGrid}>
        <div className={styles.field}>
          <label htmlFor="user-email">Correo electrónico</label>
          <input
            id="user-email"
            autoComplete="email"
            type="email"
            value={values.email}
            onChange={(event) => update("email", event.target.value)}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? "email-error" : undefined}
            required
          />
          {fieldError("email")}
        </div>
        <div className={styles.field}>
          <label htmlFor="user-actor-type">Tipo de usuario</label>
          <select id="user-actor-type" value={actorType} onChange={(event) => setActorType(event.target.value as ActorType)}>
            <option value="USER">Usuario</option>
            <option value="INSTRUCTOR">Instructor</option>
            <option value="LEARNER">Aprendiz</option>
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="user-first-name">Nombres</label>
          <input
            id="user-first-name"
            autoComplete="given-name"
            value={values.first_name}
            onChange={(event) => update("first_name", event.target.value)}
            aria-invalid={Boolean(fieldErrors.first_name)}
            aria-describedby={fieldErrors.first_name ? "first_name-error" : undefined}
            required
          />
          {fieldError("first_name")}
        </div>
        <div className={styles.field}>
          <label htmlFor="user-last-name">Apellidos</label>
          <input
            id="user-last-name"
            autoComplete="family-name"
            value={values.last_name}
            onChange={(event) => update("last_name", event.target.value)}
            aria-invalid={Boolean(fieldErrors.last_name)}
            aria-describedby={fieldErrors.last_name ? "last_name-error" : undefined}
            required
          />
          {fieldError("last_name")}
        </div>
        {requiresDocument && (
          <>
            <div className={styles.field}>
              <label htmlFor="user-document-type">Tipo de documento</label>
              <input
                id="user-document-type"
                value={values.document_type}
                onChange={(event) => update("document_type", event.target.value)}
                aria-invalid={Boolean(fieldErrors.document_type)}
                aria-describedby={fieldErrors.document_type ? "document_type-error" : undefined}
                required
              />
              {fieldError("document_type")}
            </div>
            <div className={styles.field}>
              <label htmlFor="user-document-number">Número de documento</label>
              <input
                id="user-document-number"
                value={values.document_number}
                onChange={(event) => update("document_number", event.target.value)}
                aria-invalid={Boolean(fieldErrors.document_number)}
                aria-describedby={fieldErrors.document_number ? "document_number-error" : undefined}
                required
              />
              {fieldError("document_number")}
            </div>
          </>
        )}
        {actorType === "INSTRUCTOR" && (
          <div className={styles.field}>
            <label htmlFor="user-default-max-hours">Máximo de horas por semana</label>
            <input
              id="user-default-max-hours"
              type="number"
              min="1"
              value={values.default_max_hours_per_week}
              onChange={(event) => update("default_max_hours_per_week", event.target.value)}
              aria-invalid={Boolean(fieldErrors.default_max_hours_per_week)}
              aria-describedby={fieldErrors.default_max_hours_per_week ? "default_max_hours_per_week-error" : undefined}
              required
            />
            {fieldError("default_max_hours_per_week")}
          </div>
        )}
      </div>
      <p className={styles.formHint}>
        Para aprendices e instructores se solicitan los datos requeridos por el servicio de actores.
      </p>
      <div className={styles.modalActions}>
        <button className={styles.buttonSecondary} type="button" onClick={onCancel} disabled={submitting}>
          Cancelar
        </button>
        <button className={styles.buttonPrimary} type="submit" disabled={submitting}>
          {submitting ? "Creando…" : "Crear usuario"}
        </button>
      </div>
    </form>
  );
}
