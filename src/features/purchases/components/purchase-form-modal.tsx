import { useState, type FormEvent } from "react";
import { Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { Product } from "@/features/products/types/product.types";
import type {
  CreatePurchaseInput,
  PurchasePaymentMethod,
  SupplierOption,
  WarehouseOption,
} from "@/features/purchases/types/purchase.types";

interface PurchaseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePurchaseInput) => Promise<unknown>;
  isSubmitting: boolean;
  products: Product[];
  suppliers: SupplierOption[];
  warehouses: WarehouseOption[];
}

interface FormItem { productId: string; quantity: string; unitCost: string; }
const emptyItem: FormItem = { productId: "", quantity: "1", unitCost: "" };

export const PurchaseFormModal = ({ isOpen, onClose, onSubmit, isSubmitting, products, suppliers, warehouses }: PurchaseFormModalProps) => {
  const [supplierId, setSupplierId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PurchasePaymentMethod>("CREDIT");
  const [items, setItems] = useState<FormItem[]>([emptyItem]);

  const selectedWarehouseId = warehouseId || warehouses[0]?.id || "";

  const updateItem = (index: number, changes: Partial<FormItem>) => {
    setItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...changes } : item));
  };
  const selectProduct = (index: number, productId: string) => {
    const product = products.find((entry) => entry.id === productId);
    updateItem(index, { productId, unitCost: product ? String(product.costPrice) : "" });
  };
  const calculatedTotal = items.reduce((total, item) => total + (Number(item.quantity) || 0) * (Number(item.unitCost) || 0), 0);

  const resetForm = () => {
    setSupplierId("");
    setWarehouseId("");
    setPaymentMethod("CREDIT");
    setItems([emptyItem]);
  };
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!supplierId || !selectedWarehouseId || items.some((item) => !item.productId || Number(item.quantity) <= 0 || Number(item.unitCost) < 0)) {
      alert("Selecciona proveedor, almacén y productos con cantidades válidas.");
      return;
    }
    await onSubmit({
      supplierId,
      warehouseId: selectedWarehouseId,
      paymentMethod,
      items: items.map((item) => ({ productId: item.productId, quantity: Number(item.quantity), unitCost: Number(item.unitCost) })),
    });
    resetForm();
  };

  return <Dialog isOpen={isOpen} onClose={onClose} title="Nueva Orden de Compra" description="Registra una orden. El stock solo aumentará cuando se recepcione." maxWidth="2xl">
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">Proveedor <span className="text-red-500">*</span>
          <Select value={supplierId} onChange={(event) => setSupplierId(event.target.value)} className="mt-1" required>
            <option value="">Selecciona un proveedor</option>
            {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
          </Select>
        </label>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">Almacén de destino <span className="text-red-500">*</span>
          <Select value={selectedWarehouseId} onChange={(event) => setWarehouseId(event.target.value)} className="mt-1" required>
            <option value="">Selecciona un almacén</option>
            {warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}
          </Select>
        </label>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">Forma de pago
          <Select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as PurchasePaymentMethod)} className="mt-1">
            <option value="CREDIT">Crédito</option><option value="CASH">Contado</option><option value="BANK_TRANSFER">Transferencia</option><option value="CARD">Tarjeta</option>
          </Select>
        </label>
      </div>
      <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/50 p-4">
        <div className="flex items-center justify-between"><h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700"><ShoppingBag className="h-4 w-4 text-blue-600" />Detalle de productos</h4>
          <Button type="button" variant="ghost" onClick={() => setItems((current) => [...current, emptyItem])} className="h-8 border border-blue-100 px-2.5 text-xs text-blue-600 hover:bg-blue-50"><Plus className="mr-1 h-3.5 w-3.5" />Agregar ítem</Button>
        </div>
        {items.map((item, index) => {
          const product = products.find((entry) => entry.id === item.productId);
          const subtotal = (Number(item.quantity) || 0) * (Number(item.unitCost) || 0);
          return <div key={index} className="grid grid-cols-12 items-center gap-2 rounded-lg border border-slate-200 bg-white p-3">
            <div className="col-span-5"><Select value={item.productId} onChange={(event) => selectProduct(index, event.target.value)} required><option value="">Selecciona producto</option>{products.map((entry) => <option key={entry.id} value={entry.id}>{entry.sku} — {entry.name}</option>)}</Select></div>
            <div className="col-span-2"><Input type="number" min="0.001" step="0.001" placeholder="Cant." value={item.quantity} onChange={(event) => updateItem(index, { quantity: event.target.value })} required /></div>
            <div className="col-span-2"><Input type="number" min="0" step="0.01" placeholder="Costo S/" value={item.unitCost} onChange={(event) => updateItem(index, { unitCost: event.target.value })} required /></div>
            <div className="col-span-2 text-right text-xs font-bold text-slate-900">S/ {subtotal.toFixed(2)}{product ? <span className="block text-[10px] font-normal text-slate-400">{product.unit}</span> : null}</div>
            <div className="col-span-1 text-right"><button type="button" onClick={() => setItems((current) => current.length > 1 ? current.filter((_, itemIndex) => itemIndex !== index) : current)} disabled={items.length === 1} className="text-slate-400 transition hover:text-rose-600 disabled:opacity-30"><Trash2 className="h-4 w-4" /></button></div>
          </div>;
        })}
        <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-sm font-bold text-slate-900"><span>Total referencial (sin IGV):</span><span className="text-base text-blue-700">S/ {calculatedTotal.toFixed(2)}</span></div>
      </div>
      <div className="flex justify-end gap-3 border-t border-slate-100 pt-4"><Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancelar</Button><Button type="submit" disabled={isSubmitting || !products.length || !suppliers.length || !warehouses.length} className="min-w-[160px]">{isSubmitting ? "Guardando..." : "Generar Orden"}</Button></div>
    </form>
  </Dialog>;
};
