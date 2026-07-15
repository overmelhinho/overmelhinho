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

      // 🔒 OFFLINE-FIRST: Interceptar se sem internet
      if (!navigator.onLine) {
        try {
          const { get } = await import('idb-keyval');
          const offlineDb = (await get<ClienteLiteOption[]>('offline_clientes_db')) || [];
          
          // 1. Filtragem local
          let filteredRows = offlineDb;
          
          if (query) {
            const qLower = query.toLowerCase();
            filteredRows = filteredRows.filter(r => 
              (r.nome_fantasia?.toLowerCase() || "").includes(qLower) ||
              (r.razao_social?.toLowerCase() || "").includes(qLower) ||
              (r.cpf_cnpj || "").includes(qLower)
            );
          }
          if (tipo_cliente) {
            filteredRows = filteredRows.filter(r => r.tipo_cliente === tipo_cliente);
          }
          if (status_assinatura) {
            filteredRows = filteredRows.filter(r => r.status_assinatura === status_assinatura);
          }
          if (typeof possui_publicidade === "boolean") {
            filteredRows = filteredRows.filter(r => r.possui_publicidade === possui_publicidade);
          }
          
          // 2. Ordenação padrão (por ex. pelo nome, id)
          filteredRows.sort((a, b) => (a.nome_fantasia || "").localeCompare(b.nome_fantasia || ""));
          
          // 3. Paginação local
          const total = filteredRows.length;
          const startIndex = (page - 1) * per_page;
          const paginatedRows = filteredRows.slice(startIndex, startIndex + per_page);
          
          return {
            rows: paginatedRows,
            meta: {
              current_page: page,
              per_page: per_page,
              total: total,
              last_page: Math.ceil(total / per_page),
            }
          };
        } catch (err) {
          console.error("Falha ao ler banco offline local:", err);
          return { rows: [], meta: null };
        }
      }

      // 🔒 FASE 5: Delta Sync (Online)
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

      // Atualiza o horário da última sincronização se for a listagem padrão (obsoleto pelo novo SyncEngine, mas mantido p/ redundância)
      if (isDefaultList && !reqParams.last_sync) {
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
        const newIds = new Set(newRows.map(r => r.id));
        const keptOldRows = oldRows.filter(r => !newIds.has(r.id));
        
        return {
          rows: [...newRows, ...keptOldRows],
          meta: newMeta || previousData.meta,
        };
      }

      return {
        rows: newRows,
        meta: newMeta,
      };
    },
  });
}
