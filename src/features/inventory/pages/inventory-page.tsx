import { ChevronLeft, ChevronRight, RefreshCw, Warehouse, Search, RotateCcw, ArrowLeftRight, SlidersHorizontal, Boxes, Building2 } from "lucide-react";
import { useInventory } from "@/features/inventory/hooks/use-inventory";
import { InventoryMetrics } from "@/features/inventory/components/inventory-metrics";
import { InventoryStockTable } from "@/features/inventory/components/inventory-stock-table";
import { InventoryMovementsTable } from "@/features/inventory/components/inventory-movements-table";
import { InventoryWarehousesTab } from "@/features/inventory/components/inventory-warehouses-tab";
import { WarehouseFormModal } from "@/features/inventory/components/warehouse-form-modal";
import { StockAdjustmentModal } from "@/features/inventory/components/stock-adjustment-modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { ROLE_PERMISSION_DEFAULTS } from "@/lib/permissions";

const tabs = [
  { id: "stocks", label: "Stock actual", icon: Boxes }, { id: "movements", label: "Movimientos", icon: ArrowLeftRight },
  { id: "transfers", label: "Transferencias", icon: ArrowLeftRight }, { id: "adjustments", label: "Ajuste de inventario", icon: SlidersHorizontal },
  { id: "warehouses", label: "Almacenes", icon: Building2 },
] as const;

export const InventoryPage = () => {
  const { user } = useAuth();
  const inventory = useInventory();
  const { activeTab, setActiveTab, stocks, movements, warehouses, primaryWarehouse, isLoading, searchQuery, setSearchQuery, warehouseFilter, setWarehouseFilter, stockLevelFilter, setStockLevelFilter, warehousesList, metrics, pagination, isAdjustmentOpen, setIsAdjustmentOpen, selectedStockItem, isWarehouseOpen, setIsWarehouseOpen, isSubmitting, isCreatingWarehouse, isListTab, handleOpenAdjustment, handleSaveAdjustment, handleCreateWarehouse } = inventory;
  if (isLoading) return <div className="mx-auto max-w-[1480px] p-4 sm:p-6 lg:p-7"><div className="flex h-64 items-center justify-center text-sm text-slate-500"><RefreshCw className="mr-2 h-4 w-4 animate-spin text-blue-600" />Cargando inventario de la empresa...</div></div>;
  const permissions = user?.permissions?.length ? user.permissions : user ? ROLE_PERMISSION_DEFAULTS[user.role] : [];
  const canManageInventory = permissions.includes("INVENTORY_MANAGE");
  const visibleTabs = canManageInventory ? tabs : tabs.filter((tab) => tab.id === "stocks" || tab.id === "movements");
  const resetFilters = () => { setSearchQuery(""); setWarehouseFilter("ALL"); setStockLevelFilter("ALL"); };
  const showWarehouseFilter = activeTab !== "stocks" && activeTab !== "warehouses";
  return <div className="mx-auto max-w-[1480px] p-4 sm:p-6 lg:p-7"><header><h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-[-.045em] text-slate-900 sm:gap-3 sm:text-[30px]"><Warehouse className="h-8 w-8 text-blue-600" />Almacén e Inventario</h1><p className="mt-1 text-[15px] text-slate-600">Control de existencias, movimientos y ubicaciones de la empresa.</p></header><section className="mt-6"><InventoryMetrics metrics={metrics} /></section>
    <section className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 shadow-sm"><div className="flex min-w-max items-center">{visibleTabs.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setActiveTab(id)} className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${activeTab === id ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}><Icon className="h-4 w-4" />{label}</button>)}</div></section>
    {activeTab === "stocks" && <div className="mt-5 rounded-lg border border-blue-100 bg-blue-50/60 px-4 py-3 text-sm text-blue-800">Mostrando existencias del <strong>{primaryWarehouse?.name ?? "almacén principal"}</strong>. Los almacenes adicionales se administran desde la pestaña Almacenes.</div>}
    {activeTab !== "warehouses" && <section className="mt-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center"><div className="relative w-full sm:max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input placeholder="Buscar por código o producto..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" /></div>{showWarehouseFilter && <div className="w-full sm:w-52"><Select value={warehouseFilter} onChange={(e) => setWarehouseFilter(e.target.value)}><option value="ALL">Todos los almacenes</option>{warehousesList.map((name) => <option key={name} value={name}>{name}</option>)}</Select></div>}{activeTab === "stocks" && <div className="w-full sm:w-44"><Select value={stockLevelFilter} onChange={(e) => setStockLevelFilter(e.target.value as typeof stockLevelFilter)}><option value="ALL">Todo el stock</option><option value="IN_STOCK">Con stock</option><option value="LOW_STOCK">Stock bajo</option><option value="OUT_OF_STOCK">Sin stock</option></Select></div>}{(searchQuery || warehouseFilter !== "ALL" || stockLevelFilter !== "ALL") && <Button variant="ghost" onClick={resetFilters} className="h-10 px-3 text-slate-600"><RotateCcw className="mr-1 h-4 w-4" />Limpiar</Button>}</section>}
    <section className="mt-5">{activeTab === "stocks" ? <InventoryStockTable stocks={stocks} onAdjust={handleOpenAdjustment} canAdjust={canManageInventory} /> : activeTab === "warehouses" ? <InventoryWarehousesTab warehouses={warehouses} onCreate={() => setIsWarehouseOpen(true)} /> : <InventoryMovementsTable movements={movements} />}{isListTab && <div className="mt-4 flex flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between"><span>Mostrando {activeTab === "stocks" ? stocks.length : movements.length} de {pagination.total}</span><div className="flex items-center gap-1.5 self-end sm:gap-2 sm:self-auto"><Button variant="ghost" disabled={pagination.page === 1} onClick={() => pagination.setPage(pagination.page - 1)}><ChevronLeft className="h-4 w-4" />Anterior</Button><span>{pagination.page} / {pagination.pageCount}</span><Button variant="ghost" disabled={pagination.page === pagination.pageCount} onClick={() => pagination.setPage(pagination.page + 1)}>Siguiente<ChevronRight className="h-4 w-4" /></Button></div></div>}</section>
    <StockAdjustmentModal isOpen={isAdjustmentOpen} onClose={() => setIsAdjustmentOpen(false)} stockItem={selectedStockItem} onSubmit={handleSaveAdjustment} isSubmitting={isSubmitting} /><WarehouseFormModal isOpen={isWarehouseOpen} onClose={() => setIsWarehouseOpen(false)} onSubmit={handleCreateWarehouse} isSubmitting={isCreatingWarehouse} />
  </div>;
};
