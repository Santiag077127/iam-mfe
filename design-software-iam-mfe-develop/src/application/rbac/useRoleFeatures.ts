import { useCallback, useEffect, useState } from "react";
import type { RbacCatalogPort, RbacRoleFeature } from "../ports/RbacCatalogPort";

type RoleFeaturesState = {
  features: RbacRoleFeature[];
  loading: boolean;
  error: string | null;
  reload: () => void;
};

export function useRoleFeatures(
  api: RbacCatalogPort | undefined,
  roleId: string | null,
  enabled: boolean
): RoleFeaturesState {
  const [features, setFeatures] = useState<RbacRoleFeature[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => {
    setReloadKey((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!api || !enabled || !roleId) {
      setFeatures([]);
      setLoading(false);
      setError(null);
      return;
    }

    let active = true;

    setFeatures([]);
    setLoading(true);
    setError(null);

    api
      .listRoleFeatures(roleId)
      .then((nextFeatures) => {
        if (active) setFeatures(nextFeatures);
      })
      .catch((cause: unknown) => {
        if (!active) return;

        setError(
          cause instanceof Error
            ? cause.message
            : "No fue posible cargar los permisos del rol."
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [api, enabled, roleId, reloadKey]);

  return { features, loading, error, reload };
}