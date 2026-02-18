import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import axios from "@/services/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

type Props = {
  open: boolean;
  onClose: () => void;

  clienteId: number;

  missingLogo: boolean;
  missingGaleria: boolean;

  onDone: () => void; // chama ao finalizar (criou ticket ou pulou)
};

export default function ClienteTicketsModal({
  open,
  onClose,
  clienteId,
  missingLogo,
  missingGaleria,
  onDone,
}: Props) {
  const [creating, setCreating] = useState(false);

  const defaultCriativo = missingLogo || missingGaleria;
  const defaultFinanceiro = missingLogo || missingGaleria;

  const [createCriativo, setCreateCriativo] = useState(defaultCriativo);
  const [createFinanceiro, setCreateFinanceiro] = useState(defaultFinanceiro);

  const title = useMemo(() => {
    if (missingLogo && missingGaleria) return "Faltam Logo e Galeria";
    if (missingLogo) return "Falta o Logotipo";
    if (missingGaleria) return "Falta a Galeria";
    return "Ajustes pós-cadastro";
  }, [missingLogo, missingGaleria]);

  const description = useMemo(() => {
    const parts: string[] = [];
    if (missingLogo) parts.push("logotipo");
    if (missingGaleria) parts.push("imagens da galeria");

    if (!parts.length) return "Tudo certo por aqui.";

    return `Percebemos que este cliente ainda não possui ${parts.join(" e ")}. Quer abrir tickets agora para agilizar o andamento?`;
  }, [missingLogo, missingGaleria]);

  const criar = async () => {
    if (!createCriativo && !createFinanceiro) {
      onClose();
      onDone();
      return;
    }

    setCreating(true);
    const t = toast.loading("Abrindo tickets...");

    try {
      const promises: Promise<any>[] = [];

      if (createCriativo) {
        const itens: string[] = [];
        if (missingLogo) itens.push("Criação/ajuste de LOGO");
        if (missingGaleria) itens.push("Criação/seleção de imagens para GALERIA");

        promises.push(
          axios.post("/v1/tickets", {
            cliente_id: clienteId,
            setor: "criativo",
            prioridade: "media",
            titulo: "Materiais do cliente pendentes (logo/galeria)",
            descricao: `Solicitação automática pós-cadastro.\nItens:\n- ${itens.join("\n- ")}\n\nCliente ID: ${clienteId}`,
          })
        );
      }

      if (createFinanceiro) {
        promises.push(
          axios.post("/v1/tickets", {
            cliente_id: clienteId,
            setor: "financeiro",
            prioridade: "media",
            titulo: "Organizar cobrança/andamento financeiro do novo cliente",
            descricao: `Solicitação automática pós-cadastro para organização de cobrança e fluxo financeiro.\nCliente ID: ${clienteId}`,
          })
        );
      }

      await Promise.allSettled(promises);

      toast.success("Tickets criados (quando selecionados).");
      onClose();
      onDone();
    } catch (e) {
      console.error(e);
      toast.error("Falha ao criar tickets. Você pode abrir manualmente depois.");
      onClose();
      onDone();
    } finally {
      toast.dismiss(t);
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : null)}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-start gap-3 rounded-lg border p-3">
            <input
              type="checkbox"
              checked={createCriativo}
              onChange={(e) => setCreateCriativo(e.target.checked)}
              className="mt-1"
            />
            <div>
              <div className="font-medium text-gray-900">Abrir ticket para Criativos</div>
              <div className="text-sm text-gray-600">
                Para organizar logo, imagens e materiais visuais do cliente.
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border p-3">
            <input
              type="checkbox"
              checked={createFinanceiro}
              onChange={(e) => setCreateFinanceiro(e.target.checked)}
              className="mt-1"
            />
            <div>
              <div className="font-medium text-gray-900">Abrir ticket para Financeiro</div>
              <div className="text-sm text-gray-600">
                Para organizar cobrança, contrato e fluxo de faturamento.
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-500">
            Você pode desmarcar e seguir sem tickets. Nada será bloqueado.
          </div>
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={() => {
              onClose();
              onDone();
            }}
            className="px-4 py-2 border rounded"
            disabled={creating}
          >
            Agora não
          </button>

          <button
            type="button"
            onClick={criar}
            disabled={creating}
            className={`px-4 py-2 rounded text-white ${creating ? "bg-gray-400" : "bg-[#B70F0A] hover:bg-[#900B07]"}`}
          >
            {creating ? "Criando..." : "Continuar"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
