export type ManagedUserRole = "ADMIN" | "MANAGER" | "SALES_PURCHASING" | "ACCOUNTANT" | "WAREHOUSE";

export type SystemUser = {
  id: string;
  fullName: string;
  email: string;
  role: ManagedUserRole;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  permissions: string[];
  additionalPermissions: string[];
};

export type UserRoleDefinition = {
  role: ManagedUserRole;
  permissions: string[];
};

export type CreateUserInput = {
  fullName: string;
  email: string;
  password: string;
  role: ManagedUserRole;
  permissions: string[];
};

export const ROLE_LABELS: Record<ManagedUserRole, string> = {
  ADMIN: "Administrador",
  MANAGER: "Supervisor",
  SALES_PURCHASING: "Vendedor",
  ACCOUNTANT: "Contador",
  WAREHOUSE: "Almacén",
};
