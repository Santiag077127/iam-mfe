import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { UsersPage } from "../../src/adapter/in/pages/UsersPage";
import {
  UserAdministrationError,
  type UserAdministrationPort
} from "../../src/application/ports/UserAdministrationPort";
import type { ManagedUser, UserPage } from "../../src/domain/userAdministration";

const user: ManagedUser = {
  id: "user-1",
  email: "ana.perez@sena.edu.co",
  first_name: "Ana",
  last_name: "Pérez",
  actor_type: "USER",
  is_active: true
};

const page: UserPage = { items: [user], page: 1, page_size: 10, total: 1 };

function makeApi(overrides: Partial<UserAdministrationPort> = {}): UserAdministrationPort {
  return {
    listUsers: vi.fn().mockResolvedValue(page),
    createUser: vi.fn().mockResolvedValue(user),
    updateUser: vi.fn().mockResolvedValue(user),
    listRoles: vi.fn().mockResolvedValue([{ name: "SYSTEM_ADMIN" }]),
    assignRole: vi.fn().mockResolvedValue(undefined),
    revokeGlobalRole: vi.fn().mockResolvedValue(undefined),
    deactivateUser: vi.fn().mockResolvedValue(undefined),
    listSessions: vi.fn().mockResolvedValue([]),
    closeSession: vi.fn().mockResolvedValue(undefined),
    ...overrides
  };
}

afterEach(() => cleanup());

describe("HU-IAM-015 UsersPage", () => {
  it("loads the paginated list and shows the global search field", async () => {
    const api = makeApi();
    render(<UsersPage api={api} />);

    expect(await screen.findByText("Ana Pérez")).toBeTruthy();
    expect(api.listUsers).toHaveBeenCalledWith({
      page: 1,
      page_size: 10,
      is_active: undefined,
      search: undefined
    });
    expect(screen.getByPlaceholderText("Buscar por nombre o correo")).toBeTruthy();
    expect(screen.getByText("No reportados por el API")).toBeTruthy();
  });

  it("submits conditional actor fields for a new instructor", async () => {
    const api = makeApi();
    render(<UsersPage api={api} />);

    await screen.findByText("Ana Pérez");
    fireEvent.click(screen.getByRole("button", { name: "Nuevo usuario" }));
    fireEvent.change(screen.getByLabelText("Correo electrónico"), {
      target: { value: "instructor@sena.edu.co" }
    });
    fireEvent.change(screen.getByLabelText("Tipo de usuario"), {
      target: { value: "INSTRUCTOR" }
    });
    fireEvent.change(screen.getByLabelText("Nombres"), { target: { value: "Luis" } });
    fireEvent.change(screen.getByLabelText("Apellidos"), { target: { value: "Díaz" } });
    fireEvent.change(screen.getByLabelText("Tipo de documento"), { target: { value: "CC" } });
    fireEvent.change(screen.getByLabelText("Número de documento"), { target: { value: "12345" } });
    fireEvent.change(screen.getByLabelText("Máximo de horas por semana"), { target: { value: "20" } });
    fireEvent.click(screen.getByRole("button", { name: "Crear usuario" }));

    await waitFor(() =>
      expect(api.createUser).toHaveBeenCalledWith({
        email: "instructor@sena.edu.co",
        first_name: "Luis",
        last_name: "Díaz",
        actor_type: "INSTRUCTOR",
        document_type: "CC",
        document_number: "12345",
        default_max_hours_per_week: 20
      })
    );
    expect(await screen.findByRole("status")).toBeTruthy();
  });

  it("places a duplicate-email conflict inline on the email field", async () => {
    const api = makeApi({
      createUser: vi.fn().mockRejectedValue(
        new UserAdministrationError("Este correo ya está registrado.", 409, "email")
      )
    });
    render(<UsersPage api={api} />);

    await screen.findByText("Ana Pérez");
    fireEvent.click(screen.getByRole("button", { name: "Nuevo usuario" }));
    fireEvent.change(screen.getByLabelText("Correo electrónico"), {
      target: { value: "ana.perez@sena.edu.co" }
    });
    fireEvent.change(screen.getByLabelText("Nombres"), { target: { value: "Ana" } });
    fireEvent.change(screen.getByLabelText("Apellidos"), { target: { value: "Pérez" } });
    fireEvent.click(screen.getByRole("button", { name: "Crear usuario" }));

    expect(await screen.findByText("Este correo ya está registrado.")).toBeTruthy();
    expect(screen.getByLabelText("Correo electrónico").getAttribute("aria-invalid")).toBe("true");
  });

  it("passes an optional training-center scope when assigning a role", async () => {
    const api = makeApi();
    render(<UsersPage api={api} />);

    await screen.findByText("Ana Pérez");
    fireEvent.click(screen.getByRole("button", { name: "Asignar rol a ana.perez@sena.edu.co" }));
    await screen.findByRole("option", { name: "SYSTEM_ADMIN" });
    fireEvent.change(screen.getByLabelText("Rol"), { target: { value: "SYSTEM_ADMIN" } });
    fireEvent.change(screen.getByLabelText("ID del centro de formación (opcional)"), {
      target: { value: "center-1" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Asignar rol" }));

    await waitFor(() =>
      expect(api.assignRole).toHaveBeenCalledWith("user-1", {
        role_name: "SYSTEM_ADMIN",
        training_center_id: "center-1"
      })
    );
  });

  it("keeps deactivation behind an explicit confirmation", async () => {
    const api = makeApi();
    render(<UsersPage api={api} />);

    await screen.findByText("Ana Pérez");
    fireEvent.click(screen.getByRole("button", { name: "Desactivar ana.perez@sena.edu.co" }));
    expect(screen.getByRole("dialog", { name: "Desactivar usuario" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Confirmar desactivación" }));

    await waitFor(() => expect(api.deactivateUser).toHaveBeenCalledWith("user-1"));
  });
});
