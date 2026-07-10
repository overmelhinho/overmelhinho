import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import axios from "@/services/api";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    History,
    User,
    Activity,
    Calendar,
    ArrowRight,
    CircleDot,
    MessageCircle,
    X,
    Check
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AuditLog {
    id: string;
    type: 'audit' | 'ticket';
    action: string;
    entity_type: string;
    field_changes: Record<string, { old: any; new: any }> | null;
    created_at: string;
    actor_name: string;
    metadata?: any;
}

export default function TabAuditoria() {
    const { id } = useParams();

    const { data, isLoading } = useQuery<{ data: AuditLog[] }>({
        queryKey: ["client-audit-logs", id],
        queryFn: async () => {
            const resp = await axios.get(`/v1/clientes/${id}/historico`);
            return resp.data;
        },
    });

    const getActionProps = (log: AuditLog) => {
        // Tickets specific labels
        if (log.type === 'ticket') {
            const ticketLabels: Record<string, { label: string, color: string }> = {
                'created': { label: 'Ticket Aberto', color: 'bg-orange-100 text-orange-700' },
                'closed': { label: 'Ticket Finalizado', color: 'bg-green-100 text-green-700' },
                'comment': { label: 'Comentário', color: 'bg-purple-100 text-purple-700' },
                'assigned': { label: 'Atribuição', color: 'bg-blue-100 text-blue-700' },
                'status_changed': { label: 'Status Alterado', color: 'bg-yellow-100 text-yellow-800' },
                'priority_changed': { label: 'Prioridade', color: 'bg-red-100 text-red-700' }
            };

            const fallback = { label: 'Ticket: Alteração', color: 'bg-gray-100 text-gray-700' };
            const matched = ticketLabels[log.action] || fallback;

            return {
                label: matched.label,
                color: matched.color,
                icon: <MessageCircle size={14} className="shrink-0" />
            };
        }

        // Generic and Campaign Labels normalization
        const normalizedAction = log.action.toUpperCase();

        const labels: Record<string, { label: string, color: string }> = {
            'CREATE': { label: 'Criação', color: 'bg-emerald-100 text-emerald-700' },
            'CREATED': { label: 'Criação', color: 'bg-emerald-100 text-emerald-700' },
            'UPDATE': { label: 'Atualização', color: 'bg-blue-100 text-blue-700' },
            'UPDATED': { label: 'Atualização', color: 'bg-blue-100 text-blue-700' },
            'DELETE': { label: 'Exclusão', color: 'bg-red-100 text-red-700' },
            'DELETED': { label: 'Exclusão', color: 'bg-red-100 text-red-700' },
            'STATUS_CHANGE': { label: 'Status', color: 'bg-yellow-100 text-yellow-800' },
            'SYNC': { label: 'Sincronização', color: 'bg-purple-100 text-purple-700' },

            // Tratamento especial para as tags "CAMPANHA.ACTION" que vêm do Print/Backend
            'CAMPANHA.CREATE': { label: 'Campanha Criada', color: 'bg-indigo-100 text-indigo-700' },
            'CAMPANHA.UPDATED': { label: 'Campanha Atualizada', color: 'bg-sky-100 text-sky-700' },
            'CAMPANHA.DELETED': { label: 'Campanha Deletada', color: 'bg-rose-100 text-rose-700' },
            'CAMPANHA.FINALIZADA': { label: 'Campanha Finalizada', color: 'bg-teal-100 text-teal-700' },
        };

        const fallbackColor = normalizedAction.includes('CREATE') ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700";

        const matched = labels[normalizedAction] || {
            label: log.action.replace(/\./g, ' '),
            color: fallbackColor
        };

        return {
            label: matched.label,
            color: matched.color,
            icon: <Activity size={14} className="shrink-0" />
        };
    };

    if (isLoading) {
        return (
            <div className="animate-pulse space-y-4 p-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-20 bg-gray-100 rounded-xl"></div>
                ))}
            </div>
        );
    }

    const logs = data?.data || [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <History className="text-[#B70F0A]" size={20} />
                        Timeline do Cliente
                    </h3>
                    <p className="text-sm text-gray-500">Eventos, tickets e alterações realizados.</p>
                </div>
            </div>

            <div className="relative">
                {/* Linha do tempo vertical */}
                <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200"></div>

                <div className="space-y-4">
                    {logs.length > 0 ? (
                        logs.map((log) => {
                            const props = getActionProps(log);
                            return (
                                <div key={log.id} className="relative pl-10">
                                    {/* Ponto na linha do tempo */}
                                    <div className={cn(
                                        "absolute left-2 top-2 w-4 h-4 rounded-full bg-white border-2 z-10 flex items-center justify-center",
                                        log.type === 'ticket' ? "border-orange-500 shadow-[0_0_0_2px_rgba(249,115,22,0.1)]" : "border-blue-500"
                                    )}>
                                        <div className={cn("w-1.5 h-1.5 rounded-full", log.type === 'ticket' ? "bg-orange-500" : "bg-blue-500")}></div>
                                    </div>

                                    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                                            <div className="flex items-center gap-2">
                                                <span className={cn(
                                                    "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm",
                                                    props.color
                                                )}>
                                                    {props.icon}
                                                    {props.label}
                                                </span>
                                                <span className="text-sm font-bold text-gray-900 capitalize">
                                                    {log.entity_type}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 text-[11px] text-gray-400 font-semibold bg-gray-50 px-2 py-1 rounded-lg">
                                                <div className="flex items-center gap-1">
                                                    <User size={12} className="text-gray-300" />
                                                    {log.actor_name}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Calendar size={12} className="text-gray-300" />
                                                    {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                                </div>
                                            </div>
                                        </div>

                                        {log.type === 'ticket' && log.metadata && (
                                            <div className="mt-2 bg-slate-50 border border-slate-100 p-3 rounded-xl">
                                                <h4 className="text-xs font-bold text-slate-800 mb-1">{log.metadata.titulo}</h4>
                                                <div className="flex gap-2 mb-2">
                                                    <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-bold uppercase">
                                                        {log.metadata.tipo || 'Geral'}
                                                    </span>
                                                    <span className="text-[10px] bg-white border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-bold uppercase">
                                                        Status: {log.metadata.status}
                                                    </span>
                                                </div>
                                                {log.metadata.message && (
                                                    <div className="text-xs text-slate-600 italic bg-white p-2 border border-slate-100 rounded-lg">
                                                        {log.metadata.message}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {log.field_changes && Object.keys(log.field_changes).length > 0 && (
                                            <div className="mt-4 pt-4 border-t border-slate-100">
                                                <h4 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                                                    <History className="w-4 h-4 text-[#B70F0A]" />
                                                    Detalhes da Atualização
                                                </h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                                    {Object.entries(log.field_changes).map(([field, change]: [string, any]) => {
                                                        if (!change) return null;
                                                        const oldVal = change.old !== undefined ? change.old : change.from;
                                                        const newVal = change.new !== undefined ? change.new : change.to;

                                                        if (['seo_keywords_updated_at', 'updated_at', 'created_at', 'last_audit_at', 'audit_action', 'audit_differences'].includes(field)) {
                                                            return null;
                                                        }

                                                        const fieldLabels: Record<string, string> = {
                                                            horario_atendimento: 'Horários de Atendimento',
                                                            logo_url: 'Logotipo',
                                                            banner_url: 'Banner',
                                                            video: 'Vídeo / Apresentação',
                                                            descricao: 'Descrição Completa',
                                                            seo_keywords: 'Palavras-Chave (SEO)',
                                                            redes_sociais: 'Redes Sociais',
                                                            enderecos: 'Endereço',
                                                            contatos: 'Contatos',
                                                            exibir_no_site: 'Visibilidade no Site',
                                                            possui_publicidade: 'Possui Publicidade',
                                                            exibir_data_fundacao: 'Exibir Data de Fundação',
                                                            razao_social: 'Razão Social',
                                                            nome_fantasia: 'Nome Fantasia',
                                                            audit_status: 'Status da Auditoria',
                                                            responsavel: 'Responsável',
                                                            telefone: 'Telefone Principal',
                                                            website: 'Site',
                                                            observacoes: 'Observações Internas',
                                                            observacoes_horario: 'Obs. de Horários',
                                                            beneficios: 'Benefícios',
                                                            google_place_id: 'ID do Google Maps',
                                                            cep: 'CEP',
                                                            logradouro: 'Logradouro',
                                                            numero: 'Número',
                                                            bairro: 'Bairro',
                                                            cidade: 'Cidade',
                                                            estado: 'Estado',
                                                            complemento: 'Complemento',
                                                            latitude: 'Latitude',
                                                            longitude: 'Longitude',
                                                            seo_description: 'Descrição SEO',
                                                            seo_title: 'Título SEO'
                                                        };

                                                        const label = fieldLabels[field] || field.replace(/_/g, ' ');

                                                        const formatValue = (val: any) => {
                                                            if (val === null || val === undefined || val === '') return null;
                                                            if (typeof val === 'boolean' || val === 'true' || val === 'false') {
                                                                return String(val) === 'true' ? 'Sim' : 'Não';
                                                            }
                                                            if (Array.isArray(val)) {
                                                                return val.length === 0 ? 'Vazio' : `${val.length} item(s)`;
                                                            }
                                                            if (typeof val === 'object') {
                                                                return 'Dados Atualizados';
                                                            }
                                                            if (typeof val === 'string' && val.length > 80) {
                                                                return val.substring(0, 80) + '...';
                                                            }
                                                            return String(val);
                                                        };

                                                        const oldFormatted = formatValue(oldVal);
                                                        const newFormatted = formatValue(newVal);

                                                        if (oldFormatted === newFormatted && oldFormatted !== null) return null;

                                                        const from = oldFormatted === null ? 'Vazio' : oldFormatted;
                                                        const to = newFormatted === null ? 'Vazio' : newFormatted;

                                                        return (
                                                            <div key={field} className="bg-slate-50 rounded-xl p-4 border border-slate-100/50">
                                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                                                                    {label}
                                                                </div>
                                                                <div className="flex flex-col gap-2">
                                                                    <div className="flex items-start gap-2">
                                                                        <span className="mt-0.5 text-slate-300"><X className="w-3.5 h-3.5" /></span>
                                                                        <span className="text-sm text-slate-500 font-medium line-through decoration-slate-300 break-words line-clamp-2">
                                                                            {from}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-start gap-2">
                                                                        <span className="mt-0.5 text-emerald-500"><Check className="w-3.5 h-3.5" /></span>
                                                                        <span className="text-sm text-emerald-700 font-bold break-words line-clamp-3">
                                                                            {to}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-gray-400 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-100">
                            <Activity size={48} strokeWidth={1} className="mb-4 text-slate-300" />
                            <p className="text-sm font-bold text-slate-500">Nenhuma atividade registrada no histórico.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
