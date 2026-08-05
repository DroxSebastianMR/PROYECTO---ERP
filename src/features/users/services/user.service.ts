import { httpClient } from "@/lib/api/http-client";
import type {
  CreateUserInput,
  SystemUser,
  UserRoleDefinition,
} from "@/features/users/types/user.types";

export const userService = {
  getUsers: () => httpClient<SystemUser[]>("/users"),
  getRoles: () => httpClient<UserRoleDefinition[]>("/users/roles"),
  getPermissions: () => httpClient<string[]>("/users/permissions"),
  create: (input: CreateUserInput) =>
    httpClient<SystemUser>("/users", { method: "POST", body: JSON.stringify(input) }),
  update: (id: string, input: Partial<Pick<SystemUser, "fullName" | "role" | "isActive" | "permissions">>) =>
    httpClient<SystemUser>(`/users/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
};
