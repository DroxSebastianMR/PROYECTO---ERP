import { RefreshCw, ShoppingCart, Search, Plus, RotateCcw } from "lucide-react";
import { usePurchases } from "@/features/purchases/hooks/use-purchases";
import { PurchaseMetrics } from "@/features/purchases/components/purchase-metrics";
import { PurchaseTable } from "@/features/purchases/components/purchase-table";
import { PurchaseFormModal } from "@/features/purchases/components/purchase-form-modal";
import { PurchaseDetailModal } from "@/features/purchases/components/purchase-detail-modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { PurchaseStatus } from "@/features/purchases/types/purchase.types";

export const PurchasesPage = () => {
  const {
    purchases,
    products,
    suppliers,
    warehouses,
    isLoading,
    isRefreshing,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    metrics,
    // Modals
    isFormOpen,
    setIsFormOpen,
    isDetailOpen,
    setIsDetailOpen,
    selectedPurchase,
    isSubmitting,
    // Actions
    refresh,
    handleOpenDetailModal,
    handleSavePurchase,
    handleOrderPurchase,
    handleReceivePurchase,
  } = usePurchases();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1480px] p-5 sm:p-7">
        <div className="flex h-64 items-center justify-center text-slate-500 text-sm">
          <RefreshCw className="mr-2 h-4 w-4 animate-spin text-blue-600" />
          Cargando módulo de compras...
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1480px] p-5 sm:p-7">
      {/* Header */}
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[30px] font-bold tracking-[-.045em] text-slate-900 flex items-center gap-3">
            <ShoppingCart className="h-8 w-8 text-blue-600" />
            Compras
          </h1>
          <p className="mt-1 text-[15px] text-slate-600">
            Órdenes de compra a proveedores, costos e ingreso automático de mercadería.
          </p>
        </div>
        <button
          onClick={() => void refresh()}
          disabled={isRefreshing}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60 transition shadow-sm"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Actualizar
        </button>
      </header>

      {/* Metrics */}
      <section className="mt-6">
        <PurchaseMetrics metrics={metrics} />
      </section>

      {/* Filter and Action Bar */}
      <section className="mt-6 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-[0_8px_20px_rgba(37,99,235,.03)] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Buscar por N° orden, proveedor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="w-full sm:w-48">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "ALL" | PurchaseStatus)}
            >
              <option value="ALL">Todos los Estados</option>
              <option value="ORDERED">En Tránsito / Ordenado</option>
              <option value="RECEIVED">Recepcionado</option>
              <option value="DRAFT">Borrador</option>
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
              <RotateCcw className="h-4 w-4 mr-1" /> Limpiar
            </Button>
          )}
        </div>

        <Button onClick={() => setIsFormOpen(true)} className="gap-2 shadow-sm font-medium">
          <Plus className="h-4 w-4" />
          Nueva Compra
        </Button>
      </section>

      {/* Main Table */}
      <section className="mt-6">
        <PurchaseTable purchases={purchases} onView={handleOpenDetailModal} />
      </section>

      {/* Form Modal */}
      <PurchaseFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSavePurchase}
        isSubmitting={isSubmitting}
        products={products}
        suppliers={suppliers}
        warehouses={warehouses}
      />

      {/* Detail & Reception Modal */}
      <PurchaseDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        purchase={selectedPurchase}
        onOrder={handleOrderPurchase}
        onReceive={handleReceivePurchase}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};
