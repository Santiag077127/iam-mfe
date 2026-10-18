import { afterEach, describe, expect, it } from "vitest";
import { getInitialScreen, getResetToken, updateBrowserRoute } from "../../src/adapter/in/routes";
import { getTemporaryPasswordRedirect } from "../../src/application/temporaryPasswordGuard";

describe("auth routes", () => {
  afterEach(() => {
    window.history.replaceState(null, "", "/login");
  });

  it("detects the request reset screen from the shell route", () => {
    window.history.replaceState(null, "", "/forgot-password");

    expect(getInitialScreen()).toBe("request");
  });

  it("opens login for the /login route and as the default route", () => {
    window.history.replaceState(null, "", "/login");
    expect(getInitialScreen()).toBe("login");

    window.history.replaceState(null, "", "/");
    expect(getInitialScreen()).toBe("login");
  });

  it("detects the HU-IAM-015 users route under the remote base path", () => {
    window.history.replaceState(null, "", "/iam/users");
    expect(getInitialScreen()).toBe("users");
  });

  it("updates the browser route to login", () => {
    window.history.replaceState(null, "", "/forgot-password");

    updateBrowserRoute("login");

    expect(window.location.pathname).toBe("/login");
  });

  it("detects the confirm screen and token from hash routing", () => {
    window.history.replaceState(null, "", "/#/reset-password?token=hash-token");

    expect(getInitialScreen()).toBe("confirm");
    expect(getResetToken()).toBe("hash-token");
  });

  it("preserves hash routing when updating the browser route", () => {
    window.history.replaceState(null, "", "/#/login");

    updateBrowserRoute("confirm", "temporary-token");

    expect(window.location.hash).toBe("#/reset-password?token=temporary-token");
  });

  it("points temporary-password users to the reset password screen", () => {
    expect(
      getTemporaryPasswordRedirect({
        temporaryPasswordRequired: true,
        resetToken: "temporary-token"
      })
    ).toBe("/reset-password?token=temporary-token");
  });
});
