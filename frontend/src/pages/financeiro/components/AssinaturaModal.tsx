import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Textarea from "@/components/ui/textarea";
import React from "react";
import { ShieldCheck, Loader2, LinkIcon } from "lucide-react";
import axios from "@/services/api";
import toast from "react-hot-toast";

interface AssinaturaModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    autorizacaoId: number | null;
    numero: number | null;
}

export default function AssinaturaModal({
    isOpen,
    onClose,
    onSuccess,
    autorizacaoId,
    numero
}: AssinaturaModalProps) {
    const [justificativa, setJustificativa] = useState("");
    const [loadingJustify, setLoadingJustify] = useState(false);
    const [loadingLink, setLoadingLink] = useState(false);

    const handleSendLink = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        
        if (!autorizacaoId) {
            toast.error("Erro interno: ID da autorização não encontrado.");
            return;
        }

        setLoadingLink(true);
        const t = toast.loading("Gerando link de assinatura...");

        try {
            const response = await axios.post(`/v1/autorizacoes/${autorizacaoId}/send-link`);
            
            // Tenta copiar para o clipboard se o link vier na resposta
            if (response.data.link) {
                navigator.clipboard.writeText(response.data.link);
                toast.success("Link copiado para o clipboard!", { id: t, icon: "📋" });
            } else {
                toast.success("Link gerado e pronto para envio!", { id: t });
            }
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error("Erro ao gerar link:", error);
            toast.error(error.response?.data?.message || "Erro ao gerar link de assinatura.", { id: t });
        } finally {
            setLoadingLink(false);
        }
    };

    const handleJustify = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!autorizacaoId) {
            toast.error("Erro interno: ID da autorização não encontrado.");
            return;
        }

        setLoadingJustify(true);
        const t = toast.loading("Processando assinatura manual...");

        try {
            await axios.post(`/v1/autorizacoes/${autorizacaoId}/justify`, {
                justificativa: justificativa.trim()
            });
            toast.success("Contrato assinado internamente!", { id: t });
            onSuccess();
            onClose();
            setJustificativa("");
        } catch (error: any) {
            console.error("Erro ao justificar:", error);
            toast.error(error.response?.data?.message || "Erro ao assinar contrato.", { id: t });
        } finally {
            setLoadingJustify(true);
            setTimeout(() => setLoadingJustify(false), 1000);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md rounded-[32px] p-0 overflow-hidden border-none shadow-2xl">
                <DialogHeader className="p-8 bg-slate-900 text-white relative">
                    <div className="flex items-center gap-3">
                        <div className="bg-emerald-500/20 p-2 rounded-2xl text-emerald-400">
                            <ShieldCheck size={28} />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold">Assinatura do Contrato</DialogTitle>
                            <DialogDescription className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-0.5">
                                Contrato #{numero?.toString().padStart(5, '0')}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-8 space-y-6 bg-white">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                            Justificativa (Opcional)
                        </label>
                        <Textarea
                            placeholder="Descreva se o cliente deu aceite por WhatsApp, Presencial, etc."
                            value={justificativa}
                            onChange={(e) => setJustificativa(e.target.value)}
                            className="min-h-[100px] rounded-2xl border-gray-100 bg-gray-50 focus:ring-emerald-500 focus:border-emerald-500 font-medium text-sm p-4 resize-none"
                        />
                        <p className="text-[9px] text-gray-400 font-bold italic leading-tight">
                            * Preencha caso queira aprovar o contrato internamente sem enviar link ao cliente. A justificativa aparecerá no PDF final.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 pt-2">
                        <Button
                            type="button"
                            onClick={() => handleSendLink()}
                            disabled={loadingLink || loadingJustify}
                            variant="outline"
                            className="w-full h-12 rounded-2xl border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 font-black uppercase text-xs gap-2"
                        >
                            {loadingLink ? <Loader2 className="animate-spin" size={16} /> : <LinkIcon size={16} />}
                            Gerar Link p/ Envio
                        </Button>
                        <Button
                            type="button"
                            onClick={() => handleJustify()}
                            disabled={loadingLink || loadingJustify}
                            className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-xs shadow-lg shadow-emerald-200 gap-2"
                        >
                            {loadingJustify ? <Loader2 className="animate-spin" size={16} /> : <ShieldCheck size={16} />}
                            Justificar e Assinar
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            className="w-full h-12 rounded-2xl font-black uppercase text-xs text-gray-400 hover:bg-gray-50 mt-1"
                        >
                            Cancelar
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
