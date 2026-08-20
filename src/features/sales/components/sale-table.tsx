import { Eye, Tag, Printer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { SaleReceipt } from "@/features/sales/types/sale.types";
import { salePaymentMethodLabel } from "@/features/sales/utils/sale-labels";

interface SaleTableProps {
  sales: SaleReceipt[];
  onView: (sale: SaleReceipt) => void;
  onPrint: (sale: SaleReceipt) => void;
}

export const SaleTable = ({ sales, onView, onPrint }: SaleTableProps) => {
  const formatPrice = (val: number) =>
    new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(val);

  if (sales.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-12 text-center shadow-[0_8px_20px_rgba(37,99,235,.03)]">
        <Tag className="h-10 w-10 text-slate-300" />
        <h3 className="mt-3 text-sm font-semibold text-slate-900">No se encontraron ventas</h3>
        <p className="mt-1 text-xs text-slate-500">
          Genera una nueva venta usando el botón "+ Nueva Venta".
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_8px_20px_rgba(37,99,235,.03)]">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="border-b border-slate-200 bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th scope="col" className="px-6 py-4 font-semibold">
                Comprobante
              </th>
              <th scope="col" className="px-6 py-4 font-semibold">
                Cliente
              </th>
              <th scope="col" className="px-6 py-4 font-semibold">
                Método Pago
              </th>
              <th scope="col" className="px-6 py-4 text-right font-semibold">
                Monto Total
              </th>
              <th scope="col" className="px-6 py-4 text-center font-semibold">
                Estado
              </th>
              <th scope="col" className="px-6 py-4 text-right font-semibold">
                Fecha y Hora
              </th>
              <th scope="col" className="px-6 py-4 text-right font-semibold">
                Acción
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sales.map((sale) => {
              return (
                <tr key={sale.id} className="transition hover:bg-slate-50/80">
                  <td className="whitespace-nowrap px-6 py-4 font-mono font-medium text-slate-900">
                    <span className="rounded border border-emerald-100 bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">
                      {sale.number}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900">{sale.customerName}</div>
                    {sale.customerDocument && (
                      <div className="text-xs text-slate-400">{sale.customerDocument}</div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                      {salePaymentMethodLabel(sale.paymentMethod)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right font-bold text-slate-900">
                    {formatPrice(sale.total)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-center">
                    {sale.status === "PAID" ? (
                      <Badge variant="success">Vendido · Pagado</Badge>
                    ) : sale.status === "DISPATCHED" ? (
                      <Badge variant="success">Vendido · Entregado</Badge>
                    ) : sale.status === "PENDING_PAYMENT" ? (
                      <Badge variant="warning">Vendido · Por cobrar</Badge>
                    ) : sale.status === "PARTIALLY_PAID" ? (
                      <Badge variant="warning">Pago parcial</Badge>
                    ) : sale.status === "DRAFT" ? (
                      <Badge variant="secondary">Borrador</Badge>
                    ) : sale.status === "CONFIRMED" || sale.status === "PREPARING" ? (
                      <Badge variant="warning">Preparando despacho</Badge>
                    ) : (
                      <Badge variant="destructive">Anulada</Badge>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-xs text-slate-500">
                    {new Date(sale.createdAt).toLocaleString("es-PE")}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onPrint(sale)}
                        className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                        title="Vista previa del ticket"
                      >
                        <Printer className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onView(sale)}
                        className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                        title="Ver detalle"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
