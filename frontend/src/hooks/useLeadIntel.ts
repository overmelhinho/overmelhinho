// src/hooks/useLeadIntel.ts
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

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

export function useLeadIntel(query: string, cidade?: string | boolean, cnpj?: string, enabled = true) {
  const actualCidade = typeof cidade === 'string' ? cidade : undefined;
  const actualEnabled = typeof cidade === 'boolean' ? cidade : enabled;

  return useQuery<LeadIntelData>({
    queryKey: ['lead-intel', query, actualCidade, cnpj],
    queryFn: async () => {
      const response = await api.get(`/v1/lead-intel/fetch`, {
        params: {
          query,
          cidade: actualCidade || undefined,
          cnpj: cnpj || undefined
        },
      });
      return response.data.dados;
    },
    enabled: !!query && actualEnabled,
  });
}
