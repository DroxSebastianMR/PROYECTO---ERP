import { useState } from "react";
import { ChevronLeft, ChevronRight, RefreshCw, Tag, Search, Plus, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PATHS } from "@/app/router/constants/paths";
import { useSales } from "@/features/sales/hooks/use-sales";
import { SaleMetrics } from "@/features/sales/components/sale-metrics";
import { SaleTable } from "@/features/sales/components/sale-table";
import { SaleDetailModal } from "@/features/sales/components/sale-detail-modal";
import { SaleTicketPreviewModal } from "@/features/sales/components/sale-ticket-preview-modal";
import { SaleTicket } from "@/features/sales/components/sale-ticket";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { SaleReceipt, SaleStatus } from "@/features/sales/types/sale.types";

export const SalesPage = () => {
  const navigate = useNavigate();
  const [ticketPreviewSale, setTicketPreviewSale] = useState<SaleReceipt | null>(null);
  const {
    sales,
    isLoading,
    isRefreshing,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    metrics,
    pagination,
    // Modals
    isDetailOpen,
    setIsDetailOpen,
    selectedSale,
    isSubmitting,
    // Actions
    refresh,
    handleOpenDetailModal,
    handleConfirmSale,
  } = useSales();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1480px] p-4 sm:p-6 lg:p-7">
        <div className="flex h-64 items-center justify-center text-sm text-slate-500">
          <RefreshCw className="mr-2 h-4 w-4 animate-spin text-blue-600" />
          Cargando módulo de ventas...
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1480px] p-4 sm:p-6 lg:p-7">
      {/* Header */}
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-[-.045em] text-slate-900 sm:gap-3 sm:text-[30px]">
            <Tag className="h-8 w-8 text-blue-600" />
            Ventas
          </h1>
          <p className="mt-1 text-[15px] text-slate-600">
            Punto de venta, emisión de comprobantes y cobranzas ERP.
          </p>
        </div>
      </header>

      {/* Metrics */}
      <section className="mt-6">
        <SaleMetrics metrics={metrics} />
      </section>

      {/* Filter and Actions Bar */}
      <section className="mt-6 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-[0_8px_20px_rgba(37,99,235,.03)] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Buscar por comprobante, cliente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="w-full sm:w-48">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "ALL" | SaleStatus)}
            >
              <option value="ALL">Todos los Estados</option>
              <option value="PAID">Pagado</option>
              <option value="CONFIRMED">Pendiente</option>
              <option value="CANCELLED">Anulado</option>
            </Select>
          </div>

          {(searchQuery || statusFilter !== "ALL") && (
            <Button
              variant="ghost"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("ALL");
              }}
              className="h-10 px-3 text-slate-600 hover:text-slate-900"
            >
              <RotateCcw className="mr-1 h-4 w-4" /> Limpiar
            </Button>
          )}
        </div>

        <Button
          onClick={() => navigate(PATHS.APP.NEW_SALE)}
          className="gap-2 bg-emerald-600 font-medium text-white shadow-sm hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          Nueva Venta (POS)
        </Button>
      </section>

      {/* Sales Data Table */}
      <section className="mt-6">
        <SaleTable
          sales={sales}
          onView={handleOpenDetailModal}
          onPrint={setTicketPreviewSale}
        />
        <div className="hidden" aria-hidden="true">
          {sales.map((sale) => <SaleTicket key={sale.id} sale={sale} id={`sale-ticket-${sale.id}`} />)}
        </div>
        <div className="mt-4 flex flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between"><span>Mostrando {sales.length} de {pagination.total}</span><div className="flex items-center gap-1.5 self-end sm:gap-2 sm:self-auto"><Button variant="ghost" disabled={pagination.page === 1} onClick={() => pagination.setPage(pagination.page - 1)}><ChevronLeft className="h-4 w-4" /> Anterior</Button><span className="whitespace-nowrap">{pagination.page} / {pagination.pageCount}</span><Button variant="ghost" disabled={pagination.page === pagination.pageCount} onClick={() => pagination.setPage(pagination.page + 1)}>Siguiente <ChevronRight className="h-4 w-4" /></Button></div></div>
      </section>

      {/* Receipt Modal */}
      <SaleDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        sale={selectedSale}
        onConfirm={handleConfirmSale}
        isSubmitting={isSubmitting}
      />
      <SaleTicketPreviewModal sale={ticketPreviewSale} isOpen={Boolean(ticketPreviewSale)} onClose={() => setTicketPreviewSale(null)} />
    </div>
  );
};
