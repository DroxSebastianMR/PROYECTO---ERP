import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Package,
  Layers,
  Ruler,
  Barcode,
} from "lucide-react";
import { useState } from "react";
import { BarcodesPage } from "@/features/barcodes/pages";
import { CatalogMasterTab } from "@/features/products/components/catalog-master-tab";
import { useProducts } from "@/features/products/hooks/use-products";
import { ProductMetricsSummary } from "@/features/products/components/product-metrics-summary";
import { ProductFilterBar } from "@/features/products/components/product-filter-bar";
import { ProductTable } from "@/features/products/components/product-table";
import { ProductFormModal } from "@/features/products/components/product-form-modal";
import { ProductDetailModal } from "@/features/products/components/product-detail-modal";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { can } from "@/lib/access-control";

export const ProductsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"products" | "categories" | "units" | "barcodes">(
    "products",
  );
  const {
    products,
    isLoading,
    isRefreshing,
    error,
    filters,
    setFilters,
    categories,
    measurementUnits,
    metrics,
    pagination,
    // Modals
    isFormOpen,
    setIsFormOpen,
    editingProduct,
    isDetailOpen,
    setIsDetailOpen,
    selectedProduct,
    isDeleteOpen,
    setIsDeleteOpen,
    deletingProduct,
    isSubmitting,
    // Actions
    refresh,
    handleOpenCreateModal,
    handleOpenEditModal,
    handleOpenDetailModal,
    handleOpenDeleteModal,
    handleSaveProduct,
    handleCreateMeasurementUnit,
    handleToggleStatus,
    handleDeleteProduct,
  } = useProducts();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1480px] p-4 sm:p-6 lg:p-7">
        <div className="flex h-64 items-center justify-center text-sm text-slate-500">
          <RefreshCw className="mr-2 h-4 w-4 animate-spin text-blue-600" />
          Cargando catálogo de productos...
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "products", label: "Productos", icon: Package, permission: "products.catalog.access" },
    { id: "categories", label: "Categorías", icon: Layers },
    { id: "units", label: "Unidad de medida", icon: Ruler },
    { id: "barcodes", label: "Códigos de barras", icon: Barcode },
  ] as const;
  const tabPermissions = { products: "products.catalog.access", categories: "products.categories.access", units: "products.units.access", barcodes: "products.barcodes.access" } as const;
  const visibleTabs = tabs.filter((tab) => can(user ?? undefined, tabPermissions[tab.id]));
  if (activeTab !== "products")
    return (
      <div className="mx-auto max-w-[1480px] p-4 sm:p-6 lg:p-7">
        <header>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold text-slate-900 sm:text-[30px]">
            <Package className="h-8 w-8 text-blue-600" />
            Productos
          </h1>
          <p className="mt-1 text-[15px] text-slate-600">
            Catálogo unificado de productos, precios y control de inventario ERP.
          </p>
        </header>
        <nav className="mt-6 flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1.5">
          {visibleTabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold ${activeTab === id ? "bg-blue-600 text-white" : "text-slate-600"}`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>
        {activeTab === "barcodes" ? (
          <div className="mt-6">
            <BarcodesPage embedded />
          </div>
        ) : (
          <CatalogMasterTab
            type={activeTab === "categories" ? "categories" : "measurement-units"}
          />
        )}
      </div>
    );
  return (
    <div className="mx-auto max-w-[1480px] p-4 sm:p-6 lg:p-7">
      {/* Header */}
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-[-.045em] text-slate-900 sm:gap-3 sm:text-[30px]">
            <Package className="h-8 w-8 text-blue-600" />
            Productos
          </h1>
          <p className="mt-1 text-[15px] text-slate-600">
            Catálogo unificado de productos, precios y control de inventario ERP.
          </p>
        </div>
      </header>
      <nav className="mt-6 flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1.5">
        {visibleTabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold ${activeTab === id ? "bg-blue-600 text-white" : "text-slate-600"}`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </nav>

      {/* Error alert if any */}
      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Metric Cards Summary */}
      <section className="mt-6">
        <ProductMetricsSummary metrics={metrics} />
      </section>

      {/* Filter and Actions Bar */}
      <section className="mt-6">
        <ProductFilterBar
          filters={filters}
          onFilterChange={setFilters}
          categories={categories}
          onNewProduct={handleOpenCreateModal}
        />
        <div className="mt-4 flex flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Mostrando {products.length} de {pagination.total} productos
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
              Página {pagination.page} de {pagination.pageCount}
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

      {/* Product Data Table */}
      <section className="mt-6">
        <ProductTable
          products={products}
          onView={handleOpenDetailModal}
          onEdit={handleOpenEditModal}
          onToggleStatus={handleToggleStatus}
          onDelete={handleOpenDeleteModal}
        />
      </section>

      {/* Modal 1: Form Modal (Create / Edit) */}
      <ProductFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSaveProduct}
        product={editingProduct}
        categories={categories}
        measurementUnits={measurementUnits}
        onCreateMeasurementUnit={handleCreateMeasurementUnit}
        isSubmitting={isSubmitting}
      />

      {/* Modal 2: Product Detail Modal */}
      <ProductDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        product={selectedProduct}
        onEdit={handleOpenEditModal}
      />

      {/* Modal 3: Delete Confirmation Modal */}
      <Dialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Eliminar Producto"
        description="El sistema conservará el historial operativo cuando sea necesario."
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Si el producto no tiene operaciones, se eliminará permanentemente. Si tiene historial,
            se desactivará y dejará de estar disponible en ventas y compras. Producto:{" "}
            <strong className="text-slate-900">{deletingProduct?.name}</strong> (
            {deletingProduct?.sku}) del catálogo ERP.
          </p>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setIsDeleteOpen(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              variant="default"
              onClick={handleDeleteProduct}
              disabled={isSubmitting}
              className="bg-rose-600 text-white hover:bg-rose-700"
            >
              {isSubmitting ? "Eliminando..." : "Sí, Eliminar"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
