import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "@/services/api";
import { format } from "date-fns";
import { 
    Percent, 
    Download, 
    Award,
    Trophy,
    TrendingUp,
    Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function CommissionReportsTab() {
    const [month, setMonth] = useState(new Date().getMonth() + 1 + "");
    const [year, setYear] = useState(new Date().getFullYear() + "");

    const { data: commissions, isLoading } = useQuery({
        queryKey: ["commission-report", month, year],
        queryFn: async () => {
            const params = new URLSearchParams({ month, year });
            const resp = await axios.get(`/v1/admin/reports/commissions?${params.toString()}`);
            return resp.data;
        }
    });

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const totalCommissions = commissions?.reduce((acc: number, item: any) => acc + item.commission, 0) || 0;
    const totalSales = commissions?.reduce((acc: number, item: any) => acc + item.total_sold, 0) || 0;

    return (
        <div className="p-6 bg-[#F8F9FC] min-h-screen space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex gap-4">
                    <Select value={month} onValueChange={setMonth}>
                        <SelectTrigger className="w-40 rounded-xl border-gray-100 bg-white">
                            <SelectValue placeholder="Mês" />
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
                    <Select value={year} onValueChange={setYear}>
                        <SelectTrigger className="w-32 rounded-xl border-gray-100 bg-white">
                            <SelectValue placeholder="Ano" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="2024">2024</SelectItem>
                            <SelectItem value="2025">2025</SelectItem>
                            <SelectItem value="2026">2026</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button variant="outline" className="rounded-xl bg-white border-gray-100 text-xs font-bold gap-2">
                    <Download size={14} />
                    Exportar Relatório
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-8 border-none shadow-sm rounded-[32px] bg-red-600 text-white overflow-hidden relative">
                    <div className="relative z-10">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-1">Total de Comissões</p>
                        <h3 className="text-4xl font-black tracking-tighter mb-4">{formatCurrency(totalCommissions)}</h3>
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold">Ref: 10% s/ Vendas Pagas</span>
                        </div>
                    </div>
                    <Percent className="absolute -bottom-6 -right-6 text-white/5 w-40 h-40 transform rotate-12" />
                </Card>

                <Card className="p-8 border-none shadow-sm rounded-[32px] bg-white text-gray-900 border border-gray-100 flex flex-col justify-center">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Volume Total de Vendas</p>
                    <h3 className="text-4xl font-black tracking-tighter text-gray-900">{formatCurrency(totalSales)}</h3>
                    <p className="text-xs font-medium text-gray-400 mt-2">vendas liquidadas no período</p>
                </Card>

                <Card className="p-8 border-none shadow-sm rounded-[32px] bg-white text-gray-900 border border-gray-100 flex flex-col justify-center">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Eficiência da Equipe</p>
                    <div className="flex items-end gap-3">
                        <h3 className="text-4xl font-black tracking-tighter text-gray-900">{commissions?.length || 0}</h3>
                        <span className="text-sm font-bold text-gray-400 mb-1">vendedores ativos</span>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
                    <div className="p-6 border-b border-gray-50 flex items-center gap-3 bg-gray-50/20">
                        <Trophy size={18} className="text-yellow-500" />
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Status de Comissionamento por Vendedor</h3>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50/10 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 border-b border-gray-50">
                                    <th className="px-8 py-5">Vendedor</th>
                                    <th className="px-6 py-5">Total Vendido</th>
                                    <th className="px-6 py-5 text-center">Contratos</th>
                                    <th className="px-6 py-5">Comissão Bruta</th>
                                    <th className="px-6 py-5 text-right pr-8">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center">
                                            <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" />
                                        </td>
                                    </tr>
                                ) : commissions?.map((vendedor: any) => (
                                    <tr key={vendedor.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100">
                                                    <Award size={18} />
                                                </div>
                                                <span className="text-sm font-bold text-gray-900">{vendedor.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-sm font-black text-gray-900">{formatCurrency(vendedor.total_sold)}</span>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <span className="text-xs font-bold text-gray-500">{vendedor.sales_count}</span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-sm font-bold text-red-600">{formatCurrency(vendedor.commission)}</span>
                                        </td>
                                        <td className="px-6 py-5 text-right pr-8">
                                            <Button variant="ghost" className="h-8 px-4 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                                Ver Detalhes
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
}
