'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import api from '@/services/api';
import {
    Search,
    MapPin,
    Briefcase,
    Clock,
    Filter,
    ArrowLeft,
    Building2,
    X,
    ChevronDown,
    CheckSquare,
    Square,
    ExternalLink,
    Phone,
    Mail,
    Tag
} from 'lucide-react';
import { useRouter } from 'next/navigation';

// ── TIPOS ─────────────────────────────────────────────────────────
interface Job {
    id: number;
    title: string;
    company: string;
    location: string;
    salary: string;
    salaryNum: number; // para ordenação
    type: 'CLT' | 'PJ' | 'Freelancer' | 'Estágio';
    date: string;
    daysAgo: number;   // para ordenação
    tags: string[];
    category: string;
    desc: string;
    requirements: string[];
    benefits: string[];
    contact: string;
    logo?: string;
}

// ── DADOS ─────────────────────────────────────────────────────────
// Os dados agora são puxados da API. (Mock removido)
const CATEGORIES = ['Vendas', 'Administrativo', 'Indústria', 'TI & Digital', 'Logística', 'Serviços', 'Outros'];

// ── MÁSCARA FONE ──────────────────────────────────────────────────
function maskPhone(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 11)
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    return value;
}

// ── JOB MODAL ─────────────────────────────────────────────────────
function JobModal({ job, onClose }: { job: Job; onClose: () => void }) {
    const [isApplying, setIsApplying] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        resume: null as File | null
    });
    const [errorMsg, setErrorMsg] = useState('');

    const handleApply = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');

        if (!formData.name || !formData.email || !formData.resume) {
            setErrorMsg('Por favor, preencha nome, e-mail e anexe o currículo.');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = new FormData();
            payload.append('name', formData.name);
            payload.append('email', formData.email);
            payload.append('phone', formData.phone);
            payload.append('resume', formData.resume);
            
            await api.post(`/jobs/${job.id}/apply`, payload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            setIsSuccess(true);
        } catch (error: any) {
            setErrorMsg(error.response?.data?.message || 'Erro ao enviar candidatura. Tente novamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

            {/* Card */}
            <div
                className="relative w-full sm:max-w-2xl bg-white rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl overflow-y-auto max-h-[90vh] z-10"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 bg-white/90 backdrop-blur-sm border-b border-gray-50 px-8 py-6 flex items-start justify-between gap-4 rounded-t-[3rem]">
                    <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">{job.title}</h2>
                            <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded">Nova</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm font-bold text-gray-400 flex-wrap">
                            <span className="flex items-center gap-1"><Briefcase size={14} />{job.company}</span>
                            <span className="flex items-center gap-1"><MapPin size={14} className="text-brand-red" />{job.location}</span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 hover:bg-brand-red hover:text-white transition-colors flex-shrink-0"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="px-8 py-8 space-y-8">
                    {!isApplying ? (
                        <>
                            {/* Salário + Tipo + Horário */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                <div className="bg-gray-50 rounded-2xl p-5 space-y-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Salário</p>
                                    <p className="font-black text-gray-900">{job.salary}</p>
                                </div>
                                <div className="bg-gray-50 rounded-2xl p-5 space-y-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Contrato</p>
                                    <p className="font-black text-gray-900">{job.type}</p>
                                </div>
                                <div className="bg-gray-50 rounded-2xl p-5 space-y-1 col-span-2 sm:col-span-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Publicada</p>
                                    <p className="font-black text-gray-900">{job.date}</p>
                                </div>
                            </div>

                            {/* Tags */}
                            <div className="flex flex-wrap gap-2">
                                {job.tags.map(tag => (
                                    <span key={tag} className="px-3 py-1.5 bg-brand-red/5 text-brand-red text-[10px] font-black uppercase tracking-widest rounded-lg">{tag}</span>
                                ))}
                            </div>

                            {/* Descrição */}
                            <div className="space-y-3">
                                <h3 className="font-black text-gray-900 uppercase tracking-widest text-[10px]">Sobre a Vaga</h3>
                                <p className="text-gray-500 font-medium leading-relaxed">{job.desc}</p>
                            </div>

                            {/* Requisitos */}
                            <div className="space-y-3">
                                <h3 className="font-black text-gray-900 uppercase tracking-widest text-[10px]">Requisitos</h3>
                                <ul className="space-y-2">
                                    {job.requirements.map((r, i) => (
                                        <li key={i} className="flex items-center gap-3 text-gray-600 font-medium text-sm">
                                            <div className="w-1.5 h-1.5 rounded-full bg-brand-red flex-shrink-0" />
                                            {r}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Benefícios */}
                            <div className="space-y-3">
                                <h3 className="font-black text-gray-900 uppercase tracking-widest text-[10px]">Benefícios</h3>
                                <div className="flex flex-wrap gap-2">
                                    {job.benefits.map((b, i) => (
                                        <span key={i} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-black rounded-lg">{b}</span>
                                    ))}
                                </div>
                            </div>

                            {/* CTA Section */}
                            <div className="bg-gray-900 rounded-[2rem] p-8 space-y-4">
                                <p className="text-white font-black text-lg">Interessado(a)?</p>
                                <p className="text-gray-400 text-sm font-medium">Preencha seus dados e anexe seu currículo para esta vaga.</p>
                                <button
                                    onClick={() => setIsApplying(true)}
                                    className="w-full bg-brand-red text-white py-4 rounded-xl font-black text-lg flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-red-900/30"
                                >
                                    Quero me Candidatar
                                </button>
                            </div>
                        </>
                    ) : isSuccess ? (
                        <div className="bg-emerald-50 rounded-[2rem] p-10 text-center space-y-4">
                            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckSquare size={40} />
                            </div>
                            <h3 className="text-2xl font-black text-emerald-900 tracking-tight">Currículo Enviado!</h3>
                            <p className="text-emerald-700 font-medium">Sua candidatura foi enviada com sucesso para a empresa <strong>{job.company}</strong>.</p>
                            <button
                                onClick={onClose}
                                className="mt-6 px-8 py-3 bg-emerald-600 text-white rounded-xl font-black hover:bg-emerald-700 transition-colors"
                            >
                                Fechar
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
                                <button onClick={() => setIsApplying(false)} className="text-gray-400 hover:text-brand-red transition-colors">
                                    <ArrowLeft size={20} />
                                </button>
                                <div>
                                    <h3 className="font-black text-xl text-gray-900">Sua Candidatura</h3>
                                    <p className="text-xs font-bold text-gray-400 tracking-widest uppercase mt-1">Vaga: {job.title}</p>
                                </div>
                            </div>

                            <form onSubmit={handleApply} className="space-y-5">
                                {errorMsg && (
                                    <div className="p-4 bg-red-50 text-brand-red font-bold text-sm rounded-xl border border-red-100">
                                        {errorMsg}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-black text-gray-900 uppercase tracking-widest mb-2">Nome Completo *</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-gray-50 border-2 border-transparent focus:border-brand-red focus:bg-white rounded-xl py-3 px-4 outline-none font-bold text-gray-900 transition-all placeholder:text-gray-300"
                                        placeholder="Seu nome"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-black text-gray-900 uppercase tracking-widest mb-2">E-mail *</label>
                                        <input
                                            type="email"
                                            required
                                            className="w-full bg-gray-50 border-2 border-transparent focus:border-brand-red focus:bg-white rounded-xl py-3 px-4 outline-none font-bold text-gray-900 transition-all placeholder:text-gray-300"
                                            placeholder="seu@email.com"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-gray-900 uppercase tracking-widest mb-2">WhatsApp</label>
                                        <input
                                            type="text"
                                            className="w-full bg-gray-50 border-2 border-transparent focus:border-brand-red focus:bg-white rounded-xl py-3 px-4 outline-none font-bold text-gray-900 transition-all placeholder:text-gray-300"
                                            placeholder="(00) 00000-0000"
                                            value={maskPhone(formData.phone)}
                                            onChange={e => setFormData({ ...formData, phone: maskPhone(e.target.value) })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-900 uppercase tracking-widest mb-2">Anexar Currículo (PDF/Word) *</label>
                                    <div className="relative">
                                        <input
                                            type="file"
                                            required
                                            accept=".pdf,.doc,.docx"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            onChange={e => {
                                                if (e.target.files && e.target.files.length > 0) {
                                                    setFormData({ ...formData, resume: e.target.files[0] });
                                                }
                                            }}
                                        />
                                        <div className={`w-full border-2 border-dashed ${formData.resume ? 'border-brand-red bg-brand-red/5' : 'border-gray-200 bg-gray-50'} rounded-xl p-6 text-center transition-colors pointer-events-none`}>
                                            <div className="flex flex-col items-center gap-2">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${formData.resume ? 'bg-brand-red text-white' : 'bg-gray-200 text-gray-500'}`}>
                                                    <Briefcase size={18} />
                                                </div>
                                                {formData.resume ? (
                                                    <p className="font-black text-sm text-brand-red">{formData.resume.name}</p>
                                                ) : (
                                                    <p className="font-bold text-sm text-gray-500">Clique ou arraste seu arquivo aqui</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-brand-red text-white py-4 rounded-xl font-black text-lg flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-red-900/30 disabled:opacity-50 disabled:pointer-events-none mt-4"
                                >
                                    {isSubmitting ? 'Enviando...' : 'Enviar Currículo'}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── PÁGINA PRINCIPAL ──────────────────────────────────────────────
export default function VagasPage() {
    const router = useRouter();

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState<'recentes' | 'salario'>('recentes');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const res = await api.get('/jobs/public');
                const data = res.data.data || [];
                
                const mappedJobs: Job[] = data.map((j: any) => ({
                    id: j.id,
                    title: j.title,
                    company: j.client?.nome_fantasia || 'Empresa Confidencial',
                    location: j.city || 'Não informado',
                    salary: j.salary_range || 'A combinar',
                    salaryNum: parseInt(String(j.salary_range).replace(/\D/g, '')) || 0,
                    type: j.hiring_type || 'CLT',
                    date: j.published_at ? new Date(j.published_at).toLocaleDateString('pt-BR') : 'Recente',
                    daysAgo: j.published_at ? Math.floor((new Date().getTime() - new Date(j.published_at).getTime()) / (1000 * 3600 * 24)) : 0,
                    tags: [j.work_model, j.role, j.education_level].filter(Boolean),
                    category: j.area || 'Outros',
                    desc: j.description || 'Sem descrição.',
                    requirements: j.experience_required ? [j.experience_required] : [],
                    benefits: [], // TODO: Mapear se houver no backend
                    contact: j.contact_whatsapp || j.contact_email || 'Não informado',
                }));
                
                setJobs(mappedJobs);
            } catch (error) {
                console.error("Erro ao buscar vagas", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchJobs();
    }, []);

    // Toggle categoria
    const toggleCategory = useCallback((cat: string) => {
        setSelectedCategories(prev =>
            prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
        );
    }, []);

    // Filtragem + ordenação 
    const filteredJobs = useMemo(() => {
        let result = jobs.filter(job => {
            const term = searchTerm.toLowerCase();
            const matchesSearch = !term
                || job.title.toLowerCase().includes(term)
                || job.company.toLowerCase().includes(term)
                || job.location.toLowerCase().includes(term)
                || job.tags.some(t => t.toLowerCase().includes(term));
            const matchesCat = selectedCategories.length === 0 || selectedCategories.includes(job.category);
            return matchesSearch && matchesCat;
        });

        result = [...result].sort((a, b) =>
            sortBy === 'recentes' ? a.daysAgo - b.daysAgo : b.salaryNum - a.salaryNum
        );

        return result;
    }, [searchTerm, selectedCategories, sortBy]);

    const categoryCounts = useMemo(() =>
        CATEGORIES.map(cat => ({
            cat,
            count: jobs.filter(j => j.category === cat).length
        })), [jobs]);


    return (
        <div className="min-h-screen bg-cloud-dancer font-sans">

            {/* ── HEADER ── */}
            <div className="bg-white border-b border-gray-100 pt-32 pb-12">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div className="space-y-4">
                            <button
                                onClick={() => router.back()}
                                className="p-3 bg-gray-50 rounded-2xl hover:bg-brand-red hover:text-white transition-all text-gray-400"
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <div>
                                <h1 className="text-5xl font-black text-gray-900 tracking-tighter italic font-serif leading-none">
                                    Oportunidades de <span className="text-brand-red">Carreira.</span>
                                </h1>
                                <p className="text-gray-400 font-medium mt-3 max-w-lg">
                                    Encontre vagas em Farroupilha e região.
                                </p>
                            </div>
                        </div>

                        {/* Barra de busca + filtro */}
                        <div className="flex gap-3 w-full md:w-auto">
                            <div className="relative group flex-1 sm:w-80">
                                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-gray-300 group-focus-within:text-brand-red transition-colors">
                                    <Search size={18} />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Buscar cargo, empresa ou tag..."
                                    className="w-full bg-gray-50 border-2 border-transparent focus:border-brand-red focus:bg-white rounded-2xl py-4 pl-14 pr-6 outline-none font-bold text-gray-900 transition-all placeholder:text-gray-300"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={() => setShowFilters(v => !v)}
                                className={`p-4 rounded-2xl flex items-center justify-center transition-all active:scale-95 border-2 ${showFilters ? 'bg-brand-red text-white border-brand-red' : 'bg-white text-gray-400 border-gray-100 hover:border-brand-red hover:text-brand-red'}`}
                            >
                                <Filter size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Painel de filtros mobile */}
                    {showFilters && (
                        <div className="mt-6 md:hidden bg-gray-50 rounded-3xl p-6 space-y-4 border border-gray-100">
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Categorias</p>
                            <div className="flex flex-wrap gap-3">
                                {categoryCounts.map(({ cat, count }) => (
                                    <button
                                        key={cat}
                                        onClick={() => toggleCategory(cat)}
                                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border-2 transition-all ${selectedCategories.includes(cat) ? 'bg-brand-red text-white border-brand-red' : 'bg-white text-gray-500 border-gray-100 hover:border-brand-red'}`}
                                    >
                                        {cat} ({count})
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── CONTEÚDO ── */}
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                    {/* Sidebar filtros desktop */}
                    <div className="lg:col-span-3 space-y-8 hidden lg:block">
                        <div className="space-y-4 bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-sm">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Categorias</h3>
                            <div className="space-y-1">
                                {categoryCounts.map(({ cat, count }) => {
                                    const active = selectedCategories.includes(cat);
                                    return (
                                        <button
                                            key={cat}
                                            onClick={() => toggleCategory(cat)}
                                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${active ? 'bg-brand-red/5 text-brand-red' : 'hover:bg-gray-50 text-gray-500'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                {active ? <CheckSquare size={16} className="text-brand-red" /> : <Square size={16} className="text-gray-300" />}
                                                <span className="text-sm font-black">{cat}</span>
                                            </div>
                                            <span className="text-xs font-black text-gray-300">{count}</span>
                                        </button>
                                    );
                                })}
                            </div>
                            {selectedCategories.length > 0 && (
                                <button
                                    onClick={() => setSelectedCategories([])}
                                    className="w-full text-xs font-black text-brand-red hover:underline pt-2"
                                >
                                    Limpar filtros
                                </button>
                            )}
                        </div>

                        <div className="bg-brand-red/5 p-8 rounded-[2.5rem] border border-brand-red/10 space-y-6">
                            <h4 className="font-black text-gray-900 text-lg leading-tight">Quer anunciar<br />uma vaga?</h4>
                            <p className="text-gray-500 text-xs font-medium">Sua vaga em destaque para os melhores talentos da região.</p>
                            <a
                                href={`https://wa.me/5554326800002?text=Olá! Quero anunciar uma vaga no Vermelhinho.`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full bg-brand-red text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-red-100 hover:scale-105 active:scale-95 transition-all text-center block"
                            >
                                Publicar Agora
                            </a>
                        </div>
                    </div>

                    {/* Lista de vagas */}
                    <div className="lg:col-span-9 space-y-6">
                        {/* Cabeçalho da lista */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
                            <div className="flex items-center gap-3 flex-wrap">
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                    {filteredJobs.length} {filteredJobs.length === 1 ? 'vaga encontrada' : 'vagas encontradas'}
                                </span>
                                {selectedCategories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => toggleCategory(cat)}
                                        className="flex items-center gap-1 px-3 py-1 bg-brand-red/10 text-brand-red rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-brand-red hover:text-white transition-colors"
                                    >
                                        <Tag size={10} />
                                        {cat}
                                        <X size={10} />
                                    </button>
                                ))}
                            </div>

                            {/* Seletor de ordenação */}
                            <div className="relative group">
                                <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-4 py-2.5 cursor-pointer hover:border-brand-red transition-colors">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Ordenar:</span>
                                    <select
                                        value={sortBy}
                                        onChange={e => setSortBy(e.target.value as 'recentes' | 'salario')}
                                        className="bg-transparent border-none outline-none text-xs font-black text-brand-red cursor-pointer"
                                    >
                                        <option value="recentes">Mais recentes</option>
                                        <option value="salario">Maior salário</option>
                                    </select>
                                    <ChevronDown size={14} className="text-gray-400" />
                                </div>
                            </div>
                        </div>

                        {/* Cards */}
                        {isLoading ? (
                            <div className="bg-white rounded-[3rem] p-16 text-center space-y-4 border border-gray-50">
                                <div className="text-brand-red mb-4 inline-block animate-spin">
                                    <Search size={40} />
                                </div>
                                <h3 className="font-black text-xl text-gray-900">Buscando vagas...</h3>
                            </div>
                        ) : filteredJobs.length === 0 ? (
                            <div className="bg-white rounded-[3rem] p-16 text-center space-y-4 border border-gray-50">
                                <div className="text-5xl">🔍</div>
                                <h3 className="font-black text-xl text-gray-900">Nenhuma vaga encontrada</h3>
                                <p className="text-gray-400 font-medium">No momento não há vagas disponíveis ou correspondentes aos seus filtros.</p>
                                {(searchTerm || selectedCategories.length > 0) && (
                                    <button onClick={() => { setSearchTerm(''); setSelectedCategories([]); }} className="text-brand-red font-black hover:underline mt-2">
                                        Limpar busca
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredJobs.map(job => (
                                    <div
                                        key={job.id}
                                        className="group bg-white p-6 md:p-8 rounded-[2.5rem] border border-gray-50 shadow-sm hover:shadow-xl hover:shadow-gray-200/50 hover:border-brand-red/10 transition-all cursor-pointer"
                                        onClick={() => setSelectedJob(job)}
                                    >
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                            <div className="flex items-start gap-5">
                                                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-200 group-hover:bg-brand-red/5 group-hover:text-brand-red transition-colors flex-shrink-0 overflow-hidden">
                                                    {job.logo ? (
                                                        <img src={job.logo} alt={job.company} className="w-full h-full object-contain p-2 rounded-2xl" />
                                                    ) : (
                                                        <Building2 size={28} />
                                                    )}
                                                </div>
                                                <div className="space-y-2 min-w-0">
                                                    <div className="flex items-center gap-3 flex-wrap">
                                                        <h3 className="text-xl font-black text-gray-900 tracking-tight group-hover:text-brand-red transition-colors">{job.title}</h3>
                                                        <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded">Nova</span>
                                                        <span className="bg-gray-50 text-gray-500 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded">{job.type}</span>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-4 text-gray-400 text-sm font-bold">
                                                        <span className="flex items-center gap-1"><MapPin size={14} className="text-brand-red" />{job.location}</span>
                                                        <span className="flex items-center gap-1"><Briefcase size={14} />{job.company}</span>
                                                        <span className="flex items-center gap-1"><Clock size={14} />{job.date}</span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 pt-1">
                                                        {job.tags.map(tag => (
                                                            <span key={tag} className="px-3 py-1 bg-gray-50 text-gray-400 rounded-full text-[10px] font-black uppercase tracking-widest">{tag}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 border-t md:border-t-0 md:border-l border-gray-50 pt-5 md:pt-0 md:pl-8 flex-shrink-0">
                                                <div className="text-right">
                                                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Salário</p>
                                                    <p className="text-lg font-black text-gray-900">{job.salary}</p>
                                                </div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setSelectedJob(job); }}
                                                    className="bg-gray-900 group-hover:bg-brand-red text-white px-6 py-3 rounded-xl font-black text-sm transition-all active:scale-95 shadow-sm flex items-center gap-2 whitespace-nowrap"
                                                >
                                                    Ver Detalhes
                                                    <ExternalLink size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {filteredJobs.length > 0 && (
                            <div className="pt-8 text-center">
                                <p className="text-gray-300 text-xs font-black uppercase tracking-widest">
                                    Exibindo todas as {filteredJobs.length} vagas disponíveis
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── CTA WHATSAPP ── */}
            <section className="bg-gray-900 py-24 rounded-t-[4rem] text-center">
                <div className="max-w-xl mx-auto px-6 space-y-8">
                    <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter italic font-serif leading-none">
                        Participe do nosso <span className="text-brand-red">Grupo de Vagas.</span>
                    </h2>
                    <p className="text-gray-400 font-medium">
                        Entre no grupo oficial do Vermelhinho no WhatsApp e receba as melhores oportunidades de Farroupilha e região em tempo real.
                    </p>

                    <div className="flex justify-center">
                        <a
                            href="https://chat.whatsapp.com/J8o6h1c8OCU4KZZB5MwSPD"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-brand-red text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-2xl shadow-red-900/50 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                        >
                            <Phone size={20} />
                            Entrar no Grupo Agora
                        </a>
                    </div>
                </div>
            </section>

            {/* ── MODAL ── */}
            {selectedJob && (
                <JobModal job={selectedJob} onClose={() => setSelectedJob(null)} />
            )}
        </div>
    );
}
