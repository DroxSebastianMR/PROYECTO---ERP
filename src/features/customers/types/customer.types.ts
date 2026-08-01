export type CustomerType = "PERSONA_NATURAL" | "EMPRESA";
export type DocumentType = "DNI" | "RUC" | "CE" | "PASAPORTE" | "OTRO";
export type CustomerStatus = "ACTIVO" | "INACTIVO" | "BLOQUEADO";
export type CommercialCategory = "REGULAR" | "VIP" | "MAYORISTA" | "MINORISTA" | "CORPORATIVO";

export interface CustomerOperation {
  id: string;
  date: string;
  type: "VENTA" | "PAGO" | "COTIZACION" | "NOTA_CREDITO";
  documentNumber: string;
  amount: number;
  status: "COMPLETADO" | "PENDIENTE" | "ANULADO";
  description: string;
}

export interface CustomerSummary {
  totalSpent: number;
  totalSalesCount: number;
  pendingBalance: number;
  averageTicket: number;
  lastPurchaseDate?: string;
}

export interface Customer {
  id: string;
  code: string; // CLI-000001
  customerType: CustomerType;
  documentType: DocumentType;
  documentNumber: string;

  // Persona Natural
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  gender?: "M" | "F" | "OTRO";
  civilStatus?: "SOLTERO" | "CASADO" | "DIVORCIADO" | "VIUDO";
  phone?: string;
  mobilePhone?: string;
  email?: string;

  // Empresa
  companyName?: string; // Razón Social
  tradeName?: string; // Nombre Comercial
  legalRepresentative?: string;
  representativeRole?: string;
  companyPhone?: string;
  companyEmail?: string;

  // Ubicación y clasificación
  address?: string;
  ubigeo?: string;
  category: CommercialCategory;
  status: CustomerStatus;
  notes?: string;

  // Operaciones
  hasOperations: boolean;
  createdAt: string;
  updatedAt: string;

  // Resumen e historial
  summary: CustomerSummary;
  operationsHistory: CustomerOperation[];
}

export interface CreateCustomerInput {
  customerType: CustomerType;
  documentType: DocumentType;
  documentNumber: string;

  // Persona Natural
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  gender?: "M" | "F" | "OTRO";
  civilStatus?: "SOLTERO" | "CASADO" | "DIVORCIADO" | "VIUDO";
  phone?: string;
  mobilePhone?: string;
  email?: string;

  // Empresa
  companyName?: string;
  tradeName?: string;
  legalRepresentative?: string;
  representativeRole?: string;
  companyPhone?: string;
  companyEmail?: string;

  // Común
  address?: string;
  ubigeo?: string;
  category: CommercialCategory;
  notes?: string;
}

export type UpdateCustomerInput = Partial<CreateCustomerInput> & {
  status?: CustomerStatus;
};

export interface CustomerMetrics {
  totalCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  blockedCustomers: number;
  naturalCount: number;
  empresaCount: number;
  totalRevenue: number;
}
