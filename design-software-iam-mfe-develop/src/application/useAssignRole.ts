import { useState } from "react";
import type { UserAdministrationPort } from "./ports/UserAdministrationPort";

export function useAssignRole(api: UserAdministrationPort | undefined) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function assign(
    userId: string,
    role: { role_name: string; training_center_id?: string | null; expires_at?: string | null }
  ) {
    if (!api) {
      setError("La integración de asignación de roles no está configurada.");
      return false;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api.assignRole(userId, role);
      return true;
    } catch {
      setError("No fue posible asignar el rol. Intenta de nuevo.");
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  async function revokeGlobal(userId: string, roleName: string) {
    if (!api) {
      setError("La integración de revocación de roles no está configurada.");
      return false;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api.revokeGlobalRole(userId, roleName);
      return true;
    } catch {
      setError("No fue posible revocar el rol. Intenta de nuevo.");
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  return { assign, revokeGlobal, submitting, error, clearError: () => setError(null) };
}
