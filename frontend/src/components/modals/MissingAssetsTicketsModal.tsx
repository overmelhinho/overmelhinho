import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import axios from "@/services/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;

  clienteId: number | null;
  clienteNome?: string;

  missingLogo: boolean;
  missingGaleria: boolean;

  onDone: () => void; // chama quando finalizar (criou ou pulou)
};

export default function MissingAssetsTicketsModal({
  open,
  onOpenChange,
  clienteId,
  clienteNome,
  missingLogo,
  missingGaleria,
  onDone,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [criativo, setCriativo] = useState(true);
  const [financeiro, setFinanceiro] = useState(true);

  const shouldShow = useMemo(() => missingLogo || missingGaleria, [missingLogo, missingGaleria]);

  const defaultDescricao = useMemo(() => {
    const faltas: string[] = [];
    if (missingLogo) faltas.push("logo");
    if (missingGaleria) faltas.push("galeria de imagens");

    return `Cliente recém-cadastrado${clienteNome ? `: ${clienteNome}` : ""}. Faltando: ${faltas.join(" e ")}.`;
  }, [missingLogo, missingGaleria, clienteNome]);

  const createTicket = async (setor: "criativo" | "financeiro") => {
    if (!clienteId) throw new Error("clienteId ausente");

    const titulo =
      setor === "criativo"
        ? "Solicitação: criação/ajuste de logo e imagens"
        : "Solicitação: organização financeira/cobrança";

    return axios.post("/v1/tickets", {
      cliente_id: clienteId,
      setor,
      titulo,
      descricao: defaultDescricao,
      prioridade: "media",
    });
  };

  const handleConfirm = async () => {
    if (!shouldShow) {
      onDone();
      return;
    }

    if (!criativo && !financeiro) {
      toast.error("Selecione pelo menos um setor ou clique em 'Pular'.");
      return;
    }

    setLoading(true);
    const t = toast.loading("Abrindo tickets...");

    try {
      if (criativo) await createTicket("criativo");
      if (financeiro) await createTicket("financeiro");

      toast.dismiss(t);
      toast.success("Tickets criados com sucesso!");
      onOpenChange(false);
      onDone();
    } catch (e: any) {
      toast.dismiss(t);
      toast.error(e?.response?.data?.message || "Falha ao criar tickets.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    onOpenChange(false);
    onDone();
  };

  if (!shouldShow) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !loading && onOpenChange(v)}>
      <DialogContent className="max-w-xl rounded-2xl">
        <DialogHeader>
          <DialogTitle>Faltam itens essenciais para o perfil do cliente</DialogTitle>
          <DialogDescription>
            Percebemos que este cliente foi cadastrado sem{" "}
            {missingLogo && missingGaleria ? (
              <b>logo e galeria</b>
            ) : missingLogo ? (
              <b>logo</b>
            ) : (
              <b>galeria</b>
            )}
            . Deseja abrir tickets para os setores responsáveis?
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-3">
          <div className="rounded-xl border p-4 bg-gray-50">
            <div className="text-sm font-semibold text-gray-900">Escolha os tickets</div>

            <label className="mt-3 flex items-center gap-3">
              <input
                type="checkbox"
                checked={criativo}
                onChange={(e) => setCriativo(e.target.checked)}
                disabled={loading}
                className="h-4 w-4"
              />
              <div className="text-sm text-gray-800">
                <b>Criativo</b> — logo, artes e imagens (galeria)
              </div>
            </label>

            <label className="mt-2 flex items-center gap-3">
              <input
                type="checkbox"
                checked={financeiro}
                onChange={(e) => setFinanceiro(e.target.checked)}
                disabled={loading}
                className="h-4 w-4"
              />
              <div className="text-sm text-gray-800">
                <b>Financeiro</b> — organização para cobrança/contrato
              </div>
            </label>
          </div>

          <div className="rounded-xl border p-4">
            <div className="text-xs font-semibold text-gray-500 mb-1">Resumo</div>
            <div className="text-sm text-gray-800">{defaultDescricao}</div>
          </div>
        </div>

        <DialogFooter className="mt-2">
          <button
            type="button"
            onClick={handleSkip}
            disabled={loading}
            className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50"
          >
            Pular por agora
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="px-5 py-2 rounded-lg bg-[#B70F0A] text-white hover:bg-[#900B07] disabled:opacity-60"
          >
            {loading ? "Criando..." : "Criar tickets"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
