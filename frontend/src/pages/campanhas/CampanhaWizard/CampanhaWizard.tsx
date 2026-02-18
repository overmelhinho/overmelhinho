// /var/www/frontend/src/pages/campanhas/CampanhaWizard/CampanhaWizard.tsx
import { Link, useNavigate } from "react-router-dom";
import Skeleton from "@/components/ui/skeleton";
import toast from "react-hot-toast";

import CampanhaCreateHeader from "@/pages/campanhas/CampanhaCreate/components/CampanhaCreateHeader";
import SidebarInteligente from "@/pages/campanhas/CampanhaCreate/components/SidebarInteligente";
import WizardStepper, { WizardStep } from "@/pages/campanhas/CampanhaCreate/components/WizardStepper";
import StickyActionBar from "@/pages/campanhas/CampanhaCreate/components/StickyActionBar";
import AutomacaoLegado from "@/pages/campanhas/CampanhaCreate/components/AutomacaoLegado";

import Step1Basico from "@/pages/campanhas/CampanhaCreate/steps/Step1Basico";
import Step2Alcance from "@/pages/campanhas/CampanhaCreate/steps/Step2Alcance";
import Step3Keywords from "@/pages/campanhas/CampanhaCreate/steps/Step3Keywords";
import Step4Financeiro from "@/pages/campanhas/CampanhaCreate/steps/Step4Financeiro";
import Step5Midias from "@/pages/campanhas/CampanhaCreate/steps/Step5Midias";

import { useCampanhaWizard, CampanhaWizardMode, WizardKey } from "./useCampanhaWizard";


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




export default function CampanhaWizard({
  mode,
  campanhaId,
}: {
  mode: CampanhaWizardMode;
  campanhaId?: number;
}) {
  const navigate = useNavigate();

  const w = useCampanhaWizard({ mode, campanhaId });

  // Edit: aguarda carregar detalhe para hidratar o form
  const loadingEdit = mode === "edit" && (w.detalhe.isLoading || !w.detalhe.data);
  if (loadingEdit) return <Skeleton className="h-32 w-full" />;

  if (mode === "edit" && w.detalhe.isError) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-red-600 shadow-sm">
          Erro ao carregar campanha. Verifique <b>/v1/campanhas/{campanhaId}</b>.
        </div>
      </div>
    );
  }

  const st = (ok: boolean, optional?: boolean) =>
    (optional ? "optional" : ok ? "ok" : "pending") as const;

  const steps: WizardStep[] = [
    { key: "basico", label: "Básico", status: st(w.stepValid.s1) },
    { key: "alcance", label: "Alcance", status: st(w.stepValid.s2) },
    { key: "keywords", label: "Keywords", status: st(w.stepValid.s3, true) },
    { key: "financeiro", label: "Financeiro", status: st(w.stepValid.s4) },
    { key: "midias", label: "Mídias", status: st(w.stepValid.s5, true) },
  ];

  const title = mode === "create" ? "Nova campanha" : `Editar campanha #${campanhaId}`;

  const breadcrumb =
    mode === "create" ? (
      <div className="text-sm text-gray-600">
        <Link to="/campanhas" className="hover:underline">
          Campanhas
        </Link>{" "}
        / Nova
      </div>
    ) : (
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
    );



async function handleSubmit() {
  const res = await w.onSubmit();

  // Sempre volta para listagem após salvar
  if (mode === "create") {
    navigate("/campanhas");
    return;
  }

  if (mode === "edit") {
    navigate("/campanhas");
    return;
  }

  // fallback de segurança
  if (res?.id) {
    navigate("/campanhas");
  }
}


  return (
    <div className="space-y-6">
      <CampanhaCreateHeader
        breadcrumb={breadcrumb}
        title={title}
        progressPct={w.checklist.pct}
        isGlobal={w.hasGlobalPlacement}
        hint={w.checklist.nextHint}
        onBack={() => navigate(-1)}
        onSubmit={handleSubmit}
        submitDisabled={!w.canSubmit}
        submitLoading={w.busy}
      />

      <WizardStepper steps={steps} activeKey={w.activeKey} onGo={(k) => w.goStep(k as WizardKey)} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-6">
          {w.activeKey === "basico" ? (
            <Step1Basico
              clienteLabel={w.clienteLabel}
              cliente_id={w.form.cliente_id}
              nome={w.form.nome}
              tipo={w.form.tipo}
              origem={w.form.origem}
              plano={w.form.plano}
              keywordsLimit={w.keywordsLimit}
              clienteSearch={w.clienteSearch}
              setClienteSearch={w.setClienteSearch}
              loadingClientes={w.loadingClientes}
              filteredClientes={w.filteredClientes as any}
              onPatch={(patch) => w.onPatch(patch as any)}
            />
          ) : null}

          {w.activeKey === "alcance" ? (
            <Step2Alcance
              data_inicio={w.form.data_inicio}
              data_fim={w.form.data_fim}
              placements={w.form.placements}
              hasGlobalPlacement={w.hasGlobalPlacement}
              cidades={w.cidades as any}
              filteredCidades={w.filteredCidades as any}
              loadingCidades={w.loadingCidades}
              selectedCidadeIds={w.form.cidades_ids}
              cidadeSearch={w.cidadeSearch}
              setCidadeSearch={w.setCidadeSearch}
              onChangeInicio={(v) => w.onPatch({ data_inicio: v } as any)}
              onChangeFim={(v) => w.onPatch({ data_fim: v } as any)}
              onTogglePlacement={w.togglePlacement}
              onToggleCidade={w.toggleCidade}
              onClearCidades={() => w.onPatch({ cidades_ids: [] } as any)}
            />
          ) : null}

          {w.activeKey === "keywords" ? (
            <Step3Keywords
              keywords_text={w.form.keywords_text}
              keywordsParsed={w.keywordsParsed}
              keywordsLimit={w.keywordsLimit}
              onChange={(v) => w.onPatch({ keywords_text: v } as any)}
            />
          ) : null}

          {w.activeKey === "financeiro" ? (
            <Step4Financeiro
              financeiro_status={String(w.form.financeiro_status)}
              financeiro_forma={w.form.financeiro_forma}
              financeiro_valor={w.form.financeiro_valor}
              financeiro_vencimento={w.form.financeiro_vencimento}
              financeiro_pago_em={w.form.financeiro_pago_em}
              financeiro_observacao={w.form.financeiro_observacao}
              due_at={w.form.due_at}
              onPatch={(patch) => w.onPatch(patch as any)}
            />
          ) : null}

          {w.activeKey === "midias" ? (
            <Step5Midias
              desktopUrl={w.form.midia_desktop_public_url || null}
              desktopName={w.form.midia_desktop_name || null}
              mobileUrl={w.form.midia_mobile_public_url || null}
              mobileName={w.form.midia_mobile_name || null}
              onSetTemp={w.setTempMedia}
            />
          ) : null}

          <div className="sticky bottom-6 z-20">
            <StickyActionBar
              canSubmit={w.canSubmit}
              loading={w.busy}
              stepIndex={w.stepIndex}
              stepCount={w.stepCount}
              onCancel={() => navigate(-1)}
              onPrev={w.prev}
              onNext={() => {
                if (w.nextDisabled) {
                  toast.error("Complete os campos obrigatórios desta etapa para avançar.");
                  return;
                }
                w.next();
              }}
              onSubmit={handleSubmit}
              nextDisabled={w.nextDisabled}
              // ✅ labels corretos por modo
              submitLabel={mode === "edit" ? "Salvar campanha" : "Criar campanha"}
              submitLoadingLabel={mode === "edit" ? "Salvando..." : "Criando..."}
            />
          </div>
        </div>

        <aside className="lg:col-span-4 space-y-6">
          <SidebarInteligente
            pct={w.checklist.pct}
            nextHint={w.checklist.nextHint}
            items={w.checklist.items}
            resumo={{
              cliente: w.clienteLabel || (w.form.cliente_id ? `Cliente #${w.form.cliente_id}` : "—"),
              plano: w.form.plano,
	     periodo:
  w.form.data_inicio && w.form.data_fim
    ? `${formatDateBR(w.form.data_inicio)} → ${formatDateBR(w.form.data_fim)}`
    : "—",

              placements: String(w.form.placements.length),
              cidades: w.hasGlobalPlacement ? "N/A (global)" : String(w.form.cidades_ids.length),
              keywords: String(w.keywordsParsed.length),
              financeiro: String(w.form.financeiro_status || "").trim() || "—",
              valor: w.form.financeiro_valor ? `R$ ${w.form.financeiro_valor}` : "—",
              midias: (w.form.midia_desktop_temp_path || w.form.midia_mobile_temp_path) ? "Sim" : "—",
            }}
          />

          <AutomacaoLegado
            checked={w.form.gerar_tickets}
            onChange={(v) => w.onPatch({ gerar_tickets: v } as any)}
          />
        </aside>
      </div>
    </div>
  );
}
