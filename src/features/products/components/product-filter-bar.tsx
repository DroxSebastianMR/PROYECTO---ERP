import { Barcode, Plus, RotateCcw, ScanBarcode } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CategoryMultiSelect } from "@/features/products/components/category-multi-select";
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
    filters.search !== "" || filters.categories.length > 0 || filters.status !== "ALL";

  const resetFilters = () => onFilterChange({ search: "", categories: [], status: "ALL" });

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-[0_8px_20px_rgba(37,99,235,.03)] lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Barcode className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-600" />
          <Input
            ref={scannerRef}
            placeholder="Buscar o pistolear código de barras"
            value={filters.search}
            onChange={(event) => onFilterChange({ ...filters, search: event.target.value })}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.preventDefault();
            }}
            className="border-blue-200 pl-9"
          />
          <button
            type="button"
            onClick={() => scannerRef.current?.focus()}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-600"
            title="Activar lector"
            aria-label="Activar lector de código de barras"
          >
            <ScanBarcode className="h-4 w-4" />
          </button>
        </div>
        <CategoryMultiSelect
          categories={categories}
          selectedCategories={filters.categories}
          onChange={(selectedCategories) =>
            onFilterChange({ ...filters, categories: selectedCategories })
          }
        />
        <div className="w-full sm:w-48">
          <Select
            value={filters.status}
            onChange={(event) =>
              onFilterChange({
                ...filters,
                status: event.target.value as ProductFilterState["status"],
              })
            }
          >
            <option value="ALL">Todos los estados</option>
            <option value="ACTIVE">Activos</option>
            <option value="INACTIVE">Inactivos</option>
          </Select>
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" onClick={resetFilters} className="h-10 px-3 text-slate-600 hover:text-slate-900">
            <RotateCcw className="mr-1.5 h-4 w-4" />
            Limpiar
          </Button>
        )}
      </div>
      <Button onClick={onNewProduct} className="shrink-0 gap-2 font-medium shadow-sm">
        <Plus className="h-4 w-4" />
        Nuevo producto
      </Button>
    </div>
  );
};
