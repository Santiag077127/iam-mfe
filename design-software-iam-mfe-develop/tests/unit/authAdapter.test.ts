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
    const fetchMock = vi.fn().mockResolvedValue(response(200, { data: {} }));
    vi.stubGlobal("fetch", fetchMock);

    await login("qa.user", "TestPassword1!");

    expect(fetchMock).toHaveBeenCalledWith(
      "/auth/login",
      expect.objectContaining({
        body: JSON.stringify({ identifier: "qa.user", password: "TestPassword1!" }),
        method: "POST"
      })
    );
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
