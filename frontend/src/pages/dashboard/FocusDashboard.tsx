import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useFocusQueue } from "@/hooks/useFocusQueue";
import { useUpdateTicket, TicketStatus } from "@/hooks/useTickets";
import { Loader, ChevronRight, CheckCircle2, AlertCircle, Clock, Star } from "lucide-react";

/** ---------------------------
 * Utils
 * -------------------------- */
function fmtDate(iso?: string | null) {
    if (!iso) return "Pendente";
    try {
        return new Date(iso).toLocaleDateString("pt-BR", { day: '2-digit', month: 'short' });
    } catch {
        return iso;
    }
}

function prioridadeLabelPt(p: string) {
    const map: Record<string, string> = {
        baixa: "Baixa",
        media: "Média",
        alta: "Alta",
        urgente: "Urgente",
    };
    return map[p] ?? p;
}

export default function FocusDashboard() {
    const { data, isLoading, isError, refetch } = useFocusQueue();
    const navigate = useNavigate();
    const [finishingId, setFinishingId] = useState<number | null>(null);

    const tickets = data?.data?.data || [];
    const mainTicket = tickets[0];
    const nextTickets = tickets.slice(1, 4);

    const updateTicket = useUpdateTicket(mainTicket?.id || 0);

    const handleFinish = async () => {
        if (!mainTicket) return;
        setFinishingId(mainTicket.id);
        try {
            await updateTicket.mutateAsync({ status: "resolvido" as TicketStatus, comment: "Tarefa concluída via Fila de Foco." });
            await refetch();
        } catch (err) {
            console.error("Erro ao concluir tarefa", err);
        } finally {
            setFinishingId(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader className="h-12 w-12 animate-spin text-[#B70F0A]" />
            </div>
        );
    }

    if (isError || tickets.length === 0) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center p-6 text-center">
                <div className="mb-4 rounded-full bg-green-50 p-6">
                    <CheckCircle2 className="h-16 w-16 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Tudo limpo!</h2>
                <p className="mt-2 text-gray-600">Você não tem tarefas pendentes na sua fila de foco.</p>
                <Link to="/tickets" className="mt-6 font-semibold text-[#B70F0A] hover:underline">
                    Ver todos os tickets
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F2F2F2] p-4 md:p-8">
            <header className="mb-8">
                <h1 className="text-sm font-bold uppercase tracking-widest text-[#B70F0A]">Meu Dia</h1>
                <p className="text-3xl font-bold text-gray-900">Fila de Foco</p>
            </header>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Card Principal (Bento Grid Main) */}
                <div className="lg:col-span-2">
                    <div className="relative overflow-hidden rounded-[2rem] border border-gray-200 bg-white p-8 shadow-sm transition-all hover:shadow-md">
                        <div className="flex items-center justify-between gap-4">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#B70F0A]">
                                <AlertCircle className="h-3.5 w-3.5" />
                                FOCO AGORA
                            </span>
                            <span className="text-sm font-medium text-gray-500">#{mainTicket.id}</span>
                        </div>

                        <div className="mt-8">
                            <h2 className="text-4xl font-black leading-tight text-gray-900">{mainTicket.titulo}</h2>
                            <div className="mt-6 flex flex-wrap gap-4">
                                <div className="flex items-center gap-2 rounded-2xl bg-gray-50 px-4 py-2">
                                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                    <span className="text-sm font-semibold text-gray-700">
                                        {mainTicket.cliente?.nome_fantasia || "Cliente Direto"}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 rounded-2xl bg-gray-50 px-4 py-2">
                                    <Clock className="h-4 w-4 text-blue-500" />
                                    <span className="text-sm font-semibold text-gray-700">
                                        Vence em: {fmtDate(mainTicket.due_at)}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-8 border-t border-gray-100 pt-8">
                                <p className="text-lg leading-relaxed text-gray-600 line-clamp-3">
                                    {mainTicket.descricao || "Sem descrição disponível para esta tarefa."}
                                </p>
                            </div>

                            <div className="mt-12 flex flex-wrap items-center gap-4">
                                <button
                                    onClick={handleFinish}
                                    disabled={!!finishingId}
                                    className="flex min-w-[200px] items-center justify-center gap-2 rounded-2xl bg-[#B70F0A] py-5 px-8 text-lg font-bold text-white shadow-xl shadow-red-900/20 transition-all hover:scale-[1.02] hover:bg-[#8e0d08] active:scale-95 disabled:scale-100 disabled:opacity-50"
                                >
                                    {finishingId ? <Loader className="animate-spin" /> : <CheckCircle2 />}
                                    CONCLUIR TAREFA
                                </button>
                                <button
                                    onClick={() => navigate(`/tickets/${mainTicket.id}`)}
                                    className="rounded-2xl border border-gray-200 bg-white py-5 px-8 text-lg font-bold text-gray-700 transition-all hover:bg-gray-50"
                                >
                                    VER DETALHES
                                </button>
                            </div>
                        </div>

                        {/* Background Accent */}
                        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-red-500/5 blur-3xl" />
                    </div>
                </div>

                {/* Sidebar (Bento Grid Side) */}
                <div className="space-y-6">
                    <div className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm">
                        <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400">A Seguir</h3>
                        <div className="space-y-4">
                            {nextTickets.length > 0 ? (
                                nextTickets.map((t: any) => (
                                    <div
                                        key={t.id}
                                        className="group flex cursor-pointer items-center justify-between rounded-2xl bg-gray-50 p-4 transition-all hover:bg-gray-100"
                                        onClick={() => navigate(`/tickets/${t.id}`)}
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-gray-400">
                                                {prioridadeLabelPt(t.prioridade)}
                                            </div>
                                            <h4 className="mt-1 truncate text-sm font-bold text-gray-900">{t.titulo}</h4>
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-gray-300 transition-transform group-hover:translate-x-1" />
                                    </div>
                                ))
                            ) : (
                                <p className="py-4 text-center text-sm italic text-gray-400">Nenhuma outra tarefa imediata.</p>
                            )}
                        </div>
                    </div>

                    {/* Status Card */}
                    <div className="rounded-[2rem] bg-gray-900 p-8 text-white shadow-lg">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Progresso</h3>
                            <span className="text-3xl font-black text-[#B70F0A]">{tickets.length}</span>
                        </div>
                        <p className="mt-2 text-sm text-gray-400">Tickets pendentes sob sua responsabilidade hoje.</p>

                        <div className="mt-8 flex h-2 w-full overflow-hidden rounded-full bg-gray-800">
                            <div className="h-full bg-[#B70F0A]" style={{ width: '30%' }} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
