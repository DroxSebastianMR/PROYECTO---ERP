import { useState, type FormEvent } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type {
  WarehouseStockItem,
  StockAdjustmentInput,
  MovementType,
} from "@/features/inventory/types/inventory.types";

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  stockItem: WarehouseStockItem | null;
  onSubmit: (input: StockAdjustmentInput) => Promise<void>;
  isSubmitting: boolean;
}

export const StockAdjustmentModal = ({
  isOpen,
  onClose,
  stockItem,
  onSubmit,
  isSubmitting,
}: StockAdjustmentModalProps) => {
  const [type, setType] = useState<MovementType>("IN");
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState("");

  if (!stockItem) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const qtyNum = parseFloat(quantity);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      alert("Ingresa una cantidad válida mayor a 0");
      return;
    }

    await onSubmit({
      productId: stockItem.productId,
      warehouseId: stockItem.warehouseId,
      type,
      quantity: qtyNum,
      reason: reason.trim() || `Ajuste manual (${type}) registrado por operador`,
    });
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Ajuste de Inventario"
      description={`Actualizar unidades de ${stockItem.productName} en ${stockItem.warehouseName}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-lg border border-slate-200/80 bg-slate-50 p-3 text-sm">
          <div className="flex justify-between text-xs font-medium text-slate-500">
            <span>SKU: {stockItem.sku}</span>
            <span>
              Stock Actual:{" "}
              <strong>
                {stockItem.quantity} {stockItem.unit}
              </strong>
            </span>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
            Tipo de Movimiento
          </label>
          <Select value={type} onChange={(e) => setType(e.target.value as MovementType)}>
            <option value="IN">ENTRADA (+) - Ingreso por compra / devolución</option>
            <option value="OUT">SALIDA (-) - Salida por merma / daño / consumo</option>
            <option value="ADJUSTMENT">RECUENTO EN FÍSICO (=) - Establecer nuevo stock</option>
          </Select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
            Cantidad ({stockItem.unit}) <span className="text-red-500">*</span>
          </label>
          <Input
            type="number"
            step="1"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
            Motivo / Referencia
          </label>
          <Input
            placeholder="Ej. Ingreso por inventario físico mensual"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting} className="min-w-[120px]">
            {isSubmitting ? "Guardando..." : "Confirmar Ajuste"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
