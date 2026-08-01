import { Building2, Edit3, Eye, MoreVertical, ShieldAlert, Trash2, User } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import type { Customer, CustomerStatus } from "@/features/customers/types/customer.types";

interface CustomerTableProps {
  customers: Customer[];
  onView: (customer: Customer) => void;
  onEdit: (customer: Customer) => void;
  onChangeStatus: (customer: Customer, newStatus: CustomerStatus) => void;
  onDelete: (customer: Customer) => void;
}

export const CustomerTable = ({
  customers,
  onView,
  onEdit,
  onChangeStatus,
  onDelete,
}: CustomerTableProps) => {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const formatPrice = (val: number) =>
    new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(val);

  if (customers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-12 text-center shadow-[0_8px_20px_rgba(37,99,235,.03)]">
        <User className="h-10 w-10 text-slate-300" />
        <h3 className="mt-3 text-sm font-semibold text-slate-900">No se encontraron clientes</h3>
        <p className="mt-1 text-xs text-slate-500">
          Intente ajustando el término de búsqueda o modifique los filtros de estado/tipo.
        </p>
      </div>
    );
  }

  const getCategoryBadgeVariant = (category: string): "default" | "secondary" | "outline" | "success" | "warning" | "destructive" => {
    switch (category) {
      case "VIP":
        return "destructive";
      case "MAYORISTA":
        return "default";
      case "CORPORATIVO":
        return "warning";
      case "MINORISTA":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_8px_20px_rgba(37,99,235,.03)]">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="border-b border-slate-200 bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th scope="col" className="px-6 py-4 font-semibold">
                Código / Cliente
              </th>
              <th scope="col" className="px-6 py-4 font-semibold">
                Documento
              </th>
              <th scope="col" className="px-6 py-4 font-semibold">
                Tipo
              </th>
              <th scope="col" className="px-6 py-4 font-semibold">
                Contacto
              </th>
              <th scope="col" className="px-6 py-4 text-center font-semibold">
                Categoría
              </th>
              <th scope="col" className="px-6 py-4 text-center font-semibold">
                Estado
              </th>
              <th scope="col" className="px-6 py-4 text-center font-semibold">
                Histórico
              </th>
              <th scope="col" className="px-6 py-4 text-right font-semibold">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {customers.map((customer) => {
              const isEmpresa = customer.customerType === "EMPRESA";
              const displayName = isEmpresa
                ? customer.companyName
                : `${customer.firstName || ""} ${customer.lastName || ""}`.trim();
              const subName = isEmpresa ? customer.tradeName : customer.email;
              const phone = isEmpresa ? customer.companyPhone : customer.mobilePhone || customer.phone;

              const isMenuOpen = activeMenuId === customer.id;

              return (
                <tr key={customer.id} className="transition hover:bg-slate-50/80">
                  {/* Código y Nombre */}
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="rounded border border-blue-100 bg-blue-50 px-2 py-1 font-mono text-xs font-bold text-blue-700">
                        {customer.code}
                      </span>
                      <div>
                        <button
                          type="button"
                          onClick={() => onView(customer)}
                          className="font-semibold text-slate-900 hover:text-blue-600 text-left transition"
                        >
                          {displayName}
                        </button>
                        {subName && (
                          <p className="text-xs text-slate-500 truncate max-w-[200px]">{subName}</p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Documento */}
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="font-medium text-slate-800">
                      {customer.documentType}: {customer.documentNumber}
                    </span>
                  </td>

                  {/* Tipo Cliente */}
                  <td className="whitespace-nowrap px-6 py-4">
                    {isEmpresa ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                        <Building2 className="h-3 w-3 text-slate-500" /> Empresa
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                        <User className="h-3 w-3 text-blue-500" /> Pers. Natural
                      </span>
                    )}
                  </td>

                  {/* Contacto */}
                  <td className="whitespace-nowrap px-6 py-4 text-xs text-slate-600">
                    <div>{phone || "Sin teléfono"}</div>
                    <div className="text-slate-400">{customer.email || customer.companyEmail || "-"}</div>
                  </td>

                  {/* Categoría */}
                  <td className="whitespace-nowrap px-6 py-4 text-center">
                    <Badge variant={getCategoryBadgeVariant(customer.category)}>
                      {customer.category}
                    </Badge>
                  </td>

                  {/* Estado */}
                  <td className="whitespace-nowrap px-6 py-4 text-center">
                    {customer.status === "ACTIVO" ? (
                      <Badge variant="success">Activo</Badge>
                    ) : customer.status === "INACTIVO" ? (
                      <Badge variant="secondary">Inactivo</Badge>
                    ) : (
                      <Badge variant="destructive">
                        <ShieldAlert className="mr-1 inline h-3 w-3" /> Bloqueado
                      </Badge>
                    )}
                  </td>

                  {/* Histórico / Operaciones */}
                  <td className="whitespace-nowrap px-6 py-4 text-center text-xs">
                    {customer.hasOperations ? (
                      <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 border border-emerald-100">
                        {customer.summary.totalSalesCount} ops ({formatPrice(customer.summary.totalSpent)})
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-500">
                        Sin operaciones
                      </span>
                    )}
                  </td>

                  {/* Acciones */}
                  <td className="whitespace-nowrap px-6 py-4 text-right relative">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onView(customer)}
                        className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                        title="Ver Ficha e Historial"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onEdit(customer)}
                        className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-amber-50 hover:text-amber-600"
                        title="Editar Cliente"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <div className="relative">
                        <button
                          onClick={() =>
                            setActiveMenuId(isMenuOpen ? null : customer.id)
                          }
                          className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                          title="Más opciones"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>

                        {/* Dropdown Menu */}
                        {isMenuOpen && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setActiveMenuId(null)}
                            />
                            <div className="absolute right-0 top-9 z-20 w-44 rounded-lg border border-slate-200 bg-white p-1 shadow-lg text-left">
                              <div className="px-2 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                Cambiar Estado
                              </div>
                              {customer.status !== "ACTIVO" && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    onChangeStatus(customer, "ACTIVO");
                                  }}
                                  className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-xs text-emerald-700 hover:bg-emerald-50"
                                >
                                  Activar Cliente
                                </button>
                              )}
                              {customer.status !== "INACTIVO" && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    onChangeStatus(customer, "INACTIVO");
                                  }}
                                  className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100"
                                >
                                  Inactivar Cliente
                                </button>
                              )}
                              {customer.status !== "BLOQUEADO" && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    onChangeStatus(customer, "BLOQUEADO");
                                  }}
                                  className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-xs text-rose-700 hover:bg-rose-50"
                                >
                                  Bloquear Cliente
                                </button>
                              )}
                              <div className="my-1 border-t border-slate-100" />
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onDelete(customer);
                                }}
                                className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
                              >
                                <Trash2 className="h-3.5 w-3.5" /> Eliminación
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
