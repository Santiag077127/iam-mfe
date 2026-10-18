import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import App from "../../src/App";

describe("RBAC route guard", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/iam/rbac");
  });

  afterEach(() => {
    cleanup();
    window.history.replaceState(null, "", "/");
  });

  it("denies access when the shell does not grant IDENTITY_ROLE_VIEW", () => {
    render(<App />);

    expect(screen.getByRole("alert").textContent).toContain(
      "Acceso no autorizado"
    );
  });

  it("shows an error when authorized but the shell omits the RBAC port", () => {
    render(<App canViewRoleConfig />);

    expect(screen.getByRole("alert").textContent).toContain(
      "Servicio RBAC no disponible"
    );
  });
});