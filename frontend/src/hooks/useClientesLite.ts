// /var/www/frontend/src/hooks/useClientesLite.ts
import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";

export type ClienteLiteOption = {
  id: number;
  nome_fantasia?: string | null;
  razao_social?: string | null;
  cpf_cnpj?: string | null;

  logo_url?: string | null;
  tipo_cliente?: string | null;
  status_assinatura?: string | null;
  possui_publicidade?: boolean | null;
};

export type ClientesLiteResponse = {
  rows: ClienteLiteOption[];
  meta: any;
};

import { queryClient } from "@/contexts/ReactQueryProvider";

export function useClientesLite(params?: {
  page?: number;
  per_page?: number;
  lite?: boolean;
  q?: string;
  search?: string;
  tipo_cliente?: string;
  tipo?: string;
  status_assinatura?: string;
  possui_publicidade?: boolean;
}) {
  const page = params?.page ?? 1;

  const per_page_raw = params?.per_page ?? 50;
  const per_page = Math.max(1, Math.min(50, per_page_raw));

  const lite = params?.lite ?? true;

  const q = (params?.q ?? "").trim();
  const search = (params?.search ?? "").trim();

  const tipo_cliente = (params?.tipo_cliente ?? "").trim();
  const tipo = (params?.tipo ?? "").trim();
  const status_assinatura = (params?.status_assinatura ?? "").trim();
  const possui_publicidade = params?.possui_publicidade;

  return useQuery<ClientesLiteResponse>({
    queryKey: [
      "clientesLite",
      page,
      per_page,
      lite ? 1 : 0,
      q,
      search,
      tipo_cliente,
      tipo,
      status_assinatura,
      typeof possui_publicidade === "boolean" ? (possui_publicidade ? 1 : 0) : "na",
    ],

    staleTime: 1000 * 60 * 2,
    keepPreviousData: true,

    queryFn: async ({ queryKey }) => {
      const reqParams: Record<string, any> = {
        page,
        per_page,
        lite,
      };

      const query = q || search;
      if (query) reqParams.search = query;

      if (tipo_cliente) reqParams.tipo_cliente = tipo_cliente;
      if (tipo) reqParams.tipo = tipo;
      if (status_assinatura) reqParams.status_assinatura = status_assinatura;
      if (typeof possui_publicidade === "boolean") {
        reqParams.possui_publicidade = possui_publicidade;
      }

      // 🔒 FASE 5: Delta Sync
      // Se estamos na página 1 e não temos nenhum filtro de busca ativo (apenas listagem padrão)
      const isDefaultList = page === 1 && !query && !tipo_cliente && !status_assinatura && typeof possui_publicidade !== "boolean";
      const syncKeyGlobal = 'last_sync_clientes';
      
      const previousData = queryClient.getQueryData<ClientesLiteResponse>(queryKey);
      const hasLocalData = previousData && previousData.rows.length > 0;
      
      if (isDefaultList && hasLocalData) {
        const lastSync = localStorage.getItem(syncKeyGlobal);
        if (lastSync) {
          reqParams.last_sync = lastSync;
        }
      }

      const { data } = await api.get("/v1/clientes", { params: reqParams });

      // Atualiza o horário da última sincronização se for a listagem padrão
      if (isDefaultList) {
        localStorage.setItem(syncKeyGlobal, new Date().toISOString());
      }

      let newRows: ClienteLiteOption[] = [];
      let newMeta = data?.meta ?? null;

      if (Array.isArray(data?.data)) {
        newRows = data.data;
      } else if (data?.data && Array.isArray(data.data.data)) {
        newRows = data.data.data;
        newMeta = data.data?.meta ?? data?.meta ?? null;
      }

      // 🔒 FASE 5: Merge (Fusão) dos dados do Delta com o Cache local
      if (reqParams.last_sync && hasLocalData) {
        const oldRows = previousData.rows;
        // Substitui os antigos pelos novos que vieram (ou adiciona no topo)
        const newIds = new Set(newRows.map(r => r.id));
        const keptOldRows = oldRows.filter(r => !newIds.has(r.id));
        
        // Os recém atualizados vão para o topo
        return {
          rows: [...newRows, ...keptOldRows],
          meta: newMeta || previousData.meta, // mantém o meta antigo se não veio um novo completo
        };
      }

      return {
        rows: newRows,
        meta: newMeta,
      };
    },
  });
}
