import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { userService } from "@/features/users/services/user.service";
import type {
  CreateUserInput,
  ManagedUserRole,
  SystemUser,
} from "@/features/users/types/user.types";

const USERS_KEY = ["users"] as const;

export const useUsers = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<ManagedUserRole | "ALL">("ALL");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [permissionsUser, setPermissionsUser] = useState<SystemUser | null>(null);
  const usersQuery = useQuery({ queryKey: USERS_KEY, queryFn: userService.getUsers });
  const rolesQuery = useQuery({
    queryKey: ["users", "roles"],
    queryFn: userService.getRoles,
    staleTime: Infinity,
  });
  const permissionsQuery = useQuery({
    queryKey: ["users", "permissions"],
    queryFn: userService.getPermissions,
    staleTime: Infinity,
  });
  const accessRolesQuery = useQuery({ queryKey: ["users", "access-roles"], queryFn: userService.getAccessRoles, staleTime: 30_000 });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: USERS_KEY });
  const createMutation = useMutation({
    mutationFn: userService.create,
    onSuccess: () => {
      void invalidate();
      setIsFormOpen(false);
    },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof userService.update>[1] }) =>
      userService.update(id, input),
    onSuccess: invalidate,
  });
  const updateRolePermissionsMutation = useMutation({ mutationFn: ({ role, permissions }: { role: ManagedUserRole; permissions: string[] }) => userService.updateRolePermissions(role, permissions), onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["users", "roles"] }) });
  const createAccessRoleMutation = useMutation({ mutationFn: userService.createAccessRole, onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["users", "access-roles"] }) });
  const users = usersQuery.data ?? [];
  const filteredUsers = useMemo(
    () =>
      users.filter((user) => {
        const matchSearch =
          !search || `${user.fullName} ${user.email}`.toLowerCase().includes(search.toLowerCase());
        return matchSearch && (role === "ALL" || user.role === role);
      }),
    [users, search, role],
  );
  return {
    users: filteredUsers,
    allUsers: users,
    roles: rolesQuery.data ?? [],
    permissions: permissionsQuery.data ?? [],
    accessRoles: accessRolesQuery.data ?? [],
    search,
    setSearch,
    role,
    setRole,
    isLoading: usersQuery.isLoading,
    isRefreshing: usersQuery.isFetching && !usersQuery.isLoading,
    error: usersQuery.error instanceof Error ? usersQuery.error.message : null,
    isFormOpen,
    setIsFormOpen,
    permissionsUser,
    setPermissionsUser,
    isSubmitting: createMutation.isPending || updateMutation.isPending || updateRolePermissionsMutation.isPending || createAccessRoleMutation.isPending,
    refresh: () => usersQuery.refetch(),
    createUser: (input: CreateUserInput) => createMutation.mutateAsync(input),
    updateUser: (id: string, input: Parameters<typeof userService.update>[1]) =>
      updateMutation.mutateAsync({ id, input }),
    updateRolePermissions: (role: ManagedUserRole, permissions: string[]) => updateRolePermissionsMutation.mutateAsync({ role, permissions }),
    createAccessRole: (input: { name: string; description?: string; permissions: string[] }) => createAccessRoleMutation.mutateAsync(input),
  };
};
