import { useEffect, useMemo, useState } from "react";
import { FileText, Layers } from "lucide-react";
import { barcodeService } from "@/features/barcodes/services/barcode.service";
import type { ProductBarcode } from "@/features/barcodes/types/barcode.types";

interface BarcodePrintPreviewProps {
  selections: Array<{ barcode: ProductBarcode; quantity: number }>;
  paperLabel: string;
}

export const BarcodePrintPreview = ({ selections, paperLabel }: BarcodePrintPreviewProps) => {
  const [images, setImages] = useState<Record<string, string>>({});
  const labels = useMemo(
    () => selections.flatMap(({ barcode, quantity }) => Array.from({ length: quantity }, (_, index) => ({ barcode, key: `${barcode.id}-${index}` }))),
    [selections],
  );

  useEffect(() => {
    let active = true;
    const missing = selections.filter(({ barcode }) => !images[barcode.id]);
    if (!missing.length) return undefined;

    void Promise.all(missing.map(async ({ barcode }) => [barcode.id, await barcodeService.render(barcode.code, barcode.format)] as const))
      .then((entries) => { if (active) setImages((current) => ({ ...current, ...Object.fromEntries(entries) })); })
      .catch(() => undefined);
    return () => { active = false; };
  }, [images, selections]);

  return (
    <aside className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_20px_rgba(37,99,235,.04)] xl:sticky xl:top-6 xl:self-start">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex items-start gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-blue-50 text-blue-600"><FileText className="h-4 w-4" /></span><div><h3 className="font-bold text-slate-900">Vista previa de hoja</h3><p className="mt-0.5 text-xs leading-5 text-slate-500">Dos etiquetas por fila para impresión {paperLabel}.</p></div></div>
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700"><Layers className="h-3.5 w-3.5" />{labels.length}</span>
      </div>
      <div className="bg-slate-100 p-4 sm:p-5">
        {labels.length ? <div className="mx-auto grid min-h-[430px] max-w-[330px] grid-cols-2 content-start gap-2 rounded-sm bg-white p-3 shadow-sm">{labels.slice(0, 10).map(({ barcode, key }) => <article key={key} className="flex min-h-28 flex-col items-center justify-center rounded border border-dashed border-slate-300 px-2 py-2 text-center"><p className="w-full truncate text-[10px] font-bold text-slate-800">{barcode.product.name}</p><p className="mt-0.5 font-mono text-[9px] text-slate-500">{barcode.product.sku}</p>{images[barcode.id] ? <img src={images[barcode.id]} alt={`Código ${barcode.code}`} className="mt-1 h-10 max-w-full object-contain" /> : <div className="mt-2 h-10 w-full animate-pulse rounded bg-slate-100" />}<p className="mt-0.5 font-mono text-[9px] font-semibold text-slate-700">{barcode.code}</p></article>)}{labels.length > 10 && <div className="col-span-2 pt-1 text-center text-[11px] font-medium text-slate-500">+ {labels.length - 10} etiqueta{labels.length - 10 === 1 ? "" : "s"} en las siguientes hojas</div>}</div> : <div className="grid min-h-[430px] place-items-center rounded-sm border border-dashed border-slate-300 bg-white p-8 text-center"><div><Layers className="mx-auto h-9 w-9 text-slate-300" /><p className="mt-3 text-sm font-semibold text-slate-600">Aún no hay etiquetas</p><p className="mx-auto mt-1 max-w-48 text-xs leading-5 text-slate-400">Selecciona códigos y define la cantidad para preparar la hoja.</p></div></div>}
      </div>
    </aside>
  );
};
