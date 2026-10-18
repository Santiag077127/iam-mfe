import { useCallback } from "react";
import { confirmPasswordReset } from "../adapter/out/auth";

export function useConfirmReset() {
  return useCallback(
    (token: string, password: string) => confirmPasswordReset(token.trim(), password),
    []
  );
}
