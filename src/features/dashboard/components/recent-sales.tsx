import type { RecentSale, SaleStatus } from "@/features/dashboard/types/dashboard.types";

const statusClasses: Record<SaleStatus, string> = {
  Pagado: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Pendiente: "border-amber-200 bg-amber-50 text-amber-700",
  Anulado: "border-red-200 bg-red-50 text-red-700",
};
type RecentSalesProps = { sales: RecentSale[]; showAll: boolean; onToggle: () => void };
export const RecentSales = ({ sales, showAll, onToggle }: RecentSalesProps) => {
  const visibleSales = showAll ? sales : sales.slice(0, 3);
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_10px_24px_rgba(37,99,235,.035)]">
      <div className="flex items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5">
        <h2 className="text-lg font-semibold">Últimas Ventas</h2>
        <button
          onClick={onToggle}
          className="shrink-0 text-sm font-medium text-blue-700 hover:text-blue-800"
        >
          {showAll ? "Ver menos" : "Ver todas"}
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[650px] text-left text-sm">
          <thead className="border-y border-slate-200 bg-slate-50 text-slate-700">
            <tr>
              {["ID Venta", "Cliente", "Fecha", "Monto", "Estado"].map((heading) => (
                <th key={heading} className="px-5 py-4 font-medium">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleSales.map((sale) => (
              <tr key={sale.id} className="border-b border-slate-100 last:border-0">
                <td className="px-5 py-4">{sale.id}</td>
                <td className="px-5 py-4">{sale.customer}</td>
                <td className="px-5 py-4">{sale.date}</td>
                <td className="px-5 py-4">{sale.amount}</td>
                <td className="px-5 py-4">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs ${statusClasses[sale.status]}`}
                  >
                    {sale.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
};
