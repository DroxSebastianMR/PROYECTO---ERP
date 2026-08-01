import { CheckCircle, Printer } from "lucide-react";
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
    <Dialog isOpen={isOpen} onClose={onClose} title={`Resumen de venta ${sale.number}`} description="Detalle comercial de la venta registrada." maxWidth="xl">
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
