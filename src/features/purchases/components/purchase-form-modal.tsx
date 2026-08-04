import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  Check,
  ChevronDown,
  FileUp,
  LoaderCircle,
  PackagePlus,
  Plus,
  ReceiptText,
  Search,
  ShoppingBag,
  Trash2,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { Product } from "@/features/products/types/product.types";
import type {
  CreatePurchaseInput,
  PurchasePaymentMethod,
  SupplierOption,
  WarehouseOption,
} from "@/features/purchases/types/purchase.types";

type FormItem = { productId: string; productSearch: string; quantity: string; unitCost: string };
const blankItem = (): FormItem => ({ productId: "", productSearch: "", quantity: "1", unitCost: "" });
const today = () => new Date().toISOString().slice(0, 10);
const money = (value: number) =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(value);

const SectionTitle = ({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) => (
  <div className="flex items-center gap-2.5">
    <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-600 text-white">
      {icon}
    </span>
    <div>
      <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900">{title}</h4>
      <p className="text-[11px] text-slate-600">{description}</p>
    </div>
  </div>
);

const SupplierCombobox = ({
  suppliers,
  value,
  onChange,
}: {
  suppliers: SupplierOption[];
  value: string;
  onChange: (id: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const selected = suppliers.find((supplier) => supplier.id === value);
  const options = suppliers.filter((supplier) =>
    supplier.name.toLowerCase().includes(search.toLowerCase()),
  );
  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node))
        setIsOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);
  return (
    <div ref={containerRef} className="relative mt-1">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={isOpen ? search : (selected?.name ?? search)}
          onFocus={() => setIsOpen(true)}
          onChange={(event) => {
            setSearch(event.target.value);
            onChange("");
            setIsOpen(true);
          }}
          placeholder="Buscar proveedor nacional..."
          className="pl-9 pr-9"
        />
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>
      {isOpen && (
        <div className="absolute z-30 mt-1 max-h-52 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
          <p className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {options.length} proveedor(es)
          </p>
          {options.map((supplier) => (
            <button
              key={supplier.id}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onChange(supplier.id);
                setSearch("");
                setIsOpen(false);
              }}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 transition hover:bg-blue-50 hover:text-blue-800"
            >
              <span className="truncate font-medium">{supplier.name}</span>
              {value === supplier.id && <Check className="h-4 w-4 text-blue-600" />}
            </button>
          ))}
          {!options.length && (
            <p className="px-3 py-5 text-center text-sm text-slate-500">
              No se encontraron proveedores.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

const LegacyPurchaseLine = ({
  item,
  index,
  products,
  onChange,
  onRemove,
  removable,
}: {
  item: FormItem;
  index: number;
  products: Product[];
  onChange: (changes: Partial<FormItem>) => void;
  onRemove: () => void;
  removable: boolean;
}) => {
  const product = products.find((entry) => entry.id === item.productId);
  const productOptionsId = `purchase-products-${index}`;
  const subtotal = (Number(item.quantity) || 0) * (Number(item.unitCost) || 0);
  return (
    <div className="grid min-w-[690px] grid-cols-[minmax(260px,1fr)_80px_110px_135px_125px_40px] items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0">
      <div className="space-y-1">
        <Input
          list={productOptionsId}
          value={item.productSearch}
          placeholder="Escribe SKU o nombre del producto"
          onChange={(event) => {
            const selected = products.find((entry) => `${entry.sku} — ${entry.name}` === event.target.value);
            onChange({ productSearch: event.target.value, productId: selected?.id ?? "", unitCost: selected ? String(selected.costPrice) : "" });
          }}
        />
        <datalist id={productOptionsId}>{products.map((entry) => <option key={entry.id} value={`${entry.sku} — ${entry.name}`}>{`Costo ref.: ${money(entry.costPrice)}`}</option>)}</datalist>
      </div>
      <span className="rounded-md bg-slate-100 px-2 py-2 text-center text-xs font-bold text-slate-600">
        {product?.unit || "UND"}
      </span>
      <Input
        type="number"
        min="1"
        step="1"
        inputMode="numeric"
        value={item.quantity}
        onChange={(event) => onChange({ quantity: event.target.value.replace(/\D/g, "") })}
        aria-label={`Cantidad ${index + 1}`}
      />
      <div className="space-y-1"><Input type="number" min="0" step="0.01" value={item.unitCost} onChange={(event) => onChange({ unitCost: event.target.value })} placeholder="0.00" aria-label={`Costo unitario ${index + 1}`} /><p className="text-[10px] text-slate-500">Ref.: {product ? money(product.costPrice) : "—"}</p></div>
      <strong className="text-right text-sm text-emerald-700">{money(subtotal)}</strong>
      <button
        type="button"
        onClick={onRemove}
        disabled={!removable}
        aria-label="Quitar producto"
        className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
};

const ProductCombobox = ({
  products,
  item,
  onChange,
}: {
  products: Product[];
  item: FormItem;
  onChange: (changes: Partial<FormItem>) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState(item.productSearch);
  const containerRef = useRef<HTMLDivElement>(null);
  const selected = products.find((product) => product.id === item.productId);
  const options = products.filter((product) =>
    `${product.sku} ${product.name}`.toLowerCase().includes(search.toLowerCase()),
  );
  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={isOpen ? search : (selected ? `${selected.sku} — ${selected.name}` : search)}
          placeholder="Buscar por SKU o nombre"
          className="pl-9 pr-9"
          onFocus={() => { setSearch(item.productSearch); setIsOpen(true); }}
          onChange={(event) => { setSearch(event.target.value); onChange({ productSearch: event.target.value, productId: "", unitCost: "" }); setIsOpen(true); }}
        />
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>
      {isOpen && <div className="absolute z-40 mt-1 max-h-52 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
        <p className="border-b border-slate-100 px-2 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Filtrar productos · {options.length} resultado(s)</p>
        {options.map((product) => <button key={product.id} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => { onChange({ productId: product.id, productSearch: `${product.sku} — ${product.name}`, unitCost: String(product.costPrice) }); setSearch(""); setIsOpen(false); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-blue-50">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-blue-50 text-[10px] font-bold text-blue-700">{product.sku.slice(0, 3)}</span>
          <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-slate-800">{product.name}</span><span className="block text-xs text-slate-500">{product.sku} · {product.unit} · Ref. {money(product.costPrice)}</span></span>
          {product.taxTreatment !== "TAXED" && <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">Sin IGV</span>}
          {item.productId === product.id && <Check className="h-4 w-4 text-blue-600" />}
        </button>)}
        {!options.length && <p className="px-3 py-6 text-center text-sm text-slate-500">No se encontraron productos.</p>}
      </div>}
    </div>
  );
};

const PurchaseLine = ({ item, index, products, onChange, onRemove, removable }: { item: FormItem; index: number; products: Product[]; onChange: (changes: Partial<FormItem>) => void; onRemove: () => void; removable: boolean }) => {
  const product = products.find((entry) => entry.id === item.productId);
  const subtotal = (Number(item.quantity) || 0) * (Number(item.unitCost) || 0);
  return <div className="grid w-full grid-cols-[minmax(220px,1fr)_58px_82px_110px_100px_36px] items-start gap-2 border-b border-slate-100 px-4 py-4 last:border-b-0">
    <div><ProductCombobox products={products} item={item} onChange={onChange} /><p className={`mt-1 pl-1 text-[11px] font-medium ${product?.taxTreatment === "TAXED" ? "text-slate-500" : "text-amber-700"}`}>{product ? product.taxTreatment === "TAXED" ? "Afecto a IGV (18%)" : "Producto sin IGV" : "Seleccione un producto"}</p></div>
    <span className="mt-0.5 rounded-lg bg-slate-100 px-1 py-2.5 text-center text-xs font-bold text-slate-600">{product?.unit || "UND"}</span>
    <Input type="number" min="1" step="1" inputMode="numeric" value={item.quantity} onChange={(event) => onChange({ quantity: event.target.value.replace(/\D/g, "") })} aria-label={`Cantidad ${index + 1}`} />
    <div><Input type="number" min="0" step="0.01" value={item.unitCost} onChange={(event) => onChange({ unitCost: event.target.value })} placeholder="0.00" aria-label={`Costo unitario ${index + 1}`} /><p className="mt-1 text-[11px] text-slate-500">Ref.: {product ? money(product.costPrice) : "—"}</p></div>
    <strong className="pt-2.5 text-right text-sm text-emerald-700">{money(subtotal)}</strong>
    <button type="button" onClick={onRemove} disabled={!removable} aria-label="Quitar producto" className="mt-0.5 grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30"><Trash2 className="h-4 w-4" /></button>
  </div>;
};

interface PurchaseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePurchaseInput) => Promise<unknown>;
  isSubmitting: boolean;
  products: Product[];
  suppliers: SupplierOption[];
  warehouses: WarehouseOption[];
}

export const PurchaseFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  products,
  suppliers,
}: PurchaseFormModalProps) => {
  const [supplierId, setSupplierId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PurchasePaymentMethod>("CASH");
  const [currency, setCurrency] = useState("PEN");
  const [documentNumber, setDocumentNumber] = useState("");
  const [purchasedAt, setPurchasedAt] = useState(today());
  const [warehouseEntryAt, setWarehouseEntryAt] = useState(today());
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<FormItem[]>([blankItem()]);
  const canAddProduct = items.every((item) => Boolean(item.productId));
  const totals = useMemo(() => {
    const result = items.reduce(
      (total, item) => {
        const subtotal = (Number(item.quantity) || 0) * (Number(item.unitCost) || 0);
        const product = products.find((entry) => entry.id === item.productId);
        return { subtotal: total.subtotal + subtotal, tax: total.tax + (product?.taxTreatment === "TAXED" ? subtotal * 0.18 : 0) };
      },
      { subtotal: 0, tax: 0 },
    );
    return { ...result, total: result.subtotal + result.tax };
  }, [items, products]);
  useEffect(() => {
    if (!isOpen) return;
    setSupplierId("");
    setPaymentMethod("CASH");
    setCurrency("PEN");
    setDocumentNumber("");
    setPurchasedAt(today());
    setWarehouseEntryAt(today());
    setNotes("");
    setItems([blankItem()]);
  }, [isOpen]);
  const updateItem = (index: number, changes: Partial<FormItem>) =>
    setItems((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...changes } : item)),
    );
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (
      !supplierId ||
      !documentNumber.trim() ||
      items.some(
        (item) => !item.productId || Number(item.quantity) <= 0 || Number(item.unitCost) < 0,
      )
    ) {
      alert("Completa proveedor, comprobante y productos con cantidades válidas.");
      return;
    }
    try {
      await onSubmit({
      supplierId,
      paymentMethod,
      currency,
      supplierDocumentNumber: documentNumber.trim(),
      purchasedAt,
      warehouseEntryAt,
      notes: notes.trim() || undefined,
      items: items.map((item) => {
        const product = products.find((entry) => entry.id === item.productId);
        return {
          productId: item.productId,
          quantity: Number(item.quantity),
          unitCost: Number(item.unitCost),
          presentationName: product?.presentation || undefined,
          unit: product?.unit || "UND",
          taxRate: product?.taxTreatment === "TAXED" ? 18 : 0,
        };
      }),
      });
      onClose();
    } catch (error) {
      alert(error instanceof Error ? error.message : "No se pudo registrar la compra. Revisa los datos e inténtalo nuevamente.");
    }
  };
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Nueva compra nacional"
      description="Registra una compra ya recibida. Al guardar, el inventario se actualizará automáticamente."
      maxWidth="4xl"
      headerClassName="relative overflow-hidden border-b-0 bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 px-6 py-5"
      titleClassName="text-white"
      descriptionClassName="text-blue-100"
      headerIcon={
        <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/20 bg-white/10 text-blue-100">
          <ShoppingBag className="h-5 w-5" />
        </span>
      }
    >
      <form onSubmit={submit} className="space-y-6">
        {isSubmitting && (
          <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/45 px-4 backdrop-blur-sm">
            <div className="flex w-full max-w-sm items-center gap-4 rounded-2xl border border-blue-100 bg-white p-5 shadow-2xl">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-600"><LoaderCircle className="h-6 w-6 animate-spin" /></span>
              <div><p className="font-bold text-slate-900">Registrando compra</p><p className="mt-1 text-sm text-slate-500">Guardando la compra e ingresando existencias...</p></div>
            </div>
          </div>
        )}
        <section className="rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50/90 to-indigo-50/40 p-4 shadow-sm">
          <SectionTitle
            icon={<ReceiptText className="h-4 w-4" />}
            title="Datos del comprobante"
            description="Selecciona al proveedor y registra la información fiscal de la compra."
          />
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block text-xs font-semibold text-slate-700">
              Proveedor <span className="text-rose-500">*</span>
              <SupplierCombobox suppliers={suppliers} value={supplierId} onChange={setSupplierId} />
            </label>
            <label className="block text-xs font-semibold text-slate-700">
              N° comprobante proveedor <span className="text-rose-500">*</span>
              <Input
                value={documentNumber}
                onChange={(event) => setDocumentNumber(event.target.value)}
                placeholder="Ej. F001-000123"
                className="mt-1"
                required
              />
            </label>
            <label className="block text-xs font-semibold text-slate-700">
              Fecha de compra <span className="text-rose-500">*</span>
              <Input
                type="date"
                value={purchasedAt}
                onChange={(event) => setPurchasedAt(event.target.value)}
                className="mt-1"
                required
              />
            </label>
            <label className="block text-xs font-semibold text-slate-700">
              Fecha de ingreso a almacén <span className="text-rose-500">*</span>
              <Input
                type="date"
                value={warehouseEntryAt}
                onChange={(event) => setWarehouseEntryAt(event.target.value)}
                className="mt-1"
                required
              />
            </label>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-slate-700">
              Moneda{" "}
              <Select
                value={currency}
                onChange={(event) => setCurrency(event.target.value)}
                className="mt-1"
              >
                <option value="PEN">PEN — Sol peruano</option>
                <option value="USD">USD — Dólar americano</option>
              </Select>
            </label>
            <label className="block text-xs font-semibold text-slate-700">
              Forma de pago{" "}
              <Select
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value as PurchasePaymentMethod)}
                className="mt-1"
              >
                <option value="CASH">Efectivo</option>
                  <option value="CARD">Tarjeta</option>
                  <option value="BANK_TRANSFER">Transferencia</option>
                  <option value="YAPE_PLIN">Yape / Plin</option>
              </Select>
            </label>
          </div>
        </section>
        <section className="relative overflow-visible rounded-xl border border-slate-200 bg-white">
          <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/80 p-4 sm:flex-row sm:items-center sm:justify-between">
            <SectionTitle
              icon={<PackagePlus className="h-4 w-4" />}
              title="Productos de la compra"
              description="Selecciona productos y registra el costo recibido por el proveedor."
            />
            <Button
              type="button"
              variant="ghost"
              onClick={() => setItems((current) => [...current, blankItem()])}
              disabled={!canAddProduct}
              title={
                canAddProduct
                  ? "Agregar producto"
                  : "Selecciona el producto actual antes de agregar otro"
              }
              className="gap-1.5 self-start border border-blue-100 bg-white text-xs text-blue-700 hover:bg-blue-50"
            >
              <Plus className="h-3.5 w-3.5" /> Agregar producto
            </Button>
          </div>
          <div className="relative">
            <div className="grid w-full grid-cols-[minmax(220px,1fr)_58px_82px_110px_100px_36px] gap-2 bg-slate-50 px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
              <span>Producto</span>
              <span>UM</span>
              <span>Cant.</span>
              <span>Costo unit.</span>
              <span className="text-right">Subtotal</span>
              <span />
            </div>
            {items.map((item, index) => (
              <PurchaseLine
                key={index}
                item={item}
                index={index}
                products={products}
                onChange={(changes) => updateItem(index, changes)}
                onRemove={() =>
                  setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))
                }
                removable={items.length > 1}
              />
            ))}
          </div>
          <div className="border-t border-slate-200 bg-slate-50/70 p-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Subtotal
                </p>
                <p className="mt-1 text-base font-bold text-slate-700">{money(totals.subtotal)}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  IGV (18%)
                </p>
                <p className="mt-1 text-base font-bold text-slate-700">{money(totals.tax)}</p>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  Total de compra
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-emerald-600">
                  {money(totals.total)}
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <FileUp className="h-4 w-4 text-blue-600" /> Documentos adjuntos
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Próximamente podrás adjuntar PDF, XML, imágenes o Excel.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              disabled
              className="gap-2 border border-slate-200 bg-white text-slate-400"
            >
              <FileUp className="h-4 w-4" /> Adjuntar archivo
            </Button>
          </div>
        </section>
        <label className="block text-sm font-semibold text-slate-700">
          Observaciones
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={2}
            placeholder="Notas internas o indicaciones de recepción..."
            className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
          />
        </label>
        <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !products.length || !suppliers.length}
            className="min-w-[180px] gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
          >
            <Truck className="h-4 w-4" />
            {isSubmitting ? "Registrando y recepcionando..." : "Registrar y recepcionar"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
