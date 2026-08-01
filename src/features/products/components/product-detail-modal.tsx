import { useEffect, useState } from "react";
import { Barcode, Boxes, Calendar, DollarSign, ImageOff, Package, Tag, Warehouse } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ProductStatusBadge } from "./product-status-badge";
import { barcodeService } from "@/features/barcodes/services/barcode.service";
import type { BarcodeFormat } from "@/features/barcodes/types/barcode.types";
import type { Product } from "@/features/products/types/product.types";

type AssociatedBarcode = { id: string; code: string; format: BarcodeFormat; isPrimary: boolean };

const BarcodePreview = ({ barcode }: { barcode: AssociatedBarcode }) => {
  const [image, setImage] = useState<string | null>(null);
  useEffect(() => {
    let isMounted = true;
    void barcodeService.render(barcode.code, barcode.format).then((value) => {
      if (isMounted) setImage(value);
    });
    return () => { isMounted = false; };
  }, [barcode.code, barcode.format]);
  return <article className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center"><div className="grid min-h-24 flex-1 place-items-center rounded-lg border border-slate-100 bg-slate-50/70 px-3">{image ? <img src={image} alt={`Código ${barcode.code}`} className="h-16 max-w-full object-contain" /> : <div className="grid h-16 place-items-center text-xs text-slate-400">Generando código...</div>}</div><div className="shrink-0 border-t border-slate-100 pt-3 sm:w-40 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0"><div className="flex items-center justify-between gap-3 sm:block"><span className="rounded-full bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700">{barcode.isPrimary ? "Código principal" : "Código secundario"}</span><span className="text-xs font-semibold text-slate-400 sm:mt-3 sm:block">{barcode.format}</span></div><p className="mt-3 font-mono text-xs font-bold text-slate-700">{barcode.code}</p><p className="mt-1 text-[11px] leading-4 text-slate-500">Disponible para lectura e impresión.</p></div></article>;
};

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onEdit: (product: Product) => void;
}

export const ProductDetailModal = ({ isOpen, onClose, product, onEdit }: ProductDetailModalProps) => {
  if (!product) return null;
  const formatPrice = (value: number) => new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(value);
  const marginAmount = product.salePrice - (product.costPrice || 0);
  const marginPercentage = product.salePrice > 0 ? ((marginAmount / product.salePrice) * 100).toFixed(1) : "0";
  const associatedBarcodes: AssociatedBarcode[] = product.barcodes?.length ? product.barcodes : product.barcode ? [{ id: "product-barcode", code: product.barcode, format: "CODE128", isPrimary: true }] : [];

  return <Dialog isOpen={isOpen} onClose={onClose} title="Detalle del producto" description={`Ficha comercial y disponibilidad de ${product.sku}`} maxWidth="2xl" headerClassName="relative overflow-hidden border-b-0 bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 px-6 py-5" titleClassName="text-white" descriptionClassName="text-blue-100" headerIcon={<div className="grid h-10 w-10 place-items-center rounded-xl border border-white/20 bg-white/10 text-blue-100"><Package className="h-5 w-5" /></div>}>
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50/90 to-indigo-50/40 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4"><div className="grid h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-blue-100 bg-white">{product.imageUrl ? <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" /> : <span className="grid place-items-center bg-blue-600 text-white"><Boxes className="h-7 w-7" /></span>}</div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="rounded-md bg-white px-2 py-1 font-mono text-xs font-bold text-slate-600 shadow-sm">{product.sku}</span><ProductStatusBadge product={product} /></div><h3 className="mt-2 truncate text-lg font-bold text-slate-900">{product.name}</h3><p className="mt-0.5 text-sm text-slate-500">{product.brand || "Sin marca"}{product.presentation ? ` · ${product.presentation}` : ""}</p></div></div>
        <Button onClick={() => { onClose(); onEdit(product); }} variant="ghost" className="shrink-0 border border-slate-200 bg-white shadow-sm hover:bg-slate-50">Editar producto</Button>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-4"><div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500"><Tag className="h-4 w-4 text-blue-600" /> Clasificación</div><dl className="space-y-2.5 text-sm"><div className="flex justify-between gap-3"><dt className="text-slate-500">Categoría</dt><dd className="font-semibold text-slate-800">{product.category}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-500">Unidad de medida</dt><dd className="font-semibold text-slate-800">{product.unit}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-500">Estado</dt><dd className="font-semibold text-slate-800">{product.isActive ? "Activo" : "Inactivo"}</dd></div></dl></section>
        <section className="rounded-xl border border-slate-200 bg-white p-4"><div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500"><DollarSign className="h-4 w-4 text-emerald-600" /> Precios y margen</div><dl className="space-y-2.5 text-sm"><div className="flex justify-between gap-3"><dt className="text-slate-500">Precio de venta</dt><dd className="font-bold text-slate-900">{formatPrice(product.salePrice)}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-500">Costo referencial</dt><dd className="font-semibold text-slate-700">{product.costPrice ? formatPrice(product.costPrice) : "Sin costo"}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-500">Margen estimado</dt><dd className="font-semibold text-emerald-600">{marginPercentage}% ({formatPrice(marginAmount)})</dd></div></dl></section>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4"><div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Descripción y observaciones</div><p className="text-sm leading-6 text-slate-700">{product.description || "Sin observaciones registradas."}</p></section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-4 py-3"><span className="flex items-center gap-2 text-sm font-bold text-slate-900"><Warehouse className="h-4 w-4 text-blue-600" /> Stock por almacén</span><span className="text-xs font-semibold text-slate-500">Total: <strong className="text-slate-900">{product.totalStock} {product.unit}</strong></span></div><div className="divide-y divide-slate-100">{product.stocks?.length ? product.stocks.map((stock) => <div key={stock.id} className="flex items-center justify-between px-4 py-3 text-sm"><div><p className="font-semibold text-slate-800">{stock.warehouseName}</p><p className="text-xs text-slate-400">Alerta mínima: {stock.minimum}</p></div><strong>{stock.quantity} {product.unit}</strong></div>) : <div className="flex items-center justify-between px-4 py-3 text-sm"><div><p className="font-semibold text-slate-800">Almacén principal</p><p className="text-xs text-slate-400">Alerta mínima: {product.minStock}</p></div><strong>{product.totalStock} {product.unit}</strong></div>}</div></section>

      <section className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4 sm:p-5"><div className="mb-4 flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-lg bg-blue-600 text-white"><Barcode className="h-4 w-4" /></span><div><h4 className="text-sm font-bold text-slate-900">Códigos de barras asociados</h4><p className="text-xs text-slate-500">Identificadores disponibles para lectura e impresión.</p></div></div>{associatedBarcodes.length ? <div className="grid gap-3">{associatedBarcodes.map((barcode) => <BarcodePreview key={barcode.id} barcode={barcode} />)}</div> : <div className="flex items-center gap-3 rounded-xl border border-dashed border-blue-200 bg-white/70 p-4 text-sm text-slate-500"><ImageOff className="h-5 w-5 text-blue-400" /> Este producto todavía no tiene un código de barras generado.</div>}</section>

      <footer className="flex items-center justify-between border-t border-slate-100 pt-2"><span className="flex items-center gap-1.5 text-xs text-slate-400"><Calendar className="h-3.5 w-3.5" /> Registrado: {new Date(product.createdAt).toLocaleDateString("es-PE")}</span><Button variant="ghost" onClick={onClose}>Cerrar</Button></footer>
    </div>
  </Dialog>;
};
