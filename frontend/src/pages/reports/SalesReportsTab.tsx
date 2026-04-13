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
    FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function SalesReportsTab() {
    const [month, setMonth] = useState(new Date().getMonth() + 1 + "");
    const [year, setYear] = useState(new Date().getFullYear() + "");
    const [planId, setPlanId] = useState("all");
    const [vendedorId, setVendedorId] = useState("all");
    const [collectionType, setCollectionType] = useState("all");
    const [status, setStatus] = useState("all");

    const { data: salesData, isLoading } = useQuery({
        queryKey: ["sales-report", month, year, planId, vendedorId, collectionType, status],
        queryFn: async () => {
            const params = new URLSearchParams({ month, year });
            if (planId !== "all") params.append("plan_id", planId);
            if (vendedorId !== "all") params.append("vendedor_id", vendedorId);
            if (collectionType !== "all") params.append("collection_type", collectionType);
            if (status !== "all") params.append("status", status);

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

    const handleExportCSV = () => {
        if (!salesData?.data) return;

        const headers = ["Autorização", "Cliente", "Plano", "Vendedor", "Valor", "Vencimento", "Status", "Metodo Pagamento"];
        const rows = salesData.data.map((sale: any) => [
            sale.autorizacao_numero ? `#${sale.autorizacao_numero}` : '-',
            sale.cliente,
            sale.plano,
            sale.vendedor,
            sale.amount.toFixed(2),
            format(new Date(sale.due_date), "dd/MM/yyyy"),
            sale.status === 'paid' ? 'Recebido' : 'Pendente',
            sale.payment_method
        ]);

        const csvContent = [
            headers.join(";"),
            ...rows.map((row: any) => row.join(";"))
        ].join("\n");

        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Relatorio_Vendas_${month}_${year}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportPDF = async () => {
        try {
            const params = new URLSearchParams({ month, year });
            if (planId !== "all") params.append("plan_id", planId);
            if (vendedorId !== "all") params.append("vendedor_id", vendedorId);
            if (collectionType !== "all") params.append("collection_type", collectionType);
            if (status !== "all") params.append("status", status);

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

    return (
        <div className="p-6 bg-[#F8F9FC] min-h-screen space-y-6">
            {/* Filtros */}
            <Card className="p-6 border-none shadow-sm rounded-2xl bg-white overflow-visible">
                <div className="flex items-center gap-2 mb-6">
                    <Filter size={18} className="text-red-600" />
                    <h2 className="text-sm font-black uppercase tracking-widest text-gray-900">Filtros do Relatório</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Mês</label>
                        <Select value={month} onValueChange={setMonth}>
                            <SelectTrigger className="rounded-xl border-gray-100 bg-gray-50/50">
                                <SelectValue placeholder="Selecione o mês" />
                            </SelectTrigger>
                            <SelectContent>
                                {[
                                    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
                                    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
                                ].map((monthName, i) => (
                                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                                        {monthName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Ano</label>
                        <Select value={year} onValueChange={setYear}>
                            <SelectTrigger className="rounded-xl border-gray-100 bg-gray-50/50">
                                <SelectValue placeholder="Ano" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="2024">2024</SelectItem>
                                <SelectItem value="2025">2025</SelectItem>
                                <SelectItem value="2026">2026</SelectItem>
                            </SelectContent>
                        </Select>
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
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Cobrança</label>
                        <Select value={collectionType} onValueChange={setCollectionType}>
                            <SelectTrigger className="rounded-xl border-gray-100 bg-gray-50/50">
                                <SelectValue placeholder="Todos os tipos" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os tipos</SelectItem>
                                <SelectItem value="bank">Bancária (Boleto)</SelectItem>
                                <SelectItem value="card">Cartão de Crédito</SelectItem>
                                <SelectItem value="pix">Pix / Transferência</SelectItem>
                                <SelectItem value="cash">Dinheiro / Direta</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Status</label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="rounded-xl border-gray-100 bg-gray-50/50">
                                <SelectValue placeholder="Todos os status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os status</SelectItem>
                                <SelectItem value="paid">Recebido</SelectItem>
                                <SelectItem value="pending">A receber</SelectItem>
                            </SelectContent>
                        </Select>
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
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Volume de Vendas</p>
                    </div>
                    <div>
                        <h3 className="text-3xl font-black text-gray-900 tracking-tighter">
                            {salesData?.summary?.count || 0}
                        </h3>
                        <p className="text-xs font-medium text-gray-400">transações no período</p>
                    </div>
                </Card>

                <Card className="p-6 border-none shadow-sm rounded-3xl bg-gray-900 flex flex-col justify-between text-white">
                    <div>
                        <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white mb-4">
                            <CreditCard size={20} />
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Faturamento Bruto</p>
                    </div>
                    <div>
                        <h3 className="text-3xl font-black text-white tracking-tighter">
                            {formatCurrency(salesData?.summary?.total_amount || 0)}
                        </h3>
                        <p className="text-xs font-medium text-gray-500">total acumulado</p>
                    </div>
                </Card>

                <Card className="p-6 border-none shadow-sm rounded-3xl bg-white flex flex-col justify-between">
                    <div>
                        <div className="w-10 h-10 rounded-2xl bg-green-50 flex items-center justify-center text-green-600 mb-4">
                            <CheckCircle2 size={20} />
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Total Recebido</p>
                    </div>
                    <div>
                        <h3 className="text-3xl font-black text-green-600 tracking-tighter">
                            {formatCurrency(salesData?.summary?.paid_amount || 0)}
                        </h3>
                        <p className="text-xs font-medium text-gray-400">vendas liquidadas</p>
                    </div>
                </Card>

                <Card className="p-6 border-none shadow-sm rounded-3xl bg-white flex flex-col justify-between">
                    <div>
                        <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 mb-4">
                            <Clock size={20} />
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">A Receber</p>
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
                        <div className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-gray-900 border border-gray-100Line">
                            <ShoppingCart size={14} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-gray-900 tracking-tight">Detalhamento de Vendas</h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Lista completa de transações filtradas</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
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
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/30 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 border-b border-gray-50">
                                <th className="px-8 py-5">Autorização</th>
                                <th className="px-6 py-5">Cliente</th>
                                <th className="px-6 py-5">Plano</th>
                                <th className="px-6 py-5">Vendedor</th>
                                <th className="px-6 py-5">Valor</th>
                                <th className="px-6 py-5">Vencimento</th>
                                <th className="px-6 py-5">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                                            <span className="text-xs font-bold text-gray-300">Processando dados...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : salesData?.data?.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-20 text-center">
                                        <p className="text-sm font-bold text-gray-300">Nenhuma venda encontrada para os filtros selecionados.</p>
                                    </td>
                                </tr>
                            ) : (
                                salesData?.data?.map((sale: any) => (
                                    <tr key={sale.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-8 py-5">
                                            <span className="text-xs font-black text-gray-900">#{sale.autorizacao_numero || '-'}</span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-800 tracking-tight">{sale.cliente}</span>
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                                    {sale.payment_method === 'boleto' ? 'Boleto Bancário' : 
                                                     sale.payment_method === 'cartao' ? 'Cartão de Crédito' : 
                                                     sale.payment_method === 'pix' ? 'Pix / Transferência' :
                                                     'Dinheiro / Direta'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-xs font-bold text-gray-500">{sale.plano}</span>
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
                                            <span className="text-sm font-black text-gray-900">{formatCurrency(sale.amount)}</span>
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
                                                {sale.status === 'paid' ? 'Recebido' : 'Pendente'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
