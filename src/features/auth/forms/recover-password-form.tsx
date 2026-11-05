import { useState, type FormEvent } from "react";
import { CheckCircle2, ContactRound, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthInput } from "@/features/auth/components/auth-input";
import { authService } from "@/features/auth/services/auth.service";
import { ApiError } from "@/lib/api/http-client";

export const RecoverPasswordForm = () => {
  const [identifier, setIdentifier] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSent, setIsSent] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!identifier.trim()) {
      setError("Ingresa tu correo o DNI.");
      return;
    }

    setError(null);
    try {
      setIsSubmitting(true);
      await authService.requestPasswordRecovery({ identifier: identifier.trim() });
      setIsSent(true);
    } catch (submissionError) {
      setError(
        submissionError instanceof ApiError
          ? submissionError.message
          : "No se pudo iniciar la recuperación. Inténtalo nuevamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <AuthInput
        id="recovery-identifier"
        label="Correo corporativo, personal o DNI"
        type="text"
        autoComplete="username"
        placeholder="Ingresa tu correo o DNI"
        Icon={ContactRound}
        value={identifier}
        onChange={(event) => setIdentifier(event.target.value)}
        disabled={isSubmitting || isSent}
        required
      />
      <p className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-5 text-slate-600">
        Verificaremos los datos ingresados y enviaremos el enlace al correo personal vinculado a tu cuenta.
      </p>
      {isSent && (
        <p role="status" className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-5 text-emerald-800">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          Si los datos coinciden con una cuenta, enviamos las instrucciones a tu correo personal.
        </p>
      )}
      {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <Button type="submit" disabled={isSubmitting || isSent} className="h-12 w-full rounded-xl text-[15px] font-medium shadow-sm hover:shadow-md">
        {isSubmitting ? "Enviando enlace..." : isSent ? "Enlace enviado" : "Enviar enlace de recuperación"}
        {isSent ? <CheckCircle2 className="ml-2.5 h-[18px] w-[18px]" /> : <Send className="ml-2.5 h-[18px] w-[18px]" />}
      </Button>
    </form>
  );
};
