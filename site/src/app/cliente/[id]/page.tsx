'use client';

import { useState } from 'react';
import { MessageCircle, Phone, MapPin, Share2, Heart, Star, Clock, Briefcase, ChevronRight, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

export default function ClientProfile() {
    const params = useParams();
    const id = params.id as string;

    const [isFavorite, setIsFavorite] = useState(false);
    const [showApplySuccess, setShowApplySuccess] = useState(false);
    const router = useRouter();
    const { trackInteraction } = useAnalytics();

    const { data: response, isLoading } = useQuery({
        queryKey: ['client', id],
        queryFn: async () => {
            const res = await api.get(`/public/clientes/${id}`);
            return res.data.data;
        },
        enabled: !!id
    });

    const client = response;

    useEffect(() => {
        if (client) {
            trackInteraction(Number(id), 'page_view');
        }
    }, [client, id]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-cloud-dancer">
                <div className="w-12 h-12 border-4 border-brand-red border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!client) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-cloud-dancer space-y-6">
                <h1 className="text-4xl font-black text-gray-900 font-serif italic">Ops!</h1>
                <p className="text-gray-500 font-sans">Empresa não encontrada.</p>
                <button onClick={() => router.push('/')} className="bg-brand-red text-white px-8 py-4 rounded-2xl font-black font-sans">Voltar ao Início</button>
            </div>
        );
    }

    const handleWhatsAppClick = () => {
        trackInteraction(Number(id), 'whatsapp_click');
        const whatsapp = client.contatos?.find((c: any) => c.whatsapp_selected)?.whatsapp_selected
            || client.contatos?.[0]?.celular
            || client.contatos?.[0]?.telefone_principal;

        if (whatsapp) {
            const cleanNumber = whatsapp.replace(/\D/g, '');
            window.open(`https://wa.me/55${cleanNumber}?text=Vi%20seu%20an%C3%BAncio%20no%20O%20Vermelhinho`, '_blank');
        }
    };

    const handleApply = () => {


        setShowApplySuccess(true);
        setTimeout(() => setShowApplySuccess(false), 3000);
    };

    return (
        <div className="min-h-screen bg-cloud-dancer font-sans">
            {/* 1. COVER & ACTIONS */}
            <div className="relative h-[40vh] md:h-[50vh] overflow-hidden">
                <img
                    src={client.galeria?.[0]?.url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&auto=format&fit=crop&q=80"}
                    className="w-full h-full object-cover brightness-[0.8] contrast-[1.1]"
                    alt={client.nome_fantasia}
                />

                {/* Top Floating Actions */}
                <div className="absolute top-6 left-6 right-6 flex justify-between z-20">
                    <button
                        onClick={() => router.back()}
                        className="bg-white/20 backdrop-blur-md p-3 rounded-2xl border border-white/20 text-white active:scale-75 transition-all shadow-xl cursor-pointer"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div className="flex space-x-3">
                        <button className="bg-white/20 backdrop-blur-md p-3 rounded-2xl border border-white/20 text-white active:scale-75 transition-all shadow-xl cursor-pointer">
                            <Share2 size={24} />
                        </button>
                        <button
                            onClick={() => setIsFavorite(!isFavorite)}
                            className={`backdrop-blur-md p-3 rounded-2xl border border-white/20 active:scale-75 transition-all shadow-xl cursor-pointer ${isFavorite ? 'bg-brand-red text-white' : 'bg-white/20 text-white'}`}
                        >
                            <Heart size={24} fill={isFavorite ? "currentColor" : "none"} />
                        </button>
                    </div>
                </div>

                {/* Floating Profile Overlap */}
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-cloud-dancer to-transparent"></div>
            </div>

            <main className="px-6 relative -mt-10 z-10 space-y-8 pb-40 lg:max-w-4xl lg:mx-auto">
                {/* 2. PROFILE HEADER */}
                <div className="bg-white rounded-[3.5rem] p-8 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] border-4 border-white gummy-card">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <div className="flex items-center space-x-2 font-sans">
                                <span className="text-[10px] font-black text-brand-red uppercase tracking-[0.3em]">{client.segmentos?.[0]?.nome || 'Negócio Local'}</span>
                                <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                                <span className="text-[10px] font-black text-green-500 uppercase tracking-widest flex items-center">
                                    <Clock size={12} className="mr-1" /> Aberto Agora
                                </span>
                            </div>
                            <h1 className="text-4xl font-black text-gray-900 tracking-tighter leading-none pt-1 font-serif">{client.nome_fantasia}</h1>
                            <p className="text-gray-400 font-bold text-sm pt-1 flex items-center font-sans cursor-pointer" onClick={() => trackInteraction(Number(id), 'waze_click')}>
                                <MapPin size={14} className="mr-1" /> {client.enderecos?.[0]?.rua}, {client.enderecos?.[0]?.numero} - {client.enderecos?.[0]?.bairro}, {client.enderecos?.[0]?.cidade}
                            </p>
                        </div>
                        <div className="bg-red-50 p-4 rounded-3xl text-center shadow-inner">
                            <div className="flex items-center justify-center space-x-1">
                                <Star size={18} className="text-brand-red fill-brand-red" />
                                <span className="text-xl font-black text-gray-900 font-serif italic">{client.google_rating || '5.0'}</span>
                            </div>
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-1 font-sans">{client.reviews_count || '0'} avaliações</p>
                        </div>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-gray-50 font-sans">
                        <div className="text-center space-y-1">
                            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Preço</p>
                            <p className="font-black text-gray-900">$$$</p>
                        </div>
                        <div className="text-center space-y-1 border-x border-gray-50">
                            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Tempo</p>
                            <p className="font-black text-gray-900">20-40m</p>
                        </div>
                        <div className="text-center space-y-1">
                            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Vagas</p>
                            <p className="font-black text-brand-red flex items-center justify-center underline decoration-2 underline-offset-4 cursor-pointer">02 Ativas</p>
                        </div>
                    </div>
                </div>

                {/* 3. VAGAS ATRITO ZERO (Zero-Friction Application) */}
                <section className="space-y-6">
                    <h2 className="text-2xl font-black text-gray-900 tracking-tighter font-serif">Vagas em Aberto</h2>
                    <div className="bg-white rounded-[3rem] p-8 shadow-xl border-4 border-white gummy-card space-y-6">
                        <div className="flex items-center justify-between group cursor-pointer active:scale-95 transition-all">
                            <div className="flex items-center space-x-5">
                                <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 shadow-sm border border-purple-100">
                                    <Briefcase size={26} />
                                </div>
                                <div className="font-sans">
                                    <h4 className="font-black text-lg text-gray-900 font-serif italic">Garçom/Garçonete</h4>
                                    <p className="text-xs font-bold text-gray-400">R$ 1.800 + caixinha • 6x1</p>
                                </div>
                            </div>
                            <button
                                onClick={handleApply}
                                className="bg-gray-900 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-brand-red transition-colors shadow-lg shadow-black/10 active:scale-90 cursor-pointer font-sans"
                            >
                                {showApplySuccess ? 'Enviado!' : 'Candidatar'}
                            </button>
                        </div>

                        {showApplySuccess && (
                            <div className="bg-green-50 p-4 rounded-2xl flex items-center space-x-3 text-green-700 animate-in slide-in-from-top-4 font-sans">
                                <CheckCircle2 size={20} />
                                <span className="text-xs font-black uppercase tracking-widest">Currículo enviado com sucesso via IA</span>
                            </div>
                        )}
                    </div>
                </section>

                {/* 4. GALERIA & DESCRIÇÃO */}
                <section className="space-y-6 pb-10">
                    <h2 className="text-2xl font-black text-gray-900 tracking-tighter font-serif">Sobre o Local</h2>
                    <div className="space-y-4">
                        <p className="text-gray-500 font-medium leading-relaxed font-sans">
                            {client.descricao || 'Nenhuma descrição disponível para este local.'}
                        </p>
                        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                            {client.galeria?.map((img: any, i: number) => (
                                <div key={i} className="min-w-[60%] h-44 bg-gray-200 rounded-[2.5rem] overflow-hidden shadow-inner gummy-card cursor-pointer">
                                    <img src={img.url} className="w-full h-full object-cover" alt="Galeria" />
                                </div>
                            )) || [1, 2, 3].map(i => (
                                <div key={i} className="min-w-[60%] h-44 bg-gray-200 rounded-[2.5rem] overflow-hidden shadow-inner gummy-card cursor-pointer">
                                    <img src={`https://images.unsplash.com/photo-1552566626-52f8b828add9?w=500&auto=format&fit=crop&q=60&${i}`} className="w-full h-full object-cover" alt="Galeria" />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            {/* 5. CONVERSION BAR (Mobile-first) */}
            <footer className="fixed bottom-0 left-0 right-0 p-6 z-50 bg-gradient-to-t from-cloud-dancer via-cloud-dancer/90 to-transparent">
                <div className="flex space-x-4">
                    <button
                        onClick={handleWhatsAppClick}
                        className="flex-1 bg-[#25D366] text-white py-6 rounded-[2.5rem] font-black text-xl shadow-[0_25px_50px_-10px_rgba(37,211,102,0.4)] flex items-center justify-center space-x-3 active:scale-95 transition-all group overflow-hidden relative cursor-pointer font-sans"
                    >
                        <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-active:translate-x-[100%] transition-transform duration-500"></div>
                        <MessageCircle fill="currentColor" size={28} />
                        <span>WhatsApp</span>
                    </button>
                    <button
                        onClick={() => trackInteraction(Number(id), 'social_click')}
                        className="bg-white text-gray-900 p-6 rounded-[2.5rem] shadow-xl border border-gray-100 active:scale-90 transition-all flex items-center justify-center cursor-pointer font-sans"
                    >
                        <Phone size={28} />
                    </button>
                </div>
            </footer>
        </div>
    );
}
