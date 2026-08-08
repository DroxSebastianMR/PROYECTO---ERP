import { MultiSelectFilter } from "@/components/ui/multi-select-filter";

interface CategoryMultiSelectProps {
  categories: string[];
  selectedCategories: string[];
  onChange: (categories: string[]) => void;
}

export const CategoryMultiSelect = ({ categories, selectedCategories, onChange }: CategoryMultiSelectProps) => (
  <MultiSelectFilter
    items={categories}
    selectedItems={selectedCategories}
    onChange={onChange}
    label="Filtrar categorías"
    emptyLabel="Todas las categorías"
    searchPlaceholder="Buscar categoría..."
    selectedLabel={(count) => `${count} categoría${count === 1 ? "" : "s"}`}
  />
);
