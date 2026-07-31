import { Boxes, Edit3, Eye, Power, Trash2 } from "lucide-react";
import { ProductStatusBadge } from "./product-status-badge";
import type { Product } from "@/features/products/types/product.types";

interface ProductTableProps {
  products: Product[];
  onView: (product: Product) => void;
  onEdit: (product: Product) => void;
  onToggleStatus: (product: Product) => void;
  onDelete: (product: Product) => void;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(price);

export const ProductTable = ({
  products,
  onView,
  onEdit,
  onToggleStatus,
  onDelete,
}: ProductTableProps) => {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-12 text-center shadow-[0_8px_20px_rgba(37,99,235,.03)]">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-400">
          <Boxes className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-base font-semibold text-slate-900">No se encontraron productos</h3>
        <p className="mt-1 max-w-sm text-sm text-slate-500">
          Ajusta los filtros de búsqueda o agrega un producto al catálogo.
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
              <th scope="col" className="px-6 py-4 font-semibold">SKU</th>
              <th scope="col" className="px-6 py-4 font-semibold">Producto</th>
              <th scope="col" className="px-6 py-4 font-semibold">Categoría</th>
              <th scope="col" className="px-6 py-4 font-semibold">Unidad</th>
              <th scope="col" className="px-6 py-4 text-right font-semibold">P. venta</th>
              <th scope="col" className="px-6 py-4 text-center font-semibold">Estado</th>
              <th scope="col" className="px-6 py-4 text-right font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((product) => (
              <tr key={product.id} className="group transition hover:bg-slate-50/80">
                <td className="whitespace-nowrap px-6 py-4 font-mono font-medium text-slate-900">
                  <span className="rounded border border-slate-200/60 bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                    {product.sku}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="font-semibold text-slate-900 transition-colors group-hover:text-blue-600">
                    {product.name}
                  </div>
                  {product.description && (
                    <div className="mt-0.5 max-w-xs truncate text-xs text-slate-400">{product.description}</div>
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span className="inline-flex items-center rounded-md bg-blue-50/80 px-2.5 py-1 text-xs font-medium text-blue-700">
                    {product.category}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-700">{product.unit}</td>
                <td className="whitespace-nowrap px-6 py-4 text-right font-semibold text-slate-900">
                  {formatPrice(product.salePrice)}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-center">
                  <ProductStatusBadge product={product} />
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => onView(product)} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600" title="Ver detalles">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button onClick={() => onEdit(product)} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700" title="Editar producto">
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button onClick={() => onToggleStatus(product)} className={`grid h-8 w-8 place-items-center rounded-lg transition-colors ${product.isActive ? "text-slate-400 hover:bg-amber-50 hover:text-amber-600" : "text-amber-600 hover:bg-emerald-50 hover:text-emerald-600"}`} title={product.isActive ? "Desactivar" : "Activar"}>
                      <Power className="h-4 w-4" />
                    </button>
                    <button onClick={() => onDelete(product)} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600" title="Eliminar producto">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
