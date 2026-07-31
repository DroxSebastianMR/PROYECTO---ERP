import { Barcode, Plus, RotateCcw, ScanBarcode, Search } from "lucide-react";
import { useRef } from "react";
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
  const scannerRef = useRef<HTMLInputElement>(null);
  const hasActiveFilters =
    filters.search !== "" || filters.category !== "ALL" || filters.status !== "ALL";

  const handleReset = () => {
    onFilterChange({
      search: "",
      category: "ALL",
      status: "ALL",
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

        <div className="relative w-full sm:w-72">
          <Barcode className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-600" />
          <Input
            ref={scannerRef}
            placeholder="Pistolear código de barras"
            value={filters.search}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.preventDefault();
            }}
            className="border-blue-200 pl-9"
          />
          <button type="button" onClick={() => scannerRef.current?.focus()} className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-600" title="Activar lector">
            <ScanBarcode className="h-4 w-4" />
          </button>
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

        {/* Catalog status filter */}
        <div className="w-full sm:w-48">
          <Select
            value={filters.status}
            onChange={(e) => onFilterChange({ ...filters, status: e.target.value as ProductFilterState["status"] })}
          >
            <option value="ALL">Todos los Estados</option>
            <option value="ACTIVE">Activos</option>
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
            <RotateCcw className="mr-1.5 h-4 w-4" />
            Limpiar
          </Button>
        )}
      </div>

      {/* Action button */}
      <div className="flex items-center gap-2">
        <Button onClick={onNewProduct} className="gap-2 font-medium shadow-sm">
          <Plus className="h-4 w-4" />
          Nuevo Producto
        </Button>
      </div>
    </div>
  );
};
