'use client';

import React from 'react';
import {
    Heart,
    MapPin,
    TrendingUp,
    Users,
    Search,
    ArrowRight,
    Star,
    Cat,
    Coffee,
    Building2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.5, ease: 'easeOut' as const }
});

export default function SobrePage() {
    const router = useRouter();

    const stats = [
        { value: '30+', label: 'Anos de mercado', icon: Star },
        { value: '200k+', label: 'Usuários/mês', icon: Users },
        { value: '2M+', label: 'Buscas/ano', icon: Search },
        { value: '28', label: 'Cidades atendidas', icon: MapPin },
    ];

    const cidades = [
        'Alto Feliz', 'Arroio do Sal', 'Barão', 'Bento Gonçalves',
        'Boa Vista do Sul', 'Bom Princípio', 'Campo Bom', 'Canela',
        'Carlos Barbosa', 'Caxias do Sul', 'Coronel Pilar', 'Farroupilha',
        'Feliz', 'Flores da Cunha', 'Garibaldi', 'Gramado', 'Lajeado',
        'Monte Belo do Sul', 'Nova Prata', 'Nova Roma do Sul', 'Novo Hamburgo',
        'Pinto Bandeira', 'Salvador do Sul', 'São Marcos', 'São Pedro da Serra',
        'São Sebastião do Caí', 'São Vendelino', 'Veranópolis',
    ];

    const valores = [
        {
            icon: '👩‍💼',
            title: 'Liderança Feminina',
            desc: 'Apesar de ser "O" Vermelhinho no masculino, nossa equipe é composta integralmente por mulheres. Acreditamos na força da liderança feminina para guiar nossos negócios com competência e determinação.'
        },
        {
            icon: '🐾',
            title: 'Pet Friendly',
            desc: 'Somos apaixonados por animais! Nosso escritório é pet friendly e adoramos receber a visita de pets que queiram nos conhecer.'
        },
        {
            icon: '☕',
            title: 'Ambiente Acolhedor',
            desc: 'Se você vier até nosso escritório, sempre haverá um café quentinho e uma água bem geladinha esperando. E como estamos no décimo andar, temos uma linda vista da cidade!'
        },
        {
            icon: '📱',
            title: 'Presença Digital Completa',
            desc: 'Além do site e aplicativo, temos uma equipe focada em redes sociais e blog — vídeos, sorteios, stories e postagens para engajar empresas e seus seguidores.'
        },
    ];

    return (
        <div className="min-h-screen bg-cloud-dancer font-sans selection:bg-brand-red/10 overflow-x-hidden">

            {/* ── HERO ── */}
            <section className="relative pt-32 pb-28 overflow-hidden">
                {/* Decoração */}
                <div className="absolute inset-0 bg-gradient-to-br from-brand-red/5 via-transparent to-transparent pointer-events-none" />
                <div className="absolute -top-24 -right-24 w-[500px] h-[500px] rounded-full bg-brand-red/5 blur-[120px] pointer-events-none" />

                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
                    <div className="space-y-8">
                        <motion.div {...fadeUp(0)} className="inline-flex items-center space-x-2 px-4 py-2 bg-white rounded-full border border-gray-100 shadow-sm">
                            <span className="text-brand-red text-sm">🗺️</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">O Guia da Serra Gaúcha</span>
                        </motion.div>

                        <motion.h1 {...fadeUp(0.1)} className="text-5xl md:text-7xl font-black text-gray-900 tracking-tighter leading-[0.9] font-serif italic">
                            Conectamos<br />pessoas a <span className="text-brand-red">negócios.</span>
                        </motion.h1>

                        <motion.p {...fadeUp(0.2)} className="text-gray-500 text-lg leading-relaxed max-w-xl font-medium">
                            Há mais de 30 anos, somos o maior guia de informações comerciais da Serra Gaúcha — do papel impresso à inteligência digital.
                        </motion.p>

                        <motion.div {...fadeUp(0.3)} className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={() => router.push('/anuncie')}
                                className="px-10 py-5 bg-brand-red text-white rounded-2xl font-black text-lg shadow-2xl shadow-red-200 hover:scale-105 active:scale-95 transition-all flex items-center space-x-3"
                            >
                                <span>Anuncie Conosco</span>
                                <ArrowRight size={20} />
                            </button>
                            <button
                                onClick={() => router.push('/busca')}
                                className="px-10 py-5 bg-white text-gray-900 border border-gray-100 rounded-2xl font-black text-lg shadow-sm hover:shadow-md active:scale-95 transition-all"
                            >
                                Explorar o Portal
                            </button>
                        </motion.div>
                    </div>

                    {/* Visual Card */}
                    <motion.div {...fadeUp(0.3)} className="relative hidden lg:block">
                        <div className="absolute inset-0 bg-brand-red/5 rounded-[4rem] rotate-3 scale-105" />
                        <div className="relative bg-white rounded-[4rem] p-10 shadow-2xl border border-gray-50 space-y-8">
                            {/* Mini logo decorativo */}
                            <div className="flex items-center space-x-4">
                                <div className="bg-brand-red w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg shadow-red-100 rotate-3">
                                    <span className="text-white font-black text-3xl italic">V</span>
                                </div>
                                <div>
                                    <p className="font-black text-2xl text-gray-900 italic font-serif tracking-tighter">O Vermelhinho</p>
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-red">Desde 1994</p>
                                </div>
                            </div>

                            <blockquote className="text-gray-500 text-lg font-medium leading-relaxed italic border-l-4 border-brand-red pl-6">
                                "Fui um guia impresso, de papel mesmo. Hoje sou digital — site e aplicativo distribuindo informações para mais de 200 mil usuários por mês."
                            </blockquote>

                            <div className="grid grid-cols-2 gap-4">
                                {stats.map((s, i) => (
                                    <div key={i} className="bg-gray-50 rounded-2xl p-5 space-y-1">
                                        <p className="text-2xl font-black text-gray-900">{s.value}</p>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{s.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ── ESTATÍSTICAS MOBILE ── */}
            <section className="lg:hidden pb-16 px-6">
                <div className="grid grid-cols-2 gap-4">
                    {stats.map((s, i) => (
                        <div key={i} className="bg-white rounded-[2rem] p-8 border border-gray-50 shadow-sm space-y-2">
                            <p className="text-3xl font-black text-gray-900">{s.value}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-brand-red">{s.label}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── HISTÓRIA ── */}
            <section className="bg-white py-32 rounded-[4rem] shadow-sm mx-4 md:mx-0">
                <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                    <div className="space-y-8">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-red mb-4">Nossa História</p>
                            <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter italic font-serif leading-none">
                                De lista telefônica <br /> ao <span className="text-brand-red">guia digital.</span>
                            </h2>
                        </div>

                        <div className="space-y-6 text-gray-500 font-medium text-base leading-relaxed">
                            <p>
                                Sou O Vermelhinho, o site de informações da Serra Gaúcha! Minha razão de existir é dar o suporte necessário para o crescimento de empresas e profissionais que buscam uma ampla divulgação de seus produtos e serviços através da internet.
                            </p>
                            <p>
                                Muito conhecido na cidade de Farroupilha, já estamos no mercado há mais de 30 anos. Já fomos um guia impresso — de papel mesmo — chamado de lista telefônica. Éramos responsáveis pela divulgação dos telefones residenciais e comerciais de Farroupilha, Carlos Barbosa, Garibaldi, Boa Vista do Sul, Coronel Pilar e Bento Gonçalves.
                            </p>
                            <p>
                                Hoje somos digitais — site e aplicativo — distribuindo informações para mais de 200 mil usuários por mês, com mais de 2 milhões de buscas feitas anualmente em nossa plataforma.
                            </p>
                        </div>
                    </div>

                    {/* Timeline visual */}
                    <div className="relative space-y-0">
                        {[
                            { year: '1994', label: 'Fundação', desc: 'Nascia o guia impresso de lista telefônica da Serra Gaúcha.' },
                            { year: '2010', label: 'Digitalização', desc: 'Migração para o ambiente digital, com site e plataforma de buscas.' },
                            { year: '2018', label: 'App Mobile', desc: 'Lançamento do aplicativo, expandindo o alcance para smartphones.' },
                            { year: 'Hoje', label: 'IA + Geo', desc: 'Plataforma com IA de busca semântica e inteligência geográfica.' },
                        ].map((item, i) => (
                            <div key={i} className="flex items-start space-x-6 group">
                                <div className="flex flex-col items-center">
                                    <div className="w-14 h-14 rounded-2xl bg-brand-red/5 group-hover:bg-brand-red group-hover:text-white transition-all flex items-center justify-center font-black text-brand-red text-xs tracking-tight">
                                        {item.year}
                                    </div>
                                    {i < 3 && <div className="w-px h-10 bg-gray-100 my-2" />}
                                </div>
                                <div className="pt-3 space-y-1 pb-6">
                                    <p className="font-black text-gray-900 text-lg tracking-tight">{item.label}</p>
                                    <p className="text-gray-400 font-medium text-sm">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── VALORES / CULTURA ── */}
            <section className="py-32 px-6">
                <div className="max-w-7xl mx-auto space-y-16">
                    <div className="text-center space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-red">Nossa Cultura</p>
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter italic font-serif leading-none">
                            Mais do que um guia, <span className="text-brand-red">somos pessoas.</span>
                        </h2>
                        <p className="text-gray-400 font-medium max-w-2xl mx-auto">
                            Quem está por trás do Vermelhinho é uma equipe apaixonada pelo que faz, com uma cultura que celebra a diversidade, os animais e o café.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {valores.map((v, i) => (
                            <div
                                key={i}
                                className="bg-white p-10 rounded-[3rem] border border-gray-50 shadow-sm hover:shadow-xl hover:shadow-gray-100/80 hover:scale-[1.02] transition-all space-y-4 group"
                            >
                                <div className="text-5xl group-hover:scale-110 transition-transform inline-block">{v.icon}</div>
                                <h3 className="text-2xl font-black text-gray-900 tracking-tight">{v.title}</h3>
                                <p className="text-gray-400 font-medium leading-relaxed">{v.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── COBERTURA ── */}
            <section className="bg-gray-900 py-32 px-6 rounded-[4rem] text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-red opacity-10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />

                <div className="max-w-7xl mx-auto space-y-16 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-red">Cobertura Regional</p>
                            <h2 className="text-3xl md:text-5xl font-black tracking-tighter italic font-serif leading-tight md:leading-none">
                                Presente em mais de <br className="hidden md:block" /><span className="text-brand-red">28 cidades</span> da Serra Gaúcha.
                            </h2>
                            <p className="text-gray-400 font-medium leading-relaxed max-w-lg">
                                De Farroupilha a Gramado, de Garibaldi a Novo Hamburgo — onde houver um negócio para encontrar, o Vermelhinho está lá para conectar.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-wrap gap-2 md:gap-3">
                            {cidades.map((cidade, i) => (
                                <span
                                    key={i}
                                    className="px-3 py-2.5 bg-white/5 hover:bg-brand-red hover:text-white text-gray-400 text-[9px] md:text-xs font-black uppercase tracking-widest rounded-xl border border-white/10 hover:border-brand-red transition-all cursor-default text-center flex items-center justify-center min-h-[44px] md:min-h-0"
                                >
                                    {cidade}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── CTA ── */}
            <section className="py-32 px-6">
                <div className="max-w-4xl mx-auto text-center space-y-10">
                    <h2 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tighter italic font-serif leading-none">
                        Faça parte da família <span className="text-brand-red">Vermelhinho.</span>
                    </h2>
                    <p className="text-gray-400 font-medium text-lg max-w-xl mx-auto">
                        Anuncie sua empresa e conecte-se a milhares de clientes que buscam pelo que você oferece todos os dias.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => router.push('/anuncie')}
                            className="px-12 py-6 bg-brand-red text-white rounded-2xl font-black text-xl shadow-2xl shadow-red-200 hover:scale-105 active:scale-95 transition-all"
                        >
                            Quero Anunciar
                        </button>
                        <a
                            href="https://wa.me/5554326800002"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-12 py-6 bg-white text-gray-900 border-2 border-gray-100 rounded-2xl font-black text-xl shadow-sm hover:shadow-md active:scale-95 transition-all"
                        >
                            💬 Falar no WhatsApp
                        </a>
                    </div>

                    <p className="text-gray-300 text-xs font-bold">
                        Escritório: Rua Cel. Pena de Moraes, 513 - Sala 1004 - Centro, Farroupilha/RS
                    </p>
                </div>
            </section>
        </div>
    );
}
