import { httpClient } from "@/lib/api/http-client";
import type {
  CreateUserInput,
  AccessRoleDefinition,
  ManagedUserRole,
  SystemUser,
  UserRoleDefinition,
} from "@/features/users/types/user.types";

export const userService = {
  getUsers: () => httpClient<SystemUser[]>("/users"),
  getRoles: () => httpClient<UserRoleDefinition[]>("/users/roles"),
  getPermissions: () => httpClient<string[]>("/users/permissions"),
  getAccessRoles: () => httpClient<AccessRoleDefinition[]>("/users/access-roles"),
  create: (input: CreateUserInput) =>
    httpClient<SystemUser>("/users", { method: "POST", body: JSON.stringify(input) }),
  update: (id: string, input: Partial<Pick<SystemUser, "fullName" | "personalEmail" | "dni" | "role" | "isActive" | "permissions">>) =>
    httpClient<SystemUser>(`/users/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  updateRolePermissions: (role: ManagedUserRole, permissions: string[]) => httpClient<UserRoleDefinition>(`/users/roles/${role}/permissions`, { method: "PUT", body: JSON.stringify({ permissions }) }),
  createAccessRole: (input: { name: string; description?: string; permissions: string[] }) => httpClient<AccessRoleDefinition>("/users/access-roles", { method: "POST", body: JSON.stringify(input) }),
};
