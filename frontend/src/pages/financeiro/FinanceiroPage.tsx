import DashboardLayout from "../../components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs-radix";
import PlansPage from "./PlansPage";
import InvoicesTab from "./InvoicesTab";
import MetricsTab from "./MetricsTab";
import RenewalsTab from "./RenewalsTab";
import {
    LayoutDashboard,
    FileText,
    CreditCard,
    TrendingUp,
    AlertCircle,
    Users,
    DollarSign,
    RefreshCw
} from "lucide-react";

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
    const { data: invoices, isLoading } = useQuery<Invoice[]>({
        queryKey: ["financial-invoices"],
        queryFn: async () => {
            const response = await axios.get("/v1/financial/invoices");
            return response.data;
        },
    });

    const stats = {
        mrr: invoices?.filter(i => i.status === "paid").reduce((acc, i) => acc + Number(i.amount), 0) || 0,
        pendingCount: invoices?.filter(i => i.status === "pending").length || 0,
        overdueAmount: invoices?.filter(i => i.status === "pending" && i.due_date && isBefore(new Date(i.due_date), startOfDay(new Date()))).reduce((acc, i) => acc + Number(i.amount), 0) || 0,
        activeClients: new Set(invoices?.filter(i => i?.client?.id).map(i => i.client.id)).size || 0
    };

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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4 mb-8">
                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="rounded-xl bg-green-50 p-2.5 text-green-600">
                            <TrendingUp size={20} />
                        </div>
                        <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-lg">+12% ref. mês ant.</span>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Receita (Recorrente)</p>
                        {isLoading ? (
                            <div className="h-8 w-24 bg-gray-100 animate-pulse rounded mt-1"></div>
                        ) : (
                            <h3 className="text-2xl font-black text-gray-900">R$ {stats.mrr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                        )}
                    </div>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="rounded-xl bg-red-50 p-2.5 text-red-600">
                            <AlertCircle size={20} />
                        </div>
                        <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-lg">{stats.pendingCount} faturas</span>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Inadimplência (Vencido)</p>
                        {isLoading ? (
                            <div className="h-8 w-24 bg-gray-100 animate-pulse rounded mt-1"></div>
                        ) : (
                            <h3 className="text-2xl font-black text-red-600">R$ {stats.overdueAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                        )}
                    </div>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
                            <Users size={20} />
                        </div>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Base de Clientes</p>
                        {isLoading ? (
                            <div className="h-8 w-16 bg-gray-100 animate-pulse rounded mt-1"></div>
                        ) : (
                            <h3 className="text-2xl font-black text-gray-900">{stats.activeClients} Ativos</h3>
                        )}
                    </div>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-gray-900 to-gray-800">
                    <div className="flex items-center justify-between mb-4">
                        <div className="rounded-xl bg-white/10 p-2.5 text-white">
                            <DollarSign size={20} />
                        </div>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Taxa de Conversão</p>
                        <h3 className="text-2xl font-black text-white">94.2%</h3>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="invoices" className="w-full space-y-6">
                <TabsList className="bg-white p-1 border rounded-lg">
                    <TabsTrigger value="invoices" className="gap-2 data-[state=active]:bg-red-50 data-[state=active]:text-red-700">
                        <FileText size={16} /> Faturas
                    </TabsTrigger>
                    <TabsTrigger value="renewals" className="gap-2 data-[state=active]:bg-red-50 data-[state=active]:text-red-700">
                        <RefreshCw size={16} /> Renovações
                    </TabsTrigger>
                    <TabsTrigger value="plans" className="gap-2 data-[state=active]:bg-red-50 data-[state=active]:text-red-700">
                        <CreditCard size={16} /> Planos de Assinatura
                    </TabsTrigger>
                    <TabsTrigger value="dashboard" className="gap-2 data-[state=active]:bg-red-50 data-[state=active]:text-red-700">
                        <LayoutDashboard size={16} /> Métricas
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="invoices" className="focus-visible:outline-none">
                    <InvoicesTab />
                </TabsContent>

                <TabsContent value="renewals" className="focus-visible:outline-none">
                    <RenewalsTab />
                </TabsContent>

                <TabsContent value="plans" className="focus-visible:outline-none">
                    <PlansPage />
                </TabsContent>

                <TabsContent value="dashboard" className="focus-visible:outline-none">
                    <MetricsTab invoices={invoices} />
                </TabsContent>
            </Tabs>
        </DashboardLayout>
    );
}
