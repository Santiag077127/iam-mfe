import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useAssignRole } from "../../src/application/useAssignRole";
import { useCreateUser } from "../../src/application/useCreateUser";
import { useDeactivateUser } from "../../src/application/useDeactivateUser";
import { useRoles } from "../../src/application/useRoles";
import { useSessions } from "../../src/application/useSessions";
import { useUsers } from "../../src/application/useUsers";
import type { UserAdministrationPort } from "../../src/application/ports/UserAdministrationPort";
import type { ManagedUser } from "../../src/domain/userAdministration";

const user: ManagedUser = {
  id: "user-1",
  email: "ana@sena.edu.co",
  first_name: "Ana",
  last_name: "Pérez",
  actor_type: "USER",
  is_active: true
};

function makeApi(): UserAdministrationPort {
  return {
    listUsers: vi.fn().mockResolvedValue({ items: [user], page: 1, page_size: 10, total: 1 }),
    createUser: vi.fn().mockResolvedValue(user),
    listRoles: vi.fn().mockResolvedValue([{ name: "SYSTEM_ADMIN" }]),
    assignRole: vi.fn().mockResolvedValue(undefined),
    revokeGlobalRole: vi.fn().mockResolvedValue(undefined),
    deactivateUser: vi.fn().mockResolvedValue(undefined),
    listSessions: vi.fn().mockResolvedValue([{ id: "session-1" }]),
    closeSession: vi.fn().mockResolvedValue(undefined)
  };
}

describe("HU-IAM-015 application hooks", () => {
  it("loads users with the current server filters and can refresh", async () => {
    const api = makeApi();
    const query = { page: 1, page_size: 10, is_active: true };
    const { result } = renderHook(() => useUsers(api, query));

    await waitFor(() => expect(result.current.page?.items).toHaveLength(1));
    expect(api.listUsers).toHaveBeenCalledWith(query);

    act(() => result.current.refresh());
    await waitFor(() => expect(api.listUsers).toHaveBeenCalledTimes(2));
  });

  it("creates a valid user through the port", async () => {
    const api = makeApi();
    const { result } = renderHook(() => useCreateUser(api));

    let response;
    await act(async () => {
      response = await result.current.create({
        email: "ana@sena.edu.co",
        first_name: "Ana",
        last_name: "Pérez",
        actor_type: "USER"
      });
    });

    expect(response).toMatchObject({ user });
    expect(api.createUser).toHaveBeenCalledWith({
      email: "ana@sena.edu.co",
      first_name: "Ana",
      last_name: "Pérez",
      actor_type: "USER"
    });
  });

  it("loads role options only while the role dialog is open", async () => {
    const api = makeApi();
    const { result, rerender } = renderHook(({ open }) => useRoles(api, open), {
      initialProps: { open: false }
    });

    expect(api.listRoles).not.toHaveBeenCalled();
    rerender({ open: true });
    await waitFor(() => expect(result.current.roles).toHaveLength(1));
    expect(api.listRoles).toHaveBeenCalledTimes(1);
  });

  it("assigns and revokes a global role through separate actions", async () => {
    const api = makeApi();
    const { result } = renderHook(() => useAssignRole(api));

    await act(async () => {
      expect(await result.current.assign("user-1", { role_name: "SYSTEM_ADMIN" })).toBe(true);
      expect(await result.current.revokeGlobal("user-1", "SYSTEM_ADMIN")).toBe(true);
    });

    expect(api.assignRole).toHaveBeenCalledWith("user-1", { role_name: "SYSTEM_ADMIN" });
    expect(api.revokeGlobalRole).toHaveBeenCalledWith("user-1", "SYSTEM_ADMIN");
  });

  it("deactivates only through the explicit use case", async () => {
    const api = makeApi();
    const { result } = renderHook(() => useDeactivateUser(api));

    await act(async () => {
      expect(await result.current.deactivate("user-1")).toBe(true);
    });

    expect(api.deactivateUser).toHaveBeenCalledWith("user-1");
  });

  it("loads sessions and requests a refresh after a remote close", async () => {
    const api = makeApi();
    const { result } = renderHook(() => useSessions(api, "user-1"));

    await waitFor(() => expect(result.current.sessions).toHaveLength(1));
    await act(async () => {
      expect(await result.current.closeSession("session-1")).toBe(true);
    });
    await waitFor(() => expect(api.listSessions).toHaveBeenCalledTimes(2));
    expect(api.closeSession).toHaveBeenCalledWith("user-1", "session-1");
  });
});
