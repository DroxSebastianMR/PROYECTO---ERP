import { CheckCircle, Printer, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { SaleSummaryCard } from "@/features/sales/components/sale-summary-card";
import { SaleTicket } from "@/features/sales/components/sale-ticket";
import { printSaleTicket } from "@/features/sales/services/sale-ticket-print.service";
import type { SaleReceipt } from "@/features/sales/types/sale.types";

interface SaleDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: SaleReceipt | null;
  onConfirm: (id: string) => Promise<unknown>;
  isSubmitting: boolean;
}

export const SaleDetailModal = ({ isOpen, onClose, sale, onConfirm, isSubmitting }: SaleDetailModalProps) => {
  if (!sale) return null;

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={`Resumen de venta ${sale.number}`} description="Detalle comercial de la venta registrada." maxWidth="xl" headerClassName="relative overflow-hidden border-b-0 bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 px-6 py-5" titleClassName="text-white" descriptionClassName="text-blue-100" headerIcon={<span className="grid h-10 w-10 place-items-center rounded-xl border border-white/20 bg-white/10 text-blue-100"><ReceiptText className="h-5 w-5" /></span>}>
      <div className="space-y-6">
        <SaleSummaryCard sale={sale} />
        <div className="hidden"><SaleTicket sale={sale} /></div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
          <Button onClick={() => printSaleTicket()} variant="ghost" className="gap-2 border border-slate-200 text-slate-700"><Printer className="h-4 w-4" /> Imprimir ticket</Button>
          <div className="flex gap-2">
            {sale.status === "DRAFT" && <Button onClick={() => void onConfirm(sale.id)} disabled={isSubmitting} className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700"><CheckCircle className="h-4 w-4" /> Vender y cobrar</Button>}
            <Button onClick={onClose}>Cerrar</Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
};
