import { useState } from "react";
import { Wallet } from "lucide-react";
import { CashMovementsTab } from "@/features/cash/components/cash-movements-tab";
import { CashSessionTab } from "@/features/cash/components/cash-session-tab";
import { CashCountTab } from "@/features/cash/components/cash-count-tab";
import { useCash } from "@/features/cash/hooks/use-cash";

type CashTab = "movements" | "session" | "count";

const tabs: Array<{ id: CashTab; label: string }> = [
  { id: "movements", label: "Movimientos" },
  { id: "session", label: "Apertura y cierre" },
  { id: "count", label: "Arqueos" },
];

export const CashPage = () => {
  const [activeTab, setActiveTab] = useState<CashTab>("movements");
  const cash = useCash();

  if (cash.isLoading) return <CashLoadingState />;

  return (
    <div className="mx-auto max-w-[1480px] p-4 sm:p-6 lg:p-7">
      <header>
        <div className="flex flex-wrap items-center gap-3"><h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-[-.045em] text-slate-900 sm:gap-3 sm:text-[30px]"><Wallet className="h-8 w-8 text-blue-600" />Caja</h1><span className={`rounded-full px-3 py-1 text-xs font-semibold ${cash.current ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{cash.current ? "Caja abierta" : "Caja cerrada"}</span></div>
        <p className="mt-1 text-[15px] text-slate-600">Control de apertura, movimientos, arqueos y cierre diario de caja.</p>
      </header>
      <nav className="mt-6 flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1.5" aria-label="Secciones de Caja">
        {tabs.map((tab) => <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} disabled={tab.id === "count" && !cash.current} className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${activeTab === tab.id ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-50"} disabled:cursor-not-allowed disabled:opacity-45`}>{tab.label}</button>)}
      </nav>
      {activeTab === "movements" && <CashMovementsTab current={cash.current ?? null} movements={cash.movements} isSaving={cash.isSaving} onCreate={cash.createMovement} />}
      {activeTab === "session" && <CashSessionTab current={cash.current ?? null} registers={cash.registers} history={cash.history} isSaving={cash.isSaving} onOpen={cash.open} onClose={cash.close} />}
      {activeTab === "count" && <CashCountTab current={cash.current ?? null} isSaving={cash.isSaving} onSave={cash.count} />}
    </div>
  );
};

const CashLoadingState = () => <div className="mx-auto max-w-[1480px] animate-pulse p-4 sm:p-6 lg:p-7"><div className="h-32 rounded-2xl bg-blue-50" /><div className="mt-6 h-11 w-80 rounded-xl bg-slate-100" /><div className="mt-6 grid gap-6 lg:grid-cols-2"><div className="h-96 rounded-xl border border-slate-200 bg-white" /><div className="h-96 rounded-xl border border-slate-200 bg-white" /></div></div>;
