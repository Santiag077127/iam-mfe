import { Screen } from "./types";

const SCREEN_PATHS: Record<Screen, string> = {
  login: "/login",
  request: "/forgot-password",
  confirm: "/reset-password",
  users: "/iam/users",
  rbac: "/iam/rbac"
};

function getHashPath() {
  return window.location.hash.startsWith("#") ? window.location.hash.slice(1) : "";
}

function getCurrentPath() {
  return `${window.location.pathname}${getHashPath()}`;
}

function getSearchParams() {
  const hash = getHashPath();
  const hashQuery = hash.includes("?") ? hash.slice(hash.indexOf("?") + 1) : "";
  const browserQuery = window.location.search.startsWith("?")
    ? window.location.search.slice(1)
    : window.location.search;

  return new URLSearchParams(hashQuery || browserQuery);
}

export function getInitialScreen(): Screen {
  const params = getSearchParams();
  const path = getCurrentPath();

  if (path.endsWith("/iam/rbac")) return "rbac";
  if (path.endsWith("/iam/users")) return "users";
  if (params.has("token")) return "confirm";
  if (
    path.includes("forgot-password") ||
    path.includes("password-reset") ||
    path.includes("recuperar")
  ) {
    return "request";
  }
  if (
    path.includes("reset-password") ||
    path.includes("new-password") ||
    path.includes("nueva-contrasena")
  ) {
    return "confirm";
  }

  return "login";
}

export function getResetToken() {
  return getSearchParams().get("token") ?? "";
}

export function getRouteMessage() {
  return getSearchParams().get("message");
}

export function updateBrowserRoute(screen: Screen, token?: string) {
  const params = new URLSearchParams();
  if (token) params.set("token", token);

  const query = params.toString();
  const nextPath = SCREEN_PATHS[screen] + (query ? "?" + query : "");

  if (window.location.hash.startsWith("#/")) {
    window.history.replaceState(null, "", `${window.location.pathname}#${nextPath}`);
    return;
  }

  window.history.replaceState(null, "", nextPath);
}

export function redirectToLogin(message?: string) {
  const params = new URLSearchParams();
  if (message) params.set("message", message);

  const query = params.toString();
  const nextPath = `/login${query ? `?${query}` : ""}`;

  if (window.location.hash.startsWith("#/")) {
    window.history.replaceState(null, "", `${window.location.pathname}#${nextPath}`);
    return;
  }

  window.history.replaceState(null, "", nextPath);
}
