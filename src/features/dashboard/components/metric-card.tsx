import type { LucideIcon } from "lucide-react";
import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

type MetricCardProps = {
  title: string;
  value: string;
  Icon: LucideIcon;
  trend?: string;
  alert?: boolean;
};
export const MetricCard = ({ title, value, Icon, trend, alert }: MetricCardProps) => (
  <article
    className={cn(
      "min-h-[142px] rounded-xl border bg-white p-4 shadow-[0_8px_20px_rgba(37,99,235,.03)]",
      alert ? "border-red-200 bg-red-50/35" : "border-slate-100",
    )}
  >
    <div className="flex items-start justify-between">
      <div
        className={cn(
          "grid h-10 w-10 place-items-center rounded-lg",
          alert ? "bg-red-100 text-red-700" : "bg-blue-50 text-blue-700",
        )}
      >
        <Icon className="h-[18px] w-[18px]" />
      </div>
      {trend && (
        <span className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-[10px] font-medium text-blue-700">
          <TrendingUp className="h-3 w-3" />
          {trend}
        </span>
      )}
    </div>
    <div className="mt-3">
      <p className={cn("text-[13px]", alert ? "text-red-700" : "text-slate-700")}>{title}</p>
      <p
        className={cn(
          "mt-1 text-[25px] font-semibold tracking-[-.045em]",
          alert ? "text-red-700" : "text-slate-950",
        )}
      >
        {value}
      </p>
    </div>
  </article>
);
