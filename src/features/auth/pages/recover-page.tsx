import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { PATHS } from "@/app/router/constants/paths";
import { RecoverPasswordForm } from "@/features/auth/forms/recover-password-form";

export const RecoverPage = () => (
  <>
    <Link to={PATHS.AUTH.LOGIN} className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 transition hover:text-blue-700">
      <ArrowLeft className="h-4 w-4" /> Volver al inicio de sesión
    </Link>
    <header className="mb-9 mt-8">
      <h1 className="text-[29px] font-semibold tracking-[-0.045em] text-slate-950">Recuperar contraseña</h1>
      <p className="mt-2 text-[15px] font-light leading-6 text-slate-500">
        Ingresa tu correo corporativo, correo personal o DNI para recuperar el acceso a tu cuenta.
      </p>
    </header>
    <RecoverPasswordForm />
  </>
);
