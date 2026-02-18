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

    // ✅ React Query v4
    keepPreviousData: true,

    queryFn: async () => {
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

      const { data } = await api.get("/v1/clientes", { params: reqParams });

      // Formato padrão Laravel Resource:
      // { data: [...], meta: {...}, links: {...} }

      if (Array.isArray(data?.data)) {
        return {
          rows: data.data as ClienteLiteOption[],
          meta: data?.meta ?? null,
        };
      }

      // fallback defensivo
      if (data?.data && Array.isArray(data.data.data)) {
        return {
          rows: data.data.data as ClienteLiteOption[],
          meta: data.data?.meta ?? data?.meta ?? null,
        };
      }

      return {
        rows: [],
        meta: data?.meta ?? null,
      };
    },
  });
}
