import { httpClient } from "@/lib/api/http-client";
import type {
  CreateCustomerInput,
  Customer,
  CustomerMetrics,
  CustomerStatus,
  DocumentType,
  UpdateCustomerInput,
} from "@/features/customers/types/customer.types";

type CustomerApi = Customer;

const lookupDocument = async (documentType: DocumentType, documentNumber: string) => {
  const cleanNumber = documentNumber.trim();
  if (!cleanNumber) return { found: false, message: "Ingrese un número de documento válido." };
  if (documentType === "DNI" && cleanNumber.length === 8) {
    return { found: false, message: "No se encontró una integración RENIEC configurada. Complete los datos manualmente." };
  }
  if (documentType === "RUC" && cleanNumber.length === 11) {
    return { found: false, message: "No se encontró una integración SUNAT configurada. Complete los datos manualmente." };
  }
  return { found: false, message: "El documento no tiene un formato válido." };
};

export const customerService = {
  getCustomers: () => httpClient<CustomerApi[]>("/customers"),
  getCustomerById: (id: string) => httpClient<CustomerApi>(`/customers/${id}`),
  createCustomer: (input: CreateCustomerInput) =>
    httpClient<CustomerApi>("/customers", { method: "POST", body: JSON.stringify(input) }),
  updateCustomer: (id: string, input: UpdateCustomerInput) =>
    httpClient<CustomerApi>(`/customers/${id}`, { method: "PUT", body: JSON.stringify(input) }),
  changeCustomerStatus: (id: string, status: CustomerStatus) =>
    httpClient<CustomerApi>(`/customers/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  deleteCustomer: (id: string) => httpClient<void>(`/customers/${id}`, { method: "DELETE" }),
  lookupDocument,
  calculateMetrics(customers: Customer[]): CustomerMetrics {
    const activeCustomers = customers.filter((customer) => customer.status === "ACTIVO").length;
    const inactiveCustomers = customers.filter((customer) => customer.status === "INACTIVO").length;
    const blockedCustomers = customers.filter((customer) => customer.status === "BLOQUEADO").length;
    return {
      totalCustomers: customers.length,
      activeCustomers,
      inactiveCustomers,
      blockedCustomers,
      naturalCount: customers.filter((customer) => customer.customerType === "PERSONA_NATURAL").length,
      empresaCount: customers.filter((customer) => customer.customerType === "EMPRESA").length,
      totalRevenue: customers.reduce((total, customer) => total + customer.summary.totalSpent, 0),
    };
  },
};
