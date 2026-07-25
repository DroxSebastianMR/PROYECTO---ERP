import { useState, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { PATHS } from "@/app/router/constants/paths";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AuthInput } from "@/features/auth/components/auth-input";

export const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const onSubmit = (event: FormEvent) => event.preventDefault();
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
        />
        <AuthInput
          id="password"
          label="Contraseña"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          placeholder="••••••••"
          Icon={LockKeyhole}
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
      <Button
        type="submit"
        className="mt-2 h-12 w-full rounded-xl text-[15px] font-medium shadow-sm hover:shadow-md"
      >
        Iniciar Sesión <ArrowRight className="ml-2.5 h-[18px] w-[18px]" />
      </Button>
    </form>
  );
};
