import {
  Building2,
  Calendar,
  CreditCard,
  FileText,
  History,
  Mail,
  MapPin,
  Phone,
  ShieldAlert,
  ShoppingBag,
  TrendingUp,
  User,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import type { Customer, CustomerStatus } from "@/features/customers/types/customer.types";

interface CustomerDetailModalProps {
  isOpen: boolean;
  customer: Customer | null;
  onClose: () => void;
  onChangeStatus: (customer: Customer, newStatus: CustomerStatus) => void;
  onEdit: (customer: Customer) => void;
}

export const CustomerDetailModal = ({
  isOpen,
  customer,
  onClose,
  onChangeStatus,
  onEdit,
}: CustomerDetailModalProps) => {
  const [activeTab, setActiveTab] = useState<"generales" | "resumen" | "historial">("generales");

  if (!customer) return null;

  const isEmpresa = customer.customerType === "EMPRESA";
  const displayName = isEmpresa
    ? customer.companyName
    : `${customer.firstName || ""} ${customer.lastName || ""}`.trim();

  const formatPrice = (val: number) =>
    new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(val);

  const formatDate = (isoStr?: string) =>
    isoStr ? new Date(isoStr).toLocaleDateString("es-PE", { dateStyle: "medium" }) : "-";

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Ficha del Cliente: ${customer.code}`}
      description="Perfil completo, resumen comercial e historial consolidado de operaciones."
      maxWidth="4xl"
    >
      <div className="space-y-6">
        {/* Header Ficha */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-blue-600 text-white font-mono text-sm font-bold shadow-sm">
              {isEmpresa ? <Building2 className="h-6 w-6" /> : <User className="h-6 w-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-slate-900">{displayName}</h3>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                  {customer.code}
                </span>
                {customer.status === "ACTIVO" ? (
                  <Badge variant="success">Activo</Badge>
                ) : customer.status === "INACTIVO" ? (
                  <Badge variant="secondary">Inactivo</Badge>
                ) : (
                  <Badge variant="destructive">
                    <ShieldAlert className="mr-1 inline h-3 w-3" /> Bloqueado
                  </Badge>
                )}
                <Badge variant="outline">{customer.category}</Badge>
              </div>
              <p className="mt-1 text-xs text-slate-600">
                {customer.documentType}: <span className="font-mono font-medium">{customer.documentNumber}</span>
                {customer.tradeName ? ` • (${customer.tradeName})` : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <Button
              onClick={() => onEdit(customer)}
              className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs h-8 px-3"
            >
              Editar Ficha
            </Button>
            {customer.status === "ACTIVO" ? (
              <Button
                variant="ghost"
                onClick={() => onChangeStatus(customer, "INACTIVO")}
                className="text-slate-600 hover:text-slate-900 text-xs h-8 px-3"
              >
                Inactivar
              </Button>
            ) : (
              <Button
                variant="ghost"
                onClick={() => onChangeStatus(customer, "ACTIVO")}
                className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 text-xs h-8 px-3"
              >
                Activar
              </Button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 text-sm font-medium text-slate-600">
          <button
            onClick={() => setActiveTab("generales")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 transition ${
              activeTab === "generales"
                ? "border-blue-600 font-semibold text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <FileText className="h-4 w-4" /> Datos Generales
          </button>
          <button
            onClick={() => setActiveTab("resumen")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 transition ${
              activeTab === "resumen"
                ? "border-blue-600 font-semibold text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <TrendingUp className="h-4 w-4" /> Resumen Comercial
          </button>
          <button
            onClick={() => setActiveTab("historial")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 transition ${
              activeTab === "historial"
                ? "border-blue-600 font-semibold text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <History className="h-4 w-4" /> Historial de Operaciones ({customer.operationsHistory.length})
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "generales" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Bloque Identificación y Tipo */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Identificación
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block">Tipo Cliente:</span>
                    <span className="font-semibold text-slate-900">
                      {isEmpresa ? "Empresa / Personas Jurídica" : "Persona Natural"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Documento:</span>
                    <span className="font-semibold text-slate-900">
                      {customer.documentType} - {customer.documentNumber}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Código Interno:</span>
                    <span className="font-mono font-bold text-blue-700">{customer.code}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Clasificación:</span>
                    <span className="font-semibold text-purple-700">{customer.category}</span>
                  </div>
                </div>
              </div>

              {/* Bloque Contacto */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Información de Contacto
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <span>
                      {customer.mobilePhone || customer.companyPhone || customer.phone || "Sin teléfono registrado"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <span>{customer.email || customer.companyEmail || "Sin correo electrónico"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    <span>
                      {customer.address || "Sin dirección fiscal registrada"}
                      {customer.ubigeo ? ` (Ubigeo: ${customer.ubigeo})` : ""}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Datos específicos */}
            {isEmpresa ? (
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Detalles Legales de la Empresa
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block">Razón Social:</span>
                    <span className="font-semibold text-slate-900">{customer.companyName || "-"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Nombre Comercial:</span>
                    <span className="font-semibold text-slate-900">{customer.tradeName || "-"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Representante Legal:</span>
                    <span className="font-semibold text-slate-900">
                      {customer.legalRepresentative || "-"} ({customer.representativeRole || "Representante"})
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Datos Personales
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block">Nombres Completos:</span>
                    <span className="font-semibold text-slate-900">
                      {customer.firstName} {customer.lastName}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Fecha Nacimiento:</span>
                    <span className="font-semibold text-slate-900">{formatDate(customer.birthDate)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Sexo:</span>
                    <span className="font-semibold text-slate-900">
                      {customer.gender === "M" ? "Masculino" : customer.gender === "F" ? "Femenino" : "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Estado Civil:</span>
                    <span className="font-semibold text-slate-900">{customer.civilStatus || "-"}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Observaciones y Registro */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 text-xs">
              <span className="text-slate-500 font-semibold block">Notas & Observaciones:</span>
              <p className="text-slate-700 italic">
                {customer.notes || "Sin observaciones adicionales registradas en la ficha."}
              </p>
              <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Registrado el: {formatDate(customer.createdAt)}</span>
                <span>Última modificación: {formatDate(customer.updatedAt)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Resumen Comercial */}
        {activeTab === "resumen" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="rounded-xl border border-slate-200 bg-emerald-50/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-800 uppercase">
                    Total Compras Acumuladas
                  </span>
                  <ShoppingBag className="h-5 w-5 text-emerald-600" />
                </div>
                <p className="mt-2 text-2xl font-bold text-emerald-900">
                  {formatPrice(customer.summary.totalSpent)}
                </p>
                <p className="mt-1 text-xs text-emerald-700">
                  {customer.summary.totalSalesCount} comprobante(s) emitido(s)
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-amber-50/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-800 uppercase">
                    Saldo Pendiente
                  </span>
                  <CreditCard className="h-5 w-5 text-amber-600" />
                </div>
                <p className="mt-2 text-2xl font-bold text-amber-900">
                  {formatPrice(customer.summary.pendingBalance)}
                </p>
                <p className="mt-1 text-xs text-amber-700">Cuentas por cobrar en cartera</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-blue-50/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-blue-800 uppercase">
                    Ticket Promedio
                  </span>
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <p className="mt-2 text-2xl font-bold text-blue-900">
                  {formatPrice(customer.summary.averageTicket)}
                </p>
                <p className="mt-1 text-xs text-blue-700">Promedio de gasto por venta</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 flex items-center justify-between text-xs text-slate-700">
              <span className="flex items-center gap-2 font-medium">
                <Calendar className="h-4 w-4 text-blue-600" /> Fecha de Última Compra Registrada:
              </span>
              <span className="font-bold text-slate-900">
                {formatDate(customer.summary.lastPurchaseDate)}
              </span>
            </div>
          </div>
        )}

        {/* Tab 3: Historial de Operaciones */}
        {activeTab === "historial" && (
          <div>
            {customer.operationsHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
                <History className="h-8 w-8 text-slate-300" />
                <p className="mt-2 text-xs font-semibold text-slate-700">
                  Sin operaciones comerciales registradas
                </p>
                <p className="text-[11px] text-slate-500">
                  Este cliente no registra ventas, cobros ni documentos en el sistema ERP.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="border-b border-slate-200 bg-slate-50 font-semibold uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Fecha</th>
                      <th className="px-4 py-3">Tipo Operación</th>
                      <th className="px-4 py-3">N° Comprobante</th>
                      <th className="px-4 py-3">Descripción</th>
                      <th className="px-4 py-3 text-right">Monto (S/)</th>
                      <th className="px-4 py-3 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customer.operationsHistory.map((op) => (
                      <tr key={op.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-4 py-3 text-slate-500">{formatDate(op.date)}</td>
                        <td className="px-4 py-3 font-semibold text-slate-800">{op.type}</td>
                        <td className="px-4 py-3 font-mono font-medium text-blue-700">
                          {op.documentNumber}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{op.description}</td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900">
                          {formatPrice(op.amount)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {op.status === "COMPLETADO" ? (
                            <Badge variant="success">Completado</Badge>
                          ) : op.status === "PENDIENTE" ? (
                            <Badge variant="warning">Pendiente</Badge>
                          ) : (
                            <Badge variant="destructive">Anulado</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <Button variant="ghost" onClick={onClose}>
            Cerrar Ficha
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
