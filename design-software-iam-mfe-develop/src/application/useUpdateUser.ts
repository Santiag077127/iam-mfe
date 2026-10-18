import { useState } from "react";
import {
  UserAdministrationError,
  type UserAdministrationPort
} from "./ports/UserAdministrationPort";
import type { UpdateUserInput } from "../domain/userAdministration";

export function useUpdateUser(api: UserAdministrationPort | undefined) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function update(userId: string, input: UpdateUserInput): Promise<boolean> {
    if (!api) {
      setError("La integración de actualización de usuarios no está configurada.");
      return false;
    }

    setSubmitting(true);
    setError(null);

    try {
      await api.updateUser(userId, input);
      return true;
    } catch (cause) {
      setError(
        cause instanceof UserAdministrationError
          ? cause.message
          : "No fue posible actualizar el usuario. Intenta de nuevo."
      );
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  return { update, submitting, error, clearError: () => setError(null) };
}