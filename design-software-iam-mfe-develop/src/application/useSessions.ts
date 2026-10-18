import { useCallback, useEffect, useState } from "react";
import type { UserSession } from "../domain/userAdministration";
import type { UserAdministrationPort } from "./ports/UserAdministrationPort";

export function useSessions(api: UserAdministrationPort | undefined, userId: string | null) {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const refresh = useCallback(() => setReloadKey((value) => value + 1), []);

  useEffect(() => {
    let active = true;
    if (!api || !userId) {
      setSessions([]);
      setError(null);
      return () => {
        active = false;
      };
    }

    setLoading(true);
    setError(null);
    api
      .listSessions(userId)
      .then((result) => {
        if (active) setSessions(result);
      })
      .catch(() => {
        if (active) setError("No fue posible cargar las sesiones activas.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [api, userId, reloadKey]);

  async function closeSession(sessionId: string) {
    if (!api || !userId) return false;
    setClosing(true);
    setError(null);
    try {
      await api.closeSession(userId, sessionId);
      refresh();
      return true;
    } catch {
      setError("No fue posible cerrar la sesión. Intenta de nuevo.");
      return false;
    } finally {
      setClosing(false);
    }
  }

  return { sessions, loading, closing, error, refresh, closeSession };
}
