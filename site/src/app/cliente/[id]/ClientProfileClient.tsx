'use client';

import { useState, useEffect } from 'react';
import {
    MessageCircle, Phone, MapPin, Share2, Heart, Star, Clock,
    Briefcase, ChevronRight, CheckCircle2, ArrowLeft, Search,
    User, Menu, Info, ImageIcon, MessageSquare, Instagram,
    Facebook, Globe, ExternalLink, ChevronLeft, Linkedin, Youtube,
    X, Maximize2, Copy, Check
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/services/api';

export default function ClientProfileClient() {
    const params = useParams();
    const id = params.id as string;
    const router = useRouter();
    const { trackInteraction } = useAnalytics();
    const [isFavorite, setIsFavorite] = useState(false);
    const [activeTab, setActiveTab] = useState('Sobre');
    const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
    const [showShareToast, setShowShareToast] = useState(false);
    const [isSharing, setIsSharing] = useState(false);

    const { data: client, isLoading } = useQuery({
        queryKey: ['client', id],
        queryFn: async () => {
            const res = await api.get(`/public/clientes/${id}`);
            return res.data.data;
        },
        enabled: !!id
    });

    const { data: recommendations } = useQuery({
        queryKey: ['recommendations', id],
        queryFn: async () => {
            const res = await api.get(`/public/clientes/${id}/recommendations`);
            return res.data.data;
        },
        enabled: !!id
    });

    useEffect(() => {
        if (client) {
            trackInteraction(client.id, 'page_view');
        }
    }, [client, trackInteraction]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="w-12 h-12 border-4 border-brand-red border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!client) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 space-y-6">
                <h1 className="text-4xl font-black text-gray-900 font-serif italic">Ops!</h1>
                <p className="text-gray-500">Empresa não encontrada.</p>
                <button onClick={() => router.push('/')} className="bg-brand-red text-white px-8 py-4 rounded-2xl font-black">Voltar ao Início</button>
            </div>
        );
    }

    const handleWhatsAppClick = () => {
        trackInteraction(client.id, 'whatsapp_click');
        const contact = client.contatos?.[0];
        if (!contact) return;

        let whatsapp = null;

        if (contact.whatsapp_selected && contact[contact.whatsapp_selected]) {
            whatsapp = contact[contact.whatsapp_selected];
        }

        if (!whatsapp) {
            const priority = [
                { key: 'telefone_principal', flag: 'exibir_tel_principal', isWA: contact.whatsapp_principal },
                { key: 'celular', flag: 'exibir_celular', isWA: true },
                { key: 'telefone_secundario', flag: 'exibir_tel_secundario', isWA: contact.whatsapp_secundario },
                { key: 'telefone_outro', flag: 'exibir_tel_outro', isWA: true }
            ];

            const found = priority.find(p => contact[p.key] && (contact[p.flag] || p.isWA));
            if (found) whatsapp = contact[found.key];
        }

        if (whatsapp) {
            const cleanNumber = whatsapp.replace(/\D/g, '');
            window.open(`https://wa.me/55${cleanNumber}?text=Olá! Vi seu anúncio no O Vermelhinho.`, '_blank');
        }
    };

    const handleCallClick = () => {
        trackInteraction(client.id, 'call_click');
        const contact = client.contatos?.[0];
        if (!contact) return;

        const priority = [
            { key: 'telefone_principal', flag: 'exibir_tel_principal' },
            { key: 'celular', flag: 'exibir_celular' },
            { key: 'telefone_secundario', flag: 'exibir_tel_secundario' },
            { key: 'telefone_outro', flag: 'exibir_tel_outro' }
        ];

        const found = priority.find(p => contact[p.key] && contact[p.flag]);
        const phone = found ? contact[found.key] : (contact.telefone_principal || contact.celular);

        if (phone) window.location.href = `tel:${phone.replace(/\D/g, '')}`;
    };

    const handleNextImage = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (selectedImageIndex !== null && client.galeria) {
            setSelectedImageIndex((selectedImageIndex + 1) % client.galeria.length);
        }
    };

    const handlePrevImage = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (selectedImageIndex !== null && client.galeria) {
            setSelectedImageIndex((selectedImageIndex - 1 + client.galeria.length) % client.galeria.length);
        }
    };

    const handleShareClick = async () => {
        if (isSharing) return;
        setIsSharing(true);

        try {
            trackInteraction(client.id, 'share_click');
            const shareData = {
                title: client.nome_fantasia,
                text: `Confira ${client.nome_fantasia} no O Vermelhinho!`,
                url: window.location.href,
            };

            if (navigator.share) {
                try {
                    await navigator.share(shareData);
                } catch (err) {
                    if (err instanceof Error && err.name !== 'AbortError') {
                        console.error('Share failed', err);
                    }
                }
            } else {
                try {
                    await navigator.clipboard.writeText(window.location.href);
                    setShowShareToast(true);
                    setTimeout(() => setShowShareToast(false), 3000);
                } catch (err) {
                    console.error('Failed to copy', err);
                }
            }
        } finally {
            setIsSharing(false);
        }
    };

    const tabs = ['Sobre', 'Fotos', 'Avaliações', 'Vagas'];

    const daysMap: Record<number, string> = {
        1: 'Segunda', 2: 'Terça', 3: 'Quarta', 4: 'Quinta', 5: 'Sexta', 6: 'Sábado', 7: 'Domingo'
    };

    const schedule = Array.isArray(client.horario_atendimento)
        ? client.horario_atendimento
        : [];

    const getTodayStatus = () => {
        const today = new Date().getDay();
        const systemDay = today === 0 ? 7 : today;
        const todaySchedule = schedule.find((s: any) => s.day === systemDay);

        if (!todaySchedule || todaySchedule.closed) return { open: false, label: 'Fechado' };

        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        if (currentTime >= todaySchedule.open && currentTime <= todaySchedule.close) {
            return { open: true, label: `Aberto até ${todaySchedule.close}` };
        }

        return { open: false, label: `Fechado (Abre às ${todaySchedule.open})` };
    };

    const status = getTodayStatus();

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-24 md:pb-0">

            {/* 🖥️ DESKTOP NAVBAR */}
            <header className="hidden md:flex sticky top-0 z-[100] bg-white border-b border-gray-100 px-8 py-4 items-center justify-between">
                <div className="flex items-center space-x-12">
                    <div className="flex items-center space-x-2 cursor-pointer" onClick={() => router.push('/')}>
                        <div className="bg-brand-red w-8 h-8 rounded-xl flex items-center justify-center">
                            <span className="text-white font-black italic">V</span>
                        </div>
                        <span className="font-black text-xl tracking-tighter font-serif">O Vermelhinho</span>
                    </div>
                </div>
                <div className="flex items-center space-x-6">
                    <button onClick={() => router.push('/')} className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-brand-red transition-all">Explorar</button>
                    <button className="bg-brand-red text-white px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-red-100 active:scale-95 transition-all">Entrar</button>
                </div>
            </header>

            {/* 🤖 JSON-LD STRUCTURED DATA (Google LocalBusiness) */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "LocalBusiness",
                        "name": client.nome_fantasia,
                        "image": client.logotipo_url || client.galeria?.[0]?.url,
                        "description": client.descricao,
                        "address": {
                            "@type": "PostalAddress",
                            "streetAddress": `${client.enderecos?.[0]?.rua}, ${client.enderecos?.[0]?.numero}`,
                            "addressLocality": client.enderecos?.[0]?.cidade,
                            "addressRegion": client.enderecos?.[0]?.estado,
                            "postalCode": client.enderecos?.[0]?.cep,
                            "addressCountry": "BR"
                        },
                        "geo": {
                            "@type": "GeoCoordinates",
                            "latitude": client.enderecos?.[0]?.latitude,
                            "longitude": client.enderecos?.[0]?.longitude
                        },
                        "url": `https://overmelhinho.com.br/cliente/${client.slug || client.id}`,
                        "telephone": client.contatos?.[0]?.telefone_principal || client.contatos?.[0]?.celular
                    })
                }}
            />

            {/* 📱 MOBILE HEADER ACTIONS */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-[100] px-6 py-8 flex justify-between pointer-events-none">
                <button onClick={() => router.back()} className="w-12 h-12 bg-white/20 backdrop-blur-xl rounded-2xl border border-white/30 text-white flex items-center justify-center shadow-2xl active:scale-75 transition-all pointer-events-auto cursor-pointer">
                    <ArrowLeft size={24} />
                </button>
                <div className="flex space-x-3 pointer-events-auto">
                    <button
                        onClick={handleShareClick}
                        className="w-12 h-12 bg-white/20 backdrop-blur-xl rounded-2xl border border-white/30 text-white flex items-center justify-center shadow-2xl active:scale-75 transition-all cursor-pointer"
                    >
                        <Share2 size={24} />
                    </button>
                    <button
                        onClick={() => setIsFavorite(!isFavorite)}
                        className={`w-12 h-12 backdrop-blur-xl rounded-2xl border border-white/30 flex items-center justify-center shadow-2xl active:scale-75 transition-all cursor-pointer ${isFavorite ? 'bg-brand-red text-white' : 'bg-white/20 text-white'}`}
                    >
                        <Heart size={24} fill={isFavorite ? "white" : "none"} />
                    </button>
                </div>
            </div>

            {/* 📸 HERO / COVER */}
            <section className="relative h-[46vh] overflow-hidden">
                <img
                    src={client.galeria?.[0]?.url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&auto=format&fit=crop&q=80"}
                    className="w-full h-full object-cover"
                    alt={client.nome_fantasia}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 md:to-transparent"></div>
            </section>

            {/* 🏢 PROFILE AREA */}
            <div className="max-w-7xl mx-auto px-6 lg:px-12 relative -mt-12 md:-mt-24 z-10">

                <div className="bg-white rounded-[3rem] md:rounded-[4rem] p-8 md:p-12 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.12)] border-2 border-white gummy-card relative">

                    {/* Floating Profile Image */}
                    <div className="absolute -top-12 md:-top-20 left-10 w-24 h-24 md:w-40 md:h-40 rounded-3xl md:rounded-full bg-brand-red p-1 shadow-2xl border-4 border-white overflow-hidden group bg-white">
                        <img
                            src={client.logotipo_url || "https://images.unsplash.com/photo-1599305090598-fe179d501227?w=400"}
                            className="w-full h-full object-contain p-2 rounded-[1.2rem] md:rounded-full group-hover:scale-110 transition-transform duration-700"
                            alt="Logo"
                        />
                    </div>

                    <div className="mt-12 md:mt-0 md:ml-48 space-y-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="space-y-2">
                                <div className="flex items-center space-x-3">
                                    <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tighter font-serif italic uppercase leading-none">{client.nome_fantasia}</h1>
                                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center shadow-lg" title="Verificado">
                                        <CheckCircle2 size={12} className="text-white" fill="white" />
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-4 text-[11px] md:text-xs font-black uppercase tracking-widest font-sans">
                                    <div className={`flex items-center py-1 px-3 rounded-full ${status.open ? 'bg-green-50 text-green-500 border border-green-100' : 'bg-red-50 text-brand-red border border-red-100'}`}>
                                        <div className={`w-2 h-2 rounded-full mr-2 ${status.open ? 'bg-green-500' : 'bg-brand-red'} animate-pulse`}></div>
                                        {status.label}
                                    </div>
                                    <span className="text-gray-300 md:block hidden">•</span>
                                    <p className="text-gray-400 flex items-center">
                                        <MapPin size={14} className="mr-1.5 text-brand-red" />
                                        {client.enderecos?.[0]
                                            ? `${client.enderecos[0].rua}, ${client.enderecos[0].numero} - ${client.enderecos[0].cidade}`
                                            : 'Endereço não informado'}
                                    </p>
                                </div>
                            </div>

                            {/* CTAs DESKTOP */}
                            <div className="hidden md:flex items-center space-x-3">
                                <button
                                    onClick={handleWhatsAppClick}
                                    className="bg-brand-red text-white px-8 py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl shadow-red-100 flex items-center active:scale-95 transition-all hover:brightness-110"
                                >
                                    <MessageCircle size={20} className="mr-2" fill="currentColor" /> WhatsApp
                                </button>
                                <button
                                    onClick={handleCallClick}
                                    className="bg-gray-100 text-gray-900 px-8 py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest flex items-center active:scale-95 transition-all hover:bg-gray-200"
                                >
                                    <Phone size={20} className="mr-2" /> Ligar Agora
                                </button>
                                <button
                                    onClick={handleShareClick}
                                    className="p-5 bg-white border border-gray-100 rounded-[1.5rem] shadow-xl text-gray-400 hover:text-brand-red transition-all active:scale-75"
                                >
                                    <Share2 size={24} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 📑 TABS NAVIGATION */}
                <div className="mt-10 border-b border-gray-100 flex items-center space-x-10 md:space-x-16 overflow-x-auto no-scrollbar scroll-smooth">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-4 text-xs md:text-sm font-black uppercase tracking-[0.2em] relative transition-all whitespace-nowrap ${activeTab === tab ? 'text-brand-red' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <div className="flex items-center space-x-2">
                                {tab === 'Sobre' && <Info size={14} />}
                                {tab === 'Fotos' && <ImageIcon size={14} />}
                                {tab === 'Avaliações' && <MessageSquare size={14} />}
                                {tab === 'Vagas' && <Briefcase size={14} />}
                                <span>{tab}</span>
                            </div>
                            {activeTab === tab && (
                                <motion.div
                                    layoutId="tab-underline"
                                    className="absolute bottom-0 left-0 right-0 h-1 bg-brand-red rounded-t-full"
                                />
                            )}
                        </button>
                    ))}
                </div>

                {/* 📄 CONTENT AREA */}
                <div className="mt-12 flex flex-col lg:flex-row gap-12 pb-20">

                    {/* LEFT COLUMN: MAIN CONTENT */}
                    <div className="flex-1 space-y-12">
                        <AnimatePresence mode="wait">
                            {activeTab === 'Sobre' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="space-y-10"
                                >
                                    <section className="space-y-6">
                                        <h2 className="text-3xl font-black text-gray-900 tracking-tighter font-serif">Sobre a Empresa</h2>
                                        <p className="text-gray-500 leading-relaxed text-lg font-medium">
                                            {client.descricao || `O ${client.nome_fantasia} oferecendo soluções na sua área de atuação. Atendimento, Serviços na área, Suporte e orientação Entre em contato para mais informações.`}
                                        </p>

                                        {/* Info Boxes */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {client.data_fundacao && (
                                                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Fundada em</p>
                                                    <p className="text-lg font-black text-gray-900 font-serif italic">{new Date(client.data_fundacao).getFullYear()}</p>
                                                </div>
                                            )}
                                            <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Especialidade</p>
                                                <p className="text-lg font-black text-gray-900 font-serif italic">{client.segmentos?.[0]?.nome || 'Negócio Local'}</p>
                                            </div>
                                        </div>
                                    </section>

                                    {/* MAP SECTION */}
                                    <section className="space-y-6">
                                        <h2 className="text-3xl font-black text-gray-900 tracking-tighter font-serif">Localização</h2>
                                        <div className="h-72 md:h-96 w-full rounded-[3rem] overflow-hidden bg-gray-100 relative shadow-inner border-4 border-white gummy-card">
                                            {client.enderecos?.[0] ? (
                                                <iframe
                                                    width="100%"
                                                    height="100%"
                                                    style={{ border: 0 }}
                                                    loading="lazy"
                                                    allowFullScreen
                                                    referrerPolicy="no-referrer-when-downgrade"
                                                    src={`https://www.google.com/maps?q=${encodeURIComponent(`${client.enderecos[0].rua}, ${client.enderecos[0].numero} - ${client.enderecos[0].bairro}, ${client.enderecos[0].cidade}`)}&t=&z=16&ie=UTF8&iwloc=&output=embed`}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center space-y-4 text-gray-400 font-bold italic">
                                                    <MapPin size={32} />
                                                    <p>Endereço não informado</p>
                                                </div>
                                            )}
                                        </div>
                                    </section>
                                </motion.div>
                            )}

                            {activeTab === 'Fotos' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="grid grid-cols-2 md:grid-cols-3 gap-6"
                                >
                                    {client.galeria?.length > 0 ? client.galeria.map((img: any, i: number) => (
                                        <motion.div
                                            key={i}
                                            whileHover={{ y: -10 }}
                                            onClick={() => setSelectedImageIndex(i)}
                                            className="group relative aspect-square rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white cursor-pointer gummy-card"
                                        >
                                            <img
                                                src={img.url}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                alt="Galeria"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-gray-900 transform scale-50 group-hover:scale-100 transition-transform duration-500">
                                                    <Maximize2 size={24} />
                                                </div>
                                            </div>
                                        </motion.div>
                                    )) : (
                                        <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-400 space-y-4">
                                            <ImageIcon size={48} className="opacity-20" />
                                            <p className="font-bold italic">Nenhuma foto disponível para esta empresa.</p>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {activeTab === 'Vagas' && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                    {client.job_opportunities?.length > 0 ? client.job_opportunities.map((job: any) => (
                                        <div key={job.id} className="bg-white p-8 rounded-[2.5rem] border-2 border-gray-50 shadow-xl flex items-center justify-between group gummy-card">
                                            <div className="flex items-center space-x-6">
                                                <div className="w-16 h-16 bg-red-50 text-brand-red rounded-2xl flex items-center justify-center">
                                                    <Briefcase size={28} />
                                                </div>
                                                <div>
                                                    <h4 className="text-xl font-black font-serif italic text-gray-900">{job.title}</h4>
                                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                                                        {job.work_model} • {job.salary_range || 'Salário a combinar'}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    const text = encodeURIComponent(`Olá! Tenho interesse na vaga de ${job.title} que vi no O Vermelhinho.`);
                                                    const phone = job.contact_whatsapp || client.contatos?.[0]?.celular;
                                                    if (phone) window.open(`https://wa.me/55${phone.replace(/\D/g, '')}?text=${text}`, '_blank');
                                                }}
                                                className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-brand-red transition-all shadow-lg active:scale-90"
                                            >
                                                Candidatar
                                            </button>
                                        </div>
                                    )) : (
                                        <div className="bg-white p-8 rounded-[2.5rem] border-2 border-gray-50 shadow-xl flex flex-col items-center justify-center text-center space-y-4 py-20">
                                            <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center">
                                                <Briefcase size={32} />
                                            </div>
                                            <h3 className="text-xl font-black font-serif italic text-gray-400 uppercase">Nenhuma vaga ativa</h3>
                                            <p className="text-xs text-gray-400 font-bold max-w-xs">Fique de olho! Em breve novas oportunidades neste local.</p>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {activeTab === 'Avaliações' && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                                    <div className="flex items-center justify-between pb-8 border-b border-gray-100">
                                        <div>
                                            <h3 className="text-5xl font-black font-serif italic text-gray-900">{client.google_rating || '5.0'}</h3>
                                            <div className="flex text-yellow-400 mt-2">
                                                <Star size={20} fill="currentColor" />
                                                <Star size={20} fill="currentColor" />
                                                <Star size={20} fill="currentColor" />
                                                <Star size={20} fill="currentColor" />
                                                <Star size={20} fill="currentColor" />
                                            </div>
                                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mt-2">{client.reviews_count || '0'} avaliações reais</p>
                                        </div>
                                    </div>

                                    {client.reviews?.length > 0 ? client.reviews.map((rev: any, i: number) => (
                                        <div key={i} className="space-y-4">
                                            <div className="flex items-center space-x-3">
                                                <h5 className="font-black text-sm text-gray-900">{rev.author_name}</h5>
                                                <div className="flex text-yellow-400 scale-75 origin-left">
                                                    {[...Array(rev.rating || 5)].map((_, i) => <Star key={i} size={12} fill="currentColor" />)}
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-500 font-medium leading-relaxed italic">"{rev.text}"</p>
                                        </div>
                                    )) : (
                                        <p className="text-center py-10 text-gray-400 font-bold italic">Seja o primeiro a avaliar!</p>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* RIGHT COLUMN: SIDEBAR */}
                    <aside className="w-full lg:w-96 space-y-8">

                        {/* Hours Section (Real Data) */}
                        <div className="bg-white p-10 rounded-[3rem] shadow-xl border-2 border-white gummy-card space-y-6">
                            <h3 className="text-xl font-black font-serif italic text-gray-900">Funcionamento</h3>
                            <div className="space-y-3 font-black text-[10px] uppercase tracking-widest">
                                {schedule.length > 0 ? schedule.map((s: any) => (
                                    <div key={s.day} className={`flex justify-between items-center ${new Date().getDay() === (s.day === 7 ? 0 : s.day) ? 'text-brand-red' : 'text-gray-900'}`}>
                                        <span className="w-24">{daysMap[s.day]}</span>
                                        <div className="flex-1 h-px border-t border-dotted border-gray-100 mx-4"></div>
                                        {s.closed ? (
                                            <span className="text-gray-300">Fechado</span>
                                        ) : (
                                            <span>{s.open} - {s.close}</span>
                                        )}
                                    </div>
                                )) : <p className="text-gray-400 font-bold italic lowercase">Não informado</p>}
                            </div>
                        </div>

                        {/* WhatsApp CTA */}
                        <div className="relative group overflow-hidden bg-brand-red rounded-[3rem] p-10 text-white shadow-2xl shadow-red-200 gummy-card cursor-pointer" onClick={handleWhatsAppClick}>
                            <div className="relative space-y-6">
                                <div className="bg-white/20 w-14 h-14 rounded-2xl flex items-center justify-center">
                                    <MessageCircle size={32} fill="white" className="text-brand-red" />
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-2xl font-black font-serif italic leading-none">Precisa de uma<br />resposta rápida?</h4>
                                    <p className="text-white/70 text-xs font-bold font-sans">Entre em contato diretamente no WhatsApp.</p>
                                </div>
                                <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-widest pt-4">
                                    <span>Enviar Mensagem</span>
                                    <ChevronRight size={16} />
                                </div>
                            </div>
                        </div>

                        {/* Redes Sociais Dinâmicas */}
                        {client.redes_sociais?.length > 0 && (
                            <div className="bg-white p-10 rounded-[3rem] shadow-xl border-2 border-white gummy-card space-y-6">
                                <h3 className="text-xl font-black font-serif italic text-gray-900">Redes Sociais</h3>
                                <div className="flex flex-wrap gap-4">
                                    {client.redes_sociais.map((rede: any) => (
                                        <a
                                            key={rede.id}
                                            href={rede.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 hover:text-brand-red hover:bg-red-50 transition-all border border-gray-100 active:scale-75"
                                        >
                                            {rede.tipo?.toLowerCase().includes('instagram') && <Instagram size={24} />}
                                            {rede.tipo?.toLowerCase().includes('facebook') && <Facebook size={24} />}
                                            {rede.tipo?.toLowerCase().includes('linkedin') && <Linkedin size={24} />}
                                            {rede.tipo?.toLowerCase().includes('youtube') && <Youtube size={24} />}
                                            {(rede.tipo?.toLowerCase().includes('site') || rede.tipo?.toLowerCase().includes('globo') || rede.tipo?.toLowerCase().includes('website')) && <Globe size={24} />}
                                            {!['instagram', 'facebook', 'linkedin', 'youtube', 'site', 'globo', 'website'].some(t => rede.tipo?.toLowerCase().includes(t)) && <ExternalLink size={24} />}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </aside>
                </div>

                {/* 🧩 RECOMMENDATIONS */}
                {recommendations?.length > 0 && (
                    <section className="mt-20 space-y-8">
                        <h2 className="text-3xl font-black text-gray-900 tracking-tighter font-serif">Poderá gostar também</h2>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                            {recommendations.map((rec: any) => (
                                <div
                                    key={rec.id}
                                    onClick={() => {
                                        window.scrollTo(0, 0);
                                        router.push(`/cliente/${rec.slug || rec.id}`);
                                    }}
                                    className="bg-white rounded-[2.5rem] overflow-hidden shadow-xl border-4 border-white gummy-card group cursor-pointer hover:-translate-y-2 transition-all"
                                >
                                    <div className="h-48 overflow-hidden relative bg-gray-100">
                                        <img
                                            src={rec.galeria?.[0]?.url || rec.logotipo_url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500"}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700"
                                            alt={rec.nome_fantasia}
                                        />
                                        <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[8px] font-black text-white uppercase tracking-widest">
                                            {rec.segmentos?.[0]?.nome || 'Negócio Local'}
                                        </div>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        <h4 className="font-black font-serif italic text-lg leading-tight truncate text-gray-900">{rec.nome_fantasia}</h4>
                                        <button className="w-full bg-gray-50 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:bg-brand-red group-hover:text-white transition-all">Ver Perfil</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>

            {/* 🖥️ DESKTOP FOOTER */}
            <footer className="hidden md:block mt-32 bg-white border-t border-gray-100 py-16 px-12">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10 text-gray-400 text-[10px] font-black uppercase tracking-[0.3em]">
                    <div className="flex items-center space-x-2">
                        <div className="bg-brand-red w-6 h-6 rounded-lg flex items-center justify-center">
                            <span className="text-white text-[10px] italic">V</span>
                        </div>
                        <span className="text-gray-900">O Vermelhinho</span>
                    </div>
                    <div className="flex space-x-12">
                        <a href="#" className="hover:text-brand-red transition-all">Privacidade</a>
                        <a href="#" className="hover:text-brand-red transition-all">Termos</a>
                        <a href="#" className="hover:text-brand-red transition-all">Suporte</a>
                    </div>
                    <span>© 2026 O Vermelhinho Directory. Todos os direitos reservados.</span>
                </div>
            </footer>

            {/* 📱 MOBILE STICKY CONVERSION BAR */}
            <footer className="md:hidden fixed bottom-0 left-0 right-0 p-6 z-[100] bg-gradient-to-t from-gray-50 via-gray-50/90 to-transparent">
                <div className="flex space-x-3">
                    <button
                        onClick={handleCallClick}
                        className="flex-[0.4] bg-white text-gray-900 py-6 rounded-[2.5rem] shadow-2xl border-2 border-white font-black text-xs uppercase tracking-widest flex items-center justify-center space-x-2 active:scale-90 transition-all font-sans"
                    >
                        <Phone size={20} />
                        <span>Ligar</span>
                    </button>
                    <button
                        onClick={handleWhatsAppClick}
                        className="flex-1 bg-brand-red text-white py-6 rounded-[2.5rem] shadow-[0_25px_50px_-10px_rgba(239,68,68,0.4)] font-black text-lg flex items-center justify-center space-x-3 active:scale-95 transition-all overflow-hidden relative font-sans"
                    >
                        <div className="absolute inset-0 bg-white/20 translate-x-[-100%] active:translate-x-[100%] transition-transform duration-500"></div>
                        <MessageCircle size={24} fill="white" />
                        <span>WhatsApp</span>
                    </button>
                </div>
            </footer>

            {/* 🖼️ IMAGE LIGHTBOX MODAL */}
            <AnimatePresence>
                {selectedImageIndex !== null && client.galeria && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 md:p-10"
                        onClick={() => setSelectedImageIndex(null)}
                    >
                        <button
                            className="absolute top-10 right-10 text-white/50 hover:text-white transition-all z-[210] p-4 bg-white/10 rounded-full backdrop-blur-md"
                            onClick={() => setSelectedImageIndex(null)}
                        >
                            <X size={32} />
                        </button>

                        {client.galeria.length > 1 && (
                            <>
                                <button
                                    className="absolute left-4 md:left-10 top-1/2 -translate-y-1/2 w-16 h-16 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-all backdrop-blur-md z-[210]"
                                    onClick={handlePrevImage}
                                >
                                    <ChevronLeft size={32} />
                                </button>
                                <button
                                    className="absolute right-4 md:right-10 top-1/2 -translate-y-1/2 w-16 h-16 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-all backdrop-blur-md z-[210]"
                                    onClick={handleNextImage}
                                >
                                    <ChevronRight size={32} />
                                </button>
                            </>
                        )}

                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative max-w-5xl w-full h-[70vh] md:h-[85vh] flex items-center justify-center"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img
                                src={client.galeria[selectedImageIndex].url}
                                className="max-w-full max-h-full object-contain rounded-3xl shadow-2xl"
                                alt="Imagem ampliada"
                            />

                            {/* Counter */}
                            <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 px-6 py-2 bg-white/10 rounded-full backdrop-blur-md text-white/80 font-black text-xs uppercase tracking-[0.3em]">
                                {selectedImageIndex + 1} / {client.galeria.length}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 📋 COPY FEEDBACK TOAST */}
            <AnimatePresence>
                {showShareToast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-24 md:bottom-10 left-1/2 -translate-x-1/2 z-[300] bg-gray-900/90 backdrop-blur-md text-white px-6 py-4 rounded-2xl flex items-center space-x-3 shadow-2xl border border-white/10"
                    >
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                            <Check size={16} />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest">Link copiado com sucesso!</span>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}
