import { Eye, Edit3, Trash2, Power, Boxes } from "lucide-react";
import { ProductStatusBadge } from "./product-status-badge";
import type { Product } from "@/features/products/types/product.types";

interface ProductTableProps {
  products: Product[];
  onView: (product: Product) => void;
  onEdit: (product: Product) => void;
  onToggleStatus: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export const ProductTable = ({
  products,
  onView,
  onEdit,
  onToggleStatus,
  onDelete,
}: ProductTableProps) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
    }).format(price);
  };

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-12 text-center shadow-[0_8px_20px_rgba(37,99,235,.03)]">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-400">
          <Boxes className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-base font-semibold text-slate-900">No se encontraron productos</h3>
        <p className="mt-1 text-sm text-slate-500 max-w-sm">
          Intenta cambiar los filtros de búsqueda o agrega un nuevo producto al catálogo.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_8px_20px_rgba(37,99,235,.03)]">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
            <tr>
              <th scope="col" className="px-6 py-4 font-semibold">SKU</th>
              <th scope="col" className="px-6 py-4 font-semibold">Producto</th>
              <th scope="col" className="px-6 py-4 font-semibold">Categoría</th>
              <th scope="col" className="px-6 py-4 font-semibold">Unidad</th>
              <th scope="col" className="px-6 py-4 font-semibold text-right">P. Venta</th>
              <th scope="col" className="px-6 py-4 font-semibold text-right">Stock</th>
              <th scope="col" className="px-6 py-4 font-semibold text-center">Estado</th>
              <th scope="col" className="px-6 py-4 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((product) => {
              const isStockLow = product.totalStock <= product.minStock && product.totalStock > 0;
              const isOutOfStock = product.totalStock === 0;

              return (
                <tr
                  key={product.id}
                  className="transition hover:bg-slate-50/80 group"
                >
                  {/* SKU */}
                  <td className="px-6 py-4 font-mono font-medium text-slate-900 whitespace-nowrap">
                    <span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700 font-semibold border border-slate-200/60">
                      {product.sku}
                    </span>
                  </td>

                  {/* Name & Description */}
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {product.name}
                    </div>
                    {product.description && (
                      <div className="text-xs text-slate-400 truncate max-w-xs mt-0.5">
                        {product.description}
                      </div>
                    )}
                  </td>

                  {/* Category */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center rounded-md bg-blue-50/80 px-2.5 py-1 text-xs font-medium text-blue-700">
                      {product.category}
                    </span>
                  </td>

                  {/* Unit */}
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-700">
                    {product.unit}
                  </td>

                  {/* Sale Price */}
                  <td className="px-6 py-4 text-right font-semibold text-slate-900 whitespace-nowrap">
                    {formatPrice(product.salePrice)}
                  </td>

                  {/* Stock */}
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <span
                      className={`font-bold ${
                        isOutOfStock
                          ? "text-rose-600"
                          : isStockLow
                          ? "text-amber-600"
                          : "text-slate-900"
                      }`}
                    >
                      {product.totalStock}
                    </span>
                    <span className="text-xs text-slate-400 font-normal ml-1">
                      (Mín: {product.minStock})
                    </span>
                  </td>

                  {/* Status Badge */}
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    <ProductStatusBadge product={product} />
                  </td>

                  {/* Action Buttons */}
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onView(product)}
                        className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        title="Ver detalles"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => onEdit(product)}
                        className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                        title="Editar producto"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => onToggleStatus(product)}
                        className={`grid h-8 w-8 place-items-center rounded-lg transition-colors ${
                          product.isActive
                            ? "text-slate-400 hover:bg-amber-50 hover:text-amber-600"
                            : "text-amber-600 hover:bg-emerald-50 hover:text-emerald-600"
                        }`}
                        title={product.isActive ? "Desactivar" : "Activar"}
                      >
                        <Power className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => onDelete(product)}
                        className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                        title="Eliminar producto"
                      >
                        <Trash2 className="h-4 w-4" />
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
