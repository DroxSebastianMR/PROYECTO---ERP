import { useCallback, useMemo, useRef, useState, type FormEvent } from "react";
import {
  Barcode,
  Minus,
  Plus,
  ScanBarcode,
  Search,
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
import type { Product } from "@/features/products/types/product.types";
import type {
  CreateSaleInput,
  CustomerOption,
  SaleDocumentType,
  SalePaymentMethod,
  WarehouseOption,
  SaleReceipt,
} from "@/features/sales/types/sale.types";

type CartLine = { product: Product; quantity: number };
interface NewSaleFormProps {
  onCancel: () => void;
  onSubmit: (data: CreateSaleInput) => Promise<SaleReceipt>;
  onComplete: () => void;
  onCreateCustomer: (data: {
    name: string;
    document?: string;
    phone?: string;
    email?: string;
  }) => Promise<CustomerOption>;
  isSubmitting: boolean;
  products: Product[];
  customers: CustomerOption[];
  warehouses: WarehouseOption[];
}
const money = (value: number) =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(value);

export const NewSaleForm = ({
  onCancel,
  onSubmit,
  onComplete,
  onCreateCustomer,
  isSubmitting,
  products,
  customers,
  warehouses,
}: NewSaleFormProps) => {
  const scannerRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<SalePaymentMethod>("CASH");
  const documentType: SaleDocumentType = "RECEIPT";
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState<SaleReceipt | null>(null);
  const [newCustomer, setNewCustomer] = useState({ name: "", document: "", phone: "", email: "" });
  const activeWarehouseId = warehouseId || warehouses[0]?.id || "";
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
  const handleScanner = () => {
    const code = query.trim().toLowerCase();
    const product = products.find(
      (entry) =>
        entry.isActive && [entry.barcode, entry.sku].some((value) => value?.toLowerCase() === code),
    );
    if (product) addProduct(product);
    else if (code) alert("No se encontró un producto activo con ese código.");
  };
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
  const saveCustomer = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const customer = await onCreateCustomer(newCustomer);
      setCustomerId(customer.id);
      setCustomerOpen(false);
      setNewCustomer({ name: "", document: "", phone: "", email: "" });
    } catch (error) {
      alert(error instanceof Error ? error.message : "No se pudo registrar el cliente.");
    }
  };
  const sell = async (event: FormEvent) => {
    event.preventDefault();
    if (!activeWarehouseId || !cart.length) {
      alert("Agrega productos disponibles para procesar la venta.");
      return;
    }
    if (paymentMethod === "CREDIT" && !customerId) {
      alert("Selecciona un cliente para registrar una venta a crédito.");
      return;
    }
    try {
      const sale = await onSubmit({
        customerId: customerId || undefined,
        warehouseId: activeWarehouseId,
        paymentMethod,
        documentType,
        items: cart.map((line) => ({
          productId: line.product.id,
          quantity: line.quantity,
          unitPrice:
            line.quantity >= (line.product.wholesaleMinQuantity ?? 10) && line.product.wholesalePrice
              ? line.product.wholesalePrice
              : line.product.salePrice,
        })),
      });
      setCart([]);
      setCompletedSale(sale);
    } catch (error) {
      alert(error instanceof Error ? error.message : "No se pudo procesar la venta.");
    }
  };

  return (
    <>
      {isSubmitting && (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/25 backdrop-blur-[1px]">
          <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-white px-6 py-5 shadow-2xl">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
            <div><p className="font-semibold text-slate-900">Confirmando venta</p><p className="text-xs text-slate-500">Guardando y descontando existencias…</p></div>
          </div>
        </div>
      )}
      <form onSubmit={sell} className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
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
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar por nombre..."
                  className="pl-9"
                />
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
                  Activar lector
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
                      <span className="font-mono text-[11px] font-bold text-slate-400">
                        {product.sku}
                      </span>
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
                        <p className="mt-1 text-xs text-slate-500">{product.brand} · {product.presentation ?? product.unit}</p>
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
                      <button
                        type="button"
                        onClick={() => addProduct(product)}
                        disabled={stock <= 0}
                        className="grid h-10 w-10 place-items-center rounded-full bg-blue-50 text-blue-700 transition hover:bg-blue-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </main>
        <aside className="xl:sticky xl:top-[76px] xl:h-[calc(100vh-92px)] xl:self-start">
          <section className="flex h-full min-h-[620px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
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
                <Select value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
                  <option value="">Cliente genérico (público general)</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setCustomerOpen(true)}
                  className="shrink-0 border border-blue-100 px-3 text-blue-700"
                >
                  <UserRound className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Select
                  value={activeWarehouseId}
                  onChange={(event) => setWarehouseId(event.target.value)}
                >
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </option>
                  ))}
                </Select>
                <Select
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value as SalePaymentMethod)}
                >
                  <option value="CASH">Efectivo</option>
                  <option value="CARD">Tarjeta</option>
                  <option value="BANK_TRANSFER">Transferencia</option>
                  <option value="YAPE_PLIN">Yape / Plin</option>
                  <option value="CREDIT">Crédito</option>
                </Select>
              </div>
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
      <Dialog
        isOpen={Boolean(completedSale)}
        onClose={() => { setCompletedSale(null); onComplete(); }}
        title="Venta confirmada"
        description="La venta fue guardada y el stock se actualizó correctamente."
        maxWidth="md"
      >
        <div className="space-y-5">
          <div id="pos-ticket" className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-sm">
            <p className="font-bold text-blue-800">Ticket {completedSale?.number}</p>
            <p className="mt-1 text-slate-600">Total cobrado: <strong>{completedSale ? money(completedSale.total) : ""}</strong></p>
          </div>
          <p className="text-sm text-slate-600">¿Deseas imprimir el ticket de venta ahora?</p>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => { setCompletedSale(null); onComplete(); }}>No imprimir</Button>
            <Button type="button" className="gap-2" onClick={() => { window.print(); setCompletedSale(null); onComplete(); }}>
              <Printer className="h-4 w-4" /> Imprimir ticket
            </Button>
          </div>
        </div>
      </Dialog>
      <Dialog
        isOpen={customerOpen}
        onClose={() => setCustomerOpen(false)}
        title="Nuevo cliente"
        description="Se agregará al carrito sin perder la venta actual."
        maxWidth="md"
      >
        <form onSubmit={saveCustomer} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold text-slate-600">
              DNI / RUC
              <Input
                required
                value={newCustomer.document}
                onChange={(event) =>
                  setNewCustomer((current) => ({ ...current, document: event.target.value }))
                }
                className="mt-1"
              />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Nombre o razón social
              <Input
                required
                value={newCustomer.name}
                onChange={(event) =>
                  setNewCustomer((current) => ({ ...current, name: event.target.value }))
                }
                className="mt-1"
              />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Celular
              <Input
                value={newCustomer.phone}
                onChange={(event) =>
                  setNewCustomer((current) => ({ ...current, phone: event.target.value }))
                }
                className="mt-1"
              />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Correo
              <Input
                type="email"
                value={newCustomer.email}
                onChange={(event) =>
                  setNewCustomer((current) => ({ ...current, email: event.target.value }))
                }
                className="mt-1"
              />
            </label>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setCustomerOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Registrar cliente</Button>
          </div>
        </form>
      </Dialog>
    </>
  );
};
