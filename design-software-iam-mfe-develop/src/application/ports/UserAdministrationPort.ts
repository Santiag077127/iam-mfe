import type {
  CreateUserInput,
  ManagedUser,
  RoleOption,
  UpdateUserInput,
  UserPage,
  UserQuery,
  UserRole,
  UserSession
} from "../../domain/userAdministration";

export class UserAdministrationError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly field?: keyof CreateUserInput
  ) {
    super(message);
    this.name = "UserAdministrationError";
  }
}

/**
 * Provisional application boundary for HU-IAM-015.
 * The HTTP implementation must be composed with frontend-platform and generated
 * OpenAPI types when those dependencies are available.
 */
export interface UserAdministrationPort {
  listUsers(query: UserQuery): Promise<UserPage>;
  createUser(input: CreateUserInput): Promise<ManagedUser>;
  updateUser(userId: string, input: UpdateUserInput): Promise<ManagedUser>;
  listRoles(): Promise<RoleOption[]>;
  assignRole(
    userId: string,
    role: Pick<UserRole, "role_name" | "training_center_id" | "expires_at">
  ): Promise<void>;
  revokeGlobalRole(userId: string, roleName: string): Promise<void>;
  deactivateUser(userId: string): Promise<void>;
  listSessions(userId: string): Promise<UserSession[]>;
  closeSession(userId: string, sessionId: string): Promise<void>;
}
