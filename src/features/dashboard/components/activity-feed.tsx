import { AlertTriangle, FileText, ShoppingBasket, UserRoundPlus } from "lucide-react";
import type { Activity, ActivityKind } from "@/features/dashboard/types/dashboard.types";

const activityStyle: Record<ActivityKind, { Icon: typeof UserRoundPlus; color: string }> = {
  client: { Icon: UserRoundPlus, color: "bg-blue-600 text-white" },
  purchase: { Icon: ShoppingBasket, color: "bg-emerald-50 text-emerald-700" },
  alert: { Icon: AlertTriangle, color: "bg-red-100 text-red-700" },
  report: { Icon: FileText, color: "bg-slate-200 text-slate-600" },
};
type ActivityFeedProps = { activities: Activity[]; showAll: boolean; onToggle: () => void };
export const ActivityFeed = ({ activities, showAll, onToggle }: ActivityFeedProps) => {
  const visibleActivities = showAll ? activities : activities.slice(0, 3);
  return (
    <article className="h-full min-w-0 rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_10px_24px_rgba(37,99,235,.035)] sm:p-6">
      <h2 className="text-lg font-semibold">Actividad Reciente</h2>
      <div className="mt-7 space-y-6">
        {visibleActivities.map((activity, index) => {
          const { Icon, color } = activityStyle[activity.kind];
          return (
            <div key={activity.id} className="relative flex gap-4">
              <div
                className={`z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full ${color}`}
              >
                <Icon className="h-4 w-4" />
              </div>
              {index < visibleActivities.length - 1 && (
                <i className="absolute left-[18px] top-9 h-12 w-px bg-slate-200" />
              )}
              <div className="text-sm leading-5">
                <p className="font-medium">
                  {activity.title}
                  <br />
                  {activity.detail}
                </p>
                <p className="mt-1 text-xs text-slate-600">{activity.timestamp}</p>
              </div>
            </div>
          );
        })}
      </div>
      <button
        onClick={onToggle}
        className="mt-7 h-10 w-full rounded-lg border border-slate-200 text-sm text-slate-700 hover:bg-slate-50"
      >
        {showAll ? "Ver menos" : "Ver todo el historial"}
      </button>
    </article>
  );
};
