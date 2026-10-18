export type ApiEnvelope<T = unknown> = {
  data?: T;
  message?: string;
  error?: {
    code?: string;
    message?: string;
  };
};

const API_BASE_URL = import.meta.env.VITE_IAM_API_URL ?? "";

export type LoginResponse = {
  accessToken?: string;
  refreshToken?: string;
  user?: {
    id: string;
    name?: string;
    email?: string;
  };
  temporaryPasswordRequired?: boolean;
  resetToken?: string;
};

export class AuthApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string
  ) {
    super(message);
    this.name = "AuthApiError";
  }
}

function getFallbackMessage(status: number, code?: string) {
  if (code === "IAM_INVALID_RESET_TOKEN" || code === "RESET_TOKEN_EXPIRED") {
    return "El enlace expiró o ya fue usado. Solicita uno nuevo.";
  }

  if (code === "IAM_RATE_LIMIT_EXCEEDED" || code === "RATE_LIMIT_EXCEEDED") {
    return "Has realizado demasiadas solicitudes. Intenta de nuevo más tarde.";
  }

  return `No pudimos procesar la solicitud (HTTP ${status}).`;
}

async function post<TBody extends object, TResponse = unknown>(
  path: string,
  body: TBody
): Promise<ApiEnvelope<TResponse>> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  const payload = (await response.json().catch(() => ({}))) as ApiEnvelope<TResponse>;

  if (!response.ok) {
    const code = payload.error?.code;
    throw new AuthApiError(
      payload.error?.message ?? payload.message ?? getFallbackMessage(response.status, code),
      response.status,
      code
    );
  }

  return payload;
}

export function requestPasswordReset(email: string) {
  return post("/auth/password-reset/request", { email });
}

export function confirmPasswordReset(token: string, password: string) {
  return post("/auth/password-reset/confirm", { token, new_password: password });
}

export function login(identifier: string, password: string) {
  return post<{ identifier: string; password: string }, LoginResponse>("/auth/login", {
    identifier,
    password
  });
}
