// Página Pública: Detalhes da Vaga + Formulário de Candidatura
import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.trim() ?? "https://api.overmelhinho.com.br/api";

interface Job {
    id: number;
    title: string;
    description: string;
    city: string;
    hiring_type: string;
    work_model: string;
    salary_range: string;
    published_at: string;
    client: { nome_fantasia: string };
}

export default function PublicJobDetail() {
    const { id } = useParams<{ id: string }>();
    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");
    const fileRef = useRef<HTMLInputElement>(null);

    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        linkedin_url: "",
    });

    useEffect(() => {
        fetch(`${API_BASE}/v1/jobs/public/${id}`)
            .then((r) => r.json())
            .then((data) => { setJob(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        const file = fileRef.current?.files?.[0];
        if (!file) { setError("Selecione um currículo (PDF ou Word)."); return; }

        setSubmitting(true);
        const fd = new FormData();
        fd.append("name", form.name);
        fd.append("email", form.email);
        fd.append("phone", form.phone);
        fd.append("linkedin_url", form.linkedin_url);
        fd.append("resume", file);

        const res = await fetch(`${API_BASE}/v1/jobs/${id}/apply`, { method: "POST", body: fd });
        const data = await res.json();
        setSubmitting(false);

        if (res.ok) {
            setSuccess(true);
        } else {
            setError(data.message || "Erro ao enviar candidatura.");
        }
    };

    if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Carregando...</div>;
    if (!job) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Vaga não encontrada.</div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-950 to-slate-900 px-4 py-12">
            <div className="mx-auto max-w-3xl">
                <Link to="/oportunidades" className="mb-6 inline-flex items-center gap-1 text-sm text-white/60 hover:text-white">
                    ← Voltar às vagas
                </Link>

                {/* Card da Vaga */}
                <div className="mb-8 rounded-2xl bg-white/5 p-8 ring-1 ring-white/10">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                        {job.hiring_type && (
                            <span className="rounded-full bg-red-600/20 px-3 py-0.5 text-xs font-semibold text-red-300">
                                {job.hiring_type}
                            </span>
                        )}
                        {job.work_model && (
                            <span className="rounded-full bg-white/10 px-3 py-0.5 text-xs font-semibold text-white/70">
                                {job.work_model}
                            </span>
                        )}
                    </div>
                    <h1 className="mb-1 text-3xl font-black text-white">{job.title}</h1>
                    <p className="mb-4 text-white/60">{job.client?.nome_fantasia}</p>

                    <div className="mb-6 flex flex-wrap gap-4 text-sm text-white/60">
                        {job.city && <span>📍 {job.city}</span>}
                        {job.salary_range && <span>💰 {job.salary_range}</span>}
                    </div>

                    {job.description && (
                        <div
                            className="prose prose-invert max-w-none text-white/80"
                            dangerouslySetInnerHTML={{ __html: job.description }}
                        />
                    )}
                </div>

                {/* Formulário de Candidatura */}
                <div className="rounded-2xl bg-white/5 p-8 ring-1 ring-white/10">
                    <h2 className="mb-6 text-xl font-bold text-white">Candidatar-se a esta vaga</h2>

                    {success ? (
                        <div className="rounded-xl bg-green-500/20 p-6 text-center text-green-300">
                            <div className="mb-2 text-3xl">🎉</div>
                            <p className="font-semibold">Candidatura enviada com sucesso!</p>
                            <p className="mt-1 text-sm text-green-400">Entraremos em contato em breve.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-white/70">Nome completo *</label>
                                    <input
                                        required
                                        className="w-full rounded-xl bg-white/10 px-4 py-2.5 text-white placeholder-white/30 outline-none ring-1 ring-white/20 focus:ring-red-500"
                                        placeholder="Seu nome"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-white/70">E-mail *</label>
                                    <input
                                        required
                                        type="email"
                                        className="w-full rounded-xl bg-white/10 px-4 py-2.5 text-white placeholder-white/30 outline-none ring-1 ring-white/20 focus:ring-red-500"
                                        placeholder="seu@email.com"
                                        value={form.email}
                                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-white/70">WhatsApp</label>
                                    <input
                                        className="w-full rounded-xl bg-white/10 px-4 py-2.5 text-white placeholder-white/30 outline-none ring-1 ring-white/20 focus:ring-red-500"
                                        placeholder="(51) 99999-9999"
                                        value={form.phone}
                                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-white/70">LinkedIn</label>
                                    <input
                                        className="w-full rounded-xl bg-white/10 px-4 py-2.5 text-white placeholder-white/30 outline-none ring-1 ring-white/20 focus:ring-red-500"
                                        placeholder="linkedin.com/in/..."
                                        value={form.linkedin_url}
                                        onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-white/70">Currículo (PDF ou Word) *</label>
                                <input
                                    ref={fileRef}
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    className="w-full rounded-xl bg-white/10 px-4 py-2.5 text-white/70 outline-none ring-1 ring-white/20 file:mr-4 file:rounded-lg file:border-0 file:bg-red-600 file:px-3 file:py-1 file:text-sm file:font-semibold file:text-white hover:file:bg-red-500"
                                />
                            </div>

                            {error && (
                                <div className="rounded-xl bg-red-500/20 px-4 py-3 text-sm text-red-300">{error}</div>
                            )}

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full rounded-xl bg-red-600 py-3 font-bold text-white transition hover:bg-red-500 disabled:opacity-50"
                            >
                                {submitting ? "Enviando..." : "Enviar Candidatura"}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
