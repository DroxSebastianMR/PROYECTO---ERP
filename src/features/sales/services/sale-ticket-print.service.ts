const printDocumentStyles = `
  @page { size: 80mm auto; margin: 0; }
  * { box-sizing: border-box; }
  html, body { width: 80mm; margin: 0; padding: 0; background: #fff; }
  body { color: #020617; font-family: "Courier New", monospace; }
  #printable-sale-ticket { width: 80mm; min-height: 0; margin: 0; padding: 3mm 4mm; font-size: 11px; line-height: 1.35; }
  #printable-sale-ticket p { margin: 0; }
  #printable-sale-ticket .ticket-header { text-align: center; }
  #printable-sale-ticket .ticket-header img { display: block; width: auto; height: 20mm; max-width: 56mm; margin: 0 auto 2mm; object-fit: contain; }
  #printable-sale-ticket .ticket-separator { margin: 2.5mm 0; border: 0; border-top: 1px dashed #334155; }
  #printable-sale-ticket .ticket-meta,
  #printable-sale-ticket .ticket-total-row { display: flex; justify-content: space-between; gap: 2mm; }
  #printable-sale-ticket .ticket-item-row { display: grid; grid-template-columns: 8mm minmax(0, 1fr) 13mm 15mm; gap: 1mm; align-items: start; }
  #printable-sale-ticket .ticket-item-row span:nth-child(3),
  #printable-sale-ticket .ticket-item-row span:nth-child(4) { text-align: right; }
  #printable-sale-ticket .ticket-item-heading { font-weight: 700; }
  #printable-sale-ticket .ticket-item-row + .ticket-item-row { margin-top: 1.5mm; }
  #printable-sale-ticket footer { padding-top: 1mm; text-align: center; font-weight: 700; }
`;

export const printSaleTicket = (ticketId = "printable-sale-ticket") => {
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
