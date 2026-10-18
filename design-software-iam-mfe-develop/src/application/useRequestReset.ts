import { useCallback } from "react";
import { requestPasswordReset } from "../adapter/out/auth";

export function useRequestReset() {
  return useCallback((email: string) => requestPasswordReset(email.trim()), []);
}
