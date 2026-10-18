import { PropsWithChildren } from "react";
import { Screen } from "../types";

type AuthLayoutProps = PropsWithChildren<{
  screen: Screen;
}>;

export function AuthLayout({ children, screen }: AuthLayoutProps) {
  const cardClassName = ["auth-card", screen === "request" ? "request-card" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <main className={"auth-shell " + screen + "-page"} data-mfe="iam">
      <header className="brand-panel">
        <div className="brand-link">
          <img className="brand-mark" src="/images/sena-logo.png" alt="Logotipo del SENA" />
          <span className="brand-copy">
            <strong>SENA — Gestión de Horarios</strong>
            <span>Plataforma académica</span>
          </span>
        </div>
      </header>

      <section className={cardClassName} aria-label="Autenticación">
        <section className="form-panel">
          <div className="form-card">{children}</div>
        </section>
      </section>
    </main>
  );
}
