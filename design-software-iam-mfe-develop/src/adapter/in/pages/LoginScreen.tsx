import { FormEvent, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { getTemporaryPasswordRedirect } from "../../../application/temporaryPasswordGuard";
import { login } from "../../out/auth";
import { NoticeBanner } from "../components/NoticeBanner";
import { Notice } from "../types";

type LoginScreenProps = {
  initialNotice: Notice;
  onNotice: (notice: Notice) => void;
  onForgotPassword: () => void;
  onTemporaryPassword: (token?: string) => void;
};

export function LoginScreen({
  initialNotice,
  onNotice,
  onForgotPassword,
  onTemporaryPassword
}: LoginScreenProps) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    onNotice(null);

    try {
      const response = await login(identifier.trim(), password);
      const redirect = getTemporaryPasswordRedirect({
        temporaryPasswordRequired: response.data?.temporaryPasswordRequired,
        resetToken: response.data?.resetToken
      });

      if (redirect) {
        const token = new URLSearchParams(redirect.split("?")[1] ?? "").get("token") ?? undefined;
        onTemporaryPassword(token);
        return;
      }

      onNotice({
        kind: "success",
        message: "Inicio de sesión correcto. El shell puede continuar con la ruta privada."
      });
    } catch (error) {
      onNotice({
        kind: "error",
        message: error instanceof Error ? error.message : "No pudimos iniciar sesión."
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <header className="form-header compact">
        <h1>Ingresar</h1>
        <p>Accede con tu cuenta institucional.</p>
      </header>

      <NoticeBanner notice={initialNotice} />

      <form className="auth-form" onSubmit={handleSubmit}>
        <label htmlFor="login-identifier">Correo o usuario</label>
        <div className="input-wrap">
          <input
            id="login-identifier"
            autoComplete="username"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            placeholder="correo@institucion.edu.co"
            required
          />
        </div>

        <label htmlFor="login-password">Contraseña</label>
        <div className="input-wrap">
          <input
            id="login-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <button
            className="icon-button"
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <div className="forgot-row">
          <button className="inline-action" type="button" onClick={onForgotPassword}>
            ¿Olvidó su contraseña?
          </button>
        </div>

        <button
          className="primary-button"
          type="submit"
          disabled={loading || !identifier || !password}
        >
          {loading ? "Validando..." : "Ingresar"}
        </button>
      </form>

      <p className="auth-disclaimer">Uso exclusivo de personal y comunidad académica autorizada.</p>
    </>
  );
}
