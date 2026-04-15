// c:\Dev\overmelhinho\site\src\hooks\useAds.ts
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

export interface Ad {
  id: number;
  nome: string;
  tipo: string;
  url: string | null;
  is_institucional: boolean;
  placements: string[];
  midias: {
    [key: string]: {
      desktop: { url: string } | null;
      mobile: { url: string } | null;
    };
  };
  cliente: {
    id: number;
    nome: string;
    slug: string | null;
    whatsapp: string | null;
  };
}

export function useAds(params: { city_id?: number | null; keywords?: string; tipo?: string }) {
  return useQuery({
    queryKey: ['ads', params.city_id, params.keywords, params.tipo],
    queryFn: async () => {
      const res = await api.get('/public/ads', { params });
      return res.data.data as Ad[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}
