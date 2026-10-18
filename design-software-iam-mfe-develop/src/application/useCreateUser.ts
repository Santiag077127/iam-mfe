import { useState } from "react";
import type { CreateUserInput, ManagedUser, UserFormErrors } from "../domain/userAdministration";
import { validateCreateUser } from "../domain/userAdministration";
import {
  UserAdministrationError,
  type UserAdministrationPort
} from "./ports/UserAdministrationPort";

export function useCreateUser(api: UserAdministrationPort | undefined) {
  const [submitting, setSubmitting] = useState(false);

  async function create(input: CreateUserInput): Promise<{
    user?: ManagedUser;
    errors?: UserFormErrors;
    formError?: string;
  }> {
    const errors = validateCreateUser(input);
    if (Object.keys(errors).length) return { errors };
    if (!api) return { formError: "La integración de creación de usuarios no está configurada." };

    setSubmitting(true);
    try {
      return { user: await api.createUser(input) };
    } catch (error) {
      if (error instanceof UserAdministrationError && error.status === 409 && error.field) {
        return { errors: { [error.field]: error.message } };
      }
      return {
        formError:
          error instanceof UserAdministrationError
            ? error.message
            : "No fue posible crear el usuario. Intenta de nuevo."
      };
    } finally {
      setSubmitting(false);
    }
  }

  return { create, submitting };
}
