import { ChevronLeft, ChevronRight, RefreshCw, Warehouse, Search, RotateCcw } from "lucide-react";
import { useInventory } from "@/features/inventory/hooks/use-inventory";
import { InventoryMetrics } from "@/features/inventory/components/inventory-metrics";
import { InventoryStockTable } from "@/features/inventory/components/inventory-stock-table";
import { InventoryMovementsTable } from "@/features/inventory/components/inventory-movements-table";
import { StockAdjustmentModal } from "@/features/inventory/components/stock-adjustment-modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export const InventoryPage = () => {
  const {
    activeTab,
    setActiveTab,
    stocks,
    movements,
    isLoading,
    isRefreshing,
    searchQuery,
    setSearchQuery,
    warehouseFilter,
    setWarehouseFilter,
    stockLevelFilter,
    setStockLevelFilter,
    warehousesList,
    metrics,
    pagination,
    isAdjustmentOpen,
    setIsAdjustmentOpen,
    selectedStockItem,
    isSubmitting,
    refresh,
    handleOpenAdjustment,
    handleSaveAdjustment,
  } = useInventory();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1480px] p-4 sm:p-6 lg:p-7">
        <div className="flex h-64 items-center justify-center text-sm text-slate-500">
          <RefreshCw className="mr-2 h-4 w-4 animate-spin text-blue-600" />
          Cargando inventario de la empresa...
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
            <Warehouse className="h-8 w-8 text-blue-600" />
            Inventario
          </h1>
          <p className="mt-1 text-[15px] text-slate-600">
            Control físico por almacenes, auditoría Kardex y ajustes de existencias.
          </p>
        </div>
      </header>

      {/* Metrics */}
      <section className="mt-6">
        <InventoryMetrics metrics={metrics} />
      </section>

      {/* Tabs and Filters */}
      <section className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Tabs */}
        <div className="flex w-full items-center overflow-x-auto rounded-lg border border-slate-200 bg-white p-1 shadow-sm sm:w-auto">
          <button
            onClick={() => setActiveTab("stocks")}
            className={`shrink-0 whitespace-nowrap rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === "stocks"
                ? "bg-blue-600 text-white"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            Existencias por Almacén ({stocks.length})
          </button>
          <button
            onClick={() => setActiveTab("movements")}
            className={`shrink-0 whitespace-nowrap rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === "movements"
                ? "bg-blue-600 text-white"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            Historial Kardex ({movements.length})
          </button>
        </div>

        {/* Filter controls */}
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Buscar SKU, producto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="w-full sm:w-48">
            <Select value={warehouseFilter} onChange={(e) => setWarehouseFilter(e.target.value)}>
              <option value="ALL">Todos los Almacenes</option>
              {warehousesList.map((wh) => (
                <option key={wh} value={wh}>
                  {wh}
                </option>
              ))}
            </Select>
          </div>

          {activeTab === "stocks" && (
            <div className="w-full sm:w-44">
              <Select
                value={stockLevelFilter}
                onChange={(e) => setStockLevelFilter(e.target.value as typeof stockLevelFilter)}
              >
                <option value="ALL">Todo el stock</option>
                <option value="IN_STOCK">Con stock</option>
                <option value="LOW_STOCK">Stock bajo</option>
                <option value="OUT_OF_STOCK">Sin stock</option>
              </Select>
            </div>
          )}

          {(searchQuery || warehouseFilter !== "ALL" || stockLevelFilter !== "ALL") && (
            <Button
              variant="ghost"
              onClick={() => {
                setSearchQuery("");
                setWarehouseFilter("ALL");
                setStockLevelFilter("ALL");
              }}
              className="h-10 px-3 text-slate-600 hover:text-slate-900"
            >
              <RotateCcw className="mr-1 h-4 w-4" /> Limpiar
            </Button>
          )}
        </div>
      </section>

      {/* Main Content Area */}
      <section className="mt-6">
        {activeTab === "stocks" ? (
          <InventoryStockTable stocks={stocks} onAdjust={handleOpenAdjustment} />
        ) : (
          <InventoryMovementsTable movements={movements} />
        )}
        <div className="mt-4 flex flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Mostrando {activeTab === "stocks" ? stocks.length : movements.length} de{" "}
            {pagination.total}
          </span>
          <div className="flex items-center gap-1.5 self-end sm:gap-2 sm:self-auto">
            <Button
              variant="ghost"
              disabled={pagination.page === 1}
              onClick={() => pagination.setPage(pagination.page - 1)}
            >
              <ChevronLeft className="h-4 w-4" /> Anterior
            </Button>
            <span>
              {pagination.page} / {pagination.pageCount}
            </span>
            <Button
              variant="ghost"
              disabled={pagination.page === pagination.pageCount}
              onClick={() => pagination.setPage(pagination.page + 1)}
            >
              Siguiente <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Adjustment Modal */}
      <StockAdjustmentModal
        isOpen={isAdjustmentOpen}
        onClose={() => setIsAdjustmentOpen(false)}
        stockItem={selectedStockItem}
        onSubmit={handleSaveAdjustment}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};
