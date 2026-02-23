import { Ticket, TicketStatus } from "@/hooks/useTickets";
import { Link } from "react-router-dom";

interface KanbanProps {
    tickets: Ticket[];
    onAssume?: (ticket: Ticket) => void;
    onMove?: (ticket: Ticket, newStatus: TicketStatus) => void;
    isLoading?: boolean;
}

const COLUMNS: { key: TicketStatus; label: string; color: string }[] = [
    { key: "aberto", label: "Aberto", color: "bg-gray-100" },
    { key: "assigned", label: "Atribuído", color: "bg-blue-50" },
    { key: "em_andamento", label: "Em Andamento", color: "bg-indigo-50" },
    { key: "aguardando_cliente", label: "Aguardando Cliente", color: "bg-yellow-50" },
    { key: "resolvido", label: "Resolvido", color: "bg-emerald-50" },
];

function SlaIndicator({ status }: { status?: string }) {
    if (status === "overdue") return <div className="h-1.5 w-full bg-red-500 rounded-full mb-2" title="Vencido!" />;
    if (status === "warning") return <div className="h-1.5 w-full bg-yellow-400 rounded-full mb-2" title="Próximo do vencimento" />;
    return null;
}

export default function TicketKanbanView({ tickets, onAssume, onMove, isLoading }: KanbanProps) {
    if (isLoading) {
        return (
            <div className="flex gap-4 p-4 overflow-x-auto min-h-[500px]">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-72 flex-shrink-0 animate-pulse bg-gray-50 rounded-2xl p-4" />
                ))}
            </div>
        );
    }

    const grouped = COLUMNS.reduce((acc, col) => {
        acc[col.key] = tickets.filter((t) => t.status === col.key);
        return acc;
    }, {} as Record<string, Ticket[]>);

    // Tickets que não estão em nenhuma das colunas principais (ex: fechados, cancelados)
    const otherTickets = tickets.filter(t => !COLUMNS.map(c => c.key).includes(t.status));

    return (
        <div className="flex gap-4 p-4 overflow-x-auto min-h-[600px] items-start">
            {COLUMNS.map((col) => (
                <div key={col.key} className={`w-80 flex-shrink-0 rounded-2xl border border-gray-200 ${col.color ?? 'bg-white'} p-3 shadow-sm flex flex-col max-h-[calc(100vh-250px)]`}>
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                            {col.label}
                            <span className="bg-gray-200 text-gray-600 text-[10px] px-1.5 py-0.5 rounded-full">
                                {grouped[col.key]?.length || 0}
                            </span>
                        </h3>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                        {grouped[col.key]?.map((ticket) => (
                            <TicketCard
                                key={ticket.id}
                                ticket={ticket}
                                onAssume={onAssume}
                                onMove={onMove}
                            />
                        ))}
                        {grouped[col.key]?.length === 0 && (
                            <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center text-xs text-gray-400">
                                Nenhum ticket
                            </div>
                        )}
                    </div>
                </div>
            ))}

            {/* Coluna opcional para "Outros" se houver */}
            {otherTickets.length > 0 && (
                <div className="w-80 flex-shrink-0 rounded-2xl border border-gray-200 bg-gray-50 p-3 shadow-sm flex flex-col max-h-[calc(100vh-250px)] opacity-60">
                    <h3 className="font-bold text-gray-800 text-sm mb-3 px-1">Outros ({otherTickets.length})</h3>
                    <div className="flex-1 overflow-y-auto space-y-3">
                        {otherTickets.map(t => <TicketCard key={t.id} ticket={t} onMove={onMove} />)}
                    </div>
                </div>
            )}
        </div>
    );
}

function TicketCard({ ticket, onAssume, onMove }: { ticket: Ticket; onAssume?: (t: Ticket) => void; onMove?: (t: Ticket, s: TicketStatus) => void }) {
    const isUnassigned = !ticket.assignee_id;
    const clienteNome = ticket.cliente?.nome_fantasia || ticket.cliente?.razao_social || "Cliente —";

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm hover:shadow-md transition-shadow group relative">
            <SlaIndicator status={ticket.sla_status} />

            <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase">#{ticket.id}</span>
                <div className="flex gap-1">
                    <BadgePrioridade prioridade={ticket.prioridade} />
                </div>
            </div>

            <h4 className="text-sm font-semibold text-gray-900 leading-tight mb-1 group-hover:text-[#B70F0A] transition-colors">
                <Link to={`/tickets/${ticket.id}`}>{ticket.titulo}</Link>
            </h4>

            <div className="text-xs text-gray-600 mb-3 flex items-center gap-1">
                <span className="font-medium text-gray-800 capitalize">{ticket.setor}</span>
                <span>•</span>
                <span className="line-clamp-1">{clienteNome}</span>
            </div>

            <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
                <div className="flex items-center gap-1.5">
                    {ticket.assignee ? (
                        <div className="h-6 w-6 rounded-full bg-gray-900 flex items-center justify-center text-[10px] text-white font-bold uppercase" title={ticket.assignee.name}>
                            {ticket.assignee.name.substring(0, 1)}
                        </div>
                    ) : (
                        <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] text-gray-400 font-bold" title="Sem responsável">
                            ?
                        </div>
                    )}
                    <span className="text-[10px] text-gray-500 font-medium">
                        {ticket.assignee?.name || "Pendente"}
                    </span>
                </div>

                {ticket.subtasks_count && (
                    <div className="text-[10px] font-semibold bg-gray-50 px-1.5 py-0.5 rounded-lg text-gray-500 border border-gray-100">
                        {ticket.completed_subtasks_count}/{ticket.subtasks_count}
                    </div>
                )}
            </div>

            {isUnassigned && onAssume && (
                <button
                    onClick={() => onAssume(ticket)}
                    className="mt-3 w-full py-2 bg-gray-900 text-white text-[11px] font-bold rounded-lg hover:opacity-90 transition-opacity"
                >
                    Assumir
                </button>
            )}

            {/* Overlay de ações rápidas ao passar o mouse */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex items-center gap-1">
                <Link to={`/tickets/${ticket.id}`} className="p-1 px-2 bg-[#B70F0A] text-white text-[10px] font-bold rounded-lg shadow-lg">Ver</Link>
            </div>
        </div>
    );
}

function BadgePrioridade({ prioridade }: { prioridade: string }) {
    const colors: any = {
        baixa: "bg-gray-100 text-gray-600",
        media: "bg-blue-100 text-blue-700",
        alta: "bg-orange-100 text-orange-700",
        urgente: "bg-red-100 text-red-700",
    };
    return (
        <span className={`text-[9px] uppercase font-heavy px-1.5 py-0.5 rounded-md ${colors[prioridade] || 'bg-gray-100'}`}>
            {prioridade}
        </span>
    );
}
