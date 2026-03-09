'use client';

import React from 'react';
import {
    Search,
    MousePointer2,
    MessageCircle,
    Zap,
    Target,
    Users,
    ArrowRight,
    SearchIcon,
    MapPin,
    Star,
    CheckCircle2,
    Building2,
    TrendingUp
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function ComoFuncionaPage() {
    const router = useRouter();

    const steps = [
        {
            title: "Busca Inteligente",
            desc: "Use nossa barra de pesquisa com tecnologia de processamento de linguagem natural. Basta falar ou digitar o que precisa.",
            icon: Search,
            color: "bg-blue-50 text-blue-600"
        },
        {
            title: "Geo Localização",
            desc: "Filtramos os melhores serviços baseados na sua localização exata ou na cidade selecionada, garantindo proximidade.",
            icon: MapPin,
            color: "bg-emerald-50 text-emerald-600"
        },
        {
            title: "Contato Direto",
            desc: "Sem intermediários. Clique no ícone do WhatsApp ou ligue diretamente para o parceiro para fechar negócio.",
            icon: MessageCircle,
            color: "bg-brand-red/5 text-brand-red"
        }
    ];

    return (
        <div className="min-h-screen bg-cloud-dancer font-sans selection:bg-brand-red/10">
            {/* Hero Section */}
            <section className="relative pt-32 pb-24 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 text-center space-y-8 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-20 h-20 bg-brand-red rounded-[2rem] flex items-center justify-center text-white mx-auto shadow-2xl shadow-red-200 rotate-3"
                    >
                        <Zap size={40} fill="currentColor" />
                    </motion.div>

                    <div className="space-y-4">
                        <h1 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tighter italic font-serif leading-none">
                            Simples. Rápido. <br /><span className="text-brand-red">Inteligente.</span>
                        </h1>
                        <p className="text-gray-500 text-lg max-w-2xl mx-auto font-medium">
                            Entenda como O Vermelhinho revoluciona a forma como você encontra serviços e empresas na sua região.
                        </p>
                    </div>
                </div>
            </section>

            {/* Steps Section */}
            <section className="pb-32 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {steps.map((step, i) => (
                            <div key={i} className="bg-white p-12 rounded-[3rem] border border-gray-50 shadow-sm space-y-6 group hover:shadow-2xl transition-all hover:scale-[1.02]">
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${step.color} transition-transform group-hover:rotate-6`}>
                                    <step.icon size={32} />
                                </div>
                                <div className="space-y-3">
                                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">{step.title}</h3>
                                    <p className="text-gray-400 text-sm font-medium leading-relaxed">{step.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Interactive Section */}
            <section className="bg-gray-900 py-32 rounded-[4rem] px-6 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-red opacity-10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />

                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                    <div className="space-y-12">
                        <div className="space-y-6">
                            <h2 className="text-4xl md:text-6xl font-black tracking-tighter italic font-serif leading-[0.9]">
                                Para quem <span className="text-brand-red">consome.</span>
                            </h2>
                            <ul className="space-y-6">
                                {[
                                    "Acesso 100% gratuito e sem necessidade de cadastro.",
                                    "Informações sempre atualizadas (horários, fotos e contatos).",
                                    "Avaliações reais de outros usuários da comunidade.",
                                    "Busca por voz intuitiva para agilizar seu dia a dia."
                                ].map((text, i) => (
                                    <li key={i} className="flex items-center space-x-4 text-gray-400 font-bold">
                                        <div className="w-6 h-6 rounded-full bg-brand-red/20 flex items-center justify-center text-brand-red">
                                            <CheckCircle2 size={16} />
                                        </div>
                                        <span>{text}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="space-y-6">
                            <h2 className="text-4xl md:text-6xl font-black tracking-tighter italic font-serif leading-[0.9]">
                                Para quem <span className="text-brand-red">anuncia.</span>
                            </h2>
                            <ul className="space-y-6">
                                {[
                                    "Painel de controle com métricas de cliques e contatos.",
                                    "Banner Inteligente que aparece por palavra-chave.",
                                    "Expansão de região para atingir cidades vizinhas.",
                                    "Selo de Parceiro Verificado O Vermelhinho (SSO)."
                                ].map((text, i) => (
                                    <li key={i} className="flex items-center space-x-4 text-gray-400 font-bold">
                                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                                            <CheckCircle2 size={16} />
                                        </div>
                                        <span>{text}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-4 rounded-[3rem] shadow-2xl rotate-2">
                            <img
                                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80"
                                alt="Dashboard Mocks"
                                className="rounded-[2.5rem]"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Geo Intelligence Section */}
            <section className="py-32 px-6">
                <div className="max-w-7xl mx-auto flex flex-col items-center text-center space-y-16">
                    <div className="space-y-4 max-w-3xl">
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter italic font-serif">A tecnologia por <span className="text-brand-red">trás da facilidade.</span></h2>
                        <p className="text-gray-500 font-medium">Usamos algoritmos avançados de geolocalização e busca semântica para garantir que cada resultado seja útil para você.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 w-full">
                        {[
                            { icon: Target, label: "Precisão", value: "99.9%", color: "text-blue-600" },
                            { icon: BarChart3, label: "Velocidade", value: "0.2s", color: "text-emerald-600" },
                            { icon: Users, label: "Comunidade", value: "50k+", color: "text-brand-red" },
                            { icon: Building2, label: "Negócios", value: "12k+", color: "text-orange-500" }
                        ].map((stat, i) => (
                            <div key={i} className="bg-white p-10 rounded-[2.5rem] border border-gray-100/50 shadow-sm space-y-2">
                                <div className={`flex items-center justify-center mb-4 ${stat.color}`}>
                                    <stat.icon size={32} />
                                </div>
                                <h4 className="text-3xl font-black text-gray-900">{stat.value}</h4>
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{stat.label}</p>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => router.push('/')}
                        className="px-12 py-5 bg-brand-red text-white rounded-2xl font-black text-xl shadow-2xl shadow-red-200 hover:scale-105 active:scale-95 transition-all flex items-center space-x-3"
                    >
                        <span>Começar a Usar Agora</span>
                        <ArrowRight size={24} />
                    </button>
                </div>
            </section>
        </div>
    );
}

// Helper icons that were missing in the list but used in the component
function BarChart3({ size, className }: { size: number, className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" /></svg>
    )
}
