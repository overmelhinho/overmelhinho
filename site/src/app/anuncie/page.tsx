'use client';

import React from 'react';
import {
    CheckCircle2,
    TrendingUp,
    Users,
    Target,
    Zap,
    ArrowRight,
    Star,
    MessageCircle,
    BarChart3,
    Search,
    Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function AnunciePage() {
    const router = useRouter();

    const plans = [
        {
            name: "Essencial",
            price: "R$ 49,90",
            period: "/mês",
            desc: "Ideal para profissionais liberais e autônomos.",
            features: [
                "Perfil completo no portal",
                "Link para WhatsApp direto",
                "Aparece nas buscas por categoria",
                "Até 3 fotos da empresa",
                "Suporte via e-mail"
            ],
            color: "border-gray-100",
            btnColor: "bg-gray-900 text-white",
            popular: false
        },
        {
            name: "Premium",
            price: "R$ 99,90",
            period: "/mês",
            desc: "O preferido de lojas e comércios locais.",
            features: [
                "Tudo do plano Essencial",
                "Destaque visual na busca",
                "Aparece em até 3 cidades vizinhas",
                "Galeria ilimitada de fotos",
                "Integração com Instagram",
                "Suporte prioritário WhatsApp"
            ],
            color: "border-brand-red ring-4 ring-red-50",
            btnColor: "bg-brand-red text-white",
            popular: true
        },
        {
            name: "Agência",
            price: "Sob Consulta",
            period: "",
            desc: "Para redes de lojas e grandes empresas.",
            features: [
                "Tudo do plano Premium",
                "Banners Intersticiais inclusos",
                "Relatórios de cliques e impressões",
                "Gerente de conta dedicado",
                "IA de recomendação prioritária",
                "Análise competitiva mensal"
            ],
            color: "border-gray-100",
            btnColor: "bg-gray-900 text-white",
            popular: false
        }
    ];

    return (
        <div className="min-h-screen bg-cloud-dancer font-sans selection:bg-brand-red/10">
            {/* Header / Hero */}
            <section className="relative pt-32 pb-24 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-to-b from-brand-red/5 to-transparent pointer-events-none" />

                <div className="max-w-7xl mx-auto px-6 relative z-10 text-center space-y-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center space-x-2 px-4 py-2 bg-white rounded-full border border-gray-100 shadow-sm"
                    >
                        <Sparkles size={16} className="text-brand-red" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Expanda seu alcance hoje</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl md:text-7xl font-black text-gray-900 tracking-tighter leading-[0.9] max-w-4xl mx-auto font-serif italic"
                    >
                        Sua empresa no lugar onde todos <span className="text-brand-red">estão procurando.</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-gray-500 text-lg max-w-2xl mx-auto font-medium"
                    >
                        O Vermelhinho é o maior guia comercial de Geo Inteligência da região. Colocamos o seu negócio na frente de clientes que já estão prontos para comprar.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        <button className="w-full sm:w-auto px-10 py-5 bg-brand-red text-white rounded-2xl font-black text-lg shadow-2xl shadow-red-200 hover:scale-105 active:scale-95 transition-all flex items-center justify-center space-x-3">
                            <span>Ver Planos</span>
                            <ArrowRight size={20} />
                        </button>
                        <button className="w-full sm:w-auto px-10 py-5 bg-white text-gray-900 border border-gray-100 rounded-2xl font-black text-lg shadow-sm hover:shadow-md active:scale-95 transition-all">
                            Falar com Consultor
                        </button>
                    </motion.div>
                </div>
            </section>

            {/* Metrics */}
            <section className="pb-32">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { icon: Users, label: "Acessos Mensais", value: "85k+", desc: "Visitantes qualificados buscando serviços na sua região." },
                            { icon: TrendingUp, label: "Taxa de Conversão", value: "24%", desc: "Média de cliques que se transformam em contato via WhatsApp." },
                            { icon: Target, label: "Geo Inteligência", value: "100%", desc: "Sua empresa aparece exatamente para quem está por perto." }
                        ].map((stat, i) => (
                            <div key={i} className="bg-white p-10 rounded-[2.5rem] border border-gray-50 shadow-sm space-y-4">
                                <div className="w-14 h-14 rounded-2xl bg-brand-red/5 flex items-center justify-center text-brand-red">
                                    <stat.icon size={28} />
                                </div>
                                <div>
                                    <h3 className="text-4xl font-black text-gray-900 tracking-tighter">{stat.value}</h3>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-red mt-1">{stat.label}</p>
                                </div>
                                <p className="text-gray-400 text-sm font-medium leading-relaxed">{stat.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Why Advertise */}
            <section className="bg-white py-32 rounded-[4rem] shadow-sm">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter leading-none italic font-serif">
                                Por que ser um <br /><span className="text-brand-red">Parceiro Vermelhinho?</span>
                            </h2>
                            <p className="text-gray-500 font-medium">Não somos apenas um catálogo de endereços. Somos uma plataforma de crescimento comercial.</p>
                        </div>

                        <div className="space-y-6">
                            {[
                                { title: "Busca Inteligente", desc: "Seu negócio é encontrado por palavras-chave relevantes, não apenas pelo nome.", icon: Search },
                                { title: "Relatórios de Performance", desc: "Saiba exatamente quantas pessoas viram e entraram em contato com você.", icon: BarChart3 },
                                { title: "Presença Mobile", desc: "Interface otimizada para quem busca pelo celular na rua ou no trabalho.", icon: Zap }
                            ].map((item, i) => (
                                <div key={i} className="flex items-start space-x-4 p-6 rounded-2xl hover:bg-gray-50 transition-colors">
                                    <div className="w-12 h-12 bg-brand-red rounded-xl flex items-center justify-center text-white flex-shrink-0">
                                        <item.icon size={24} />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="font-black text-gray-900 text-lg tracking-tight">{item.title}</h4>
                                        <p className="text-gray-400 text-sm font-medium">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 bg-brand-red/5 rounded-[3rem] -rotate-3 scale-105" />
                        <img
                            src="https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1000&q=80"
                            alt="Equipe trabalhando"
                            className="relative rounded-[3rem] shadow-2xl"
                        />
                    </div>
                </div>
            </section>

            {/* Pricing */}
            <section className="py-32">
                <div className="max-w-7xl mx-auto px-6 space-y-16">
                    <div className="text-center space-y-4">
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter leading-none italic font-serif">Planos que cabem <span className="text-brand-red">no seu bolso.</span></h2>
                        <p className="text-gray-500 font-medium">Sem letras miúdas ou taxas de cancelamento. Transparência total.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {plans.map((plan, i) => (
                            <div key={i} className={`bg-white p-12 rounded-[3rem] border-4 ${plan.color} relative overflow-hidden transition-all hover:scale-[1.02]`}>
                                {plan.popular && (
                                    <div className="absolute top-8 right-8 bg-brand-red text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
                                        Mais Popular
                                    </div>
                                )}
                                <div className="space-y-8">
                                    <div>
                                        <h3 className="text-2xl font-black text-gray-900">{plan.name}</h3>
                                        <p className="text-gray-400 text-sm mt-2 font-medium">{plan.desc}</p>
                                    </div>

                                    <div className="flex items-baseline">
                                        <span className="text-4xl font-black text-gray-900">{plan.price}</span>
                                        <span className="text-gray-400 text-sm font-bold ml-1">{plan.period}</span>
                                    </div>

                                    <ul className="space-y-4">
                                        {plan.features.map((feature, j) => (
                                            <li key={j} className="flex items-center space-x-3 text-sm font-bold text-gray-600">
                                                <CheckCircle2 size={18} className="text-emerald-500" />
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <button className={`w-full py-5 rounded-2xl font-black text-lg transition-all active:scale-95 ${plan.btnColor}`}>
                                        Começar Agora
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ / CTA */}
            <section className="max-w-5xl mx-auto px-6 pb-32">
                <div className="bg-gray-900 rounded-[3rem] p-12 md:p-20 text-center space-y-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-red opacity-10 blur-[80px]" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-red opacity-10 blur-[80px]" />

                    <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-tight italic font-serif">
                        Ainda tem alguma <br /><span className="text-brand-red">dúvida sobre como anunciar?</span>
                    </h2>
                    <p className="text-gray-400 text-lg max-w-xl mx-auto">
                        Nossa equipe comercial está pronta para te ajudar a escolher o melhor plano para o seu tipo de negócio.
                    </p>
                    <button className="bg-white text-gray-900 px-12 py-5 rounded-2xl font-black text-xl hover:scale-105 active:scale-95 transition-all flex items-center space-x-3 mx-auto shadow-2xl">
                        <MessageCircle size={24} className="text-brand-red" />
                        <span>Chamar no WhatsApp</span>
                    </button>
                </div>
            </section>
        </div>
    );
}
