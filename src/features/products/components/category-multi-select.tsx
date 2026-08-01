import { Check, ChevronDown, Filter, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface CategoryMultiSelectProps {
  categories: string[];
  selectedCategories: string[];
  onChange: (categories: string[]) => void;
}

export const CategoryMultiSelect = ({
  categories,
  selectedCategories,
  onChange,
}: CategoryMultiSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  const toggleCategory = (category: string) => {
    onChange(
      selectedCategories.includes(category)
        ? selectedCategories.filter((item) => item !== category)
        : [...selectedCategories, category],
    );
  };
  const visibleCategories = categories.filter((category) =>
    category.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()),
  );

  const label = selectedCategories.length
    ? `${selectedCategories.length} categoría${selectedCategories.length === 1 ? "" : "s"}`
    : "Todas las categorías";

  return (
    <div ref={containerRef} className="relative w-full sm:w-56">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="flex h-10 w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-left text-sm text-slate-700 outline-none transition hover:border-blue-300 focus:ring-2 focus:ring-blue-100"
      >
        <Filter className="h-4 w-4 shrink-0 text-blue-600" />
        <span className="min-w-0 flex-1 truncate">{label}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-30 w-full min-w-[230px] overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10">
          <div className="flex items-center justify-between border-b border-slate-100 px-2.5 py-2">
            <span className="text-xs font-semibold text-slate-700">Filtrar categorías</span>
            {selectedCategories.length > 0 && (
              <button type="button" onClick={() => onChange([])} className="text-xs font-medium text-blue-600 hover:text-blue-700">
                Limpiar
              </button>
            )}
          </div>
          <label className="mx-1.5 mt-2 flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 text-slate-500 focus-within:border-blue-300 focus-within:bg-white">
            <Search className="h-3.5 w-3.5" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar categoría..."
              className="min-w-0 flex-1 bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400"
            />
          </label>
          <div role="listbox" aria-multiselectable="true" className="max-h-60 overflow-y-auto py-1">
            {visibleCategories.map((category) => {
              const isSelected = selectedCategories.includes(category);
              return (
                <label key={category} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-slate-700 transition hover:bg-blue-50">
                  <input type="checkbox" checked={isSelected} onChange={() => toggleCategory(category)} className="sr-only" />
                  <span className={`grid h-4 w-4 place-items-center rounded border transition ${isSelected ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white"}`}>
                    {isSelected && <Check className="h-3 w-3" />}
                  </span>
                  <span className="truncate">{category}</span>
                </label>
              );
            })}
            {!visibleCategories.length && (
              <p className="px-3 py-5 text-center text-xs text-slate-500">No se encontraron categorías.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
