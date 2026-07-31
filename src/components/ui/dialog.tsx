import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "4xl";
  page?: boolean;
}

export const Dialog = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = "lg",
  page = false,
}: DialogProps) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    if (isOpen && !page) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, page]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "4xl": "max-w-4xl",
  };

  return (
    <div
      className={cn(
        page ? "min-h-full" : "fixed inset-0 z-50 flex items-center justify-center p-4",
      )}
    >
      {/* Backdrop */}
      {!page && (
        <div
          className="animate-in fade-in-0 fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-200"
          onClick={onClose}
        />
      )}
      {/* Modal Container */}
      <div
        className={cn(
          page
            ? "animate-in fade-in-0 relative mx-auto w-full max-w-[1180px] duration-200"
            : "animate-in zoom-in-95 relative z-50 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl duration-200",
          !page && maxWidthClasses[maxWidth],
        )}
      >
        <div
          className={cn(
            "flex items-center justify-between",
            page ? "px-1 pb-6 pt-1" : "border-b border-slate-100 px-6 py-4",
          )}
        >
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h3>
            {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className={cn(page ? "pb-12" : "max-h-[80vh] overflow-y-auto p-6")}>{children}</div>
      </div>
    </div>
  );
};
