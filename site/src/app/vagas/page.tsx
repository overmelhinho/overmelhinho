'use client';

import React, { useState, useMemo, useCallback } from 'react';
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
}

// ── DADOS (demonstração – integração com backend em breve) ─────────
const JOBS: Job[] = [
    {
        id: 1,
        title: 'Vendedor(a) Externo(a)',
        company: 'Grupo Freitas',
        location: 'Centro, Farroupilha - RS',
        salary: 'R$ 1.800 + comissões',
        salaryNum: 1800,
        type: 'CLT',
        date: 'Há 1 dia',
        daysAgo: 1,
        tags: ['Vendas', 'CNH B', 'Externo'],
        category: 'Vendas',
        desc: 'Realizará visitas a clientes e prospecção de novos negócios na cidade e região, com metas e comissões atrativas.',
        requirements: ['Ensino Médio completo', 'CNH categoria B', 'Experiência em vendas externas'],
        benefits: ['Vale Alimentação', 'Plano de Saúde', 'Comissões ilimitadas', 'Veículo da empresa'],
        contact: 'rh@grupofreitas.com.br',
    },
    {
        id: 2,
        title: 'Assistente Administrativo(a)',
        company: 'Metalúrgica Nardi',
        location: 'Distrito Industrial, Farroupilha - RS',
        salary: 'R$ 2.200,00',
        salaryNum: 2200,
        type: 'CLT',
        date: 'Há 2 dias',
        daysAgo: 2,
        tags: ['Adm', 'Excel', 'Escrita'],
        category: 'Administrativo',
        desc: 'Suporte nas rotinas administrativas, controle de documentos, atendimento telefônico e lançamento de dados em sistema ERP.',
        requirements: ['Ensino Médio completo', 'Conhecimento em Pacote Office', 'Organização e proatividade'],
        benefits: ['Vale Transporte', 'Vale Alimentação', 'Seguro de Vida'],
        contact: '(54) 3268-0000',
    },
    {
        id: 3,
        title: 'Operador(a) de Máquinas CNC',
        company: 'Plásticos Serra Gaúcha',
        location: 'Parque Industrial, Carlos Barbosa - RS',
        salary: 'R$ 3.000,00',
        salaryNum: 3000,
        type: 'CLT',
        date: 'Há 3 dias',
        daysAgo: 3,
        tags: ['Indústria', 'CNC', 'Turno'],
        category: 'Indústria',
        desc: 'Operação e setup de máquinas CNC para produção de peças plásticas. Trabalho em turno fixo com adicional de turno.',
        requirements: ['Curso técnico em mecânica ou área afim', 'Experiência com CNC', 'Disponibilidade para turno'],
        benefits: ['Vale Transporte', 'Vale Alimentação', 'Adicional de Turno', 'Plano de Saúde'],
        contact: '(54) 3268-1111',
    },
    {
        id: 4,
        title: 'Estagiário(a) em Marketing Digital',
        company: 'Digital Intelligence',
        location: 'Centro, Farroupilha - RS (Híbrido)',
        salary: 'R$ 900,00 + benefícios',
        salaryNum: 900,
        type: 'Estágio',
        date: 'Há 1 dia',
        daysAgo: 1,
        tags: ['Marketing', 'Social Media', 'Canva'],
        category: 'TI & Digital',
        desc: 'Auxiliar na criação de conteúdo para redes sociais, edição de vídeos curtos, relatórios de métricas e campanhas pagas.',
        requirements: ['Cursando Marketing, Publicidade ou Comunicação', 'Conhecimento em Canva ou Figma', 'Criatividade e boa escrita'],
        benefits: ['Bolsa Auxílio', 'Vale Transporte', 'Horário Flexível', 'Home Office parcial'],
        contact: 'vagas@digitalintelligence.com.br',
    },
    {
        id: 5,
        title: 'Motorista Entregador',
        company: 'Distribuidora Garibaldi',
        location: 'Garibaldi - RS',
        salary: 'R$ 2.500,00 + ajuda de custo',
        salaryNum: 2500,
        type: 'CLT',
        date: 'Há 4 dias',
        daysAgo: 4,
        tags: ['Logística', 'CNH D', 'Entregas'],
        category: 'Logística',
        desc: 'Realizar entregas de bebidas e produtos na região da Serra Gaúcha. Veículo fornecido pela empresa.',
        requirements: ['CNH categoria D', 'Experiência com entregas', 'Curso de Mopp (desejável)'],
        benefits: ['Vale Alimentação', 'Plano Odontológico', 'Ajuda de Custo com combustível'],
        contact: '(54) 3462-0000',
    },
    {
        id: 6,
        title: 'Analista de TI – Suporte N2',
        company: 'TechSerra Soluções',
        location: 'Bento Gonçalves - RS (Presencial)',
        salary: 'R$ 4.500,00',
        salaryNum: 4500,
        type: 'CLT',
        date: 'Há 2 dias',
        daysAgo: 2,
        tags: ['TI', 'Suporte', 'Windows Server'],
        category: 'TI & Digital',
        desc: 'Atendimento de chamados N2, gestão de usuários no Active Directory, suporte a infraestrutura de rede e servidores Windows.',
        requirements: ['Graduação em TI ou áreas correlatas', 'Windows Server e Active Directory', 'Conhecimento em redes TCP/IP'],
        benefits: ['Plano de Saúde', 'PLR', 'Vale Alimentação', 'Gympass'],
        contact: 'rh@techserra.com.br',
    },
];

const CATEGORIES = ['Vendas', 'Administrativo', 'Indústria', 'TI & Digital', 'Logística'];

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

                    {/* Contato / CTA */}
                    <div className="bg-gray-900 rounded-[2rem] p-8 space-y-4">
                        <p className="text-white font-black text-lg">Interessado(a)? Entre em contato!</p>
                        <p className="text-gray-400 text-sm font-medium">Envie seu currículo diretamente para a empresa.</p>
                        <a
                            href={job.contact.includes('@')
                                ? `mailto:${job.contact}?subject=Candidatura – ${job.title}`
                                : `https://wa.me/55${job.contact.replace(/\D/g, '')}?text=Olá! Vi a vaga de ${encodeURIComponent(job.title)} no Vermelhinho e gostaria de me candidatar.`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full bg-brand-red text-white py-4 rounded-xl font-black text-lg flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-red-900/30"
                        >
                            {job.contact.includes('@') ? <Mail size={20} /> : <Phone size={20} />}
                            {job.contact.includes('@') ? 'Enviar Currículo por E-mail' : 'Candidatar pelo WhatsApp'}
                        </a>
                        <p className="text-gray-500 text-xs text-center font-bold">{job.contact}</p>
                    </div>
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
    const [phone, setPhone] = useState('');
    const [subscribed, setSubscribed] = useState(false);

    // Toggle categoria
    const toggleCategory = useCallback((cat: string) => {
        setSelectedCategories(prev =>
            prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
        );
    }, []);

    // Filtragem + ordenação 
    const filteredJobs = useMemo(() => {
        let result = JOBS.filter(job => {
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
            count: JOBS.filter(j => j.category === cat).length
        })), []);

    const handleSubscribe = () => {
        const digits = phone.replace(/\D/g, '');
        if (digits.length < 10) return alert('Informe um número válido.');
        setSubscribed(true);
    };

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
                                    Encontre vagas em Farroupilha e região. Os dados abaixo são exemplos — integração com backend em breve.
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
                        {filteredJobs.length === 0 ? (
                            <div className="bg-white rounded-[3rem] p-16 text-center space-y-4 border border-gray-50">
                                <div className="text-5xl">🔍</div>
                                <h3 className="font-black text-xl text-gray-900">Nenhuma vaga encontrada</h3>
                                <p className="text-gray-400 font-medium">Tente outros termos ou remova os filtros.</p>
                                <button onClick={() => { setSearchTerm(''); setSelectedCategories([]); }} className="text-brand-red font-black hover:underline">
                                    Limpar busca
                                </button>
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
                                                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-200 group-hover:bg-brand-red/5 group-hover:text-brand-red transition-colors flex-shrink-0">
                                                    <Building2 size={28} />
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
                        Receba vagas no seu <span className="text-brand-red">WhatsApp.</span>
                    </h2>
                    <p className="text-gray-400 font-medium">
                        Não perca nenhuma oportunidade. Seja notificado no momento em que novas vagas forem publicadas.
                    </p>

                    {subscribed ? (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-8 space-y-2">
                            <div className="text-4xl">✅</div>
                            <p className="font-black text-emerald-400 text-lg">Inscrição realizada com sucesso!</p>
                            <p className="text-gray-400 text-sm font-medium">Em breve você receberá as melhores vagas por lá.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col sm:flex-row gap-4">
                            <input
                                type="tel"
                                inputMode="numeric"
                                placeholder="(54) 9 9999-9999"
                                className="flex-1 bg-white/10 border-2 border-transparent focus:border-brand-red focus:bg-white rounded-2xl py-5 px-8 outline-none font-bold text-white focus:text-gray-900 transition-all placeholder:text-gray-500"
                                value={phone}
                                onChange={e => setPhone(maskPhone(e.target.value))}
                                maxLength={16}
                            />
                            <button
                                onClick={handleSubscribe}
                                className="bg-brand-red text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-2xl shadow-red-900/50 hover:scale-105 active:scale-95 transition-all whitespace-nowrap"
                            >
                                Me Inscrever
                            </button>
                        </div>
                    )}
                </div>
            </section>

            {/* ── MODAL ── */}
            {selectedJob && (
                <JobModal job={selectedJob} onClose={() => setSelectedJob(null)} />
            )}
        </div>
    );
}
