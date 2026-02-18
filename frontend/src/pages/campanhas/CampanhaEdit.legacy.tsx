// /var/www/frontend/src/pages/campanhas/CampanhaEdit.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import Skeleton from "@/components/ui/skeleton";
import api from "@/services/api";

import { useClientesLite } from "@/hooks/useClientesLite";
import { useCidades } from "@/hooks/useCidades";

import {
  useCampanha,
  useUpdateCampanha,
  CampanhaTipo,
  CampanhaOrigem,
  PlacementType,
  GLOBAL_PLACEMENTS,
  PlanoCampanha,
  FinanceiroStatus,
} from "@/hooks/useCampanhas";

// UI/Wizard (reuso do Create)
import CampanhaCreateHeader from "@/pages/campanhas/CampanhaCreate/components/CampanhaCreateHeader";
import SidebarInteligente from "@/pages/campanhas/CampanhaCreate/components/SidebarInteligente";
import WizardStepper, { WizardStep } from "@/pages/campanhas/CampanhaCreate/components/WizardStepper";
import StickyActionBar from "@/pages/campanhas/CampanhaCreate/components/StickyActionBar";
import AutomacaoLegado from "@/pages/campanhas/CampanhaCreate/components/AutomacaoLegado";

// Steps (reuso)
import Step1Basico from "@/pages/campanhas/CampanhaCreate/steps/Step1Basico";
import Step2Alcance from "@/pages/campanhas/CampanhaCreate/steps/Step2Alcance";
import Step3Keywords from "@/pages/campanhas/CampanhaCreate/steps/Step3Keywords";
import Step4Financeiro from "@/pages/campanhas/CampanhaCreate/steps/Step4Financeiro";
import Step5Midias from "@/pages/campanhas/CampanhaCreate/steps/Step5Midias";

import {
  normalizeClientes,
  normalizeCidades,
  parseKeywords,
  keywordLimitByPlano,
  toISODate,
} from "@/pages/campanhas/CampanhaCreate/utils/form";

// ✅ helpers já validados
import { extractTempPathFromPublicUrl, normalizeTempPath } from "@/pages/campanhas/CampanhaDetails/utils/media";

type WizardKey = "basico" | "alcance" | "keywords" | "financeiro" | "midias";

export type CampanhaEditFormState = {
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

  // mídia (wizard)
  midia_desktop_temp_path: string;
  midia_desktop_public_url: string;
  midia_desktop_name: string;

  midia_mobile_temp_path: string;
  midia_mobile_public_url: string;
  midia_mobile_name: string;

  // legado (mantém no payload se existir no backend)
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
 * placements -> tipos aceitos no backend (campanha_midias.tipo)
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

export default function CampanhaEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const campanhaId = useMemo(() => (id ? Number(id) : 0), [id]);

  const { data: campanha, isLoading, isError } = useCampanha(campanhaId);
  const update = useUpdateCampanha(campanhaId);

  // clientes (mesmo padrão do create: search com debounce)
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

  const [activeKey, setActiveKey] = useState<WizardKey>("basico");

  const [form, setForm] = useState<CampanhaEditFormState>({
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

  // hidrata form quando campanha carregar
  useEffect(() => {
    if (!campanha) return;

    const financeiro = (campanha as any)?.financeiro || null;

    const cidadesRaw =
      (campanha as any)?.cidades ||
      (campanha as any)?.cidades_atendidas ||
      [];

    const cidades_ids = Array.isArray(cidadesRaw)
      ? cidadesRaw.map((x: any) => Number(x?.id ?? x)).filter((n: any) => Number.isFinite(n))
      : [];

    const placementsRaw = (campanha as any)?.placements || [];
    const placements = Array.isArray(placementsRaw) ? placementsRaw : [];

    const plano = ((campanha as any)?.plano ?? "basico") as PlanoCampanha;

    const keywords = (campanha as any)?.keywords || [];
    const keywords_text = Array.isArray(keywords)
      ? keywords.map((k: any) => k?.keyword_original ?? k?.keyword_normalizada ?? String(k)).filter(Boolean).join(", ")
      : typeof keywords === "string"
      ? keywords
      : "";

    setForm((f) => ({
      ...f,
      cliente_id: String((campanha as any)?.cliente_id ?? ""),
      nome: String((campanha as any)?.nome ?? ""),
      tipo: ((campanha as any)?.tipo ?? "banner") as CampanhaTipo,
      origem: ((campanha as any)?.origem ?? "") as any,
      data_inicio: String((campanha as any)?.data_inicio ?? ""),
      data_fim: String((campanha as any)?.data_fim ?? ""),
      cidades_ids,
      placements,
      plano,

      keywords_text,

      financeiro_status: String(financeiro?.status ?? (campanha as any)?.financeiro_status ?? ""),
      financeiro_forma: String(financeiro?.forma ?? (campanha as any)?.financeiro_forma ?? ""),
      financeiro_valor:
        financeiro?.valor !== undefined && financeiro?.valor !== null
          ? String(financeiro.valor)
          : String((campanha as any)?.financeiro_valor ?? ""),
      financeiro_vencimento: String(financeiro?.vencimento ?? (campanha as any)?.financeiro_vencimento ?? ""),
      financeiro_pago_em: String(financeiro?.pago_em ?? (campanha as any)?.financeiro_pago_em ?? ""),
      financeiro_observacao: String(financeiro?.observacao ?? (campanha as any)?.financeiro_observacao ?? ""),
    }));
  }, [campanha]);

  const clienteIdNum = useMemo(() => Number(form.cliente_id || 0), [form.cliente_id]);

  const clienteLabel = useMemo(() => {
    const c = (clientes as any[]).find((x: any) => x.id === clienteIdNum);
    if (!c) return form.cliente_id ? `Cliente #${form.cliente_id}` : "";
    return c.nome_fantasia || c.razao_social || `Cliente #${c.id}`;
  }, [clientes, clienteIdNum, form.cliente_id]);

  const filteredClientes = useMemo(() => (clientes as any[]) ?? [], [clientes]);

  const hasGlobalPlacement = useMemo(
    () => form.placements.some((p) => GLOBAL_PLACEMENTS.includes(p)),
    [form.placements]
  );

  const keywordsLimit = useMemo(() => keywordLimitByPlano(form.plano), [form.plano]);

  const keywordsParsed = useMemo(() => {
    return parseKeywords(form.keywords_text).slice(0, keywordsLimit);
  }, [form.keywords_text, keywordsLimit]);

  const filteredCidades = useMemo(() => {
    const q = cidadeSearch.trim().toLowerCase();
    if (!q) return cidades as any[];
    return (cidades as any[]).filter((c) => `${c.nome} ${c.uf || ""}`.toLowerCase().includes(q));
  }, [cidades, cidadeSearch]);

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

  // checklist semelhante ao create
  const checklist = useMemo(() => {
    const items: Array<{ key: string; label: string; ok: boolean; hint: string; optional?: boolean }> = [
      { key: "cliente", label: "Cliente", ok: !!form.cliente_id, hint: "Selecione um cliente." },
      { key: "nome", label: "Nome", ok: !!form.nome.trim(), hint: "Defina um nome claro." },
      { key: "periodo", label: "Período", ok: !!(form.data_inicio && form.data_fim), hint: "Escolha início e fim." },
      { key: "placements", label: "Placements", ok: form.placements.length > 0, hint: "Selecione pelo menos 1." },
      {
        key: "cidades",
        label: "Cidades",
        ok: hasGlobalPlacement || form.cidades_ids.length > 0,
        hint: hasGlobalPlacement ? "Global não usa cidades." : "Selecione ao menos 1 cidade.",
      },
      { key: "financeiro", label: "Financeiro", ok: !!String(form.financeiro_status || "").trim(), hint: "Defina o status financeiro." },
      { key: "midias", label: "Mídias (opcional)", ok: true, hint: "Opcional: envie criativos.", optional: true },
    ];

    const required = items.filter((i) => !i.optional);
    const done = required.filter((i) => i.ok).length;
    const pct = Math.round((done / required.length) * 100);
    const nextHint = required.find((i) => !i.ok)?.hint || "Tudo certo. Você pode salvar as alterações.";

    return { items, done, total: required.length, pct, nextHint };
  }, [form, hasGlobalPlacement]);

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
    !update.isPending;

  const stepValid = useMemo(() => {
    const s1 = !!form.cliente_id && !!form.nome.trim() && !!form.tipo && !!form.plano;
    const s2 = !!form.data_inicio && !!form.data_fim && form.placements.length > 0 && (hasGlobalPlacement || form.cidades_ids.length > 0);
    const s3 = true;
    const s4 = !!String(form.financeiro_status || "").trim();
    const s5 = true;
    return { s1, s2, s3, s4, s5 };
  }, [form, hasGlobalPlacement]);

  const steps: WizardStep[] = useMemo(() => {
    const st = (ok: boolean, optional?: boolean) => (optional ? "optional" : ok ? "ok" : "pending") as const;
    return [
      { key: "basico", label: "Básico", status: st(stepValid.s1) },
      { key: "alcance", label: "Alcance", status: st(stepValid.s2) },
      { key: "keywords", label: "Keywords", status: st(stepValid.s3, true) },
      { key: "financeiro", label: "Financeiro", status: st(stepValid.s4) },
      { key: "midias", label: "Mídias", status: st(stepValid.s5, true) },
    ];
  }, [stepValid]);

  const stepOrder: WizardKey[] = ["basico", "alcance", "keywords", "financeiro", "midias"];
  const stepIndex = useMemo(() => stepOrder.indexOf(activeKey) + 1, [activeKey]);
  const stepCount = stepOrder.length;

  function goStep(key: WizardKey) {
    setActiveKey(key);
    scrollTopSmooth();
  }
  function next() {
    const idx = stepOrder.indexOf(activeKey);
    if (idx < 0) return;
    goStep(stepOrder[Math.min(stepOrder.length - 1, idx + 1)]);
  }
  function prev() {
    const idx = stepOrder.indexOf(activeKey);
    if (idx <= 0) return;
    goStep(stepOrder[Math.max(0, idx - 1)]);
  }

  const nextDisabled = useMemo(() => {
    if (activeKey === "basico") return !stepValid.s1;
    if (activeKey === "alcance") return !stepValid.s2;
    if (activeKey === "financeiro") return !stepValid.s4;
    return false;
  }, [activeKey, stepValid]);

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

  // opcional: anexar novas mídias após salvar
  async function commitMediaIfAny() {
    const tipos = mediaTiposFromPlacements(form.placements);
    if (!tipos.length) return;

    const desktopTemp = resolveTempPath(form.midia_desktop_temp_path, form.midia_desktop_public_url);
    const mobileTemp = resolveTempPath(form.midia_mobile_temp_path, form.midia_mobile_public_url);
    if (!desktopTemp && !mobileTemp) return;

    const jobs: Array<Promise<any>> = [];

    for (const tipo of tipos) {
      if (desktopTemp) {
        jobs.push(
          api.post(`/v1/campanhas/${campanhaId}/midias/commit-temp`, {
            temp_path: desktopTemp,
            tipo,
            slot: "desktop",
            status: "rascunho",
            meta_json: {
              original_name: form.midia_desktop_name || "desktop",
              placement_tipos: tipos,
              source: "campanha-edit",
            },
          })
        );
      }
      if (mobileTemp) {
        jobs.push(
          api.post(`/v1/campanhas/${campanhaId}/midias/commit-temp`, {
            temp_path: mobileTemp,
            tipo,
            slot: "mobile",
            status: "rascunho",
            meta_json: {
              original_name: form.midia_mobile_name || "mobile",
              placement_tipos: tipos,
              source: "campanha-edit",
            },
          })
        );
      }
    }

    const results = await Promise.allSettled(jobs);
    const failures = results.filter((r) => r.status === "rejected") as PromiseRejectedResult[];
    if (failures.length) {
      console.error("commit-temp failures:", failures.map((f) => (f as any)?.reason));
      toast.error("Alterações salvas, mas houve falha ao anexar algumas mídias (veja o console).");
    } else {
      // limpa os temp do form pra não recomitar sem querer
      setForm((f) => ({
        ...f,
        midia_desktop_temp_path: "",
        midia_desktop_public_url: "",
        midia_desktop_name: "",
        midia_mobile_temp_path: "",
        midia_mobile_public_url: "",
        midia_mobile_name: "",
      }));
    }
  }

  async function onSubmit() {
    if (!canSubmit) {
      toast.error("Complete os campos obrigatórios para salvar.");
      return;
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

      // mantém compatibilidade (se backend aceitar)
      gerar_tickets: !!form.gerar_tickets,
      prioridade: form.prioridade,
      due_at: form.due_at || undefined,
    };

    const t = toast.loading("Salvando alterações...");
    try {
      await update.mutateAsync(payload);

      // se tiver temp upload selecionado, tenta anexar
      const t2 = toast.loading("Finalizando (mídias)...");
      try {
        await commitMediaIfAny();
        toast.dismiss(t2);
      } catch (e) {
        console.error("commitMediaIfAny failed:", e);
        toast.dismiss(t2);
      }

      toast.dismiss(t);
      toast.success("Campanha atualizada.");
      navigate(`/campanhas/${campanhaId}`);
    } catch (e: any) {
      toast.dismiss(t);
      toast.error(e?.response?.data?.message || "Erro ao atualizar campanha.");
    }
  }

  if (isLoading) return <Skeleton className="h-32 w-full" />;
  if (isError || !campanha) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-red-600 shadow-sm">
          Erro ao carregar campanha. Verifique <b>/v1/campanhas/{campanhaId}</b>.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CampanhaCreateHeader
        breadcrumb={
          <div className="text-sm text-gray-600">
            <Link to="/campanhas" className="hover:underline">
              Campanhas
            </Link>{" "}
            /{" "}
            <Link to={`/campanhas/${campanhaId}`} className="hover:underline">
              #{campanhaId}
            </Link>{" "}
            / Editar
          </div>
        }
        title="Editar campanha"
        progressPct={checklist.pct}
        isGlobal={hasGlobalPlacement}
        hint={checklist.nextHint}
        onBack={() => navigate(-1)}
        onSubmit={onSubmit}
        submitDisabled={!canSubmit}
        submitLoading={update.isPending}
      />

      <WizardStepper steps={steps} activeKey={activeKey} onGo={(k) => goStep(k as WizardKey)} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-6">
          {activeKey === "basico" ? (
            <Step1Basico
              clienteLabel={clienteLabel}
              cliente_id={form.cliente_id}
              nome={form.nome}
              tipo={form.tipo}
              origem={form.origem}
              plano={form.plano}
              keywordsLimit={keywordsLimit}
              clienteSearch={clienteSearch}
              setClienteSearch={setClienteSearch}
              loadingClientes={loadingClientes}
              filteredClientes={filteredClientes as any}
              onPatch={(patch) => setForm((f) => ({ ...f, ...patch }))}
            />
          ) : null}

          {activeKey === "alcance" ? (
            <Step2Alcance
              data_inicio={form.data_inicio}
              data_fim={form.data_fim}
              placements={form.placements}
              hasGlobalPlacement={hasGlobalPlacement}
              cidades={cidades as any}
              filteredCidades={filteredCidades as any}
              loadingCidades={loadingCidades}
              selectedCidadeIds={form.cidades_ids}
              cidadeSearch={cidadeSearch}
              setCidadeSearch={setCidadeSearch}
              onChangeInicio={(v) => setForm((f) => ({ ...f, data_inicio: v }))}
              onChangeFim={(v) => setForm((f) => ({ ...f, data_fim: v }))}
              onTogglePlacement={togglePlacement}
              onToggleCidade={toggleCidade}
              onClearCidades={() => setForm((f) => ({ ...f, cidades_ids: [] }))}
            />
          ) : null}

          {activeKey === "keywords" ? (
            <Step3Keywords
              keywords_text={form.keywords_text}
              keywordsParsed={keywordsParsed}
              keywordsLimit={keywordsLimit}
              onChange={(v) => setForm((f) => ({ ...f, keywords_text: v }))}
            />
          ) : null}

          {activeKey === "financeiro" ? (
            <Step4Financeiro
              financeiro_status={String(form.financeiro_status)}
              financeiro_forma={form.financeiro_forma}
              financeiro_valor={form.financeiro_valor}
              financeiro_vencimento={form.financeiro_vencimento}
              financeiro_pago_em={form.financeiro_pago_em}
              financeiro_observacao={form.financeiro_observacao}
              due_at={form.due_at}
              onPatch={(patch) => setForm((f) => ({ ...f, ...patch }))}
            />
          ) : null}

          {activeKey === "midias" ? (
            <Step5Midias
              desktopUrl={form.midia_desktop_public_url || null}
              desktopName={form.midia_desktop_name || null}
              mobileUrl={form.midia_mobile_public_url || null}
              mobileName={form.midia_mobile_name || null}
              onSetTemp={setTempMedia}
            />
          ) : null}

          <div className="sticky bottom-6 z-20">
            <StickyActionBar
              canSubmit={canSubmit}
              loading={update.isPending}
              stepIndex={stepIndex}
              stepCount={stepCount}
              onCancel={() => navigate(-1)}
              onPrev={prev}
              onNext={() => {
                if (nextDisabled) {
                  toast.error("Complete os campos obrigatórios desta etapa para avançar.");
                  return;
                }
                next();
              }}
              onSubmit={onSubmit}
              nextDisabled={nextDisabled}
            />
          </div>
        </div>

        <aside className="lg:col-span-4 space-y-6">
          <SidebarInteligente
            pct={checklist.pct}
            nextHint={checklist.nextHint}
            items={checklist.items}
            resumo={{
              cliente: clienteLabel || (form.cliente_id ? `Cliente #${form.cliente_id}` : "—"),
              plano: form.plano,
              periodo: form.data_inicio && form.data_fim ? `${form.data_inicio} → ${form.data_fim}` : "—",
              placements: String(form.placements.length),
              cidades: hasGlobalPlacement ? "N/A (global)" : String(form.cidades_ids.length),
              keywords: String(keywordsParsed.length),
              financeiro: String(form.financeiro_status || "").trim() || "—",
              valor: form.financeiro_valor ? `R$ ${form.financeiro_valor}` : "—",
              midias: (form.midia_desktop_temp_path || form.midia_mobile_temp_path) ? "Sim" : "—",
            }}
          />

          <AutomacaoLegado
            checked={form.gerar_tickets}
            onChange={(v) => setForm((f) => ({ ...f, gerar_tickets: v }))}
          />
        </aside>
      </div>
    </div>
  );
}
