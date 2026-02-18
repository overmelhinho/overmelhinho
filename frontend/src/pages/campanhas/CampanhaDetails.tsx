// /var/www/frontend/src/pages/campanhas/CampanhaDetails.tsx
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import Skeleton from "@/components/ui/skeleton";

import ConfirmDialog, { ConfirmState } from "@/pages/campanhas/CampanhaDetails/components/ConfirmDialog";

import CampanhaHeader from "@/pages/campanhas/CampanhaDetails/components/CampanhaHeader";
import ResumoCard from "@/pages/campanhas/CampanhaDetails/components/ResumoCard";
import FinanceiroCard from "@/pages/campanhas/CampanhaDetails/components/FinanceiroCard";
import MidiasAtivasPanel from "@/pages/campanhas/CampanhaDetails/components/MidiasAtivasPanel";
import MidiaUploadCard from "@/pages/campanhas/CampanhaDetails/components/MidiaUploadCard";
import MidiasTable from "@/pages/campanhas/CampanhaDetails/components/MidiasTable";

import {
  fmtDate,
  fmtDateOnly,
  fmtMoney,
  statusLabelPt,
  origemLabelPt,
  badgeToneFromStatus,
  financeiroLabelPt,
  financeiroTone,
} from "@/pages/campanhas/CampanhaDetails/utils/format";

import { isGlobalByPlacements } from "@/pages/campanhas/CampanhaDetails/utils/rules";

import {
  useCampanhaDetalhe,
  useEncerrarCampanha,
  useRenovarCampanha,
  GLOBAL_PLACEMENTS,
} from "@/hooks/useCampanhas";

import { useCampanhaMidias, useCampanhaMidiasAtivas } from "@/hooks/useCampanhaMidias";

function Badge({
  children,
  tone = "neutral",
}: {
  children: any;
  tone?: "neutral" | "info" | "warn" | "danger" | "success";
}) {
  const cls =
    tone === "danger"
      ? "border-red-200 bg-red-50 text-red-700"
      : tone === "warn"
      ? "border-yellow-200 bg-yellow-50 text-yellow-800"
      : tone === "success"
      ? "border-green-200 bg-green-50 text-green-700"
      : tone === "info"
      ? "border-blue-200 bg-blue-50 text-blue-700"
      : "border-gray-200 bg-white text-gray-700";

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${cls}`}>
      {children}
    </span>
  );
}

export default function CampanhaDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const campanhaId = useMemo(() => (id ? Number(id) : 0), [id]);

  // ✅ USAR payload novo (campanha + cidades + segmentos + keywords + midias...)
  const { data: detalhe, isLoading, isError } = useCampanhaDetalhe(campanhaId);

  const encerrar = useEncerrarCampanha(campanhaId);
  const renovar = useRenovarCampanha(campanhaId);

  // Mantém o painel atual de mídias (endpoints próprios)
  const {
    data: midias,
    isLoading: loadingMidias,
    isError: errorMidias,
  } = useCampanhaMidias(campanhaId);

  const { data: ativas, isLoading: loadingAtivas } = useCampanhaMidiasAtivas(campanhaId);

  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  if (isLoading) return <Skeleton className="h-32 w-full" />;

  if (isError || !detalhe?.campanha) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-red-600 shadow-sm">
          Erro ao carregar campanha. Verifique <b>/v1/campanhas/{campanhaId}</b>.
        </div>
      </div>
    );
  }

  // ✅ Agora o "c" é o objeto campanha correto
  const c: any = detalhe.campanha;

  const cidades = detalhe.cidades ?? [];
  const keywords = detalhe.keywords ?? [];
  const segmentos = detalhe.segmentos ?? [];

  const placements = c?.placements ?? null;
  const plano = c?.plano ?? c?.plano_id ?? null;

  const isGlobal = isGlobalByPlacements(placements);

  const clienteNome =
    c?.cliente_nome ||
    c?.cliente?.nome_fantasia ||
    c?.cliente?.razao_social ||
    (c?.cliente_id ? `Cliente #${c?.cliente_id}` : "—");

  const financeiroObj = c?.financeiro || null;

  const financeiroStatus = financeiroObj?.status ?? c?.financeiro_status ?? null;
  const financeiroValor = financeiroObj?.valor ?? c?.financeiro_valor ?? null;
  const financeiroVenc = financeiroObj?.vencimento ?? c?.financeiro_vencimento ?? null;
  const financeiroPagoEm = financeiroObj?.pago_em ?? c?.financeiro_pago_em ?? null;
  const financeiroForma = financeiroObj?.forma ?? c?.financeiro_forma ?? null;
  const financeiroObs = financeiroObj?.observacao ?? null;

  async function openConfirm(cfg: NonNullable<ConfirmState>) {
    setConfirmLoading(false);
    setConfirm(cfg);
  }

  async function onEncerrar() {
    await openConfirm({
      title: `Encerrar campanha #${campanhaId}?`,
      description: "Isso encerra a campanha (sem apagar).",
      confirmText: "Encerrar",
      cancelText: "Cancelar",
      tone: "danger",
      onConfirm: async () => {
        const t = toast.loading("Encerrando...");
        try {
          await encerrar.mutateAsync();
          toast.dismiss(t);
          toast.success("Campanha encerrada.");
        } catch (e: any) {
          toast.dismiss(t);
          toast.error(e?.response?.data?.message || "Erro ao encerrar campanha.");
        }
      },
    });
  }

  async function onRenovar() {
    await openConfirm({
      title: `Renovar campanha #${campanhaId}?`,
      description: "O backend cria uma nova campanha baseada na atual.",
      confirmText: "Renovar",
      cancelText: "Cancelar",
      onConfirm: async () => {
        const t = toast.loading("Renovando...");
        try {
          const res = await renovar.mutateAsync();
          toast.dismiss(t);
          toast.success("Campanha renovada.");
          const newId = (res as any)?.id;
          if (newId) navigate(`/campanhas/${newId}`);
        } catch (e: any) {
          toast.dismiss(t);
          toast.error(e?.response?.data?.message || "Erro ao renovar campanha.");
        }
      },
    });
  }

  return (
    <div className="p-6">
      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title || ""}
        description={confirm?.description}
        confirmText={confirm?.confirmText}
        cancelText={confirm?.cancelText}
        tone={confirm?.tone}
        loading={confirmLoading}
        onClose={() => {
          if (confirmLoading) return;
          setConfirm(null);
        }}
        onConfirm={async (comment?: string) => {
          const fn = (confirm as any)?.onConfirm;
          if (!fn) {
            setConfirm(null);
            return;
          }

          setConfirmLoading(true);
          try {
            await fn(comment);
          } finally {
            setConfirmLoading(false);
            setConfirm(null);
          }
        }}
      />

      {/* Header */}
      <CampanhaHeader
        campanhaId={c.id}
        nome={c.nome}
        status={c.status}
        tipo={c.tipo}
        origem={c.origem}
        data_inicio={c.data_inicio}
        data_fim={c.data_fim}
        clienteNome={clienteNome}
        plano={plano}
        placements={placements}
        isGlobal={isGlobal}
        globalPlacements={GLOBAL_PLACEMENTS as any}
        onBack={() => navigate(-1)}
        onRenovar={onRenovar}
        onEncerrar={onEncerrar}
        renovarPending={renovar.isPending}
        encerrarPending={encerrar.isPending}
        statusLabelPt={statusLabelPt}
        origemLabelPt={origemLabelPt}
        badgeToneFromStatus={badgeToneFromStatus}
        fmtDateOnly={fmtDateOnly}
      />

      {/* Cards resumo */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ResumoCard
          clienteNome={clienteNome}
          clienteId={c?.cliente_id ?? null}
          valorTotal={c?.valor_total ?? null}
          createdAt={c?.created_at ?? null}
          placements={placements}
          globalPlacements={(GLOBAL_PLACEMENTS as any) ?? []}
          // ✅ AGORA keywords/cidades são arrays do payload novo
          keywords={keywords}
          cidades={cidades}
          isGlobal={isGlobal}
          fmtMoney={fmtMoney}
          fmtDate={fmtDate}
        />

        <FinanceiroCard
          financeiroStatus={financeiroStatus}
          financeiroForma={financeiroForma}
          financeiroValor={financeiroValor}
          financeiroVenc={financeiroVenc}
          financeiroPagoEm={financeiroPagoEm}
          financeiroObs={financeiroObs}
          fmtMoney={fmtMoney}
          fmtDateOnly={fmtDateOnly}
          fmtDate={fmtDate}
          financeiroTone={financeiroTone}
          financeiroLabelPt={financeiroLabelPt}
        />
      </div>

      {/* Mídias */}
      <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-semibold text-gray-900">Mídias da campanha</div>
            <div className="text-xs text-gray-500">
              Upload-temp → commit-temp. Publicado só via PATCH. Ativar via endpoint .../ativar.
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Badge tone={loadingAtivas ? "warn" : "success"}>{loadingAtivas ? "Ativas: carregando…" : "Ativas: ok"}</Badge>
          </div>
        </div>

        <MidiasAtivasPanel ativas={ativas} loading={loadingAtivas} />
        <MidiaUploadCard campanhaId={campanhaId} />

        {loadingMidias && <div className="text-sm text-gray-600">Carregando mídias…</div>}

        {errorMidias && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Erro ao carregar mídias. Verifique <b>/v1/campanhas/{campanhaId}/midias</b>.
          </div>
        )}

        {!loadingMidias && !errorMidias && (!midias || midias.length === 0) && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600">Nenhuma mídia cadastrada ainda.</div>
        )}

        {!loadingMidias && !errorMidias && midias && midias.length > 0 && (
          <MidiasTable
            campanhaId={campanhaId}
            midias={midias}
            openConfirm={openConfirm}
            busyExternal={encerrar.isPending || renovar.isPending}
          />
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs text-gray-500">Última atualização: {fmtDate(c?.updated_at ?? null)}</div>

        <div className="flex items-center gap-2">
          <Link
            to="/campanhas"
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
          >
            Voltar para lista
          </Link>
        </div>
      </div>
    </div>
  );
}
