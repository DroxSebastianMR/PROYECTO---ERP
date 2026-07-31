import { SlidersHorizontal, Warehouse } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { WarehouseStockItem } from "@/features/inventory/types/inventory.types";

interface InventoryStockTableProps {
  stocks: WarehouseStockItem[];
  onAdjust: (item: WarehouseStockItem) => void;
}

export const InventoryStockTable = ({ stocks, onAdjust }: InventoryStockTableProps) => {
  if (stocks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-12 text-center shadow-[0_8px_20px_rgba(37,99,235,.03)]">
        <Warehouse className="h-10 w-10 text-slate-300" />
        <h3 className="mt-3 text-sm font-semibold text-slate-900">
          No hay existencias registradas
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          No se encontraron productos en el almacén seleccionado.
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
                SKU
              </th>
              <th scope="col" className="px-6 py-4 font-semibold">
                Producto
              </th>
              <th scope="col" className="px-6 py-4 font-semibold">
                Almacén
              </th>
              <th scope="col" className="px-6 py-4 text-right font-semibold">
                Cantidad
              </th>
              <th scope="col" className="px-6 py-4 text-right font-semibold">
                Mínimo
              </th>
              <th scope="col" className="px-6 py-4 text-center font-semibold">
                Estado
              </th>
              <th scope="col" className="px-6 py-4 text-right font-semibold">
                Acción
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {stocks.map((item) => {
              const isLow = item.quantity <= item.minimum && item.quantity > 0;
              const isOut = item.quantity === 0;

              return (
                <tr key={item.id} className="transition hover:bg-slate-50/80">
                  <td className="whitespace-nowrap px-6 py-4 font-mono font-medium text-slate-900">
                    <span className="rounded border border-slate-200/60 bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                      {item.sku}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-900">{item.productName}</td>
                  <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-700">
                    {item.warehouseName}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right font-bold text-slate-900">
                    {item.quantity}{" "}
                    <span className="text-xs font-normal text-slate-500">{item.unit}</span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-slate-500">
                    {item.minimum} {item.unit}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-center">
                    {isOut ? (
                      <Badge variant="destructive">Agotado</Badge>
                    ) : isLow ? (
                      <Badge variant="warning">Stock Bajo</Badge>
                    ) : (
                      <Badge variant="success">Normal</Badge>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <Button
                      onClick={() => onAdjust(item)}
                      variant="ghost"
                      size="default"
                      className="h-8 border border-blue-100 px-2.5 text-xs text-blue-600 hover:bg-blue-50"
                    >
                      <SlidersHorizontal className="mr-1 h-3.5 w-3.5" /> Ajustar Stock
                    </Button>
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
