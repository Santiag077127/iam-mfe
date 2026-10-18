import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "../../src/App";

afterEach(() => {
  cleanup();
  window.history.replaceState(null, "", "/login");
});

describe("HU-IAM-015 remote authorization boundary", () => {
  it("fails closed when the shell has not granted the management feature", () => {
    window.history.replaceState(null, "", "/iam/users");
    render(<App />);

    expect(screen.getByRole("heading", { name: "Acceso no autorizado" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Administración de usuarios" })).toBeNull();
  });

  it("renders the users page only when the shell grants the feature", () => {
    window.history.replaceState(null, "", "/iam/users");
    render(<App canManageUsers />);

    expect(screen.getByRole("heading", { name: "Administración de usuarios" })).toBeTruthy();
  });
});
