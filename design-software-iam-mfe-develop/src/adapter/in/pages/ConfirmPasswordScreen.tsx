import { FormEvent, useMemo, useState } from "react";
import { ArrowLeft, Check, ChevronRight, Eye, EyeOff, KeyRound, LockKeyhole } from "lucide-react";
import { useConfirmReset } from "../../../application/useConfirmReset";
import { getPasswordPolicy } from "../../../domain/passwordPolicy";
import { NoticeBanner } from "../components/NoticeBanner";
import { getResetToken } from "../routes";
import { Notice } from "../types";

type ConfirmPasswordScreenProps = {
  notice: Notice;
  onNotice: (notice: Notice) => void;
  onRequestNew: () => void;
  onPasswordChanged: () => void;
};

export function ConfirmPasswordScreen({
  notice,
  onNotice,
  onRequestNew,
  onPasswordChanged
}: ConfirmPasswordScreenProps) {
  const [token, setToken] = useState(getResetToken);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const confirmReset = useConfirmReset();

  const checks = useMemo(() => getPasswordPolicy(password), [password]);
  const passwordValid = checks.every((check) => check.valid);
  const matches = password.length > 0 && password === confirmation;
  const canSubmit = Boolean(token.trim()) && passwordValid && matches && !loading;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    onNotice(null);

    try {
      await confirmReset(token, password);
      onPasswordChanged();
    } catch (error) {
      onNotice({
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "El token venció o no es válido. Solicita uno nuevo."
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button className="ghost-link" type="button" onClick={onRequestNew}>
        <ArrowLeft size={18} aria-hidden="true" />
        Solicitar nuevo enlace
      </button>

      <header className="form-header">
        <div className="icon-badge">
          <LockKeyhole size={24} aria-hidden="true" />
        </div>
        <h2>Nueva contraseña</h2>
        <p>Define una clave segura para continuar al inicio de sesión.</p>
      </header>

      <NoticeBanner notice={notice} />

      <form className="auth-form" onSubmit={handleSubmit}>
        <label htmlFor="token">Token de recuperación</label>
        <div className="input-wrap">
          <KeyRound size={18} aria-hidden="true" />
          <input
            id="token"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder="Token recibido"
            required
          />
        </div>

        <label htmlFor="password">Nueva contraseña</label>
        <div className="input-wrap">
          <LockKeyhole size={18} aria-hidden="true" />
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
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

        <ul className="policy-list" aria-label="Política de contraseña">
          {checks.map((check) => (
            <li key={check.id} className={check.valid ? "valid" : ""}>
              <Check size={15} aria-hidden="true" />
              {check.label}
            </li>
          ))}
        </ul>

        <label htmlFor="confirmation">Confirmar contraseña</label>
        <div className="input-wrap">
          <LockKeyhole size={18} aria-hidden="true" />
          <input
            id="confirmation"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            required
          />
        </div>

        {confirmation && !matches ? (
          <p className="field-error">Las contraseñas no coinciden.</p>
        ) : null}

        <button className="primary-button" type="submit" disabled={!canSubmit}>
          {loading ? "Actualizando..." : "Guardar contraseña"}
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </form>
    </>
  );
}
