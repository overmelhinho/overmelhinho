import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "@/services/api";
import { format } from "date-fns";
import { 
    Download, 
    Search,
    FileText,
    MapPin,
    User,
    Phone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { DateRangePicker } from "@/components/reports/DateRangePicker";

export default function CommissionReportsTab() {
    const today = new Date();
    const firstDay = format(new Date(today.getFullYear(), today.getMonth(), 1), "yyyy-MM-dd");
    const lastDay = format(new Date(today.getFullYear(), today.getMonth() + 1, 0), "yyyy-MM-dd");

    const [startDate, setStartDate] = useState(firstDay);
    const [endDate, setEndDate] = useState(lastDay);
    
    // Filtros
    const [cidade, setCidade] = useState("");
    const [vendedorId, setVendedorId] = useState("all");
    const [tipoPublicidade, setTipoPublicidade] = useState("all");
    const [telefone, setTelefone] = useState("");
    const [ordem, setOrdem] = useState("data_inicio");

    // Debounce state para buscas textuais (ao clicar em Pesquisar)
    const [searchCidade, setSearchCidade] = useState("");
    const [searchTelefone, setSearchTelefone] = useState("");

    const { data: vendedores } = useQuery({
        queryKey: ["vendedores"],
        queryFn: async () => {
            const resp = await axios.get("/v1/comerciais");
            return resp.data;
        }
    });

    const { data: reportData, isLoading } = useQuery({
        queryKey: ["commission-report", startDate, endDate, cidade, vendedorId, tipoPublicidade, telefone, ordem],
        queryFn: async () => {
            const params = new URLSearchParams({ 
                start_date: startDate, 
                end_date: endDate,
            });
            if (cidade) params.append("cidade", cidade);
            if (vendedorId && vendedorId !== "all") params.append("vendedor_id", vendedorId);
            if (tipoPublicidade && tipoPublicidade !== "all") params.append("tipo_publicidade", tipoPublicidade);
            if (telefone) params.append("telefone", telefone);
            if (ordem) params.append("ordem", ordem);

            const resp = await axios.get(`/v1/admin/reports/commissions?${params.toString()}`);
            return resp.data;
        }
    });

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const items = reportData?.data || [];
    const summary = reportData?.summary || { total_titulos: 0, total_valor: 0, total_comissao: 0 };

    const handleSearch = () => {
        setCidade(searchCidade);
        setTelefone(searchTelefone);
    };

    const formatNumero = (num: string | number) => {
        if (!num) return '-';
        const parts = String(num).split('-');
        parts[0] = parts[0].padStart(5, '0');
        return parts.join('-');
    };

    const handleExport = () => {
        if (!items || items.length === 0) return;

        const headers = ["Emissão", "Nome Fantasia", "Autorização", "Tipo", "Valor Total", "Data Final", "Vendedor"];
        const rows = items.map((item: any) => [
            item.emissao || '-',
            `"${(item.cliente_nome || '').replace(/"/g, '""')}"`,
            formatNumero(item.numero),
            item.tipo_publicidade,
            item.valor_total.toString().replace('.', ','),
            item.data_final || '-',
            `"${item.vendedor_nome || '-'}"`
        ]);

        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
            + headers.join(";") + "\n" 
            + rows.map((e: any) => e.join(";")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `relatorio_comissoes_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="p-6 bg-[#F8F9FC] min-h-screen space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-black text-gray-900 tracking-tight">Relatório de Comissões</h2>
                <Button onClick={handleExport} variant="outline" className="rounded-xl bg-white border-gray-100 text-xs font-bold gap-2">
                    <Download size={14} />
                    Exportar Relatório (CSV)
                </Button>
            </div>

            {/* Painel de Filtros */}
            <Card className="p-6 border-none shadow-sm rounded-3xl bg-white space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Período (Data Inicial / Final)</label>
                        <DateRangePicker 
                            startDate={startDate} 
                            endDate={endDate} 
                            onRangeChange={(start, end) => {
                                setStartDate(start);
                                setEndDate(end);
                            }}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Cidade</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <Input 
                                placeholder="Filtrar por cidade..." 
                                className="pl-9 rounded-xl border-gray-100 bg-gray-50/50 h-10 font-bold text-sm"
                                value={searchCidade}
                                onChange={(e) => setSearchCidade(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Vendedor</label>
                        <Select value={vendedorId} onValueChange={setVendedorId}>
                            <SelectTrigger className="w-full rounded-xl border-gray-100 bg-gray-50/50 h-10 font-bold text-sm">
                                <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os Vendedores</SelectItem>
                                {vendedores?.map((v: any) => (
                                    <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Tipo Publicidade</label>
                        <Select value={tipoPublicidade} onValueChange={setTipoPublicidade}>
                            <SelectTrigger className="w-full rounded-xl border-gray-100 bg-gray-50/50 h-10 font-bold text-sm">
                                <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os Tipos</SelectItem>
                                <SelectItem value="WEB">WEB</SelectItem>
                                <SelectItem value="APP">APP</SelectItem>
                                <SelectItem value="IMPRESSO">IMPRESSO</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Telefone</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <Input 
                                placeholder="Filtrar por telefone..." 
                                className="pl-9 rounded-xl border-gray-100 bg-gray-50/50 h-10 font-bold text-sm"
                                value={searchTelefone}
                                onChange={(e) => setSearchTelefone(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Ordem</label>
                        <Select value={ordem} onValueChange={setOrdem}>
                            <SelectTrigger className="w-full rounded-xl border-gray-100 bg-gray-50/50 h-10 font-bold text-sm">
                                <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="data_inicio">Data Emissão</SelectItem>
                                <SelectItem value="nome_fantasia">Nome Fantasia</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-end lg:col-span-2">
                        <Button onClick={handleSearch} className="h-10 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold px-8 w-full md:w-auto shadow-md shadow-red-600/20 transition-all">
                            <Search size={16} className="mr-2" />
                            Pesquisar
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Listagem (Tabela) */}
            <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between bg-gray-50/20 gap-4">
                    <div className="flex items-center gap-3">
                        <FileText size={18} className="text-red-600" />
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Lista de Contratos</h3>
                    </div>
                    <div className="flex flex-wrap gap-6 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="text-right px-4 border-r border-gray-100">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Títulos (Qtd)</p>
                            <p className="text-lg font-black text-gray-900">{summary.total_titulos}</p>
                        </div>
                        <div className="text-right px-4">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Valor Total</p>
                            <p className="text-lg font-black text-red-600">{formatCurrency(summary.total_valor)}</p>
                        </div>
                    </div>
                </div>
                
                <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm mt-4">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Emissão</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Nome Fantasia</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-center">Autorização</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-center">Tipo</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Valor Total</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Data Final</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Vendedor</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="py-20 text-center">
                                        <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" />
                                    </td>
                                </tr>
                            ) : items.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-20 text-center text-gray-400 text-sm font-medium">
                                        Nenhum registro encontrado para os filtros selecionados.
                                    </td>
                                </tr>
                            ) : items.map((item: any) => (
                                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                                            {item.emissao || '-'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 max-w-[200px]">
                                        <span className="text-sm font-medium text-gray-900 truncate block" title={item.cliente_nome}>
                                            {item.cliente_nome}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="text-sm font-black text-gray-900 group-hover:text-red-600 transition-colors">
                                            #{formatNumero(item.numero)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                                            {item.tipo_publicidade}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={`text-sm font-black tracking-tight ${item.valor_total === 0 ? 'text-gray-400' : 'text-gray-900'}`}>
                                            {formatCurrency(item.valor_total)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                                            {item.data_final || '-'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                                            <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center">
                                                <User size={12} className="text-gray-400" />
                                            </div>
                                            {item.vendedor_nome}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
