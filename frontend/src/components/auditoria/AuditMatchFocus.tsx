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
    Sparkles,
    Users,
    Search,
    FileText
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

export interface AuditMatchFocusProps {
    clienteId: string | number;
    onNext: () => void;
    onClose: () => void;
    progress?: string;
}

const formatPhone = (phone: string | null | undefined) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
        return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 7)}-${cleaned.substring(7)}`;
    } else if (cleaned.length === 10) {
        return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 6)}-${cleaned.substring(6)}`;
    }
    return phone;
};

const AuditMatchFocus: React.FC<AuditMatchFocusProps> = ({ clienteId, onNext, onClose, progress }) => {
    const id = clienteId.toString();
    const queryClient = useQueryClient();

    // 1. Busca Dados do Cliente no Banco
    const { data: client, isLoading: loadingClient, error: clientError, isFetching: fetchingClient } = useQuery({
        queryKey: ['cliente', id],
        queryFn: async () => {
            const response = await api.get(`/v1/clientes/${id}`);
            return response.data.data;
        },
        enabled: !!id,
        refetchOnWindowFocus: true,
        staleTime: 0
    });

    // 2. Busca Dados na Internet via IA (Fallback ou Refresh)
    const searchQuery = client ? (client.nome_fantasia || client.razao_social) : '';
    const clientCity = client?.enderecos?.[0]?.cidade || '';
    const clientCnpj = client?.cpf_cnpj || '';
    const hasExistingDiffs = client?.audit_differences && Object.keys(client.audit_differences).length > 0;

    const { data: intelData, isLoading: loadingIntel, refetch: refreshIntel } = useLeadIntel(
        searchQuery,
        clientCity,
        clientCnpj,
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
    const [allFieldsForTable, setAllFieldsForTable] = useState<AuditField[]>([]);
    type Status = 'pending' | 'accepted' | 'rejected';
    const [auditStatus, setAuditStatus] = useState<Record<string, Status>>({});
    const [showSyncBadge, setShowSyncBadge] = useState(false);

    useEffect(() => {
        if (fetchingClient && !loadingClient) {
            setShowSyncBadge(true);
        }
    }, [fetchingClient, loadingClient]);

    useEffect(() => {
        if (showSyncBadge) {
            const timer = setTimeout(() => setShowSyncBadge(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [showSyncBadge]);

    const [observacoes, setObservacoes] = useState('');

    useEffect(() => {
        if (client) {
            setObservacoes(client.observacoes || '');
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
                    current: formatPhone(mainContact.telefone_principal) || 'Não informado',
                    new: formatPhone(diffs.telefone?.new) || (hasExistingDiffs ? formatPhone(mainContact.telefone_principal) || 'Não informado' : formatPhone(intelData?.telefone) || 'Não encontrado'),
                    source: diffs.telefone ? 'Google Places / Maps' : sourceInfo,
                    fieldPath: 'contatos.0.telefone_principal',
                    url: diffs.telefone?.url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(client?.nome_fantasia + ' ' + (mainAddress.cidade || ''))}`
                },
                {
                    id: 'address',
                    label: 'Endereço',
                    icon: <MapPin className="w-4 h-4" />,
                    current: mainAddress.rua ? `${mainAddress.rua}, ${mainAddress.numero}${client.enderecos?.length > 1 ? ` (+${client.enderecos.length - 1} unidades)` : ''}` : 'Não informado',
                    new: diffs.endereco?.new || (hasExistingDiffs ? (mainAddress.rua ? `${mainAddress.rua}, ${mainAddress.numero}` : 'Não informado') : (intelData?.endereco || 'Não encontrado')),
                    source: diffs.endereco ? 'Base Digital Google' : sourceInfo,
                    fieldPath: 'endereco',
                    url: diffs.endereco?.url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(client?.nome_fantasia + ' ' + (mainAddress.cidade || ''))}`,

                    addressParts: diffs.endereco?.parts,
                    currentAddressParts: {
                        rua: mainAddress.rua,
                        numero: mainAddress.numero,
                        bairro: mainAddress.bairro,
                        cidade: mainAddress.cidade,
                        estado: mainAddress.estado,
                        cep: mainAddress.cep,
                        complemento: mainAddress.complemento,
                    },
                    extraInfo: client.enderecos?.length > 1 ? `${client.enderecos.length} endereços cadastrados. A IA confere preferencialmente a Matriz.` : undefined
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

            // Filtra apenas o que tem INCONSISTÊNCIAS NCIA REAL
            const inconsistentFields = allFields.filter(f => {
                if (f.new === 'Não encontrado' || f.new === 'Não informado') return false;

                const clean = (val: string) => val.toLowerCase().replace(/[^\w\s]/gi, '').trim();
                return clean(f.current) !== clean(f.new);
            });

            setFields(inconsistentFields);
            setAllFieldsForTable(allFields);

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
            toast.success('Cadastro atualizado e conferência registrada!');
            queryClient.invalidateQueries({ queryKey: ['cliente', id] });
            queryClient.invalidateQueries({ queryKey: ['audit-logs', id] });
            queryClient.invalidateQueries({ queryKey: ['audit-queue'] });
            onNext();
        },
        onError: () => {
            toast.error('Erro ao salvar alterações.');
        }
    });

    const handleAction = (fieldId: string, action: Status) => {
        setAuditStatus(prev => ({ ...prev, [fieldId]: action }));
    };

    // Detecta se a IA encontrou o cliente na internet
    const wasClientFound = (() => {
        if (!client) return false;
        const intel = intelData || {};
        const diffs = client.audit_differences || {};
        // Se veio do script noturno, o cliente foi encontrado se tem audit_differences com algum campo
        if (hasExistingDiffs) return true;
        // Se veio da busca ao vivo, verifica se algum campo retornou dado útil
        return !!(intel.telefone || intel.endereco || intel.website || intel.instagram || intel.google_place_id);
    })();

    const handleSave = (overrideStatus?: string) => {

        const payload: any = {
            nome_fantasia: client?.nome_fantasia,
            cpf_cnpj: client?.cpf_cnpj,
            contatos: [...(client?.contatos || [])],
            enderecos: [...(client?.enderecos || [])],
            redes_sociais: [...(client?.redes_sociais || [])],
            exibir_no_site: client?.exibir_no_site,
            exibir_data_fundacao: client?.exibir_data_fundacao,
            observacoes: observacoes,
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
                    
                    // Garante que temos um objeto de endereço para a matriz (índice 0)
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
                        // Fallback para clientes sem parts: usa o valor bruto somente na rua
                        payload.enderecos[0].rua = f.new;
                    }
                }
                if (f.id === 'instagram') {
                    const idx = payload.redes_sociais.findIndex((r: any) => r.tipo === 'instagram');
                    if (idx >= 0) payload.redes_sociais[idx].url = f.new;
                    else payload.redes_sociais.push({ tipo: 'instagram', url: f.new });
                }
            }
        });

        payload.audit_status = overrideStatus || 'ok';
        payload.last_audit_at = new Date().toISOString();
        payload.audit_differences = null;
        payload.audit_action = 'audit_save';

        saveMutation.mutate(payload);
    };

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore se estiver digitando em algum input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            switch (e.key) {
                case 'ArrowRight':
                    e.preventDefault();
                    fields.forEach(f => handleAction(f.id, 'accepted'));
                    toast.success('Todas as sugestões da Web selecionadas!', { icon: 'Ã°Å¸â€˜Â', id: 'kb-right' });
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    fields.forEach(f => handleAction(f.id, 'rejected'));
                    toast.success('Mantendo todos os dados do Vermelhinho!', { icon: 'Ã°Å¸â€ºÂ¡Ã¯Â¸Â', id: 'kb-left' });
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    onNext();
                    break;
                case 'Enter':
                    e.preventDefault();
                    handleSave();
                    break;
                case 'Escape':
                    e.preventDefault();
                    onClose();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [fields, auditStatus, client, intelData]);

    const allDecided = fields.every(f => auditStatus[f.id] !== 'pending');

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
            <div className="p-12 text-center min-h-[60vh] flex flex-col items-center justify-center bg-slate-50 absolute inset-0 z-[9999]">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">Erro ao carregar</h3>
                <p className="text-slate-400 mb-6">Não foi possível carregar os dados deste cliente.</p>
                <button onClick={onClose} className="px-6 py-2 bg-slate-800 text-slate-900 rounded-lg hover:bg-slate-700">
                    Sair do Modo Foco
                </button>
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
        <div className="min-h-screen bg-slate-50 pb-32 animate-in fade-in duration-500 absolute inset-0 z-[9999] overflow-y-auto">
            {/* FOCUS HEADER */}
            <div className="sticky top-0 z-50 bg-slate-50/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-2xl">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={onClose}
                        className="p-2 bg-white/5 hover:bg-slate-200 text-slate-900 rounded-xl transition-colors"
                        title="Sair do Modo Foco (Esc)"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <div>
                        <h2 className="text-slate-900 font-black text-lg flex items-center gap-2">
                            <Sparkles className="text-brand-red w-5 h-5" />
                            Modo Foco
                        </h2>
                        {progress && <p className="text-slate-400 text-xs font-bold">{progress}</p>}
                    </div>
                </div>
                
                <div className="flex items-center gap-6">
                    <div className="hidden md:flex items-center gap-4 text-xs font-bold text-slate-500">
                        <button
                            onClick={() => refreshIntel()}
                            className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-brand-red hover:border-red-200 transition-all shadow-sm flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest mr-4"
                            title="Refazer varredura agora"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${loadingIntel ? "animate-spin text-brand-red" : ""}`} />
                            Refazer Varredura IA
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10">
                {/* Header Info - Client Details (Dark Mode Adapted) */}
                <header className="flex flex-col md:flex-row md:items-start justify-between gap-8 pb-4 border-b border-white/5">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-brand-red/20 rounded-2xl shadow-lg shadow-red-900/20">
                            <ShieldCheck className="w-7 h-7 text-brand-red" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-serif text-slate-900 tracking-tight">
                                Conferência de <span className="text-brand-red">Dados</span>
                            </h1>
                            <p className="text-slate-400 font-medium">Resolvendo divergências para <span className="text-slate-900 font-bold">{client?.nome_fantasia}</span></p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="bg-white/5 backdrop-blur-md px-6 py-4 rounded-3xl border border-slate-200 flex items-center gap-4 min-w-[240px]">
                            <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-400">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Auditado em</span>
                                <span className="text-sm font-bold text-slate-600">
                                    {client?.last_audit_at ? format(new Date(client.last_audit_at), "dd 'de' MMMM", { locale: ptBR }) : 'Nunca conferido'}
                                </span>
                            </div>
                        </div>
                        <a
                            href={`/clientes/${id}/editar`}
                            target="_blank"
                            className="bg-white text-slate-900 px-6 py-4 rounded-3xl font-bold text-sm flex items-center gap-3 shadow-xl hover:bg-slate-200 transition-all active:scale-95"
                        >
                            <ExternalLink className="w-4 h-4" />
                            Editar
                        </a>
                    </div>
                </header>


            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Main Content Area */}
                <div className="lg:col-span-8 space-y-8">

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
                                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-600 uppercase">
                                            <Globe className="w-3 h-3" />
                                            {field.source}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {field.extraInfo && (
                                            <div className="px-4 py-2 bg-amber-50 rounded-xl border border-amber-100 flex items-center gap-2">
                                                <AlertCircle size={14} className="text-amber-600 shrink-0" />
                                                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-tighter">{field.extraInfo}</span>
                                            </div>
                                        )}
                                        {/* Current Value */}
                                        <div
                                            className={`w-full p-5 rounded-3xl border transition-all relative ${auditStatus[field.id] === 'rejected' ? 'bg-slate-50 border-slate-900 shadow-lg' : 'bg-slate-50 border-slate-100'}`}
                                        >
                                            <span className="text-[9px] font-black uppercase block mb-2 text-slate-400">No Sistema</span>
                                            {field.id === 'address' && field.currentAddressParts ? (
                                                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-3">
                                                    {[['Rua', field.currentAddressParts.rua], ['Número', field.currentAddressParts.numero], ['Bairro', field.currentAddressParts.bairro], ['Cidade', field.currentAddressParts.cidade], ['Estado', field.currentAddressParts.estado], ['CEP', field.currentAddressParts.cep]].map(([label, val]) => val ? (
                                                        <div key={label}>
                                                            <span className={`text-[8px] font-black uppercase block ${auditStatus[field.id] === 'rejected' ? 'text-slate-500' : 'text-slate-400'}`}>{label}</span>
                                                            <p className={`text-xs font-bold truncate ${auditStatus[field.id] === 'rejected' ? 'text-slate-900' : 'text-slate-700'}`}>{val}</p>
                                                        </div>
                                                    ) : null)}
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-between gap-3 mb-3">
                                                    <p className={`text-sm font-bold truncate ${auditStatus[field.id] === 'rejected' ? 'text-slate-900' : 'text-slate-700'}`}>{field.current}</p>
                                                </div>
                                            )}
                                            {auditStatus[field.id] === 'rejected' && <Check className="absolute top-5 right-5 w-5 h-5 text-emerald-400" />}
                                            <button
                                                onClick={() => handleAction(field.id, 'rejected')}
                                                className={`w-full py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${auditStatus[field.id] === 'rejected' ? 'bg-slate-200 text-slate-900' : 'bg-white text-slate-400 border border-slate-200 hover:text-slate-900'}`}
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
                                                <Sparkles className={`w-3 h-3 ${auditStatus[field.id] === 'accepted' ? 'text-slate-900' : 'text-[#B70F0A]'}`} />
                                            </div>
                                            {field.id === 'address' && field.addressParts ? (
                                                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-3">
                                                    {[['Rua', field.addressParts.rua], ['Número', field.addressParts.numero], ['Bairro', field.addressParts.bairro], ['Cidade', field.addressParts.cidade], ['Estado', field.addressParts.estado], ['CEP', field.addressParts.cep]].map(([label, val]) => val ? (
                                                        <div key={label}>
                                                            <span className={`text-[8px] font-black uppercase block ${auditStatus[field.id] === 'accepted' ? 'text-red-200' : 'text-slate-400'}`}>{label}</span>
                                                            <p className={`text-xs font-black italic ${auditStatus[field.id] === 'accepted' ? 'text-slate-900' : 'text-slate-800'}`}>{val}</p>
                                                        </div>
                                                    ) : null)}
                                                </div>
                                            ) : field.id === 'address' ? (
                                                // Fallback: endereço sem parts estruturado â€” exibe sem truncar
                                                <div className="mb-3">
                                                    <p className={`text-xs font-black italic leading-relaxed break-words ${auditStatus[field.id] === 'accepted' ? 'text-slate-900' : 'text-slate-800'}`}>{field.new}</p>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 overflow-hidden mb-3">
                                                    <p className={`text-sm font-black italic truncate ${auditStatus[field.id] === 'accepted' ? 'text-slate-900' : 'text-slate-800'}`}>{field.new}</p>
                                                    {field.url && (
                                                        <a
                                                            href={field.url.startsWith('http') ? field.url : `https://${field.url}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className={`p-1.5 rounded-lg transition-all ${auditStatus[field.id] === 'accepted' ? 'bg-slate-200 text-slate-900 hover:bg-slate-300' : 'bg-red-50 text-[#B70F0A] hover:bg-red-100'}`}
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
                                                className={`w-full py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${auditStatus[field.id] === 'accepted' ? 'bg-slate-200 text-slate-900' : 'bg-[#B70F0A] text-white shadow-lg shadow-red-100 hover:scale-[1.02]'}`}
                                            >
                                                Atualizar Cadastro
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="h-1 w-full bg-slate-50 flex">
                                    <div className={`h-full transition-all duration-500 ${auditStatus[field.id] === 'accepted' ? 'w-full bg-red-600' : auditStatus[field.id] === 'rejected' ? 'w-full bg-slate-50' : 'w-0'}`} />
                                </div>
                            </motion.div>
                        )) : !wasClientFound ? (
                            <div className="col-span-full py-16 bg-purple-50/30 rounded-[3rem] border-2 border-dashed border-purple-200 flex flex-col items-center gap-6 text-center px-6">
                                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-purple-600 shadow-xl shadow-purple-100">
                                    <AlertCircle className="w-10 h-10" />
                                </div>
                                <div className="space-y-2 max-w-lg">
                                    <h3 className="text-2xl font-serif text-purple-900 italic">Dados Não Encontrados</h3>
                                    <p className="text-purple-700/70 font-medium text-sm leading-relaxed">
                                        A IA realizou buscas em tempo real, mas não localizou registros ativos ou confiáveis no Google Places, redes sociais ou domínios da internet para a empresa <span className="font-bold text-purple-900">{client?.nome_fantasia || client?.razao_social}</span>.
                                    </p>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest pt-2">
                                        Este cliente necessita de conferência e preenchimento manual.
                                    </p>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-4 mt-2">
                                    <button
                                        onClick={() => handleSave('manual_review')}
                                        className="bg-purple-600 text-white px-8 py-4 rounded-3xl font-bold text-sm shadow-lg shadow-purple-100 hover:bg-purple-700 transition-all flex items-center gap-3 active:scale-95"
                                    >
                                        <Users className="w-4 h-4" />
                                        Marcar para Revisão Manual
                                    </button>
                                    <a
                                        href={`/clientes/${id}/editar`}
                                        target="_blank"
                                        className="bg-slate-900 text-white px-8 py-4 rounded-3xl font-bold text-sm shadow-lg shadow-slate-100 hover:bg-slate-800 transition-all flex items-center gap-3 active:scale-95"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        Editar Cadastro Manualmente
                                    </a>
                                </div>
                            </div>
                        ) : (
                            <div className="col-span-full space-y-8">
                                <div className="py-12 bg-emerald-50/20 rounded-[3rem] border border-emerald-100 flex flex-col items-center gap-4 text-center px-6 shadow-sm">
                                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-emerald-500 shadow-lg shadow-emerald-100">
                                        <ShieldCheck className="w-8 h-8" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-2xl font-serif text-emerald-800 italic">Integridade Total</h3>
                                        <p className="text-emerald-600/70 font-medium text-sm max-w-md">
                                            Nenhuma divergência foi encontrada pela IA. Todos os dados do sistema estão 100% sincronizados com a Web.
                                        </p>
                                    </div>
                                </div>

                                {/* Tabela comparativa */}
                                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
                                    <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                        <div>
                                            <h4 className="text-lg font-serif text-slate-800">Tabela de Conferência da IA</h4>
                                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">Comparação dos campos analisados ao vivo</p>
                                        </div>
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-black uppercase tracking-wider border border-emerald-100">
                                            <Check className="w-3.5 h-3.5" />
                                            100% Sincronizado
                                        </div>
                                    </div>
                                    
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/20">
                                                    <th className="py-5 px-8">Campo</th>
                                                    <th className="py-5 px-8">No Sistema</th>
                                                    <th className="py-5 px-8">Encontrado na Web</th>
                                                    <th className="py-5 px-8 text-center">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {allFieldsForTable.map((field) => (
                                                    <tr key={field.id} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="py-6 px-8">
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-2.5 bg-slate-50 text-slate-500 rounded-xl">
                                                                    {field.icon}
                                                                </div>
                                                                <span className="text-sm font-bold text-slate-700">{field.label}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-6 px-8 text-sm text-slate-600 font-medium max-w-[280px]">
                                                            {field.id === 'address' ? (
                                                                <p className="leading-relaxed">{field.current}</p>
                                                            ) : (
                                                                <span className="font-mono text-xs">{field.current}</span>
                                                            )}
                                                        </td>
                                                        <td className="py-6 px-8 text-sm text-slate-600 font-medium max-w-[280px]">
                                                            <div className="flex items-center gap-2">
                                                                {field.id === 'address' ? (
                                                                    <p className="leading-relaxed italic font-black text-slate-800">{field.new}</p>
                                                                ) : (
                                                                    <span className="font-mono text-xs italic font-black text-slate-800">{field.new}</span>
                                                                )}
                                                                {field.url && field.new !== 'Não encontrado' && field.new !== 'Não informado' && (
                                                                    <a
                                                                        href={field.url.startsWith('http') ? field.url : `https://${field.url}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded transition-all shrink-0"
                                                                    >
                                                                        <ExternalLink className="w-3 h-3" />
                                                                    </a>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="py-6 px-8 text-center">
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                                <Check className="w-3 h-3" />
                                                                Idêntico
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="flex justify-center pt-4">
                                    <button
                                        onClick={() => handleSave('ok')}
                                        className="bg-emerald-600 text-white px-10 py-5 rounded-[2rem] font-bold text-sm shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center gap-3 active:scale-95 hover:scale-[1.02]"
                                    >
                                        Confirmar Validação 100%
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar area */}
                <div className="lg:col-span-4 space-y-8">

                    {/* Ficha Cadastral do Cliente (Compacta) */}
                    {client && (
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-8 space-y-6">
                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5 pb-3 border-b border-slate-100">
                                <FileText className="w-4 h-4 text-brand-red" /> Dados Atuais do Cliente
                            </h4>
                            <div className="flex flex-col gap-4 text-sm">
                                <div className="flex flex-col gap-0.5">
                                    <span className="font-black text-slate-400 text-[10px] uppercase tracking-widest">Nome Fantasia / Razão</span>
                                    <span className="font-bold text-slate-800">{client.nome_fantasia || client.razao_social || 'Não informado'}</span>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="font-black text-slate-400 text-[10px] uppercase tracking-widest">Contato</span>
                                    {client.contatos?.[0] ? (
                                        <>
                                            {client.contatos[0].telefone_principal && <span className="font-bold text-slate-800">{formatPhone(client.contatos[0].telefone_principal)} (Fixo)</span>}
                                            {client.contatos[0].celular && <span className="font-bold text-slate-800">{formatPhone(client.contatos[0].celular)} (Celular)</span>}
                                            {client.contatos[0].email_principal && <span className="font-medium text-slate-500 text-xs truncate">{client.contatos[0].email_principal}</span>}
                                        </>
                                    ) : (
                                        <span className="font-bold text-slate-800">Não informado</span>
                                    )}
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="font-black text-slate-400 text-[10px] uppercase tracking-widest">Endereço</span>
                                    <span className="font-bold text-slate-800">
                                        {client.enderecos?.[0] ? 
                                            `${client.enderecos[0].rua || ''}, ${client.enderecos[0].numero || 'S/N'}${client.enderecos[0].complemento ? ' - ' + client.enderecos[0].complemento : ''} - ${client.enderecos[0].bairro || ''}, ${client.enderecos[0].cidade || ''} - ${client.enderecos[0].estado || ''} ${client.enderecos[0].cep ? 'CEP: ' + client.enderecos[0].cep : ''}` 
                                            : 'Não informado'}
                                    </span>
                                </div>
                                
                                {/* Observações Editáveis */}
                                <div className="flex flex-col gap-1.5 pt-2">
                                    <span className="font-black text-slate-400 text-[10px] uppercase tracking-widest flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3 text-brand-red" /> Observações Internas
                                    </span>
                                    <textarea
                                        value={observacoes}
                                        onChange={(e) => setObservacoes(e.target.value)}
                                        placeholder="Adicione observações aqui..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-all resize-none min-h-[80px]"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Status Card */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-8 space-y-6 sticky top-10">
                        <button
                            onClick={() => handleSave(wasClientFound ? 'ok' : 'manual_review')}
                            disabled={saveMutation.isPending}
                            className={`w-full py-5 rounded-3xl font-black text-sm uppercase tracking-widest active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 text-white ${
                                !wasClientFound 
                                    ? 'bg-purple-600 shadow-2xl shadow-purple-100 hover:bg-purple-700 hover:scale-[1.02]' 
                                    : 'bg-[#B70F0A] shadow-2xl shadow-red-200 hover:scale-[1.02]'
                            }`}
                        >
                            {saveMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            {!wasClientFound ? 'Marcar Revisão Manual' : 'Publicar Alterações'}
                        </button>

                        <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-tighter">Ao publicar, o status de conferência será renovado por 180 dias.</p>

                        <div className="pt-6 border-t border-slate-100">
                            <div className="flex items-center gap-2 mb-4">
                                <History className="w-4 h-4 text-slate-600" />
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
                                            <p className="text-xs font-bold text-slate-600">{log.action === 'audit_save' ? 'Conferência Concluída' : 'Dados Atualizados'}</p>
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
        </div>
    );
};

export default AuditMatchFocus;




