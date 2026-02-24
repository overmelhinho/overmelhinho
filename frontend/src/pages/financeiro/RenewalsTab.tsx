import { useQuery } from "@tanstack/react-query";
import axios from "@/services/api";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    RefreshCw,
    Link as LinkIcon,
    CheckCircle2,
    Clock,
    AlertCircle,
    User,
    Calendar,
    ExternalLink,
    Search,
    Filter,
    MessageSquare
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

interface Renewal {
    id: number;
    cliente_id: number;
    expiration_date: string;
    status: 'pending' | 'sent' | 'approved' | 'rejected' | 'updated_data';
    magic_link_token: string;
    suggested_changes: string | null;
    cliente: {
        id: number;
        nome_fantasia: string;
        cpf_cnpj: string;
    };
    created_at: string;
}

export default function RenewalsTab() {
    const [page, setPage] = useState(1);

    const { data: renewalsData, isLoading } = useQuery({
        queryKey: ["admin-renewals", page],
        queryFn: async () => {
            const resp = await axios.get(`/v1/renewals?page=${page}`);
            return resp.data;
        }
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "approved":
                return (
                    <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-[10px] font-black uppercase bg-green-100 text-green-700 shadow-sm">
                        <CheckCircle2 size={12} /> Confirmada
                    </span>
                );
            case "pending":
                return (
                    <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-[10px] font-black uppercase bg-yellow-100 text-yellow-700 shadow-sm">
                        <Clock size={12} /> Pendente
                    </span>
                );
            case "updated_data":
                return (
                    <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-700 shadow-sm">
                        <AlertCircle size={12} /> Ajuste Solicitado
                    </span>
                );
            case "rejected":
                return (
                    <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-[10px] font-black uppercase bg-red-100 text-red-700 shadow-sm">
                        <AlertCircle size={12} /> Recusada
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-[10px] font-black uppercase bg-gray-100 text-gray-700 shadow-sm">
                        {status}
                    </span>
                );
        }
    };

    const copyToClipboard = (token: string) => {
        const link = `${window.location.protocol}//${window.location.host}/renovar/${token}`;
        navigator.clipboard.writeText(link);
        toast.success("Link copiado!");
    };

    const renewals = renewalsData?.data || [];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <RefreshCw className="text-[#B70F0A]" size={20} />
                        Controle de Renovações
                    </h3>
                    <p className="text-sm text-gray-500 font-medium leading-tight">Acompanhe os clientes próx. do vencimento e o status dos links mágicos.</p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar cliente..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-gray-100 rounded-xl text-sm focus:ring-red-500 transition-all"
                        />
                    </div>
                    <button className="p-2.5 bg-gray-50 text-gray-500 rounded-xl hover:bg-gray-100 transition-all border border-gray-100">
                        <Filter size={20} />
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 gap-4">
                    {[1, 2, 3].map(n => (
                        <div key={n} className="h-24 bg-gray-100 animate-pulse rounded-2xl"></div>
                    ))}
                </div>
            ) : renewals.length > 0 ? (
                <div className="overflow-hidden border border-gray-200 rounded-2xl shadow-sm bg-white">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-[11px] text-gray-400 uppercase font-black bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4">Cliente / Empresa</th>
                                <th className="px-6 py-4">Vencimento</th>
                                <th className="px-6 py-4">Status Atual</th>
                                <th className="px-6 py-4">Solicitações</th>
                                <th className="px-6 py-4 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {renewals.map((ren: Renewal) => (
                                <tr key={ren.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-600 font-black shrink-0">
                                                <User size={18} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 leading-tight">{ren.cliente.nome_fantasia}</p>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">ID: {ren.cliente.id} • {ren.cliente.cpf_cnpj}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2 text-gray-600 font-semibold">
                                            <Calendar size={14} className="text-gray-400" />
                                            {format(new Date(ren.expiration_date), "dd/MM/yyyy", { locale: ptBR })}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getStatusBadge(ren.status)}
                                    </td>
                                    <td className="px-6 py-4 max-w-[200px]">
                                        {ren.suggested_changes ? (
                                            <div className="flex items-start gap-2 text-[11px] text-blue-600 font-semibold leading-tight bg-blue-50 p-2 rounded-lg border border-blue-100">
                                                <MessageSquare size={12} className="shrink-0 mt-0.5" />
                                                <span className="line-clamp-2">{ren.suggested_changes}</span>
                                            </div>
                                        ) : (
                                            <span className="text-[10px] text-gray-300 italic font-medium">Nenhuma observação</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center gap-1.5">
                                            <button
                                                onClick={() => copyToClipboard(ren.magic_link_token)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                                title="Copiar Magic Link"
                                            >
                                                <LinkIcon size={18} />
                                            </button>
                                            <a
                                                href={`/clientes/${ren.cliente_id}/editar`}
                                                className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
                                                title="Ver Cliente"
                                            >
                                                <ExternalLink size={18} />
                                            </a>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="bg-white p-12 rounded-2xl border border-dashed border-gray-200 text-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                            <RefreshCw size={32} />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900">Nenhuma renovação pendente</h4>
                            <p className="text-sm text-gray-500">As renovações automáticas são geradas todo dia 1º.</p>
                        </div>
                    </div>
                </div>
            )}

            {renewalsData?.last_page > 1 && (
                <div className="flex justify-center gap-2 pb-6">
                    {Array.from({ length: renewalsData.last_page }, (_, i) => i + 1).map(p => (
                        <button
                            key={p}
                            onClick={() => setPage(p)}
                            className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${p === page
                                    ? "bg-[#B70F0A] text-white shadow-lg shadow-red-100"
                                    : "bg-white border border-gray-100 text-gray-500 hover:bg-gray-50"
                                }`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
