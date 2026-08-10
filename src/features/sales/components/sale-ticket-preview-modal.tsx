import { useState } from "react";
import { Minus, Plus, Printer, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { SaleTicket } from "@/features/sales/components/sale-ticket";
import { printSaleTicket } from "@/features/sales/services/sale-ticket-print.service";
import type { SaleReceipt } from "@/features/sales/types/sale.types";

interface SaleTicketPreviewModalProps {
  sale: SaleReceipt | null;
  isOpen: boolean;
  onClose: () => void;
}

const zoomLevels = [0.8, 1, 1.2] as const;

export const SaleTicketPreviewModal = ({ sale, isOpen, onClose }: SaleTicketPreviewModalProps) => {
  const toast = useToast();
  const [zoomIndex, setZoomIndex] = useState(1);
  const [isPrinting, setIsPrinting] = useState(false);

  if (!sale) return null;

  const ticketId = `sale-ticket-preview-${sale.id}`;
  const zoom = zoomLevels[zoomIndex];
  const print = async () => {
    setIsPrinting(true);
    const printed = await printSaleTicket(sale, ticketId);
    setIsPrinting(false);
    if (!printed) toast.error("No se pudo enviar el ticket a la impresora térmica local.");
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Vista previa · ${sale.number}`}
      description="Revisa el comprobante antes de enviarlo a la impresora térmica."
      maxWidth="2xl"
      headerClassName="relative overflow-hidden border-b-0 bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 px-6 py-5"
      titleClassName="text-white"
      descriptionClassName="text-blue-100"
      headerIcon={<span className="grid h-10 w-10 place-items-center rounded-xl border border-white/20 bg-white/10 text-blue-100"><ReceiptText className="h-5 w-5" /></span>}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3">
          <p className="text-sm text-slate-600">La impresión conserva este mismo formato de ticket.</p>
          <div className="flex items-center gap-1 rounded-lg border border-blue-100 bg-white p-1">
            <button type="button" aria-label="Alejar ticket" disabled={zoomIndex === 0} onClick={() => setZoomIndex((value) => value - 1)} className="grid h-8 w-8 place-items-center rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-40"><Minus className="h-4 w-4" /></button>
            <span className="w-12 text-center text-xs font-semibold text-blue-700">{Math.round(zoom * 100)}%</span>
            <button type="button" aria-label="Acercar ticket" disabled={zoomIndex === zoomLevels.length - 1} onClick={() => setZoomIndex((value) => value + 1)} className="grid h-8 w-8 place-items-center rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-40"><Plus className="h-4 w-4" /></button>
          </div>
        </div>

        <div className="max-h-[52vh] overflow-auto rounded-xl border border-slate-200 bg-slate-100 p-5 sm:p-7">
          <div className="mx-auto w-fit origin-top transition-transform duration-200" style={{ transform: `scale(${zoom})` }}>
            <SaleTicket sale={sale} id={ticketId} />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-5">
          <Button type="button" variant="ghost" onClick={onClose}>Cerrar</Button>
          <Button type="button" disabled={isPrinting} onClick={() => void print()} className="gap-2"><Printer className="h-4 w-4" />{isPrinting ? "Enviando a impresora..." : "Imprimir ticket"}</Button>
        </div>
      </div>
    </Dialog>
  );
};
