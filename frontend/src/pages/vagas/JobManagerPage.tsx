// Página Admin: Gestão de Vagas da Empresa
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "@/services/api";
import toast from "react-hot-toast";

interface Job {
    id: number;
    title: string;
    city: string;
    hiring_type: string;
    work_model: string;
    status: string;
    is_active: boolean;
    candidates_count: number;
    created_at: string;
    published_at: string | null;
    expires_at: string | null;
    client?: { nome_fantasia: string };
}

const STATUS_LABEL: Record<string, string> = {
    Draft: "Rascunho",
    Published: "Publicada",
    Paused: "Pausada",
    Closed: "Encerrada",
};

const statusColors: Record<string, string> = {
    Draft: "bg-gray-100 text-gray-600",
    Published: "bg-green-100 text-green-700",
    Paused: "bg-yellow-100 text-yellow-700",
    Closed: "bg-red-100 text-red-700",
};

export default function JobManagerPage() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [total, setTotal] = useState<number>(0);
    const [page, setPage] = useState<number>(1);
    const [lastPage, setLastPage] = useState<number>(1);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("");

    const fetchJobs = async (pageNumber = 1) => {
        setLoading(true);
        try {
            const params: Record<string, string | number> = { page: pageNumber };
            if (search) params.search = search;
            if (filterStatus) params.status = filterStatus;
            const { data } = await api.get("/v1/jobs", { params });
            setJobs(data.data || data);
            setTotal(data.total || (Array.isArray(data) ? data.length : 0));
            setLastPage(data.last_page || 1);
            setPage(pageNumber);
        } catch {
            toast.error("Erro ao carregar vagas.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchJobs(1); }, []);

    const toggleActive = async (job: Job) => {
        try {
            await api.put(`/v1/jobs/${job.id}`, { is_active: !job.is_active });
            toast.success(job.is_active ? "Vaga desativada." : "Vaga ativada no site!");
            fetchJobs();
        } catch {
            toast.error("Erro ao alterar status.");
        }
    };

    const deleteJob = async (id: number) => {
        if (!confirm("Remover esta vaga permanentemente?")) return;
        try {
            await api.delete(`/v1/jobs/${id}`);
            toast.success("Vaga removida.");
            fetchJobs();
        } catch {
            toast.error("Erro ao remover.");
        }
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Vagas de Emprego</h1>
                    <p className="text-sm text-slate-500">Gerencie as vagas e candidatos {total ? `(Total: ${total})` : ''}</p>
                </div>
                <Link
                    to="/vagas/nova"
                    className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-500"
                >
                    + Nova Vaga
                </Link>
            </div>

            {/* Filtros */}
            <div className="mb-5 flex flex-wrap gap-3">
                <input
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition min-w-[300px]"
                    placeholder="Buscar por título, empresa ou cidade..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && fetchJobs()}
                />
                <select
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                >
                    <option value="">Todos os status</option>
                    {Object.entries(STATUS_LABEL).map(([val, lbl]) => (
                        <option key={val} value={val}>{lbl}</option>
                    ))}
                </select>
                <button
                    onClick={() => fetchJobs(1)}
                    className="rounded-xl bg-slate-700 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-600"
                >
                    Filtrar
                </button>
                {(search || filterStatus) && (
                    <button
                        onClick={() => { setSearch(""); setFilterStatus(""); setTimeout(fetchJobs, 50); }}
                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-500 transition hover:bg-slate-50"
                    >
                        Limpar
                    </button>
                )}
            </div>

            {loading ? (
                <div className="py-20 text-center text-slate-400">Carregando...</div>
            ) : jobs.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-slate-200 py-20 text-center text-slate-400">
                    <p className="text-lg font-medium">Nenhuma vaga encontrada</p>
                    <p className="text-sm">Tente ajustar os filtros ou crie uma nova vaga.</p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <table className="w-full text-sm">
                        {/* Table content unchanged */}
                        <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            <tr>
                                <th className="px-5 py-3 text-left">Vaga</th>
                                <th className="px-5 py-3 text-left">Data Publicado</th>
                                <th className="px-5 py-3 text-left">Data Validade</th>
                                <th className="px-5 py-3 text-left">Status</th>
                                <th className="px-5 py-3 text-center">Ativo no Site</th>
                                <th className="px-5 py-3 text-center">Candidatos</th>
                                <th className="px-5 py-3 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {jobs.map((job) => (
                                <tr key={job.id} className="hover:bg-slate-50">
                                    <td className="px-5 py-4">
                                        <p className="font-semibold text-slate-800">{job.title}</p>
                                        <p className="text-xs text-slate-400">
                                            {job.city && `📍 ${job.city}`}
                                            {job.hiring_type && ` · ${job.hiring_type}`}
                                            {job.work_model && ` · ${job.work_model}`}
                                        </p>
                                        {job.client && (
                                            <p className="text-xs text-slate-400">🏢 {job.client.nome_fantasia}</p>
                                        )}
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className="text-xs text-slate-600">
                                            {job.published_at ? new Date(job.published_at).toLocaleDateString('pt-BR') : '-'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className="text-xs text-slate-600">
                                            {job.expires_at ? new Date(job.expires_at).toLocaleDateString('pt-BR') : '-'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColors[job.status] ?? "bg-gray-100 text-gray-600"}`}>
                                            {STATUS_LABEL[job.status] ?? job.status}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                        <button
                                            onClick={() => toggleActive(job)}
                                            title={job.is_active ? "Clique para desativar" : "Clique para ativar (aprovação manual)"}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${job.is_active ? "bg-green-500" : "bg-slate-200"}`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${job.is_active ? "translate-x-6" : "translate-x-1"}`} />
                                        </button>
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                        <Link
                                            to={`/vagas/${job.id}/candidatos`}
                                            className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                                        >
                                            👥 {job.candidates_count ?? 0}
                                        </Link>
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                to={`/vagas/${job.id}/editar`}
                                                className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
                                            >
                                                Editar
                                            </Link>
                                            <button
                                                onClick={() => deleteJob(job.id)}
                                                className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                                            >
                                                Remover
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {lastPage > 1 && (
                        <div className="flex items-center justify-between border-t border-slate-200 bg-white px-5 py-3">
                            <span className="text-sm text-slate-500">
                                Página {page} de {lastPage}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    disabled={page === 1}
                                    onClick={() => fetchJobs(page - 1)}
                                    className="rounded-lg border border-slate-200 px-3 py-1 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                                >
                                    Anterior
                                </button>
                                <button
                                    disabled={page === lastPage}
                                    onClick={() => fetchJobs(page + 1)}
                                    className="rounded-lg border border-slate-200 px-3 py-1 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                                >
                                    Próxima
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
