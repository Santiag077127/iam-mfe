import { useEffect, useState } from "react";
import type { RoleOption } from "../domain/userAdministration";
import type { UserAdministrationPort } from "./ports/UserAdministrationPort";

export function useRoles(api: UserAdministrationPort | undefined, enabled: boolean) {
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!enabled) {
      setRoles([]);
      setError(null);
      setLoading(false);
      return () => {
        active = false;
      };
    }

    if (!api) {
      setRoles([]);
      setLoading(false);
      setError("La consulta de roles aún no está configurada.");
      return () => {
        active = false;
      };
    }

    setLoading(true);
    setError(null);
    api.listRoles()
      .then((result) => {
        if (active) setRoles(result);
      })
      .catch(() => {
        if (active) setError("No fue posible cargar los roles disponibles.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [api, enabled]);

  return { roles, loading, error };
}
