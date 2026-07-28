export type ManagedUserRole = "ADMIN" | "SALES_PURCHASING" | "ACCOUNTANT";

export type SystemUser = {
  id: string;
  fullName: string;
  email: string;
  role: ManagedUserRole;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
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
};

export const ROLE_LABELS: Record<ManagedUserRole, string> = {
  ADMIN: "Administrador",
  SALES_PURCHASING: "Vendedor",
  ACCOUNTANT: "Contador",
};
