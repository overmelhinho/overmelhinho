import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "@/services/api";
import { format } from "date-fns";
import { 
    ShoppingCart, 
    Download, 
    Filter, 
    Calendar, 
    User, 
    CreditCard, 
    CheckCircle2, 
    Clock,
    Search,
    FileText,
    ChevronDown,
    ChevronUp,
    Printer,
    Plus,
    ExternalLink,
    Landmark,
    Undo2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import toast from "react-hot-toast";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DateRangePicker } from "@/components/reports/DateRangePicker";
import { cn } from "@/lib/utils";
import { useCidades } from "@/hooks/useCidades";

export default function SalesReportsTab() {
    const today = new Date();
    const firstDay = format(new Date(today.getFullYear(), today.getMonth(), 1), "yyyy-MM-dd");
    const lastDay = format(new Date(today.getFullYear(), today.getMonth() + 1, 0), "yyyy-MM-dd");

    // Basic Filters
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [planId, setPlanId] = useState("all");
    const [vendedorId, setVendedorId] = useState("all");
    const [collectionTypes, setCollectionTypes] = useState<string[]>([]);
    const [status, setStatus] = useState("all");

    // Advanced Filters
    const [termo, setTermo] = useState("");
    const [tipoPfPj, setTipoPfPj] = useState("all");
    const [cidade, setCidade] = useState("all");
    const [bairro, setBairro] = useState("");
    const [telefone, setTelefone] = useState("");
    const [numeroAutorizacao, setNumeroAutorizacao] = useState("");
    const [numeroAutorizacaoDe, setNumeroAutorizacaoDe] = useState("");
    const [numeroAutorizacaoAte, setNumeroAutorizacaoAte] = useState("");
    const [dataCadInicial, setDataCadInicial] = useState("");
    const [dataCadFinal, setDataCadFinal] = useState("");
    const [tipoPublicidade, setTipoPublicidade] = useState("all");

    // Search state to trigger queries cleanly
    const [searchTrigger, setSearchTrigger] = useState(0);

    // Multi-select state
    const [selectedInvoices, setSelectedInvoices] = useState<number[]>([]);
    const [isBulkSettleModalOpen, setIsBulkSettleModalOpen] = useState(false);
    const [undoInvoiceId, setUndoInvoiceId] = useState<number | null>(null);
    const queryClient = useQueryClient();

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);

    const getFilterParams = () => {
        const params = new URLSearchParams();
        if (startDate && endDate) {
            params.append("start_date", startDate);
            params.append("end_date", endDate);
        }
        if (planId !== "all") params.append("plan_id", planId);
        if (vendedorId !== "all") params.append("vendedor_id", vendedorId);
        if (collectionTypes.length > 0) {
            params.append("collection_type", collectionTypes.join(","));
        }
        if (status !== "all") params.append("status", status);

        if (termo) params.append("termo", termo);
        if (tipoPfPj !== "all") params.append("tipo_pf_pj", tipoPfPj);
        if (cidade && cidade !== "all") params.append("cidade", cidade);
        if (bairro) params.append("bairro", bairro);
        if (telefone) params.append("telefone", telefone);
        if (numeroAutorizacao) params.append("numero_autorizacao", numeroAutorizacao);
        if (numeroAutorizacaoDe) params.append("numero_autorizacao_de", numeroAutorizacaoDe);
        if (numeroAutorizacaoAte) params.append("numero_autorizacao_ate", numeroAutorizacaoAte);
        if (dataCadInicial && dataCadFinal) {
            params.append("data_cad_inicial", dataCadInicial);
            params.append("data_cad_final", dataCadFinal);
        }
        if (tipoPublicidade !== "all") params.append("tipo_publicidade", tipoPublicidade);

        return params;
    };

    const { data: cidadesList } = useCidades();

    const { data: salesData, isLoading, refetch } = useQuery({
        queryKey: ["sales-report-v2", startDate, endDate, planId, vendedorId, collectionTypes, status, termo, numeroAutorizacao, numeroAutorizacaoDe, numeroAutorizacaoAte, cidade, bairro, searchTrigger],
        queryFn: async () => {
            const params = getFilterParams();
            const resp = await axios.get(`/v1/admin/reports/sales?${params.toString()}`);
            return resp.data;
        }
    });

    const { data: plans } = useQuery({
        queryKey: ["plans"],
        queryFn: async () => {
            const resp = await axios.get("/v1/plans");
            return resp.data;
        }
    });

    const { data: vendedores } = useQuery({
        queryKey: ["comerciais"],
        queryFn: async () => {
            const resp = await axios.get("/v1/comerciais");
            return resp.data;
        }
    });

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const handleSearchClick = () => {
        setCurrentPage(1);
        setSearchTrigger(prev => prev + 1);
    };

    const handleExportCSV = () => {
        if (!salesData?.data) return;

        const headers = ["Autorização", "Cliente", "Plano", "Parcela", "Vendedor", "Tot. Aut.", "Fatura", "Restante Aut.", "Vencimento", "Status", "Metodo Pagamento"];
        const rows = salesData.data.map((sale: any) => [
            sale.autorizacao_numero ? `#${sale.autorizacao_numero}` : '-',
            `"${(sale.cliente || '').replace(/"/g, '""')}"`,
            sale.plano,
            sale.parcel_number ? `${sale.parcel_number}/${sale.total_parcels}` : 'Única',
            sale.vendedor,
            sale.auth_valor_total?.toFixed(2).replace('.', ','),
            sale.amount.toFixed(2).replace('.', ','),
            sale.auth_valor_restante?.toFixed(2).replace('.', ','),
            format(new Date(sale.due_date), "dd/MM/yyyy"),
            sale.status === 'paid' ? 'Recebido' : 'Pendente',
            sale.payment_method
        ]);

        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
            + headers.join(";") + "\n" 
            + rows.map((e: any) => e.join(";")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Relatorio_Vendas_${startDate}_${endDate}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportPDF = async () => {
        try {
            const params = getFilterParams();
            const response = await axios.get(`/v1/admin/reports/sales/pdf?${params.toString()}`, {
                responseType: 'blob'
            });

            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (error) {
            console.error("Erro ao exportar PDF:", error);
            alert("Erro ao gerar PDF. Verifique os filtros e tente novamente.");
        }
    };

    const handleBulkDownloadReceipts = async () => {
        if (selectedInvoices.length === 0) return;
        try {
            const loadingToast = toast.loading("Gerando pacote de recibos...");
            const response = await axios.post(`/v1/financial/invoices/batch-receipts`, {
                ids: selectedInvoices
            }, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Recibos_Vendas_Lote_${format(new Date(), 'ddMMyyHHmm')}.zip`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success("Download iniciado!", { id: loadingToast });
            setSelectedInvoices([]);
        } catch (error) {
            toast.error("Erro ao gerar download em lote.");
        }
    };

    const handleBulkMarkAsPaid = async () => {
        if (selectedInvoices.length === 0) return;

        try {
            const loadingToast = toast.loading("Processando baixa em lote...");
            await axios.post(`/v1/financial/invoices/settle-batch`, {
                ids: selectedInvoices,
                payment_method: 'pix',
                justification: "Baixa em lote realizada pelo administrativo via Relatório de Vendas."
            });
            toast.success("Baixa em lote concluída!", { id: loadingToast });
            setSelectedInvoices([]);
            setIsBulkSettleModalOpen(false);
            refetch();
        } catch (error) {
            toast.error("Erro ao realizar baixa em lote.");
        }
    };

    const toggleSelectInvoice = (id: number) => {
        setSelectedInvoices(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handlePrintReceipt = async (id: number) => {
        try {
            const loadingToast = toast.loading("Gerando recibo...");
            const response = await axios.get(`/v1/financial/invoices/${id}/receipt`, {
                responseType: 'blob'
            });
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
            toast.success("Recibo gerado!", { id: loadingToast });
        } catch (error) {
            console.error("Erro ao gerar recibo:", error);
            toast.error("Erro ao gerar recibo.");
        }
    };

    const handleUndoPayment = async () => {
        if (!undoInvoiceId) return;
        try {
            const loadingToast = toast.loading("Desfazendo pagamento...");
            await axios.patch(`/v1/financial/invoices/${undoInvoiceId}/status`, {
                status: 'pending',
                justification: 'Desfeito pelo painel administrativo'
            });
            toast.success("Pagamento desfeito com sucesso!", { id: loadingToast });
            setUndoInvoiceId(null);
            refetch();
        } catch (error) {
            console.error("Erro ao desfazer pagamento:", error);
            toast.error("Erro ao desfazer pagamento.");
        }
    };

    const toggleSelectAll = () => {
        if (selectedInvoices.length === salesData?.data?.length) {
            setSelectedInvoices([]);
        } else {
            setSelectedInvoices(salesData?.data?.map((i: any) => i.id) || []);
        }
    };

    const totalItems = salesData?.data?.length || 0;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const paginatedSales = salesData?.data?.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    ) || [];

    return (
        <div className="p-6 bg-[#F8F9FC] min-h-screen space-y-6">
            {/* Filtros */}
            <Card className="p-6 border-none shadow-sm rounded-2xl bg-white overflow-visible transition-all">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                        <Filter size={18} className="text-red-600" />
                        <h2 className="text-sm font-black uppercase tracking-widest text-gray-900">Filtros do Relatório</h2>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Nº Autorização (Faixa)</label>
                        <div className="flex items-center gap-1.5">
                            <Input 
                                placeholder="De" 
                                className="rounded-xl border-gray-100 bg-gray-50/50 h-10 text-xs text-center font-semibold"
                                value={numeroAutorizacaoDe}
                                onChange={e => setNumeroAutorizacaoDe(e.target.value)}
                            />
                            <span className="text-gray-300 text-[10px] font-black uppercase">a</span>
                            <Input 
                                placeholder="Até" 
                                className="rounded-xl border-gray-100 bg-gray-50/50 h-10 text-xs text-center font-semibold"
                                value={numeroAutorizacaoAte}
                                onChange={e => setNumeroAutorizacaoAte(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2 lg:col-span-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Período Vencimento</label>
                        <DateRangePicker 
                            startDate={startDate} 
                            endDate={endDate} 
                            onRangeChange={(start, end) => {
                                setStartDate(start);
                                setEndDate(end);
                            }}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Tipo de Produto</label>
                        <Select value={planId} onValueChange={setPlanId}>
                            <SelectTrigger className="rounded-xl border-gray-100 bg-gray-50/50">
                                <SelectValue placeholder="Todos os Planos" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os Planos</SelectItem>
                                {plans?.map((p: any) => (
                                    <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Vendedor</label>
                        <Select value={vendedorId} onValueChange={setVendedorId}>
                            <SelectTrigger className="rounded-xl border-gray-100 bg-gray-50/50">
                                <SelectValue placeholder="Todos os Vendedores" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os Vendedores</SelectItem>
                                {vendedores?.map((v: any) => (
                                    <SelectItem key={v.id} value={v.id.toString()}>{v.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Cobrança / Pagamento</label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="w-full justify-between rounded-xl border-gray-100 bg-gray-50/50 h-10 px-3 text-left font-normal text-xs hover:bg-gray-50/50 hover:border-gray-200 transition-all shadow-none"
                                >
                                    <span className="truncate text-gray-750 font-bold">
                                        {collectionTypes.length === 0
                                            ? "Todos os tipos"
                                            : collectionTypes.length === 1
                                            ? [
                                                { value: "bank", label: "Boleto Bancário" },
                                                { value: "card", label: "Cartão de Crédito/Débito" },
                                                { value: "pix", label: "Pix / Transferência" },
                                                { value: "cash", label: "Cheque / Dinheiro" },
                                                { value: "permuta", label: "Permuta" }
                                              ].find(o => o.value === collectionTypes[0])?.label
                                            : `${collectionTypes.length} selecionados`}
                                    </span>
                                    <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[220px] p-2 bg-white rounded-xl shadow-md border border-gray-100 z-50" align="start">
                                <div className="space-y-1">
                                    {[
                                        { value: "bank", label: "Boleto Bancário" },
                                        { value: "card", label: "Cartão de Crédito/Débito" },
                                        { value: "pix", label: "Pix / Transferência" },
                                        { value: "cash", label: "Cheque / Dinheiro" },
                                        { value: "permuta", label: "Permuta" }
                                    ].map((option) => {
                                        const isSelected = collectionTypes.includes(option.value);
                                        return (
                                            <div
                                                key={option.value}
                                                onClick={() => {
                                                    setCollectionTypes(prev =>
                                                        prev.includes(option.value)
                                                            ? prev.filter(v => v !== option.value)
                                                            : [...prev, option.value]
                                                    );
                                                }}
                                                className={cn(
                                                    "flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer text-xs font-semibold hover:bg-red-50/50 hover:text-[#B70F0A] transition-all",
                                                    isSelected && "bg-red-50 text-[#B70F0A]"
                                                )}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => {}} // handled by click
                                                    className="rounded border-gray-300 text-red-600 focus:ring-red-500 h-4 w-4 cursor-pointer"
                                                />
                                                <span>{option.label}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Situação</label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="rounded-xl border-gray-100 bg-gray-50/50">
                                <SelectValue placeholder="Todos os status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos (Aberto e Pago)</SelectItem>
                                <SelectItem value="paid">Pago</SelectItem>
                                <SelectItem value="pending">Em Aberto</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                        <div className="space-y-2 lg:col-span-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Termo da Consulta (Nome/Razão/CNPJ)</label>
                            <Input 
                                placeholder="Buscar..." 
                                className="rounded-xl border-gray-100 bg-gray-50/50 h-10"
                                value={termo}
                                onChange={e => setTermo(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Tipo de Cliente</label>
                            <Select value={tipoPfPj} onValueChange={setTipoPfPj}>
                                <SelectTrigger className="rounded-xl border-gray-100 bg-gray-50/50 h-10">
                                    <SelectValue placeholder="PF / PJ" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Ambos</SelectItem>
                                    <SelectItem value="pf">Pessoa Física</SelectItem>
                                    <SelectItem value="pj">Pessoa Jurídica</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Cidade</label>
                            <Select value={cidade} onValueChange={setCidade}>
                                <SelectTrigger className="rounded-xl border-gray-100 bg-gray-50/50 h-10">
                                    <SelectValue placeholder="Todas as cidades" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas as cidades</SelectItem>
                                    {cidadesList?.map((c) => (
                                        <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Bairro</label>
                            <Input 
                                placeholder="Bairro" 
                                className="rounded-xl border-gray-100 bg-gray-50/50 h-10"
                                value={bairro}
                                onChange={e => setBairro(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Telefone</label>
                            <Input 
                                placeholder="Ex: 54999..." 
                                className="rounded-xl border-gray-100 bg-gray-50/50 h-10"
                                value={telefone}
                                onChange={e => setTelefone(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2 lg:col-span-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Data Emissão (Cad. Inicial/Final)</label>
                            <DateRangePicker 
                                startDate={dataCadInicial} 
                                endDate={dataCadFinal} 
                                onRangeChange={(start, end) => {
                                    setDataCadInicial(start);
                                    setDataCadFinal(end);
                                }}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Tipo de Publicidade</label>
                            <Select value={tipoPublicidade} onValueChange={setTipoPublicidade}>
                                <SelectTrigger className="rounded-xl border-gray-100 bg-gray-50/50 h-10">
                                    <SelectValue placeholder="WEB/Impressa" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas</SelectItem>
                                    <SelectItem value="WEB">WEB</SelectItem>
                                    <SelectItem value="APP">APP</SelectItem>
                                    <SelectItem value="IMPRESSO">Impressa</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2 lg:col-span-2 flex items-end">
                            <Button 
                                onClick={handleSearchClick}
                                className="w-full rounded-xl bg-gray-900 hover:bg-black text-white font-bold h-10 gap-2 shadow-sm"
                            >
                                <Search size={16} />
                                Aplicar Filtros Avançados
                            </Button>
                        </div>
                    </div>
            </Card>

            {/* Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="p-6 border-none shadow-sm rounded-3xl bg-white flex flex-col justify-between">
                    <div>
                        <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center text-red-600 mb-4">
                            <ShoppingCart size={20} />
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Volume de Faturas</p>
                    </div>
                    <div>
                        <h3 className="text-3xl font-black text-gray-900 tracking-tighter">
                            {salesData?.summary?.count || 0}
                        </h3>
                        <p className="text-xs font-medium text-gray-400">parcelas no período</p>
                    </div>
                </Card>

                <Card className="p-6 border-none shadow-sm rounded-3xl bg-gray-900 flex flex-col justify-between text-white">
                    <div>
                        <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white mb-4">
                            <CreditCard size={20} />
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Valor Total Bruto</p>
                    </div>
                    <div>
                        <h3 className="text-3xl font-black text-white tracking-tighter">
                            {formatCurrency(salesData?.summary?.total_amount || 0)}
                        </h3>
                        <p className="text-xs font-medium text-gray-500">total bruto filtrado</p>
                    </div>
                </Card>

                <Card className="p-6 border-none shadow-sm rounded-3xl bg-white flex flex-col justify-between">
                    <div>
                        <div className="w-10 h-10 rounded-2xl bg-green-50 flex items-center justify-center text-green-600 mb-4">
                            <CheckCircle2 size={20} />
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Valor Total Recebido</p>
                    </div>
                    <div>
                        <h3 className="text-3xl font-black text-green-600 tracking-tighter">
                            {formatCurrency(salesData?.summary?.paid_amount || 0)}
                        </h3>
                        <p className="text-xs font-medium text-gray-400">faturas quitadas</p>
                    </div>
                </Card>

                <Card className="p-6 border-none shadow-sm rounded-3xl bg-white flex flex-col justify-between">
                    <div>
                        <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 mb-4">
                            <Clock size={20} />
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Valor Em Aberto</p>
                    </div>
                    <div>
                        <h3 className="text-3xl font-black text-orange-600 tracking-tighter">
                            {formatCurrency(salesData?.summary?.pending_amount || 0)}
                        </h3>
                        <p className="text-xs font-medium text-gray-400">aguardando pagamento</p>
                    </div>
                </Card>
            </div>

            {/* Listagem */}
            <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-gray-900 border border-gray-100">
                            <ShoppingCart size={14} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-gray-900 tracking-tight">Detalhamento Financeiro</h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Lista completa de faturas/parcelas (Nº Guia)</p>
                        </div>
                    </div>
                    
                    <div className="flex gap-2">
                        {selectedInvoices.length > 0 && (
                            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 mr-4">
                                <span className="text-[10px] font-black uppercase text-gray-400 mr-2">
                                    {selectedInvoices.length} selecionado(s)
                                </span>
                                <button
                                    onClick={handleBulkDownloadReceipts}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors font-bold text-[10px] uppercase border border-emerald-100"
                                >
                                    <Printer size={14} />
                                    Baixar Recibos
                                </button>
                                <button
                                    onClick={() => setIsBulkSettleModalOpen(true)}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-bold text-[10px] uppercase border border-blue-100"
                                >
                                    <CheckCircle2 size={14} />
                                    Marcar como Pago
                                </button>
                                <button
                                    onClick={() => setSelectedInvoices([])}
                                    className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                                    title="Limpar seleção"
                                >
                                    <Plus size={14} className="rotate-45" />
                                </button>
                            </div>
                        )}
                        
                        <Button 
                            onClick={handleExportCSV}
                            variant="outline" 
                            className="rounded-xl border-gray-200 text-xs font-bold gap-2 bg-white hover:bg-gray-50 transition-all"
                        >
                            <Download size={14} />
                            Exportar CSV
                        </Button>
                        <Button 
                            onClick={handleExportPDF}
                            className="rounded-xl bg-gray-900 border-gray-900 text-xs font-bold gap-2 text-white hover:bg-black transition-all"
                        >
                            <FileText size={14} />
                            Exportar PDF
                        </Button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left" style={{ minWidth: '1050px' }}>
                        <thead>
                            <tr className="bg-gray-50/30 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 border-b border-gray-50">
                                <th className="px-4 py-5 w-10">
                                    <input
                                        type="checkbox"
                                        checked={salesData?.data?.length > 0 && selectedInvoices.length === salesData?.data?.length}
                                        onChange={toggleSelectAll}
                                        className="rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer h-4 w-4"
                                    />
                                </th>
                                <th className="px-8 py-5">Nº Guia / Aut</th>
                                <th className="px-6 py-5">Cliente</th>
                                <th className="px-6 py-5">Plano / Parcela</th>
                                <th className="px-6 py-5">Vendedor</th>
                                <th className="px-6 py-5">Total Aut.</th>
                                <th className="px-6 py-5">Valor Fatura</th>
                                <th className="px-6 py-5">Restante</th>
                                <th className="px-6 py-5">Vencimento</th>
                                <th className="px-6 py-5">Situação</th>
                                <th className="sticky right-0 bg-gray-50/30 px-6 py-5 text-right shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.06)] z-10">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                                            <span className="text-xs font-bold text-gray-300">Processando faturas financeiras...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : salesData?.data?.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-20 text-center">
                                        <p className="text-sm font-bold text-gray-300">Nenhuma parcela/fatura encontrada para os filtros selecionados.</p>
                                    </td>
                                </tr>
                            ) : (
                                paginatedSales.map((sale: any) => (
                                    <tr key={sale.id} className={cn(
                                        "hover:bg-gray-50/50 transition-colors group",
                                        selectedInvoices.includes(sale.id) && "bg-red-50/30"
                                    )}>
                                        <td className="px-4 py-5">
                                            <input
                                                type="checkbox"
                                                checked={selectedInvoices.includes(sale.id)}
                                                onChange={() => toggleSelectInvoice(sale.id)}
                                                className="rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer h-4 w-4"
                                            />
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-gray-900 group-hover:text-red-600 transition-colors">
                                                    {sale.autorizacao_numero ? sale.autorizacao_numero.toString().padStart(5,'0') : 'N/A'}
                                                </span>
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-1">
                                                    Fatura: {sale.id}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-800 tracking-tight">{sale.cliente}</span>
                                                {sale.cliente_nome_fantasia && sale.cliente_nome_fantasia !== sale.cliente && (
                                                    <span className="text-[10px] font-medium text-gray-500 italic">
                                                        {sale.cliente_nome_fantasia}
                                                    </span>
                                                )}
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5">
                                                    {sale.payment_method === 'boleto' ? 'Boleto Bancário' : 
                                                     sale.payment_method === 'cartao' ? 'Cartão de Crédito/Débito' : 
                                                     sale.payment_method === 'pix' ? 'Pix / Transferência' :
                                                     sale.payment_method === 'permuta' ? 'Permuta' :
                                                     'Dinheiro / Direta'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-md border border-gray-100 w-fit">{sale.plano}</span>
                                                <span className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-tighter">
                                                    Parcela {sale.parcel_number || 1}/{sale.total_parcels || 1}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
                                                    <User size={12} />
                                                </div>
                                                <span className="text-xs font-bold text-gray-600">{sale.vendedor}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-xs font-bold text-gray-400 block mb-0.5 tracking-tight">
                                                {formatCurrency(sale.auth_valor_total)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-sm font-black text-gray-900">{formatCurrency(sale.amount)}</span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-xs font-bold text-orange-600 block mb-0.5 tracking-tight">
                                                {formatCurrency(sale.auth_valor_restante)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-xs font-bold text-gray-500">
                                            {format(new Date(sale.due_date), "dd/MM/yyyy")}
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={cn(
                                                "inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border",
                                                sale.status === 'paid' 
                                                    ? "bg-green-50 text-green-700 border-green-100" 
                                                    : "bg-orange-50 text-orange-700 border-orange-100"
                                            )}>
                                                {sale.status === 'paid' ? 'Pago (PG)' : 'Aberto (AB)'}
                                            </span>
                                        </td>
                                        <td className="sticky right-0 bg-white px-6 py-5 text-right group-hover:bg-gray-50/50 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.06)] z-10">
                                            <div className="flex items-center justify-end gap-2">
                                                {sale.autorizacao_id && (
                                                    <button
                                                        onClick={() => window.open(`/clientes/${sale.cliente_id}/editar?step=12&auth_id=${sale.autorizacao_id}`, '_blank')}
                                                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                                        title="Abrir Financeiro do Cliente"
                                                    >
                                                        <ExternalLink size={14} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handlePrintReceipt(sale.id)}
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                                                    title="Imprimir Recibo"
                                                >
                                                    <Printer size={14} />
                                                </button>
                                                {sale.status === 'paid' && (
                                                    <button
                                                        onClick={() => setUndoInvoiceId(sale.id)}
                                                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors"
                                                        title="Desfazer Pagamento"
                                                    >
                                                        <Undo2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                {(salesData?.data?.length || 0) > 0 && (
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-500 font-medium text-xs">Mostrar:</span>
                                    <Select
                                        value={String(itemsPerPage)}
                                        onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}
                                    >
                                        <SelectTrigger className="w-[70px] h-8 bg-white border-gray-200 text-xs font-bold rounded-lg">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                                            <SelectItem value="50">50</SelectItem>
                                            <SelectItem value="100">100</SelectItem>
                                            <SelectItem value="150">150</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <span className="text-gray-500 text-xs">
                                    Mostrando{' '}
                                    {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}{' '}a{' '}
                                    {Math.min(currentPage * itemsPerPage, totalItems)}{' '}de{' '}
                                    <span className="font-bold text-gray-900">{totalItems}</span> faturas
                                </span>
                            </div>

                            {totalPages > 1 && (
                                <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 p-1">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="h-7 w-7 p-0 rounded-md text-xs font-bold disabled:opacity-40"
                                    >
                                        ‹
                                    </Button>
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let page: number;
                                        if (totalPages <= 5) {
                                            page = i + 1;
                                        } else if (currentPage <= 3) {
                                            page = i + 1;
                                        } else if (currentPage >= totalPages - 2) {
                                            page = totalPages - 4 + i;
                                        } else {
                                            page = currentPage - 2 + i;
                                        }
                                        return (
                                            <button
                                                key={page}
                                                onClick={() => setCurrentPage(page)}
                                                className={cn(
                                                    "h-7 w-7 rounded-md text-xs font-bold transition-colors",
                                                    currentPage === page
                                                        ? "bg-gray-900 text-white"
                                                        : "text-gray-500 hover:bg-gray-100"
                                                )}
                                            >
                                                {page}
                                            </button>
                                        );
                                    })}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="h-7 w-7 p-0 rounded-md text-xs font-bold disabled:opacity-40"
                                    >
                                        ›
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Card>

            {/* Modal de Confirmação de Desfazer Pagamento */}
            <AlertDialog open={!!undoInvoiceId} onOpenChange={(open) => !open && setUndoInvoiceId(null)}>
                <AlertDialogContent className="rounded-2xl border-gray-100 shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-gray-900">
                            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                                <Undo2 size={20} />
                            </div>
                            Desfazer Pagamento
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-500 pt-2">
                            Você está prestes a <span className="font-bold text-orange-600 uppercase">DESFAZER</span> o pagamento desta fatura. 
                            Ela voltará para o status "Em Aberto". Deseja continuar?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="pt-4 gap-2">
                        <AlertDialogCancel className="rounded-xl border-gray-200 font-bold text-xs uppercase tracking-wider">
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={(e) => {
                                e.preventDefault();
                                handleUndoPayment();
                            }}
                            className="rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs uppercase tracking-wider px-6"
                        >
                            Sim, Desfazer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Modal de Confirmação de Baixa em Lote */}
            <AlertDialog open={isBulkSettleModalOpen} onOpenChange={setIsBulkSettleModalOpen}>
                <AlertDialogContent className="rounded-2xl border-gray-100 shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-gray-900">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <Landmark size={20} />
                            </div>
                            Confirmar Baixa em Lote
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-500 pt-2">
                            Você está prestes a marcar <span className="font-bold text-gray-900">{selectedInvoices.length} faturas</span> como <span className="font-bold text-emerald-600 uppercase">PAGAS</span>. 
                            Esta ação irá sincronizar a baixa com o Tiny ERP e não pode ser desfeita em massa.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="pt-4 gap-2">
                        <AlertDialogCancel className="rounded-xl border-gray-200 font-bold text-xs uppercase tracking-wider">
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={(e) => {
                                e.preventDefault();
                                handleBulkMarkAsPaid();
                            }}
                            className="rounded-xl bg-[#B70F0A] hover:bg-[#8e0c08] text-white font-black text-xs uppercase tracking-wider px-6"
                        >
                            Confirmar Recebimento
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
