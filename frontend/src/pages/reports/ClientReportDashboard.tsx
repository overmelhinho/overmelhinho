import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import axios from "@/services/api";
import {
    LineChart,
    Line,
    ResponsiveContainer,
    Tooltip as RechartsTooltip,
    XAxis,
    YAxis
} from "recharts";
import {
    Eye,
    MessageCircle,
    MapPin,
    Users,
    TrendingUp,
    TrendingDown,
    Search,
    ChevronUp,
    ChevronDown,
    PlusCircle
} from "lucide-react";

const SkeletonCard = ({ className = "" }) => (
    <div className={`bg-white rounded-[32px] p-8 border border-gray-100 animate-pulse ${className}`}>
        <div className="h-4 w-24 bg-gray-100 rounded mb-4" />
        <div className="h-10 w-32 bg-gray-50 rounded mb-6" />
        <div className="h-32 w-full bg-gray-50 rounded" />
    </div>
);

export default function ClientReportDashboard({ clientId }: { clientId?: string }) {
    const navigate = useNavigate();
    // Busca os dados do relatório
    const { data: report, isLoading } = useQuery({
        queryKey: ["client-report", clientId],
        queryFn: async () => {
            const id = clientId || "self"; // Ou pegar do contexto de auth se for lojista logado
            const resp = await axios.get(`/v1/clients/${id}/reports/dashboard`);
            return resp.data;
        }
    });

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-6 h-full p-6 bg-[#F2F2F2]">
                <SkeletonCard className="md:col-span-2 md:row-span-2" />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard className="md:col-span-2" />
            </div>
        );
    }

    return (
        <div className="p-6 bg-[#F2F2F2] min-h-screen">
            <header className="mb-8">
                <h1 className="text-3xl font-black text-gray-900 tracking-tighter">Performance da Loja</h1>
                <p className="text-gray-500 font-medium">Relatório de visibilidade e conversão (últimos 30 dias)</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 auto-rows-[240px]">

                {/* CARD 1: VISIBILIDADE HERO */}
                <div className="md:col-span-2 md:row-span-2 bg-white rounded-[40px] p-10 border border-gray-100 shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all duration-500">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-[#C00000]">
                                <Eye size={20} />
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest text-gray-400">Visibilidade Total</span>
                        </div>
                        <h2 className="text-7xl font-black text-gray-900 tracking-tighter mb-2">
                            {report?.visibilidade?.total_views?.toLocaleString() || 0}
                        </h2>
                        <p className="text-gray-400 font-bold mb-8">Visualizações brutas da sua página no guia.</p>
                    </div>

                    <div className="h-[180px] w-full -mx-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={report?.visibilidade?.sparkline}>
                                <Line
                                    type="monotone"
                                    dataKey="total"
                                    stroke="#C00000"
                                    strokeWidth={4}
                                    dot={false}
                                    animationDuration={2000}
                                />
                                <RechartsTooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* CARD 2: WHATSAPP CLICKS */}
                <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center hover:scale-[1.02] transition-transform">
                    <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center text-green-600 mb-4">
                        <MessageCircle size={32} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Conversão WhatsApp</span>
                    <span className="text-4xl font-black text-gray-900">{report?.visibilidade?.whatsapp || 0}</span>
                </div>

                {/* CARD 3: MAPA/WAZE CLICKS */}
                <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center hover:scale-[1.02] transition-transform">
                    <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-4">
                        <MapPin size={32} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Busca de Endereço</span>
                    <span className="text-4xl font-black text-gray-900">{report?.visibilidade?.waze || 0}</span>
                </div>

                {/* CARD 4: SEO TRACKING */}
                <div className="md:col-span-2 bg-white rounded-[40px] p-4 pl-10 border border-gray-100 shadow-sm flex items-center justify-between overflow-hidden">
                    <div className="py-6">
                        <div className="flex items-center gap-2 mb-2">
                            <Search size={16} className="text-gray-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">SEO Tracking</span>
                        </div>
                        <h3 className="text-lg font-black text-gray-900 tracking-tight max-w-[200px] leading-tight mb-1">
                            {report?.seo?.keyword || "Nenhuma palavra ativa"}
                        </h3>
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-black text-gray-900">{report?.seo?.current_position ? `${report.seo.current_position}º` : '—'}</span>
                            {report?.seo?.trend && (
                                <span className={`flex items-center text-xs font-black ${report.seo.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                                    {report.seo.trend === 'up' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    {Math.abs((report.seo.previous_position || 0) - report.seo.current_position)}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="h-full w-40 bg-gray-50 flex items-center justify-center rounded-l-[40px]">
                        <TrendingUp className="text-gray-200" size={80} strokeWidth={3} />
                    </div>
                </div>

                {/* CARD 5: VAGAS */}
                <div className="md:col-span-2 bg-gray-900 rounded-[40px] p-10 flex items-center justify-between text-white">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <Users size={20} className="text-red-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Banco de Talentos</span>
                        </div>
                        <div className="flex gap-8">
                            <div>
                                <span className="block text-4xl font-black">{report?.vagas?.ativas || 0}</span>
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Vagas Ativas</span>
                            </div>
                            <div>
                                <span className="block text-4xl font-black">{report?.vagas?.candidatos || 0}</span>
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Currículos</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/vagas/nova')}
                        className="bg-white/10 p-4 rounded-3xl hover:bg-white/20 transition-all"
                    >
                        <PlusCircle size={32} />
                    </button>
                </div>

            </div>
        </div>
    );
}
