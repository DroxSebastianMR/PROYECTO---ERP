import { useState, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { PATHS } from "@/app/router/constants/paths";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AuthInput } from "@/features/auth/components/auth-input";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { ApiError } from "@/lib/api/http-client";

export const LoginForm = () => {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError("Ingresa tu correo y contraseña.");
      return;
    }

    try {
      setIsSubmitting(true);
      await login({ email: email.trim(), password }, rememberMe);
    } catch (submissionError) {
      setError(
        submissionError instanceof ApiError
          ? submissionError.message
          : "No se pudo iniciar sesión. Inténtalo nuevamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <div className="space-y-5">
        <AuthInput
          id="email"
          label="Usuario o correo electrónico"
          type="email"
          autoComplete="username"
          placeholder="ejemplo@districorp.com"
          Icon={UserRound}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <AuthInput
          id="password"
          label="Contraseña"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          placeholder="••••••••"
          Icon={LockKeyhole}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              className="text-slate-400 transition hover:text-slate-600"
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          }
        />
      </div>
      <div className="flex items-center justify-between gap-3 pt-0.5">
        <label
          htmlFor="remember"
          className="flex cursor-pointer items-center gap-2.5 text-[15px] font-light text-slate-600"
        >
          <Checkbox
            id="remember"
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(checked === true)}
          />
          <span>Recordar sesión</span>
        </label>
        <Link
          to={PATHS.AUTH.FORGOT_PASSWORD}
          className="whitespace-nowrap text-[15px] font-medium text-blue-600 transition hover:text-blue-700"
        >
          ¿Olvidaste tu contraseña?
        </Link>
      </div>
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 h-12 w-full rounded-xl text-[15px] font-medium shadow-sm hover:shadow-md"
      >
        {isSubmitting ? "Iniciando sesión..." : "Iniciar sesión"}
        <ArrowRight className="ml-2.5 h-[18px] w-[18px]" />
      </Button>
    </form>
  );
};
