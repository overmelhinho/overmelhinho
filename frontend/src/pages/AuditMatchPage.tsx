import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Check,
    X,
    Globe,
    Save,
    AlertCircle,
    Calendar,
    User,
    History,
    ArrowRight,
    Loader2,
    ExternalLink,
    ShieldCheck,
    Zap,
    MapPin,
    Phone,
    Instagram,
    MousePointer2,
    RefreshCw,
    Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLeadIntel } from '@/hooks/useLeadIntel';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AuditField {
    id: string;
    label: string;
    current: string;
    new: string;
    source: string;
    fieldPath: string;
    icon: React.ReactNode;
    url?: string;
    addressParts?: {
        rua?: string;
        numero?: string;
        bairro?: string;
        cidade?: string;
        estado?: string;
        cep?: string;
    };
    currentAddressParts?: {
        rua?: string;
        numero?: string;
        bairro?: string;
        cidade?: string;
        estado?: string;
        cep?: string;
        complemento?: string;
    };
}

const AuditMatchPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // 1. Busca Dados do Cliente no Banco
    const { data: client, isLoading: loadingClient, error: clientError } = useQuery({
        queryKey: ['cliente', id],
        queryFn: async () => {
            const response = await api.get(`/v1/clientes/${id}`);
            return response.data.data;
        },
        enabled: !!id
    });

    // 2. Busca Dados na Internet via IA (Fallback ou Refresh)
    const searchQuery = client ? (client.nome_fantasia || client.razao_social) : '';
    const hasExistingDiffs = client?.audit_differences && Object.keys(client.audit_differences).length > 0;

    const { data: intelData, isLoading: loadingIntel, refetch: refreshIntel } = useLeadIntel(
        searchQuery,
        !!client && !hasExistingDiffs // Só busca automático se NÃO tiver dados do script noturno
    );

    // 3. Busca Histórico de Auditoria (Logs)
    const { data: auditLogs, isLoading: loadingLogs } = useQuery({
        queryKey: ['audit-logs', id],
        queryFn: async () => {
            const response = await api.get(`/v1/clientes/${id}/historico`);
            return response.data.data;
        },
        enabled: !!id
    });

    // 4. Mapeamento de campos para comparação
    const [fields, setFields] = useState<AuditField[]>([]);
    type Status = 'pending' | 'accepted' | 'rejected';
    const [auditStatus, setAuditStatus] = useState<Record<string, Status>>({});

    useEffect(() => {
        if (client) {
            const mainContact = client.contatos?.[0] || {};
            const mainAddress = client.enderecos?.[0] || {};

            // Prioriza o que veio da varredura automática (audit_differences), 
            // se não tiver, usa o intelData (varredura ao vivo)
            const diffs = client.audit_differences || {};
            const sourceInfo = client.audit_differences ? 'Varredura Noturna' : 'Busca ao Vivo';

            const allFields: AuditField[] = [
                {
                    id: 'phone',
                    label: 'Telefone',
                    icon: <Phone className="w-4 h-4" />,
                    current: mainContact.telefone_principal || 'Não informado',
                    new: diffs.telefone?.new || (hasExistingDiffs ? (mainContact.telefone_principal || 'Não informado') : (intelData?.telefone || 'Não encontrado')),
                    source: diffs.telefone ? 'Google Places / Maps' : sourceInfo,
                    fieldPath: 'contatos.0.telefone_principal'
                },
                {
                    id: 'address',
                    label: 'Endereço',
                    icon: <MapPin className="w-4 h-4" />,
                    current: mainAddress.rua ? `${mainAddress.rua}, ${mainAddress.numero}` : 'Não informado',
                    new: diffs.endereco?.new || (hasExistingDiffs ? (mainAddress.rua ? `${mainAddress.rua}, ${mainAddress.numero}` : 'Não informado') : (intelData?.endereco || 'Não encontrado')),
                    source: diffs.endereco ? 'Base Digital Google' : sourceInfo,
                    fieldPath: 'endereco',
                    addressParts: diffs.endereco?.parts,
                    currentAddressParts: {
                        rua: mainAddress.rua,
                        numero: mainAddress.numero,
                        bairro: mainAddress.bairro,
                        cidade: mainAddress.cidade,
                        estado: mainAddress.estado,
                        cep: mainAddress.cep,
                        complemento: mainAddress.complemento,
                    }
                },
                {
                    id: 'website',
                    label: 'Website',
                    icon: <Globe className="w-4 h-4" />,
                    current: mainContact.site || 'Não informado',
                    new: diffs.website?.new || (hasExistingDiffs ? (mainContact.site || 'Não informado') : (intelData?.website || 'Não encontrado')),
                    source: diffs.website ? 'Domínio / DNS' : sourceInfo,
                    fieldPath: 'contatos.0.site',
                    url: diffs.website?.new || intelData?.website
                },
                {
                    id: 'instagram',
                    label: 'Instagram',
                    icon: <Instagram className="w-4 h-4" />,
                    current: client.redes_sociais?.find((r: any) => r.tipo === 'instagram')?.url || 'Não informado',
                    new: diffs.instagram?.new || (hasExistingDiffs ? (client.redes_sociais?.find((r: any) => r.tipo === 'instagram')?.url || 'Não informado') : (intelData?.instagram || 'Não encontrado')),
                    source: 'Instagram Oficial',
                    fieldPath: 'redes_sociais',
                    url: diffs.instagram?.new || intelData?.instagram
                }
            ];

            // Filtra apenas o que tem INCONSISTÊNCIA REAL
            const inconsistentFields = allFields.filter(f => {
                if (f.new === 'Não encontrado' || f.new === 'Não informado') return false;

                const clean = (val: string) => val.toLowerCase().replace(/[^\w\s]/gi, '').trim();
                return clean(f.current) !== clean(f.new);
            });

            setFields(inconsistentFields);

            // Mantém os status se já estiverem definidos, senão inicia como pending
            setAuditStatus(prev => {
                const next = { ...prev };
                inconsistentFields.forEach(f => {
                    if (!next[f.id]) next[f.id] = 'pending';
                });
                return next;
            });
        }
    }, [client, intelData]);

    // 5. Mutação para Salvar
    const saveMutation = useMutation({
        mutationFn: async (payload: any) => {
            return api.put(`/v1/clientes/${id}`, payload);
        },
        onSuccess: () => {
            toast.success('Cadastro atualizado e auditoria registrada!');
            queryClient.invalidateQueries({ queryKey: ['cliente', id] });
            queryClient.invalidateQueries({ queryKey: ['audit-logs', id] });
            queryClient.invalidateQueries({ queryKey: ['audit-queue'] });
            navigate('/auditoria');
        },
        onError: () => {
            toast.error('Erro ao salvar alterações.');
        }
    });

    const handleAction = (fieldId: string, action: Status) => {
        setAuditStatus(prev => ({ ...prev, [fieldId]: action }));
    };

    const handleSave = () => {
        const pendingCount = fields.filter(f => auditStatus[f.id] === 'pending' && f.new !== 'Não encontrado').length;
        if (pendingCount > 0) {
            toast.error(`Existem ${pendingCount} campos pendentes de revisão.`);
            return;
        }

        const payload: any = {
            nome_fantasia: client?.nome_fantasia,
            cpf_cnpj: client?.cpf_cnpj,
            contatos: [...(client?.contatos || [])],
            endereco: client?.enderecos?.[0] ? { ...client.enderecos[0] } : {},
            redes_sociais: [...(client?.redes_sociais || [])]
        };

        fields.forEach(f => {
            if (auditStatus[f.id] === 'accepted' && f.new !== 'Não encontrado') {
                if (f.id === 'phone') {
                    if (!payload.contatos[0]) payload.contatos[0] = {};
                    payload.contatos[0].telefone_principal = f.new;
                }
                if (f.id === 'website') {
                    if (!payload.contatos[0]) payload.contatos[0] = {};
                    payload.contatos[0].site = f.new;
                }
                if (f.id === 'address') {
                    // Usa os campos estruturados do Google Places se disponíveis
                    const diffs = client?.audit_differences || {};
                    const parts = diffs.endereco?.parts;
                    if (parts) {
                        payload.endereco = {
                            ...payload.endereco,
                            rua: parts.rua || payload.endereco.rua,
                            numero: parts.numero || payload.endereco.numero,
                            bairro: parts.bairro || payload.endereco.bairro,
                            cidade: parts.cidade || payload.endereco.cidade,
                            estado: parts.estado || payload.endereco.estado,
                            cep: parts.cep || payload.endereco.cep,
                            complemento: parts.complemento || payload.endereco.complemento,
                        };
                    } else {
                        // Fallback para clientes sem parts: usa o valor bruto somente na rua
                        payload.endereco.rua = f.new;
                    }
                }
                if (f.id === 'instagram') {
                    const idx = payload.redes_sociais.findIndex((r: any) => r.tipo === 'instagram');
                    if (idx >= 0) payload.redes_sociais[idx].url = f.new;
                    else payload.redes_sociais.push({ tipo: 'instagram', url: f.new });
                }
            }
        });

        payload.audit_status = 'ok';
        payload.last_audit_at = new Date().toISOString();
        payload.audit_differences = null;
        payload.audit_action = 'audit_save';

        saveMutation.mutate(payload);
    };

    if (loadingClient || (loadingIntel && !hasExistingDiffs)) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
                <Loader2 className="w-16 h-16 text-[#B70F0A] animate-spin" />
                <p className="font-serif text-2xl text-slate-400 italic">IA comparando dados da internet...</p>
            </div>
        );
    }

    if (clientError || !client) {
        return (
            <div className="p-12 text-center">
                <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
                <h2 className="text-2xl font-bold">Cliente não encontrado</h2>
                <button onClick={() => navigate('/auditoria')} className="mt-4 text-[#B70F0A] font-bold underline">Voltar para Dashboard</button>
            </div>
        );
    }

    const totals = Object.values(auditStatus).reduce(
        (acc, status) => {
            if (status === 'accepted') acc.accepted++;
            if (status === 'rejected') acc.rejected++;
            return acc;
        },
        { accepted: 0, rejected: 0 }
    );

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10 min-h-screen">
            {/* Background Decoration */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-50/50 rounded-full blur-[120px] opacity-60" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-slate-100/50 rounded-full blur-[100px] opacity-40" />
            </div>

            {/* Header Section */}
            <header className="flex flex-col md:flex-row md:items-start justify-between gap-8 pb-4 border-b border-slate-100">
                <div className="space-y-3">
                    <button
                        onClick={() => navigate('/auditoria')}
                        className="text-xs font-bold text-slate-400 hover:text-[#B70F0A] transition-colors flex items-center gap-2 uppercase tracking-widest"
                    >
                        <ArrowRight className="w-3 h-3 rotate-180" /> Voltar ao Dashboard
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-600 rounded-2xl shadow-lg shadow-red-100">
                            <ShieldCheck className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-serif text-slate-800 tracking-tight">
                                Auditoria de <span className="text-[#B70F0A]">Dados</span>
                            </h1>
                            <p className="text-slate-500 font-medium">Resolvendo divergências para <span className="text-slate-900 font-bold">{client?.nome_fantasia}</span></p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="bg-white/70 backdrop-blur-md px-6 py-4 rounded-3xl border border-white shadow-sm flex items-center gap-4 min-w-[240px]">
                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                            <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest block">Governança</span>
                            <span className="text-sm font-bold text-slate-700">
                                {client?.last_audit_at ? format(new Date(client.last_audit_at), "dd 'de' MMMM", { locale: ptBR }) : 'Nunca auditado'}
                            </span>
                        </div>
                    </div>
                    <a
                        href={`/clientes/${id}/editar`}
                        target="_blank"
                        className="bg-slate-900 text-white px-6 py-4 rounded-3xl font-bold text-sm flex items-center gap-3 shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95"
                    >
                        <ExternalLink className="w-4 h-4" />
                        Editar Cadastro
                    </a>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Main Content Area */}
                <div className="lg:col-span-8 space-y-8">

                    {/* IA Logic Info */}
                    <div className="bg-gradient-to-r from-[#B70F0A]/5 to-transparent p-6 rounded-[2rem] border border-red-100 flex items-center gap-6">
                        <div className="relative">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#B70F0A] shadow-sm">
                                <Zap className="w-6 h-6 fill-current" />
                            </div>
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-sm font-bold text-[#B70F0A] uppercase tracking-wider mb-1">IA Operacional Ativa</h4>
                            <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                Comparamos os dados do seu banco com os registros mais recentes do Google Places e Redes Sociais.
                                Escolha os dados corretos para manter a integridade do sistema.
                            </p>
                        </div>
                        <button
                            onClick={() => refreshIntel()}
                            className="bg-white p-3 rounded-2xl border border-slate-100 text-slate-400 hover:text-[#B70F0A] hover:border-red-100 transition-all shadow-sm"
                            title="Refazer varredura agora"
                        >
                            <RefreshCw className={`w-5 h-5 ${loadingIntel ? 'animate-spin text-[#B70F0A]' : ''}`} />
                        </button>
                    </div>

                    {/* Comparison Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                        {fields.length > 0 ? fields.map((field, idx) => (
                            <motion.div
                                key={field.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-1 overflow-hidden group"
                            >
                                <div className="p-7 space-y-6">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3 px-3 py-1.5 bg-slate-50 rounded-xl">
                                            <span className="text-[#B70F0A]">{field.icon}</span>
                                            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{field.label}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-300 uppercase">
                                            <Globe className="w-3 h-3" />
                                            {field.source}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {/* Current Value */}
                                        <div
                                            className={`w-full p-5 rounded-3xl border transition-all relative ${auditStatus[field.id] === 'rejected' ? 'bg-slate-900 border-slate-900 shadow-lg' : 'bg-slate-50 border-slate-100'}`}
                                        >
                                            <span className="text-[9px] font-black uppercase block mb-2 text-slate-400">No Sistema</span>
                                            {field.id === 'address' && field.currentAddressParts ? (
                                                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-3">
                                                    {[['Rua', field.currentAddressParts.rua], ['Número', field.currentAddressParts.numero], ['Bairro', field.currentAddressParts.bairro], ['Cidade', field.currentAddressParts.cidade], ['Estado', field.currentAddressParts.estado], ['CEP', field.currentAddressParts.cep]].map(([label, val]) => val ? (
                                                        <div key={label}>
                                                            <span className={`text-[8px] font-black uppercase block ${auditStatus[field.id] === 'rejected' ? 'text-slate-500' : 'text-slate-400'}`}>{label}</span>
                                                            <p className={`text-xs font-bold truncate ${auditStatus[field.id] === 'rejected' ? 'text-white' : 'text-slate-700'}`}>{val}</p>
                                                        </div>
                                                    ) : null)}
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-between gap-3 mb-3">
                                                    <p className={`text-sm font-bold truncate ${auditStatus[field.id] === 'rejected' ? 'text-white' : 'text-slate-700'}`}>{field.current}</p>
                                                </div>
                                            )}
                                            {auditStatus[field.id] === 'rejected' && <Check className="absolute top-5 right-5 w-5 h-5 text-emerald-400" />}
                                            <button
                                                onClick={() => handleAction(field.id, 'rejected')}
                                                className={`w-full py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${auditStatus[field.id] === 'rejected' ? 'bg-white/10 text-white' : 'bg-white text-slate-400 border border-slate-200 hover:text-slate-900'}`}
                                            >
                                                Manter dado atual
                                            </button>
                                        </div>

                                        {/* New Value */}
                                        <div
                                            className={`w-full p-5 rounded-3xl border transition-all relative ${auditStatus[field.id] === 'accepted' ? 'bg-red-600 border-red-600 shadow-xl shadow-red-100' : 'bg-white border-red-50'}`}
                                        >
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`text-[9px] font-black uppercase tracking-tighter ${auditStatus[field.id] === 'accepted' ? 'text-red-200' : 'text-[#B70F0A]'}`}>Encontrado na Web</span>
                                                <Sparkles className={`w-3 h-3 ${auditStatus[field.id] === 'accepted' ? 'text-white' : 'text-[#B70F0A]'}`} />
                                            </div>
                                            {field.id === 'address' && field.addressParts ? (
                                                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-3">
                                                    {[['Rua', field.addressParts.rua], ['Número', field.addressParts.numero], ['Bairro', field.addressParts.bairro], ['Cidade', field.addressParts.cidade], ['Estado', field.addressParts.estado], ['CEP', field.addressParts.cep]].map(([label, val]) => val ? (
                                                        <div key={label}>
                                                            <span className={`text-[8px] font-black uppercase block ${auditStatus[field.id] === 'accepted' ? 'text-red-200' : 'text-slate-400'}`}>{label}</span>
                                                            <p className={`text-xs font-black italic ${auditStatus[field.id] === 'accepted' ? 'text-white' : 'text-slate-800'}`}>{val}</p>
                                                        </div>
                                                    ) : null)}
                                                </div>
                                            ) : field.id === 'address' ? (
                                                // Fallback: endereço sem parts estruturado — exibe sem truncar
                                                <div className="mb-3">
                                                    <p className={`text-xs font-black italic leading-relaxed break-words ${auditStatus[field.id] === 'accepted' ? 'text-white' : 'text-slate-800'}`}>{field.new}</p>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 overflow-hidden mb-3">
                                                    <p className={`text-sm font-black italic truncate ${auditStatus[field.id] === 'accepted' ? 'text-white' : 'text-slate-800'}`}>{field.new}</p>
                                                    {field.url && (
                                                        <a
                                                            href={field.url.startsWith('http') ? field.url : `https://${field.url}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className={`p-1.5 rounded-lg transition-all ${auditStatus[field.id] === 'accepted' ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-red-50 text-[#B70F0A] hover:bg-red-100'}`}
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <ExternalLink className="w-3.5 h-3.5" />
                                                        </a>
                                                    )}
                                                </div>
                                            )}
                                            {auditStatus[field.id] === 'accepted' && <Check className="absolute top-5 right-5 w-5 h-5 text-white" />}
                                            <button
                                                onClick={() => handleAction(field.id, 'accepted')}
                                                className={`w-full py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${auditStatus[field.id] === 'accepted' ? 'bg-white/20 text-white' : 'bg-[#B70F0A] text-white shadow-lg shadow-red-100 hover:scale-[1.02]'}`}
                                            >
                                                Atualizar Cadastro
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="h-1 w-full bg-slate-50 flex">
                                    <div className={`h-full transition-all duration-500 ${auditStatus[field.id] === 'accepted' ? 'w-full bg-red-600' : auditStatus[field.id] === 'rejected' ? 'w-full bg-slate-900' : 'w-0'}`} />
                                </div>
                            </motion.div>
                        )) : (
                            <div className="col-span-full py-20 bg-emerald-50/30 rounded-[3rem] border-2 border-dashed border-emerald-100 flex flex-col items-center gap-6 text-center">
                                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-emerald-500 shadow-xl shadow-emerald-100">
                                    <ShieldCheck className="w-10 h-10" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-serif text-emerald-800 italic">Integridade Total</h3>
                                    <p className="text-emerald-600/70 font-medium max-w-sm">
                                        Nenhuma divergência foi encontrada pela IA. Todos os dados do sistema estão sincronizados com a Web.
                                    </p>
                                </div>
                                <button
                                    onClick={handleSave}
                                    className="bg-emerald-600 text-white px-8 py-4 rounded-3xl font-bold text-sm shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center gap-3"
                                >
                                    Confirmar Validação 100%
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar area */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Status Card */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-8 space-y-6 sticky top-10">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <h3 className="text-xl font-serif text-slate-800">Status da Revisão</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                                <span className="text-sm font-bold text-slate-500 lowercase">Aceitos da IA</span>
                                <span className="text-xl font-black text-slate-800">{totals.accepted}</span>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                                <span className="text-sm font-bold text-slate-500 lowercase">Mantidos sistema</span>
                                <span className="text-xl font-black text-slate-800">{totals.rejected}</span>
                            </div>
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={saveMutation.isPending}
                            className="w-full bg-[#B70F0A] text-white py-5 rounded-3xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-red-200 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {saveMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            Publicar Alterações
                        </button>

                        <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-tighter">Ao publicar, o status de auditoria será renovado por 180 dias.</p>

                        <div className="pt-6 border-t border-slate-100">
                            <div className="flex items-center gap-2 mb-4">
                                <History className="w-4 h-4 text-slate-300" />
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Atividade Recente</span>
                            </div>
                            <div className="space-y-4">
                                {loadingLogs ? (
                                    <div className="animate-pulse space-y-3">
                                        <div className="h-4 bg-slate-50 rounded w-3/4" />
                                        <div className="h-4 bg-slate-50 rounded w-1/2" />
                                    </div>
                                ) : auditLogs?.slice(0, 3).map((log: any) => (
                                    <div key={log.id} className="flex items-start gap-3">
                                        <div className="w-2 h-2 rounded-full bg-slate-200 mt-1.5" />
                                        <div>
                                            <p className="text-xs font-bold text-slate-600">{log.action === 'audit_save' ? 'Auditoria Concluída' : 'Dados Atualizados'}</p>
                                            <p className="text-[10px] text-slate-400 font-medium">Por {log.actor?.name || 'Sistema'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuditMatchPage;
