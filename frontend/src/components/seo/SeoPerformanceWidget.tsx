import React, { useState, useMemo } from 'react';
import { useSeoRankings } from '@/hooks/useSeoRankings';
import {
    TrendingUp, TrendingDown, Minus, Search, Target, MapPin, Loader,
    LayoutGrid, List, ChevronDown, ChevronUp, ArrowUpRight, ArrowDownRight,
    MousePointer2, Eye, BarChart3
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, YAxis, Tooltip, XAxis, AreaChart, Area } from 'recharts';

interface HistoryItem {
    date: string;
    position: number;
    clicks: number;
    impressions: number;
}

interface RankingItem {
    keyword: string;
    current_position: number;
    previous_position: number | null;
    clicks: number;
    impressions: number;
    ctr: number;
    last_checked: string;
    history: HistoryItem[];
}

const getTrendData = (item: RankingItem) => {
    const { current_position, previous_position } = item;
    let trend: 'up' | 'down' | 'stable' = 'stable';
    let diff = 0;
    if (previous_position) {
        if (current_position < previous_position) {
            trend = 'up';
            diff = Math.abs(previous_position - current_position);
        } else if (current_position > previous_position) {
            trend = 'down';
            diff = current_position - previous_position;
        }
    }
    return { trend, diff };
};

const SeoCard: React.FC<{ item: RankingItem }> = ({ item }) => {
    const { keyword, current_position, clicks, impressions, history } = item;
    const { trend, diff } = getTrendData(item);

    const trendConfig = {
        up: { color: 'text-[#37B24D]', bg: 'bg-[#37B24D]/10', icon: TrendingUp, label: `▲ ${diff.toFixed(0)}` },
        down: { color: 'text-[#B70F0A]', bg: 'bg-[#B70F0A]/10', icon: TrendingDown, label: `▼ ${diff.toFixed(0)}` },
        stable: { color: 'text-gray-500', bg: 'bg-gray-100', icon: Minus, label: '0' }
    };

    const currentStatus = trendConfig[trend];

    return (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col h-full hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                        <Search className="w-4 h-4" />
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-gray-900 line-clamp-1" title={keyword}>
                            {keyword}
                        </h4>
                        <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-0.5 uppercase tracking-wider font-medium">
                            <MapPin className="w-3 h-3" />
                            Google Search Console
                        </div>
                    </div>
                </div>

                <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${currentStatus.bg} ${currentStatus.color} text-[10px] font-bold`}>
                    <currentStatus.icon className="w-3 h-3" />
                    {currentStatus.label}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Cliques</span>
                    <div className="flex items-center gap-1">
                        <MousePointer2 className="w-3 h-3 text-blue-500" />
                        <span className="text-xl font-black text-gray-900 leading-none">{clicks}</span>
                    </div>
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Impressões</span>
                    <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3 text-purple-500" />
                        <span className="text-xl font-black text-gray-900 leading-none">{impressions}</span>
                    </div>
                </div>
            </div>

            <div className="flex items-end justify-between mt-auto">
                <div className="flex flex-col">
                    <span className="text-xs text-gray-400 font-medium uppercase tracking-tight">Posição Média</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-gray-900 leading-none tracking-tighter">
                            #{current_position.toFixed(0)}
                        </span>
                        {current_position <= 3 && (
                            <span className="text-[10px] font-bold text-amber-500 uppercase">Top Rank</span>
                        )}
                    </div>
                </div>

                <div className="w-24 h-12">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={history}>
                            <YAxis reversed hide domain={['dataMin - 1', 'dataMax + 1']} />
                            <Line
                                type="monotone"
                                dataKey="position"
                                stroke={trend === 'down' ? '#B70F0A' : '#37B24D'}
                                strokeWidth={3}
                                dot={false}
                                animationDuration={1500}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

const SeoRow: React.FC<{ item: RankingItem }> = ({ item }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const { keyword, current_position, clicks, impressions, ctr, history } = item;
    const { trend, diff } = getTrendData(item);

    return (
        <div className="border-b border-gray-100 last:border-0">
            <div
                className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-4 flex-1">
                    <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
                        <Search className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900">{keyword}</span>
                        <span className="text-[10px] text-gray-400 uppercase font-medium">Google Search Console</span>
                    </div>
                </div>

                <div className="flex items-center gap-8 px-4">
                    <div className="text-center w-16">
                        <span className="text-[10px] text-gray-400 uppercase block mb-0.5 font-bold">Cliques</span>
                        <span className="text-sm font-black text-blue-600">{clicks}</span>
                    </div>

                    <div className="text-center w-20">
                        <span className="text-[10px] text-gray-400 uppercase block mb-0.5 font-bold">Posição</span>
                        <span className="text-lg font-black text-gray-900">#{current_position.toFixed(0)}</span>
                    </div>

                    <div className="w-24 text-right">
                        <div className={`inline-flex items-center gap-1 font-bold text-[10px] ${trend === 'up' ? 'text-[#37B24D]' : trend === 'down' ? 'text-[#B70F0A]' : 'text-gray-400'
                            }`}>
                            {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : trend === 'down' ? <ArrowDownRight className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                            {trend === 'up' ? `Subiu ${diff.toFixed(0)}` : trend === 'down' ? `Caiu ${diff.toFixed(0)}` : 'Estável'}
                        </div>
                    </div>

                    <div className="text-gray-300 ml-4">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                </div>
            </div>

            {isExpanded && (
                <div className="p-6 bg-gray-50/50 border-t border-gray-100 animate-in slide-in-from-top duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="md:col-span-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm h-64">
                            <div className="flex justify-between items-center mb-6">
                                <h5 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                                    <BarChart3 className="w-4 h-4" />
                                    Histórico de Cliques e Visibilidade
                                </h5>
                                <span className="text-[10px] text-gray-400">Últimas 10 checagens</span>
                            </div>
                            <ResponsiveContainer width="100%" height="70%">
                                <AreaChart data={history}>
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="clicks"
                                        stroke="#3b82f6"
                                        fillOpacity={1}
                                        fill="url(#colorClicks)"
                                        strokeWidth={3}
                                    />
                                    <defs>
                                        <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="flex flex-col gap-4">
                            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                <span className="text-[10px] text-gray-400 uppercase font-bold block mb-1">CTR Médio</span>
                                <div className="text-2xl font-black text-gray-900">{ctr.toFixed(2)}%</div>
                                <div className="text-[10px] text-gray-400 mt-1 leading-tight">Taxa de cliques por visualização</div>
                            </div>

                            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex-1">
                                <div className="text-[10px] text-gray-400 uppercase font-bold block mb-2">Insight de IA</div>
                                <p className="text-xs text-gray-600 leading-relaxed font-medium">
                                    {ctr > 5 ? 'Ótima taxa de conversão! O título está muito atrativo.' :
                                        ctr > 2 ? 'Bom desempenho. Considere testar uma nova descrição (meta description).' :
                                            'Baixo CTR. Recomendamos otimizar o título para atrair mais cliques.'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default function SeoPerformanceWidget({ clientId }: { clientId: number }) {
    const { data: rankings, isLoading, error } = useSeoRankings(clientId);
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

    const filteredRankings = useMemo(() => {
        if (!rankings) return [];
        return rankings.filter((item: RankingItem) =>
            item.keyword.toLowerCase().includes(search.toLowerCase())
        );
    }, [rankings, search]);

    if (isLoading) return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
                <div key={i} className="h-40 bg-gray-50 rounded-2xl animate-pulse flex items-center justify-center">
                    <Loader className="w-6 h-6 text-gray-200 animate-spin" />
                </div>
            ))}
        </div>
    );

    if (error || !rankings || rankings.length === 0) return (
        <div className="bg-[#F2F2F2] rounded-3xl p-10 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 text-center">
            <Target className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">Nenhum dado de SEO disponível para este cliente.</p>
            <p className="text-xs text-gray-400 mt-1">Configure as palavras-chave no cadastro para iniciar o monitoramento via Search Console.</p>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-900">Performance de Busca Real</h3>
                    <p className="text-sm text-gray-500 flex items-center gap-2">
                        Métricas oficiais extraídas do Google Search Console
                        {rankings && rankings.length > 0 && rankings[0].last_checked && (
                            <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold">
                                Atualizado em: {new Date(rankings[0].last_checked).toLocaleDateString('pt-BR')}
                            </span>
                        )}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Filtrar por palavra..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-64"
                        />
                    </div>

                    <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {filteredRankings.length === 0 ? (
                <div className="py-20 text-center text-gray-400 text-sm italic">
                    Nenhuma palavra-chave encontrada para "{search}"
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
                    {filteredRankings.map((item: RankingItem, index: number) => (
                        <SeoCard key={index} item={item} />
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in duration-500">
                    <div className="divide-y divide-gray-50">
                        {filteredRankings.map((item: RankingItem, index: number) => (
                            <SeoRow key={index} item={item} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
