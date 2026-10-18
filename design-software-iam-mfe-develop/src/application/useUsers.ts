import { useCallback, useEffect, useState } from "react";
import type { UserPage, UserQuery } from "../domain/userAdministration";
import type { UserAdministrationPort } from "./ports/UserAdministrationPort";

export function useUsers(api: UserAdministrationPort | undefined, query: UserQuery) {
  const [page, setPage] = useState<UserPage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const refresh = useCallback(() => setReloadKey((value) => value + 1), []);

  useEffect(() => {
    let active = true;
    if (!api) {
      setPage(null);
      setLoading(false);
      setError("La integración de usuarios con IAM aún no está configurada.");
      return () => {
        active = false;
      };
    }

    setLoading(true);
    setError(null);
    api
      .listUsers(query)
      .then((result) => {
        if (active) setPage(result);
      })
      .catch(() => {
        if (active) setError("No fue posible cargar los usuarios. Intenta de nuevo.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [
    api,
    query.page,
    query.page_size,
    query.is_active,
    query.role,
    query.training_center_id,
    query.search,
    reloadKey
  ]);

  return { page, loading, error, refresh };
}
