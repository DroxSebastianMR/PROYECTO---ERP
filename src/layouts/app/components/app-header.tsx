import { useState } from "react";
import { Bell, CalendarDays, CheckCheck, ChevronDown, Mail, Menu, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useNotifications } from "@/features/notifications/hooks/use-notifications";

export const AppHeader = () => {
  const { user } = useAuth();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const initials = user?.fullName.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase() ?? "US";
  return (
  <header className="fixed inset-x-0 top-0 z-30 flex h-[60px] items-center justify-between border-b border-slate-200 bg-white/90 px-5 backdrop-blur lg:left-[256px] lg:px-8">
    <button className="mr-3 text-slate-600 lg:hidden">
      <Menu />
    </button>
    <div className="relative hidden w-[260px] sm:block">
      <Search className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
      <input
        placeholder="Buscar..."
        className="h-9 w-full rounded-full bg-slate-100 pl-10 pr-4 text-[13px] outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-blue-100"
      />
    </div>
    <div className="ml-auto flex items-center gap-3.5 text-slate-700">
      <button type="button" onClick={() => setOpen((value) => !value)} className="relative rounded-lg p-1.5 hover:bg-slate-100" aria-label="Ver notificaciones">
        <Bell className="h-[18px] w-[18px]" />
        {unreadCount > 0 && <i className="absolute right-0 top-0 grid h-4 min-w-4 place-items-center rounded-full bg-rose-600 px-1 text-[9px] font-bold text-white">{unreadCount > 9 ? "9+" : unreadCount}</i>}
      </button>
      {open && <div className="absolute right-5 top-[54px] z-50 w-[360px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl sm:right-8">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><div><p className="font-semibold text-slate-900">Notificaciones</p><p className="text-xs text-slate-500">{unreadCount ? `${unreadCount} sin leer` : "Todo al día"}</p></div><button onClick={() => markAllRead()} disabled={!unreadCount} className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 disabled:text-slate-400"><CheckCheck className="h-4 w-4" />Marcar leídas</button></div>
        <div className="max-h-[360px] overflow-y-auto">{notifications.length ? notifications.map((item) => <Link key={item.id} to={item.actionUrl ?? "#"} onClick={() => { markRead(item.id); setOpen(false); }} className={`block border-b border-slate-100 px-4 py-3 transition hover:bg-blue-50 ${item.isRead ? "bg-white" : "bg-blue-50/50"}`}><div className="flex gap-3"><span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${item.isRead ? "bg-slate-300" : "bg-blue-600"}`} /><div><p className="text-sm font-semibold text-slate-800">{item.title}</p><p className="mt-0.5 text-xs leading-5 text-slate-500">{item.message}</p></div></div></Link>) : <p className="px-4 py-10 text-center text-sm text-slate-500">No hay notificaciones.</p>}</div>
      </div>}
      <button className="hidden sm:block">
        <Mail className="h-[18px] w-[18px]" />
      </button>
      <button className="hidden sm:block">
        <CalendarDays className="h-[18px] w-[18px]" />
      </button>
      <span className="mx-2 hidden h-7 w-px bg-slate-200 sm:block" />
      <div className="flex items-center gap-2.5">
        <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-slate-200 to-slate-400 text-[11px] font-bold text-slate-700">
          {initials}
        </div>
        <span className="hidden text-[13px] font-semibold md:block">{user?.fullName ?? "Usuario"}</span>
        <ChevronDown className="h-4 w-4" />
      </div>
    </div>
  </header>
  );
};
