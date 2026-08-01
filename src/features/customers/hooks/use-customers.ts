import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { customerService } from "@/features/customers/services/customer.service";
import type {
  CommercialCategory,
  CreateCustomerInput,
  Customer,
  CustomerStatus,
  CustomerType,
  DocumentType,
  UpdateCustomerInput,
} from "@/features/customers/types/customer.types";

const CUSTOMERS_KEY = ["customers"] as const;
const EMPTY_CUSTOMERS: Customer[] = [];

export interface NotificationState {
  type: "success" | "error" | "info";
  message: string;
}

export const useCustomers = () => {
  const queryClient = useQueryClient();

  // Filtros y Búsqueda
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | CustomerStatus>("ALL");
  const [typeFilter, setTypeFilter] = useState<"ALL" | CustomerType>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<"ALL" | CommercialCategory>("ALL");
  const [page, setPage] = useState(1);

  // Modales
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [notification, setNotification] = useState<NotificationState | null>(null);

  const notify = (type: "success" | "error" | "info", message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((current) => (current?.message === message ? null : current));
    }, 5000);
  };

  const customersQuery = useQuery({
    queryKey: CUSTOMERS_KEY,
    queryFn: customerService.getCustomers,
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: CUSTOMERS_KEY });
  };

  // Crear cliente
  const createMutation = useMutation({
    mutationFn: customerService.createCustomer,
    onSuccess: (newCustomer) => {
      void invalidate();
      setIsFormOpen(false);
      notify("success", `Cliente ${newCustomer.code} (${newCustomer.companyName || `${newCustomer.firstName} ${newCustomer.lastName}`}) registrado exitosamente.`);
    },
    onError: (err: Error) => {
      notify("error", err.message || "Error al registrar el cliente.");
    },
  });

  // Editar cliente
  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCustomerInput }) =>
      customerService.updateCustomer(id, input),
    onSuccess: (updated) => {
      void invalidate();
      setIsFormOpen(false);
      if (selectedCustomer?.id === updated.id) {
        setSelectedCustomer(updated);
      }
      notify("success", `Datos del cliente ${updated.code} actualizados correctamente.`);
    },
    onError: (err: Error) => {
      notify("error", err.message || "Error al actualizar la información.");
    },
  });

  // Cambiar estado (Activar / Inactivar / Bloquear)
  const changeStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: CustomerStatus }) =>
      customerService.changeCustomerStatus(id, status),
    onSuccess: (updated) => {
      void invalidate();
      if (selectedCustomer?.id === updated.id) {
        setSelectedCustomer(updated);
      }
      const labelStatus = updated.status === "ACTIVO" ? "Activo" : updated.status === "INACTIVO" ? "Inactivo" : "Bloqueado";
      notify("info", `Estado del cliente ${updated.code} cambiado a: ${labelStatus}`);
    },
    onError: (err: Error) => {
      notify("error", err.message || "No se pudo cambiar el estado.");
    },
  });

  // Eliminar físicamente cliente (solo si no tiene operaciones)
  const deleteMutation = useMutation({
    mutationFn: customerService.deleteCustomer,
    onSuccess: () => {
      void invalidate();
      setIsDeleteModalOpen(false);
      const code = selectedCustomer?.code || "";
      setSelectedCustomer(null);
      notify("success", `El cliente ${code} ha sido eliminado definitivamente del sistema.`);
    },
    onError: (err: Error) => {
      notify("error", err.message || "Error al intentar eliminar el cliente.");
    },
  });

  const customers = customersQuery.data ?? EMPTY_CUSTOMERS;

  // Filtrado y paginación
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const term = searchQuery.toLowerCase().trim();
      const nameMatch =
        !term ||
        c.code.toLowerCase().includes(term) ||
        c.documentNumber.toLowerCase().includes(term) ||
        (c.companyName && c.companyName.toLowerCase().includes(term)) ||
        (c.tradeName && c.tradeName.toLowerCase().includes(term)) ||
        (c.firstName && c.firstName.toLowerCase().includes(term)) ||
        (c.lastName && c.lastName.toLowerCase().includes(term)) ||
        (c.phone && c.phone.includes(term)) ||
        (c.mobilePhone && c.mobilePhone.includes(term)) ||
        (c.companyPhone && c.companyPhone.includes(term));

      const statusMatch = statusFilter === "ALL" || c.status === statusFilter;
      const typeMatch = typeFilter === "ALL" || c.customerType === typeFilter;
      const categoryMatch = categoryFilter === "ALL" || c.category === categoryFilter;

      return nameMatch && statusMatch && typeMatch && categoryMatch;
    });
  }, [customers, searchQuery, statusFilter, typeFilter, categoryFilter]);

  const itemsPerPage = 10;
  const pageCount = Math.max(1, Math.ceil(filteredCustomers.length / itemsPerPage));
  const currentPage = Math.min(page, pageCount);
  const paginatedCustomers = useMemo(() => {
    return filteredCustomers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredCustomers, currentPage]);

  return {
    customers: paginatedCustomers,
    allCustomersCount: customers.length,
    pagination: {
      page: currentPage,
      pageCount,
      total: filteredCustomers.length,
      setPage,
    },
    metrics: customerService.calculateMetrics(customers),
    isLoading: customersQuery.isLoading,
    isFetching: customersQuery.isFetching,

    // Filtros
    searchQuery,
    setSearchQuery: (val: string) => {
      setPage(1);
      setSearchQuery(val);
    },
    statusFilter,
    setStatusFilter: (val: "ALL" | CustomerStatus) => {
      setPage(1);
      setStatusFilter(val);
    },
    typeFilter,
    setTypeFilter: (val: "ALL" | CustomerType) => {
      setPage(1);
      setTypeFilter(val);
    },
    categoryFilter,
    setCategoryFilter: (val: "ALL" | CommercialCategory) => {
      setPage(1);
      setCategoryFilter(val);
    },
    resetFilters: () => {
      setSearchQuery("");
      setStatusFilter("ALL");
      setTypeFilter("ALL");
      setCategoryFilter("ALL");
      setPage(1);
    },

    // Notificaciones
    notification,
    clearNotification: () => setNotification(null),

    // Modales y Seleccionados
    isFormOpen,
    formMode,
    isDetailOpen,
    isDeleteModalOpen,
    selectedCustomer,
    isSubmitting:
      createMutation.isPending ||
      updateMutation.isPending ||
      changeStatusMutation.isPending ||
      deleteMutation.isPending,

    // Handlers
    handleOpenCreateModal: () => {
      setSelectedCustomer(null);
      setFormMode("create");
      setIsFormOpen(true);
    },
    handleOpenEditModal: (customer: Customer) => {
      setSelectedCustomer(customer);
      setFormMode("edit");
      setIsFormOpen(true);
    },
    handleOpenDetailModal: (customer: Customer) => {
      setSelectedCustomer(customer);
      setIsDetailOpen(true);
    },
    handleOpenDeleteModal: (customer: Customer) => {
      setSelectedCustomer(customer);
      setIsDeleteModalOpen(true);
    },
    handleCloseModals: () => {
      setIsFormOpen(false);
      setIsDetailOpen(false);
      setIsDeleteModalOpen(false);
    },

    // Executants
    handleSaveCustomer: async (input: CreateCustomerInput | UpdateCustomerInput) => {
      if (formMode === "create") {
        await createMutation.mutateAsync(input as CreateCustomerInput);
      } else if (selectedCustomer) {
        await updateMutation.mutateAsync({ id: selectedCustomer.id, input });
      }
    },
    handleChangeStatus: async (customer: Customer, newStatus: CustomerStatus) => {
      await changeStatusMutation.mutateAsync({ id: customer.id, status: newStatus });
    },
    handleDeleteCustomer: async (customer: Customer) => {
      await deleteMutation.mutateAsync(customer.id);
    },
    handleLookupDocument: (type: DocumentType, docNum: string) =>
      customerService.lookupDocument(type, docNum),
    refresh: () => void invalidate(),
  };
};
