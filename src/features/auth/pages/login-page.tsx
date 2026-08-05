import { LoginForm } from "@/features/auth/forms/login-form";

export const LoginPage = () => (
  <>
    <header className="mb-9">
      <h1 className="text-[29px] font-semibold tracking-[-0.045em] text-slate-950">Bienvenido</h1>
      <p className="mt-2 text-[15px] font-light text-slate-500">
        Ingrese sus credenciales para continuar de forma segura.
      </p>
    </header>
    <LoginForm />
    <footer className="mt-14 text-center font-mono text-[11px] tracking-[.08em] text-slate-400">
      Versión 2.5.0 · Clienty · Sistema de Ventas
    </footer>
  </>
);
