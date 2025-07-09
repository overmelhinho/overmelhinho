import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

export function useRoles() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data } = await api.get('/v1/roles');
      console.log('ROLES:', data);
      return data; // <- Aqui! retorna o array direto
    },
  });
}
