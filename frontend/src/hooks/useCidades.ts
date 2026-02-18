// /var/www/frontend/src/hooks/useCidades.ts
import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";

export type Cidade = {
  id: number;
  nome: string;
  uf?: string | null;
};

export function useCidades() {
  return useQuery({
    queryKey: ["cidades"],
    staleTime: 1000 * 60 * 10,
    queryFn: async () => {
      const { data } = await api.get("/v1/cidades");
      // backend pode retornar {data:[...]} ou [...]
      const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      return rows as Cidade[];
    },
  });
}
