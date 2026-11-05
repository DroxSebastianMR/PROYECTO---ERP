import { useState, type FormEvent } from "react";
import { CheckCircle2, Eye, EyeOff, LockKeyhole, Save } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { PATHS } from "@/app/router/constants/paths";
import { Button } from "@/components/ui/button";
import { AuthInput } from "@/features/auth/components/auth-input";
import { authService } from "@/features/auth/services/auth.service";
import { ApiError } from "@/lib/api/http-client";

export const ResetPasswordForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const token = searchParams.get("token");

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return setError("El enlace de recuperación no es válido.");
    if (password.length < 8) return setError("La contraseña debe tener al menos 8 caracteres.");
    if (password !== confirmation) return setError("Las contraseñas no coinciden.");

    setError(null);
    try {
      setIsSubmitting(true);
      await authService.resetPassword({ token, password });
      setIsCompleted(true);
    } catch (submissionError) {
      setError(
        submissionError instanceof ApiError
          ? submissionError.message
          : "No se pudo cambiar la contraseña. Solicita un enlace nuevo.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const passwordVisibility = (
    <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="text-slate-400 transition hover:text-slate-600" aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}>
      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
    </button>
  );

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <div className="space-y-5">
        <AuthInput id="new-password" label="Nueva contraseña" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="••••••••" Icon={LockKeyhole} rightElement={passwordVisibility} value={password} onChange={(event) => setPassword(event.target.value)} disabled={isSubmitting || isCompleted} required />
        <AuthInput id="confirm-password" label="Confirmar contraseña" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="••••••••" Icon={LockKeyhole} rightElement={passwordVisibility} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} disabled={isSubmitting || isCompleted} required />
      </div>
      <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-5 text-slate-600">
        Usa al menos 8 caracteres y evita reutilizar contraseñas anteriores.
      </p>
      {isCompleted && (
        <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-5 text-emerald-800">
          Contraseña actualizada correctamente. <Link to={PATHS.AUTH.LOGIN} className="font-semibold underline">Inicia sesión</Link> con tu nueva contraseña.
        </p>
      )}
      {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <Button type="submit" disabled={isSubmitting || isCompleted} className="h-12 w-full rounded-xl text-[15px] font-medium shadow-sm hover:shadow-md">
        {isSubmitting ? "Guardando contraseña..." : isCompleted ? "Contraseña actualizada" : "Guardar nueva contraseña"}
        {isCompleted ? <CheckCircle2 className="ml-2.5 h-[18px] w-[18px]" /> : <Save className="ml-2.5 h-[18px] w-[18px]" />}
      </Button>
    </form>
  );
};
