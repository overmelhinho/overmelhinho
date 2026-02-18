// /var/www/frontend/src/pages/campanhas/CampanhaDetails/components/MidiaRowActions.tsx
import toast from "react-hot-toast";

import {
  useUpdateCampanhaMidia,
  useArchiveCampanhaMidia,
  useAtivarCampanhaMidia,
  CampanhaMidia,
  CampanhaMidiaSlot,
  CampanhaMidiaStatus,
} from "@/hooks/useCampanhaMidias";

import { ConfirmState } from "@/pages/campanhas/CampanhaDetails/components/ConfirmDialog";
import { statusLabelPt } from "@/pages/campanhas/CampanhaDetails/utils/format";

export default function MidiaRowActions({
  campanhaId,
  m,
  openConfirm,
  busyExternal,
}: {
  campanhaId: number;
  m: CampanhaMidia;
  openConfirm: (cfg: NonNullable<ConfirmState>) => void;
  busyExternal?: boolean;
}) {
  const update = useUpdateCampanhaMidia(campanhaId, m.id);
  const archive = useArchiveCampanhaMidia(campanhaId, m.id);
  const ativar = useAtivarCampanhaMidia(campanhaId, m.id);

  const busy =
    !!busyExternal || update.isPending || archive.isPending || ativar.isPending;

  async function confirmStatus(next: CampanhaMidiaStatus, comment?: string) {
    openConfirm({
      title: `Alterar status da mídia #${m.id}?`,
      description: `Tipo: ${m.tipo}\nVersão: ${m.versao}\nAtual: ${statusLabelPt(
        m.status
      )}\nNovo: ${statusLabelPt(next)}`,
      confirmText: "Confirmar",
      cancelText: "Cancelar",
      tone: next === "arquivado" ? "danger" : "default",
      onConfirm: async () => {
        const t = toast.loading("Atualizando mídia...");
        try {
          await update.mutateAsync({
            status: next,
            comment: comment || `Status: ${statusLabelPt(next)}`,
          });
          toast.dismiss(t);
          toast.success("Status atualizado.");
        } catch (e: any) {
          toast.dismiss(t);
          toast.error(e?.response?.data?.message || "Erro ao atualizar status.");
        }
      },
    });
  }

  async function confirmArchive() {
    openConfirm({
      title: `Arquivar mídia #${m.id}?`,
      description: "Isso muda o status para 'arquivado'.",
      confirmText: "Arquivar",
      cancelText: "Cancelar",
      tone: "danger",
      onConfirm: async () => {
        const t = toast.loading("Arquivando...");
        try {
          await archive.mutateAsync({ comment: "Mídia arquivada" });
          toast.dismiss(t);
          toast.success("Mídia arquivada.");
        } catch (e: any) {
          toast.dismiss(t);
          toast.error(e?.response?.data?.message || "Erro ao arquivar.");
        }
      },
    });
  }

  async function onAtivar(slot: CampanhaMidiaSlot) {
    const t = toast.loading("Ativando mídia...");
    try {
      await ativar.mutateAsync({ slot, comment: `Ativada (${slot})` });
      toast.dismiss(t);
      toast.success(`Mídia ativada (${slot}).`);
    } catch (e: any) {
      toast.dismiss(t);
      toast.error(e?.response?.data?.message || "Erro ao ativar.");
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <button
        disabled={busy}
        onClick={() => confirmStatus("em_revisao", "Enviada para revisão")}
        className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-50"
        title="Enviar para revisão"
      >
        Revisão
      </button>

      <button
        disabled={busy}
        onClick={() => confirmStatus("aprovado", "Aprovada")}
        className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-50"
        title="Aprovar"
      >
        Aprovar
      </button>

      <button
        disabled={busy}
        onClick={() => confirmStatus("publicado", "Publicado")}
        className="rounded-xl bg-gray-900 px-3 py-2 text-xs font-semibold text-white hover:opacity-95 disabled:opacity-50"
        title="Publicar"
      >
        Publicar
      </button>

      <button
        disabled={busy}
        onClick={() => onAtivar("desktop")}
        className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-50"
        title="Ativar no Desktop"
      >
        Ativa (D)
      </button>

      <button
        disabled={busy}
        onClick={() => onAtivar("mobile")}
        className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-50"
        title="Ativar no Mobile"
      >
        Ativa (M)
      </button>

      <button
        disabled={busy}
        onClick={confirmArchive}
        className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:opacity-95 disabled:opacity-50"
        title="Arquivar"
      >
        Arquivar
      </button>
    </div>
  );
}
