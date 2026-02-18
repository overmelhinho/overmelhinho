import { useQuery } from '@tanstack/react-query';
import axios from '@/services/api';

export function useSegmentos() {
  return useQuery({
    queryKey: ['segmentos'],
    queryFn: async () => {
      const { data } = await axios.get('/v1/segmentos');
      return data; // deve retornar: [{ id, nome }]
    },
  });
}
