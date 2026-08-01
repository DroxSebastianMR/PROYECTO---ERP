import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  User,
  Users,
  X,
} from "lucide-react";
import { CustomerDeleteModal } from "@/features/customers/components/customer-delete-modal";
import { CustomerDetailModal } from "@/features/customers/components/customer-detail-modal";
import { CustomerFormModal } from "@/features/customers/components/customer-form-modal";
import { CustomerMetricsView } from "@/features/customers/components/customer-metrics";
import { CustomerTable } from "@/features/customers/components/customer-table";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type {
  CommercialCategory,
  CustomerStatus,
  CustomerType,
} from "@/features/customers/types/customer.types";

export const CustomersPage = () => {
  const {
    customers,
    pagination,
    metrics,
    isLoading,
    isFetching,

    // Filtros
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    categoryFilter,
    setCategoryFilter,
    resetFilters,

    // Notificaciones
    notification,
    clearNotification,

    // Modales
    isFormOpen,
    formMode,
    isDetailOpen,
    isDeleteModalOpen,
    selectedCustomer,
    isSubmitting,

    // Handlers
    handleOpenCreateModal,
    handleOpenEditModal,
    handleOpenDetailModal,
    handleOpenDeleteModal,
    handleCloseModals,
    handleSaveCustomer,
    handleChangeStatus,
    handleDeleteCustomer,
    handleLookupDocument,
    refresh,
  } = useCustomers();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1480px] p-4 sm:p-6 lg:p-7">
        <div className="flex h-64 items-center justify-center text-sm text-slate-500">
          <RefreshCw className="mr-2 h-4 w-4 animate-spin text-blue-600" />
          Cargando catálogo de clientes...
        </div>
      </div>
    );
  }

  const hasActiveFilters =
    searchQuery !== "" ||
    statusFilter !== "ALL" ||
    typeFilter !== "ALL" ||
    categoryFilter !== "ALL";

  return (
    <div className="mx-auto max-w-[1480px] p-4 sm:p-6 lg:p-7 space-y-6">
      {/* Toast Notification Banner */}
      {notification && (
        <div
          className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium shadow-sm transition animate-in fade-in-0 duration-200 ${
            notification.type === "success"
              ? "bg-emerald-600 text-white"
              : notification.type === "error"
              ? "bg-rose-600 text-white"
              : "bg-blue-600 text-white"
          }`}
        >
          <span>{notification.message}</span>
          <button
            onClick={clearNotification}
            className="ml-4 rounded-lg p-1 hover:bg-white/20 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header Module */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-[-.045em] text-slate-900 sm:gap-3 sm:text-[30px]">
            <Users className="h-8 w-8 text-blue-600" />
            Clientes
          </h1>
          <p className="mt-1 text-[15px] text-slate-600">
            Administración del catálogo de clientes, clasificación comercial y trazabilidad de operaciones.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={refresh}
            disabled={isFetching}
            className="border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-xs font-medium h-10 px-3"
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isFetching ? "animate-spin text-blue-600" : ""}`} />
            Actualizar
          </Button>
          <Button
            onClick={handleOpenCreateModal}
            className="gap-2 bg-blue-600 font-medium text-white shadow-sm hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Nuevo Cliente
          </Button>
        </div>
      </header>

      {/* Metrics Cards */}
      <section>
        <CustomerMetricsView metrics={metrics} />
      </section>

      {/* Filters and Actions Bar */}
      <section className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-[0_8px_20px_rgba(37,99,235,.03)]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Búsqueda rápida */}
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Buscar por código, RUC/DNI, cliente, teléfono..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filtro por Estado */}
          <div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "ALL" | CustomerStatus)}
            >
              <option value="ALL">Todos los Estados</option>
              <option value="ACTIVO">Activo</option>
              <option value="INACTIVO">Inactivo</option>
              <option value="BLOQUEADO">Bloqueado</option>
            </Select>
          </div>

          {/* Filtro por Tipo de Cliente */}
          <div>
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as "ALL" | CustomerType)}
            >
              <option value="ALL">Todos los Tipos</option>
              <option value="PERSONA_NATURAL">Persona Natural</option>
              <option value="EMPRESA">Empresa</option>
            </Select>
          </div>

          {/* Filtro por Categoría Comercial */}
          <div>
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as "ALL" | CommercialCategory)}
            >
              <option value="ALL">Todas las Categorías</option>
              <option value="REGULAR">Regular</option>
              <option value="VIP">VIP</option>
              <option value="MAYORISTA">Mayorista</option>
              <option value="MINORISTA">Minorista</option>
              <option value="CORPORATIVO">Corporativo</option>
            </Select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-600">
            <span className="flex items-center gap-1">
              <Filter className="h-3.5 w-3.5 text-blue-600" /> Filtros activos aplicados
            </span>
            <Button
              variant="ghost"
              onClick={resetFilters}
              className="h-8 px-2 text-xs text-slate-600 hover:text-slate-900"
            >
              <RotateCcw className="mr-1 h-3.5 w-3.5" /> Limpiar Filtros
            </Button>
          </div>
        )}
      </section>

      {/* Main Table */}
      <section className="space-y-4">
        <CustomerTable
          customers={customers}
          onView={handleOpenDetailModal}
          onEdit={handleOpenEditModal}
          onChangeStatus={handleChangeStatus}
          onDelete={handleOpenDeleteModal}
        />

        {/* Paginación */}
        <div className="flex flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Mostrando <strong>{customers.length}</strong> de <strong>{pagination.total}</strong> clientes
          </span>
          <div className="flex items-center gap-1.5 self-end sm:gap-2 sm:self-auto">
            <Button
              variant="ghost"
              disabled={pagination.page === 1}
              onClick={() => pagination.setPage(pagination.page - 1)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
            </Button>
            <span className="whitespace-nowrap font-medium text-slate-700 px-2 py-1 bg-slate-100 rounded text-xs">
              Página {pagination.page} de {pagination.pageCount}
            </span>
            <Button
              variant="ghost"
              disabled={pagination.page === pagination.pageCount}
              onClick={() => pagination.setPage(pagination.page + 1)}
            >
              Siguiente <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </section>

      {/* Formulario Modal (Registro / Edición) */}
      <CustomerFormModal
        isOpen={isFormOpen}
        mode={formMode}
        initialData={selectedCustomer}
        isSubmitting={isSubmitting}
        onClose={handleCloseModals}
        onSubmit={handleSaveCustomer}
        onLookupDocument={handleLookupDocument}
      />

      {/* Ficha del Cliente Modal (Detalle & Historial) */}
      <CustomerDetailModal
        isOpen={isDetailOpen}
        customer={selectedCustomer}
        onClose={handleCloseModals}
        onChangeStatus={handleChangeStatus}
        onEdit={(cust) => {
          handleCloseModals();
          handleOpenEditModal(cust);
        }}
      />

      {/* Confirmación / Bloqueo de Eliminación Modal */}
      <CustomerDeleteModal
        isOpen={isDeleteModalOpen}
        customer={selectedCustomer}
        isSubmitting={isSubmitting}
        onClose={handleCloseModals}
        onConfirmDelete={handleDeleteCustomer}
        onChangeStatus={handleChangeStatus}
      />
    </div>
  );
};
