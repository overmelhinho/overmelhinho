// /var/www/frontend/src/hooks/useCampanhaMidias.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";

/**
 * Tipos
 */
export type CampanhaMidiaStatus =
  | "rascunho"
  | "em_revisao"
  | "aprovado"
  | "reprovado"
  | "publicado"
  | "arquivado";

export type CampanhaMidiaSlot = "desktop" | "mobile";

export type CampanhaMidia = {
  id: number;
  campanha_id: number;
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

function safeApiMessage(err: any) {
  return (
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    "Erro inesperado."
  );
}

function normalizeSlot(slot: any): CampanhaMidiaSlot {
  const s = String(slot ?? "").trim().toLowerCase();
  if (s === "desktop" || s === "mobile") return s as CampanhaMidiaSlot;
  throw new Error(`Slot inválido: "${slot}". Use "desktop" ou "mobile".`);
}

function normalizeStatusForCommit(
  status: any
): Exclude<CampanhaMidiaStatus, "publicado"> | undefined {
  if (status === undefined || status === null || status === "") return undefined;

  const s = String(status).trim().toLowerCase();

  // backend bloqueia commit-temp com "publicado"
  if (s === "publicado") {
    throw new Error('Status inválido para commit-temp: "publicado". Use rascunho/em_revisao/aprovado/reprovado/arquivado.');
  }

  const allowed: Array<Exclude<CampanhaMidiaStatus, "publicado">> = [
    "rascunho",
    "em_revisao",
    "aprovado",
    "reprovado",
    "arquivado",
  ];

  if (allowed.includes(s as any)) return s as any;

  throw new Error(`Status inválido para commit-temp: "${status}".`);
}

/**
 * ============================
 * GET /v1/campanhas/{campanha}/midias
 * ============================
 */
export function useCampanhaMidias(campanhaId?: number) {
  return useQuery({
    queryKey: ["campanhaMidias", campanhaId],
    enabled: !!campanhaId,
    queryFn: async () => {
      const { data } = await api.get(`/v1/campanhas/${campanhaId}/midias`);
      // backend retorna { data: [...] }
      return (data?.data ?? []) as CampanhaMidia[];
    },
  });
}

/**
 * ============================
 * GET /v1/campanhas/{campanha}/midias/ativas
 * ============================
 */
export function useCampanhaMidiasAtivas(campanhaId?: number) {
  return useQuery({
    queryKey: ["campanhaMidiasAtivas", campanhaId],
    enabled: !!campanhaId,
    queryFn: async () => {
      const { data } = await api.get(`/v1/campanhas/${campanhaId}/midias/ativas`);
      // backend retorna { data: { [tipo]: {desktop, mobile} } }
      return (data?.data ?? {}) as CampanhaMidiasAtivas;
    },
    staleTime: 1000 * 20,
  });
}

/**
 * ============================
 * POST /v1/campanhas/{campanha}/midias/commit-temp
 * ============================
 */
export type CommitCampanhaMidiaTempInput = {
  temp_path: string;
  tipo: string;
  slot: CampanhaMidiaSlot;
  status?: Exclude<CampanhaMidiaStatus, "publicado">;
  meta_json?: any;
};

export function useCommitCampanhaMidiaTemp(campanhaId: number) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CommitCampanhaMidiaTempInput) => {
      // ✅ blindagem final: slot/status sempre válidos
      const safePayload: CommitCampanhaMidiaTempInput = {
        ...payload,
        slot: normalizeSlot(payload.slot),
        status: normalizeStatusForCommit(payload.status),
      };

      const { data } = await api.post(
        `/v1/campanhas/${campanhaId}/midias/commit-temp`,
        safePayload
      );
      // backend retorna { success, data, url, dest_path }
      return data;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["campanhaMidias", campanhaId] });
      await qc.invalidateQueries({ queryKey: ["campanhaMidiasAtivas", campanhaId] });
    },
    onError: (e: any) => {
      console.error("COMMIT_CAMPANHA_MIDIA_TEMP_FAIL:", safeApiMessage(e));
    },
  });
}

/**
 * ============================
 * PATCH/PUT /v1/campanhas/{campanha}/midias/{midia}
 * ============================
 */
export type UpdateCampanhaMidiaInput = {
  status?: CampanhaMidiaStatus;
  approved?: boolean;
  meta_json?: any;
  comment?: string;
};

export function useUpdateCampanhaMidia(campanhaId: number, midiaId: number) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateCampanhaMidiaInput) => {
      const { data } = await api.patch(
        `/v1/campanhas/${campanhaId}/midias/${midiaId}`,
        payload
      );
      // backend retorna { success, data }
      return data;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["campanhaMidias", campanhaId] });
      await qc.invalidateQueries({ queryKey: ["campanhaMidiasAtivas", campanhaId] });
    },
    onError: (e: any) => {
      console.error("UPDATE_CAMPANHA_MIDIA_FAIL:", safeApiMessage(e));
    },
  });
}

/**
 * ============================
 * DELETE /v1/campanhas/{campanha}/midias/{midia}
 * (controller aceita {comment})
 * ============================
 */
export type ArchiveCampanhaMidiaInput = {
  comment?: string;
};

export function useArchiveCampanhaMidia(campanhaId: number, midiaId: number) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload?: ArchiveCampanhaMidiaInput) => {
      // axios delete com body: { data: payload }
      const { data } = await api.delete(
        `/v1/campanhas/${campanhaId}/midias/${midiaId}`,
        { data: payload ?? {} }
      );
      // backend retorna { success, data }
      return data;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["campanhaMidias", campanhaId] });
      await qc.invalidateQueries({ queryKey: ["campanhaMidiasAtivas", campanhaId] });
    },
    onError: (e: any) => {
      console.error("ARCHIVE_CAMPANHA_MIDIA_FAIL:", safeApiMessage(e));
    },
  });
}

/**
 * ============================
 * POST /v1/campanhas/{campanha}/midias/{midia}/ativar
 * ============================
 */
export type AtivarCampanhaMidiaInput = {
  slot: CampanhaMidiaSlot;
  comment?: string;
};

export function useAtivarCampanhaMidia(campanhaId: number, midiaId: number) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: AtivarCampanhaMidiaInput) => {
      const safePayload: AtivarCampanhaMidiaInput = {
        ...payload,
        slot: normalizeSlot(payload.slot),
      };

      const { data } = await api.post(
        `/v1/campanhas/${campanhaId}/midias/${midiaId}/ativar`,
        safePayload
      );
      return data;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["campanhaMidias", campanhaId] });
      await qc.invalidateQueries({ queryKey: ["campanhaMidiasAtivas", campanhaId] });
    },
    onError: (e: any) => {
      console.error("ATIVAR_CAMPANHA_MIDIA_FAIL:", safeApiMessage(e));
    },
  });
}
