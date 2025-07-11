// src/hooks/useLeadsStats.ts
import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";

export function useLeadsStats() {
  return useQuery({
    queryKey: ["leadsStats"],
    queryFn: async () => {
      // Seu backend precisa retornar um objeto tipo:
      // { total: 120, em_contato: 30, convertido: 15, perdido: 10 }
      const { data } = await api.get("/v1/leads/stats");
      return data;
    },
  });
}
