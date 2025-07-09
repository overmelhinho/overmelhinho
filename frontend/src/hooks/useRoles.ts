import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

// Buscar todas as roles
export function useRoles() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data } = await api.get('/v1/roles');
      return data;
    },
  });
}

// Criar role
export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (role) => api.post('/v1/roles', role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roles'] }),
  });
}

// Atualizar role
export function useUpdateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...role }) => api.put(`/v1/roles/${id}`, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roles'] }),
  });
}

// Remover role
export function useDeleteRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/v1/roles/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roles'] }),
  });
}

// Buscar todas as permissions (usado no form de roles)
export function usePermissions() {
  return useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const { data } = await api.get('/v1/permissions');
      return data;
    },
  });
}
