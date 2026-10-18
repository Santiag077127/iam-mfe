import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AuthApiError,
  confirmPasswordReset,
  login,
  requestPasswordReset
} from "../../src/adapter/out/auth";

function response(status: number, body?: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockImplementation(() => {
      if (body === undefined) return Promise.reject(new Error("empty body"));
      return Promise.resolve(body);
    })
  } as unknown as Response;
}

describe("Auth API adapter password reset", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    sessionStorage.clear();
  });

  it("sends reset requests with the email field", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response(202));
    vi.stubGlobal("fetch", fetchMock);

    await requestPasswordReset("persona@sena.edu.co");

    expect(fetchMock).toHaveBeenCalledWith(
      "/auth/password-reset/request",
      expect.objectContaining({
        body: JSON.stringify({ email: "persona@sena.edu.co" }),
        method: "POST"
      })
    );
  });

  it("sends reset confirmation with token and new_password", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response(204));
    vi.stubGlobal("fetch", fetchMock);

    await confirmPasswordReset("reset-token", "StrongPass1!");

    expect(fetchMock).toHaveBeenCalledWith(
      "/auth/password-reset/confirm",
      expect.objectContaining({
        body: JSON.stringify({ token: "reset-token", new_password: "StrongPass1!" }),
        method: "POST"
      })
    );
  });

  it("sends login credentials to the IAM login endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response(200, {
      access_token: "access-token",
      refresh_token: "refresh-token",
      token_type: "Bearer",
      expires_in: 900,
      user: {
        id: "user-id",
        email: "qa.user@sena.edu.co",
        full_name: "QA User",
        roles: ["REFERENCE_VIEWER"],
        training_center_id: "center-id",
        features: ["REF_HIERARCHY_VIEW:GLOBAL", "REF_CATALOG_VIEW:GLOBAL"]
      }
    }));
    vi.stubGlobal("fetch", fetchMock);
    const sessionChanged = vi.fn();
    window.addEventListener("sena:session-changed", sessionChanged);

    const result = await login("qa.user", "TestPassword1!");

    expect(fetchMock).toHaveBeenCalledWith(
      "/auth/login",
      expect.objectContaining({
        body: JSON.stringify({ email: "qa.user", password: "TestPassword1!" }),
        method: "POST"
      })
    );
    expect(sessionStorage.getItem("sena.access_token")).toBe("access-token");
    expect(sessionStorage.getItem("sena.refresh_token")).toBe("refresh-token");
    expect(sessionChanged).toHaveBeenCalledTimes(1);
    expect(result.user).toEqual({
      id: "user-id",
      email: "qa.user@sena.edu.co",
      fullName: "QA User",
      roles: ["REFERENCE_VIEWER"],
      trainingCenterId: "center-id",
      features: ["REF_HIERARCHY_VIEW:GLOBAL", "REF_CATALOG_VIEW:GLOBAL"]
    });
    window.removeEventListener("sena:session-changed", sessionChanged);
  });

  it("rejects a successful response without the required tokens", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response(200, {
      token_type: "Bearer",
      expires_in: 900,
      user: {
        id: "user-id",
        email: "qa.user@sena.edu.co",
        full_name: "QA User",
        roles: [],
        features: []
      }
    }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(login("qa.user", "TestPassword1!")).rejects.toMatchObject({
      message: "La respuesta de autenticacion no contiene la sesion requerida.",
      status: 502
    });
  });

  it("normalizes invalid reset token errors from the envelope", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      response(400, {
        error: { code: "IAM_INVALID_RESET_TOKEN" }
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(confirmPasswordReset("expired-token", "StrongPass1!")).rejects.toMatchObject<
      Partial<AuthApiError>
    >({
      code: "IAM_INVALID_RESET_TOKEN",
      message: "El enlace expiró o ya fue usado. Solicita uno nuevo.",
      name: "AuthApiError",
      status: 400
    });
  });
});
