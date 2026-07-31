import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ProductStatusBadge } from "./product-status-badge";
import type { Product } from "@/features/products/types/product.types";
import { Boxes, Warehouse, DollarSign, Tag, Calendar } from "lucide-react";

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onEdit: (product: Product) => void;
}

export const ProductDetailModal = ({
  isOpen,
  onClose,
  product,
  onEdit,
}: ProductDetailModalProps) => {
  if (!product) return null;

  const formatPrice = (val: number) =>
    new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(val);

  const marginAmount = product.salePrice - (product.costPrice || 0);
  const marginPercentage =
    product.salePrice > 0 ? ((marginAmount / product.salePrice) * 100).toFixed(1) : "0";

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Detalle del Producto"
      description={`Información técnica y stock de ${product.sku}`}
      maxWidth="xl"
    >
      <div className="space-y-6">
        {/* Header summary card */}
        <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-lg bg-blue-600 text-white">
              <Boxes className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-slate-500">
                  {product.sku}
                </span>
                <ProductStatusBadge product={product} />
              </div>
              <h4 className="mt-0.5 text-base font-bold text-slate-900">{product.name}</h4>
            </div>
          </div>
          <Button
            onClick={() => {
              onClose();
              onEdit(product);
            }}
            variant="ghost"
            className="border border-slate-200 bg-white shadow-sm hover:bg-slate-50"
          >
            Editar Producto
          </Button>
        </div>

        {/* Specifications grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-100 bg-white p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <Tag className="h-3.5 w-3.5 text-blue-600" /> Categoría y Medida
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Categoría:</span>
                <span className="font-medium text-slate-900">{product.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Unidad de Medida:</span>
                <span className="font-medium text-slate-900">{product.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Estado:</span>
                <span className="font-medium text-slate-900">
                  {product.isActive ? "Activo" : "Inactivo"}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-100 bg-white p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <DollarSign className="h-3.5 w-3.5 text-emerald-600" /> Precios y Margen
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Precio de Venta:</span>
                <span className="font-bold text-slate-900">{formatPrice(product.salePrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Costo Referencial:</span>
                <span className="font-medium text-slate-700">
                  {product.costPrice ? formatPrice(product.costPrice) : "Sin costo"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Margen Estimado:</span>
                <span className="font-semibold text-emerald-600">
                  {marginPercentage}% ({formatPrice(marginAmount)})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        {product.description && (
          <div className="rounded-lg border border-slate-100 bg-white p-4">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Descripción / Observaciones
            </div>
            <p className="text-sm text-slate-700">{product.description}</p>
          </div>
        )}

        {/* Warehouse stock breakdown */}
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Warehouse className="h-4 w-4 text-blue-600" /> Stock por Almacén
            </div>
            <span className="text-xs font-medium text-slate-500">
              Total:{" "}
              <strong className="text-slate-900">
                {product.totalStock} {product.unit}
              </strong>
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {product.stocks && product.stocks.length > 0 ? (
              product.stocks.map((stock) => (
                <div key={stock.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium text-slate-900">{stock.warehouseName}</p>
                    <p className="text-xs text-slate-400">
                      Nivel de alerta mínima: {stock.minimum}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">
                      {stock.quantity} {product.unit}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-between px-4 py-3 text-sm">
                <div>
                  <p className="font-medium text-slate-900">Almacén Principal</p>
                  <p className="text-xs text-slate-400">Stock Mínimo: {product.minStock}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">
                    {product.totalStock} {product.unit}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Timestamps footer */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs text-slate-400">
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" /> Registrado:{" "}
            {new Date(product.createdAt).toLocaleDateString("es-PE")}
          </div>
          <Button variant="ghost" size="default" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
