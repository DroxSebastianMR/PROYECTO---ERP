import { Plus, Search, Filter, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { ProductFilterState } from "@/features/products/types/product.types";

interface ProductFilterBarProps {
  filters: ProductFilterState;
  onFilterChange: (filters: ProductFilterState) => void;
  categories: string[];
  onNewProduct: () => void;
}

export const ProductFilterBar = ({
  filters,
  onFilterChange,
  categories,
  onNewProduct,
}: ProductFilterBarProps) => {
  const hasActiveFilters =
    filters.search !== "" || filters.category !== "ALL" || filters.stockStatus !== "ALL";

  const handleReset = () => {
    onFilterChange({
      search: "",
      category: "ALL",
      stockStatus: "ALL",
    });
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-[0_8px_20px_rgba(37,99,235,.03)] lg:flex-row lg:items-center lg:justify-between">
      {/* Filters group */}
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Buscar por SKU, nombre..."
            value={filters.search}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            className="pl-9"
          />
        </div>

        {/* Category Filter */}
        <div className="w-full sm:w-48">
          <Select
            value={filters.category}
            onChange={(e) => onFilterChange({ ...filters, category: e.target.value })}
          >
            <option value="ALL">Todas las Categorías</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </Select>
        </div>

        {/* Stock Status Filter */}
        <div className="w-full sm:w-48">
          <Select
            value={filters.stockStatus}
            onChange={(e) => onFilterChange({ ...filters, stockStatus: e.target.value })}
          >
            <option value="ALL">Todos los Estados</option>
            <option value="IN_STOCK">En Stock</option>
            <option value="LOW_STOCK">Stock Bajo</option>
            <option value="OUT_OF_STOCK">Sin Stock</option>
            <option value="INACTIVE">Inactivos</option>
          </Select>
        </div>

        {/* Reset button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            onClick={handleReset}
            className="h-10 px-3 text-slate-600 hover:text-slate-900"
            title="Limpiar filtros"
          >
            <RotateCcw className="h-4 w-4 mr-1.5" />
            Limpiar
          </Button>
        )}
      </div>

      {/* Action button */}
      <div className="flex items-center gap-2">
        <Button onClick={onNewProduct} className="gap-2 shadow-sm font-medium">
          <Plus className="h-4 w-4" />
          Nuevo Producto
        </Button>
      </div>
    </div>
  );
};
