import { toPng } from "html-to-image";
import type { SaleReceipt } from "@/features/sales/types/sale.types";

const printDocumentStyles = `
  @page { size: 80mm auto; margin: 0; }
  * { box-sizing: border-box; }
  html, body { width: 80mm; margin: 0; padding: 0; background: #fff; }
  body { color: #020617; font-family: "Courier New", monospace; }
  .thermal-sale-ticket { width: 80mm; min-height: 0; margin: 0; padding: 3mm 4mm; font-size: 11px; line-height: 1.35; }
  .thermal-sale-ticket p { margin: 0; }
  .thermal-sale-ticket .ticket-header { text-align: center; }
  .thermal-sale-ticket .ticket-header img { display: block; width: auto; height: 20mm; max-width: 56mm; margin: 0 auto 2mm; object-fit: contain; }
  .thermal-sale-ticket .ticket-separator { margin: 2.5mm 0; border: 0; border-top: 1px dashed #334155; }
  .thermal-sale-ticket .ticket-meta,
  .thermal-sale-ticket .ticket-total-row { display: flex; justify-content: space-between; gap: 2mm; }
  .thermal-sale-ticket .ticket-item-row { display: grid; grid-template-columns: 8mm minmax(0, 1fr) 13mm 15mm; gap: 1mm; align-items: start; }
  .thermal-sale-ticket .ticket-item-row span:nth-child(3),
  .thermal-sale-ticket .ticket-item-row span:nth-child(4) { text-align: right; }
  .thermal-sale-ticket .ticket-item-heading { font-weight: 700; }
  .thermal-sale-ticket .ticket-item-row + .ticket-item-row { margin-top: 1.5mm; }
  .thermal-sale-ticket footer { padding-top: 1mm; text-align: center; font-weight: 700; }
`;

const bridgeUrl = import.meta.env.VITE_POS_DRAWER_BRIDGE_URL?.trim();
const usePosBridge = import.meta.env.VITE_POS_DRAWER_ENABLED === "true" && Boolean(bridgeUrl);

const captureTicket = async (ticketId: string) => {
  const ticket = document.getElementById(ticketId);
  if (!ticket) return undefined;

  // Sales history keeps its tickets inside a hidden container. The clone is
  // temporarily placed off-screen so the POS bridge receives that same layout.
  const printableTicket = ticket.cloneNode(true) as HTMLElement;
  printableTicket.removeAttribute("id");
  printableTicket.style.cssText = [
    "position:fixed",
    "left:0",
    "top:0",
    "z-index:-1",
    "pointer-events:none",
  ].join(";");
  document.body.appendChild(printableTicket);

  try {
    return await toPng(printableTicket, {
      backgroundColor: "#ffffff",
      cacheBust: true,
      pixelRatio: 3,
    });
  } finally {
    printableTicket.remove();
  }
};

const printBrowserTicket = (ticketId: string) => {
  const ticket = document.getElementById(ticketId);
  if (!ticket) return false;

  const printWindow = window.open("", "_blank", "popup=yes,width=420,height=720");
  if (!printWindow) return false;
  const applicationStyles = Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'))
    .map((link) => `<link rel="stylesheet" href="${link.href}" />`)
    .join("");

  printWindow.document.open();
  printWindow.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8" /><title>Ticket de venta</title>${applicationStyles}<style>${printDocumentStyles}</style></head><body>${ticket.outerHTML}</body></html>`);
  printWindow.document.close();

  const triggerPrint = () => {
    printWindow.focus();
    printWindow.print();
  };
  const logo = printWindow.document.querySelector("img");
  if (logo && !logo.complete) {
    logo.addEventListener("load", triggerPrint, { once: true });
    logo.addEventListener("error", triggerPrint, { once: true });
    window.setTimeout(triggerPrint, 1200);
  } else {
    window.setTimeout(triggerPrint, 100);
  }
  printWindow.addEventListener("afterprint", () => printWindow.close(), { once: true });
  return true;
};

/**
 * Thermal printing goes through the local POS bridge whenever it is enabled.
 * The browser driver may have its own drawer kick configured, so it is not used
 * on the cashier PC; this keeps digital payments from opening the drawer.
 */
export const printSaleTicket = async (sale: SaleReceipt, ticketId = "printable-sale-ticket") => {
  if (!usePosBridge || !bridgeUrl) return printBrowserTicket(ticketId);

  try {
    const ticketImage = await captureTicket(ticketId);
    const response = await fetch(bridgeUrl.replace(/\/cash-drawer\/open$/, "/receipts/print"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...sale, ticketImage }),
    });
    return response.ok;
  } catch {
    return false;
  }
};
