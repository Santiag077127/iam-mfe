import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createDemoRbacCatalog } from "../../src/adapter/out/demoRbacCatalog";
import type { RbacCatalogPort } from "../../src/application/ports/RbacCatalogPort";
import { useRbacCatalog } from "../../src/application/rbac/useRbacCatalog";
import { useRoleFeatures } from "../../src/application/rbac/useRoleFeatures";

function createSpiedDemoPort() {
  const demo = createDemoRbacCatalog();

  const api: RbacCatalogPort = {
    listModules: vi.fn(() => demo.listModules()),
    listRoles: vi.fn(() => demo.listRoles()),
    listRoleFeatures: vi.fn((roleId: string) =>
      demo.listRoleFeatures(roleId)
    )
  };

  return api;
}

describe("RBAC catalog", () => {
  it("provides clearly bounded demo roles and read-only feature data", async () => {
    const api = createDemoRbacCatalog();
    const [modules, roles] = await Promise.all([
      api.listModules(),
      api.listRoles()
    ]);

    const systemAdmin = roles.find((role) => role.name === "SYSTEM_ADMIN");
    const auditor = roles.find((role) => role.name === "AUDITOR");

    if (!systemAdmin || !auditor) {
      throw new Error("Faltan los roles de ejemplo.");
    }

    expect(modules).toHaveLength(1);

    const adminFeatures = await api.listRoleFeatures(systemAdmin.id);
    const auditorFeatures = await api.listRoleFeatures(auditor.id);

    expect(adminFeatures).toEqual([
      expect.objectContaining({
        feature_code: "IDENTITY_ROLE_VIEW",
        scope_type: "GLOBAL"
      })
    ]);
    expect(auditorFeatures).toEqual([]);
  });

  it("loads the module and role catalogs through the port", async () => {
    const api = createSpiedDemoPort();
    const { result } = renderHook(() => useRbacCatalog(api, true));

    await waitFor(() => {
      expect(result.current.modules).toHaveLength(1);
      expect(result.current.roles).toHaveLength(2);
    });

    expect(api.listModules).toHaveBeenCalledTimes(1);
    expect(api.listRoles).toHaveBeenCalledTimes(1);
  });

  it("loads features for the selected role and supports retry", async () => {
    const api = createSpiedDemoPort();
    const roles = await api.listRoles();
    const systemAdmin = roles.find((role) => role.name === "SYSTEM_ADMIN");

    if (!systemAdmin) {
      throw new Error("No se encontró el rol SYSTEM_ADMIN de ejemplo.");
    }

    const { result } = renderHook(() =>
      useRoleFeatures(api, systemAdmin.id, true)
    );

    await waitFor(() => {
      expect(result.current.features).toHaveLength(1);
      expect(result.current.features[0]?.scope_type).toBe("GLOBAL");
    });

    expect(api.listRoleFeatures).toHaveBeenCalledWith(systemAdmin.id);

    act(() => {
      result.current.reload();
    });

    await waitFor(() => {
      expect(api.listRoleFeatures).toHaveBeenCalledTimes(2);
    });
  });
});