import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { CheckCircle2, CircleAlert, Info, X } from "lucide-react";

export type ToastVariant = "success" | "error" | "warning" | "info";

type ToastInput = {
  title?: string;
  message: string;
  variant?: ToastVariant;
  duration?: number;
};

type ToastItem = Required<Pick<ToastInput, "message" | "variant" | "duration">> & {
  id: number;
  title?: string;
};

type ToastContextValue = {
  showToast: (toast: ToastInput) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const toastStyles: Record<ToastVariant, { icon: typeof Info; accent: string; iconClassName: string; title: string }> = {
  success: { icon: CheckCircle2, accent: "border-emerald-200", iconClassName: "bg-emerald-50 text-emerald-600", title: "Operación realizada" },
  error: { icon: CircleAlert, accent: "border-rose-200", iconClassName: "bg-rose-50 text-rose-600", title: "No se pudo completar" },
  warning: { icon: CircleAlert, accent: "border-amber-200", iconClassName: "bg-amber-50 text-amber-600", title: "Revisa la información" },
  info: { icon: Info, accent: "border-blue-200", iconClassName: "bg-blue-50 text-blue-600", title: "Información" },
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((toast: ToastInput) => {
    const item: ToastItem = {
      id: Date.now() + Math.floor(Math.random() * 1_000),
      message: toast.message,
      title: toast.title,
      variant: toast.variant ?? "info",
      duration: toast.duration ?? 5_000,
    };
    setToasts((current) => [...current.slice(-3), item]);
  }, []);

  const value = useMemo<ToastContextValue>(() => ({
    showToast,
    success: (message, title) => showToast({ message, title, variant: "success" }),
    error: (message, title) => showToast({ message, title, variant: "error", duration: 7_000 }),
    warning: (message, title) => showToast({ message, title, variant: "warning" }),
    info: (message, title) => showToast({ message, title, variant: "info" }),
  }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3" aria-live="polite">
        {toasts.map((toast) => <Toast key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />)}
      </div>
    </ToastContext.Provider>
  );
};

const Toast = ({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) => {
  const style = toastStyles[toast.variant];
  const Icon = style.icon;

  useEffect(() => {
    const timeout = window.setTimeout(onDismiss, toast.duration);
    return () => window.clearTimeout(timeout);
  }, [onDismiss, toast.duration]);

  return (
    <div className={`pointer-events-auto animate-in slide-in-from-right-4 rounded-xl border bg-white p-4 shadow-xl shadow-slate-900/10 ${style.accent}`} role={toast.variant === "error" ? "alert" : "status"}>
      <div className="flex items-start gap-3">
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${style.iconClassName}`}><Icon className="h-5 w-5" /></span>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-sm font-bold text-slate-900">{toast.title ?? style.title}</p>
          <p className="mt-1 text-sm leading-5 text-slate-600">{toast.message}</p>
        </div>
        <button type="button" onClick={onDismiss} className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600" aria-label="Cerrar notificación"><X className="h-4 w-4" /></button>
      </div>
    </div>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast debe utilizarse dentro de ToastProvider.");
  return context;
};
