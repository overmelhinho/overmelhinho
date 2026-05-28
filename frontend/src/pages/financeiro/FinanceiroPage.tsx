import DashboardLayout from "../../components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs-radix";
import InvoicesTab from "./InvoicesTab";
import MetricsTab from "./MetricsTab";
import RenewalsTab from "./RenewalsTab";
import AutorizacoesTab from "./AutorizacoesTab";
import {
    LayoutDashboard,
    FileText,
    CreditCard,
    TrendingUp,
    AlertCircle,
    Users,
    DollarSign,
    RefreshCw,
    Clock
} from "lucide-react";

import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "@/services/api";
import { isBefore, startOfDay } from "date-fns";

interface Invoice {
    id: number;
    amount: number;
    due_date: string;
    status: "pending" | "paid" | "canceled";
    client: { id: number };
}

export default function FinanceiroPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const currentTab = searchParams.get("tab") || "invoices";
    const [statsFilters, setStatsFilters] = useState<any>({});

    const { data: stats, isLoading } = useQuery({
        queryKey: ["financial-stats", statsFilters],
        queryFn: async () => {
            const response = await axios.get("/v1/financial/stats", { params: statsFilters });
            return response.data;
        },
    });

    return (
        <DashboardLayout>
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Financeiro</h1>
                    <p className="text-gray-500 font-medium">Gestão estratégica de receita e cobrança.</p>
                </div>
                <div className="hidden md:block">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-full">
                        Sincronizado com Tiny ERP
                    </span>
                </div>
            </div>

            {/* Dashboard Cards Summary */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-5 mb-8">
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="rounded-xl bg-green-50 p-2 text-green-600">
                            <TrendingUp size={18} />
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Recebido (Pago)</p>
                        {isLoading || !stats ? (
                            <div className="h-8 w-24 bg-gray-100 animate-pulse rounded mt-1"></div>
                        ) : (
                            <h3 className="text-xl font-black text-gray-900">R$ {Number(stats.mrr).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                        )}
                    </div>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="rounded-xl bg-yellow-50 p-2 text-yellow-600">
                            <Clock size={18} />
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">A Receber (No Prazo)</p>
                        {isLoading || !stats ? (
                            <div className="h-8 w-24 bg-gray-100 animate-pulse rounded mt-1"></div>
                        ) : (
                            <h3 className="text-xl font-black text-yellow-600">R$ {Number(stats.pendingTotal - stats.overdueTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                        )}
                    </div>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="rounded-xl bg-red-50 p-2 text-red-600">
                            <AlertCircle size={18} />
                        </div>
                        <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-lg">{stats?.overdueCount || 0} faturas</span>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Inadimplência (Vencido)</p>
                        {isLoading || !stats ? (
                            <div className="h-8 w-24 bg-gray-100 animate-pulse rounded mt-1"></div>
                        ) : (
                            <h3 className="text-xl font-black text-red-600">R$ {stats.overdueTotal ? Number(stats.overdueTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00'}</h3>
                        )}
                    </div>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-gray-900 to-gray-800">
                    <div className="flex items-center justify-between mb-4">
                        <div className="rounded-xl bg-white/10 p-2 text-white">
                            <DollarSign size={18} />
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Previsão Total do Mês</p>
                        {isLoading || !stats ? (
                            <div className="h-8 w-24 bg-gray-700 animate-pulse rounded mt-1"></div>
                        ) : (
                            <h3 className="text-xl font-black text-white">R$ {Number(Number(stats.mrr) + Number(stats.pendingTotal)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                        )}
                    </div>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
                            <Users size={18} />
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Base de Clientes</p>
                        {isLoading || !stats ? (
                            <div className="h-8 w-16 bg-gray-100 animate-pulse rounded mt-1"></div>
                        ) : (
                            <h3 className="text-xl font-black text-gray-900">{stats.activeClients || 0} Ativos</h3>
                        )}
                    </div>
                </div>
            </div>

            <Tabs 
                value={currentTab} 
                onValueChange={(val) => {
                    setSearchParams(prev => { 
                        prev.set("tab", val); 
                        return prev; 
                    });
                }} 
                className="w-full space-y-6"
            >
                <TabsList className="bg-white p-1 border rounded-lg">
                    <TabsTrigger value="invoices" className="gap-2 data-[state=active]:bg-red-50 data-[state=active]:text-red-700">
                        <DollarSign size={16} /> Faturas
                    </TabsTrigger>
                    <TabsTrigger value="autorizacoes" className="gap-2 data-[state=active]:bg-red-50 data-[state=active]:text-red-700">
                        <FileText size={16} /> Autorizações
                    </TabsTrigger>
                    <TabsTrigger value="renewals" className="gap-2 data-[state=active]:bg-red-50 data-[state=active]:text-red-700">
                        <RefreshCw size={16} /> Renovações
                    </TabsTrigger>
                    <TabsTrigger value="dashboard" className="gap-2 data-[state=active]:bg-red-50 data-[state=active]:text-red-700">
                        <LayoutDashboard size={16} /> Métricas
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="autorizacoes" className="focus-visible:outline-none">
                    <AutorizacoesTab />
                </TabsContent>

                <TabsContent value="invoices" className="focus-visible:outline-none">
                    <InvoicesTab onFiltersChange={setStatsFilters} />
                </TabsContent>

                <TabsContent value="renewals" className="focus-visible:outline-none">
                    <RenewalsTab />
                </TabsContent>

                <TabsContent value="dashboard" className="focus-visible:outline-none">
                    <MetricsTab stats={stats} />
                </TabsContent>
            </Tabs>
        </DashboardLayout>
    );
}
