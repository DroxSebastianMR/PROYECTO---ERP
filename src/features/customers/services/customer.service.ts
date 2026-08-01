import type {
  CreateCustomerInput,
  Customer,
  CustomerMetrics,
  CustomerOperation,
  CustomerStatus,
  DocumentType,
  UpdateCustomerInput,
} from "@/features/customers/types/customer.types";

const STORAGE_KEY = "erp_customers_mock_db_v1";

const INITIAL_MOCK_CUSTOMERS: Customer[] = [
  {
    id: "cli-101",
    code: "CLI-000001",
    customerType: "EMPRESA",
    documentType: "RUC",
    documentNumber: "20608912341",
    companyName: "Constructora & Inversiones Del Sur S.A.C.",
    tradeName: "Consur Perú",
    legalRepresentative: "Roberto Carlos Mendoza V.",
    representativeRole: "Gerente General",
    companyPhone: "01-4528900",
    companyEmail: "contacto@consurperu.pe",
    address: "Av. Javier Prado Este 2450, San Borja, Lima",
    ubigeo: "150130",
    category: "MAYORISTA",
    status: "ACTIVO",
    notes: "Cliente preferencial con línea de crédito autorizada.",
    hasOperations: true,
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-06-20T14:15:00Z",
    summary: {
      totalSpent: 45800.5,
      totalSalesCount: 12,
      pendingBalance: 4200.0,
      averageTicket: 3816.7,
      lastPurchaseDate: "2024-07-28T16:45:00Z",
    },
    operationsHistory: [
      {
        id: "op-101",
        date: "2024-07-28T16:45:00Z",
        type: "VENTA",
        documentNumber: "F001-000452",
        amount: 12500.0,
        status: "COMPLETADO",
        description: "Venta de materiales de construcción y ferretería industrial",
      },
      {
        id: "op-102",
        date: "2024-07-15T11:20:00Z",
        type: "PAGO",
        documentNumber: "REC-00129",
        amount: 8300.0,
        status: "COMPLETADO",
        description: "Abono a cuenta corriente por transferencia bancaria BCP",
      },
      {
        id: "op-103",
        date: "2024-06-10T09:15:00Z",
        type: "VENTA",
        documentNumber: "F001-000388",
        amount: 25000.5,
        status: "COMPLETADO",
        description: "Suministro masivo herramientas pesadas",
      },
    ],
  },
  {
    id: "cli-102",
    code: "CLI-000002",
    customerType: "PERSONA_NATURAL",
    documentType: "DNI",
    documentNumber: "45892134",
    firstName: "Carlos Alberto",
    lastName: "Mendoza Ríos",
    birthDate: "1988-04-12",
    gender: "M",
    civilStatus: "CASADO",
    phone: "01-2248900",
    mobilePhone: "987654321",
    email: "carlos.mendoza@gmail.com",
    address: "Jr. Los Olivos 432, Surco, Lima",
    ubigeo: "150136",
    category: "VIP",
    status: "ACTIVO",
    notes: "Cliente recurrente en tienda principal.",
    hasOperations: true,
    createdAt: "2024-02-10T11:00:00Z",
    updatedAt: "2024-07-02T10:00:00Z",
    summary: {
      totalSpent: 8450.0,
      totalSalesCount: 5,
      pendingBalance: 0.0,
      averageTicket: 1690.0,
      lastPurchaseDate: "2024-07-25T18:10:00Z",
    },
    operationsHistory: [
      {
        id: "op-201",
        date: "2024-07-25T18:10:00Z",
        type: "VENTA",
        documentNumber: "B001-001240",
        amount: 2450.0,
        status: "COMPLETADO",
        description: "Compra de accesorios e insumos con tarjeta Visa",
      },
      {
        id: "op-202",
        date: "2024-05-14T14:30:00Z",
        type: "VENTA",
        documentNumber: "B001-000980",
        amount: 6000.0,
        status: "COMPLETADO",
        description: "Compra de repuestos de almacén",
      },
    ],
  },
  {
    id: "cli-103",
    code: "CLI-000003",
    customerType: "EMPRESA",
    documentType: "RUC",
    documentNumber: "20451298371",
    companyName: "Comercializadora San Juan E.I.R.L.",
    tradeName: "San Juan Comercial",
    legalRepresentative: "Elena Paredes Castillo",
    representativeRole: "Titular Gerente",
    companyPhone: "01-3881234",
    companyEmail: "ventas@sanjuan.com.pe",
    address: "Av. Argentina 1580, Cercado de Lima",
    ubigeo: "150101",
    category: "REGULAR",
    status: "INACTIVO",
    notes: "Suspendió actividades temporales por reorganización.",
    hasOperations: true,
    createdAt: "2024-03-05T09:40:00Z",
    updatedAt: "2024-05-18T16:00:00Z",
    summary: {
      totalSpent: 3100.0,
      totalSalesCount: 2,
      pendingBalance: 1200.0,
      averageTicket: 1550.0,
      lastPurchaseDate: "2024-04-12T15:30:00Z",
    },
    operationsHistory: [
      {
        id: "op-301",
        date: "2024-04-12T15:30:00Z",
        type: "VENTA",
        documentNumber: "F001-000210",
        amount: 3100.0,
        status: "PENDIENTE",
        description: "Venta a crédito a 30 días",
      },
    ],
  },
  {
    id: "cli-104",
    code: "CLI-000004",
    customerType: "PERSONA_NATURAL",
    documentType: "DNI",
    documentNumber: "71239845",
    firstName: "Ana María",
    lastName: "Gutiérrez Torres",
    birthDate: "1994-09-22",
    gender: "F",
    civilStatus: "SOLTERO",
    mobilePhone: "912345678",
    email: "ana.gutierrez@outlook.com",
    address: "Calle Los Pinos 120, Miraflores, Lima",
    ubigeo: "150122",
    category: "REGULAR",
    status: "ACTIVO",
    notes: "Registrada recientemente. Pendiente primera compra.",
    hasOperations: false, // SIN OPERACIONES REGISTRADAS -> Permite eliminación física
    createdAt: "2024-07-20T12:00:00Z",
    updatedAt: "2024-07-20T12:00:00Z",
    summary: {
      totalSpent: 0.0,
      totalSalesCount: 0,
      pendingBalance: 0.0,
      averageTicket: 0.0,
    },
    operationsHistory: [],
  },
  {
    id: "cli-105",
    code: "CLI-000005",
    customerType: "EMPRESA",
    documentType: "RUC",
    documentNumber: "20554433221",
    companyName: "Inversiones Tecnológicas del Perú S.R.L.",
    tradeName: "InverTech Perú",
    legalRepresentative: "Gonzalo Vargas Machuca",
    representativeRole: "Director Comercial",
    companyPhone: "01-6109900",
    companyEmail: "administracion@invertech.pe",
    address: "Av. Las Camelias 820, Piso 5, San Isidro",
    ubigeo: "150131",
    category: "CORPORATIVO",
    status: "BLOQUEADO",
    notes: "Bloqueado por deuda vencida superior a 60 días.",
    hasOperations: true,
    createdAt: "2023-11-01T08:00:00Z",
    updatedAt: "2024-07-10T11:45:00Z",
    summary: {
      totalSpent: 112000.0,
      totalSalesCount: 8,
      pendingBalance: 15400.0,
      averageTicket: 14000.0,
      lastPurchaseDate: "2024-05-02T10:00:00Z",
    },
    operationsHistory: [
      {
        id: "op-501",
        date: "2024-05-02T10:00:00Z",
        type: "VENTA",
        documentNumber: "F001-000290",
        amount: 15400.0,
        status: "PENDIENTE",
        description: "Lote de equipamiento informático a crédito",
      },
    ],
  },
  {
    id: "cli-106",
    code: "CLI-000006",
    customerType: "PERSONA_NATURAL",
    documentType: "DNI",
    documentNumber: "10456789",
    firstName: "Luis Eduardo",
    lastName: "Paredes Silva",
    birthDate: "1982-12-05",
    gender: "M",
    civilStatus: "CASADO",
    mobilePhone: "998877665",
    email: "luis.paredes@yahoo.es",
    address: "Av. Arequipa 3300, San Isidro",
    ubigeo: "150131",
    category: "MINORISTA",
    status: "ACTIVO",
    notes: "Cliente puntual en pagos al contado.",
    hasOperations: true,
    createdAt: "2024-04-18T15:10:00Z",
    updatedAt: "2024-07-01T09:30:00Z",
    summary: {
      totalSpent: 1250.0,
      totalSalesCount: 3,
      pendingBalance: 0.0,
      averageTicket: 416.7,
      lastPurchaseDate: "2024-06-30T17:20:00Z",
    },
    operationsHistory: [
      {
        id: "op-601",
        date: "2024-06-30T17:20:00Z",
        type: "VENTA",
        documentNumber: "B001-001105",
        amount: 450.0,
        status: "COMPLETADO",
        description: "Pago con Yape",
      },
    ],
  },
  {
    id: "cli-107",
    code: "CLI-000007",
    customerType: "EMPRESA",
    documentType: "RUC",
    documentNumber: "20100098765",
    companyName: "Distribuidora Andina S.A.C.",
    tradeName: "Andina Logistics",
    legalRepresentative: "Carmen Julia Salazar",
    representativeRole: "Gerente de Compras",
    companyPhone: "01-5124000",
    companyEmail: "compras@andinalogistics.pe",
    address: "Av. Elmer Faucett 1900, Callao",
    ubigeo: "070101",
    category: "MAYORISTA",
    status: "ACTIVO",
    notes: "Ficha registrada. Pendiente homologación de proveedor.",
    hasOperations: false, // SIN OPERACIONES REGISTRADAS -> Permite eliminación física
    createdAt: "2024-07-28T09:00:00Z",
    updatedAt: "2024-07-28T09:00:00Z",
    summary: {
      totalSpent: 0.0,
      totalSalesCount: 0,
      pendingBalance: 0.0,
      averageTicket: 0.0,
    },
    operationsHistory: [],
  },
];

const loadFromStorage = (): Customer[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MOCK_CUSTOMERS));
      return INITIAL_MOCK_CUSTOMERS;
    }
    return JSON.parse(raw) as Customer[];
  } catch {
    return INITIAL_MOCK_CUSTOMERS;
  }
};

const saveToStorage = (customers: Customer[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
  } catch (error) {
    console.error("Error saving customers to storage:", error);
  }
};

export const customerService = {
  async getCustomers(): Promise<Customer[]> {
    // Simula retardo de red leve
    await new Promise((resolve) => setTimeout(resolve, 200));
    return loadFromStorage();
  },

  async getCustomerById(id: string): Promise<Customer> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    const customers = loadFromStorage();
    const found = customers.find((c) => c.id === id);
    if (!found) throw new Error("Cliente no encontrado en el sistema.");
    return found;
  },

  // Búsqueda/consulta automática de datos por Nro de Documento (Simulación RENIEC / SUNAT)
  async lookupDocument(
    documentType: DocumentType,
    documentNumber: string,
  ): Promise<{
    found: boolean;
    data?: {
      firstName?: string;
      lastName?: string;
      companyName?: string;
      tradeName?: string;
      legalRepresentative?: string;
      address?: string;
      ubigeo?: string;
    };
    message?: string;
  }> {
    await new Promise((resolve) => setTimeout(resolve, 400));

    const cleanNumber = documentNumber.trim();
    if (!cleanNumber) {
      return { found: false, message: "Ingrese un número de documento válido." };
    }

    // Si es DNI (8 dígitos)
    if (documentType === "DNI" && cleanNumber.length === 8) {
      return {
        found: true,
        data: {
          firstName: "Javier Eduardo",
          lastName: "Ramírez Benavides",
          address: "Av. Arequipa 1240, Urb. Santa Cruz, Miraflores",
          ubigeo: "150122",
        },
        message: "Datos obtenidos correctamente de RENIEC.",
      };
    }

    // Si es RUC (11 dígitos)
    if (documentType === "RUC" && cleanNumber.length === 11) {
      if (cleanNumber.startsWith("20")) {
        return {
          found: true,
          data: {
            companyName: "Corporación Industrial del Pacífico S.A.C.",
            tradeName: "Indupac Perú",
            legalRepresentative: "Felipe Antonio De la Rosa",
            address: "Calle Los Negocios 340, Surquillo, Lima",
            ubigeo: "150141",
          },
          message: "Datos tributarios obtenidos de SUNAT (Padrón Reducido RUC).",
        };
      } else if (cleanNumber.startsWith("10")) {
        return {
          found: true,
          data: {
            companyName: "Ríos Morales Juan Manuel (Persona Natural con Negocio)",
            tradeName: "Comercial Rios",
            legalRepresentative: "Juan Manuel Ríos Morales",
            address: "Av. Colonial 890, Lima",
            ubigeo: "150101",
          },
          message: "Datos tributarios obtenidos de SUNAT.",
        };
      }
    }

    return {
      found: false,
      message: "No se encontraron registros automáticos. Complete los campos manualmente.",
    };
  },

  async createCustomer(input: CreateCustomerInput): Promise<Customer> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const customers = loadFromStorage();

    // Validar duplicidad de número de documento
    const existingDoc = customers.find(
      (c) =>
        c.documentType === input.documentType &&
        c.documentNumber.trim().toLowerCase() === input.documentNumber.trim().toLowerCase(),
    );

    if (existingDoc) {
      const docLabel =
        existingDoc.customerType === "EMPRESA"
          ? existingDoc.companyName
          : `${existingDoc.firstName} ${existingDoc.lastName}`;
      throw new Error(
        `El número de documento ${input.documentNumber} ya está registrado a nombre de: ${docLabel} (${existingDoc.code}).`,
      );
    }

    // Generar código autoincrementable CLI-000001
    const maxNum = customers.reduce((max, c) => {
      const match = c.code.match(/CLI-(\d+)/);
      if (match) {
        const val = parseInt(match[1], 10);
        return val > max ? val : max;
      }
      return max;
    }, 0);

    const nextNum = maxNum + 1;
    const newCode = `CLI-${String(nextNum).padStart(6, "0")}`;

    const now = new Date().toISOString();
    const newCustomer: Customer = {
      id: `cli-${Date.now()}`,
      code: newCode,
      customerType: input.customerType,
      documentType: input.documentType,
      documentNumber: input.documentNumber.trim(),
      firstName: input.firstName?.trim(),
      lastName: input.lastName?.trim(),
      birthDate: input.birthDate,
      gender: input.gender,
      civilStatus: input.civilStatus,
      phone: input.phone?.trim(),
      mobilePhone: input.mobilePhone?.trim(),
      email: input.email?.trim(),
      companyName: input.companyName?.trim(),
      tradeName: input.tradeName?.trim(),
      legalRepresentative: input.legalRepresentative?.trim(),
      representativeRole: input.representativeRole?.trim(),
      companyPhone: input.companyPhone?.trim(),
      companyEmail: input.companyEmail?.trim(),
      address: input.address?.trim(),
      ubigeo: input.ubigeo?.trim(),
      category: input.category || "REGULAR",
      status: "ACTIVO",
      notes: input.notes?.trim(),
      hasOperations: false, // recién creado sin operaciones
      createdAt: now,
      updatedAt: now,
      summary: {
        totalSpent: 0,
        totalSalesCount: 0,
        pendingBalance: 0,
        averageTicket: 0,
      },
      operationsHistory: [],
    };

    const updatedList = [newCustomer, ...customers];
    saveToStorage(updatedList);
    return newCustomer;
  },

  async updateCustomer(id: string, input: UpdateCustomerInput): Promise<Customer> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const customers = loadFromStorage();
    const index = customers.findIndex((c) => c.id === id);
    if (index === -1) throw new Error("Cliente no encontrado para actualizar.");

    const current = customers[index];

    // Validar duplicidad de número de documento si cambió
    if (
      input.documentNumber &&
      (input.documentNumber !== current.documentNumber || input.documentType !== current.documentType)
    ) {
      const docTypeToCheck = input.documentType || current.documentType;
      const docNumToCheck = input.documentNumber.trim();

      const existingDoc = customers.find(
        (c) =>
          c.id !== id &&
          c.documentType === docTypeToCheck &&
          c.documentNumber.trim().toLowerCase() === docNumToCheck.toLowerCase(),
      );

      if (existingDoc) {
        throw new Error(
          `El número de documento ${docNumToCheck} ya está asignado a otro cliente (${existingDoc.code}).`,
        );
      }
    }

    const updatedCustomer: Customer = {
      ...current,
      ...input,
      updatedAt: new Date().toISOString(),
    };

    customers[index] = updatedCustomer;
    saveToStorage(customers);
    return updatedCustomer;
  },

  async changeCustomerStatus(id: string, newStatus: CustomerStatus): Promise<Customer> {
    return this.updateCustomer(id, { status: newStatus });
  },

  async deleteCustomer(id: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 250));
    const customers = loadFromStorage();
    const customer = customers.find((c) => c.id === id);

    if (!customer) throw new Error("El cliente no existe.");

    // REQUISITO CLAVE:
    // Un cliente no debe eliminarse físicamente cuando tenga operaciones relacionadas (ventas, pagos, documentos),
    // solamente debe cambiar su estado a inactivo para conservar trazabilidad.
    // Si un cliente nunca tuvo operaciones registradas, debe permitirse su eliminación definitiva.
    if (customer.hasOperations || (customer.operationsHistory && customer.operationsHistory.length > 0)) {
      throw new Error(
        `Imposible eliminar físicamente a ${customer.code}. Posee operaciones comerciales (ventas, pagos o comprobantes). Solo está permitido cambiar su estado a INACTIVO.`,
      );
    }

    const filtered = customers.filter((c) => c.id !== id);
    saveToStorage(filtered);
  },

  calculateMetrics(customers: Customer[]): CustomerMetrics {
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter((c) => c.status === "ACTIVO").length;
    const inactiveCustomers = customers.filter((c) => c.status === "INACTIVO").length;
    const blockedCustomers = customers.filter((c) => c.status === "BLOQUEADO").length;
    const naturalCount = customers.filter((c) => c.customerType === "PERSONA_NATURAL").length;
    const empresaCount = customers.filter((c) => c.customerType === "EMPRESA").length;
    const totalRevenue = customers.reduce((sum, c) => sum + (c.summary.totalSpent || 0), 0);

    return {
      totalCustomers,
      activeCustomers,
      inactiveCustomers,
      blockedCustomers,
      naturalCount,
      empresaCount,
      totalRevenue,
    };
  },
};
