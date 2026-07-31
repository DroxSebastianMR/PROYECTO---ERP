import { Eye, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { PurchaseOrder } from "@/features/purchases/types/purchase.types";

interface PurchaseTableProps {
  purchases: PurchaseOrder[];
  onView: (purchase: PurchaseOrder) => void;
}

export const PurchaseTable = ({ purchases, onView }: PurchaseTableProps) => {
  const formatPrice = (val: number) =>
    new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(val);

  if (purchases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-12 text-center shadow-[0_8px_20px_rgba(37,99,235,.03)]">
        <ShoppingCart className="h-10 w-10 text-slate-300" />
        <h3 className="mt-3 text-sm font-semibold text-slate-900">No se encontraron compras</h3>
        <p className="mt-1 text-xs text-slate-500">
          Crea una nueva orden de compra o cambia los filtros de búsqueda.
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
                N° Orden
              </th>
              <th scope="col" className="px-6 py-4 font-semibold">
                Proveedor
              </th>
              <th scope="col" className="px-6 py-4 text-center font-semibold">
                Ítems
              </th>
              <th scope="col" className="px-6 py-4 text-right font-semibold">
                Total (S/)
              </th>
              <th scope="col" className="px-6 py-4 text-center font-semibold">
                Estado
              </th>
              <th scope="col" className="px-6 py-4 text-right font-semibold">
                Fecha Emisión
              </th>
              <th scope="col" className="px-6 py-4 text-right font-semibold">
                Acción
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {purchases.map((purchase) => {
              const isReceived = ["RECEIVED", "PENDING_PAYMENT", "PAID"].includes(purchase.status);
              const isOrdered = purchase.status === "ORDERED";
              const isDraft = purchase.status === "DRAFT";

              return (
                <tr key={purchase.id} className="transition hover:bg-slate-50/80">
                  <td className="whitespace-nowrap px-6 py-4 font-mono font-medium text-slate-900">
                    <span className="rounded border border-blue-100 bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">
                      {purchase.number}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-900">
                    {purchase.supplierName}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-center font-medium text-slate-700">
                    {purchase.items?.length || 0} ítems
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right font-bold text-slate-900">
                    {formatPrice(purchase.total)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-center">
                    {isReceived ? (
                      <Badge variant="success">Recepcionado</Badge>
                    ) : isOrdered ? (
                      <Badge variant="warning">En Tránsito</Badge>
                    ) : isDraft ? (
                      <Badge variant="secondary">Borrador</Badge>
                    ) : purchase.status === "PARTIALLY_RECEIVED" ? (
                      <Badge variant="warning">Recepción parcial</Badge>
                    ) : (
                      <Badge variant="destructive">Anulado</Badge>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-xs text-slate-500">
                    {new Date(purchase.createdAt).toLocaleDateString("es-PE")}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <button
                      onClick={() => onView(purchase)}
                      className="ml-auto grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                      title="Ver detalle de orden"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
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
