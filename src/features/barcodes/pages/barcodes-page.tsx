import { useEffect, useMemo, useState } from "react";
import { Barcode, CheckSquare, Printer, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { barcodeService } from "@/features/barcodes/services/barcode.service";
import { useBarcodes } from "@/features/barcodes/hooks/use-barcodes";
import type { BarcodeFormat, ProductBarcode } from "@/features/barcodes/types/barcode.types";

const writePrintDocument = (labels: Array<ProductBarcode & { image: string }>) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  printWindow.document.write(`<!doctype html><html><head><title>Etiquetas de códigos de barras</title><style>
    @page { size: A4; margin: 10mm; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #0f172a; font-family: Arial, sans-serif; }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8mm; }
    .label { min-height: 48mm; break-inside: avoid; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 1px dashed #cbd5e1; border-radius: 3mm; padding: 4mm; text-align: center; }
    .name { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; font-weight: 700; }
    .sku { margin-top: 1mm; color: #475569; font: 10px monospace; }
    img { display: block; max-width: 100%; height: 17mm; margin: 3mm 0 1mm; }
    .code { font: 10px monospace; }
  </style></head><body><main class="grid">${labels.map((label) => `<article class="label"><div class="name">${label.product.name}</div><div class="sku">${label.product.sku}</div><img src="${label.image}" alt="${label.code}"/><div class="code">${label.code}</div></article>`).join("")}</main></body></html>`);
  printWindow.document.close();
  printWindow.onload = () => printWindow.print();
};

export const BarcodesPage = ({ embedded = false }: { embedded?: boolean }) => {
  const data = useBarcodes();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [productId, setProductId] = useState("");
  const [format, setFormat] = useState<BarcodeFormat>("CODE128");
  const [message, setMessage] = useState<string | null>(null);
  const selectedProduct = data.products.find((product) => product.id === productId);
  const selectedBarcodes = useMemo(() => data.barcodes.filter((barcode) => selectedIds.includes(barcode.id)), [data.barcodes, selectedIds]);
  const allVisibleSelected = data.barcodes.length > 0 && data.barcodes.every((barcode) => selectedIds.includes(barcode.id));

  useEffect(() => {
    setSelectedIds((current) => current.filter((id) => data.barcodes.some((barcode) => barcode.id === id)));
  }, [data.barcodes]);

  const toggle = (id: string) => setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const toggleAll = () => setSelectedIds((current) => allVisibleSelected ? current.filter((id) => !data.barcodes.some((barcode) => barcode.id === id)) : Array.from(new Set([...current, ...data.barcodes.map((barcode) => barcode.id)])));

  const printSelected = async () => {
    if (!selectedBarcodes.length) return;
    const labels = await Promise.all(selectedBarcodes.map(async (barcode) => ({ ...barcode, image: await barcodeService.render(barcode.code, barcode.format) })));
    writePrintDocument(labels);
  };

  const generate = async () => {
    try {
      if (!productId || !selectedProduct) throw new Error("Selecciona un producto.");
      const generated = format === "CODE128" ? { code: selectedProduct.sku, format } : await data.generate(format);
      await data.create({ productId, code: generated.code, format: generated.format, isPrimary: true });
      setMessage("Código generado y vinculado al SKU. Ya puedes seleccionarlo para imprimir.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo generar el código.");
    }
  };

  return <div className={embedded ? "" : "mx-auto max-w-[1480px] p-4 sm:p-6 lg:p-7"}>
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><h1 className="flex items-center gap-3 text-2xl font-bold text-slate-900 sm:text-[30px]"><Barcode className="h-8 w-8 text-blue-600" /> Códigos de barras</h1><p className="mt-1 text-slate-600">Selecciona las etiquetas que deseas imprimir. Cada código está vinculado al SKU del producto.</p></div>
      <Button onClick={() => void printSelected()} disabled={!selectedBarcodes.length} className="gap-2"><Printer className="h-4 w-4" /> Imprimir {selectedBarcodes.length ? `${selectedBarcodes.length} seleccionado${selectedBarcodes.length === 1 ? "" : "s"}` : "seleccionados"}</Button>
    </header>

    <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="relative w-full sm:max-w-xl"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input value={data.search} onChange={(event) => data.setSearch(event.target.value)} className="pl-9" placeholder="Buscar por SKU, producto o código de barras..." /></div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700"><CheckSquare className="h-4 w-4" /> {selectedBarcodes.length} seleccionado{selectedBarcodes.length === 1 ? "" : "s"}</span>
      </div>
      <div className="overflow-x-auto"><table className="min-w-[760px] w-full text-left text-sm"><thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500"><tr><th className="w-14 px-5 py-3.5"><input aria-label="Seleccionar todos" type="checkbox" checked={allVisibleSelected} onChange={toggleAll} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" /></th><th className="px-5 py-3.5">Código</th><th className="px-5 py-3.5">Producto</th><th className="px-5 py-3.5">SKU</th><th className="px-5 py-3.5">Formato</th></tr></thead><tbody className="divide-y divide-slate-100">{data.barcodes.map((barcode) => <tr key={barcode.id} className="cursor-pointer transition hover:bg-blue-50/40" onClick={() => toggle(barcode.id)}><td className="px-5 py-4" onClick={(event) => event.stopPropagation()}><input aria-label={`Seleccionar ${barcode.product.name}`} type="checkbox" checked={selectedIds.includes(barcode.id)} onChange={() => toggle(barcode.id)} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" /></td><td className="px-5 py-4 font-mono font-semibold text-slate-700">{barcode.code}</td><td className="px-5 py-4 font-semibold text-slate-800">{barcode.product.name}</td><td className="px-5 py-4 font-mono text-xs text-slate-500">{barcode.product.sku}</td><td className="px-5 py-4"><span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{barcode.format}</span></td></tr>)}{!data.isLoading && !data.barcodes.length && <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-500">No hay códigos de barras para este filtro.</td></tr>}</tbody></table></div>
    </section>

    <section className="mt-6 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5 sm:p-6"><div className="flex flex-col gap-5 lg:flex-row lg:items-end"><div className="lg:w-72"><h2 className="font-bold text-slate-900">Generar código para un producto</h2><p className="mt-1 text-sm text-slate-500">Opcional. Luego aparecerá en la lista para imprimirlo.</p></div><Select value={productId} onChange={(event) => setProductId(event.target.value)} className="lg:flex-1"><option value="">Selecciona un producto</option>{data.products.map((product) => <option key={product.id} value={product.id}>{product.sku} — {product.name}</option>)}</Select><Select value={format} onChange={(event) => setFormat(event.target.value as BarcodeFormat)} className="lg:w-40"><option value="CODE128">CODE128</option><option value="EAN13">EAN-13</option></Select><Button onClick={() => void generate()} disabled={!productId || data.isSaving} className="gap-2"><Barcode className="h-4 w-4" /> Generar código</Button></div>{message && <p className="mt-4 text-sm text-slate-600">{message}</p>}</section>
  </div>;
};
