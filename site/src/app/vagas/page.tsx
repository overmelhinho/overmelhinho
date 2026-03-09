'use client';

import React, { useState } from 'react';
import {
    Search,
    MapPin,
    Briefcase,
    Clock,
    DollarSign,
    ChevronRight,
    Filter,
    ArrowLeft,
    Building2,
    Calendar,
    CheckCircle2
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function VagasPage() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');

    const jobs = [
        {
            id: 1,
            title: "Gerente de Loja",
            company: "Moda Real",
            location: "Centro, Farroupilha - RS",
            salary: "R$ 3.500,00 + Comissões",
            type: "CLT",
            date: "Há 2 horas",
            tags: ["Vendas", "Liderança", "Escala 6x1"],
            desc: "Buscamos profissional com experiência em gestão de equipes e foco em metas de vendas."
        },
        {
            id: 2,
            title: "Desenvolvedor Frontend Next.js",
            company: "Digital Intelligence",
            location: "Remoto (Base Caxias do Sul)",
            salary: "R$ 6.000,00 - R$ 8.000,00",
            type: "PJ",
            date: "Há 5 horas",
            tags: ["React", "Next.js", "Tailwind"],
            desc: "Responsável por criar interfaces modernas e interativas para o portal O Vermelhinho."
        },
        {
            id: 3,
            title: "Cozinheiro Geral",
            company: "Bistrô do Vale",
            location: "Vila Nova, Bento Gonçalves",
            salary: "R$ 2.800,00",
            type: "CLT",
            date: "Há 1 dia",
            tags: ["Gastronomia", "Português", "Á la Carte"],
            desc: "Preparação de pratos, organização da cozinha e controle de estoque de insumos."
        },
        {
            id: 4,
            title: "Auxiliar Administrativo",
            company: "Logística Sul",
            location: "Distrito Industrial, Farroupilha",
            salary: "Confidencial",
            type: "CLT",
            date: "Há 2 dias",
            tags: ["Excel", "Expedição", "Adm"],
            desc: "Apoio nas rotinas administrativas, lançamento de notas e controle de planilhas."
        }
    ];

    return (
        <div className="min-h-screen bg-cloud-dancer font-sans">
            {/* Header / Intro */}
            <div className="bg-white border-b border-gray-100 pt-32 pb-12">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div className="space-y-4">
                            <button onClick={() => router.back()} className="p-3 bg-gray-50 rounded-2xl hover:bg-brand-red hover:text-white transition-all text-gray-400">
                                <ArrowLeft size={20} />
                            </button>
                            <h1 className="text-5xl font-black text-gray-900 tracking-tighter italic font-serif leading-none">
                                Oportunidades de <span className="text-brand-red">Carreira.</span>
                            </h1>
                            <p className="text-gray-400 font-medium max-w-lg">
                                Encontre as melhores vagas de emprego em Farroupilha e região. Conectamos talentos locais às melhores empresas.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                            <div className="relative group flex-1 sm:w-80">
                                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-brand-red transition-colors">
                                    <Search size={18} />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Buscar cargo ou empresa..."
                                    className="w-full bg-gray-50 border-2 border-transparent focus:border-brand-red focus:bg-white rounded-2xl py-4 pl-14 pr-6 outline-none font-bold text-gray-900 transition-all placeholder:text-gray-300"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <button className="bg-gray-900 text-white p-5 rounded-2xl flex items-center justify-center shadow-lg hover:bg-brand-red transition-colors transition-all active:scale-95">
                                <Filter size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* List & Content */}
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                    {/* Filters Sidebar */}
                    <div className="lg:col-span-3 space-y-8 hidden lg:block">
                        <div className="space-y-6">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 px-2">Categorias</h3>
                            <div className="space-y-2">
                                {["Vendas (12)", "Administrativo (8)", "Indústria (15)", "TI & Digital (4)", "Logística (7)"].map((cat, i) => (
                                    <label key={i} className="flex items-center space-x-3 p-3 hover:bg-white rounded-xl cursor-pointer group transition-all">
                                        <div className="w-5 h-5 rounded border-2 border-gray-200 group-hover:border-brand-red transition-colors" />
                                        <span className="text-sm font-bold text-gray-600 group-hover:text-brand-red transition-colors">{cat}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="bg-brand-red/5 p-8 rounded-[2.5rem] border border-brand-red/10 space-y-6">
                            <h4 className="font-black text-gray-900 text-lg leading-tight">Quer anunciar <br />uma vaga?</h4>
                            <p className="text-gray-500 text-xs font-medium">Sua vaga em destaque para os melhores talentos da região.</p>
                            <button className="w-full bg-brand-red text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-red-100 hover:scale-105 active:scale-95 transition-all">
                                Publicar Agora
                            </button>
                        </div>
                    </div>

                    {/* Jobs List */}
                    <div className="lg:col-span-9 space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total: {jobs.length} vagas encontradas</span>
                            <div className="flex items-center space-x-2 text-xs font-bold text-gray-900">
                                <span className="text-gray-400">Ordenar por:</span>
                                <select className="bg-transparent border-none outline-none cursor-pointer text-brand-red">
                                    <option>Mais recentes</option>
                                    <option>Maior salário</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {jobs.map((job) => (
                                <div key={job.id} className="group bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-sm hover:shadow-xl hover:shadow-gray-200/50 hover:border-brand-red/10 transition-all cursor-pointer">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="flex items-start space-x-6">
                                            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 group-hover:bg-brand-red/5 group-hover:text-brand-red transition-colors">
                                                <Building2 size={32} />
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex items-center space-x-3">
                                                    <h3 className="text-2xl font-black text-gray-900 tracking-tight group-hover:text-brand-red transition-colors">{job.title}</h3>
                                                    <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded">Nova</span>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-4 text-gray-400 text-sm font-bold">
                                                    <div className="flex items-center space-x-1">
                                                        <MapPin size={14} className="text-brand-red" />
                                                        <span>{job.location}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-1">
                                                        <Briefcase size={14} />
                                                        <span>{job.company}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-1">
                                                        <Clock size={14} />
                                                        <span>{job.date}</span>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-2 pt-2">
                                                    {job.tags.map(tag => (
                                                        <span key={tag} className="px-3 py-1 bg-gray-50 text-gray-500 rounded-full text-[10px] font-black uppercase tracking-widest">{tag}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 border-t md:border-t-0 md:border-l border-gray-50 pt-6 md:pt-0 md:pl-10">
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Salário Estimado</p>
                                                <p className="text-xl font-black text-gray-900 tracking-tight">{job.salary}</p>
                                            </div>
                                            <button className="bg-gray-900 group-hover:bg-brand-red text-white px-8 py-3 rounded-xl font-black text-sm transition-all active:scale-95 shadow-lg shadow-gray-200 group-hover:shadow-red-200">
                                                Ver Detalhes
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination / Load More */}
                        <div className="pt-8 text-center">
                            <button className="px-12 py-5 bg-white border border-gray-100 rounded-2xl font-black text-gray-900 shadow-sm hover:shadow-md hover:border-brand-red transition-all active:scale-95">
                                Carregar Mais Vagas
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Newsletter CTA */}
            <section className="bg-gray-900 py-24 rounded-t-[4rem] text-center space-y-12">
                <div className="max-w-2xl mx-auto px-6 space-y-6">
                    <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter italic font-serif leading-none">
                        Receba vagas no seu <span className="text-brand-red">WhatsApp.</span>
                    </h2>
                    <p className="text-gray-400 font-medium">
                        Não perca nenhuma oportunidade. Seja notificado no momento em que novas vagas forem publicadas.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <input
                            type="text"
                            placeholder="(54) 99999-9999"
                            className="flex-1 bg-white/10 border-2 border-transparent focus:border-brand-red focus:bg-white rounded-2xl py-5 px-8 outline-none font-bold text-white focus:text-gray-900 transition-all placeholder:text-gray-500"
                        />
                        <button className="bg-brand-red text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-2xl shadow-red-900/50 hover:scale-105 active:scale-95 transition-all">
                            Me Inscrever
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}
