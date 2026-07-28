import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    ClipboardCheck,
    Filter,
    Search,
    ChevronRight,
    ChevronDown,
    ChevronUp,
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
    Building2,
    Tag,
    Check,
    ChevronsUpDown,
    HelpCircle,
    Info,
    Globe,
    Cpu,
    Target,
    PlayCircle,
    RefreshCw,
    Mail,
    FileText,
    Phone,
    Instagram,
    Save,
    ExternalLink,
    User
} from 'lucide-react';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { ExpressCalendar } from '@/components/ui/ExpressCalendar';

const formatPhone = (phoneStr: string) => {
    if (!phoneStr) return '---';
    const digits = phoneStr.replace(/\D/g, '');
    if (digits.length === 11) {
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }
    if (digits.length === 10) {
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    return phoneStr;
};

const fieldLabels: Record<string, string> = {
    'nome_fantasia': 'Nome Fantasia',
    'razao_social': 'Razão Social',
    'cpf_cnpj': 'CPF / CNPJ',
    'exibir_no_site': 'Exibir no Site',
    'possui_publicidade': 'Plano Destaque',
    'exibir_data_fundacao': 'Exibir Fundação',
    'telefone': 'Telefone Principal',
    'website': 'Site',
    'observacoes': 'Observações Internas',
    'horario_atendimento': 'Horários de Atendimento',
    'observacoes_horario': 'Obs. de Horários',
    'beneficios': 'Benefícios',
    'google_place_id': 'ID do Google Maps',
    'cep': 'CEP',
    'logradouro': 'Logradouro',
    'numero': 'Número',
    'bairro': 'Bairro',
    'cidade': 'Cidade',
    'estado': 'Estado',
    'complemento': 'Complemento',
    'latitude': 'Latitude',
    'longitude': 'Longitude',
    'logo_url': 'Logotipo',
    'banner_url': 'Banner',
    'seo_keywords': 'Palavras-chave SEO',
    'seo_description': 'Descrição SEO',
    'seo_title': 'Título SEO'
};

const HistoryRow = ({ log, idx, navigate }: { log: any, idx: number, navigate: any }) => {
    const [expanded, setExpanded] = useState(false);
    
    // Filter out internal timestamp fields and system-only fields
    const INTERNAL_FIELDS = ['updated_at', 'last_audit_at', 'seo_keywords_updated_at', 'audit_status', 'audit_differences', 'seo_keywords', 'seo_keywords_source', 'tiny_id', 'responsavel'];
    const changes = log.field_changes 
        ? Object.entries(log.field_changes).filter(([k, v]: [string, any]) => {
            if (INTERNAL_FIELDS.includes(k)) return false;
            if (!v || typeof v !== 'object') return false;
            // Só exibe se tiver estrutura {from, to} e os valores forem diferentes
            return 'from' in v && 'to' in v && String(v.from) !== String(v.to);
          }) 
        : [];
    const hasRealChanges = changes.length > 0;

    return (
        <>
            <motion.tr
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                onClick={() => hasRealChanges && setExpanded(!expanded)}
            >
                <td className="px-8 py-6">
                    <span className="text-sm font-bold text-slate-600 flex items-center gap-2">
                        {hasRealChanges && (
                            <button className="text-slate-400 group-hover:text-[#B70F0A] transition-colors">
                                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                        )}
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
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-[#B70F0A]">{log.cliente?.nome_fantasia || '---'}</span>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] font-medium text-slate-400">
                            {log.cliente?.enderecos && log.cliente.enderecos.length > 0 && (
                                <span>{log.cliente.enderecos[0].cidade}</span>
                            )}
                            {log.cliente?.contatos && log.cliente.contatos.length > 0 && log.cliente.contatos[0].telefone_principal && (
                                <>
                                    <span>•</span>
                                    <span>{log.cliente.contatos[0].telefone_principal}</span>
                                </>
                            )}
                        </div>
                    </div>
                </td>
                <td className="px-8 py-6">
                    {hasRealChanges ? (
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 font-black px-2.5 py-1 rounded-lg border border-emerald-100 flex items-center gap-1.5 w-fit uppercase">
                            <CheckCircle2 className="w-3 h-3" />
                            {changes.length} Alterações
                        </span>
                    ) : (
                        <span className="text-[10px] bg-slate-50 text-slate-500 font-black px-2.5 py-1 rounded-lg border border-slate-100 flex items-center gap-1.5 w-fit uppercase">
                            <Info className="w-3 h-3" />
                            Nenhuma Alteração
                        </span>
                    )}
                </td>
                <td className="px-8 py-6 text-right">
                    <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/clientes/${log.cliente_id}/hub`); }}
                        className="p-2.5 hover:bg-white hover:shadow-md rounded-xl transition-all text-slate-400 hover:text-slate-900 border border-transparent hover:border-slate-100"
                    >
                        <ArrowUpRight className="w-5 h-5" />
                    </button>
                </td>
            </motion.tr>
            
            <AnimatePresence>
                {expanded && hasRealChanges && (
                    <motion.tr
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-slate-50/30 overflow-hidden"
                    >
                        <td colSpan={5} className="px-8 py-6">
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                                <h4 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                                    <History className="w-4 h-4 text-[#B70F0A]" />
                                    Detalhes da Atualização
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {changes.map(([key, vals]: [string, any]) => {
                                        if (!vals) return null;
                                        const label = fieldLabels[key] || key;
                                        const from = vals.from === null || vals.from === '' ? 'Vazio' : String(vals.from);
                                        const to = vals.to === null || vals.to === '' ? 'Vazio' : String(vals.to);
                                        
                                        return (
                                            <div key={key} className="bg-slate-50 rounded-xl p-4 border border-slate-100/50">
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                                                    {label}
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-start gap-2">
                                                        <span className="mt-0.5 text-slate-300"><X className="w-3.5 h-3.5" /></span>
                                                        <span className="text-sm text-slate-500 font-medium line-through decoration-slate-300 break-words line-clamp-2">
                                                            {from === 'true' ? 'Sim' : from === 'false' ? 'Não' : from}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-start gap-2">
                                                        <span className="mt-0.5 text-emerald-500"><Check className="w-3.5 h-3.5" /></span>
                                                        <span className="text-sm text-emerald-700 font-bold break-words line-clamp-3">
                                                            {to === 'true' ? 'Sim' : to === 'false' ? 'Não' : to}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </td>
                    </motion.tr>
                )}
            </AnimatePresence>
        </>
    );
};

const AuditDashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();
    const [segmentOpen, setSegmentOpen] = useState(false);
    const [showHowItWorks, setShowHowItWorks] = useState(false);
    const [scanTriggered, setScanTriggered] = useState(false);
    const [scanMessage, setScanMessage] = useState('');
    const [forcingScanId, setForcingScanId] = useState<number | null>(null);
    const [forceScanResult, setForceScanResult] = useState<Record<number, {status: string; message: string}>>({});
    const [expandedClientId, setExpandedClientId] = useState<number | null>(null);
    const [inlineStatus, setInlineStatus] = useState<Record<string, 'accepted' | 'rejected'>>({});
    const [showCitiesPanel, setShowCitiesPanel] = useState(false);
    const [editingObservations, setEditingObservations] = useState<string>('');

    // Filtros persistentes na URL
    const tab = (searchParams.get('tab') as 'queue' | 'history' | 'cities') || 'queue';
    const page = parseInt(searchParams.get('page') || '1');
    const filterCity = searchParams.get('cidade') || '';
    const filterType = searchParams.get('tipo') || 'gratuito';
    const filterUser = searchParams.get('user_id') || '';
    const filterDateStart = searchParams.get('date_start') || '';
    const filterDateEnd = searchParams.get('date_end') || '';
    const filterVisibilidade = searchParams.get('visibilidade') || '';
    const filterSegmento = searchParams.get('segmento_id') || '';
    const filterResult = searchParams.get('result') || ''; // 'all' | 'corrected' | 'kept'
    const filterStatus = searchParams.get('status') || 'pending'; // pending | manual_review | ok | all | any
    const searchTerm = searchParams.get('q') || '';

    const updateFilter = (params: Record<string, string | number | null>) => {
        const newParams = new URLSearchParams(searchParams);
        Object.entries(params).forEach(([key, val]) => {
            if (val === null || val === '') newParams.delete(key);
            else newParams.set(key, String(val));
        });

        // Se mudou tab ou filtro, volta pra página 1
        if (!params.page && (params.tab || params.cidade || params.tipo || params.q || params.segmento_id || params.result)) {
            newParams.set('page', '1');
        }
        setSearchParams(newParams);
    };

    const clearFilters = () => {
        setSearchParams({ tab });
    };

    const hasFilters = filterCity || filterType || searchTerm || filterUser || filterDateStart || filterDateEnd || filterVisibilidade || filterSegmento || filterResult || (filterStatus && filterStatus !== 'pending');

    // 1. Busca Cidades para o Filtro
    const { data: cities } = useQuery({
        queryKey: ['cidades-audit'],
        queryFn: async () => {
            const response = await api.get('/v1/cidades');
            return response.data.data;
        }
    });

    // 1.2. Busca Métricas por Cidade
    const { data: cityStats, isLoading: loadingCityStats } = useQuery({
        queryKey: ['audit-city-stats'],
        queryFn: async () => {
            const response = await api.get('/v1/audit/city-stats');
            return response.data;
        },
        enabled: tab === 'cities' || tab === 'queue'
    });

    // 1.5. Busca Segmentos para o Filtro
    const { data: segments } = useQuery({
        queryKey: ['segmentos-audit'],
        queryFn: async () => {
            const response = await api.get('/v1/segmentos');
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

    // 2. Busca Fila de Auditoria
    const { data: queueData, isLoading: loadingQueue } = useQuery({
        queryKey: ['audit-queue', page, filterCity, filterType, filterVisibilidade, filterSegmento, searchTerm, filterStatus, filterUser, filterDateStart, filterDateEnd],
        queryFn: async () => {
            const response = await api.get('/v1/audit/queue', {
                params: {
                    page,
                    cidade: filterCity,
                    tipo: filterType,
                    visibilidade: filterVisibilidade,
                    segmento_id: filterSegmento,
                    q: searchTerm,
                    status: filterStatus || 'pending',
                    user_id: filterUser,
                    date_start: filterDateStart,
                    date_end: filterDateEnd
                }
            });
            return response.data;
        },
        enabled: tab === 'queue'
    });

    // 3. Busca Histórico (Audit Logs)
    const { data: historyData, isLoading: loadingHistory } = useQuery({
        queryKey: ['audit-history', page, filterUser, filterSegmento, filterResult, searchTerm, filterDateStart, filterDateEnd],
        queryFn: async () => {
            const response = await api.get('/v1/audit/history', {
                params: {
                    page,
                    user_id: filterUser,
                    date_start: filterDateStart,
                    date_end: filterDateEnd,
                    segmento_id: filterSegmento,
                    result: filterResult, // Novo filtro
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

    // 5. Mutation: Dispara scan manual em background
    const { mutate: triggerScan, isPending: triggeringScan } = useMutation({
        mutationFn: () => api.post('/v1/audit/trigger-scan', { limit: 50 }),
        onSuccess: (res) => {
            setScanTriggered(true);
            setScanMessage(res.data.message);
            setTimeout(() => setScanTriggered(false), 120000); // reset após 2 min
        },
        onError: () => setScanMessage('Erro ao iniciar varredura. Tente novamente.'),
    });

    // 6. Mutation: Força re-auditoria de um cliente específico (síncrono)
    const { mutate: forceScan } = useMutation({
        mutationFn: (clienteId: number) => api.post(`/v1/audit/${clienteId}/force-scan`),
        onMutate: (clienteId) => setForcingScanId(clienteId),
        onSuccess: (res, clienteId) => {
            setForcingScanId(null);
            setForceScanResult(prev => ({ ...prev, [clienteId]: { status: res.data.status, message: res.data.message } }));
            queryClient.invalidateQueries({ queryKey: ['audit-queue'] });
            setTimeout(() => setForceScanResult(prev => { const n = {...prev}; delete n[clienteId]; return n; }), 8000);
        },
        onError: (_err, clienteId) => {
            setForcingScanId(null);
            setForceScanResult(prev => ({ ...prev, [clienteId]: { status: 'error', message: 'Erro ao re-auditar. Tente novamente.' } }));
        },
    });

    const updateClientMutation = useMutation({
        mutationFn: async ({ id, payload }: { id: number; payload: any }) => {
            return api.post(`/v1/clientes/${id}/audit/save`, payload);
        },
        onSuccess: () => {
            toast.success('Auditoria salva e cadastro atualizado!');
            setExpandedClientId(null);
            setInlineStatus({});
            queryClient.invalidateQueries({ queryKey: ['audit-queue'] });
            queryClient.invalidateQueries({ queryKey: ['audit-stats'] });
            queryClient.invalidateQueries({ queryKey: ['audit-city-stats'] });
        },
        onError: () => {
            toast.error('Erro ao salvar alterações.');
        }
    });

    const handleInlineSave = (client: any, overrideStatus?: string) => {
        const payload: any = {
            ...client,
            exibir_no_site: client.exibir_no_site,
            exibir_data_fundacao: client.exibir_data_fundacao,
            observacoes: editingObservations,
        };

        if (client.contatos) payload.contatos = JSON.parse(JSON.stringify(client.contatos));
        if (client.enderecos) payload.enderecos = JSON.parse(JSON.stringify(client.enderecos));
        if (client.redes_sociais) payload.redes_sociais = JSON.parse(JSON.stringify(client.redes_sociais));

        const diffs = client.audit_differences || {};

        Object.keys(diffs).forEach(fieldId => {
            const status = inlineStatus[fieldId];
            if (status === 'accepted') {
                if (fieldId === 'telefone') {
                    if (!payload.contatos[0]) payload.contatos[0] = {};
                    payload.contatos[0].telefone_principal = diffs.telefone.new;
                }
                if (fieldId === 'website') {
                    const idx = payload.redes_sociais.findIndex((r: any) => r.tipo === 'website');
                    if (idx >= 0) payload.redes_sociais[idx].url = diffs.website.new;
                    else payload.redes_sociais.push({ tipo: 'website', url: diffs.website.new });
                }
                if (fieldId === 'endereco') {
                    const parts = diffs.endereco?.parts;
                    if (!payload.enderecos[0]) payload.enderecos[0] = {};
                    if (parts) {
                        payload.enderecos[0] = {
                            ...payload.enderecos[0],
                            rua: parts.rua || payload.enderecos[0].rua,
                            numero: parts.numero || payload.enderecos[0].numero,
                            bairro: parts.bairro || payload.enderecos[0].bairro,
                            cidade: parts.cidade || payload.enderecos[0].cidade,
                            estado: parts.estado || payload.enderecos[0].estado,
                            cep: parts.cep || payload.enderecos[0].cep,
                            complemento: parts.complemento || payload.enderecos[0].complemento,
                        };
                    } else {
                        payload.enderecos[0].rua = diffs.endereco.new;
                    }
                }
                if (fieldId === 'instagram') {
                    const idx = payload.redes_sociais.findIndex((r: any) => r.tipo === 'instagram');
                    if (idx >= 0) payload.redes_sociais[idx].url = diffs.instagram.new;
                    else payload.redes_sociais.push({ tipo: 'instagram', url: diffs.instagram.new });
                }
                if (fieldId === 'nome') {
                    payload.nome_fantasia = diffs.nome.new;
                }
                if (fieldId === 'email') {
                    if (!payload.contatos[0]) payload.contatos[0] = {};
                    payload.contatos[0].email_principal = diffs.email.new;
                }
            }
        });

        payload.audit_status = overrideStatus || 'ok';
        payload.last_audit_at = new Date().toISOString();
        payload.audit_differences = null;
        payload.audit_action = 'audit_save';

        updateClientMutation.mutate({ id: client.id, payload });
    };

    const confirmAllCurrent = (client: any) => {
        const payload: any = {
            ...client,
            exibir_no_site: client.exibir_no_site,
            exibir_data_fundacao: client.exibir_data_fundacao,
            observacoes: editingObservations,
        };

        if (client.contatos) payload.contatos = JSON.parse(JSON.stringify(client.contatos));
        if (client.enderecos) payload.enderecos = JSON.parse(JSON.stringify(client.enderecos));
        if (client.redes_sociais) payload.redes_sociais = JSON.parse(JSON.stringify(client.redes_sociais));

        payload.audit_status = 'ok';
        payload.last_audit_at = new Date().toISOString();
        payload.audit_differences = null;
        payload.audit_action = 'audit_save';

        updateClientMutation.mutate({ id: client.id, payload });
    };

    const markManualReview = (client: any) => {
        const payload: any = {
            ...client,
            exibir_no_site: client.exibir_no_site,
            exibir_data_fundacao: client.exibir_data_fundacao,
            observacoes: editingObservations,
        };

        if (client.contatos) payload.contatos = JSON.parse(JSON.stringify(client.contatos));
        if (client.enderecos) payload.enderecos = JSON.parse(JSON.stringify(client.enderecos));
        if (client.redes_sociais) payload.redes_sociais = JSON.parse(JSON.stringify(client.redes_sociais));

        payload.audit_status = 'manual_review';
        payload.last_audit_at = new Date().toISOString();
        payload.audit_differences = null;
        payload.audit_action = 'audit_save';

        updateClientMutation.mutate({ id: client.id, payload });
    };

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
                    <div className="flex items-center gap-4">
                        <h1 className="text-4xl md:text-5xl font-serif text-slate-800 tracking-tight">
                            Central de <span className="text-[#B70F0A]">Conferências</span>
                        </h1>
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowHowItWorks(true)}
                            className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-[#B70F0A] hover:text-white text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all mt-2"
                        >
                            <HelpCircle className="w-4 h-4" />
                            Como funciona?
                        </motion.button>
                    </div>
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

                    {/* Botão: Gerar Novas Conferências */}
                    <motion.div whileHover={{ y: -4 }} className="flex items-stretch">
                        <button
                            onClick={() => !scanTriggered && !triggeringScan && triggerScan()}
                            disabled={triggeringScan || scanTriggered}
                            title={scanTriggered ? scanMessage : 'Gerar 50 novas conferências para a equipe'}
                            className={`flex items-center gap-3 px-5 py-4 rounded-3xl border font-bold text-sm transition-all shadow-sm
                                ${ scanTriggered
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 cursor-default'
                                    : triggeringScan
                                    ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-wait'
                                    : 'bg-white border-gray-100 text-slate-700 hover:bg-red-600 hover:text-white hover:border-red-600 hover:shadow-red-200'
                                }`
                            }
                        >
                            {triggeringScan ? (
                                <><RefreshCw className="w-5 h-5 animate-spin" /> Iniciando...</>
                            ) : scanTriggered ? (
                                <><CheckCircle2 className="w-5 h-5" /> Varredura em andamento...</>
                            ) : (
                                <><PlayCircle className="w-5 h-5" /> Gerar Conferências</>  
                            )}
                        </button>
                    </motion.div>
                </div>
            </header>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                    { 
                        label: 'Conferidos Hoje', 
                        value: stats?.hoje, 
                        color: 'text-emerald-600', 
                        bg: 'bg-emerald-50',
                        onClick: () => updateFilter({ tab: 'history', date_start: format(new Date(), 'yyyy-MM-dd'), date_end: format(new Date(), 'yyyy-MM-dd') })
                    },
                    { 
                        label: 'Conferidos Ontem', 
                        value: stats?.ontem, 
                        color: 'text-blue-600', 
                        bg: 'bg-blue-50',
                        onClick: () => updateFilter({ tab: 'history', date_start: format(subDays(new Date(), 1), 'yyyy-MM-dd'), date_end: format(subDays(new Date(), 1), 'yyyy-MM-dd') })
                    },
                    { 
                        label: 'Últimos 7 dias', 
                        value: stats?.sete_dias, 
                        color: 'text-purple-600', 
                        bg: 'bg-purple-50',
                        onClick: () => updateFilter({ tab: 'history', date_start: format(subDays(new Date(), 7), 'yyyy-MM-dd'), date_end: format(new Date(), 'yyyy-MM-dd') })
                    },
                    { 
                        label: 'Últimos 30 dias', 
                        value: stats?.trinta_dias, 
                        color: 'text-slate-600', 
                        bg: 'bg-slate-50',
                        onClick: () => updateFilter({ tab: 'history', date_start: format(subDays(new Date(), 30), 'yyyy-MM-dd'), date_end: format(new Date(), 'yyyy-MM-dd') })
                    },
                    {
                        label: 'Cobertura Total',
                        value: stats?.porcentagem_concluida + '%',
                        color: 'text-red-600',
                        bg: 'bg-red-50',
                        sub: `(${stats?.clientes_auditados}/${stats?.total_clientes})`,
                        onClick: () => updateFilter({ tab: 'queue', status: 'ok' })
                    },
                ].map((s, i) => (
                    <motion.div
                        key={s.label}
                        onClick={s.onClick}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center group hover:shadow-md transition-all cursor-pointer"
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
            <nav className="flex items-center gap-8 px-2 border-b border-gray-50 bg-white/50 backdrop-blur-sm rounded-t-3xl overflow-x-auto">
                <button
                    onClick={() => updateFilter({ tab: 'queue' })}
                    className={`relative py-4 px-2 text-sm font-bold transition-all uppercase tracking-wider shrink-0 ${tab === 'queue' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
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
                    className={`relative py-4 px-2 text-sm font-bold transition-all uppercase tracking-wider shrink-0 ${tab === 'history' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <div className="flex items-center gap-2">
                        <History className="w-4 h-4" />
                        Histórico Geral
                    </div>
                    {tab === 'history' && (
                        <motion.div layoutId="tab-active" className="absolute bottom-0 left-0 right-0 h-1 bg-[#B70F0A] rounded-t-full shadow-[0_0_10px_rgba(183,15,10,0.3)]" />
                    )}
                </button>
                <button
                    onClick={() => updateFilter({ tab: 'cities' })}
                    className={`relative py-4 px-2 text-sm font-bold transition-all uppercase tracking-wider shrink-0 ${tab === 'cities' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Visão por Cidades
                    </div>
                    {tab === 'cities' && (
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
                        className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-gray-100 flex flex-wrap items-end gap-6 shadow-sm w-full"
                    >
                        {/* Pesquisar */}
                        <div className="flex-1 min-w-[280px] space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Pesquisar</label>
                            <div className="relative group">
                                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-[#B70F0A]" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => updateFilter({ q: e.target.value })}
                                    placeholder="Nome do cliente ou telefone..."
                                    className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:border-red-200 transition-all outline-none text-sm placeholder:text-slate-400"
                                />
                            </div>
                        </div>

                        {/* Período */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Período</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <button className="flex items-center gap-3 px-4 py-3 bg-slate-50/50 hover:bg-slate-100 transition-colors border border-slate-100 rounded-2xl relative overflow-hidden group h-[46px] min-w-[200px]">
                                        <CalendarDays className="w-4 h-4 text-slate-400 group-hover:text-[#B70F0A] transition-colors" />
                                        <span className="text-sm font-bold text-slate-700 flex items-center gap-1">
                                            {filterDateStart ? format(new Date(filterDateStart + "T00:00:00"), "dd/MM/yy") : "Início"}
                                            <span className="text-slate-400 font-normal text-xs mx-1">até</span>
                                            {filterDateEnd ? format(new Date(filterDateEnd + "T00:00:00"), "dd/MM/yy") : "Fim"}
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
                        </div>

                        {/* Segmento */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Segmento</label>
                            <Popover open={segmentOpen} onOpenChange={setSegmentOpen}>
                                <PopoverTrigger asChild>
                                    <button className="flex items-center gap-3 px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-2xl h-[46px] min-w-[180px]">
                                        <Tag className="w-4 h-4 text-slate-400" />
                                        <span className="text-sm font-bold text-slate-700 truncate max-w-[120px]">
                                            {filterSegmento ? segments?.find((s: any) => s.id.toString() === filterSegmento)?.nome : "Todos Segmentos"}
                                        </span>
                                        <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[250px] p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder="Buscar segmento..." />
                                        <CommandList>
                                            <CommandEmpty>Nenhum segmento encontrado.</CommandEmpty>
                                            <CommandGroup>
                                                <CommandItem
                                                    onSelect={() => {
                                                        updateFilter({ segmento_id: "" });
                                                        setSegmentOpen(false);
                                                    }}
                                                    className="flex items-center gap-2"
                                                >
                                                    <Check className={`h-4 w-4 ${!filterSegmento ? "opacity-100" : "opacity-0"}`} />
                                                    Todos Segmentos
                                                </CommandItem>
                                                {segments?.map((s: any) => (
                                                    <CommandItem
                                                        key={s.id}
                                                        onSelect={() => {
                                                            updateFilter({ segmento_id: s.id.toString() });
                                                            setSegmentOpen(false);
                                                        }}
                                                        className="flex items-center gap-2"
                                                    >
                                                        <Check className={`h-4 w-4 ${filterSegmento === s.id.toString() ? "opacity-100" : "opacity-0"}`} />
                                                        {s.nome}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {tab === 'queue' && (
                            <>
                                {/* Cidade */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Cidade</label>
                                    <div className="flex items-center gap-3 px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-2xl h-[46px]">
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
                                </div>

                                {/* Tipo */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Plano</label>
                                    <div className="flex items-center gap-3 px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-2xl h-[46px]">
                                        <Users className="w-4 h-4 text-slate-400" />
                                        <Select value={filterType || "all"} onValueChange={(val) => updateFilter({ tipo: val === "all" ? "" : val })}>
                                            <SelectTrigger className="w-[110px] h-auto border-0 p-0 bg-transparent shadow-none font-bold text-slate-700 outline-none focus:ring-0 [&>svg]:opacity-50">
                                                <SelectValue placeholder="Tipos" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todos Planos</SelectItem>
                                                <SelectItem value="pagante">Pagantes</SelectItem>
                                                <SelectItem value="gratuito">Gratuitos</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Visibilidade */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Visibilidade</label>
                                    <div className="flex items-center gap-3 px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-2xl h-[46px]">
                                        <Eye className="w-4 h-4 text-slate-400" />
                                        <Select value={filterVisibilidade || "all"} onValueChange={(val) => updateFilter({ visibilidade: val === "all" ? "" : val })}>
                                            <SelectTrigger className="w-[125px] h-auto border-0 p-0 bg-transparent shadow-none font-bold text-slate-700 outline-none focus:ring-0 [&>svg]:opacity-50">
                                                <SelectValue placeholder="Status no Site" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Mista</SelectItem>
                                                <SelectItem value="visible">Visíveis</SelectItem>
                                                <SelectItem value="hidden">Ocultos</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Status da Auditoria */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Status</label>
                                    <div className="flex items-center gap-3 px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-2xl h-[46px]">
                                        <ClipboardCheck className="w-4 h-4 text-slate-400" />
                                        <Select value={filterStatus || "pending"} onValueChange={(val) => updateFilter({ status: val })}>
                                            <SelectTrigger className="w-[155px] h-auto border-0 p-0 bg-transparent shadow-none font-bold text-slate-700 outline-none focus:ring-0 [&>svg]:opacity-50">
                                                <SelectValue placeholder="Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="pending">
                                                    <span className="flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                                                        Aguardando IA
                                                    </span>
                                                </SelectItem>
                                                <SelectItem value="manual_review">
                                                    <span className="flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
                                                        Revisão Manual
                                                    </span>
                                                </SelectItem>
                                                <SelectItem value="all">
                                                    <span className="flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
                                                        Todos Pendentes
                                                    </span>
                                                </SelectItem>
                                                <SelectItem value="ok">
                                                    <span className="flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                                                        Conferidos
                                                    </span>
                                                </SelectItem>
                                                <SelectItem value="any">
                                                    <span className="flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                                                        Todos Cadastros
                                                    </span>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </>
                        )}

                        {tab === 'history' && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Resultado</label>
                                <div className="flex items-center gap-3 px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-2xl h-[46px]">
                                    <CheckCircle2 className="w-4 h-4 text-slate-400" />
                                    <Select value={filterResult || "all"} onValueChange={(val) => updateFilter({ result: val === "all" ? "" : val })}>
                                        <SelectTrigger className="w-[140px] h-auto border-0 p-0 bg-transparent shadow-none font-bold text-slate-700 outline-none focus:ring-0 [&>svg]:opacity-50">
                                            <SelectValue placeholder="Todos Resultados" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos Resultados</SelectItem>
                                            <SelectItem value="corrected">Foi Corrigido</SelectItem>
                                            <SelectItem value="kept">Não foi alterado</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}

                        {/* Auditor */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Responsável</label>
                            <div className="flex items-center gap-3 px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-2xl h-[46px]">
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
                        </div>

                        {hasFilters && (
                            <button
                                onClick={clearFilters}
                                className="flex items-center gap-2 px-4 py-3 text-slate-400 hover:text-red-600 transition-colors text-[10px] font-black uppercase tracking-widest h-[46px]"
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
                {((tab === 'queue' && loadingQueue) || (tab === 'history' && loadingHistory) || (tab === 'cities' && loadingCityStats)) ? (
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
                        {tab === 'queue' && cityStats && cityStats.length > 0 && (
                            <div className="bg-slate-50/50 border-b border-slate-100 p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <button
                                        onClick={() => setShowCitiesPanel(!showCitiesPanel)}
                                        className="text-xs font-black uppercase text-slate-650 hover:text-[#B70F0A] hover:bg-red-50 bg-slate-100 hover:border-red-200 border border-slate-200 px-3.5 py-2 rounded-2xl transition-all flex items-center gap-2 shadow-sm cursor-pointer"
                                    >
                                        <MapPin className="w-4 h-4 text-[#B70F0A]" />
                                        Painel de Cidades (Concluídos / Pendentes)
                                        {showCitiesPanel ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                                    </button>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase">Clique em uma cidade para filtrar a fila</span>
                                </div>
                                
                                <AnimatePresence>
                                    {showCitiesPanel && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-2"
                                        >
                                            {cityStats.map((city: any) => (
                                                <div
                                                    key={city.id}
                                                    onClick={() => updateFilter({ cidade: filterCity === city.nome ? '' : city.nome })}
                                                    className={`p-3 rounded-2xl border bg-white shadow-sm flex flex-col justify-between hover:shadow-md hover:border-red-200 transition-all cursor-pointer ${filterCity === city.nome ? 'border-[#B70F0A] ring-2 ring-red-50' : 'border-slate-100'}`}
                                                >
                                                    <span className="text-[10px] font-black text-slate-700 truncate block uppercase tracking-tight">{city.nome}</span>
                                                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
                                                        {/* Concluídos (verde) */}
                                                        <span className="text-[10px] font-black text-emerald-600 flex items-center gap-0.5" title="Concluídos">
                                                            ✓ {city.auditados}
                                                        </span>
                                                        <span className="text-slate-300 font-light text-xs">|</span>
                                                        {/* Pendentes (vermelho) */}
                                                        <span className="text-[10px] font-black text-red-600 flex items-center gap-0.5" title="Pendentes">
                                                            ⚠️ {city.pendentes}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}

                        {tab === 'queue' && (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100">
                                        <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Identificação do Cliente</th>
                                        <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Localização / Status</th>
                                        <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Telefone</th>
                                        <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Auditoria / Data</th>
                                        <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Inconsistências</th>
                                        <th className="px-8 py-5 text-right">Ação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {(() => {
                                        if (!queueData?.data || queueData.data.length === 0) return null;
                                        const getSeverityScore = (diffs: any) => {
                                            if (!diffs) return 0;
                                            let score = 0;
                                            const keys = Object.keys(diffs);
                                            if (keys.includes('telefone') || keys.includes('endereco')) score += 3;
                                            if (keys.includes('nome') || keys.includes('email')) score += 2;
                                            if (keys.includes('website') || keys.includes('instagram') || keys.includes('horarios')) score += 1;
                                            return score;
                                        };
                                        const sortedData = [...queueData.data].sort((a: any, b: any) => {
                                            return getSeverityScore(b.audit_differences) - getSeverityScore(a.audit_differences);
                                        });
                                        return sortedData.map((c: any, idx: number) => {
                                        const isExpanded = expandedClientId === c.id;
                                        return (
                                            <React.Fragment key={c.id}>
                                                <motion.tr
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    className={`group hover:bg-red-50/20 transition-all cursor-pointer ${isExpanded ? 'bg-red-50/10' : ''}`}
                                                    onClick={() => {
                                                        if (isExpanded) {
                                                            setExpandedClientId(null);
                                                            setInlineStatus({});
                                                            setEditingObservations('');
                                                        } else {
                                                            setExpandedClientId(c.id);
                                                            setEditingObservations(c.observacoes || '');
                                                            const diffs = c.audit_differences || {};
                                                            const initialStatus: Record<string, 'accepted' | 'rejected'> = {};
                                                            Object.keys(diffs).forEach(k => {
                                                                initialStatus[k] = 'pending';
                                                            });
                                                            setInlineStatus(initialStatus);
                                                        }
                                                    }}
                                                >
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="text-slate-400 group-hover:text-[#B70F0A] transition-colors shrink-0">
                                                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                            </div>
                                                            <div className="relative shrink-0">
                                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center overflow-hidden border border-white shadow-inner group-hover:shadow-md transition-all">
                                                                    {c.logo_url ? (
                                                                        <img src={c.logo_url} className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <Building2 className="text-slate-400 w-5 h-5" />
                                                                    )}
                                                                </div>
                                                                {c.tipo_cliente === 'pagante' && (
                                                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white shadow-sm flex items-center justify-center">
                                                                        <Zap className="w-2 h-2 text-white fill-current" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <span className="text-sm font-bold text-slate-800 group-hover:text-[#B70F0A] transition-colors flex items-center gap-2 line-clamp-1">
                                                                    {c.nome_fantasia}
                                                                    {(c.exibir_no_site === false || c.exibir_no_site === "false") && (
                                                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-50 text-red-700 border border-red-200 uppercase tracking-tighter">
                                                                            <EyeOff className="w-3 h-3" /> Oculto
                                                                        </span>
                                                                    )}
                                                                </span>
                                                                <span className="text-[11px] font-medium text-slate-500 line-clamp-1">
                                                                    {c.razao_social && c.razao_social !== c.nome_fantasia ? c.razao_social : (c.cpf_cnpj || 'Sem documento')}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="space-y-2">
                                                            {c.enderecos && c.enderecos.length > 0 ? (
                                                                c.enderecos.map((end: any, eIdx: number) => (
                                                                    <div key={eIdx} className="flex items-center gap-1.5 text-slate-600">
                                                                        <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                                                                        <span className="text-xs font-semibold">
                                                                            {end.cidade}
                                                                            {end.nome_unidade && (
                                                                                <span className="ml-1 text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                                                                                    ({end.nome_unidade})
                                                                                </span>
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <div className="flex items-center gap-1.5 text-slate-400 italic">
                                                                    <MapPin className="w-3.5 h-3.5" />
                                                                    <span className="text-xs">S/ Cidade</span>
                                                                </div>
                                                            )}
                                                            <div className="flex items-center gap-2">
                                                                <div className={`text-[10px] font-black px-2 py-0.5 rounded-full w-fit uppercase tracking-tighter ${c.tipo_cliente === 'pagante' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                                                                    {c.tipo_cliente}
                                                                </div>
                                                                {c.audit_status === 'ok' ? (
                                                                    <div className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 uppercase tracking-tighter flex items-center gap-1">
                                                                        <CheckCircle2 className="w-2.5 h-2.5" />
                                                                        IA Ok
                                                                    </div>
                                                                ) : c.audit_status === 'manual_review' ? (
                                                                    <div className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 uppercase tracking-tighter flex items-center gap-1">
                                                                        <Users className="w-2.5 h-2.5" />
                                                                        Revisão Manual
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
                                                            <span className="text-xs font-bold text-slate-700 whitespace-nowrap">
                                                                {formatPhone(c.contatos?.[0]?.telefone_principal)}
                                                            </span>
                                                            {c.contatos?.[0]?.celular && (
                                                                <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                                                                    {formatPhone(c.contatos[0].celular)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex flex-col gap-1.5">
                                                            <div className="flex items-center gap-2 text-slate-500">
                                                                <CalendarDays className="w-4 h-4" />
                                                                <span className="text-xs font-medium">
                                                                    {c.last_audit_at ? format(new Date(c.last_audit_at), 'dd/MM/yyyy • HH:mm') : (c.audit_status === 'ok' ? 'Migração / Legado' : 'Pendente')}
                                                                </span>
                                                            </div>
                                                            {c.last_auditor_name && (
                                                                <div className="flex items-center gap-2 text-slate-400 pl-[2px]" title="Responsável pela última conferência">
                                                                    <User className="w-3.5 h-3.5" />
                                                                    <span className="text-[10px] font-bold uppercase tracking-widest truncate max-w-[120px]">{c.last_auditor_name}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex gap-2 flex-wrap">
                                                            {Object.keys(c.audit_differences || {}).length > 0 ? (
                                                                Object.keys(c.audit_differences || {}).map((key) => (
                                                                    <span key={key} className="bg-red-50 text-[#B70F0A] text-[9px] font-black px-2 py-1 rounded-lg uppercase border border-red-100 shadow-sm flex items-center gap-1">
                                                                        <AlertCircle className="w-2.5 h-2.5" />
                                                                        {key === 'telefone' ? 'Telefone' : key === 'endereco' ? 'Endereço' : key === 'website' ? 'Site' : key === 'instagram' ? 'Instagram' : key}
                                                                    </span>
                                                                ))
                                                            ) : c.audit_status === 'manual_review' ? (
                                                                <span className="bg-purple-50 text-purple-700 text-[9px] font-black px-2 py-1 rounded-lg uppercase border border-purple-100 shadow-sm flex items-center gap-1">
                                                                    <Users className="w-2.5 h-2.5" />
                                                                    Sem dados na Web
                                                                </span>
                                                            ) : (
                                                                <span className="bg-emerald-50 text-emerald-700 text-[9px] font-black px-2 py-1 rounded-lg uppercase border border-emerald-100 shadow-sm flex items-center gap-1">
                                                                    <Check className="w-2.5 h-2.5" />
                                                                    Nenhuma
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-right" onClick={(e) => e.stopPropagation()}>
                                                        <div className="flex flex-col items-end gap-2">
                                                            {/* Resultado do force scan */}
                                                            {forceScanResult[c.id] && (
                                                                <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
                                                                    forceScanResult[c.id].status === 'no_changes' ? 'bg-emerald-50 text-emerald-700' :
                                                                    forceScanResult[c.id].status === 'pending_review' ? 'bg-amber-50 text-amber-700' :
                                                                    'bg-purple-50 text-purple-700'
                                                                }`}>
                                                                    {forceScanResult[c.id].message}
                                                                </span>
                                                            )}
                                                            <div className="flex items-center gap-2">
                                                                {/* Botão Forçar Conferência */}
                                                                <motion.button
                                                                    whileHover={{ scale: 1.05 }}
                                                                    whileTap={{ scale: 0.95 }}
                                                                    onClick={(e) => { e.stopPropagation(); forceScan(c.id); }}
                                                                    disabled={forcingScanId === c.id}
                                                                    title="Forçar nova conferência agora"
                                                                    className="px-3 py-2 rounded-xl text-[11px] font-bold border border-slate-200 bg-white text-slate-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-wait"
                                                                >
                                                                    {forcingScanId === c.id
                                                                        ? <><RefreshCw className="w-3 h-3 animate-spin" /> Auditando...</>
                                                                        : <><RefreshCw className="w-3 h-3" /> Forçar</>
                                                                    }
                                                                </motion.button>

                                                                {/* Botão principal */}
                                                                <motion.button
                                                                    whileHover={{ scale: 1.05 }}
                                                                    whileTap={{ scale: 0.95 }}
                                                                    onClick={() => navigate(`/auditoria/${c.id}`)}
                                                                    className={`px-5 py-2.5 rounded-2xl text-sm font-bold flex items-center gap-2 shadow-lg transition-all ${c.audit_status === 'ok' ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 shadow-slate-100' : 'bg-slate-900 text-white hover:bg-[#B70F0A] shadow-slate-200 hover:shadow-red-200'}`}
                                                                >
                                                                    {c.audit_status === 'ok' ? 'Revisar' : 'Analisar'}
                                                                    <ChevronRight className="w-4 h-4" />
                                                                </motion.button>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </motion.tr>

                                                {/* Painel Expansível Inline */}
                                                <AnimatePresence>
                                                    {isExpanded && (
                                                        <tr>
                                                            <td colSpan={6} className="bg-slate-50/50 p-6 border-b border-slate-100">
                                                                <motion.div
                                                                    initial={{ opacity: 0, height: 0 }}
                                                                    animate={{ opacity: 1, height: 'auto' }}
                                                                    exit={{ opacity: 0, height: 0 }}
                                                                    className="space-y-6 text-slate-700 bg-white p-6 rounded-3xl border border-slate-150 shadow-sm"
                                                                >
                                                                    {/* Seção 1: Ficha do Cliente (Informações Completas) */}
                                                                    {(() => {
                                                                        const mainAddress = c.enderecos?.[0] || {};
                                                                        const addressDisplay = mainAddress.rua 
                                                                            ? `${mainAddress.rua}, ${mainAddress.numero || 'S/N'}${mainAddress.complemento ? `, ${mainAddress.complemento}` : ''}${mainAddress.bairro ? `, ${mainAddress.bairro}` : ''}${mainAddress.cidade ? `, ${mainAddress.cidade}` : ''}${mainAddress.estado ? ` - ${mainAddress.estado}` : ''}`
                                                                            : 'Não informado';

                                                                        const telPrincipal = c.contatos?.[0]?.telefone_principal ? formatPhone(c.contatos[0].telefone_principal) : '';
                                                                        const celular = c.contatos?.[0]?.celular ? formatPhone(c.contatos[0].celular) : '';
                                                                        const telefoneDisplay = telPrincipal ? (celular ? `${telPrincipal} / ${celular}` : telPrincipal) : (celular || 'Não informado');

                                                                        const lastAuditDate = c.last_audit_at ? format(new Date(c.last_audit_at), 'dd/MM/yyyy') : null;
                                                                        const responsavel = c.responsavel || 'Sistema';
                                                                        const ultimaCorrecaoDisplay = lastAuditDate ? `${lastAuditDate} - Usuário: ${responsavel}` : 'Nenhuma correção anterior registrada';

                                                                        return (
                                                                            <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100/80 space-y-3.5 pb-6">
                                                                                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5 pb-2 border-b border-slate-100">
                                                                                    <FileText className="w-4 h-4 text-[#B70F0A]" /> Ficha Cadastral do Cliente
                                                                                </h4>
                                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                                                                                    <div className="flex items-start gap-2">
                                                                                        <span className="font-extrabold text-slate-500 whitespace-nowrap">Nome Fantasia:</span>
                                                                                        <span className="font-bold text-slate-800">{c.nome_fantasia || 'Não informado'}</span>
                                                                                    </div>
                                                                                    <div className="flex items-start gap-2">
                                                                                        <span className="font-extrabold text-slate-500 whitespace-nowrap">Razão Social:</span>
                                                                                        <span className="font-bold text-slate-800">{c.razao_social || 'Não informado'}</span>
                                                                                    </div>
                                                                                    {c.nome_alternativo && (
                                                                                        <div className="flex items-start gap-2 col-span-1 md:col-span-2">
                                                                                            <span className="font-extrabold text-slate-500 whitespace-nowrap">Nome Alternativo:</span>
                                                                                            <span className="font-bold text-slate-800">{c.nome_alternativo}</span>
                                                                                        </div>
                                                                                    )}
                                                                                    <div className="flex items-start gap-2">
                                                                                        <span className="font-extrabold text-slate-500 whitespace-nowrap">Telefone Principal:</span>
                                                                                        <span className="font-bold text-slate-800">{telefoneDisplay}</span>
                                                                                    </div>
                                                                                    <div className="flex items-start gap-2">
                                                                                        <span className="font-extrabold text-slate-500 whitespace-nowrap">E-mail:</span>
                                                                                        <span className="font-bold text-slate-800 truncate" title={c.contatos?.[0]?.email_principal}>{c.contatos?.[0]?.email_principal || 'Não informado'}</span>
                                                                                    </div>
                                                                                    <div className="flex items-start gap-2 col-span-1 md:col-span-2">
                                                                                        <span className="font-extrabold text-slate-500 whitespace-nowrap">Endereço:</span>
                                                                                        <span className="font-bold text-slate-800">{addressDisplay}</span>
                                                                                    </div>
                                                                                    <div className="flex flex-col gap-1.5 col-span-1 md:col-span-2">
                                                                                        <span className="font-extrabold text-slate-500 text-xs">Observações:</span>
                                                                                        <textarea
                                                                                            className="font-semibold text-xs text-slate-800 bg-white px-3 py-2 rounded-xl border border-slate-200 focus:border-[#B70F0A] focus:ring-1 focus:ring-[#B70F0A] w-full min-h-[60px] leading-relaxed resize-y outline-none transition-all shadow-sm"
                                                                                            placeholder="Adicione observações da conferência..."
                                                                                            value={editingObservations}
                                                                                            onChange={(e) => setEditingObservations(e.target.value)}
                                                                                            onClick={(e) => e.stopPropagation()}
                                                                                        />
                                                                                    </div>
                                                                                    <div className="flex items-start gap-2 col-span-1 md:col-span-2 pt-2 border-t border-slate-100/50">
                                                                                        <span className="font-extrabold text-slate-500 whitespace-nowrap">Última correção:</span>
                                                                                        <span className="font-bold text-slate-800">{ultimaCorrecaoDisplay}</span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })()}

                                                                    {/* Seção 2: Comparação de Divergências */}
                                                                    {Object.keys(c.audit_differences || {}).length > 0 ? (
                                                                        <div className="space-y-4">
                                                                            <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5"><Cpu className="w-4 h-4 text-[#B70F0A]" /> Divergências detectadas pela IA</h4>
                                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                                {Object.entries(c.audit_differences || {}).map(([key, diff]: [string, any]) => {
                                                                                    const label = key === 'telefone' ? 'Telefone' : key === 'endereco' ? 'Endereço' : key === 'website' ? 'Site' : key === 'instagram' ? 'Instagram' : key;
                                                                                    const currentVal = diff.current || 'Não informado';
                                                                                    const newVal = diff.new || 'Não encontrado';
                                                                                    const isFieldAccepted = inlineStatus[key] === 'accepted';
                                                                                    const isFieldRejected = inlineStatus[key] === 'rejected';

                                                                                    let diffUrl = '#';
                                                                                    if (newVal && newVal !== 'Não encontrado') {
                                                                                        if (diff.source === 'Receita Federal (CNPJ)') {
                                                                                            const cleanCnpj = c.cpf_cnpj ? c.cpf_cnpj.replace(/\D/g, '') : '';
                                                                                            diffUrl = cleanCnpj ? `https://cnpj.biz/${cleanCnpj}` : `https://www.google.com/search?q=${encodeURIComponent(c.nome_fantasia + ' CNPJ')}`;
                                                                                        } else if (key === 'telefone' || key === 'endereco' || key === 'nome') {
                                                                                            if (c.google_place_id) {
                                                                                                diffUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.nome_fantasia)}&query_place_id=${c.google_place_id}`;
                                                                                            } else {
                                                                                                const mainAddress = c.enderecos?.[0] || {};
                                                                                                const searchTerms = `${c.nome_fantasia} ${mainAddress.cidade || ''}`;
                                                                                                diffUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchTerms)}`;
                                                                                            }
                                                                                        } else if (key === 'instagram') {
                                                                                            const handle = newVal.replace('@', '').trim();
                                                                                            diffUrl = handle.startsWith('http') ? handle : `https://instagram.com/${handle}`;
                                                                                        } else if (key === 'email') {
                                                                                            diffUrl = `mailto:${newVal}`;
                                                                                        } else {
                                                                                            diffUrl = newVal.startsWith('http') ? newVal : `https://${newVal}`;
                                                                                        }
                                                                                    }

                                                                                    return (
                                                                                        <div key={key} className="border border-slate-100 rounded-3xl p-5 bg-slate-50/50 space-y-4">
                                                                                            <div className="flex justify-between items-center">
                                                                                                <span className="text-xs font-bold text-slate-700 uppercase tracking-tight">{label}</span>
                                                                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{diff.source || 'Google Places / Web'}</span>
                                                                                            </div>
                                                                                            <div className="grid grid-cols-2 gap-4">
                                                                                                {/* Sistema */}
                                                                                                <div className={`p-3.5 rounded-2xl border transition-all ${isFieldRejected ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-100 text-slate-700'}`}>
                                                                                                    <span className="text-[8px] font-black uppercase block text-slate-400 mb-1">No Sistema</span>
                                                                                                    <p className="text-xs font-bold truncate">{key === 'telefone' ? formatPhone(currentVal) : currentVal}</p>
                                                                                                </div>
                                                                                                {/* Encontrado na Web */}
                                                                                                <div className={`p-3.5 rounded-2xl border transition-all ${isFieldAccepted ? 'bg-[#B70F0A] border-[#B70F0A] text-white' : 'bg-white border-red-50 text-slate-800'}`}>
                                                                                                    <div className="flex items-center justify-between gap-2">
                                                                                                        <span className={`text-[8px] font-black uppercase block ${isFieldAccepted ? 'text-red-200' : 'text-[#B70F0A]'} mb-1`}>Na Web</span>
                                                                                                        {diff.new && diff.new !== 'Não encontrado' && (
                                                                                                            <a
                                                                                                                href={diffUrl}
                                                                                                                target="_blank"
                                                                                                                rel="noopener noreferrer"
                                                                                                                className={`p-1 rounded text-[9px] font-bold shrink-0 transition-all ${
                                                                                                                    isFieldAccepted 
                                                                                                                        ? 'bg-white/20 hover:bg-white/30 text-white' 
                                                                                                                        : 'bg-slate-100 hover:bg-slate-200 text-slate-500'
                                                                                                                }`}
                                                                                                                onClick={(e) => e.stopPropagation()}
                                                                                                            >
                                                                                                                <ExternalLink className="w-3 h-3" />
                                                                                                            </a>
                                                                                                        )}
                                                                                                    </div>
                                                                                                    <p className="text-xs font-bold truncate">{key === 'telefone' ? formatPhone(newVal) : newVal}</p>
                                                                                                </div>
                                                                                            </div>
                                                                                            {/* Decisão */}
                                                                                            <div className="flex gap-2">
                                                                                                <button
                                                                                                    type="button"
                                                                                                    onClick={(e) => { e.stopPropagation(); setInlineStatus(prev => ({ ...prev, [key]: 'rejected' })); }}
                                                                                                    className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isFieldRejected ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
                                                                                                >
                                                                                                    Manter Atual
                                                                                                </button>
                                                                                                <button
                                                                                                    type="button"
                                                                                                    onClick={(e) => { e.stopPropagation(); setInlineStatus(prev => ({ ...prev, [key]: 'accepted' })); }}
                                                                                                    className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isFieldAccepted ? 'bg-[#B70F0A] text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
                                                                                                >
                                                                                                    Usar dado da Web
                                                                                                </button>
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="py-4 px-6 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-2">
                                                                            <Check className="w-4 h-4" /> Nenhuma divergência detectada pela varredura da IA.
                                                                        </div>
                                                                    )}

                                                                    {/* Seção 3: Barra de Ações Rápidas */}
                                                                    <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                                                                        <div className="flex gap-3">
                                                                            {/* Se tiver divergências, habilita o salvar alterações com base na escolha */}
                                                                            {Object.keys(c.audit_differences || {}).length > 0 ? (
                                                                                <button
                                                                                    type="button"
                                                                                    disabled={updateClientMutation.isPending || Object.values(inlineStatus).includes('pending')}
                                                                                    onClick={(e) => { e.stopPropagation(); handleInlineSave(c); }}
                                                                                    className="bg-[#B70F0A] text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-red-100 hover:bg-red-700 transition-all disabled:opacity-40 flex items-center gap-1.5"
                                                                                >
                                                                                    <Save className="w-4 h-4" /> Publicar Alterações
                                                                                </button>
                                                                            ) : null}

                                                                            {/* Confirmar todos os dados atuais (botão azul legado) */}
                                                                            <button
                                                                                type="button"
                                                                                disabled={updateClientMutation.isPending}
                                                                                onClick={(e) => { e.stopPropagation(); confirmAllCurrent(c); }}
                                                                                className="bg-blue-600 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center gap-1.5"
                                                                            >
                                                                                <Check className="w-4 h-4" /> Confirmar dados atuais
                                                                            </button>

                                                                            {/* Marcar para Revisão Manual (botão roxo) */}
                                                                            <button
                                                                                type="button"
                                                                                disabled={updateClientMutation.isPending}
                                                                                onClick={(e) => { e.stopPropagation(); markManualReview(c); }}
                                                                                className="bg-purple-600 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-purple-100 hover:bg-purple-700 transition-all flex items-center gap-1.5"
                                                                            >
                                                                                <Users className="w-4 h-4" /> Revisão Manual
                                                                            </button>
                                                                        </div>

                                                                        <div className="flex gap-2">
                                                                            <a
                                                                                href={`/clientes/${c.id}/editar`}
                                                                                target="_blank"
                                                                                rel="noreferrer"
                                                                                onClick={(e) => e.stopPropagation()}
                                                                                className="bg-slate-900 text-white px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-1.5"
                                                                            >
                                                                                <ExternalLink className="w-4 h-4" /> Editar Cadastro
                                                                            </a>
                                                                        </div>
                                                                    </div>
                                                                </motion.div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </AnimatePresence>
                                            </React.Fragment>
                                        );
                                    });
                                    })()}
                                    {(!queueData?.data || queueData.data.length === 0) && (
                                        <tr>
                                            <td colSpan={6} className="py-32 text-center">
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
                        )}

                        {tab === 'history' && (
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Cronologia</th>
                                        <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Responsável</th>
                                        <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Cliente Conferido</th>
                                        <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Resultado</th>
                                        <th className="px-8 py-5 text-right">Visualizar</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {historyData?.data?.length > 0 ? historyData.data.map((log: any, idx: number) => (
                                        <HistoryRow key={log.id} log={log} idx={idx} navigate={navigate} />
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

                        {tab === 'cities' && (
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Cidade</th>
                                        <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Total Clientes</th>
                                        <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Auditados</th>
                                        <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Pendente</th>
                                        <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Cobertura</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {cityStats?.length > 0 ? cityStats.map((city: any, idx: number) => (
                                        <motion.tr
                                            key={city.id}
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="hover:bg-slate-50/50 transition-colors"
                                        >
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <MapPin className="w-4 h-4 text-red-400" />
                                                    <span className="text-sm font-bold text-slate-800 uppercase tracking-tight">{city.nome}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 font-bold text-slate-600">{city.total}</td>
                                            <td className="px-8 py-6">
                                                <span className="text-emerald-600 font-black">{city.auditados}</span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="text-amber-600 font-black">{city.pendentes}</span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex-1 h-2 bg-slate-100 rounded-full max-w-[100px] overflow-hidden">
                                                        <div 
                                                            className={`h-full rounded-full ${city.percentual >= 100 ? 'bg-emerald-500' : 'bg-[#B70F0A]'}`} 
                                                            style={{ width: `${city.percentual}%` }}
                                                        />
                                                    </div>
                                                    <span className={`text-xs font-black ${city.percentual >= 100 ? 'text-emerald-600' : 'text-slate-800'}`}>
                                                        {city.percentual}%
                                                    </span>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={5} className="py-32 text-center text-slate-300">
                                                Dados de cidades não disponíveis.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}

                        {/* Pagination Area */}
                        {tab !== 'cities' && (
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
                        )}
                    </motion.div>
                )}
            </div>

            {/* Modal: Como Funciona */}
            <AnimatePresence>
                {showHowItWorks && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowHowItWorks(false)}
                            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100]"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="fixed inset-x-4 top-[10%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-2xl bg-white rounded-[2.5rem] shadow-2xl z-[101] overflow-hidden border border-white"
                        >
                            {/* Modal Header */}
                            <div className="relative h-32 bg-[#B70F0A] flex items-center px-10">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                                <div className="relative z-10 flex items-center gap-4 text-white">
                                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                                        <Info className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-serif">Como funciona o Módulo?</h2>
                                        <p className="text-xs font-bold uppercase tracking-widest text-red-100 opacity-80">Guia de Governança e IA</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setShowHowItWorks(false)}
                                    className="absolute top-8 right-8 p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="p-10 space-y-8 overflow-y-auto max-h-[70vh]">
                                <p className="text-slate-600 leading-relaxed italic">
                                    O módulo de **Conferências (Auditoria)** é o "guardião" da integridade dos dados no sistema. 
                                    Ele utiliza IA para garantir que as informações dos clientes estejam sempre sincronizadas com o que existe de mais atual na internet.
                                </p>

                                <div className="space-y-6">
                                    {/* Passo 1 */}
                                    <div className="flex gap-6">
                                        <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center shrink-0 border border-red-100">
                                            <Globe className="w-6 h-6 text-[#B70F0A]" />
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-sm font-black uppercase text-slate-800 tracking-widest flex items-center gap-2">
                                                <span className="text-red-600">01.</span> Varredura Inteligente
                                            </h3>
                                            <p className="text-sm text-slate-500 leading-relaxed">
                                                O processo começa de duas formas:
                                                <br /><br />
                                                • **Varredura Noturna:** Um Job automático percorre a base periodicamente via APIs do Google e Redes Sociais.
                                                <br />
                                                • **Busca ao Vivo:** Ao acessar um cliente novo, a IA faz a busca em tempo real.
                                                <br /><br />
                                                Se houver divergência, o cliente é marcado como <span className="font-bold text-amber-600">PENDENTE</span> para revisão humana.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Passo 2 */}
                                    <div className="flex gap-6">
                                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0 border border-blue-100">
                                            <Target className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-sm font-black uppercase text-slate-800 tracking-widest flex items-center gap-2">
                                                <span className="text-blue-600">02.</span> Fila de Revisão (Triagem)
                                            </h3>
                                            <p className="text-sm text-slate-500 leading-relaxed">
                                                A aba "Fila de Revisão" prioriza os clientes seguindo regras de negócio:
                                                <br /><br />
                                                • **Inconsistências Detectadas** (Erros críticos de telefone/endereço).
                                                <br />
                                                • **Clientes Pagantes** (Sempre aparecem no topo da fila).
                                                <br />
                                                • **Validade de 180 dias** (Garantia de selo de qualidade periódica).
                                            </p>
                                        </div>
                                    </div>

                                    {/* Passo 3 */}
                                    <div className="flex gap-6">
                                        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center shrink-0 border border-emerald-100">
                                            <Cpu className="w-6 h-6 text-emerald-600" />
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-sm font-black uppercase text-slate-800 tracking-widest flex items-center gap-2">
                                                <span className="text-emerald-600">03.</span> O Match Perfeito
                                            </h3>
                                            <p className="text-sm text-slate-500 leading-relaxed">
                                                Ao entrar na análise, você verá o dado do sistema vs o dado da Web:
                                                <br /><br />
                                                • **Aceitar a IA:** Sobrescreve o cadastro com os dados validados na internet.
                                                <br />
                                                • **Manter o Sistema:** Preserva o dado interno caso ele seja o mais correto (ex: informação interna exclusiva).
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-8 bg-slate-50 flex justify-end">
                                <button 
                                    onClick={() => setShowHowItWorks(false)}
                                    className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-sm font-bold hover:bg-[#B70F0A] transition-all shadow-lg shadow-slate-200"
                                >
                                    Entendido
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AuditDashboardPage;
