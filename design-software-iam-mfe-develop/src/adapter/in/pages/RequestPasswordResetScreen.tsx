import { FormEvent, useEffect, useRef, useState } from "react";
import { useRequestReset } from "../../../application/useRequestReset";
import { NoticeBanner } from "../components/NoticeBanner";
import { Notice } from "../types";

type RequestPasswordResetScreenProps = {
  notice: Notice;
  onNotice: (notice: Notice) => void;
  onBackToLogin: () => void;
};

export function RequestPasswordResetScreen({
  notice,
  onNotice,
  onBackToLogin
}: RequestPasswordResetScreenProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const inFlight = useRef(false);
  const alreadyAccepted = useRef(false);
  const redirectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestReset = useRequestReset();

  useEffect(
    () => () => {
      if (redirectTimeout.current !== null) clearTimeout(redirectTimeout.current);
    },
    []
  );

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (inFlight.current || alreadyAccepted.current) return;

    inFlight.current = true;
    setLoading(true);
    onNotice(null);

    try {
      await requestReset(email);
      alreadyAccepted.current = true;
      setAccepted(true);
      onNotice({
        kind: "success",
        message: "Si el correo existe, enviaremos instrucciones para restablecer la contraseña."
      });
      redirectTimeout.current = setTimeout(onBackToLogin, 3000);
    } catch {
      onNotice({
        kind: "error",
        message: "No pudimos procesar la solicitud. Inténtalo de nuevo más tarde."
      });
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }

  return (
    <>
      <header className="form-header reset-header">
        <h1>Recuperar contraseña</h1>
        <p>Ingresa tu correo institucional. Si existe una cuenta, enviaremos instrucciones.</p>
      </header>

      <NoticeBanner notice={notice} />

      <form className="auth-form request-form" onSubmit={handleSubmit}>
        <label htmlFor="email">Correo</label>
        <div className="input-wrap">
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            disabled={accepted}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="nombre@sena.edu.co"
            required
          />
        </div>

        <div className="request-actions">
          <button className="secondary-button" type="button" onClick={onBackToLogin}>
            Volver a ingresar
          </button>
          <button className="primary-button" type="submit" disabled={loading || accepted || !email.trim()}>
            {loading ? "Enviando..." : "Enviar enlace"}
          </button>
        </div>
      </form>
    </>
  );
}
