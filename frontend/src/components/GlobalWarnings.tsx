import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

type PendingCancellation = {
  id: number;
  numero: string;
  cliente: {
    id: number;
    nome_fantasia: string;
    razao_social: string;
  };
  created_at: string;
};

import api from "@/services/api";

export default function GlobalWarnings() {
  const [pendings, setPendings] = useState<PendingCancellation[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchPendings = async () => {
    try {
      const response = await api.get("/v1/autorizacoes/alertas/tiny-cancellations");
      setPendings(response.data);
    } catch (error) {
      console.error("Failed to fetch pending cancellations", error);
    }
  };

  useEffect(() => {
    fetchPendings();
    // Poll every minute
    const interval = setInterval(fetchPendings, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleResolve = async (id: number) => {
    setLoadingId(id);
    setErrorMsg(null);
    try {
      const response = await api.post(`/v1/autorizacoes/alertas/tiny-cancellations/${id}/resolve`);
      
      if (response.data && response.data.success) {
        setPendings(prev => prev.filter(p => p.id !== id));
        if (pendings.length === 1) setIsModalOpen(false); // Closed the last one
      } else {
        setErrorMsg(response.data?.message || "Erro ao resolver a pendência.");
      }
    } catch (error: any) {
      setErrorMsg(error.response?.data?.message || "Erro de rede ao tentar resolver a pendência.");
    } finally {
      setLoadingId(null);
    }
  };

  if (pendings.length === 0) return null;

  return (
    <>
      <div className="hidden lg:flex bg-red-600 text-white px-4 py-2 items-center justify-center gap-4 text-sm font-medium z-50">
        <span>
          ⚠️ ATENÇÃO: Você possui {pendings.length} autorização(ões) cancelada(s) que precisam ter suas faturas excluídas MANUALMENTE no Tiny ERP!
        </span>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-white text-red-600 px-3 py-1 rounded font-bold hover:bg-gray-100 transition"
        >
          Ver Detalhes e Resolver
        </button>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-red-600 flex items-center gap-2">
              ⚠️ Pendências de Exclusão no Tiny ERP
            </DialogTitle>
          </DialogHeader>
          
          <div className="text-sm text-gray-600 mb-4">
            As autorizações abaixo foram canceladas no painel, mas possuíam faturas geradas no Tiny ERP. 
            Você deve ir até o Tiny ERP, localizar o cliente ou autorização e excluir as faturas antigas para não gerar cobrança duplicada.
            Só clique em "Já Excluí" após confirmar lá!
          </div>

          {errorMsg && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200 mb-4 font-medium">
              {errorMsg}
            </div>
          )}

          <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto">
            {pendings.map(auth => (
              <div key={auth.id} className="border rounded-xl p-4 flex items-center justify-between bg-gray-50">
                <div>
                  <div className="font-bold text-gray-900">Autorização #{auth.numero}</div>
                  <div className="text-sm text-gray-600">{auth.cliente.nome_fantasia || auth.cliente.razao_social}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    Cancelada em: {format(new Date(auth.updated_at || auth.created_at), "dd/MM/yyyy HH:mm")}
                  </div>
                </div>
                <Button 
                  onClick={() => handleResolve(auth.id)}
                  disabled={loadingId === auth.id}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {loadingId === auth.id ? "Verificando..." : "Já Excluí no Tiny"}
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
