import { receiptBranding } from "@/features/sales/config/receipt-branding";
import type { SalePaymentMethod, SaleReceipt } from "@/features/sales/types/sale.types";
import nortivaLogo from "@/assets/img/logo.png";

interface SaleTicketProps {
  sale: SaleReceipt;
  id?: string;
}

const money = (value: number) =>
  new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(value);

const paymentLabels: Record<SalePaymentMethod, string> = {
  CASH: "EFECTIVO",
  BANK_TRANSFER: "TRANSFERENCIA",
  CARD: "TARJETA",
  YAPE_PLIN: "YAPE / PLIN",
  CREDIT: "CRÉDITO",
};

const ticketNumber = (number: string) => {
  const sequence = number.replace(/\D/g, "").padStart(8, "0");
  return `${receiptBranding.ticketSeries}-${sequence}`;
};

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("es-PE", { dateStyle: "short" }).format(new Date(date));

const formatTime = (date: string) =>
  new Intl.DateTimeFormat("es-PE", { hour: "2-digit", minute: "2-digit", hour12: false }).format(
    new Date(date),
  );

export const SaleTicket = ({ sale, id = "printable-sale-ticket" }: SaleTicketProps) => {
  const discount = sale.items.reduce((total, item) => total + item.discount * item.quantity, 0);
  const customerName = sale.customerName === "Cliente contado" ? "PÚBLICO GENERAL" : sale.customerName;
  const customerDocument = sale.customerDocument || "SIN DOCUMENTO";

  return (
    <article
      id={id}
      className="mx-auto w-[80mm] bg-white px-4 py-5 font-mono text-[11px] leading-[1.35] text-slate-950"
    >
      <header className="ticket-header text-center">
        <img
          src={nortivaLogo}
          alt="Logo Nortiva"
          className="mx-auto mb-2 h-20 w-auto max-w-[190px] object-contain"
        />
        <p className="font-bold tracking-wide">{receiptBranding.businessName}</p>
        <p className="font-semibold">{receiptBranding.businessLine}</p>
        <p className="mt-2">RUC: {receiptBranding.taxId}</p>
        <p>{receiptBranding.address}</p>
        <p>Tel.: {receiptBranding.phone}</p>
        <p>{receiptBranding.email}</p>
      </header>

      <Separator />
      <p className="text-center font-bold">TICKET: {ticketNumber(sale.number)}</p>
      <div className="ticket-meta mt-1 flex justify-between gap-2">
        <span>FECHA: {formatDate(sale.createdAt)}</span>
        <span>HORA: {formatTime(sale.createdAt)}</span>
      </div>
      <div className="ticket-meta flex justify-between gap-2">
        <span>VENDEDOR: {sale.createdBy?.toUpperCase() || "ADMIN"}</span>
        <span>CAJA: {receiptBranding.cashier}</span>
      </div>

      <Separator />
      <p>CLIENTE: {customerName.toUpperCase()}</p>
      <p>DOCUMENTO: {customerDocument}</p>

      <Separator />
      <div className="ticket-item-row ticket-item-heading grid grid-cols-[28px_minmax(0,1fr)_48px_54px] gap-1 font-bold">
        <span>CANT.</span><span>DESCRIPCIÓN</span><span className="text-right">P/U</span><span className="text-right">TOTAL</span>
      </div>
      <Separator />
      <div className="space-y-1.5">
        {sale.items.map((item) => (
          <div key={item.id} className="ticket-item-row grid grid-cols-[28px_minmax(0,1fr)_48px_54px] gap-1">
            <span>{item.quantity}</span>
            <span className="break-words">{item.productName}</span>
            <span className="text-right">{item.unitPrice.toFixed(2)}</span>
            <span className="text-right">{item.subtotal.toFixed(2)}</span>
          </div>
        ))}
      </div>

      <Separator />
      <TotalsRow label="SUBTOTAL:" value={money(sale.subtotalAmount)} />
      <TotalsRow label="DESCUENTO:" value={money(discount)} />
      {sale.igvAmount > 0 && <TotalsRow label="IGV (18%):" value={money(sale.igvAmount)} />}
      <TotalsRow label="TOTAL:" value={money(sale.total)} emphasized />

      <Separator />
      <p>MÉTODO DE PAGO: {paymentLabels[sale.paymentMethod]}</p>
      {sale.paymentMethod === "CASH" && (
        <>
          <TotalsRow label="RECIBIDO:" value={money(sale.total)} />
          <TotalsRow label="CAMBIO:" value={money(0)} />
        </>
      )}

      <Separator />
      <footer className="pt-1 text-center font-semibold">
        {receiptBranding.footer.map((line) => <p key={line}>{line}</p>)}
        <p className="mt-3 font-normal">Gracias por su compra</p>
      </footer>
    </article>
  );
};

const Separator = () => <div className="ticket-separator my-2 border-t border-dashed border-slate-700" />;

const TotalsRow = ({ label, value, emphasized = false }: { label: string; value: string; emphasized?: boolean }) => (
  <p className={`ticket-total-row flex justify-between ${emphasized ? "mt-1 text-sm font-bold" : ""}`}>
    <span>{label}</span><span>{value}</span>
  </p>
);
