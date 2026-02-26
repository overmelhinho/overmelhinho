import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "@/services/api";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    CheckCircle,
    FileText,
    Calendar,
    CreditCard,
    PenTool,
    Eraser,
    Lock,
    Globe,
    ShieldCheck,
    ChevronRight,
    Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

interface Autorizacao {
    id: number;
    numero: number;
    cliente: {
        nome_fantasia: string;
        razao_social: string;
        cpf_cnpj: string;
    };
    titulo_anuncio: string;
    descricao_anuncio: string | null;
    tipo_publicidade: string;
    valor_total: number;
    taxa_cadastro: number;
    valor_liquido: number;
    data_inicio: string;
    data_fim: string;
    modo_pagamento: string;
    num_parcelas: number;
    payment_method: string;
    status: string;
    parcelas: Array<{
        numero: number;
        vencimento: string;
        valor: number;
    }>;
}

export default function AutorizarPage() {
    const { token } = useParams<{ token: string }>();
    const [autorizacao, setAutorizacao] = useState<Autorizacao | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSigning, setIsSigning] = useState(false);
    const [signed, setSigned] = useState(false);

    // Canvas ref for signature
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
        const fetchAutorizacao = async () => {
            try {
                const response = await axios.get(`/v1/autorizar/${token}`);
                setAutorizacao(response.data.data);
                if (response.data.data.status === 'assinado') {
                    setSigned(true);
                }
            } catch (error) {
                toast.error("Contrato não encontrado ou expirado.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchAutorizacao();
    }, [token]);

    // Canvas Logic
    useEffect(() => {
        if (!canvasRef.current || signed) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
    }, [signed]);

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        if (signed) return;
        setIsDrawing(true);
        draw(e);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext("2d");
            ctx?.beginPath();
        }
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || !canvasRef.current || signed) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        let offsetX, offsetY;

        if ('touches' in e) {
            offsetX = e.touches[0].clientX - rect.left;
            offsetY = e.touches[0].clientY - rect.top;
        } else {
            offsetX = e.nativeEvent.offsetX;
            offsetY = e.nativeEvent.offsetY;
        }

        ctx.lineTo(offsetX, offsetY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY);
    };

    const clearCanvas = () => {
        if (!canvasRef.current) return;
        const ctx = canvasRef.current.getContext("2d");
        ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    };

    const handleSign = async () => {
        if (!canvasRef.current) return;

        // Verifica se o canvas está vazio (simplificado)
        const blank = document.createElement('canvas');
        blank.width = canvasRef.current.width;
        blank.height = canvasRef.current.height;
        if (canvasRef.current.toDataURL() === blank.toDataURL()) {
            toast.error("Por favor, faça sua assinatura no campo indicado.");
            return;
        }

        setIsSigning(true);
        try {
            const signatureBase64 = canvasRef.current.toDataURL("image/png");
            await axios.post(`/v1/autorizar/${token}`, {
                assinatura_base64: signatureBase64
            });
            setSigned(true);
            toast.success("Contrato assinado com sucesso!", { duration: 5000 });
        } catch (error) {
            toast.error("Erro ao processar assinatura.");
        } finally {
            setIsSigning(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center space-y-4">
                    <div className="h-12 w-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-gray-500 font-bold animate-pulse">Carregando Contrato Seguro...</p>
                </div>
            </div>
        );
    }

    if (!autorizacao) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6 text-center">
                <div className="max-w-md space-y-4">
                    <div className="bg-red-50 text-red-600 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                        <Lock size={40} />
                    </div>
                    <h1 className="text-2xl font-black text-gray-900 leading-tight">Link Expirado ou Inválido</h1>
                    <p className="text-gray-500 font-medium tracking-tight">
                        Este contrato não está mais disponível para assinatura digital através deste link.
                        Por favor, entre em contato com nosso atendimento para gerar um novo canal de acesso.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20">
            {/* Header / Brand */}
            <div className="bg-white border-b border-gray-100 py-6 px-6 sticky top-0 z-20 shadow-sm">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-red-600 p-2 rounded-xl shadow-lg shadow-red-600/30">
                            <ShieldCheck className="text-white" size={24} />
                        </div>
                        <div>
                            <h1 className="text-lg font-black text-gray-900 tracking-tighter">Assinatura Digital Segura</h1>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">O Vermelhinho · Farroupilha/RS</p>
                        </div>
                    </div>
                    <span className="hidden md:block text-xs font-black text-gray-400 uppercase bg-gray-100 px-3 py-1.5 rounded-full">
                        Protocolo #{(autorizacao.numero).toString().padStart(5, '0')}
                    </span>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 mt-10">
                {signed && (
                    <div className="bg-green-600 text-white p-8 rounded-[32px] mb-10 shadow-2xl shadow-green-600/20 animate-in zoom-in-95 duration-500 flex flex-col items-center text-center">
                        <div className="bg-white/20 p-4 rounded-full mb-4">
                            <CheckCircle size={48} />
                        </div>
                        <h2 className="text-3xl font-black tracking-tight mb-2">Contrato Assinado com Sucesso!</h2>
                        <p className="text-green-50 font-medium max-w-md mx-auto mb-6">
                            Obrigado, seu contrato já foi processado e validado juridicamente. Nossa equipe já foi notificada para iniciar a veiculação do seu anúncio.
                        </p>
                        <Button
                            className="bg-white text-green-700 hover:bg-green-50 font-black rounded-2xl h-12 px-8 shadow-xl"
                            onClick={() => window.print()}
                        >
                            <Download className="mr-2" size={20} /> Baixar Comprovante Assinado
                        </Button>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Contrato Content */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100 overflow-hidden relative">
                            {/* Watermark Logo Background */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none rotate-12 scale-150">
                                <FileText size={400} />
                            </div>

                            <div className="relative space-y-10">
                                <div className="border-b border-gray-100 pb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                                    <div>
                                        <h3 className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-2">Autorização de Faturamento №</h3>
                                        <p className="text-5xl font-black text-gray-900 tracking-tighter">{(autorizacao.numero).toString().padStart(5, '0')}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-gray-900">{autorizacao.cliente.nome_fantasia}</p>
                                        <p className="text-xs font-bold text-gray-400">{autorizacao.cliente.cpf_cnpj}</p>
                                    </div>
                                </div>

                                <section className="space-y-6">
                                    <h4 className="flex items-center gap-2 text-xs font-black text-gray-900 uppercase tracking-widest">
                                        <Globe size={16} className="text-red-600" /> Detalhes da Veiculação
                                    </h4>
                                    <div className="p-6 bg-gray-50 rounded-3xl space-y-4">
                                        <div className="flex justify-between items-center pb-4 border-b border-gray-200/50">
                                            <span className="text-xs font-bold text-gray-500">Formato / Título</span>
                                            <span className="text-sm font-black text-gray-900">{autorizacao.titulo_anuncio}</span>
                                        </div>
                                        <div className="flex justify-between items-center pb-4 border-b border-gray-200/50">
                                            <span className="text-xs font-bold text-gray-500">Meio de Publicação</span>
                                            <span className="text-sm font-black text-gray-900">{autorizacao.tipo_publicidade}</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-2">
                                            <span className="text-xs font-bold text-gray-500">Período de Veiculação</span>
                                            <div className="flex items-center gap-2 text-sm font-black text-gray-900">
                                                {format(new Date(autorizacao.data_inicio), "dd/MM/yyyy")} <ChevronRight size={14} className="text-red-500" /> {format(new Date(autorizacao.data_fim), "dd/MM/yyyy")}
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <section className="space-y-6">
                                    <h4 className="flex items-center gap-2 text-xs font-black text-gray-900 uppercase tracking-widest">
                                        <CreditCard size={16} className="text-red-600" /> Cronograma Financeiro
                                    </h4>
                                    <div className="space-y-3">
                                        {autorizacao.parcelas.map((p, idx) => (
                                            <div key={idx} className="flex justify-between items-center p-4 bg-white border border-gray-100 rounded-2xl hover:border-red-100 transition-colors shadow-sm">
                                                <div className="flex items-center gap-4">
                                                    <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-gray-50 text-xs font-black text-gray-400 italic">#{p.numero}</span>
                                                    <div>
                                                        <p className="text-xs font-bold text-gray-400">Vencimento</p>
                                                        <p className="text-sm font-black text-gray-900">{format(new Date(p.vencimento), "dd/MM/yyyy")}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs font-bold text-gray-400">Valor Parcela</p>
                                                    <p className="text-lg font-black text-red-600">R$ {Number(p.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-6 bg-red-600 rounded-3xl text-white flex justify-between items-center shadow-xl shadow-red-600/20">
                                        <span className="text-sm font-bold uppercase tracking-widest opacity-80">Total do Investimento</span>
                                        <span className="text-2xl font-black">R$ {Number(autorizacao.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                </section>

                                <section className="pt-8 border-t border-gray-100">
                                    <p className="text-[9px] text-gray-400 uppercase font-black mb-4 tracking-tighter">Cláusula de Aceite</p>
                                    <p className="text-xs text-gray-500 font-medium leading-relaxed italic">
                                        "Ao assinar eletronicamente este documento, o contratante declara estar de acordo com os valores, prazos e especificações aqui descritos, autorizando a veiculação do anúncio e a emissão das respectivas cobranças conforme o cronograma financeiro acima estipulado."
                                    </p>
                                </section>
                            </div>
                        </div>
                    </div>

                    {/* Signature Desk */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-32 space-y-6">
                            {!signed ? (
                                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 space-y-6 animate-in slide-in-from-right-8 duration-500">
                                    <div className="text-center">
                                        <div className="inline-flex p-3 bg-red-50 text-red-600 rounded-2xl mb-4">
                                            <PenTool size={24} />
                                        </div>
                                        <h3 className="text-xl font-black text-gray-900 tracking-tight">Assine Agora</h3>
                                        <p className="text-sm text-gray-500 font-medium">Use seu dedo, caneta digital ou mouse para assinar no campo abaixo.</p>
                                    </div>

                                    <div className="relative">
                                        <canvas
                                            ref={canvasRef}
                                            width={340}
                                            height={200}
                                            onMouseDown={startDrawing}
                                            onMouseUp={stopDrawing}
                                            onMouseMove={draw}
                                            onMouseOut={stopDrawing}
                                            onTouchStart={startDrawing}
                                            onTouchEnd={stopDrawing}
                                            onTouchMove={draw}
                                            className="w-full bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl cursor-crosshair active:border-red-300 transition-colors"
                                        />
                                        <button
                                            onClick={clearCanvas}
                                            className="absolute bottom-4 right-4 p-2 bg-white shadow-lg rounded-xl text-gray-400 hover:text-red-500 transition-colors border border-gray-50"
                                            title="Limpar Assinatura"
                                        >
                                            <Eraser size={18} />
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 p-3 rounded-xl">
                                            <ShieldCheck size={14} className="text-green-500" /> Assinatura Criptografada
                                        </div>
                                        <Button
                                            className="w-full h-14 bg-gray-900 hover:bg-black text-white font-black rounded-2xl text-lg shadow-xl shadow-gray-200 transition-all active:scale-[0.98]"
                                            onClick={handleSign}
                                            disabled={isSigning}
                                        >
                                            {isSigning ? "Validando Assinatura..." : "Confirmar e Finalizar"}
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 space-y-6">
                                    <div className="text-center py-6">
                                        <div className="bg-green-50 text-green-600 p-4 rounded-3xl inline-block mb-4">
                                            <ShieldCheck size={40} />
                                        </div>
                                        <h4 className="font-black text-gray-900">Documento Finalizado</h4>
                                        <p className="text-sm text-gray-500 font-medium mt-1">Este link é exclusivo para sua assinatura. O processo foi concluído.</p>
                                    </div>
                                    <div className="border-t border-gray-50 pt-4 flex flex-col gap-2">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase">
                                            <CheckCircle size={14} className="text-green-500" /> Assinado em {format(new Date(), "dd/MM/yyyy")}
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase">
                                            <CheckCircle size={14} className="text-green-500" /> IP Registrado
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="p-6 bg-gray-900 rounded-[32px] text-white space-y-4 shadow-xl">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/10 rounded-lg">
                                        <Calendar size={18} />
                                    </div>
                                    <p className="text-xs font-bold leading-tight">Geração do Documento<br /><span className="text-[10px] opacity-60 uppercase">{format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span></p>
                                </div>
                                <div className="text-[10px] font-medium text-gray-400 leading-relaxed">
                                    Este é um ambiente seguro desenvolvido para garantir a autenticidade jurídica da prestação de serviço de publicidade do Guia O Vermelhinho.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
