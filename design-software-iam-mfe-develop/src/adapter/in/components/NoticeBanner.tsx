import { Check, TriangleAlert } from "lucide-react";
import { Notice } from "../types";

export function NoticeBanner({ notice }: { notice: Notice }) {
  if (!notice) return null;

  const isError = notice.kind === "error";

  return (
    <div
      className={"notice " + notice.kind}
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
    >
      {isError ? (
        <TriangleAlert size={18} aria-hidden="true" />
      ) : (
        <Check size={18} aria-hidden="true" />
      )}
      <span>{notice.message}</span>
    </div>
  );
}
