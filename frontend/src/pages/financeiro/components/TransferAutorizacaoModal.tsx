import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { RefreshCw, Check, User } from "lucide-react";
import axios from "@/services/api";
import toast from "react-hot-toast";

interface TransferAutorizacaoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    autorizacao: any | null;
}

export default function TransferAutorizacaoModal({ isOpen, onClose, onSuccess, autorizacao }: TransferAutorizacaoModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [vendedores, setVendedores] = useState<any[]>([]);
    const [selectedVendedor, setSelectedVendedor] = useState<string>("");

    useEffect(() => {
        if (autorizacao && isOpen) {
            setSelectedVendedor(autorizacao.vendedor_id ? String(autorizacao.vendedor_id) : "");
        }
    }, [autorizacao, isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const fetchVendedores = async () => {
            try {
                const response = await axios.get("/v1/comerciais");
                setVendedores(response.data || []);
            } catch (error) {
                console.error("Erro ao carregar vendedores", error);
            }
        };
        fetchVendedores();
    }, [isOpen]);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        
        if (!autorizacao?.id) {
            toast.error("ID da autorização não encontrado.");
            return;
        }

        if (!selectedVendedor) {
            toast.error("Selecione um vendedor.");
            return;
        }

        setIsSubmitting(true);
        const loadingToast = toast.loading("Transferindo venda...");

        try {
            await axios.patch(`/v1/autorizacoes/${autorizacao.id}/vendedor`, {
                vendedor_id: parseInt(selectedVendedor)
            });
            toast.success("Vendedor atualizado com sucesso!", { id: loadingToast });
            onSuccess();
            onClose();
        } catch (error: any) {
            const message = error.response?.data?.message || "Erro ao transferir venda.";
            toast.error(message, { id: loadingToast });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] rounded-[32px] p-0 border-none shadow-2xl">
                <form onSubmit={handleSubmit}>
                    <div className="bg-gray-900 p-8 text-white rounded-t-[32px]">
                        <DialogHeader>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/30">
                                    <User className="text-white" size={24} />
                                </div>
                                <DialogTitle className="text-2xl font-black tracking-tight">Transferir Venda</DialogTitle>
                            </div>
                            <DialogDescription className="text-gray-400 font-medium">
                                Altere o vendedor responsável pelo contrato <strong>{autorizacao?.numero}</strong>. Esta ação afeta o comissionamento.
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="p-8 space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Vendedor Atual</Label>
                            <div className="h-12 bg-gray-50 border border-gray-100 rounded-2xl flex items-center px-4 font-bold text-gray-700">
                                {autorizacao?.vendedor?.name || "Não atribuído"}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Novo Vendedor Responsável</Label>
                            <Select value={selectedVendedor} onValueChange={setSelectedVendedor}>
                                <SelectTrigger className="rounded-2xl h-12 border-gray-100 bg-gray-50/50 font-bold focus:ring-blue-600">
                                    <SelectValue placeholder="Selecione um Vendedor" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl">
                                    {vendedores.map(v => (
                                        <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter className="p-8 bg-gray-50 rounded-b-[32px] border-t border-gray-100 gap-3">
                        <Button type="button" variant="ghost" onClick={onClose} className="rounded-2xl h-14 px-8 font-bold text-gray-400 hover:text-gray-900 transition-all uppercase text-xs">
                            Cancelar
                        </Button>
                        <Button 
                            type="button" 
                            onClick={handleSubmit}
                            disabled={isSubmitting || !selectedVendedor || selectedVendedor === String(autorizacao?.vendedor_id)} 
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-14 px-12 font-black shadow-xl transition-all uppercase text-xs flex items-center gap-2"
                        >
                            {isSubmitting ? (
                                <RefreshCw className="animate-spin" size={18} />
                            ) : (
                                <Check size={18} />
                            )}
                            Confirmar Transferência
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
