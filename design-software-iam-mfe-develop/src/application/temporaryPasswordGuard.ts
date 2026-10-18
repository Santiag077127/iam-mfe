export type LoginPasswordState = {
  temporaryPasswordRequired?: boolean;
  resetToken?: string;
};

export function getTemporaryPasswordRedirect(state: LoginPasswordState) {
  if (!state.temporaryPasswordRequired) return null;

  const params = new URLSearchParams();
  if (state.resetToken) params.set("token", state.resetToken);

  return `/reset-password${params.toString() ? `?${params.toString()}` : ""}`;
}
