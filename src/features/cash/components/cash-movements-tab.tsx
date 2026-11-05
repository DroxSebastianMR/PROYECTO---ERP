import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Download, Plus, Search, WalletCards } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import type { CashMovement, CurrentCash } from "@/features/cash/types/cash.types";

const money = (value: number) => new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(value);
const time = (value: string) => new Intl.DateTimeFormat("es-PE", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));

export const CashMovementsTab = ({ current, movements, isSaving, onCreate }: { current: CurrentCash; movements: CashMovement[]; isSaving: boolean; onCreate: (input: { type: "INCOME" | "EXPENSE"; description: string; amount: number; paymentMethod: "CASH" | "BANK_TRANSFER" | "CARD" | "YAPE_PLIN" }) => Promise<unknown> }) => {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | "INCOME" | "EXPENSE">("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [type, setType] = useState<"INCOME" | "EXPENSE">("INCOME");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "BANK_TRANSFER" | "CARD" | "YAPE_PLIN">("CASH");
  const visibleMovements = useMemo(() => movements.filter((movement) => (filter === "ALL" || movement.type === filter) && (!search || movement.description.toLowerCase().includes(search.toLowerCase()) || movement.user.toLowerCase().includes(search.toLowerCase()))), [filter, movements, search]);
  const income = movements.filter((movement) => movement.type === "INCOME").reduce((total, movement) => total + movement.amount, 0);
  const expense = movements.filter((movement) => movement.type === "EXPENSE").reduce((total, movement) => total + movement.amount, 0);
  const digitalIncome = movements.filter((movement) => movement.type === "INCOME" && isDigital(movement.paymentMethod)).reduce((total, movement) => total + movement.amount, 0);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await onCreate({ type, description: description.trim(), amount: Number(amount), paymentMethod });
      setDescription(""); setAmount(""); setPaymentMethod("CASH"); setIsModalOpen(false);
    } catch (error) { toast.error(error instanceof Error ? error.message : "No se pudo registrar el movimiento."); }
  };
  return <>
    <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric label="Saldo actual" value={money(current?.summary.expectedAmount ?? 0)} icon={<WalletCards className="h-5 w-5" />} tone="blue" detail="Disponible en caja" />
      <Metric label="Caja inicial" value={money(current?.summary.openingAmount ?? 0)} icon={<WalletCards className="h-5 w-5" />} tone="blue" detail={current ? `Aperturada ${time(current.session.openedAt)}` : "Sin caja aperturada"} />
      <Metric label="Ingresos del día" value={money(income)} icon={<ArrowUpRight className="h-5 w-5" />} tone="green" detail="Ventas y otros ingresos" />
      <Metric label="Egresos del día" value={money(expense)} icon={<ArrowDownRight className="h-5 w-5" />} tone="red" detail="Pagos y salidas de dinero" />
    </section>
    <section className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_8px_20px_rgba(37,99,235,.03)]">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por descripción o usuario..." className="pl-9" /></div>
        <Select value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)} className="lg:w-44"><option value="ALL">Todos los tipos</option><option value="INCOME">Ingresos</option><option value="EXPENSE">Egresos</option></Select>
        <Button type="button" variant="ghost" onClick={() => window.print()} className="gap-2 border border-slate-200 text-slate-700"><Download className="h-4 w-4" />Exportar</Button>
        <Button type="button" disabled={!current} onClick={() => setIsModalOpen(true)} className="gap-2"><Plus className="h-4 w-4" />Nuevo movimiento</Button>
      </div>
      <div className="overflow-x-auto"><table className="w-full min-w-[790px] text-left text-sm"><thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">N° movimiento</th><th className="px-5 py-3">Fecha y hora</th><th className="px-5 py-3">Tipo</th><th className="px-5 py-3">Descripción</th><th className="px-5 py-3">Método de pago</th><th className="px-5 py-3">Usuario</th><th className="px-5 py-3 text-right">Monto</th></tr></thead><tbody>{visibleMovements.map((movement, index) => <tr key={movement.id} className="border-t border-slate-100"><td className="px-5 py-4"><span className="rounded bg-blue-50 px-2 py-1 font-mono text-xs font-medium text-blue-700">MOV-{String(index + 1).padStart(6, "0")}</span></td><td className="px-5 py-4 text-slate-600">{time(movement.createdAt)}</td><td className="px-5 py-4"><Badge variant={movement.type === "INCOME" ? "success" : "destructive"}>{movement.type === "INCOME" ? "Ingreso" : "Egreso"}</Badge></td><td className="px-5 py-4 font-medium text-slate-800">{movement.description}</td><td className="px-5 py-4 text-slate-600">{paymentLabel(movement.paymentMethod)}</td><td className="px-5 py-4 text-slate-600">{movement.user}</td><td className={`px-5 py-4 text-right font-semibold ${movement.type === "INCOME" ? "text-emerald-700" : "text-rose-700"}`}>{movement.type === "INCOME" ? "+ " : "- "}{money(movement.amount)}</td></tr>)}{!visibleMovements.length && <tr><td colSpan={7} className="px-5 py-12 text-center text-slate-500">{current ? "No hay movimientos para los filtros seleccionados." : "No existe una caja abierta."}</td></tr>}</tbody></table></div>
    </section>
    <Dialog isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nuevo movimiento" description="Registra un ingreso o egreso asociado a la caja abierta." maxWidth="md">
      <form onSubmit={submit} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium text-slate-700">Tipo<Select className="mt-1.5" value={type} onChange={(event) => setType(event.target.value as typeof type)}><option value="INCOME">Ingreso</option><option value="EXPENSE">Egreso</option></Select></label><label className="text-sm font-medium text-slate-700">Método de pago<Select className="mt-1.5" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as typeof paymentMethod)}><option value="CASH">Efectivo</option><option value="BANK_TRANSFER">Transferencia</option><option value="CARD">Tarjeta</option><option value="YAPE_PLIN">Yape / Plin</option></Select></label></div><label className="block text-sm font-medium text-slate-700">Descripción<Input className="mt-1.5" value={description} onChange={(event) => setDescription(event.target.value)} minLength={3} required placeholder="Ej. Pago de movilidad" /></label><label className="block text-sm font-medium text-slate-700">Monto<Input className="mt-1.5" type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} required placeholder="S/ 0.00" /></label><div className="flex justify-end gap-3 border-t border-slate-100 pt-4"><Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button><Button disabled={isSaving} type="submit">{isSaving ? "Guardando..." : "Guardar movimiento"}</Button></div></form>
    </Dialog>
  </>;
};

const Metric = ({ label, value, detail, icon, tone }: { label: string; value: string; detail: string; icon: ReactNode; tone: "blue" | "green" | "red" }) => <div className="flex min-h-[146px] items-start justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-[0_8px_20px_rgba(37,99,235,.03)]"><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className={`mt-3 truncate text-2xl font-bold ${label === "Estado de caja" && value === "Caja abierta" ? "text-emerald-700" : "text-slate-900"}`}>{value}</p><p className="mt-2 text-xs text-slate-500">{detail}</p></div><div className={`grid h-14 w-14 shrink-0 place-items-center rounded-xl ${tone === "green" ? "bg-emerald-50 text-emerald-600" : tone === "red" ? "bg-rose-50 text-rose-600" : "bg-blue-50 text-blue-600"}`}>{icon}</div></div>;
const paymentLabel = (value: string) => ({ CASH: "Efectivo", BANK_TRANSFER: "Transferencia", CARD: "Tarjeta", YAPE_PLIN: "Yape / Plin" }[value] ?? value);
const isDigital = (method: string) => method !== "CASH";
