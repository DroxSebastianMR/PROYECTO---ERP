import { RefreshCw, Package } from "lucide-react";
import { useProducts } from "@/features/products/hooks/use-products";
import { ProductMetricsSummary } from "@/features/products/components/product-metrics-summary";
import { ProductFilterBar } from "@/features/products/components/product-filter-bar";
import { ProductTable } from "@/features/products/components/product-table";
import { ProductFormModal } from "@/features/products/components/product-form-modal";
import { ProductDetailModal } from "@/features/products/components/product-detail-modal";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export const ProductsPage = () => {
  const {
    products,
    isLoading,
    isRefreshing,
    error,
    filters,
    setFilters,
    categories,
    metrics,
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
    handleToggleStatus,
    handleDeleteProduct,
  } = useProducts();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1480px] p-5 sm:p-7">
        <div className="flex h-64 items-center justify-center text-slate-500 text-sm">
          <RefreshCw className="mr-2 h-4 w-4 animate-spin text-blue-600" />
          Cargando catálogo de productos...
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
            <Package className="h-8 w-8 text-blue-600" />
            Productos
          </h1>
          <p className="mt-1 text-[15px] text-slate-600">
            Catálogo unificado de productos, precios y control de inventario ERP.
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

      {/* Error alert if any */}
      {error && (
        <div className="mt-4 rounded-lg bg-red-50 p-4 border border-red-200 text-sm text-red-700">
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
        description="¿Estás seguro de que deseas eliminar este producto?"
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Esta acción eliminará de forma permanente el producto{" "}
            <strong className="text-slate-900">{deletingProduct?.name}</strong> ({deletingProduct?.sku})
            del catálogo ERP.
          </p>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={() => setIsDeleteOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              variant="default"
              onClick={handleDeleteProduct}
              disabled={isSubmitting}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {isSubmitting ? "Eliminando..." : "Sí, Eliminar"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
