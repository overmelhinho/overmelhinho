import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";

// Se já usa o usePermissions do useRoles, pode usar o mesmo hook.
// Este aqui é só para mutation:
export function useCreatePermission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (permission) => api.post("/v1/permissions", permission),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["permissions"] }),
  });
}

export function useUpdatePermission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...permission }) => api.put(`/v1/permissions/${id}`, permission),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["permissions"] }),
  });
}

export function useDeletePermission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/v1/permissions/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["permissions"] }),
  });
}
