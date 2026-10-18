import { useState } from "react";
import type { UserAdministrationPort } from "./ports/UserAdministrationPort";

export function useDeactivateUser(api: UserAdministrationPort | undefined) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function deactivate(userId: string) {
    if (!api) {
      setError("La integración de desactivación de usuarios no está configurada.");
      return false;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api.deactivateUser(userId);
      return true;
    } catch {
      setError("No fue posible desactivar el usuario. Intenta de nuevo.");
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  return { deactivate, submitting, error, clearError: () => setError(null) };
}
