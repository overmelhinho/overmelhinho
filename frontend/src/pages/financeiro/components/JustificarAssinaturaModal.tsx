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
import { ShieldCheck, Loader2 } from "lucide-react";
import axios from "@/services/api";
import toast from "react-hot-toast";

interface JustificarAssinaturaModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    autorizacaoId: number | null;
    numero: number | null;
}

export default function JustificarAssinaturaModal({
    isOpen,
    onClose,
    onSuccess,
    autorizacaoId,
    numero
}: JustificarAssinaturaModalProps) {
    const [justificativa, setJustificativa] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!autorizacaoId) {
            toast.error("Erro interno: ID da autorização não encontrado.");
            return;
        }

        if (justificativa.trim().length < 5) {
            toast.error("A justificativa deve ter pelo menos 5 caracteres.");
            return;
        }

        setLoading(true);
        const t = toast.loading("Processando aprovação manual...");

        try {
            console.log(`Justificando autorizacao ${autorizacaoId}...`);
            await axios.post(`/v1/autorizacoes/${autorizacaoId}/justify`, {
                justificativa
            });
            toast.success("Contrato aprovado via justificativa!", { id: t });
            onSuccess();
            onClose();
            setJustificativa("");
        } catch (error: any) {
            console.error("Erro ao justificar:", error);
            toast.error(error.response?.data?.message || "Erro ao justificar assinatura.", { id: t });
        } finally {
            setLoading(true); // Mantem loading true por um momento para evitar multiplos cliques
            setTimeout(() => setLoading(false), 1000);
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
                            <DialogTitle className="text-xl font-bold">Justificar Assinatura</DialogTitle>
                            <DialogDescription className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-0.5">
                                Contrato #{numero?.toString().padStart(5, '0')}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="p-8 space-y-6 bg-white">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                            Motivo do Aceite Manual
                        </label>
                        <Textarea
                            placeholder="Descreva como o cliente deu o aceite (ex: Via WhatsApp em 13/03, Presencial, etc)"
                            value={justificativa}
                            onChange={(e) => setJustificativa(e.target.value)}
                            className="min-h-[120px] rounded-2xl border-gray-100 bg-gray-50 focus:ring-emerald-500 focus:border-emerald-500 font-medium text-sm p-4 resize-none"
                            required
                        />
                        <p className="text-[9px] text-gray-400 font-bold italic leading-tight">
                            * Esta justificativa aparecerá impressa no PDF final do contrato no lugar da assinatura digital.
                        </p>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            className="flex-1 h-12 rounded-2xl font-black uppercase text-xs text-gray-400 hover:bg-gray-50"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            onClick={() => handleSubmit()}
                            disabled={loading || justificativa.trim().length < 5}
                            className="flex-[2] h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-xs shadow-lg shadow-emerald-200 gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" size={16} /> : <ShieldCheck size={16} />}
                            Aprovar Contrato
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
