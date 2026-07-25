import { Bell, CalendarDays, ChevronDown, Mail, Menu, Search } from "lucide-react";

export const AppHeader = () => (
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
      <button className="relative">
        <Bell className="h-[18px] w-[18px]" />
        <i className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-600" />
      </button>
      <button className="hidden sm:block">
        <Mail className="h-[18px] w-[18px]" />
      </button>
      <button className="hidden sm:block">
        <CalendarDays className="h-[18px] w-[18px]" />
      </button>
      <span className="mx-2 hidden h-7 w-px bg-slate-200 sm:block" />
      <div className="flex items-center gap-2.5">
        <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-slate-200 to-slate-400 text-[11px] font-bold text-slate-700">
          AM
        </div>
        <span className="hidden text-[13px] font-semibold md:block">Admin</span>
        <ChevronDown className="h-4 w-4" />
      </div>
    </div>
  </header>
);
