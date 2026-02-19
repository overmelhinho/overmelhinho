// Página Pública: Lista de Vagas
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.trim() ?? "https://api.overmelhinho.com.br/api";

interface Job {
    id: number;
    title: string;
    city: string;
    hiring_type: string;
    work_model: string;
    salary_range: string;
    published_at: string;
    client: { nome_fantasia: string };
}

export default function PublicJobList() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [city, setCity] = useState("");
    const [workModel, setWorkModel] = useState("");

    const fetchJobs = async () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (search) params.append("search", search);
        if (city) params.append("city", city);
        if (workModel) params.append("work_model", workModel);

        const res = await fetch(`${API_BASE}/v1/jobs/public?${params}`);
        const data = await res.json();
        setJobs(data.data || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchJobs();
    }, []);

    const hiringBadge: Record<string, string> = {
        CLT: "bg-green-100 text-green-700",
        PJ: "bg-blue-100 text-blue-700",
        "Estágio": "bg-yellow-100 text-yellow-700",
        Freelancer: "bg-purple-100 text-purple-700",
    };

    const workModelIcon: Record<string, string> = {
        Remoto: "🌐",
        Híbrido: "🏠",
        Presencial: "🏢",
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-950 to-slate-900">
            {/* Hero */}
            <div className="px-6 py-16 text-center text-white">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white/80 ring-1 ring-white/20">
                    ✨ Over Vagas PRO
                </div>
                <h1 className="mb-4 text-4xl font-black tracking-tight md:text-5xl">
                    Encontre sua próxima oportunidade
                </h1>
                <p className="mx-auto max-w-xl text-lg text-white/70">
                    Vagas selecionadas nas melhores empresas da região.
                </p>
            </div>

            {/* Filtros */}
            <div className="mx-auto max-w-5xl px-6 pb-8">
                <div className="flex flex-col gap-3 rounded-2xl bg-white/10 p-4 backdrop-blur-sm ring-1 ring-white/10 md:flex-row">
                    <input
                        className="flex-1 rounded-xl bg-white/10 px-4 py-2.5 text-white placeholder-white/40 outline-none ring-1 ring-white/20 focus:ring-white/50"
                        placeholder="Buscar por cargo..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <input
                        className="w-full rounded-xl bg-white/10 px-4 py-2.5 text-white placeholder-white/40 outline-none ring-1 ring-white/20 focus:ring-white/50 md:w-48"
                        placeholder="Cidade..."
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                    />
                    <select
                        className="w-full rounded-xl bg-white/10 px-4 py-2.5 text-white outline-none ring-1 ring-white/20 focus:ring-white/50 md:w-44"
                        value={workModel}
                        onChange={(e) => setWorkModel(e.target.value)}
                    >
                        <option value="" className="bg-slate-800">Modalidade</option>
                        <option value="Remoto" className="bg-slate-800">Remoto</option>
                        <option value="Híbrido" className="bg-slate-800">Híbrido</option>
                        <option value="Presencial" className="bg-slate-800">Presencial</option>
                    </select>
                    <button
                        onClick={fetchJobs}
                        className="rounded-xl bg-red-600 px-6 py-2.5 font-semibold text-white transition hover:bg-red-500"
                    >
                        Buscar
                    </button>
                </div>
            </div>

            {/* Lista de Vagas */}
            <div className="mx-auto max-w-5xl px-6 pb-20">
                {loading ? (
                    <div className="py-20 text-center text-white/50">Carregando vagas...</div>
                ) : jobs.length === 0 ? (
                    <div className="py-20 text-center text-white/50">Nenhuma vaga encontrada.</div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {jobs.map((job) => (
                            <Link
                                key={job.id}
                                to={`/oportunidades/${job.id}`}
                                className="group rounded-2xl bg-white/5 p-5 ring-1 ring-white/10 transition hover:bg-white/10 hover:ring-white/20"
                            >
                                <div className="mb-3 flex items-start justify-between gap-2">
                                    <div>
                                        <h2 className="font-bold text-white group-hover:text-red-300 transition">
                                            {job.title}
                                        </h2>
                                        <p className="text-sm text-white/60">{job.client?.nome_fantasia}</p>
                                    </div>
                                    {job.hiring_type && (
                                        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${hiringBadge[job.hiring_type] ?? "bg-gray-100 text-gray-700"}`}>
                                            {job.hiring_type}
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-3 text-sm text-white/60">
                                    {job.city && <span>📍 {job.city}</span>}
                                    {job.work_model && <span>{workModelIcon[job.work_model] ?? "🏢"} {job.work_model}</span>}
                                    {job.salary_range && <span>💰 {job.salary_range}</span>}
                                </div>
                                <div className="mt-4 flex items-center justify-between">
                                    <span className="text-xs text-white/40">
                                        {job.published_at ? new Date(job.published_at).toLocaleDateString("pt-BR") : ""}
                                    </span>
                                    <span className="text-xs font-semibold text-red-400 group-hover:underline">
                                        Ver detalhes →
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
