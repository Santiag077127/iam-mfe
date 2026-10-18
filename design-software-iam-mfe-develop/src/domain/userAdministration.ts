export type ActorType = "USER" | "INSTRUCTOR" | "LEARNER";

export type UserStatusFilter = "all" | "active" | "inactive";

export type UserRole = {
  role_name: string;
  training_center_id?: string | null;
  expires_at?: string | null;
};

export type ManagedUser = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  actor_type: ActorType;
  actor_id?: string | null;
  is_active: boolean;
  roles?: UserRole[];
};

export type UserPage = {
  items: ManagedUser[];
  page: number;
  page_size: number;
  total: number;
};

export type UserQuery = {
  page: number;
  page_size: number;
  is_active?: boolean;
  role?: string;
  training_center_id?: string;
  search?: string;
};

export type UpdateUserInput = Partial<
  Pick<ManagedUser, "first_name" | "last_name" | "actor_type" | "actor_id" | "is_active">
>;

export type CreateUserInput = {
  email: string;
  first_name: string;
  last_name: string;
  actor_type: ActorType;
  document_type?: string;
  document_number?: string;
  default_max_hours_per_week?: number;
};

export type RoleOption = {
  name: string;
  description?: string;
};

export type UserSession = {
  id: string;
  created_at?: string;
  last_activity_at?: string;
  ip_address?: string;
  user_agent?: string;
};

export type UserFormErrors = Partial<Record<keyof CreateUserInput, string>>;

export function validateCreateUser(input: CreateUserInput): UserFormErrors {
  const errors: UserFormErrors = {};
  const email = input.email.trim();
  const firstName = input.first_name.trim();
  const lastName = input.last_name.trim();

  if (!email) errors.email = "Ingresa el correo electrónico.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Ingresa un correo electrónico válido.";
  }

  if (!firstName) errors.first_name = "Ingresa los nombres.";
  if (!lastName) errors.last_name = "Ingresa los apellidos.";

  if (input.actor_type === "INSTRUCTOR" || input.actor_type === "LEARNER") {
    if (!input.document_type?.trim()) errors.document_type = "Selecciona el tipo de documento.";
    if (!input.document_number?.trim()) errors.document_number = "Ingresa el número de documento.";
  }

  if (input.actor_type === "INSTRUCTOR") {
    const hours = input.default_max_hours_per_week;
    if (hours === undefined || !Number.isFinite(hours) || hours <= 0) {
      errors.default_max_hours_per_week = "Ingresa un máximo de horas mayor que cero.";
    }
  }

  return errors;
}

export function toActiveFilter(filter: UserStatusFilter): boolean | undefined {
  if (filter === "active") return true;
  if (filter === "inactive") return false;
  return undefined;
}
