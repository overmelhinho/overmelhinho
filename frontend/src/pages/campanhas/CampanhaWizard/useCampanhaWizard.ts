// /var/www/frontend/src/pages/campanhas/CampanhaWizard/useCampanhaWizard.ts
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import api from "@/services/api";

import { useClientesLite } from "@/hooks/useClientesLite";
import { useCidades } from "@/hooks/useCidades";
import {
  useCreateCampanha,
  useUpdateCampanha,
  useCampanhaDetalhe,
  CampanhaOrigem,
  CampanhaTipo,
  PlacementType,
  GLOBAL_PLACEMENTS,
  PlanoCampanha,
  FinanceiroStatus,
} from "@/hooks/useCampanhas";

import {
  normalizeClientes,
  normalizeCidades,
  parseKeywords,
  keywordLimitByPlano,
  toISODate,
} from "@/pages/campanhas/CampanhaCreate/utils/form";

// ✅ helpers de temp_path (evita 404 no copy)
import {
  extractTempPathFromPublicUrl,
  normalizeTempPath,
} from "@/pages/campanhas/CampanhaDetails/utils/media";

export type WizardKey = "basico" | "alcance" | "keywords" | "financeiro" | "midias";
export type CampanhaWizardMode = "create" | "edit";

export type CampanhaWizardFormState = {
  cliente_id: string;
  nome: string;
  tipo: CampanhaTipo;
  origem: "" | CampanhaOrigem;

  data_inicio: string;
  data_fim: string;

  cidades_ids: number[];
  placements: PlacementType[];
  plano: PlanoCampanha;

  keywords_text: string;

  financeiro_status: "" | FinanceiroStatus | string;
  financeiro_forma: string;
  financeiro_valor: string;
  financeiro_vencimento: string;
  financeiro_pago_em: string;
  financeiro_observacao: string;

  // mídia - temp upload + preview url
  midia_desktop_temp_path: string;
  midia_desktop_public_url: string;
  midia_desktop_name: string;

  midia_mobile_temp_path: string;
  midia_mobile_public_url: string;
  midia_mobile_name: string;

  // legado
  gerar_tickets: boolean;
  prioridade: "baixa" | "media" | "alta";
  due_at: string;
};

function scrollTopSmooth() {
  try {
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch {
    window.scrollTo(0, 0);
  }
}

/**
 * ✅ placements -> tipos aceitos no backend (campanha_midias.tipo)
 * Confirmados:
 * - banner_topo
 * - banner_keyword
 * - banner_segmento
 * - popup
 */
function mediaTiposFromPlacements(placements: PlacementType[]): string[] {
  const tipos = new Set<string>();

  for (const p of placements || []) {
    if (p === "HOME_TOP") tipos.add("banner_topo");
    if (p === "POPUP_GLOBAL") tipos.add("popup");
    if (p === "SEARCH_RESULT") tipos.add("banner_keyword");
    if (p === "SEGMENT_LISTING") tipos.add("banner_segmento");
  }

  return Array.from(tipos);
}

function resolveTempPath(tempPath?: string | null, publicUrl?: string | null): string | null {
  const a = normalizeTempPath(tempPath);
  if (a) return a;

  if (publicUrl) {
    const extracted = extractTempPathFromPublicUrl(publicUrl);
    const b = normalizeTempPath(extracted);
    if (b) return b;
  }

  return null;
}

function toKeywordsTextFromDetalhe(keywords: any): string {
  if (Array.isArray(keywords)) {
    return keywords
      .map((k: any) => String(k?.keyword_original ?? k?.keyword_normalizada ?? "").trim())
      .filter(Boolean)
      .join(", ");
  }
  if (Array.isArray((keywords as any)?.data)) {
    return (keywords as any).data
      .map((k: any) => String(k?.keyword_original ?? k?.keyword_normalizada ?? "").trim())
      .filter(Boolean)
      .join(", ");
  }
  if (typeof keywords === "string") return keywords;
  return "";
}

/**
 * ✅ Deriva placements a partir de tipos de mídia do backend (quando campanha.placements não existe)
 */
function placementsFromMidiaTipo(tipoRaw: any): PlacementType | null {
  const tipo = String(tipoRaw || "").trim().toLowerCase();

  if (tipo === "banner_topo") return "HOME_TOP";
  if (tipo === "popup" || tipo === "popup_global") return "POPUP_GLOBAL";
  if (tipo === "banner_keyword") return "SEARCH_RESULT";
  if (tipo === "banner_segmento") return "SEGMENT_LISTING";

  return null;
}



function normalizeFinanceiroStatusForForm(v: any): string {
  const raw = String(v ?? "").trim();
  if (!raw) return "";

  // backend -> frontend
  if (raw === "aguardando_pagamento") return "AGUARDANDO_PAGAMENTO";
  if (raw === "pago") return "PAGO";
  if (raw === "cortesia") return "CORTESIA";

  // já está no formato do frontend
  if (raw === "AGUARDANDO_PAGAMENTO" || raw === "PAGO" || raw === "CORTESIA") return raw;

  // fallback seguro (não inventa)
  return raw;
}



/**
 * ✅ Resolve placements vindo de diferentes formatos do backend,
 * sem inventar valores. Se não vier, tenta inferir via midias_ativas/midias.
 */
function resolvePlacementsFromDetalhe(detalhe: any): PlacementType[] {
  const camp = detalhe?.campanha ?? {};

  // 1) campos diretos
  const candidates = [
    camp?.placements,
    camp?.placement,
    camp?.alcance?.placements,
    camp?.alcance?.placement,
  ];
  for (const c of candidates) {
    if (Array.isArray(c)) return c as PlacementType[];
  }

  // 2) fallback: JSON string
  const raw = camp?.placements_json || camp?.placementsJson;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as PlacementType[];
    } catch {
      // ignora
    }
  }

  // 3) inferência via midias_ativas (é um Record<tipo, {desktop,mobile}>)
  const inferred = new Set<PlacementType>();

  const midiasAtivas = detalhe?.midias_ativas;
  if (midiasAtivas && typeof midiasAtivas === "object") {
    for (const k of Object.keys(midiasAtivas)) {
      const p = placementsFromMidiaTipo(k);
      if (p) inferred.add(p);
    }
  }

  // 4) inferência via midias list (cada item tem .tipo)
  const midias = detalhe?.midias;
  if (Array.isArray(midias)) {
    for (const m of midias) {
      const p = placementsFromMidiaTipo(m?.tipo);
      if (p) inferred.add(p);
    }
  }

  return Array.from(inferred);
}

export function useCampanhaWizard(params: { mode: CampanhaWizardMode; campanhaId?: number }) {
  const { mode, campanhaId } = params;

  // ----- Queries base (clientes/cidades)
  const [clienteSearch, setClienteSearch] = useState("");
  const [clienteQuery, setClienteQuery] = useState("");

  useEffect(() => {
    const t = window.setTimeout(() => setClienteQuery(clienteSearch.trim()), 250);
    return () => window.clearTimeout(t);
  }, [clienteSearch]);

  const { data: clientesData, isLoading: loadingClientes } = useClientesLite({
    page: 1,
    per_page: clienteQuery ? 20 : 50,
    lite: true,
    search: clienteQuery || undefined,
  });

  const clientes = useMemo(() => normalizeClientes(clientesData), [clientesData]);

  const { data: cidadesData, isLoading: loadingCidades } = useCidades();
  const cidades = useMemo(() => normalizeCidades(cidadesData), [cidadesData]);

  const [cidadeSearch, setCidadeSearch] = useState("");

  // ----- Create/Update
  const create = useCreateCampanha();
  const update = useUpdateCampanha(campanhaId || 0);

  // ----- Detalhe (para EDIT)
  const detalhe = useCampanhaDetalhe(mode === "edit" ? campanhaId : undefined);

  // ----- State Wizard
  const [activeKey, setActiveKey] = useState<WizardKey>("basico");

  const [form, setForm] = useState<CampanhaWizardFormState>({
    cliente_id: "",
    nome: "",
    tipo: "banner",
    origem: "",

    data_inicio: "",
    data_fim: "",

    cidades_ids: [],
    placements: [],
    plano: "basico",

    keywords_text: "",

    financeiro_status: "",
    financeiro_forma: "",
    financeiro_valor: "",
    financeiro_vencimento: "",
    financeiro_pago_em: "",
    financeiro_observacao: "",

    midia_desktop_temp_path: "",
    midia_desktop_public_url: "",
    midia_desktop_name: "",

    midia_mobile_temp_path: "",
    midia_mobile_public_url: "",
    midia_mobile_name: "",

    gerar_tickets: true,
    prioridade: "media",
    due_at: "",
  });

  // ----- Hydrate form no EDIT
  useEffect(() => {
    if (mode !== "edit") return;
    if (!detalhe.data) return;

    const d = detalhe.data as any;
    const camp = d?.campanha ?? {};
    const cidadesArr = Array.isArray(d?.cidades) ? d.cidades : [];
    const cidades_ids = cidadesArr
      .map((x: any) => Number(x?.id))
      .filter((n: any) => Number.isFinite(n));

    const placements = resolvePlacementsFromDetalhe(d);

    const planoRaw =
      (camp as any)?.plano ?? (camp as any)?.plano_nome ?? (camp as any)?.planoNome;
    const plano = (planoRaw ? String(planoRaw) : "basico") as PlanoCampanha;

    setForm((prev) => ({
      ...prev,

      cliente_id: String(camp?.cliente_id ?? ""),
      nome: String(camp?.nome ?? ""),
      tipo: (camp?.tipo ?? "banner") as CampanhaTipo,
      origem: (camp?.origem ?? "") as any,

      data_inicio: String(camp?.data_inicio ?? ""),
      data_fim: String(camp?.data_fim ?? ""),

      cidades_ids,

      placements,
      plano,

      keywords_text: toKeywordsTextFromDetalhe(d?.keywords),

      financeiro_status: normalizeFinanceiroStatusForForm(camp?.financeiro_status),
      financeiro_forma: String(camp?.financeiro_forma ?? ""),
      financeiro_valor:
        camp?.financeiro_valor !== null && camp?.financeiro_valor !== undefined
          ? String(camp.financeiro_valor)
          : "",
      financeiro_vencimento: String(camp?.financeiro_vencimento ?? ""),
      financeiro_pago_em: String(camp?.financeiro_pago_em ?? ""),
      financeiro_observacao: String((camp as any)?.financeiro_observacao ?? ""),

      // mídia temp começa vazio (edit: opcional anexar novas)
      midia_desktop_temp_path: "",
      midia_desktop_public_url: "",
      midia_desktop_name: "",
      midia_mobile_temp_path: "",
      midia_mobile_public_url: "",
      midia_mobile_name: "",
    }));
  }, [mode, detalhe.data]);

  const clienteIdNum = useMemo(() => Number(form.cliente_id || 0), [form.cliente_id]);

  const clienteLabel = useMemo(() => {
    const c = (clientes as any[]).find((x: any) => x.id === clienteIdNum);
    if (!c) return form.cliente_id ? `Cliente #${form.cliente_id}` : "";
    return c.nome_fantasia || c.razao_social || `Cliente #${c.id}`;
  }, [clientes, clienteIdNum, form.cliente_id]);

  const filteredClientes = useMemo(() => (clientes as any[]) ?? [], [clientes]);

  const filteredCidades = useMemo(() => {
    const q = cidadeSearch.trim().toLowerCase();
    if (!q) return cidades as any[];
    return (cidades as any[]).filter((c) =>
      `${c.nome} ${c.uf || ""}`.toLowerCase().includes(q)
    );
  }, [cidades, cidadeSearch]);

  const hasGlobalPlacement = useMemo(
    () => form.placements.some((p) => GLOBAL_PLACEMENTS.includes(p)),
    [form.placements]
  );

  const keywordsLimit = useMemo(() => keywordLimitByPlano(form.plano), [form.plano]);

  const keywordsParsed = useMemo(() => {
    return parseKeywords(form.keywords_text).slice(0, keywordsLimit);
  }, [form.keywords_text, keywordsLimit]);

  function goStep(key: WizardKey) {
    setActiveKey(key);
    scrollTopSmooth();
  }

  const stepOrder: WizardKey[] = ["basico", "alcance", "keywords", "financeiro", "midias"];
  const stepIndex = useMemo(() => stepOrder.indexOf(activeKey) + 1, [activeKey]);
  const stepCount = stepOrder.length;

  function next() {
    const idx = stepOrder.indexOf(activeKey);
    if (idx < 0) return;
    const nextKey = stepOrder[Math.min(stepOrder.length - 1, idx + 1)];
    goStep(nextKey);
  }

  function prev() {
    const idx = stepOrder.indexOf(activeKey);
    if (idx <= 0) return;
    const prevKey = stepOrder[Math.max(0, idx - 1)];
    goStep(prevKey);
  }

  function onPatch(patch: Partial<CampanhaWizardFormState>) {
    setForm((f) => ({ ...f, ...patch }));
  }

  function togglePlacement(p: PlacementType, checked: boolean) {
    setForm((f) => {
      const next = new Set(f.placements);
      if (checked) next.add(p);
      else next.delete(p);

      const arr = Array.from(next);
      const isGlobal = arr.some((x) => GLOBAL_PLACEMENTS.includes(x));
      return { ...f, placements: arr, cidades_ids: isGlobal ? [] : f.cidades_ids };
    });
  }

  function toggleCidade(id: number, checked: boolean) {
    setForm((f) => {
      const next = new Set(f.cidades_ids);
      if (checked) next.add(id);
      else next.delete(id);
      return { ...f, cidades_ids: Array.from(next) };
    });
  }

  function setTempMedia(
    slot: "desktop" | "mobile",
    tempPath: string | null,
    publicUrl: string | null,
    fileName: string | null
  ) {
    setForm((f) => {
      if (slot === "desktop") {
        return {
          ...f,
          midia_desktop_temp_path: tempPath || "",
          midia_desktop_public_url: publicUrl || "",
          midia_desktop_name: fileName || "",
        };
      }
      return {
        ...f,
        midia_mobile_temp_path: tempPath || "",
        midia_mobile_public_url: publicUrl || "",
        midia_mobile_name: fileName || "",
      };
    });
  }

  async function commitMediaIfAny(targetCampanhaId: number) {
    const tipos = mediaTiposFromPlacements(form.placements);
    if (!tipos.length) return;

    const desktopTemp = resolveTempPath(form.midia_desktop_temp_path, form.midia_desktop_public_url);
    const mobileTemp = resolveTempPath(form.midia_mobile_temp_path, form.midia_mobile_public_url);

    if (!desktopTemp && !mobileTemp) return;

    const jobs: Array<Promise<any>> = [];

    for (const tipo of tipos) {
      if (desktopTemp) {
        jobs.push(
          api.post(`/v1/campanhas/${targetCampanhaId}/midias/commit-temp`, {
            temp_path: desktopTemp,
            tipo,
            slot: "desktop",
            status: "rascunho",
            meta_json: {
              original_name: form.midia_desktop_name || "desktop",
              placement_tipos: tipos,
              source: "campanha-wizard",
              mode,
            },
          })
        );
      }

      if (mobileTemp) {
        jobs.push(
          api.post(`/v1/campanhas/${targetCampanhaId}/midias/commit-temp`, {
            temp_path: mobileTemp,
            tipo,
            slot: "mobile",
            status: "rascunho",
            meta_json: {
              original_name: form.midia_mobile_name || "mobile",
              placement_tipos: tipos,
              source: "campanha-wizard",
              mode,
            },
          })
        );
      }
    }

    const results = await Promise.allSettled(jobs);
    const failures = results.filter((r) => r.status === "rejected") as PromiseRejectedResult[];

    if (failures.length) {
      console.error("commit-temp failures:", failures.map((f) => (f as any)?.reason));
      toast.error("Houve falha ao anexar algumas mídias (veja o console).");
    }
  }

  // ---- checklist e validação
  const checklist = useMemo(() => {
    const items: Array<{ key: string; label: string; ok: boolean; hint: string; optional?: boolean }> = [
      { key: "cliente", label: "Cliente", ok: !!form.cliente_id, hint: "Selecione um cliente." },
      { key: "nome", label: "Nome", ok: !!form.nome.trim(), hint: "Defina um nome claro." },
      { key: "periodo", label: "Período", ok: !!(form.data_inicio && form.data_fim), hint: "Escolha início e fim." },
      { key: "placements", label: "Exibição", ok: form.placements.length > 0, hint: "Selecione pelo menos 1." },
      {
        key: "cidades",
        label: "Cidades",
        ok: hasGlobalPlacement || form.cidades_ids.length > 0,
        hint: hasGlobalPlacement ? "Global não usa cidades." : "Selecione ao menos 1 cidade.",
      },
      { key: "financeiro", label: "Financeiro", ok: !!String(form.financeiro_status || "").trim(), hint: "Defina o status financeiro." },
      { key: "midias", label: "Mídias (opcional)", ok: true, hint: "Opcional: envie criativos desktop/mobile.", optional: true },
    ];

    const required = items.filter((i) => !i.optional);
    const done = required.filter((i) => i.ok).length;
    const pct = Math.round((done / required.length) * 100);
    const nextHint = required.find((i) => !i.ok)?.hint || "Tudo certo. Você pode salvar.";

    return { items, done, total: required.length, pct, nextHint };
  }, [form, hasGlobalPlacement]);

  const stepValid = useMemo(() => {
    const s1 = !!form.cliente_id && !!form.nome.trim() && !!form.tipo && !!form.plano;
    const s2 =
      !!form.data_inicio &&
      !!form.data_fim &&
      form.placements.length > 0 &&
      (hasGlobalPlacement || form.cidades_ids.length > 0);
    const s3 = true;
    const s4 = !!String(form.financeiro_status || "").trim();
    const s5 = true;
    return { s1, s2, s3, s4, s5 };
  }, [form, hasGlobalPlacement]);

  const nextDisabled = useMemo(() => {
    if (activeKey === "basico") return !stepValid.s1;
    if (activeKey === "alcance") return !stepValid.s2;
    if (activeKey === "financeiro") return !stepValid.s4;
    return false;
  }, [activeKey, stepValid]);

  const canSubmit =
    !!form.cliente_id &&
    !!form.nome.trim() &&
    !!form.tipo &&
    !!form.data_inicio &&
    !!form.data_fim &&
    form.placements.length > 0 &&
    (!!hasGlobalPlacement || form.cidades_ids.length > 0) &&
    !!form.plano &&
    !!String(form.financeiro_status || "").trim() &&
    !(mode === "create" ? create.isPending : update.isPending);

  const busy = mode === "create" ? create.isPending : update.isPending;

  async function onSubmit(): Promise<{ id: number } | null> {
    if (!canSubmit) {
      toast.error("Complete os campos obrigatórios antes de salvar.");
      return null;
    }

    const payload: any = {
      cliente_id: Number(form.cliente_id),
      nome: form.nome.trim(),
      tipo: form.tipo,
      origem: form.origem ? (form.origem as CampanhaOrigem) : null,
      data_inicio: toISODate(form.data_inicio),
      data_fim: toISODate(form.data_fim),

      placements: form.placements,
      plano: form.plano,

      cidades_ids: hasGlobalPlacement ? undefined : form.cidades_ids,
      keywords: keywordsParsed,

      financeiro: {
        status: String(form.financeiro_status || "").trim() || undefined,
        forma: form.financeiro_forma || undefined,
        valor: form.financeiro_valor ? Number(form.financeiro_valor) : undefined,
        vencimento: form.financeiro_vencimento || undefined,
        pago_em: form.financeiro_pago_em || undefined,
        observacao: form.financeiro_observacao || undefined,
      },

      gerar_tickets: !!form.gerar_tickets,
      prioridade: form.prioridade,
      due_at: form.due_at || undefined,
    };

    if (mode === "create") {
      const t = toast.loading("Criando campanha...");
      try {
        const res = await create.mutateAsync(payload);
        toast.dismiss(t);

        const id = (res as any)?.id;
        if (id) {
          const t2 = toast.loading("Anexando mídias...");
          try {
            await commitMediaIfAny(id);
            toast.dismiss(t2);
            toast.success("Campanha criada.");
          } catch (e) {
            console.error("commitMediaIfAny failed:", e);
            toast.dismiss(t2);
            toast.success("Campanha criada (mídias não anexadas).");
          }
          return { id };
        }

        toast.success("Campanha criada.");
        return null;
      } catch (e: any) {
        toast.dismiss(t);
        toast.error(e?.response?.data?.message || "Erro ao criar campanha.");
        return null;
      }
    }

    // mode === "edit"
    const t = toast.loading("Salvando alterações...");
    try {
      await update.mutateAsync(payload);
      toast.dismiss(t);

      if (campanhaId) {
        const t2 = toast.loading("Anexando mídias (se houver)...");
        try {
          await commitMediaIfAny(campanhaId);
          toast.dismiss(t2);
          toast.success("Campanha atualizada.");
        } catch (e) {
          console.error("commitMediaIfAny (edit) failed:", e);
          toast.dismiss(t2);
          toast.success("Campanha atualizada (mídias não anexadas).");
        }
        return { id: campanhaId };
      }

      toast.success("Campanha atualizada.");
      return null;
    } catch (e: any) {
      toast.dismiss(t);

      const status = e?.response?.status;
      if (status === 501) {
        toast.error("Atualização ainda não disponível (API retornou 501: Em breve).");
        return null;
      }

      toast.error(e?.response?.data?.message || "Erro ao atualizar campanha.");
      return null;
    }
  }

  return {
    mode,
    campanhaId,
    busy,

    clientes,
    cidades,
    loadingClientes,
    loadingCidades,

    detalhe,

    activeKey,
    setActiveKey,
    goStep,
    next,
    prev,
    stepIndex,
    stepCount,

    form,
    setForm,
    onPatch,
    togglePlacement,
    toggleCidade,
    setTempMedia,

    clienteSearch,
    setClienteSearch,
    cidadeSearch,
    setCidadeSearch,

    clienteLabel,
    filteredClientes,
    filteredCidades,
    hasGlobalPlacement,
    keywordsLimit,
    keywordsParsed,
    checklist,
    stepValid,
    nextDisabled,
    canSubmit,

    onSubmit,
  };
}
