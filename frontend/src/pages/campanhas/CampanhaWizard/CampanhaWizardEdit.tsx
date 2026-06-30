// /var/www/frontend/src/pages/campanhas/CampanhaWizard/CampanhaWizardEdit.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import Skeleton from "@/components/ui/skeleton";
import api from "@/services/api";

import { useClientesLite } from "@/hooks/useClientesLite";
import { useCidades } from "@/hooks/useCidades";

import {
  useCampanhaDetalhe,
  useUpdateCampanha,
  CampanhaOrigem,
  CampanhaTipo,
  PlacementType,
  GLOBAL_PLACEMENTS,
  PlanoCampanha,
  FinanceiroStatus,
} from "@/hooks/useCampanhas";

import CampanhaCreateHeader from "@/pages/campanhas/CampanhaCreate/components/CampanhaCreateHeader";
import SidebarInteligente from "@/pages/campanhas/CampanhaCreate/components/SidebarInteligente";
import WizardStepper, { WizardStep } from "@/pages/campanhas/CampanhaCreate/components/WizardStepper";
import StickyActionBar from "@/pages/campanhas/CampanhaCreate/components/StickyActionBar";

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

// ✅ mesmos helpers do Create (evita temp_path inválido)
import { extractTempPathFromPublicUrl, normalizeTempPath } from "@/pages/campanhas/CampanhaDetails/utils/media";



function formatDateBR(v?: string | null) {
  const s = String(v || "").trim();
  if (!s) return "";

  // já está no formato BR
  if (s.includes("/")) return s;

  // pega só a parte da data (caso venha ISO com hora)
  const datePart = s.split("T")[0];

  // YYYY-MM-DD -> DD/MM/YYYY
  const m = datePart.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;

  return s; // fallback seguro
}



type WizardKey = "basico" | "alcance" | "keywords" | "financeiro" | "midias";

type FormState = {
  is_institucional: boolean;
  cliente_id: string;
  nome: string;
  tipo: CampanhaTipo;
  origem: "" | CampanhaOrigem;

  data_inicio: string;
  data_fim: string;

  placements: PlacementType[];
  plano: PlanoCampanha;

  cidades_ids: number[];

  keywords_text: string;

  financeiro_status: "" | FinanceiroStatus | string;
  financeiro_forma: string;
  financeiro_valor: string;
  financeiro_vencimento: string;
  financeiro_pago_em: string;
  financeiro_observacao: string;

  // ✅ mídia (edit) - temp upload + preview url (igual create)
  midia_desktop_temp_path: string;
  midia_desktop_public_url: string;
  midia_desktop_name: string;

  midia_mobile_temp_path: string;
  midia_mobile_public_url: string;
  midia_mobile_name: string;
};

function scrollTopSmooth() {
  try {
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch {
    window.scrollTo(0, 0);
  }
}

function keywordsToText(keywords: any): string {
  if (!keywords) return "";
  if (Array.isArray(keywords)) {
    if (keywords.length && typeof keywords[0] === "object") {
      return keywords
        .map((k: any) => k?.keyword_original || k?.keyword_normalizada || "")
        .filter(Boolean)
        .join(", ");
    }
    return keywords.join(", ");
  }
  if (typeof keywords === "string") return keywords;
  return "";
}

/**
 * ✅ placements -> tipos aceitos no backend (campanha_midias.tipo)
 * mesmos do Create
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

export default function CampanhaWizardEdit() {
  const { id } = useParams();
  const campanhaId = useMemo(() => (id ? Number(id) : 0), [id]);
  const navigate = useNavigate();

  const { data: detalhe, isLoading, isError } = useCampanhaDetalhe(campanhaId);
  const update = useUpdateCampanha(campanhaId);

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

  const [form, setForm] = useState<FormState>({
    is_institucional: false,
    cliente_id: "",
    nome: "",
    tipo: "banner",
    origem: "",

    data_inicio: "",
    data_fim: "",

    placements: [],
    plano: "basico",

    cidades_ids: [],

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
  });

  const campanha = (detalhe as any)?.campanha ?? null;
  const detalheCidades = (detalhe as any)?.cidades ?? [];
  const detalheKeywords = (detalhe as any)?.keywords ?? [];
  const detalheMidias = (detalhe as any)?.midias ?? [];

  useEffect(() => {
    if (!detalhe || !campanha) return;

    const cidades_ids = Array.isArray(detalheCidades)
      ? detalheCidades
          .map((c: any) => Number(c?.id ?? c))
          .filter((n: any) => Number.isFinite(n))
      : [];

    const placements: PlacementType[] =
      (campanha?.placements as any) ||
      (campanha?.placement as any) ||
      (campanha?.alcance?.placements as any) ||
      [];

    const plano: PlanoCampanha =
      (campanha?.plano as any) ||
      (campanha?.plano_nome as any) ||
      (campanha?.plano_id ? "basico" : "basico");

    const financeiro_status = campanha?.financeiro_status ?? "";
    const financeiro_forma = campanha?.financeiro_forma ?? "";
    const financeiro_valor = campanha?.financeiro_valor ?? "";
    const financeiro_vencimento = campanha?.financeiro_vencimento ?? "";
    const financeiro_pago_em = campanha?.financeiro_pago_em ?? "";

    // preview inicial do que já existe
    const lastDesktop = Array.isArray(detalheMidias)
      ? detalheMidias.find((m: any) => m?.desktop_url)?.desktop_url
      : "";
    const lastMobile = Array.isArray(detalheMidias)
      ? detalheMidias.find((m: any) => m?.mobile_url)?.mobile_url
      : "";

    setForm((f) => ({
      ...f,
      is_institucional: !!campanha?.is_institucional,
      cliente_id: String(campanha?.cliente_id ?? ""),
      nome: String(campanha?.nome ?? ""),
      tipo: (campanha?.tipo ?? "banner") as CampanhaTipo,
      origem: (campanha?.origem ?? "") as any,
      data_inicio: String(campanha?.data_inicio ?? ""),
      data_fim: String(campanha?.data_fim ?? ""),
      cidades_ids,
      placements: Array.isArray(placements) ? placements : [],
      plano: (plano || "basico") as PlanoCampanha,
      keywords_text: keywordsToText(detalheKeywords),

      financeiro_status: String(financeiro_status ?? ""),
      financeiro_forma: String(financeiro_forma ?? ""),
      financeiro_valor: financeiro_valor !== null && financeiro_valor !== undefined ? String(financeiro_valor) : "",
      financeiro_vencimento: String(financeiro_vencimento ?? ""),
      financeiro_pago_em: String(financeiro_pago_em ?? ""),
      financeiro_observacao: String(campanha?.financeiro_observacao ?? ""),

      midia_desktop_public_url: String(lastDesktop || ""),
      midia_desktop_name: "",
      midia_mobile_public_url: String(lastMobile || ""),
      midia_mobile_name: "",

      // temp vazio no load
      midia_desktop_temp_path: "",
      midia_mobile_temp_path: "",
    }));
  }, [detalhe, campanha, detalheCidades, detalheKeywords, detalheMidias]);

  const clienteIdNum = useMemo(() => Number(form.cliente_id || 0), [form.cliente_id]);

  const clienteLabel = useMemo(() => {
    const c = (clientes as any[]).find((x: any) => x.id === clienteIdNum);
    if (!c) {
      if (campanha?.cliente_nome) return campanha.cliente_nome;
      return form.cliente_id ? `Cliente #${form.cliente_id}` : "";
    }
    return c.nome_fantasia || c.razao_social || `Cliente #${c.id}`;
  }, [clientes, clienteIdNum, form.cliente_id, campanha]);

  const filteredClientes = useMemo(() => (clientes as any[]) ?? [], [clientes]);

  const hasGlobalPlacement = useMemo(
    () => (form.placements || []).some((p) => GLOBAL_PLACEMENTS.includes(p)),
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
      const next = new Set(f.placements || []);
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

  const checklist = useMemo(() => {
    const items: Array<{ key: string; label: string; ok: boolean; hint: string; optional?: boolean }> = [
      { key: "cliente", label: "Cliente", ok: !!form.cliente_id, hint: "Selecione um cliente." },
      { key: "nome", label: "Nome", ok: !!form.nome.trim(), hint: "Defina um nome claro." },
      { key: "periodo", label: "Período", ok: !!(form.data_inicio && form.data_fim), hint: "Escolha início e fim." },
      { key: "placements", label: "Placements", ok: (form.placements || []).length > 0, hint: "Selecione pelo menos 1." },
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
    const nextHint = required.find((i) => !i.ok)?.hint || "Tudo certo. Você pode salvar a campanha.";

    return { items, pct, nextHint };
  }, [form, hasGlobalPlacement]);

  const canSubmit =
    (form.is_institucional || !!form.cliente_id) &&
    !!form.nome.trim() &&
    !!form.tipo &&
    (form.is_institucional || !!form.data_inicio) &&
    (form.is_institucional || !!form.data_fim) &&
    (form.placements || []).length > 0 &&
    (form.is_institucional || hasGlobalPlacement || form.cidades_ids.length > 0) &&
    (form.is_institucional || !!String(form.financeiro_status || "").trim()) &&
    !update.isPending;

  const stepValid = useMemo(() => {
    const s1 = (form.is_institucional || !!form.cliente_id) && !!form.nome.trim() && !!form.tipo && !!form.plano;
    const s2 =
      (form.is_institucional || (!!form.data_inicio && !!form.data_fim)) &&
      (form.placements || []).length > 0 &&
      (form.is_institucional || hasGlobalPlacement || form.cidades_ids.length > 0);
    const s3 = true;
    const s4 = form.is_institucional || !!String(form.financeiro_status || "").trim();
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
    const nextKey = stepOrder[Math.min(stepOrder.length - 1, idx + 1)];
    goStep(nextKey);
  }
  function prev() {
    const idx = stepOrder.indexOf(activeKey);
    const prevKey = stepOrder[Math.max(0, idx - 1)];
    goStep(prevKey);
  }

  const nextDisabled = useMemo(() => {
    if (activeKey === "basico") return !stepValid.s1;
    if (activeKey === "alcance") return !stepValid.s2;
    if (activeKey === "financeiro") return !stepValid.s4;
    return false;
  }, [activeKey, stepValid]);

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
      toast.error("Campanha salva, mas houve falha ao anexar algumas mídias (veja o console).");
    }
  }

  async function onSubmit() {
    if (update.isPending) return;

    if (!canSubmit) {
      toast.error("Complete os campos obrigatórios.");
      return;
    }

    const payload: any = {
      is_institucional: form.is_institucional,
      cliente_id: form.is_institucional ? null : Number(form.cliente_id),
      nome: form.nome.trim(),
      tipo: form.tipo,
      origem: form.origem ? (form.origem as CampanhaOrigem) : null,
      data_inicio: form.is_institucional ? null : toISODate(form.data_inicio),
      data_fim: form.is_institucional ? null : toISODate(form.data_fim),

      placements: form.placements,
      plano: form.plano,

      cidades_ids: hasGlobalPlacement ? undefined : form.cidades_ids,
      keywords: keywordsParsed,

      financeiro: form.is_institucional ? null : {
        status: String(form.financeiro_status || "").trim() || undefined,
        forma: form.financeiro_forma || undefined,
        valor: form.financeiro_valor ? Number(form.financeiro_valor) : undefined,
        vencimento: form.financeiro_vencimento || undefined,
        pago_em: form.financeiro_pago_em || undefined,
        observacao: form.financeiro_observacao || undefined,
      },
    };

    const t = toast.loading("Salvando alterações...");
    try {
      await update.mutateAsync(payload);

      const t2 = toast.loading("Anexando mídias...");
      try {
        await commitMediaIfAny();
        toast.dismiss(t2);
      } catch (e) {
        console.error("commitMediaIfAny failed:", e);
        toast.dismiss(t2);
        toast.error("Alterações salvas, mas falhou ao anexar mídias.");
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

  if (isError || !detalhe) {
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
        title={`Editar campanha #${campanhaId}`}
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
              due_at={""}
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
              periodo:
                form.data_inicio && form.data_fim
                  ? `${formatDateBR(form.data_inicio)} → ${formatDateBR(form.data_fim)}`
                  : "—",

              placements: String((form.placements || []).length),
              cidades: hasGlobalPlacement ? "N/A (global)" : String(form.cidades_ids.length),
              keywords: String(keywordsParsed.length),
              financeiro: String(form.financeiro_status || "").trim() || "—",
              valor: form.financeiro_valor ? `R$ ${form.financeiro_valor}` : "—",
              midias: form.midia_desktop_temp_path || form.midia_mobile_temp_path ? "Sim" : "—",
            }}
          />
        </aside>
      </div>
    </div>
  );
}
