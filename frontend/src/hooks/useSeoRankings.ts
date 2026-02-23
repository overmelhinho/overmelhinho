import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";

export function useSeoRankings(clientId: string | number) {
    return useQuery({
        queryKey: ["seo-rankings", clientId],
        queryFn: async () => {
            const { data } = await api.get(`/v1/clientes/${clientId}/seo-rankings`);
            return data.data; // Retorna o array de palavras-chave com histórico
        },
        enabled: !!clientId,
    });
}
