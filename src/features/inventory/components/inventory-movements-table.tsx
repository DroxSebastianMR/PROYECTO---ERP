import { ArrowDownRight, ArrowUpRight, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { InventoryMovementRecord } from "@/features/inventory/types/inventory.types";

interface InventoryMovementsTableProps {
  movements: InventoryMovementRecord[];
}

export const InventoryMovementsTable = ({ movements }: InventoryMovementsTableProps) => {
  if (movements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-12 text-center shadow-[0_8px_20px_rgba(37,99,235,.03)]">
        <h3 className="text-sm font-semibold text-slate-900">Sin movimientos registrados</h3>
        <p className="mt-1 text-xs text-slate-500">
          No se encontraron transacciones en el historial Kardex.
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
                Tipo
              </th>
              <th scope="col" className="px-6 py-4 font-semibold">
                SKU / Producto
              </th>
              <th scope="col" className="px-6 py-4 font-semibold">
                Almacén
              </th>
              <th scope="col" className="px-6 py-4 text-right font-semibold">
                Cantidad
              </th>
              <th scope="col" className="px-6 py-4 font-semibold">
                Referencia / Motivo
              </th>
              <th scope="col" className="px-6 py-4 text-right font-semibold">
                Fecha y Hora
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {movements.map((mov) => {
              const isIN = mov.type === "IN";
              const isOUT = mov.type === "OUT";

              return (
                <tr key={mov.id} className="transition hover:bg-slate-50/80">
                  <td className="whitespace-nowrap px-6 py-4">
                    {isIN ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/60 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        <ArrowDownRight className="h-3.5 w-3.5" /> Entrada
                      </span>
                    ) : isOUT ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-rose-200/60 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
                        <ArrowUpRight className="h-3.5 w-3.5" /> Salida
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-purple-200/60 bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700">
                        <RefreshCw className="h-3.5 w-3.5" /> Ajuste
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="mr-2 font-mono text-xs font-semibold text-slate-500">
                      {mov.sku}
                    </span>
                    <span className="font-semibold text-slate-900">{mov.productName}</span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-700">
                    {mov.warehouseName}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right font-bold text-slate-900">
                    {isIN ? `+${mov.quantity}` : isOUT ? `-${mov.quantity}` : `${mov.quantity}`}{" "}
                    <span className="text-xs font-normal text-slate-500">{mov.unit}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-700">{mov.reference}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-xs text-slate-500">
                    {new Date(mov.createdAt).toLocaleString("es-PE")}
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
