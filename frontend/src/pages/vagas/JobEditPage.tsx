// Página Admin: Editar Vaga — Wizard 4 steps (igual ao create, mas pré-preenchido)
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import api from "@/services/api";
import toast from "react-hot-toast";
import { useClientesLite } from "@/hooks/useClientesLite";
import { useCidades } from "@/hooks/useCidades";
import type { Cidade } from "@/hooks/useCidades";

/* ═══════════════════════════════════════
   Helpers
═══════════════════════════════════════ */
function phoneMask(raw: string) {
    const d = raw.replace(/\D/g, "").slice(0, 11);
    if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").replace(/-$/, "");
    return d.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").replace(/-$/, "");
}

/* ═══════════════════════════════════════
   Constants
═══════════════════════════════════════ */
const AREAS = [
    "Administração", "Alimentação", "Arquitetura e Urbanismo", "Artes e Design",
    "Ciências Biológicas", "Ciências da Saúde", "Ciências Exatas", "Ciências Humanas",
    "Ciências Sociais", "Comunicação", "Construção Civil", "Contabilidade",
    "Direito", "Educação", "Engenharia", "Estética e Beleza",
    "Hotelaria e Turismo", "Informática e TI", "Jurídico", "Logística",
    "Marketing", "Meio Ambiente", "Recursos Humanos", "Saúde",
    "Segurança", "Serviços Gerais", "Vendas e Comercial", "Outros",
];
const EDUCATION = [
    "Sem exigência", "Ensino Fundamental", "Ensino Médio", "Ensino Médio Técnico",
    "Ensino Superior Incompleto", "Ensino Superior Completo", "Pós-graduação", "Mestrado", "Doutorado",
];
const STATUS_LABEL: Record<string, string> = {
    Draft: "Rascunho",
    Published: "Publicada",
    Paused: "Pausada",
    Closed: "Encerrada",
};

const STEPS = [
    { label: "Dados da Empresa", icon: "🏢" },
    { label: "Informações da Vaga", icon: "📋" },
    { label: "Habilidades", icon: "🎯" },
    { label: "Publicação", icon: "🚀" },
];

/* ═══════════════════════════════════════
   Rich Text Editor
═══════════════════════════════════════ */
function RichEditor({
    value, onChange, placeholder = "Digite aqui...",
}: { value: string; onChange: (v: string) => void; placeholder?: string }) {
    const ref = useRef<HTMLDivElement>(null);
    const initialized = useRef(false);

    useEffect(() => {
        if (ref.current && !initialized.current) {
            ref.current.innerHTML = value || "";
            initialized.current = true;
        }
    }, [value]);

    function exec(cmd: string, val?: string) {
        document.execCommand(cmd, false, val);
        ref.current?.focus();
        if (ref.current) onChange(ref.current.innerHTML);
    }

    const btn = (label: string, cmd: string, arg?: string) => (
        <button key={label} type="button" onMouseDown={(e) => { e.preventDefault(); exec(cmd, arg); }}
            className="rounded px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200 transition">
            {label}
        </button>
    );

    return (
        <div className="overflow-hidden rounded-xl border border-slate-200 focus-within:border-red-400 focus-within:ring-2 focus-within:ring-red-100 transition bg-white">
            <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-100 bg-slate-50 px-2 py-1.5">
                {btn("B", "bold")}{btn("I", "italic")}{btn("U", "underline")}
                <span className="mx-1 text-slate-200">│</span>
                {btn("H2", "formatBlock", "h2")}{btn("P", "formatBlock", "p")}
                <span className="mx-1 text-slate-200">│</span>
                {btn("• Lista", "insertUnorderedList")}{btn("1. Lista", "insertOrderedList")}
                <span className="mx-1 text-slate-200">│</span>
                {btn("↩", "undo")}{btn("↪", "redo")}
            </div>
            <div ref={ref} contentEditable suppressContentEditableWarning
                data-placeholder={placeholder}
                className="min-h-[140px] px-4 py-3 text-sm text-slate-800 outline-none prose prose-sm max-w-none empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 empty:before:pointer-events-none"
                onInput={() => { if (ref.current) onChange(ref.current.innerHTML); }}
            />
        </div>
    );
}

/* ═══════════════════════════════════════
   Cidade single select
═══════════════════════════════════════ */
function CidadeSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    const { data: cidades = [] } = useCidades();
    const [search, setSearch] = useState("");
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
        document.addEventListener("mousedown", close);
        return () => document.removeEventListener("mousedown", close);
    }, []);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return cidades.filter((c: Cidade) => `${c.nome} ${c.uf ?? ""}`.toLowerCase().includes(q)).slice(0, 80);
    }, [cidades, search]);

    return (
        <div ref={ref} className="relative">
            <input
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition"
                placeholder="Buscar cidade (nome/UF)..."
                value={search} onFocus={() => setOpen(true)}
                onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
                onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}
            />
            {open && (
                <div className="absolute left-0 right-0 z-30 mt-1 max-h-52 overflow-auto rounded-xl border border-slate-200 bg-white shadow-xl">
                    {filtered.map((c: Cidade) => {
                        const label = `${c.nome}${c.uf ? `-${c.uf}` : ""}`;
                        return (
                            <button key={c.id} type="button" onMouseDown={(e) => e.preventDefault()}
                                onClick={() => { onChange(label); setSearch(""); setOpen(false); }}
                                className={`w-full px-4 py-2.5 text-left text-sm transition hover:bg-red-50 ${value === label ? "bg-red-50 font-semibold text-red-700" : "text-slate-800"}`}>
                                {c.nome}{c.uf && <span className="text-slate-400">-{c.uf}</span>}
                            </button>
                        );
                    })}
                </div>
            )}
            {value && (
                <div className="mt-2 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 px-3 py-1 text-xs font-medium text-red-700">
                        📍 {value}
                        <button type="button" onClick={() => onChange("")} className="text-red-400 hover:text-red-600 font-bold">×</button>
                    </span>
                </div>
            )}
        </div>
    );
}

/* ═══════════════════════════════════════
   Client combobox
═══════════════════════════════════════ */
function ClienteCombobox({ clienteId, clienteName, onSelect }: {
    clienteId: string; clienteName: string; onSelect: (id: string, name: string) => void;
}) {
    const [search, setSearch] = useState("");
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const { data, isLoading } = useClientesLite({ search, per_page: 20 });
    const options = data?.rows ?? [];

    useEffect(() => {
        const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
        document.addEventListener("mousedown", close);
        return () => document.removeEventListener("mousedown", close);
    }, []);

    return (
        <div ref={ref} className="relative">
            <input
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition"
                placeholder="Buscar cliente (nome, CNPJ…)"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
                onFocus={() => setOpen(true)}
                onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); if (e.key === "Escape") setOpen(false); }}
            />
            {open && (
                <div className="absolute left-0 right-0 z-30 mt-1 max-h-64 overflow-auto rounded-xl border border-slate-200 bg-white shadow-xl">
                    {isLoading && <div className="p-3 text-sm text-slate-400">Buscando...</div>}
                    {!isLoading && options.length === 0 && <div className="p-4 text-sm text-slate-400">Nenhum cliente encontrado.</div>}
                    {options.map((c) => {
                        const label = c.nome_fantasia || c.razao_social || `#${c.id}`;
                        const active = String(c.id) === clienteId;
                        return (
                            <button key={c.id} type="button" onMouseDown={(e) => e.preventDefault()}
                                onClick={() => { onSelect(String(c.id), label); setSearch(""); setOpen(false); }}
                                className={`w-full px-4 py-3 text-left text-sm transition ${active ? "bg-red-50" : "hover:bg-slate-50"}`}>
                                <div className="font-medium text-slate-900">{label}</div>
                                {c.cpf_cnpj && <div className="text-xs text-slate-400">{c.cpf_cnpj}</div>}
                            </button>
                        );
                    })}
                </div>
            )}
            {clienteName && !open && (
                <div className="mt-2 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-medium text-emerald-700">
                        ✅ {clienteName}
                    </span>
                    <button type="button" className="text-xs text-slate-400 hover:text-red-500"
                        onClick={() => { onSelect("", ""); setSearch(""); }}>Trocar</button>
                </div>
            )}
        </div>
    );
}

/* ═══════════════════════════════════════
   Cargo creatable combobox
═══════════════════════════════════════ */
function CargoCombobox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    const [search, setSearch] = useState("");
    const [open, setOpen] = useState(false);
    const [options, setOptions] = useState<{ id: number; name: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const fetchRoles = useCallback(async (q: string) => {
        setLoading(true);
        try {
            const { data } = await api.get("/v1/job-roles", { params: { search: q } });
            setOptions(Array.isArray(data) ? data : []);
        } catch { /* ignore */ } finally { setLoading(false); }
    }, []);

    useEffect(() => {
        const t = setTimeout(() => fetchRoles(search), 200);
        return () => clearTimeout(t);
    }, [search, fetchRoles]);

    useEffect(() => {
        const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
        document.addEventListener("mousedown", close);
        return () => document.removeEventListener("mousedown", close);
    }, []);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return options.filter((o) => o.name.toLowerCase().includes(q));
    }, [options, search]);

    const exactMatch = options.some((o) => o.name.toLowerCase() === search.toLowerCase());
    const showCreate = search.trim().length >= 2 && !exactMatch;

    async function handleCreate() {
        setCreating(true);
        try {
            const { data } = await api.post("/v1/job-roles", { name: search.trim() });
            toast.success(`Cargo "${data.name}" criado!`);
            onChange(data.name); setSearch(""); setOpen(false); fetchRoles("");
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Erro ao criar cargo.");
        } finally { setCreating(false); }
    }

    return (
        <div ref={ref} className="relative">
            <input
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition"
                placeholder="Buscar ou criar cargo..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
                onFocus={() => setOpen(true)}
                onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); if (e.key === "Enter") e.preventDefault(); }}
            />
            {open && (
                <div className="absolute left-0 right-0 z-30 mt-1 max-h-64 overflow-auto rounded-xl border border-slate-200 bg-white shadow-xl">
                    {loading && <div className="p-3 text-sm text-slate-400">Carregando...</div>}
                    {!loading && filtered.length === 0 && !showCreate && <div className="p-3 text-sm text-slate-400">Digite para buscar cargos...</div>}
                    {!loading && filtered.map((o) => (
                        <button key={o.id} type="button" onMouseDown={(e) => e.preventDefault()}
                            onClick={() => { onChange(o.name); setSearch(""); setOpen(false); }}
                            className={`w-full px-4 py-2.5 text-left text-sm transition hover:bg-slate-50 ${value === o.name ? "bg-red-50 font-semibold text-red-700" : "text-slate-800"}`}>
                            {o.name}
                        </button>
                    ))}
                    {showCreate && (
                        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={handleCreate} disabled={creating}
                            className="w-full px-4 py-3 text-left text-sm text-red-600 font-semibold border-t border-slate-100 hover:bg-red-50 transition disabled:opacity-50 flex items-center gap-2">
                            <span className="text-lg leading-none">+</span>
                            {creating ? "Criando..." : <>Criar cargo: <strong>"{search.trim()}"</strong></>}
                        </button>
                    )}
                </div>
            )}
            {value && !open && (
                <div className="mt-2 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                        💼 {value}
                    </span>
                    <button type="button" className="text-xs text-slate-400 hover:text-red-500"
                        onClick={() => { onChange(""); setSearch(""); }}>Trocar</button>
                </div>
            )}
        </div>
    );
}

/* ═══════════════════════════════════════
   Step Bar
═══════════════════════════════════════ */
function StepBar({ current }: { current: number }) {
    return (
        <div className="mb-8">
            <div className="relative mb-6">
                <div className="absolute top-4 left-0 right-0 h-0.5 bg-slate-200" />
                <div className="absolute top-4 left-0 h-0.5 bg-red-600 transition-all duration-500"
                    style={{ width: `${(current / (STEPS.length - 1)) * 100}%` }} />
                <div className="relative flex justify-between">
                    {STEPS.map((s, i) => {
                        const done = i < current; const active = i === current;
                        return (
                            <div key={i} className="flex flex-col items-center gap-2">
                                <div className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold border-2 transition-all duration-300
                  ${done ? "bg-red-600 border-red-600 text-white" : ""}
                  ${active ? "bg-red-600 border-red-600 text-white shadow-lg shadow-red-200 scale-110" : ""}
                  ${!done && !active ? "bg-white border-slate-300 text-slate-400" : ""}`}>
                                    {done ? "✓" : i + 1}
                                </div>
                                <span className={`text-xs font-medium transition-colors ${active ? "text-red-600" : done ? "text-slate-700" : "text-slate-400"}`}>
                                    {s.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════
   Form State
═══════════════════════════════════════ */
interface FormState {
    client_id: string; client_name: string;
    contact_email: string; contact_whatsapp: string;
    title: string; description: string;
    vacancies: string; expires_at: string; city: string;
    area: string; role: string; education_level: string;
    hiring_type: string; work_model: string; salary_range: string;
    experience_required: string; status: string;
}

/* ═══════════════════════════════════════
   Main Page
═══════════════════════════════════════ */
export default function JobEditPage() {
    const { jobId } = useParams<{ jobId: string }>();
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [loadingJob, setLoadingJob] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState<FormState>({
        client_id: "", client_name: "",
        contact_email: "", contact_whatsapp: "",
        title: "", description: "",
        vacancies: "1", expires_at: "", city: "",
        area: "", role: "", education_level: "",
        hiring_type: "", work_model: "", salary_range: "",
        experience_required: "", status: "Draft",
    });

    const set = <K extends keyof FormState>(field: K, value: string) =>
        setForm((prev) => ({ ...prev, [field]: value }));

    /* Load job data on mount */
    useEffect(() => {
        if (!jobId) return;
        api.get(`/v1/jobs/${jobId}`)
            .then(({ data }) => {
                const j = data;
                setForm({
                    client_id: String(j.client_id ?? ""),
                    client_name: j.client?.nome_fantasia || j.client?.razao_social || `#${j.client_id}`,
                    contact_email: j.contact_email ?? "",
                    contact_whatsapp: j.contact_whatsapp ?? "",
                    title: j.title ?? "",
                    description: j.description ?? "",
                    vacancies: String(j.vacancies ?? 1),
                    expires_at: j.expires_at ? j.expires_at.substring(0, 10) : "",
                    city: j.city ?? "",
                    area: j.area ?? "",
                    role: j.role ?? "",
                    education_level: j.education_level ?? "",
                    hiring_type: j.hiring_type ?? "",
                    work_model: j.work_model ?? "",
                    salary_range: j.salary_range ?? "",
                    experience_required: j.experience_required ?? "",
                    status: j.status ?? "Draft",
                });
            })
            .catch(() => toast.error("Erro ao carregar vaga."))
            .finally(() => setLoadingJob(false));
    }, [jobId]);

    async function handleClientSelect(id: string, name: string) {
        setForm((prev) => ({ ...prev, client_id: id, client_name: name, contact_email: "", contact_whatsapp: "" }));
        if (!id) return;
        try {
            const { data } = await api.get(`/v1/clientes/${id}/contatos`);
            const c = Array.isArray(data?.data) ? data.data[0] : data?.data;
            if (c) {
                if (c.email_principal) set("contact_email", c.email_principal);
                const ph = c.whatsapp_principal || c.telefone_principal || "";
                if (ph) set("contact_whatsapp", phoneMask(ph));
            }
        } catch { /* silently ignore */ }
    }

    function canAdvance(): boolean {
        if (step === 0) return !!form.client_id;
        if (step === 1) return !!form.title;
        if (step === 2) return !!form.area && !!form.role && !!form.hiring_type && !!form.work_model && !!form.salary_range;
        return true;
    }

    function next(e: React.FormEvent) {
        e.preventDefault();
        if (!canAdvance()) { toast.error("Preencha os campos obrigatórios antes de continuar."); return; }
        if (step < STEPS.length - 1) setStep((s) => s + 1);
    }

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put(`/v1/jobs/${jobId}`, {
                ...form,
                client_id: Number(form.client_id),
                vacancies: Number(form.vacancies) || 1,
                expires_at: form.expires_at || null,
            });
            toast.success("Vaga atualizada com sucesso!");
            navigate("/vagas");
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Erro ao salvar vaga.");
        } finally { setSaving(false); }
    }

    const inp = "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition";
    const lbl = "mb-1.5 block text-sm font-medium text-slate-600";

    if (loadingJob) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center space-y-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent mx-auto" />
                    <p className="text-sm text-slate-500">Carregando vaga...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            {/* Breadcrumb */}
            <div className="mb-6 flex items-center gap-2 text-sm">
                <Link to="/vagas" className="text-slate-400 hover:text-red-600 transition">← Vagas</Link>
                <span className="text-slate-300">/</span>
                <span className="font-semibold text-slate-800">Editar Vaga #{jobId}</span>
            </div>

            <div className="mx-auto max-w-2xl">
                <StepBar current={step} />

                <form onSubmit={step === STEPS.length - 1 ? submit : next}>
                    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                        {/* Section header */}
                        <div className="mb-6 flex items-center gap-3">
                            <span className="text-2xl">{STEPS[step].icon}</span>
                            <div>
                                <p className="text-xs font-medium text-red-500 uppercase tracking-wider">
                                    Etapa {step + 1} de {STEPS.length}
                                </p>
                                <h2 className="text-lg font-bold text-slate-800">{STEPS[step].label}</h2>
                            </div>
                        </div>

                        {/* ── STEP 0 ── */}
                        {step === 0 && (
                            <div className="space-y-5">
                                <div>
                                    <label className={lbl}>Cliente *</label>
                                    <ClienteCombobox clienteId={form.client_id} clienteName={form.client_name} onSelect={handleClientSelect} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={lbl}>E-mail para candidatos</label>
                                        <input type="email" className={inp} placeholder="rh@empresa.com.br"
                                            value={form.contact_email} onChange={(e) => set("contact_email", e.target.value)} />
                                    </div>
                                    <div>
                                        <label className={lbl}>WhatsApp / Telefone</label>
                                        <input className={inp} placeholder="(54) 99999-9999"
                                            value={form.contact_whatsapp} onChange={(e) => set("contact_whatsapp", phoneMask(e.target.value))} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── STEP 1 ── */}
                        {step === 1 && (
                            <div className="space-y-5">
                                <div>
                                    <label className={lbl}>Título da Vaga *</label>
                                    <input required className={inp} placeholder="Ex: Cozinheiro(a)"
                                        value={form.title} onChange={(e) => set("title", e.target.value)} />
                                </div>
                                <div>
                                    <label className={lbl}>Descrição</label>
                                    <RichEditor value={form.description} onChange={(v) => set("description", v)}
                                        placeholder="Descreva as responsabilidades, requisitos e benefícios..." />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={lbl}>Número de Vagas</label>
                                        <select className={inp} value={form.vacancies} onChange={(e) => set("vacancies", e.target.value)}>
                                            {[1, 2, 3, 4, 5, 10, 15, 20].map((n) => (
                                                <option key={n} value={n}>{n} {n === 1 ? "vaga" : "vagas"}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={lbl}>Data de Validade</label>
                                        <input type="date" className={inp} value={form.expires_at}
                                            onChange={(e) => set("expires_at", e.target.value)} />
                                    </div>
                                </div>
                                <div>
                                    <label className={lbl}>Cidade</label>
                                    <CidadeSelect value={form.city} onChange={(v) => set("city", v)} />
                                </div>
                            </div>
                        )}

                        {/* ── STEP 2 ── */}
                        {step === 2 && (
                            <div className="space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={lbl}>Área Profissional *</label>
                                        <select required className={inp} value={form.area} onChange={(e) => set("area", e.target.value)}>
                                            <option value="">Selecione...</option>
                                            {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={lbl}>Cargo *</label>
                                        <CargoCombobox value={form.role} onChange={(v) => set("role", v)} />
                                    </div>
                                </div>
                                <div>
                                    <label className={lbl}>Nível de Escolaridade</label>
                                    <select className={inp} value={form.education_level} onChange={(e) => set("education_level", e.target.value)}>
                                        <option value="">Selecione...</option>
                                        {EDUCATION.map((l) => <option key={l} value={l}>{l}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={lbl}>Tipo de Contrato *</label>
                                        <select required className={inp} value={form.hiring_type} onChange={(e) => set("hiring_type", e.target.value)}>
                                            <option value="">Selecione...</option>
                                            <option value="Efetivo CLT">Efetivo CLT</option>
                                            <option value="PJ">PJ</option>
                                            <option value="Estágio">Estágio</option>
                                            <option value="Freelancer">Freelancer</option>
                                            <option value="Temporário">Temporário</option>
                                            <option value="Aprendiz">Aprendiz</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className={lbl}>Método de Trabalho *</label>
                                        <select required className={inp} value={form.work_model} onChange={(e) => set("work_model", e.target.value)}>
                                            <option value="">Selecione...</option>
                                            <option value="Presencial">Presencial</option>
                                            <option value="Híbrido">Híbrido</option>
                                            <option value="Remoto">Remoto</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className={lbl}>Faixa Salarial *</label>
                                    <select required className={inp} value={form.salary_range} onChange={(e) => set("salary_range", e.target.value)}>
                                        <option value="">Selecione...</option>
                                        <option value="A Combinar">A Combinar</option>
                                        <option value="Até R$ 1.500">Até R$ 1.500</option>
                                        <option value="R$ 1.500 – R$ 2.500">R$ 1.500 – R$ 2.500</option>
                                        <option value="R$ 2.500 – R$ 4.000">R$ 2.500 – R$ 4.000</option>
                                        <option value="R$ 4.000 – R$ 6.000">R$ 4.000 – R$ 6.000</option>
                                        <option value="R$ 6.000 – R$ 10.000">R$ 6.000 – R$ 10.000</option>
                                        <option value="Acima de R$ 10.000">Acima de R$ 10.000</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={lbl}>Experiência Exigida</label>
                                    <RichEditor value={form.experience_required} onChange={(v) => set("experience_required", v)}
                                        placeholder="Descreva a experiência necessária..." />
                                </div>
                            </div>
                        )}

                        {/* ── STEP 3 ── */}
                        {step === 3 && (
                            <div className="space-y-5">
                                <div>
                                    <label className={lbl}>Status</label>
                                    <select className={inp} value={form.status} onChange={(e) => set("status", e.target.value)}>
                                        <option value="Draft">Rascunho</option>
                                        <option value="Published">Publicada</option>
                                        <option value="Paused">Pausada</option>
                                        <option value="Closed">Encerrada</option>
                                    </select>
                                </div>
                                {/* Summary */}
                                <div className="rounded-xl bg-slate-50 border border-slate-200 p-5 text-sm">
                                    <h4 className="font-semibold text-slate-700 mb-3">📋 Resumo da Vaga</h4>
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-slate-600">
                                        <div><span className="text-slate-400">Cliente:</span> <strong className="text-slate-800">{form.client_name || `#${form.client_id}`}</strong></div>
                                        <div><span className="text-slate-400">Título:</span> <strong className="text-slate-800">{form.title || "—"}</strong></div>
                                        <div><span className="text-slate-400">Vagas:</span> <strong className="text-slate-800">{form.vacancies}</strong></div>
                                        <div><span className="text-slate-400">Cidade:</span> <strong className="text-slate-800">{form.city || "—"}</strong></div>
                                        <div><span className="text-slate-400">Área:</span> <strong className="text-slate-800">{form.area || "—"}</strong></div>
                                        <div><span className="text-slate-400">Cargo:</span> <strong className="text-slate-800">{form.role || "—"}</strong></div>
                                        <div><span className="text-slate-400">Contrato:</span> <strong className="text-slate-800">{form.hiring_type || "—"}</strong></div>
                                        <div><span className="text-slate-400">Modalidade:</span> <strong className="text-slate-800">{form.work_model || "—"}</strong></div>
                                        <div><span className="text-slate-400">Salário:</span> <strong className="text-slate-800">{form.salary_range || "—"}</strong></div>
                                        <div><span className="text-slate-400">Status:</span> <strong className="text-slate-800">{STATUS_LABEL[form.status] ?? form.status}</strong></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Navigation */}
                    <div className="mt-6 flex items-center justify-between">
                        <div>
                            {step > 0 ? (
                                <button type="button" onClick={() => setStep((s) => s - 1)}
                                    className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition">
                                    ← Anterior
                                </button>
                            ) : (
                                <Link to="/vagas" className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition">
                                    Cancelar
                                </Link>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-slate-400">Etapa {step + 1} de {STEPS.length}</span>
                            {step < STEPS.length - 1 ? (
                                <button type="submit"
                                    className="rounded-xl bg-red-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-500 transition">
                                    Próximo →
                                </button>
                            ) : (
                                <button type="submit" disabled={saving}
                                    className="rounded-xl bg-red-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-50 transition">
                                    {saving ? "Salvando…" : "✓ Salvar Alterações"}
                                </button>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
