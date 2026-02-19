// Página Admin: Candidatos de uma Vaga (com gestão de status)
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "@/services/api";
import toast from "react-hot-toast";

interface Candidate {
    id: number;
    name: string;
    email: string;
    phone: string;
    linkedin_url: string;
    resume_path: string;
    status: string;
    created_at: string;
}

const STATUSES = ["New", "Reviewing", "Interview", "Rejected", "Hired"];

const statusColors: Record<string, string> = {
    New: "bg-blue-100 text-blue-700",
    Reviewing: "bg-yellow-100 text-yellow-700",
    Interview: "bg-purple-100 text-purple-700",
    Rejected: "bg-red-100 text-red-700",
    Hired: "bg-green-100 text-green-700",
};

const statusLabels: Record<string, string> = {
    New: "Novo",
    Reviewing: "Em Análise",
    Interview: "Entrevista",
    Rejected: "Reprovado",
    Hired: "Contratado",
};

export default function CandidatesPage() {
    const { jobId } = useParams<{ jobId: string }>();
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [jobTitle, setJobTitle] = useState("");
    const [loading, setLoading] = useState(true);
    const [resumeModal, setResumeModal] = useState<string | null>(null);

    const fetchCandidates = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/v1/jobs/${jobId}/candidates`);
            setCandidates(data.candidates || []);
            setJobTitle(data.job?.title || "Vaga");
        } catch {
            toast.error("Erro ao carregar candidatos.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCandidates(); }, [jobId]);

    const updateStatus = async (candidateId: number, status: string) => {
        try {
            await api.patch(`/v1/candidates/${candidateId}/status`, { status });
            toast.success("Status atualizado!");
            setCandidates((prev) =>
                prev.map((c) => (c.id === candidateId ? { ...c, status } : c))
            );
        } catch {
            toast.error("Erro ao atualizar status.");
        }
    };

    const openResume = async (candidateId: number) => {
        try {
            const { data } = await api.get(`/v1/candidates/${candidateId}/resume`);
            setResumeModal(data.url);
        } catch {
            toast.error("Currículo não encontrado.");
        }
    };

    const deleteCandidate = async (candidateId: number) => {
        if (!confirm("Remover este candidato?")) return;
        try {
            await api.delete(`/v1/candidates/${candidateId}`);
            toast.success("Candidato removido.");
            setCandidates((prev) => prev.filter((c) => c.id !== candidateId));
        } catch {
            toast.error("Erro ao remover candidato.");
        }
    };

    return (
        <div className="p-6">
            <div className="mb-6 flex items-center gap-3">
                <Link to="/vagas" className="text-slate-400 hover:text-slate-700">← Vagas</Link>
                <span className="text-slate-300">/</span>
                <h1 className="text-xl font-bold text-slate-800">Candidatos: {jobTitle}</h1>
            </div>

            {loading ? (
                <div className="py-20 text-center text-slate-400">Carregando candidatos...</div>
            ) : candidates.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-slate-200 py-20 text-center text-slate-400">
                    <p className="text-lg font-medium">Nenhum candidato ainda</p>
                    <p className="text-sm">Quando candidatos se inscreverem, aparecerão aqui.</p>
                </div>
            ) : (
                <>
                    {/* Resumo por status */}
                    <div className="mb-6 flex flex-wrap gap-3">
                        {STATUSES.map((s) => {
                            const count = candidates.filter((c) => c.status === s).length;
                            return (
                                <div key={s} className={`rounded-xl px-4 py-2 text-sm font-semibold ${statusColors[s]}`}>
                                    {statusLabels[s]}: {count}
                                </div>
                            );
                        })}
                    </div>

                    {/* Tabela de candidatos */}
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                <tr>
                                    <th className="px-5 py-3 text-left">Candidato</th>
                                    <th className="px-5 py-3 text-left">Contato</th>
                                    <th className="px-5 py-3 text-left">Status</th>
                                    <th className="px-5 py-3 text-center">Currículo</th>
                                    <th className="px-5 py-3 text-left">Candidatura</th>
                                    <th className="px-5 py-3 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {candidates.map((c) => (
                                    <tr key={c.id} className="hover:bg-slate-50">
                                        <td className="px-5 py-4">
                                            <p className="font-semibold text-slate-800">{c.name}</p>
                                            {c.linkedin_url && (
                                                <a href={c.linkedin_url} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline">
                                                    LinkedIn
                                                </a>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 text-slate-600">
                                            <p>{c.email}</p>
                                            {c.phone && <p className="text-xs text-slate-400">{c.phone}</p>}
                                        </td>
                                        <td className="px-5 py-4">
                                            <select
                                                value={c.status}
                                                onChange={(e) => updateStatus(c.id, e.target.value)}
                                                className={`rounded-lg border-0 px-2.5 py-1 text-xs font-semibold outline-none ${statusColors[c.status]}`}
                                            >
                                                {STATUSES.map((s) => (
                                                    <option key={s} value={s}>{statusLabels[s]}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            {c.resume_path ? (
                                                <button
                                                    onClick={() => openResume(c.id)}
                                                    className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
                                                >
                                                    📄 Ver CV
                                                </button>
                                            ) : (
                                                <span className="text-xs text-slate-300">—</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 text-xs text-slate-400">
                                            {new Date(c.created_at).toLocaleDateString("pt-BR")}
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <button
                                                onClick={() => deleteCandidate(c.id)}
                                                className="rounded-lg px-2.5 py-1 text-xs font-medium text-red-500 hover:bg-red-50"
                                            >
                                                Remover
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* Modal de Currículo */}
            {resumeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
                    <div className="relative h-[85vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b px-5 py-3">
                            <span className="font-semibold text-slate-700">Visualizador de Currículo</span>
                            <div className="flex gap-2">
                                <a
                                    href={resumeModal}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
                                >
                                    Abrir em nova aba
                                </a>
                                <button
                                    onClick={() => setResumeModal(null)}
                                    className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100"
                                >
                                    Fechar
                                </button>
                            </div>
                        </div>
                        <iframe src={resumeModal} className="h-full w-full" title="Currículo" />
                    </div>
                </div>
            )}
        </div>
    );
}
