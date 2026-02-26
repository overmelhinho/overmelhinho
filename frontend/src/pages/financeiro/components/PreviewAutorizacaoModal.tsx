import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, Download, X, Printer, Maximize2 } from "lucide-react";

interface PreviewAutorizacaoModalProps {
    isOpen: boolean;
    onClose: () => void;
    autorizacaoId: number | null;
    numero: number | null;
}

export default function PreviewAutorizacaoModal({
    isOpen,
    onClose,
    autorizacaoId,
    numero
}: PreviewAutorizacaoModalProps) {
    if (!autorizacaoId) return null;

    const previewUrl = `${import.meta.env.VITE_API_URL}/v1/autorizacoes/${autorizacaoId}/preview`;
    const downloadUrl = `${import.meta.env.VITE_API_URL}/v1/autorizacoes/${autorizacaoId}/pdf`;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl w-[95vw] h-[90vh] p-0 overflow-hidden flex flex-col rounded-2xl border-none shadow-2xl">
                <DialogHeader className="p-4 bg-white border-b flex flex-row items-center justify-between space-y-0">
                    <div>
                        <DialogTitle className="text-lg font-black text-gray-900 flex items-center gap-2">
                            <Printer className="text-red-500" size={20} />
                            Contrato #{numero?.toString().padStart(5, '0')}
                        </DialogTitle>
                        <DialogDescription className="text-xs font-bold text-gray-500 uppercase tracking-tight">
                            Visualização do Documento Digital
                        </DialogDescription>
                    </div>

                    <div className="flex items-center gap-2 pr-6">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 rounded-xl font-bold bg-gray-50 border-gray-100 hover:bg-white hover:border-red-200 transition-all gap-2"
                            onClick={() => window.open(previewUrl, '_blank')}
                        >
                            <Maximize2 size={16} />
                            Expandir
                        </Button>
                        <Button
                            variant="default"
                            size="sm"
                            className="h-9 rounded-xl font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20 transition-all gap-2"
                            onClick={() => window.open(downloadUrl, '_blank')}
                        >
                            <Download size={16} />
                            Baixar PDF
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-all"
                            onClick={onClose}
                        >
                            <X size={20} />
                        </Button>
                    </div>
                </DialogHeader>

                <div className="flex-1 bg-gray-100 relative">
                    {/* Loader overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                        <Printer size={80} className="text-red-600 animate-pulse" />
                    </div>

                    <iframe
                        src={`${previewUrl}#toolbar=0`}
                        className="w-full h-full border-none relative z-10"
                        title="Visualização do Contrato"
                    />
                </div>

                <div className="p-3 bg-gray-50 border-t flex justify-center">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <ExternalLink size={12} />
                        Este é um documento gerado automaticamente pelo sistema O Vermelhinho.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
