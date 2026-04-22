import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

export interface Cliente {
  id: number;
  nome_fantasia: string;
  slug: string;
  logo_url: string;
  descricao: string;
  rating?: number;
  segmentos: { id: number; nome: string }[];
  enderecos: { bairro: string; cidade: string; estado: string }[];
  contatos: { whatsapp_selected: string; celular: string }[];
}

export function useClients(params: { city_id?: number | null; q?: string; per_page?: number }) {
  return useQuery({
    queryKey: ['clients', params],
    queryFn: async () => {
      const res = await api.get('/public/search', { params });
      return res.data.data as Cliente[];
    },
  });
}
