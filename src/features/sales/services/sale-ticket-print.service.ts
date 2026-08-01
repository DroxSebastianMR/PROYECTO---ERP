const printDocumentStyles = `
  @page { size: 80mm auto; margin: 0; }
  * { box-sizing: border-box; }
  html, body { width: 80mm; margin: 0; padding: 0; background: #fff; }
  body { color: #020617; font-family: "Courier New", monospace; }
  #printable-sale-ticket { width: 80mm; min-height: 0; margin: 0; padding: 3mm 4mm; }
  img { display: block; max-width: 190px; }
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
