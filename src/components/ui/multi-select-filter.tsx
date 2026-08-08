import { Check, ChevronDown, Filter, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface MultiSelectFilterProps {
  items: string[];
  selectedItems: string[];
  onChange: (items: string[]) => void;
  label: string;
  emptyLabel: string;
  searchPlaceholder: string;
  selectedLabel: (count: number) => string;
}

export const MultiSelectFilter = ({ items, selectedItems, onChange, label, emptyLabel, searchPlaceholder, selectedLabel }: MultiSelectFilterProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const visibleItems = items.filter((item) => item.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  const toggle = (item: string) => onChange(selectedItems.includes(item) ? selectedItems.filter((selected) => selected !== item) : [...selectedItems, item]);

  return <div ref={containerRef} className="relative w-full sm:w-56">
    <button type="button" onClick={() => setIsOpen((value) => !value)} aria-haspopup="listbox" aria-expanded={isOpen} className="flex h-10 w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-left text-sm text-slate-700 outline-none transition hover:border-blue-300 focus:ring-2 focus:ring-blue-100">
      <Filter className="h-4 w-4 shrink-0 text-blue-600" /><span className="min-w-0 flex-1 truncate">{selectedItems.length ? selectedLabel(selectedItems.length) : emptyLabel}</span><ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition ${isOpen ? "rotate-180" : ""}`} />
    </button>
    {isOpen && <div className="absolute left-0 top-[calc(100%+8px)] z-30 w-full min-w-[230px] overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10">
      <div className="flex items-center justify-between border-b border-slate-100 px-2.5 py-2"><span className="text-xs font-semibold text-slate-700">{label}</span>{selectedItems.length > 0 && <button type="button" onClick={() => onChange([])} className="text-xs font-medium text-blue-600 hover:text-blue-700">Limpiar</button>}</div>
      <label className="mx-1.5 mt-2 flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 text-slate-500 focus-within:border-blue-300 focus-within:bg-white"><Search className="h-3.5 w-3.5" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={searchPlaceholder} className="min-w-0 flex-1 bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400" /></label>
      <div role="listbox" aria-multiselectable="true" className="max-h-60 overflow-y-auto py-1">
        {visibleItems.map((item) => { const isSelected = selectedItems.includes(item); return <label key={item} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-slate-700 transition hover:bg-blue-50"><input type="checkbox" checked={isSelected} onChange={() => toggle(item)} className="sr-only" /><span className={`grid h-4 w-4 place-items-center rounded border transition ${isSelected ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white"}`}>{isSelected && <Check className="h-3 w-3" />}</span><span className="truncate">{item}</span></label>; })}
        {!visibleItems.length && <p className="px-3 py-5 text-center text-xs text-slate-500">No se encontraron resultados.</p>}
      </div>
    </div>}
  </div>;
};
