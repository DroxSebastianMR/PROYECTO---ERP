import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  Barcode,
  Eye,
  Minus,
  Plus,
  ScanBarcode,
  ShoppingBasket,
  Printer,
  Trash2,
  UserRound,
  WalletCards,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SaleProcessingOverlay } from "@/features/sales/components/sale-processing-overlay";
import { CashTenderInput } from "@/features/sales/components/cash-tender-input";
import { SaleTicket } from "@/features/sales/components/sale-ticket";
import { printSaleTicket } from "@/features/sales/services/sale-ticket-print.service";
import { CustomerFormModal } from "@/features/customers/components/customer-form-modal";
import { ProductDetailModal } from "@/features/products/components/product-detail-modal";
import type { Product } from "@/features/products/types/product.types";
import type { CreateCustomerInput, DocumentType } from "@/features/customers/types/customer.types";
import type {
  CreateSaleInput,
  CustomerOption,
  SaleDocumentType,
  SalePaymentMethod,
  WarehouseOption,
  SaleReceipt,
} from "@/features/sales/types/sale.types";

type CartLine = { product: Product; quantity: number };
type PaymentSplit = { method: Exclude<SalePaymentMethod, "CREDIT">; amount: string; received?: string };
interface NewSaleFormProps {
  onCancel: () => void;
  onSubmit: (data: CreateSaleInput) => Promise<SaleReceipt>;
  onComplete: () => void;
  onCreateCustomer: (data: CreateCustomerInput) => Promise<CustomerOption>;
  onLookupCustomerDocument: (type: DocumentType, document: string) => Promise<{
    found: boolean;
    data?: Record<string, string | undefined>;
    message?: string;
  }>;
  isSubmitting: boolean;
  isCreatingCustomer: boolean;
  products: Product[];
  customers: CustomerOption[];
  warehouses: WarehouseOption[];
}
const money = (value: number) =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(value);

const CustomerPicker = ({
  customers,
  value,
  onChange,
}: {
  customers: CustomerOption[];
  value: string;
  onChange: (customerId: string) => void;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selected = customers.find((customer) => customer.id === value);
  const visibleCustomers = customers.filter((customer) => {
    const term = search.trim().toLowerCase();
    return !term || customer.name.toLowerCase().includes(term) || customer.document?.toLowerCase().includes(term);
  });

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div ref={containerRef} className="relative min-w-0 flex-1">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 text-left text-sm text-slate-700 outline-none transition hover:border-blue-300 focus:ring-2 focus:ring-blue-100"
      >
        <span className="truncate">{selected ? `${selected.name}${selected.document ? ` · ${selected.document}` : ""}` : "Cliente genérico (público general)"}</span>
        <span className="text-xs text-slate-400">⌄</span>
      </button>
      {isOpen && (
        <div className="absolute left-0 top-[calc(100%+6px)] z-30 w-full overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10">
          <Input
            autoFocus
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nombre, DNI o RUC"
            className="mb-1.5 h-9 text-xs"
          />
          <div className="max-h-52 overflow-y-auto">
            <button
              type="button"
              onClick={() => { onChange(""); setIsOpen(false); setSearch(""); }}
              className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-blue-50"
            >
              Cliente genérico (público general)
            </button>
            {visibleCustomers.map((customer) => (
              <button
                key={customer.id}
                type="button"
                onClick={() => { onChange(customer.id); setIsOpen(false); setSearch(""); }}
                className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-blue-50"
              >
                <span className="block truncate font-medium">{customer.name}</span>
                {customer.document && <span className="block text-xs text-slate-500">{customer.document}</span>}
              </button>
            ))}
            {!visibleCustomers.length && <p className="px-3 py-4 text-center text-xs text-slate-500">No se encontraron clientes.</p>}
          </div>
        </div>
      )}
    </div>
  );
};

const paymentLabels: Record<Exclude<SalePaymentMethod, "CREDIT">, string> = { CASH: "Efectivo · físico", YAPE_PLIN: "Yape / Plin · digital", BANK_TRANSFER: "Transferencia · digital", CARD: "Tarjeta · digital" };
const PaymentPicker = ({ method, isSplit, splitCount, onSelect, onConfigure }: { method: SalePaymentMethod; isSplit: boolean; splitCount: number; onSelect: (method: Exclude<SalePaymentMethod, "CREDIT">) => void; onConfigure: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const label = isSplit ? `Pago combinado · ${splitCount} medios` : method === "CREDIT" ? "Crédito" : paymentLabels[method];
  return <div className="relative"><label className="text-xs font-bold uppercase tracking-wide text-slate-500">Forma de cobro</label><button type="button" onClick={() => setIsOpen((value) => !value)} className="mt-1.5 flex h-11 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition hover:border-blue-300 focus:ring-2 focus:ring-blue-100"><span className="truncate">{label}</span><span className="text-slate-400">⌄</span></button>{isOpen && <div className="absolute z-30 mt-1.5 w-full overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10">{(Object.keys(paymentLabels) as Array<Exclude<SalePaymentMethod, "CREDIT">>).map((option) => <button key={option} type="button" onClick={() => { onSelect(option); setIsOpen(false); }} className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-blue-50"><span>{paymentLabels[option]}</span>{!isSplit && method === option && <span className="text-blue-600">✓</span>}</button>)}<div className="my-1 border-t border-slate-100" /><button type="button" onClick={() => { onConfigure(); setIsOpen(false); }} className="w-full rounded-lg bg-blue-50 px-3 py-2.5 text-left text-sm font-semibold text-blue-700 hover:bg-blue-100">+ Combinar medios de pago</button></div>}</div>;
};

export const NewSaleForm = ({
  onCancel,
  onSubmit,
  onComplete,
  onCreateCustomer,
  onLookupCustomerDocument,
  isSubmitting,
  isCreatingCustomer,
  products,
  customers,
  warehouses,
}: NewSaleFormProps) => {
  const scannerRef = useRef<HTMLInputElement>(null);
  const idempotencyKeyRef = useRef<string | null>(null);
  const scanBufferRef = useRef({ value: "", lastKeyAt: 0 });
  const [query, setQuery] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<SalePaymentMethod>("CASH");
  const [isSplitPayment, setIsSplitPayment] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentSplits, setPaymentSplits] = useState<PaymentSplit[]>([{ method: "CASH", amount: "" }]);
  const [cashReceived, setCashReceived] = useState("");
  const documentType: SaleDocumentType = "RECEIPT";
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState<SaleReceipt | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const activeWarehouseId = warehouses[0]?.id || "";
  const warehouseName = warehouses.find((warehouse) => warehouse.id === activeWarehouseId)?.name;
  const available = useCallback(
    (product: Product) => {
      const warehouseStock = product.stocks?.find((stock) => stock.warehouseName === warehouseName);
      // Nunca usar el stock total como sustituto cuando el producto sí tiene existencias
      // registradas, pero no en el almacén activo.
      return warehouseStock
        ? Math.max(0, warehouseStock.quantity)
        : product.stocks
          ? 0
          : product.totalStock;
    },
    [warehouseName],
  );
  const visibleProducts = useMemo(() => {
    const term = query.trim().toLowerCase();
    return products
      .filter(
        (product) =>
          product.isActive &&
          (!term ||
            [product.sku, product.barcode, product.name, product.brand, product.category].some(
              (value) => value?.toLowerCase().includes(term),
            )),
      )
      .sort((first, second) => available(second) - available(first))
      .slice(0, 6);
  }, [products, query, available]);
  const addProduct = (product: Product) => {
    const stock = available(product);
    if (stock <= 0) return;
    setCart((current) => {
      const currentLine = current.find((line) => line.product.id === product.id);
      return currentLine
        ? current.map((line) =>
            line.product.id === product.id
              ? { ...line, quantity: Math.min(line.quantity + 1, stock) }
              : line,
          )
        : [...current, { product, quantity: 1 }];
    });
    setQuery("");
    scannerRef.current?.focus();
  };
  const handleScanner = (rawCode = query) => {
    const code = rawCode.trim().toLowerCase();
    const product = products.find(
      (entry) =>
        entry.isActive && [entry.barcode, entry.sku].some((value) => value?.toLowerCase() === code),
    );
    if (product) addProduct(product);
    else if (code) alert("No se encontró un producto activo con ese código.");
  };
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.altKey || event.metaKey || event.target === scannerRef.current) return;
      const target = event.target as HTMLElement | null;
      if (target?.tagName === "TEXTAREA" || target?.isContentEditable) return;
      const now = Date.now();
      if (event.key === "Enter") {
        const scanned = scanBufferRef.current.value;
        const isScannerRead = scanned.length >= 3 && now - scanBufferRef.current.lastKeyAt < 180;
        scanBufferRef.current = { value: "", lastKeyAt: 0 };
        if (isScannerRead) { event.preventDefault(); handleScanner(scanned); }
        return;
      }
      if (event.key.length === 1) {
        const previous = scanBufferRef.current;
        scanBufferRef.current = { value: now - previous.lastKeyAt > 180 ? event.key : `${previous.value}${event.key}`, lastKeyAt: now };
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [products, warehouseName]);
  const setQuantity = (product: Product, quantity: number) =>
    setCart((current) =>
      current.map((line) =>
        line.product.id === product.id
          ? { ...line, quantity: Math.max(1, Math.min(quantity || 1, available(product))) }
          : line,
      ),
    );
  const total = cart.reduce(
    (sum, line) =>
      sum +
      line.quantity *
        (line.quantity >= (line.product.wholesaleMinQuantity ?? 10) && line.product.wholesalePrice
          ? line.product.wholesalePrice
          : line.product.salePrice),
    0,
  );
  const splitTotal = paymentSplits.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
  const selectedCustomer = customers.find((customer) => customer.id === customerId);
  const isCashPayment = !isSplitPayment && paymentMethod === "CASH";
  const cashReceivedAmount = Number(cashReceived) || 0;
  const requiresCustomerDni = total >= 700;
  const requiresBankTransfer = total > 2000;
  const hasIncompleteCashTender = paymentSplits.some(
    (payment) => payment.method === "CASH" && Boolean(payment.received) && Number(payment.received) < Number(payment.amount),
  );

  useEffect(() => {
    if (!requiresBankTransfer) return;
    setPaymentMethod("BANK_TRANSFER");
    setIsSplitPayment(false);
  }, [requiresBankTransfer]);
  const saveCustomer = async (input: CreateCustomerInput) => {
    const customer = await onCreateCustomer(input);
    setCustomerId(customer.id);
    setCustomerOpen(false);
  };
  const requestSaleConfirmation = (event: FormEvent) => {
    event.preventDefault();
    if (!activeWarehouseId || !cart.length) {
      alert("Agrega productos disponibles para procesar la venta.");
      return;
    }
    if (paymentMethod === "CREDIT" && !customerId) {
      alert("Selecciona un cliente para registrar una venta a crédito.");
      return;
    }
    if (requiresCustomerDni && !/^\d{8}$/.test(selectedCustomer?.document?.trim() ?? "")) {
      alert("Las ventas desde S/ 700.00 requieren seleccionar un cliente con DNI válido.");
      return;
    }
    if (requiresBankTransfer && paymentMethod !== "BANK_TRANSFER") {
      alert("Las ventas mayores a S/ 2,000.00 deben cobrarse por transferencia bancaria.");
      return;
    }
    if (isCashPayment && cashReceivedAmount < total) {
      alert("Ingresa el monto recibido en efectivo para calcular el vuelto.");
      return;
    }
    if (isSplitPayment && Math.abs(splitTotal - total) > 0.009) {
      alert("La suma de los pagos combinados debe coincidir con el total de la venta.");
      return;
    }
    if (isSplitPayment && hasIncompleteCashTender) {
      alert("El efectivo recibido debe cubrir el monto asignado a ese medio de pago.");
      return;
    }
    setIsConfirmOpen(true);
  };
  const processSale = async () => {
    const saleInput: CreateSaleInput = {
      customerId: customerId || undefined,
      warehouseId: activeWarehouseId,
      paymentMethod,
      payments: isSplitPayment ? paymentSplits.map((payment) => ({ method: payment.method, amount: Number(payment.amount) || 0 })) : undefined,
      documentType,
      idempotencyKey: idempotencyKeyRef.current ?? crypto.randomUUID(),
      items: cart.map((line) => ({
        productId: line.product.id,
        quantity: line.quantity,
        unitPrice: line.quantity >= (line.product.wholesaleMinQuantity ?? 10) && line.product.wholesalePrice
          ? line.product.wholesalePrice
          : line.product.salePrice,
      })),
    };
    idempotencyKeyRef.current = saleInput.idempotencyKey;
    try {
      const sale = await onSubmit(saleInput);
      setCart([]);
      setCompletedSale(sale);
      setIsConfirmOpen(false);
      idempotencyKeyRef.current = null;
    } catch (error) {
      try {
        // If the response was interrupted after commit, retrying the same key returns
        // the already confirmed sale instead of creating a duplicate.
        await new Promise((resolve) => window.setTimeout(resolve, 900));
        const sale = await onSubmit(saleInput);
        setCart([]);
        setCompletedSale(sale);
        setIsConfirmOpen(false);
        idempotencyKeyRef.current = null;
      } catch {
        alert(error instanceof Error ? error.message : "No se pudo procesar la venta.");
      }
    }
  };

  return (
    <>
      <SaleProcessingOverlay isOpen={isSubmitting} />
      <form onSubmit={requestSaleConfirmation} className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_440px]">
        <main className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(37,99,235,.04)]">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white">
                  <ScanBarcode className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900">Entrada de productos</h2>
                  <p className="text-xs text-slate-500">
                    Escanea un código o busca en el catálogo.
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Barcode className="absolute left-3 top-3 h-4 w-4 text-blue-600" />
                  <Input
                    ref={scannerRef}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        handleScanner();
                      }
                    }}
                    placeholder="Pistolear o escribir código de barras / SKU"
                    className="border-blue-200 bg-white pl-9"
                  />
                </div>
                <Button
                  type="button"
                  onClick={() => scannerRef.current?.focus()}
                  className="gap-2 bg-blue-700 text-white hover:bg-blue-800"
                >
                  <ScanBarcode className="h-4 w-4" />
                  Lector automático
                </Button>
              </div>
              <p className="mt-2 text-[11px] text-blue-700">
                El lector queda listo al enfocar el campo; cada lectura seguida de Enter agrega el
                producto.
              </p>
            </div>
          </section>
          <section>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Productos más vendidos</h2>
                <p className="text-xs text-slate-500">
                  Atajos del catálogo disponible en el almacén seleccionado.
                </p>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                {visibleProducts.length} disponibles
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visibleProducts.map((product) => {
                const stock = available(product);
                const low = stock > 0 && stock <= product.minStock;
                return (
                  <article
                    key={product.id}
                    className={`flex min-h-52 flex-col rounded-2xl border bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md ${low ? "border-amber-200" : "border-slate-200"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2"><span className="font-mono text-[11px] font-bold text-slate-400">{product.sku}</span><span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">UM: {product.unit}</span></div>
                      <span
                        className={`rounded-md px-2 py-1 text-[10px] font-bold ${stock <= 0 ? "bg-rose-50 text-rose-600" : low ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}
                      >
                        {stock <= 0 ? "SIN STOCK" : low ? "BAJO STOCK" : "DISPONIBLE"}
                      </span>
                    </div>
                    <div className="mt-4 flex items-start gap-3">
                      <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl border border-slate-100 bg-blue-50 text-xs font-bold text-blue-600">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                        ) : product.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base font-bold leading-snug text-slate-900">{product.name}</h3>
                        <p className="mt-1 text-xs text-slate-500">{product.brand} · {product.presentation ?? "Presentación base"}</p>
                      </div>
                    </div>
                    <div className="mt-auto flex items-end justify-between border-t border-slate-100 pt-4">
                      <div>
                        <span className="text-xs text-blue-700">S/ </span>
                        <strong className="text-3xl tracking-tight text-blue-700">
                          {product.salePrice.toFixed(2)}
                        </strong>
                        <p className="mt-2 text-xs text-slate-500">
                          Stock actual: <span className="font-bold text-slate-800">{stock}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2"><button type="button" onClick={() => setDetailProduct(product)} className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700" aria-label={`Ver detalle de ${product.name}`}><Eye className="h-4 w-4" /></button><button type="button" onClick={() => addProduct(product)} disabled={stock <= 0} className="grid h-10 w-10 place-items-center rounded-full bg-blue-50 text-blue-700 transition hover:bg-blue-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"><Plus className="h-5 w-5" /></button></div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </main>
        <aside className="xl:sticky xl:top-[76px] xl:h-[calc(100vh-92px)] xl:self-start">
          <section className="flex h-full min-h-[720px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <header className="flex items-center justify-between border-b border-slate-200 px-5 py-5">
              <div className="flex items-center gap-2">
                <ShoppingBasket className="h-5 w-5 text-blue-600" />
                <h2 className="font-bold text-slate-900">Carrito de venta</h2>
              </div>
              <span className="rounded-full bg-blue-700 px-2.5 py-1 text-xs font-bold text-white">
                {cart.length} ítems
              </span>
            </header>
            <div className="space-y-3 border-b border-slate-100 p-5">
              <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Cliente
              </label>
              <div className="flex gap-2">
                <CustomerPicker customers={customers} value={customerId} onChange={setCustomerId} />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setCustomerOpen(true)}
                  className="shrink-0 border border-blue-100 px-3 text-blue-700"
                >
                  <UserRound className="h-4 w-4" />
                </Button>
              </div>
              <PaymentPicker method={paymentMethod} isSplit={isSplitPayment} splitCount={paymentSplits.length} onSelect={(method) => { if (requiresBankTransfer && method !== "BANK_TRANSFER") { alert("Esta venta debe cobrarse por transferencia bancaria."); return; } setPaymentMethod(method); setIsSplitPayment(false); setCashReceived(""); }} onConfigure={() => { if (requiresBankTransfer) { alert("Esta venta no admite pago combinado porque supera S/ 2,000.00."); return; } setPaymentMethod("CASH"); setIsPaymentModalOpen(true); }} />
              {requiresCustomerDni && <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">Desde S/ 700.00 debes seleccionar un cliente con DNI.</p>}
              {requiresBankTransfer && <p className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-800">Por superar S/ 2,000.00, esta venta se cobrará por transferencia bancaria.</p>}
              {isCashPayment && <CashTenderInput dueAmount={total} received={cashReceived} onChange={setCashReceived} compact />}
              {false && paymentMethod !== "CREDIT" && <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3">
                <div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold text-slate-800">Pago combinado</p><p className="text-xs text-slate-500">Divide el total entre efectivo y medios digitales.</p></div><button type="button" onClick={() => setIsSplitPayment((value) => !value)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${isSplitPayment ? "bg-blue-600 text-white" : "border border-blue-200 bg-white text-blue-700"}`}>{isSplitPayment ? "Activo" : "Dividir pago"}</button></div>
                {isSplitPayment && <div className="mt-3 space-y-2">{paymentSplits.map((payment, index) => <div key={index} className="grid grid-cols-[1fr_110px_auto] gap-2"><Select value={payment.method} onChange={(event) => setPaymentSplits((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, method: event.target.value as PaymentSplit["method"] } : item))}><option value="CASH">Efectivo · físico</option><option value="YAPE_PLIN">Yape / Plin · digital</option><option value="BANK_TRANSFER">Transferencia · digital</option><option value="CARD">Tarjeta · digital</option></Select><Input type="number" min="0.01" step="0.01" value={payment.amount} onChange={(event) => setPaymentSplits((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, amount: event.target.value } : item))} placeholder="S/ 0.00" />{paymentSplits.length > 1 && <button type="button" onClick={() => setPaymentSplits((items) => items.filter((_, itemIndex) => itemIndex !== index))} className="text-xs font-semibold text-rose-600">Quitar</button>}</div>)}<div className="flex items-center justify-between pt-1 text-xs"><button type="button" onClick={() => setPaymentSplits((items) => [...items, { method: "YAPE_PLIN", amount: "" }])} className="font-semibold text-blue-700">+ Agregar medio</button><span className={Math.abs(splitTotal - total) < 0.009 ? "font-semibold text-emerald-700" : "font-semibold text-amber-700"}>Asignado {money(splitTotal)} · Falta {money(Math.max(0, total - splitTotal))}</span></div></div>}
              </div>}
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">Ticket de venta</div>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {cart.length ? (
                <div className="space-y-2">
                  {cart.map((line) => {
                    const price =
                      line.quantity >= (line.product.wholesaleMinQuantity ?? 10) && line.product.wholesalePrice
                        ? line.product.wholesalePrice
                        : line.product.salePrice;
                    return (
                      <div key={line.product.id} className="rounded-xl border border-slate-100 p-3">
                        <div className="flex justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {line.product.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {line.product.sku} · {money(price)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setCart((items) =>
                                items.filter((item) => item.product.id !== line.product.id),
                              )
                            }
                            className="text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center rounded-lg border border-slate-200">
                            <button
                              type="button"
                              onClick={() => setQuantity(line.product, line.quantity - 1)}
                              className="p-1.5 text-slate-500"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-8 text-center text-sm font-semibold">
                              {line.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => setQuantity(line.product, line.quantity + 1)}
                              className="p-1.5 text-slate-500"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <strong className="text-sm text-slate-900">
                            {money(line.quantity * price)}
                          </strong>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="grid h-full place-items-center text-center">
                  <div>
                    <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-slate-100 text-slate-400">
                      <ShoppingBasket className="h-9 w-9" />
                    </div>
                    <p className="mt-5 font-semibold text-slate-600">El carrito está vacío</p>
                    <p className="mt-1 max-w-56 text-xs text-slate-500">
                      Agrega productos escaneando o seleccionando desde la lista.
                    </p>
                  </div>
                </div>
              )}
            </div>
            <footer className="border-t border-slate-200 bg-slate-50/70 p-5">
              <div className="flex items-end justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Total a pagar
                </span>
                <span className="text-3xl font-bold tracking-tight text-blue-700">
                  {money(total)}
                </span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onCancel}
                  className="border border-rose-200 text-rose-600 hover:bg-rose-50"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !cart.length}
                  className="gap-2 bg-blue-700 text-white hover:bg-blue-800"
                >
                  <WalletCards className="h-4 w-4" />
                  {isSubmitting ? "Vendiendo..." : "Procesar venta"}
                </Button>
              </div>
            </footer>
          </section>
        </aside>
      </form>
      <Dialog isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Combinar medios de pago" description="Distribuye el total entre efectivo y medios digitales." maxWidth="md">
        <div className="space-y-4"><div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3"><div className="flex justify-between text-sm font-semibold text-slate-700"><span>Total de venta</span><span className="text-blue-700">{money(total)}</span></div><div className={`mt-2 flex justify-between text-xs font-semibold ${Math.abs(splitTotal - total) < 0.009 ? "text-emerald-700" : "text-amber-700"}`}><span>Asignado {money(splitTotal)}</span><span>Falta {money(Math.max(0, total - splitTotal))}</span></div></div><div className="space-y-3">{paymentSplits.map((payment, index) => <div key={index} className="space-y-2"><div className="grid grid-cols-[1fr_120px_auto] gap-2"><Select value={payment.method} onChange={(event) => setPaymentSplits((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, method: event.target.value as PaymentSplit["method"] } : item))}><option value="CASH">Efectivo · físico</option><option value="YAPE_PLIN">Yape / Plin · digital</option><option value="BANK_TRANSFER">Transferencia · digital</option><option value="CARD">Tarjeta · digital</option></Select><Input type="number" min="0.01" step="0.01" value={payment.amount} onChange={(event) => setPaymentSplits((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, amount: event.target.value } : item))} placeholder="S/ 0.00" />{paymentSplits.length > 1 ? <button type="button" onClick={() => setPaymentSplits((items) => items.filter((_, itemIndex) => itemIndex !== index))} className="text-xs font-semibold text-rose-600">Quitar</button> : <span />}</div>{payment.method === "CASH" && <CashTenderInput dueAmount={Number(payment.amount) || 0} received={payment.received ?? ""} onChange={(received) => setPaymentSplits((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, received } : item))} compact />}</div>)}</div><button type="button" onClick={() => setPaymentSplits((items) => [...items, { method: "YAPE_PLIN", amount: "" }])} className="text-sm font-semibold text-blue-700">+ Agregar medio de pago</button><div className="flex justify-end gap-3 border-t border-slate-100 pt-4"><Button type="button" variant="ghost" onClick={() => setIsPaymentModalOpen(false)}>Cancelar</Button><Button type="button" disabled={Math.abs(splitTotal - total) > 0.009 || hasIncompleteCashTender} onClick={() => { setIsSplitPayment(true); setIsPaymentModalOpen(false); }}>Aplicar pago combinado</Button></div></div>
      </Dialog>
      <Dialog isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} title="Confirmar venta" description="Revisa el resumen antes de confirmar el cobro y descontar el stock." maxWidth="md">
        <div className="space-y-4">
          <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5">
            <div className="flex items-center justify-between border-b border-blue-100 pb-3"><span className="text-sm font-semibold text-slate-700">Ticket de venta</span><span className="rounded-full bg-blue-700 px-2.5 py-1 text-xs font-bold text-white">{cart.length} ítems</span></div>
            <div className="max-h-48 space-y-2 overflow-y-auto py-3 text-sm">{cart.map((line) => <div key={line.product.id} className="flex justify-between gap-3"><span className="text-slate-700">{line.quantity} × {line.product.name}</span><strong>{money(line.quantity * (line.quantity >= (line.product.wholesaleMinQuantity ?? 10) && line.product.wholesalePrice ? line.product.wholesalePrice : line.product.salePrice))}</strong></div>)}</div>
            <div className="flex items-center justify-between border-t border-blue-100 pt-3"><span className="font-semibold text-slate-700">Total a cobrar</span><strong className="text-2xl text-blue-700">{money(total)}</strong></div>
          </div>
          <p className="text-sm text-slate-600">Al confirmar, la venta quedará registrada y el stock se actualizará inmediatamente.</p>
          <div className="flex justify-end gap-3"><Button type="button" variant="ghost" onClick={() => setIsConfirmOpen(false)}>Volver</Button><Button type="button" onClick={() => void processSale()} className="gap-2"><WalletCards className="h-4 w-4" /> Confirmar venta</Button></div>
        </div>
      </Dialog>
      <Dialog
        isOpen={Boolean(completedSale)}
        onClose={() => { setCompletedSale(null); onComplete(); }}
        title="Venta confirmada"
        description="La venta fue guardada y el stock se actualizó correctamente."
        maxWidth="md"
      >
        <div className="space-y-5">
          {completedSale && <SaleTicket sale={completedSale} />}
          <p className="text-sm text-slate-600">¿Deseas imprimir el ticket de venta ahora?</p>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => { setCompletedSale(null); onComplete(); }}>No imprimir</Button>
            <Button type="button" className="gap-2" onClick={() => { printSaleTicket(); setCompletedSale(null); onComplete(); }}>
              <Printer className="h-4 w-4" /> Imprimir ticket
            </Button>
          </div>
        </div>
      </Dialog>
      <CustomerFormModal
        isOpen={customerOpen}
        mode="create"
        initialData={null}
        isSubmitting={isCreatingCustomer}
        onClose={() => setCustomerOpen(false)}
        onSubmit={saveCustomer}
        onLookupDocument={onLookupCustomerDocument}
      />
      <ProductDetailModal isOpen={Boolean(detailProduct)} product={detailProduct} onClose={() => setDetailProduct(null)} />
    </>
  );
};
