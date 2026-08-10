import { useMemo, useState, type ReactNode } from "react";
import { Banknote, CircleDollarSign, Save, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import type { CurrentCash } from "@/features/cash/types/cash.types";

const bills = [200, 100, 50, 20, 10];
const coins = [5, 2, 1, 0.5, 0.2, 0.1];
const denominations = [...bills, ...coins];
const money = (value: number) => new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(value);

export const CashCountTab = ({ current, isSaving, onSave }: { current: CurrentCash; isSaving: boolean; onSave: (input: { denominations: Array<{ denomination: number; quantity: number }>; explanation?: string }) => Promise<unknown> }) => {
  const toast = useToast();
  const [quantities, setQuantities] = useState<Record<number, number>>(() => Object.fromEntries(denominations.map((value) => [value, 0])));
  const [explanation, setExplanation] = useState("");
  const counted = useMemo(() => denominations.reduce((total, denomination) => total + denomination * quantities[denomination], 0), [quantities]);
  const expected = current?.summary.expectedAmount ?? 0;
  const difference = counted - expected;
  const differenceLabel = difference === 0 ? "Cuadrado" : difference < 0 ? "Faltante" : "Sobrante";

  const save = async () => {
    try {
      await onSave({ denominations: denominations.map((denomination) => ({ denomination, quantity: quantities[denomination] })), explanation: explanation.trim() || undefined });
      setExplanation("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar el arqueo.");
    }
  };

  return <div className="mt-6">
    <section className="grid gap-4 lg:grid-cols-[1.05fr_.65fr_.65fr_1fr]">
      <div className="flex flex-col justify-center px-1 py-2"><h2 className="text-2xl font-bold tracking-[-.04em] text-slate-900">Nuevo Arqueo</h2><p className="mt-2 max-w-sm text-[15px] leading-6 text-slate-600">Registre el conteo físico de efectivo y declare las diferencias encontradas en caja.</p></div>
      <Metric label="Saldo esperado" value={money(expected)} icon={<WalletCards className="h-5 w-5" />} />
      <Metric label="Contado" value={money(counted)} icon={<Banknote className="h-5 w-5" />} />
      <Metric label={differenceLabel} value={money(Math.abs(difference))} icon={<CircleDollarSign className="h-5 w-5" />} tone={difference === 0 ? "green" : difference < 0 ? "red" : "amber"} />
    </section>
    <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <DenominationGroup title="Billetes" icon={<Banknote className="h-5 w-5" />} values={bills} quantities={quantities} onChange={(denomination, quantity) => setQuantities((current) => ({ ...current, [denomination]: quantity }))} />
        <DenominationGroup title="Monedas" icon={<CircleDollarSign className="h-5 w-5" />} values={coins} quantities={quantities} onChange={(denomination, quantity) => setQuantities((current) => ({ ...current, [denomination]: quantity }))} />
      </div>
      <aside className="h-fit rounded-xl border border-slate-200 bg-white p-6 shadow-[0_10px_28px_rgba(37,99,235,.06)]"><h2 className="text-xl font-semibold">Resumen de arqueo</h2><div className="mt-6 space-y-4 text-sm"><Summary label="Efectivo contado" value={money(counted)} /><Summary label="Saldo esperado" value={money(expected)} /><div className={`rounded-lg px-4 py-3 ${difference === 0 ? "bg-emerald-50 text-emerald-700" : difference < 0 ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}`}><p className="text-xs font-semibold uppercase tracking-wide">Diferencia · {differenceLabel}</p><p className="mt-1 text-xl font-bold">{difference < 0 ? "-" : difference > 0 ? "+" : ""}{money(Math.abs(difference))}</p></div>{difference !== 0 && <label className="block font-semibold text-slate-700">Explicación de diferencia <span className="text-rose-600">*</span><textarea required value={explanation} onChange={(event) => setExplanation(event.target.value)} className="mt-2 min-h-32 w-full rounded-lg border border-slate-200 p-3 text-sm font-normal outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20" placeholder="Detalle el motivo de la diferencia encontrada..." /></label>}<Button disabled={isSaving || (difference !== 0 && !explanation.trim())} onClick={() => void save()} className="w-full gap-2"><Save className="h-4 w-4" />{isSaving ? "Guardando..." : "Guardar arqueo"}</Button></div></aside>
    </section>
  </div>;
};

const DenominationGroup = ({ title, icon, values, quantities, onChange }: { title: string; icon: ReactNode; values: number[]; quantities: Record<number, number>; onChange: (denomination: number, quantity: number) => void }) => <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_10px_28px_rgba(37,99,235,.05)]"><div className="flex items-center justify-between border-b border-blue-100 bg-gradient-to-r from-blue-50/80 via-white to-indigo-50/50 px-5 py-4"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-blue-600 text-white shadow-sm">{icon}</span><div><h2 className="font-semibold text-slate-900">{title}</h2><p className="text-xs text-slate-500">Ingrese la cantidad física por denominación</p></div></div><span className="rounded-lg border border-blue-100 bg-white px-3 py-2 text-sm font-semibold text-slate-700">Total: <span className="text-blue-700">{money(values.reduce((total, denomination) => total + denomination * quantities[denomination], 0))}</span></span></div><div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">{values.map((denomination) => <label key={denomination} className="group rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 transition hover:border-blue-200 hover:bg-blue-50/40 hover:shadow-sm"><span className="mb-3 flex items-center justify-between"><span className="flex items-center gap-2 text-sm font-bold text-slate-900"><span className="grid h-7 w-7 place-items-center rounded-md bg-blue-100 text-[11px] text-blue-700">S/</span>{denomination.toFixed(denomination < 1 ? 2 : 0)}</span><span className="text-sm font-semibold text-slate-500 transition group-hover:text-blue-700">{money(denomination * quantities[denomination])}</span></span><Input type="number" min="0" step="1" value={quantities[denomination]} onChange={(event) => onChange(denomination, Math.max(0, Math.floor(Number(event.target.value) || 0)))} /></label>)}</div></section>;
const Metric = ({ label, value, icon, tone = "blue" }: { label: string; value: string; icon: ReactNode; tone?: "blue" | "green" | "red" | "amber" }) => <article className={`rounded-xl border p-5 shadow-[0_8px_20px_rgba(37,99,235,.03)] ${tone === "green" ? "border-emerald-200 bg-emerald-50" : tone === "red" ? "border-rose-200 bg-rose-50" : tone === "amber" ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white"}`}><span className={`grid h-10 w-10 place-items-center rounded-xl ${tone === "green" ? "bg-emerald-100 text-emerald-700" : tone === "red" ? "bg-rose-100 text-rose-700" : tone === "amber" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>{icon}</span><p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold text-slate-900">{value}</p></article>;
const Summary = ({ label, value }: { label: string; value: string }) => <div className="flex justify-between border-b border-slate-100 pb-3"><span className="text-slate-600">{label}</span><strong>{value}</strong></div>;
