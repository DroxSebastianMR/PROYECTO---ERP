import { RefreshCw, Tag, Search, Plus, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PATHS } from "@/app/router/constants/paths";
import { useSales } from "@/features/sales/hooks/use-sales";
import { SaleMetrics } from "@/features/sales/components/sale-metrics";
import { SaleTable } from "@/features/sales/components/sale-table";
import { SaleDetailModal } from "@/features/sales/components/sale-detail-modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { SaleStatus } from "@/features/sales/types/sale.types";

export const SalesPage = () => {
  const navigate = useNavigate();
  const {
    sales,
    isLoading,
    isRefreshing,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    metrics,
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
      <div className="mx-auto max-w-[1480px] p-5 sm:p-7">
        <div className="flex h-64 items-center justify-center text-sm text-slate-500">
          <RefreshCw className="mr-2 h-4 w-4 animate-spin text-blue-600" />
          Cargando módulo de ventas...
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1480px] p-5 sm:p-7">
      {/* Header */}
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-[30px] font-bold tracking-[-.045em] text-slate-900">
            <Tag className="h-8 w-8 text-blue-600" />
            Ventas
          </h1>
          <p className="mt-1 text-[15px] text-slate-600">
            Punto de venta, emisión de comprobantes y cobranzas ERP.
          </p>
        </div>
        <button
          onClick={() => void refresh()}
          disabled={isRefreshing}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Actualizar
        </button>
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
        <SaleTable sales={sales} onView={handleOpenDetailModal} />
      </section>

      {/* Receipt Modal */}
      <SaleDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        sale={selectedSale}
        onConfirm={handleConfirmSale}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};
