import { useCallback, useEffect, useState } from "react";
import type { RbacCatalogPort, RbacModule, RbacRole } from "../ports/RbacCatalogPort";

type RbacCatalogState = {
  modules: RbacModule[];
  roles: RbacRole[];
  loading: boolean;
  error: string | null;
  reload: () => void;
};

export function useRbacCatalog(
  api: RbacCatalogPort | undefined,
  enabled: boolean
): RbacCatalogState {
  const [modules, setModules] = useState<RbacModule[]>([]);
  const [roles, setRoles] = useState<RbacRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => {
    setReloadKey((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!api || !enabled) {
      setModules([]);
      setRoles([]);
      setLoading(false);
      setError(null);
      return;
    }

    let active = true;

    setModules([]);
    setRoles([]);
    setLoading(true);
    setError(null);

    Promise.all([api.listModules(), api.listRoles()])
      .then(([nextModules, nextRoles]) => {
        if (!active) return;
        setModules(nextModules);
        setRoles(nextRoles);
      })
      .catch((cause: unknown) => {
        if (!active) return;

        setError(
          cause instanceof Error
            ? cause.message
            : "No fue posible cargar los módulos y roles."
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [api, enabled, reloadKey]);

  return { modules, roles, loading, error, reload };
}