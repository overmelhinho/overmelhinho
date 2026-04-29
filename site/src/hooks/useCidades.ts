import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

export const useCidades = () => {
    return useQuery({
        queryKey: ['cidades'],
        queryFn: async () => {
            const res = await api.get('/cidades');
            return res.data.data || res.data;
        },
        staleTime: 1000 * 60 * 60, // 1 hora de cache
    });
};
