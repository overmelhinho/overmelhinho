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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { User, Check } from "lucide-react";
import axios from "@/services/api";
import toast from "react-hot-toast";

interface EditAutorizacaoContatoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    autorizacao: any;
}

export default function EditAutorizacaoContatoModal({ isOpen, onClose, onSuccess, autorizacao }: EditAutorizacaoContatoModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form, setForm] = useState({
        responsavel_nome: "",
        responsavel_preferencia: "",
        responsavel_turno: ""
    });

    useEffect(() => {
        if (autorizacao) {
            setForm({
                responsavel_nome: autorizacao.responsavel_nome || "",
                responsavel_preferencia: autorizacao.responsavel_preferencia || "",
                responsavel_turno: autorizacao.responsavel_turno || ""
            });
        }
    }, [autorizacao]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await axios.put(`/v1/autorizacoes/${autorizacao.id}`, form);
            toast.success("Dados de contato atualizados!");
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Erro ao atualizar contato:", error);
            toast.error("Erro ao atualizar dados de contato.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] rounded-3xl p-0 border-none shadow-2xl">
                <form onSubmit={handleSubmit}>
                    <div className="bg-gray-900 p-6 text-white">
                        <DialogHeader>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-red-600 rounded-lg">
                                    <User className="text-white" size={20} />
                                </div>
                                <DialogTitle className="text-xl font-black">Editar Dados de Contato</DialogTitle>
                            </div>
                            <DialogDescription className="text-gray-400 font-medium">
                                Atualize as informações de contato para o contrato #{autorizacao?.numero?.toString().padStart(5, '0')}.
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="p-6 space-y-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Responsável</Label>
                            <Input
                                value={form.responsavel_nome}
                                onChange={(e) => setForm({ ...form, responsavel_nome: e.target.value })}
                                placeholder="Nome do Responsável"
                                className="rounded-xl h-11 border-gray-200 font-bold focus:ring-red-500"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Preferência de Contato</Label>
                            <Select 
                                value={form.responsavel_preferencia} 
                                onValueChange={(v) => setForm({ ...form, responsavel_preferencia: v })}
                            >
                                <SelectTrigger className="rounded-xl h-11 border-gray-200 font-bold">
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl font-bold">
                                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                                    <SelectItem value="ligacao">Ligação</SelectItem>
                                    <SelectItem value="presencial">Presencial</SelectItem>
                                    <SelectItem value="email">E-mail</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Melhor Turno</Label>
                            <Select 
                                value={form.responsavel_turno} 
                                onValueChange={(v) => setForm({ ...form, responsavel_turno: v })}
                            >
                                <SelectTrigger className="rounded-xl h-11 border-gray-200 font-bold">
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl font-bold">
                                    <SelectItem value="manha">Manhã</SelectItem>
                                    <SelectItem value="tarde">Tarde</SelectItem>
                                    <SelectItem value="ambos">Ambos os Turnos</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter className="p-6 bg-gray-50 rounded-b-3xl gap-2 sm:justify-end">
                        <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl font-bold">
                            Cancelar
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="bg-gray-900 hover:bg-black text-white font-black rounded-xl px-8 shadow-lg transition-all flex items-center gap-2"
                        >
                            {isSubmitting ? "Salvando..." : <><Check size={18} /> Salvar Alterações</>}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
