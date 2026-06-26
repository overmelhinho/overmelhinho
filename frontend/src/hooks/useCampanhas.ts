// /var/www/frontend/src/hooks/useCampanhas.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";

/**
 * ============================
 * Tipos (Campanhas)
 * ============================
 */
export type CampanhaStatus = "rascunho" | "ativa" | "encerrada" | "cancelada";
export type CampanhaTipo =
  | "banner"
  | "banner_home"
  | "banner_busca"
  | "banner_listagem"
  | "popup"
  | "destaque"
  | "combo";
export type CampanhaOrigem = "venda_nova" | "renovacao" | "upgrade";

/**
 * ============================
 * Tipos NOVOS (Doc Oficial)
 * (mantidos aqui para não quebrar o CampanhaCreate.tsx)
 * ============================
 */

/**
 * Placements que o algoritmo pode usar.
 * Se você adicionar novos no backend, basta adicionar aqui também.
 */
export type PlacementType =
  | "SEARCH_RESULT"
  | "SEGMENT_LISTING"
  | "HOME_TOP"
  | "POPUP_GLOBAL";

/**
 * Placements considerados "globais" (não exigem cidades no cadastro).
 */
export const GLOBAL_PLACEMENTS: PlacementType[] = ["HOME_TOP", "POPUP_GLOBAL"];

/**
 * Plano comercial (impacta limites e elegibilidade no algoritmo).
 */
export type PlanoCampanha = "basico" | "intermediario" | "premium";

/**
 * Status financeiro “oficial” do frontend.
 * No backend/tabela costuma ser snake_case minúsculo.
 */
export type FinanceiroStatus = "AGUARDANDO_PAGAMENTO" | "PAGO" | "CORTESIA";

/**
 * ============================
 * Modelos
 * ============================
 */
export type Campanha = {
  id: number;
  cliente_id: number;
  nome: string;
  tipo: CampanhaTipo;
  origem?: CampanhaOrigem | null;
  status: CampanhaStatus;

  data_inicio: string;
  data_fim: string;

  valor_total: number;

  created_at?: string;
  updated_at?: string;

  cliente?: {
    id: number;
    nome_fantasia?: string | null;
    razao_social?: string | null;
  };
};

/**
 * Paginação padrão Laravel
 */
export type Paginated<T> = {
  current_page: number;
  data: T[];
  from: number | null;
  to: number | null;
  last_page: number;
  per_page: number;
  total: number;
};

/**
 * Parâmetros de listagem
 */
export type CampanhasQueryParams = {
  cliente_id?: number | string;
  status?: CampanhaStatus;
  tipo?: CampanhaTipo | string;
  page?: number;
  per_page?: number;
};

/**
 * Helpers
 */
function buildParams(params?: CampanhasQueryParams) {
  const p: Record<string, any> = {};
  if (!params) return p;

  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    p[k] = v;
  }

  return p;
}

/**
 * Normaliza status financeiro do frontend (UPPER) para o padrão do backend (snake_case lower).
 * Não quebra se o backend aceitar qualquer string — mas melhora consistência do dado gravado.
 */
function normalizeFinanceiroStatus(v?: string | null): string | undefined {
  const raw = String(v || "").trim();
  if (!raw) return undefined;

  // se já parece estar no padrão do backend, mantém
  const lower = raw.toLowerCase();

  // mapeia o que o CampanhaCreate está enviando hoje
  if (raw === "AGUARDANDO_PAGAMENTO") return "aguardando_pagamento";
  if (raw === "PAGO") return "pago";
  if (raw === "CORTESIA") return "cortesia";

  // fallback: tenta apenas lowercase (sem inventar regra)
  return lower;
}

/**
 * ============================
 * LISTAGEM DE CAMPANHAS
 * GET /v1/campanhas
 * ============================
 */
export function useCampanhas(params: CampanhasQueryParams = {}) {
  return useQuery({
    queryKey: ["campanhas", params],
    queryFn: async () => {
      const { data } = await api.get("/v1/campanhas", {
        params: buildParams(params),
      });

      return data.data as Paginated<Campanha>;
    },
  });
}

/**
 * ============================
 * DETALHE DA CAMPANHA (LEGADO)
 * GET /v1/campanhas/{id}
 *
 * ATENÇÃO:
 * Seu backend atual retorna um objeto mais rico (campanha, cidades, midias, midias_ativas, etc).
 * Este hook foi mantido igual para não quebrar telas antigas que esperam `Campanha`.
 * Para usar o payload completo, use `useCampanhaDetalhe` abaixo.
 * ============================
 */
export function useCampanha(id?: number | string) {
  return useQuery({
    queryKey: ["campanha", id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get(`/v1/campanhas/${id}`);
      return data.data as Campanha;
    },
  });
}

/**
 * ============================
 * DETALHE COMPLETO DA CAMPANHA (NOVO / RECOMENDADO)
 * GET /v1/campanhas/{id}
 * ============================
 */

export type CampanhaCidade = { id: number; nome: string; uf?: string | null };
export type CampanhaSegmento = { id: number; nome: string };
export type CampanhaKeyword = { id: number; keyword_original: string; keyword_normalizada: string };

// Tipagem mínima aqui pra evitar dependência circular com useCampanhaMidias.ts
export type CampanhaMidiaStatus =
  | "rascunho"
  | "em_revisao"
  | "aprovado"
  | "reprovado"
  | "publicado"
  | "arquivado";

export type CampanhaMidia = {
  id: number;
  campanha_id?: number;
  tipo: string;
  versao: number;
  status: CampanhaMidiaStatus;
  desktop_url?: string | null;
  mobile_url?: string | null;
  meta_json?: any;
  created_by?: number | null;
  approved_by?: number | null;
  created_at?: string;
  updated_at?: string;
};

export type CampanhaMidiasAtivas = Record<
  string,
  {
    desktop: CampanhaMidia | null;
    mobile: CampanhaMidia | null;
  }
>;

export type CampanhaTicketLite = {
  id: number;
  setor?: string | null;
  status?: string | null;
  titulo?: string | null;
  prioridade?: string | null;
  assignee_id?: number | null;
  due_at?: string | null;
  created_at?: string | null;
};

export type CampanhaDetalheResponse = {
  campanha: any; // o backend retorna c.* + cliente_nome etc; mantemos "any" pra não quebrar
  cidades: CampanhaCidade[];
  segmentos: CampanhaSegmento[];
  keywords: CampanhaKeyword[];
  midias: CampanhaMidia[];
  midias_ativas: CampanhaMidiasAtivas;
  tickets: CampanhaTicketLite[];
};

export function useCampanhaDetalhe(id?: number | string) {
  return useQuery({
    queryKey: ["campanhaDetalhe", id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get(`/v1/campanhas/${id}`);
      // backend retorna { data: { campanha, cidades, segmentos, keywords, midias, midias_ativas, tickets } }
      return (data?.data ?? null) as CampanhaDetalheResponse;
    },
  });
}

/**
 * ============================
 * CRIAR CAMPANHA
 * POST /v1/campanhas
 * ============================
 */
export type CreateCampanhaInput = {
  cliente_id: number;
  nome: string;
  tipo: CampanhaTipo;
  origem?: CampanhaOrigem | null;
  data_inicio: string;
  data_fim: string;

  /**
   * IMPORTANTE:
   * Pelo backend atual (CampanhaRequest), cidades_ids é required.
   * Pelo fluxo novo (placements globais), cidades_ids pode ser omitido.
   *
   * Para não quebrar o CampanhaCreate.tsx (que às vezes manda undefined),
   * aqui deixamos opcional.
   */
  cidades_ids?: number[];

  keywords?: string[];

  // doc oficial (novo) - backend pode ignorar se não implementado
  placements?: PlacementType[];
  plano?: PlanoCampanha;

  financeiro?: {
    status?: string; // aceitar qualquer string (vamos normalizar o caso comum)
    forma?: string;
    valor?: number;
    vencimento?: string;
    pago_em?: string;
    observacao?: string;
  };

  gerar_tickets?: boolean;
  prioridade?: "baixa" | "media" | "alta";
  due_at?: string;
};

export type CreateCampanhaResponse = {
  id: number;
};

export function useCreateCampanha() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateCampanhaInput) => {
      // Normalização leve sem quebrar nada
      const normalized: CreateCampanhaInput = {
        ...payload,
        financeiro: payload.financeiro
          ? {
              ...payload.financeiro,
              status: normalizeFinanceiroStatus(payload.financeiro.status) ?? payload.financeiro.status,
            }
          : payload.financeiro,
      };

      const { data } = await api.post("/v1/campanhas", normalized);
      // backend retorna { data: { id } }
      return (data?.data ?? null) as CreateCampanhaResponse;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["campanhas"] });
    },
  });
}

/**
 * ============================
 * ATUALIZAR CAMPANHA
 * PUT/PATCH /v1/campanhas/{id}
 * ============================
 */
export type UpdateCampanhaInput = Partial<CreateCampanhaInput> & {
  status?: CampanhaStatus;
};

export function useUpdateCampanha(id: number) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateCampanhaInput) => {
      const normalized: UpdateCampanhaInput = {
        ...payload,
        financeiro: payload.financeiro
          ? {
              ...payload.financeiro,
              status: normalizeFinanceiroStatus(payload.financeiro.status) ?? payload.financeiro.status,
            }
          : payload.financeiro,
      };

      const { data } = await api.put(`/v1/campanhas/${id}`, normalized);
      return data.data as Campanha;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["campanhas"] });
      await qc.invalidateQueries({ queryKey: ["campanha", id] });
      await qc.invalidateQueries({ queryKey: ["campanhaDetalhe", id] });
    },
  });
}

/**
 * ============================
 * AÇÕES ESPECÍFICAS
 * ============================
 */

// Encerrar campanha
export function useEncerrarCampanha(id: number) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/v1/campanhas/${id}/encerrar`);
      return data.data as Campanha;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["campanhas"] });
      await qc.invalidateQueries({ queryKey: ["campanha", id] });
      await qc.invalidateQueries({ queryKey: ["campanhaDetalhe", id] });
    },
  });
}

// Renovar campanha
export function useRenovarCampanha(id: number) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/v1/campanhas/${id}/renovar`);
      return data.data as Campanha;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["campanhas"] });
      await qc.invalidateQueries({ queryKey: ["campanha", id] });
      await qc.invalidateQueries({ queryKey: ["campanhaDetalhe", id] });
    },
  });
}

// Excluir campanha
export function useDeleteCampanha() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/v1/campanhas/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campanhas"] });
      toast.success("Campanha excluída com sucesso.");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Erro ao excluir campanha.");
    },
  });
}
