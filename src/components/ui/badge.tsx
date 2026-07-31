import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-blue-600 text-white hover:bg-blue-600/80",
        secondary: "border-transparent bg-slate-100 text-slate-800 hover:bg-slate-200",
        outline: "text-slate-950 border border-slate-200",
        success: "border-transparent bg-emerald-50 text-emerald-700 border border-emerald-200/60",
        warning: "border-transparent bg-amber-50 text-amber-700 border border-amber-200/60",
        destructive: "border-transparent bg-rose-50 text-rose-700 border border-rose-200/60",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export const Badge = ({ className, variant, ...props }: BadgeProps) => {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
};
