// src/hooks/useLeadIntel.ts
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface LeadIntelData {
  nome_fantasia: string;
  razao_social: string;
  telefone: string;
  email: string;
  endereco: string;
  instagram: string;
  facebook?: string;
  linkedin?: string;
  youtube?: string;
  tiktok?: string;
  x?: string;
  descricao: string;
  website?: string;
  google_place_id?: string;
  data_fundacao?: string;
}

export function useLeadIntel(query: string, enabled = true) {
  return useQuery<LeadIntelData>({
    queryKey: ['lead-intel', query],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/v1/lead-intel/fetch`, {
        params: { query },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.dados;
    },
    enabled: !!query && enabled,
  });
}
