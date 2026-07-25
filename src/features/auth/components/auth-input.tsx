import type { InputHTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type AuthInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  Icon: LucideIcon;
  rightElement?: ReactNode;
};
export const AuthInput = ({
  label,
  Icon,
  rightElement,
  className,
  id,
  ...props
}: AuthInputProps) => (
  <div className="space-y-2">
    <label
      htmlFor={id}
      className="block text-[12px] font-medium uppercase tracking-[.075em] text-slate-900"
    >
      {label}
    </label>
    <div className="relative">
      <Icon
        className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400"
        strokeWidth={1.8}
      />
      <input
        id={id}
        className={cn(
          "h-12 w-full rounded-xl border border-slate-200 bg-slate-50/80 py-3 pl-12 pr-11 text-[15px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100",
          className,
        )}
        {...props}
      />
      {rightElement && (
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2">{rightElement}</div>
      )}
    </div>
  </div>
);
