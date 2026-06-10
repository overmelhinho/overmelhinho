'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import {
    ArrowLeft,
    Briefcase,
    MapPin,
    Clock,
    Phone,
    Building2,
    ExternalLink,
    CheckSquare,
    Search
} from 'lucide-react';

// ── TIPOS ─────────────────────────────────────────────────────────
interface Job {
    id: number;
    title: string;
    company: string;
    location: string;
    salary: string;
    salaryNum: number;
    type: 'CLT' | 'PJ' | 'Freelancer' | 'Estágio';
    date: string;
    daysAgo: number;
    tags: string[];
    category: string;
    desc: string;
    requirements: string[];
    benefits: string[];
    contact: string;
    logo?: string;
    timestamp: number;
    clientSlug?: string;
    whatsapp?: string | null;
}

// ── MÁSCARA FONE ──────────────────────────────────────────────────
function maskPhone(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 11)
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    return value;
}

// ── LIMPAR HTML ───────────────────────────────────────────────────
function cleanHtml(html: string): string {
    if (!html) return '';
    return html.replace(/<!--[\s\S]*?-->/g, '').trim();
}

// ── LOGO DA EMPRESA ───────────────────────────────────────────────
const CompanyLogo = ({ company, logo, className = '' }: { company: string, logo?: string, className?: string }) => {
    const [error, setError] = useState(false);
    
    if (!logo || error) {
        return (
            <div className={`flex items-center justify-center font-black flex-shrink-0 ${className}`}>
                {company.charAt(0).toUpperCase()}
            </div>
        );
    }

    return (
        <div className={`flex items-center justify-center flex-shrink-0 overflow-hidden ${className}`}>
            <img 
                src={logo} 
                alt={company} 
                className="w-full h-full object-contain p-1.5"
                onError={() => setError(true)}
            />
        </div>
    );
};

// ── COMPONENTE DE CLIENTE DETALHES DA VAGA ───────────────────────
export default function JobDetailClient({ job }: { job: Job }) {
    const router = useRouter();

    // Candidatura
    const [isApplying, setIsApplying] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        resume: null as File | null
    });
    const [applyError, setApplyError] = useState('');

    const handleApply = async (e: React.FormEvent) => {
        e.preventDefault();
        setApplyError('');

        if (!formData.name || !formData.email || !formData.resume) {
            setApplyError('Por favor, preencha nome, e-mail e anexe o currículo.');
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
            setApplyError(error.response?.data?.message || 'Erro ao enviar candidatura. Tente novamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-cloud-dancer font-sans pt-12 md:pt-32 pb-24">
            <div className="max-w-7xl mx-auto px-6">
                {/* Botão de Voltar */}
                <button
                    onClick={() => router.push('/vagas')}
                    className="inline-flex items-center gap-2 p-3 bg-white rounded-2xl hover:bg-brand-red hover:text-white transition-all text-gray-400 shadow-sm border border-gray-100 mb-8 font-black text-xs uppercase tracking-widest cursor-pointer"
                >
                    <ArrowLeft size={16} /> Voltar para Vagas
                </button>

                {/* Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    
                    {/* Coluna Principal: Detalhes da Vaga */}
                    <div className="lg:col-span-8 space-y-8">
                        <div className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-gray-50 shadow-sm space-y-8">
                            
                            {/* Cabeçalho do Card */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-gray-100">
                                <div className="flex items-start gap-5">
                                    <CompanyLogo 
                                        company={job.company} 
                                        logo={job.logo} 
                                        className="w-[80px] h-[80px] bg-gray-50 rounded-2xl text-3xl text-gray-300 font-black border border-gray-100" 
                                    />
                                    <div className="space-y-2 min-w-0">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-none">{job.title}</h1>
                                            <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded">Nova</span>
                                            <span className="bg-gray-50 text-gray-500 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded">{job.type}</span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-4 text-gray-400 text-sm font-bold">
                                            <span className="flex items-center gap-1"><MapPin size={14} className="text-brand-red" />{job.location}</span>
                                            <span className="flex items-center gap-1"><Briefcase size={14} />{job.company}</span>
                                            <span className="flex items-center gap-1"><Clock size={14} />Publicada em {job.date}</span>
                                        </div>
                                    </div>
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
                                <h3 className="font-black text-gray-900 uppercase tracking-widest text-xs">Sobre a Vaga</h3>
                                <div 
                                    className="text-gray-500 font-medium leading-relaxed rich-text text-sm md:text-base"
                                    dangerouslySetInnerHTML={{ __html: cleanHtml(job.desc) }}
                                />
                            </div>

                            {/* Requisitos */}
                            {job.requirements && job.requirements.length > 0 && cleanHtml(job.requirements[0]) && (
                                <div className="space-y-3 pt-6 border-t border-gray-50">
                                    <h3 className="font-black text-gray-900 uppercase tracking-widest text-xs">Requisitos</h3>
                                    <div 
                                        className="text-gray-500 font-medium leading-relaxed rich-text text-sm md:text-base"
                                        dangerouslySetInnerHTML={{ __html: cleanHtml(job.requirements[0]) }}
                                    />
                                </div>
                            )}

                        </div>
                    </div>

                    {/* Coluna Lateral: Candidatura & Informações Rápidas */}
                    <div className="lg:col-span-4 space-y-8">
                        
                        {/* Informações Rápidas */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-sm space-y-6">
                            <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Informações Rápidas</h3>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 rounded-2xl p-4 space-y-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Salário</p>
                                    <p className="font-black text-gray-900 text-sm">{job.salary}</p>
                                </div>
                                <div className="bg-gray-50 rounded-2xl p-4 space-y-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Contrato</p>
                                    <p className="font-black text-gray-900 text-sm">{job.type}</p>
                                </div>
                            </div>
                        </div>

                        {/* Bloco de Candidatura */}
                        <div className="bg-gray-900 text-white rounded-[2.5rem] p-8 shadow-xl space-y-6">
                            {!isApplying ? (
                                <>
                                    <div className="space-y-2">
                                        <p className="font-black text-2xl tracking-tight">Candidatar-se</p>
                                        <p className="text-gray-400 text-xs font-medium leading-relaxed">
                                            Preencha seus dados e anexe seu currículo para participar do processo seletivo.
                                        </p>
                                    </div>

                                    <div className="space-y-3 pt-2">
                                        <button
                                            onClick={() => setIsApplying(true)}
                                            className="w-full bg-brand-red text-white py-4 px-4 rounded-xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-red-950/50 text-center cursor-pointer"
                                        >
                                            Candidatar pelo Site
                                        </button>
                                        
                                        {job.whatsapp && (
                                            <a
                                                href={`https://wa.me/55${job.whatsapp.replace(/\D/g, '')}?text=Olá! Gostaria de me candidatar para a vaga de ${job.title} que vi no Vermelhinho.`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-full bg-[#25D366] text-white py-4 px-4 rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-emerald-950/30 text-center"
                                            >
                                                <Phone size={16} />
                                                Via WhatsApp
                                            </a>
                                        )}
                                    </div>
                                </>
                            ) : isSuccess ? (
                                <div className="text-center space-y-4 py-4">
                                    <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                                        <CheckSquare size={32} />
                                    </div>
                                    <h3 className="text-xl font-black tracking-tight text-white">Currículo Enviado!</h3>
                                    <p className="text-gray-400 text-sm font-medium">Sua candidatura foi enviada com sucesso para a empresa.</p>
                                    <button
                                        onClick={() => {
                                            setIsApplying(false);
                                            setIsSuccess(false);
                                            setFormData({ name: '', email: '', phone: '', resume: null });
                                        }}
                                        className="mt-6 px-6 py-2.5 bg-gray-800 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-700 transition-colors"
                                    >
                                        Voltar
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4 pb-2 border-b border-gray-800">
                                        <button onClick={() => setIsApplying(false)} className="text-gray-400 hover:text-white transition-colors">
                                            <ArrowLeft size={20} />
                                        </button>
                                        <div>
                                            <h3 className="font-black text-lg text-white">Sua Candidatura</h3>
                                        </div>
                                    </div>

                                    <form onSubmit={handleApply} className="space-y-4">
                                        {applyError && (
                                            <div className="p-3 bg-red-950/50 text-red-400 font-bold text-xs rounded-xl border border-red-900/30">
                                                {applyError}
                                            </div>
                                        )}

                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Nome Completo *</label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full bg-gray-800 border-2 border-transparent focus:border-brand-red focus:bg-gray-850 rounded-xl py-3 px-4 outline-none font-bold text-white text-sm transition-all placeholder:text-gray-650"
                                                placeholder="Seu nome"
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">E-mail *</label>
                                            <input
                                                type="email"
                                                required
                                                className="w-full bg-gray-800 border-2 border-transparent focus:border-brand-red focus:bg-gray-850 rounded-xl py-3 px-4 outline-none font-bold text-white text-sm transition-all placeholder:text-gray-650"
                                                placeholder="seu@email.com"
                                                value={formData.email}
                                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">WhatsApp</label>
                                            <input
                                                type="text"
                                                className="w-full bg-gray-800 border-2 border-transparent focus:border-brand-red focus:bg-gray-850 rounded-xl py-3 px-4 outline-none font-bold text-white text-sm transition-all placeholder:text-gray-650"
                                                placeholder="(00) 00000-0000"
                                                value={maskPhone(formData.phone)}
                                                onChange={e => setFormData({ ...formData, phone: maskPhone(e.target.value) })}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Anexar Currículo (PDF/Word) *</label>
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
                                                <div className={`w-full border-2 border-dashed ${formData.resume ? 'border-brand-red bg-brand-red/5' : 'border-gray-850 bg-gray-800'} rounded-xl p-4 text-center transition-colors pointer-events-none`}>
                                                    <div className="flex flex-col items-center gap-1">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${formData.resume ? 'bg-brand-red text-white' : 'bg-gray-700 text-gray-450'}`}>
                                                            <Briefcase size={14} />
                                                        </div>
                                                        {formData.resume ? (
                                                            <p className="font-black text-xs text-brand-red truncate max-w-full">{formData.resume.name}</p>
                                                        ) : (
                                                            <p className="font-bold text-xs text-gray-400">Clique para anexar arquivo</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-full bg-brand-red text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-red-950/50 disabled:opacity-50 disabled:pointer-events-none mt-4 cursor-pointer"
                                        >
                                            {isSubmitting ? 'Enviando...' : 'Enviar Currículo'}
                                        </button>
                                    </form>
                                </div>
                            )}

                            {job.clientSlug && (
                                <div className="pt-6 border-t border-gray-800 text-center">
                                    <a
                                        href={`/cliente/${job.clientSlug}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-gray-400 hover:text-white font-bold text-xs transition-colors"
                                    >
                                        <Building2 size={14} /> Ver Página da Empresa <ExternalLink size={12} />
                                    </a>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
