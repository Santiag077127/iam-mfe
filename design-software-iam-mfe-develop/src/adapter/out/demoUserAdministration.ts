import type { UserAdministrationPort } from "../../application/ports/UserAdministrationPort";
import { UserAdministrationError as AdministrationError } from "../../application/ports/UserAdministrationPort";
import type {
  ManagedUser,
  RoleOption,
  UserQuery,
  UserRole,
  UserSession
} from "../../domain/userAdministration";

function cloneUser(user: ManagedUser): ManagedUser {
  return {
    ...user,
    roles: user.roles?.map((role) => ({ ...role }))
  };
}

function newId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `demo-${Date.now()}-${Math.random()}`;
}

export function createDemoUserAdministration(): UserAdministrationPort {
  let users: ManagedUser[] = [
    {
      id: "demo-user-ana",
      email: "ana.perez@sena.edu.co",
      first_name: "Ana",
      last_name: "Pérez",
      actor_type: "USER",
      is_active: true,
      roles: [{ role_name: "SYSTEM_ADMIN" }]
    },
    {
      id: "demo-user-luis",
      email: "luis.diaz@sena.edu.co",
      first_name: "Luis",
      last_name: "Díaz",
      actor_type: "INSTRUCTOR",
      actor_id: "demo-actor-luis",
      is_active: true,
      roles: [{ role_name: "INSTRUCTOR", training_center_id: "demo-center-1" }]
    },
    {
      id: "demo-user-maria",
      email: "maria.rojas@sena.edu.co",
      first_name: "María",
      last_name: "Rojas",
      actor_type: "LEARNER",
      actor_id: "demo-actor-maria",
      is_active: false,
      roles: [{ role_name: "LEARNER", training_center_id: "demo-center-1" }]
    }
  ];

  const roleOptions: RoleOption[] = [
    { name: "SYSTEM_ADMIN", description: "Administración del sistema" },
    { name: "IDENTITY_MANAGER", description: "Gestión de identidades" },
    { name: "INSTRUCTOR", description: "Instructor" },
    { name: "LEARNER", description: "Aprendiz" }
  ];

  const sessions = new Map<string, UserSession[]>([
    [
      "demo-user-ana",
      [
        {
          id: "demo-session-ana-1",
          created_at: "2026-10-10T09:00:00Z",
          last_activity_at: "2026-10-10T14:30:00Z",
          ip_address: "192.0.2.10",
          user_agent: "Chrome — Windows"
        },
        {
          id: "demo-session-ana-2",
          created_at: "2026-10-09T11:00:00Z",
          last_activity_at: "2026-10-10T12:10:00Z",
          ip_address: "192.0.2.20",
          user_agent: "Firefox — Linux"
        }
      ]
    ],
    [
      "demo-user-luis",
      [
        {
          id: "demo-session-luis-1",
          created_at: "2026-10-10T08:00:00Z",
          last_activity_at: "2026-10-10T13:45:00Z",
          ip_address: "192.0.2.30",
          user_agent: "Chrome — Android"
        }
      ]
    ]
  ]);

  function findUser(userId: string): ManagedUser {
    const user = users.find((item) => item.id === userId);
    if (!user) throw new AdministrationError("No se encontró el usuario.", 404);
    return user;
  }

  return {
    async listUsers(query: UserQuery) {
      const search = query.search?.trim().toLocaleLowerCase() ?? "";

      const filtered = users.filter((user) => {
        if (query.is_active !== undefined && user.is_active !== query.is_active) return false;

        if (
          query.role &&
          !user.roles?.some((role) => role.role_name === query.role)
        ) {
          return false;
        }

        if (
          query.training_center_id &&
          !user.roles?.some((role) => role.training_center_id === query.training_center_id)
        ) {
          return false;
        }

        if (!search) return true;

        const haystack = [
          user.email,
          user.first_name,
          user.last_name,
          `${user.first_name} ${user.last_name}`
        ]
          .join(" ")
          .toLocaleLowerCase();

        return haystack.includes(search);
      });

      const pageSize = Math.min(100, Math.max(1, query.page_size));
      const page = Math.max(1, query.page);
      const start = (page - 1) * pageSize;

      return {
        items: filtered.slice(start, start + pageSize).map(cloneUser),
        page,
        page_size: pageSize,
        total: filtered.length
      };
    },

    async createUser(input) {
      const duplicate = users.some(
        (user) => user.email.toLocaleLowerCase() === input.email.trim().toLocaleLowerCase()
      );

      if (duplicate) {
        throw new AdministrationError("Este correo ya está registrado.", 409, "email");
      }

      const created: ManagedUser = {
        id: newId(),
        email: input.email.trim(),
        first_name: input.first_name.trim(),
        last_name: input.last_name.trim(),
        actor_type: input.actor_type,
        is_active: true,
        roles: []
      };

      users = [created, ...users];
      sessions.set(created.id, []);
      return cloneUser(created);
    },

    async updateUser(userId, input) {
      const current = findUser(userId);
      const updated = { ...current, ...input };

      users = users.map((user) => (user.id === userId ? updated : user));
      return cloneUser(updated);
    },

    async listRoles() {
      return roleOptions.map((role) => ({ ...role }));
    },

    async assignRole(userId, role) {
      const user = findUser(userId);
      const assignedRoles = user.roles ?? [];
      const alreadyAssigned = assignedRoles.some(
        (item) =>
          item.role_name === role.role_name &&
          (item.training_center_id ?? null) === (role.training_center_id ?? null)
      );

      if (alreadyAssigned) {
        throw new AdministrationError("Ese rol ya está asignado al usuario.", 409);
      }

      user.roles = [...assignedRoles, { ...role } as UserRole];
    },

    async revokeGlobalRole(userId, roleName) {
      const user = findUser(userId);
      user.roles = (user.roles ?? []).filter(
        (role) => role.role_name !== roleName || Boolean(role.training_center_id)
      );
    },

    async deactivateUser(userId) {
      const user = findUser(userId);
      user.is_active = false;
      sessions.set(userId, []);
    },

    async listSessions(userId) {
      findUser(userId);
      return (sessions.get(userId) ?? []).map((session) => ({ ...session }));
    },

    async closeSession(userId, sessionId) {
      findUser(userId);
      const current = sessions.get(userId) ?? [];
      sessions.set(
        userId,
        current.filter((session) => session.id !== sessionId)
      );
    }
  };
}
