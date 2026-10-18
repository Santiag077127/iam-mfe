import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../../src/App";

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

describe("HU-IAM-014 password reset flow", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.useRealTimers();
    window.history.replaceState(null, "", "/login");
  });

  it("starts at /login and opens password recovery from the login screen", async () => {
    window.history.replaceState(null, "", "/login");

    render(<App />);

    expect(screen.getByRole("heading", { name: "Ingresar" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "¿Olvidó su contraseña?" }));

    expect(window.location.pathname).toBe("/forgot-password");
    expect(screen.getByRole("heading", { name: "Recuperar contraseña" })).toBeTruthy();
  });

  it("authenticates through the login endpoint", async () => {
    window.history.replaceState(null, "", "/login");
    fetchMock.mockResolvedValue(response(200, { data: {} }));

    render(<App />);
    fireEvent.change(screen.getByLabelText("Correo o usuario"), {
      target: { value: "qa.user" }
    });
    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "TestPassword1!" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Ingresar" }));

    expect((await screen.findByRole("status")).textContent).toContain("Inicio de sesión correcto.");
    expect(fetchMock).toHaveBeenCalledWith(
      "/auth/login",
      expect.objectContaining({
        body: JSON.stringify({ identifier: "qa.user", password: "TestPassword1!" })
      })
    );
  });

  it("routes temporary-password accounts to confirmation with the reset token", async () => {
    window.history.replaceState(null, "", "/login");
    fetchMock.mockResolvedValue(
      response(200, {
        data: { temporaryPasswordRequired: true, resetToken: "temporary-token" }
      })
    );

    render(<App />);
    fireEvent.change(screen.getByLabelText("Correo o usuario"), {
      target: { value: "qa.user" }
    });
    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "TemporaryPassword1!" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Ingresar" }));

    expect(await screen.findByRole("heading", { name: "Nueva contraseña" })).toBeTruthy();
    expect(window.location.pathname + window.location.search).toBe(
      "/reset-password?token=temporary-token"
    );
  });

  it("shows a generic confirmation and redirects to login after three seconds", async () => {
    window.history.replaceState(null, "", "/forgot-password");
    vi.useFakeTimers();
    fetchMock.mockResolvedValue(response(202));

    render(<App />);

    expect(screen.getByRole("img", { name: "Logotipo del SENA" })).toBeTruthy();
    expect(screen.getByText("SENA — Gestión de Horarios")).toBeTruthy();
    expect(screen.getByText("Plataforma académica")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Volver a ingresar" })).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Correo"), {
      target: { value: "persona@sena.edu.co" }
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Enviar enlace" }));
      await Promise.resolve();
      await Promise.resolve();
    });

    const notice = screen.getByRole("status");
    expect(notice.textContent).toContain(
      "Si el correo existe, enviaremos instrucciones para restablecer la contraseña."
    );
    expect(notice.getAttribute("aria-live")).toBe("polite");
    expect(notice.textContent).not.toContain("persona@sena.edu.co");
    expect(fetchMock).toHaveBeenCalledWith(
      "/auth/password-reset/request",
      expect.objectContaining({
        body: JSON.stringify({ email: "persona@sena.edu.co" })
      })
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2999);
    });
    expect(window.location.pathname).toBe("/forgot-password");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(window.location.pathname).toBe("/login");
  });

  it("returns to login from the password recovery screen", () => {
    window.history.replaceState(null, "", "/forgot-password");
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Volver a ingresar" }));

    expect(window.location.pathname).toBe("/login");
    expect(screen.getByRole("heading", { name: "Ingresar" })).toBeTruthy();
  });

  it("requires a valid email before allowing a reset request", () => {
    window.history.replaceState(null, "", "/forgot-password");
    render(<App />);

    const email = screen.getByLabelText("Correo") as HTMLInputElement;
    const submitButton = screen.getByRole("button", {
      name: "Enviar enlace"
    }) as HTMLButtonElement;

    expect(email.required).toBe(true);
    expect(submitButton.disabled).toBe(true);
    fireEvent.change(email, { target: { value: "not-an-email" } });
    expect(email.checkValidity()).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not send duplicate reset requests while one is in flight", async () => {
    window.history.replaceState(null, "", "/forgot-password");
    let resolveResponse: (value: Response) => void = () => {
      throw new Error("The reset request was not started.");
    };
    fetchMock.mockReturnValue(
      new Promise<Response>((resolve) => {
        resolveResponse = resolve;
      })
    );

    render(<App />);
    fireEvent.change(screen.getByLabelText("Correo"), {
      target: { value: "persona@sena.edu.co" }
    });
    const form = screen.getByRole("button", { name: "Enviar enlace" }).closest("form");
    expect(form).not.toBeNull();

    fireEvent.submit(form!);
    fireEvent.submit(form!);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveResponse(response(202));
    });
    expect(await screen.findByRole("status")).toBeTruthy();
  });

  it("does not redirect when the reset request fails", async () => {
    window.history.replaceState(null, "", "/forgot-password");
    vi.useFakeTimers();
    fetchMock.mockResolvedValue(
      response(500, { error: { message: "internal service detail" } })
    );

    render(<App />);
    fireEvent.change(screen.getByLabelText("Correo"), {
      target: { value: "persona@sena.edu.co" }
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Enviar enlace" }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByRole("alert").textContent).toContain(
      "No pudimos procesar la solicitud. Inténtalo de nuevo más tarde."
    );
    expect(screen.getByRole("alert").textContent).not.toContain("internal service detail");
    expect(vi.getTimerCount()).toBe(0);
    expect(window.location.pathname).toBe("/forgot-password");
  });

  it("confirms the new password with the query token and returns to login", async () => {
    window.history.replaceState(null, "", "/reset-password?token=valid-reset-token");
    fetchMock.mockResolvedValue(response(204));

    render(<App />);

    fireEvent.change(screen.getByLabelText("Nueva contraseña"), {
      target: { value: "StrongPass1!" }
    });
    fireEvent.change(screen.getByLabelText("Confirmar contraseña"), {
      target: { value: "StrongPass1!" }
    });
    fireEvent.click(screen.getByRole("button", { name: /Guardar contraseña/ }));

    await waitFor(() => expect(window.location.pathname).toBe("/login"));
    expect(screen.getByRole("heading", { name: "Ingresar" })).toBeTruthy();
    expect((await screen.findByRole("status")).textContent).toContain(
      "Contraseña actualizada correctamente."
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/auth/password-reset/confirm",
      expect.objectContaining({
        body: JSON.stringify({
          token: "valid-reset-token",
          new_password: "StrongPass1!"
        })
      })
    );
  });

  it("shows the expired-token error and lets the user request a new link", async () => {
    window.history.replaceState(null, "", "/reset-password?token=expired-token");
    fetchMock.mockResolvedValue(
      response(400, {
        error: { code: "IAM_INVALID_RESET_TOKEN" }
      })
    );

    render(<App />);

    fireEvent.change(screen.getByLabelText("Nueva contraseña"), {
      target: { value: "StrongPass1!" }
    });
    fireEvent.change(screen.getByLabelText("Confirmar contraseña"), {
      target: { value: "StrongPass1!" }
    });
    fireEvent.click(screen.getByRole("button", { name: /Guardar contraseña/ }));

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("El enlace expiró o ya fue usado. Solicita uno nuevo.");
    fireEvent.click(screen.getByRole("button", { name: "Solicitar nuevo enlace" }));

    await waitFor(() => expect(window.location.pathname).toBe("/forgot-password"));
  });
});
