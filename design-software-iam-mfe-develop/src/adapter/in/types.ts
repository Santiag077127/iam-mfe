export type Screen = "login" | "request" | "confirm" | "users" | "rbac";

export type Notice = {
  kind: "success" | "error" | "info";
  message: string;
} | null;
