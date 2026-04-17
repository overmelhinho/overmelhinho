import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    ClipboardCheck,
    Filter,
    Search,
    ChevronRight,
    MapPin,
    AlertCircle,
    History,
    LayoutDashboard,
    ArrowUpRight,
    Loader2,
    Users,
    Zap,
    CheckCircle2,
    SearchX,
    CalendarDays,
    X,
    Eye,
    EyeOff,
    Building2
} from 'lucide-react';
import api from '@/services/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ExpressCalendar } from '@/components/ui/ExpressCalendar';

const AuditDashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // Filtros persistentes na URL
    const tab = (searchParams.get('tab') as 'queue' | 'history') || 'queue';
    const page = parseInt(searchParams.get('page') || '1');
    const filterCity = searchParams.get('cidade') || '';
    const filterType = searchParams.get('tipo') || '';
    const filterUser = searchParams.get('user_id') || '';
    const filterDateStart = searchParams.get('date_start') || '';
    const filterDateEnd = searchParams.get('date_end') || '';
    const filterVisibilidade = searchParams.get('visibilidade') || '';
    const searchTerm = searchParams.get('q') || '';

    const updateFilter = (params: Record<string, string | number | null>) => {
        const newParams = new URLSearchParams(searchParams);
        Object.entries(params).forEach(([key, val]) => {
            if (val === null || val === '') newParams.delete(key);
            else newParams.set(key, String(val));
        });

        // Se mudou tab ou filtro, volta pra página 1 (a menos que já estejamos definindo a página)
        if (!params.page && (params.tab || params.cidade || params.tipo || params.q)) {
            newParams.set('page', '1');
        }
        setSearchParams(newParams);
    };

    const clearFilters = () => {
        setSearchParams({ tab }); // Mantém apenas a tab
    };

    const hasFilters = filterCity || filterType || searchTerm || filterUser || filterDateStart || filterDateEnd || filterVisibilidade;

    // 1. Busca Cidades para o Filtro
    const { data: cities } = useQuery({
        queryKey: ['cidades-audit'],
        queryFn: async () => {
            const response = await api.get('/v1/cidades');
            return response.data.data;
        }
    });

    // 2.5. Busca Auditores (Quem já auditou)
    const { data: auditors } = useQuery({
        queryKey: ['audit-users'],
        queryFn: async () => {
            const response = await api.get('/v1/audit/users');
            return response.data;
        }
    });

    // 2. Busca Fila de Auditoria (Pending)
    const { data: queueData, isLoading: loadingQueue } = useQuery({
        queryKey: ['audit-queue', page, filterCity, filterType, filterVisibilidade, searchTerm],
        queryFn: async () => {
            const response = await api.get('/v1/audit/queue', {
                params: {
                    page,
                    cidade: filterCity,
                    tipo: filterType,
                    visibilidade: filterVisibilidade,
                    q: searchTerm,
                    status: 'pending'
                }
            });
            return response.data;
        },
        enabled: tab === 'queue'
    });

    // 3. Busca Histórico (Audit Logs)
    const { data: historyData, isLoading: loadingHistory } = useQuery({
        queryKey: ['audit-history', page, filterUser, searchTerm],
        queryFn: async () => {
            const response = await api.get('/v1/audit/history', {
                params: {
                    page,
                    user_id: filterUser,
                    date_start: filterDateStart,
                    date_end: filterDateEnd,
                    q: searchTerm
                }
            });
            return response.data;
        },
        enabled: tab === 'history'
    });

    // 4. Busca Estatísticas de Auditoria
    const { data: stats } = useQuery({
        queryKey: ['audit-stats'],
        queryFn: async () => {
            const response = await api.get('/v1/audit/stats');
            return response.data;
        }
    });

    return (
        <div className="p-6 md:p-10 max-w-[1600px] mx-auto space-y-8 font-sans">
            {/* Background Decoration */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-red-50 rounded-full blur-3xl opacity-50" />
                <div className="absolute top-1/2 -left-24 w-64 h-64 bg-slate-50 rounded-full blur-3xl opacity-50" />
            </div>

            {/* Header Section */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-gray-100">
                <div className="space-y-1">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 text-[#B70F0A]"
                    >
                        <div className="p-2 bg-red-50 rounded-xl">
                            <ClipboardCheck className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest bg-red-50 px-2 py-0.5 rounded text-[#B70F0A]">Governance v2.0</span>
                    </motion.div>
                    <h1 className="text-4xl md:text-5xl font-serif text-slate-800 tracking-tight">
                        Central de <span className="text-[#B70F0A]">Conferências</span>
                    </h1>
                    <p className="text-slate-500 max-w-lg leading-relaxed">
                        Sistema automatizado de integridade de dados via IA.
                        Verificamos a internet para manter o <span className="font-bold text-slate-700">O Vermelhinho</span> sempre preciso.
                    </p>
                </div>

                <div className="flex gap-4">
                    <motion.div
                        whileHover={{ y: -4 }}
                        className="bg-white px-6 py-4 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-5 min-w-[200px]"
                    >
                        <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-200">
                            <Zap className="w-6 h-6 fill-current" />
                        </div>
                        <div>
                            <span className="text-xs font-bold text-slate-400 uppercase">Ações Pendentes</span>
                            <div className="text-3xl font-black text-slate-800 leading-none mt-1">
                                {queueData?.meta?.total || 0}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </header>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                    { label: 'Conferidos Hoje', value: stats?.hoje, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Conferidos Ontem', value: stats?.ontem, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Últimos 7 dias', value: stats?.sete_dias, color: 'text-purple-600', bg: 'bg-purple-50' },
                    { label: 'Últimos 30 dias', value: stats?.trinta_dias, color: 'text-slate-600', bg: 'bg-slate-50' },
                    {
                        label: 'Cobertura Total',
                        value: stats?.porcentagem_concluida + '%',
                        color: 'text-red-600',
                        bg: 'bg-red-50',
                        sub: `(${stats?.clientes_auditados}/${stats?.total_clientes})`
                    },
                ].map((s, i) => (
                    <motion.div
                        key={s.label}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center group hover:shadow-md transition-all"
                    >
                        <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                            <CheckCircle2 className={`w-5 h-5 ${s.color}`} />
                        </div>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{s.label}</span>
                        <span className={`text-2xl font-black mt-1 ${s.color}`}>{s.value ?? 0}</span>
                        {s.sub && <span className="text-[9px] font-bold text-slate-400 mt-1">{s.sub}</span>}
                    </motion.div>
                ))}
            </div>

            {/* Navigation Tabs */}
            <nav className="flex items-center gap-8 px-2 border-b border-gray-50 bg-white/50 backdrop-blur-sm rounded-t-3xl">
                <button
                    onClick={() => updateFilter({ tab: 'queue' })}
                    className={`relative py-4 px-2 text-sm font-bold transition-all uppercase tracking-wider ${tab === 'queue' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <div className="flex items-center gap-2">
                        <LayoutDashboard className="w-4 h-4" />
                        Fila de Revisão
                    </div>
                    {tab === 'queue' && (
                        <motion.div layoutId="tab-active" className="absolute bottom-0 left-0 right-0 h-1 bg-[#B70F0A] rounded-t-full shadow-[0_0_10px_rgba(183,15,10,0.3)]" />
                    )}
                </button>
                <button
                    onClick={() => updateFilter({ tab: 'history' })}
                    className={`relative py-4 px-2 text-sm font-bold transition-all uppercase tracking-wider ${tab === 'history' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <div className="flex items-center gap-2">
                        <History className="w-4 h-4" />
                        Histórico Geral
                    </div>
                    {tab === 'history' && (
                        <motion.div layoutId="tab-active" className="absolute bottom-0 left-0 right-0 h-1 bg-[#B70F0A] rounded-t-full shadow-[0_0_10px_rgba(183,15,10,0.3)]" />
                    )}
                </button>
            </nav>

            {/* Filters Area */}
            <AnimatePresence mode="wait">
                {(tab === 'queue' || tab === 'history') && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-white/80 backdrop-blur-md p-3 rounded-2xl border border-gray-100 flex flex-wrap items-center gap-3 shadow-sm w-full"
                    >
                        <div className="flex-1 min-w-[200px] relative group">
                            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-[#B70F0A]" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => updateFilter({ q: e.target.value })}
                                placeholder="Buscar por cliente ou telefone..."
                                className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-red-200 transition-all outline-none text-sm placeholder:text-slate-400"
                            />
                        </div>

                        <Popover>
                            <PopoverTrigger asChild>
                                <button className="flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100 rounded-2xl relative overflow-hidden group h-10">
                                    <CalendarDays className="w-4 h-4 text-slate-400 group-hover:text-[#B70F0A] transition-colors" />
                                    <span className="text-sm font-bold text-slate-700 flex items-center gap-1">
                                        {filterDateStart ? format(new Date(filterDateStart + "T00:00:00"), "dd/MM/yyyy") : "Início"}
                                        <span className="text-slate-400 font-normal text-xs mx-1">até</span>
                                        {filterDateEnd ? format(new Date(filterDateEnd + "T00:00:00"), "dd/MM/yyyy") : "Fim"}
                                    </span>
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 border-none bg-transparent shadow-none" align="start">
                                <ExpressCalendar 
                                    startDate={filterDateStart || null} 
                                    endDate={filterDateEnd || null} 
                                    onChange={(start, end) => updateFilter({ date_start: start || "", date_end: end || "" })} 
                                />
                            </PopoverContent>
                        </Popover>

                        {tab === 'queue' && (
                            <>
                                <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl">
                                    <MapPin className="w-4 h-4 text-slate-400" />
                                    <Select value={filterCity || "all"} onValueChange={(val) => updateFilter({ cidade: val === "all" ? "" : val })}>
                                        <SelectTrigger className="w-[140px] h-auto border-0 p-0 bg-transparent shadow-none font-bold text-slate-700 outline-none focus:ring-0 [&>svg]:opacity-50">
                                            <SelectValue placeholder="Cidades" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todas Cidades</SelectItem>
                                            {cities?.map((c: any) => (
                                                <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl">
                                    <Users className="w-4 h-4 text-slate-400" />
                                    <Select value={filterType || "all"} onValueChange={(val) => updateFilter({ tipo: val === "all" ? "" : val })}>
                                        <SelectTrigger className="w-[110px] h-auto border-0 p-0 bg-transparent shadow-none font-bold text-slate-700 outline-none focus:ring-0 [&>svg]:opacity-50">
                                            <SelectValue placeholder="Tipos" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos Tipos</SelectItem>
                                            <SelectItem value="pagante">Pagantes</SelectItem>
                                            <SelectItem value="gratuito">Gratuitos</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl">
                                    <Eye className="w-4 h-4 text-slate-400" />
                                    <Select value={filterVisibilidade || "all"} onValueChange={(val) => updateFilter({ visibilidade: val === "all" ? "" : val })}>
                                        <SelectTrigger className="w-[125px] h-auto border-0 p-0 bg-transparent shadow-none font-bold text-slate-700 outline-none focus:ring-0 [&>svg]:opacity-50">
                                            <SelectValue placeholder="Status no Site" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Mista (Vis. & Ocult.)</SelectItem>
                                            <SelectItem value="visible">Visíveis</SelectItem>
                                            <SelectItem value="hidden">Ocultos</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </>
                        )}

                        <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl">
                            <ClipboardCheck className="w-4 h-4 text-slate-400" />
                            <Select value={filterUser || "all"} onValueChange={(val) => updateFilter({ user_id: val === "all" ? "" : val })}>
                                <SelectTrigger className="w-[130px] h-auto border-0 p-0 bg-transparent shadow-none font-bold text-slate-700 outline-none focus:ring-0 [&>svg]:opacity-50">
                                    <SelectValue placeholder="Conferido por" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Qualquer um</SelectItem>
                                    {auditors?.map((u: any) => (
                                        <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {hasFilters && (
                            <button
                                onClick={clearFilters}
                                className="flex items-center gap-2 px-4 py-3 text-slate-400 hover:text-red-600 transition-colors text-xs font-bold uppercase"
                            >
                                <X className="w-4 h-4" />
                                Limpar
                            </button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Table / Content Section */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-slate-200/50 overflow-hidden relative">
                {((tab === 'queue' && loadingQueue) || (tab === 'history' && loadingHistory)) ? (
                    <div className="flex flex-col items-center justify-center py-40 gap-6">
                        <div className="relative">
                            <Loader2 className="w-16 h-16 text-[#B70F0A] animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Zap className="w-6 h-6 text-red-100" />
                            </div>
                        </div>
                        <p className="font-serif text-2xl text-slate-400 italic">Sincronizando infraestrutura...</p>
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="overflow-x-auto"
                    >
                        {tab === 'queue' ? (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100">
                                        <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Identificação do Cliente</th>
                                        <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Localização / Status</th>
                                        <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Telefone</th>
                                        <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Data Varredura</th>
                                        <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Inconsistências</th>
                                        <th className="px-8 py-5 text-right">Ação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {queueData?.data?.length > 0 ? queueData.data.map((c: any, idx: number) => (
                                        <motion.tr
                                            key={c.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="group hover:bg-red-50/20 transition-all cursor-pointer"
                                            onClick={() => navigate(`/auditoria/${c.id}`)}
                                        >
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="relative">
                                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center overflow-hidden border border-white shadow-inner group-hover:shadow-md transition-all">
                                                            {c.logo_url ? (
                                                                <img src={c.logo_url} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <Building2 className="text-slate-400 w-6 h-6" />
                                                            )}
                                                        </div>
                                                        {c.tipo_cliente === 'pagante' && (
                                                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white shadow-sm flex items-center justify-center">
                                                                <Zap className="w-2 h-2 text-white fill-current" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-slate-800 text-lg group-hover:text-[#B70F0A] transition-colors flex items-center gap-2">
                                                            {c.nome_fantasia}
                                                            {c.exibir_no_site === false && (
                                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-50 text-red-700 border border-red-200 uppercase tracking-tighter">
                                                                    <EyeOff className="w-3 h-3" /> Oculto
                                                                </span>
                                                            )}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-slate-400">
                                                            {c.razao_social && c.razao_social !== c.nome_fantasia ? c.razao_social : (c.cpf_cnpj || 'Sem documento')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-1.5 text-slate-600">
                                                        <MapPin className="w-3.5 h-3.5 text-red-400" />
                                                        <span className="text-sm font-semibold">{c.enderecos?.[0]?.cidade || 'S/ Cidade'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className={`text-[10px] font-black px-2 py-0.5 rounded-full w-fit uppercase tracking-tighter ${c.tipo_cliente === 'pagante' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                                                            {c.tipo_cliente}
                                                        </div>
                                                        {c.audit_status === 'ok' ? (
                                                            <div className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 uppercase tracking-tighter flex items-center gap-1">
                                                                <CheckCircle2 className="w-2.5 h-2.5" />
                                                                Conferido
                                                            </div>
                                                        ) : (
                                                            <div className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 uppercase tracking-tighter flex items-center gap-1">
                                                                <AlertCircle className="w-2.5 h-2.5" />
                                                                Aguardando
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-sm font-bold text-slate-700">
                                                        {c.contatos?.[0]?.telefone_principal || '---'}
                                                    </span>
                                                    {c.contatos?.[0]?.celular && (
                                                        <span className="text-[10px] text-slate-400 font-medium">
                                                            {c.contatos[0].celular}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2 text-slate-500">
                                                    <CalendarDays className="w-4 h-4" />
                                                    <span className="text-sm font-medium">
                                                        {c.last_audit_at ? format(new Date(c.last_audit_at), 'dd/MM/yyyy • HH:mm') : 'Pendente'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex gap-2 flex-wrap">
                                                    {Object.keys(c.audit_differences || {}).map((key) => (
                                                        <span key={key} className="bg-white text-[#B70F0A] text-[9px] font-black px-2 py-1 rounded-lg uppercase border border-red-100 shadow-sm flex items-center gap-1">
                                                            <AlertCircle className="w-2.5 h-2.5" />
                                                            {key === 'telefone' ? 'Telefone' : key === 'endereco' ? 'Endereço' : key === 'website' ? 'Site' : key}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    className={`px-5 py-2.5 rounded-2xl text-sm font-bold flex items-center gap-2 ml-auto shadow-lg transition-all ${c.audit_status === 'ok' ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 shadow-slate-100' : 'bg-slate-900 text-white hover:bg-[#B70F0A] shadow-slate-200 hover:shadow-red-200'}`}
                                                >
                                                    {c.audit_status === 'ok' ? 'Revisar' : 'Analisar'}
                                                    <ChevronRight className="w-4 h-4" />
                                                </motion.button>
                                            </td>
                                        </motion.tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={5} className="py-32 text-center">
                                                <div className="flex flex-col items-center gap-4 text-slate-300">
                                                    <SearchX className="w-16 h-16 stroke-[1]" />
                                                    <div className="space-y-1">
                                                        <p className="text-xl font-serif italic">Nenhuma anomalia detectada</p>
                                                        <p className="text-sm font-bold text-slate-400 uppercase tracking-tighter">Sua base de dados está 100% íntegra no momento.</p>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        ) : (
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Cronologia</th>
                                        <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Responsável</th>
                                        <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Cliente Conferido</th>
                                        <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Evento</th>
                                        <th className="px-8 py-5 text-right">Visualizar</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {historyData?.data?.length > 0 ? historyData.data.map((log: any, idx: number) => (
                                        <motion.tr
                                            key={log.id}
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.03 }}
                                            className="hover:bg-slate-50/50 transition-colors"
                                        >
                                            <td className="px-8 py-6">
                                                <span className="text-sm font-bold text-slate-600">
                                                    {format(new Date(log.created_at), "dd/MM/yy '•' HH:mm", { locale: ptBR })}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-black ring-4 ring-slate-100">
                                                        {log.actor?.name?.charAt(0) || 'S'}
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-700">{log.actor?.name || 'Sistema IA'}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="text-sm font-bold text-[#B70F0A]">{log.cliente?.nome_fantasia || '---'}</span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-black px-2.5 py-1 rounded-lg border border-emerald-100 flex items-center gap-1.5 w-fit uppercase">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    Conferência Finalizada
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <button
                                                    onClick={() => navigate(`/clientes/${log.cliente_id}`)}
                                                    className="p-2.5 hover:bg-white hover:shadow-md rounded-xl transition-all text-slate-400 hover:text-slate-900 border border-transparent hover:border-slate-100"
                                                >
                                                    <ArrowUpRight className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </motion.tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={5} className="py-32 text-center text-slate-300">
                                                Nenhum histórico registrado no período.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}

                        {/* Pagination Area */}
                        <footer className="p-6 bg-slate-50/50 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="text-xs font-bold text-slate-400 tracking-tighter uppercase">
                                Mostrando {tab === 'queue' ? queueData?.data?.length : historyData?.data?.length} de {tab === 'queue' ? queueData?.meta?.total : historyData?.total} resultados
                            </div>

                            <div className="flex items-center gap-4">
                                <button
                                    disabled={page === 1}
                                    onClick={() => { updateFilter({ page: page - 1 }); window.scrollTo(0, 0); }}
                                    className="px-6 py-2.5 rounded-2xl bg-white border border-slate-200 text-sm font-bold text-slate-600 hover:border-[#B70F0A] hover:text-[#B70F0A] disabled:opacity-30 disabled:hover:text-slate-600 transition-all shadow-sm"
                                >
                                    Página Anterior
                                </button>
                                <div className="flex gap-1.5">
                                    <span className="w-8 h-8 rounded-lg bg-[#B70F0A] text-white flex items-center justify-center text-sm font-black shadow-lg shadow-red-100">{page}</span>
                                </div>
                                <button
                                    disabled={tab === 'queue' ? page >= queueData?.meta?.last_page : page >= historyData?.last_page}
                                    onClick={() => { updateFilter({ page: page + 1 }); window.scrollTo(0, 0); }}
                                    className="px-6 py-2.5 rounded-2xl bg-white border border-slate-200 text-sm font-bold text-slate-600 hover:border-[#B70F0A] hover:text-[#B70F0A] disabled:opacity-30 disabled:hover:text-slate-600 transition-all shadow-sm"
                                >
                                    Próxima Página
                                </button>
                            </div>
                        </footer>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default AuditDashboardPage;
