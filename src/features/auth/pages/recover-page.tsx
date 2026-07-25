import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { PATHS } from "@/app/router/constants/paths";

/** Visual placeholder for the next authentication flow. */
export const RecoverPage = () => (
  <div>
    <Link
      to={PATHS.AUTH.LOGIN}
      className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
    >
      <ArrowLeft className="h-4 w-4" /> Volver al inicio de sesión
    </Link>
    <header className="mt-10">
      <h1 className="text-[32px] font-semibold tracking-[-0.045em] text-slate-950">
        Recuperar contraseña
      </h1>
      <p className="mt-3 text-[17px] font-light text-slate-500">
        Esta vista estará disponible al conectar el flujo de autenticación.
      </p>
    </header>
  </div>
);
