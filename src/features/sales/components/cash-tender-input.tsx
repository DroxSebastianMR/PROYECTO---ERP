import { Banknote } from "lucide-react";
import { Input } from "@/components/ui/input";

const money = (value: number) => new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(value);

interface CashTenderInputProps {
  dueAmount: number;
  received: string;
  onChange: (value: string) => void;
  compact?: boolean;
  showChange?: boolean;
}

export const CashChangeSummary = ({ dueAmount, received }: Pick<CashTenderInputProps, "dueAmount" | "received">) => {
  const receivedAmount = Number(received) || 0;
  const change = Math.max(0, receivedAmount - dueAmount);

  return (
    <div className="mt-1 flex items-center justify-between gap-3 border-t border-emerald-100 pt-2">
      <span className="text-[11px] font-bold uppercase tracking-wide text-emerald-700">Vuelto</span>
      <span className="text-lg font-bold leading-none text-emerald-700">{money(change)}</span>
    </div>
  );
};

export const CashTenderInput = ({ dueAmount, received, onChange, compact = false, showChange = true }: CashTenderInputProps) => {
  const receivedAmount = Number(received) || 0;
  const change = Math.max(0, receivedAmount - dueAmount);

  if (compact) {
    return <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-2.5">
      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-emerald-800"><Banknote className="h-3.5 w-3.5" /> Efectivo</div>
      <div className={`mt-1.5 grid items-end gap-2 ${showChange ? "grid-cols-[minmax(0,1fr)_auto]" : "grid-cols-1"}`}>
        <label className="min-w-0 text-[11px] font-medium text-slate-600"><span className="sr-only">Monto recibido</span><Input value={received} onChange={(event) => onChange(event.target.value)} inputMode="decimal" type="number" min={dueAmount} step="0.01" placeholder="Recibido" className="h-9 bg-white px-2 text-sm" /></label>
        {showChange && <div className="text-right"><p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">Vuelto</p><p className="text-base font-bold leading-5 text-emerald-700">{money(change)}</p></div>}
      </div>
      {receivedAmount > 0 && receivedAmount < dueAmount && <p className="mt-1.5 text-[11px] font-medium text-rose-600">Faltan {money(dueAmount - receivedAmount)}.</p>}
    </div>;
  }

  return <div className={`rounded-xl border border-emerald-100 bg-emerald-50/60 ${compact ? "p-3" : "p-4"}`}>
    <div className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-100 text-emerald-700"><Banknote className="h-4 w-4" /></span><div><p className="text-xs font-bold uppercase tracking-wide text-emerald-800">Cobro en efectivo</p><p className="text-[11px] text-emerald-700">Ingresa el monto entregado por el cliente.</p></div></div>
    <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3"><label className="block text-xs font-medium text-slate-600"><span>Monto recibido</span><Input value={received} onChange={(event) => onChange(event.target.value)} inputMode="decimal" type="number" min={dueAmount} step="0.01" placeholder={money(dueAmount)} className="mt-1 bg-white" /></label><div className="pb-1 text-right"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Vuelto</p><p className="mt-0.5 text-lg font-bold text-emerald-700">{money(change)}</p></div></div>
    {receivedAmount > 0 && receivedAmount < dueAmount && <p className="mt-2 text-xs font-medium text-rose-600">Faltan {money(dueAmount - receivedAmount)} para completar este pago.</p>}
  </div>;
};
