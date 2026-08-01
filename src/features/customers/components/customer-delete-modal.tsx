import { AlertTriangle, ShieldAlert, Trash2, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import type { Customer, CustomerStatus } from "@/features/customers/types/customer.types";

interface CustomerDeleteModalProps {
  isOpen: boolean;
  customer: Customer | null;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirmDelete: (customer: Customer) => Promise<void>;
  onChangeStatus: (customer: Customer, newStatus: CustomerStatus) => void;
}

export const CustomerDeleteModal = ({
  isOpen,
  customer,
  isSubmitting,
  onClose,
  onConfirmDelete,
  onChangeStatus,
}: CustomerDeleteModalProps) => {
  if (!customer) return null;

  const isEmpresa = customer.customerType === "EMPRESA";
  const displayName = isEmpresa
    ? customer.companyName
    : `${customer.firstName || ""} ${customer.lastName || ""}`.trim();

  const hasOps =
    customer.hasOperations ||
    (customer.operationsHistory && customer.operationsHistory.length > 0);

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={hasOps ? "Eliminación No Permitida (Trazabilidad)" : "Confirmar Eliminación Definitiva"}
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Info resumen cliente */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 flex items-center justify-between text-xs">
          <div>
            <span className="font-mono font-bold text-blue-700 mr-2">{customer.code}</span>
            <span className="font-semibold text-slate-900">{displayName}</span>
          </div>
          <span className="text-slate-500 font-mono">
            {customer.documentType}: {customer.documentNumber}
          </span>
        </div>

        {hasOps ? (
          /* ESCENARIO 1: TIENE OPERACIONES REGISTRADAS -> PROHIBIDA ELIMINACIÓN FÍSICA */
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
            <div className="flex items-start gap-3 text-amber-900">
              <ShieldAlert className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold">Eliminación Física Deshabilitada</h4>
                <p className="mt-1 text-xs text-amber-800 leading-relaxed">
                  Este cliente posee operaciones registradas en el sistema (ventas, pagos o documentos). Por normatividad de trazabilidad fiscal y auditoría, <strong>no puede ser eliminado físicamente</strong>.
                </p>
              </div>
            </div>
            <div className="rounded-lg bg-white/80 p-3 text-xs text-slate-700 border border-amber-200/60">
              <p className="font-semibold text-slate-900 mb-1">Acción recomendada:</p>
              <p>
                Puede cambiar el estado del cliente a <strong>INACTIVO</strong> para evitar que sea seleccionado en nuevas ventas sin perder la trazabilidad de sus operaciones anteriores.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={() => {
                  onChangeStatus(customer, "INACTIVO");
                  onClose();
                }}
                className="bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs"
              >
                <UserX className="mr-1.5 h-4 w-4" />
                Cambiar Estado a Inactivo
              </Button>
            </div>
          </div>
        ) : (
          /* ESCENARIO 2: SIN OPERACIONES REGISTRADAS -> PERMITE ELIMINACIÓN PERMANENTE */
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 space-y-3">
            <div className="flex items-start gap-3 text-rose-900">
              <AlertTriangle className="h-6 w-6 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold">¿Desea eliminar definitivamente este cliente?</h4>
                <p className="mt-1 text-xs text-rose-800 leading-relaxed">
                  Este cliente <strong>nunca registró operaciones</strong> en el sistema. Se removerá permanentemente de la base de datos. Esta acción no se puede deshacer.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-rose-200/60">
              <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={isSubmitting}
                onClick={() => onConfirmDelete(customer)}
                className="bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs"
              >
                <Trash2 className="mr-1.5 h-4 w-4" />
                {isSubmitting ? "Eliminando..." : "Eliminar Definitivamente"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
};
