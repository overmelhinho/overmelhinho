'use client';


import { useState, useEffect } from 'react';
import {
    MessageCircle, Phone, MapPin, Share2, Heart, Star, Clock,
    Briefcase, ChevronRight, CheckCircle2, ArrowLeft, Search,
    User, Menu, Info, ImageIcon, MessageSquare, Instagram,
    Facebook, Globe, ExternalLink, ChevronLeft, Linkedin, Youtube,
    X, Maximize2, Copy, Check, Bike, Utensils, CreditCard, DollarSign,
    Smartphone, Banknote, Coins, FileText, BookOpen, Mail
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useInterests } from '@/hooks/useInterests';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import api from '@/services/api';

// Helper para normalizar strings para slugs (URL friendly)
const slugify = (text: string) => {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-')
        .trim();
};

function WhatsAppIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

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
                className="w-full h-full object-contain p-2"
                onError={() => setError(true)}
            />
        </div>
    );
};

export default function ClientProfileClient() {
    const params = useParams();
    const id = (params.id || params.clientSlug) as string;
    const router = useRouter();
    const { trackInteraction } = useAnalytics();
    const { trackSegment } = useInterests();
    const [isFavorite, setIsFavorite] = useState(false);
    const [activeTab, setActiveTab] = useState('Sobre');
    const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
    const [showShareToast, setShowShareToast] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [isTagsExpanded, setIsTagsExpanded] = useState(false);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const [isCitiesExpanded, setIsCitiesExpanded] = useState(false);
    const [copiedEmail, setCopiedEmail] = useState(false);

    const citySlug = params.citySlug as string;

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

    const cityNameContext = citySlug ? (client?.cidades_atendidas?.find((c: any) => {
        const s = c.nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-');
        return s === citySlug;
    })?.nome || citySlug.replace(/-/g, ' ')) : null;

    useEffect(() => {
        if (client) {
            trackInteraction(client.id, 'page_view', cityNameContext || undefined);
            if (client.segmentos && client.segmentos.length > 0) {
                trackSegment(client.segmentos[0].id);
            }
        }
    }, [client, trackInteraction, trackSegment, cityNameContext]);

    const isPagante = client?.tipo_cliente === 'pagante';

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
        trackInteraction(client.id, 'whatsapp_click', cityNameContext || undefined);
        const contact = client.contatos?.[0];
        if (!contact) return;

        // Verifica se o telefone principal está temporariamente oculto
        const isPrincipalHidden = contact.telefone_principal_hidden_until
            && new Date(contact.telefone_principal_hidden_until) > new Date();

        let whatsapp = null;

        // Usa o selecionado, mas ignora se for o principal oculto
        if (contact.whatsapp_selected && contact[contact.whatsapp_selected]) {
            const isSelectedHidden = contact.whatsapp_selected === 'telefone_principal' && isPrincipalHidden;
            if (!isSelectedHidden) {
                whatsapp = contact[contact.whatsapp_selected];
            }
        }

        if (!whatsapp) {
            const priority = [
                { key: 'telefone_principal', flag: 'exibir_tel_principal', hidden: isPrincipalHidden },
                { key: 'telefone_secundario', flag: 'exibir_tel_secundario', hidden: false },
                { key: 'celular', flag: 'exibir_celular', hidden: false },
                { key: 'telefone_outro', flag: 'exibir_tel_outro', hidden: false }
            ];

            const found = priority.find(p => contact[p.key] && !p.hidden);
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

        // Verifica se o telefone principal está temporariamente oculto
        const isPrincipalHidden = contact.telefone_principal_hidden_until
            && new Date(contact.telefone_principal_hidden_until) > new Date();

        const priority = [
            { key: 'telefone_principal', flag: 'exibir_tel_principal', hidden: isPrincipalHidden },
            { key: 'telefone_secundario', flag: 'exibir_tel_secundario', hidden: false },
            { key: 'celular', flag: 'exibir_celular', hidden: false },
            { key: 'telefone_outro', flag: 'exibir_tel_outro', hidden: false }
        ];

        const found = priority.find(p => contact[p.key] && contact[p.flag] && !p.hidden);
        const phone = found ? contact[found.key] : (!isPrincipalHidden ? contact.telefone_principal : contact.celular);

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

    const BENEFICIOS_MAP: Record<string, { label: string, icon: any }> = {
        "24h": { label: "24 horas", icon: Clock },
        "tele_entrega": { label: "Tele-entrega", icon: Bike },
        "meio_dia": { label: "Aberto ao meio-dia", icon: Utensils },
        "credito": { label: "Crédito", icon: CreditCard },
        "debito": { label: "Débito", icon: DollarSign },
        "pix": { label: "Pix", icon: Smartphone },
        "boleto": { label: "Boleto Bancário", icon: Banknote },
        "dinheiro": { label: "Dinheiro", icon: Coins },
    };

    const contactInfo = client?.contatos?.[0];
    const isPrincipalHidden = contactInfo?.telefone_principal_hidden_until
        && new Date(contactInfo.telefone_principal_hidden_until) > new Date();

    const formatPhone = (phone: string | null | undefined) => {
        if (!phone) return '';
        const clean = phone.replace(/\D/g, '');
        if (clean.startsWith('0800')) {
            return clean.replace(/^(\d{4})(\d{3})(\d{4})$/, '$1 $2 $3');
        }
        if (clean.length === 11) {
            return clean.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
        }
        if (clean.length === 10) {
            return clean.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
        }
        return phone;
    };

    const rawPhones = contactInfo ? [
        { label: 'Tel. Principal', number: formatPhone(contactInfo.telefone_principal), flag: contactInfo.exibir_tel_principal, hidden: isPrincipalHidden, isWhatsApp: contactInfo.has_whatsapp_principal && isPagante, obs: contactInfo.obs_telefone_principal },
        { label: 'Tel. Secundário', number: formatPhone(contactInfo.telefone_secundario), flag: contactInfo.exibir_tel_secundario, hidden: false, isWhatsApp: contactInfo.has_whatsapp_secundario && isPagante, obs: contactInfo.obs_telefone_secundario },
        { label: 'Celular', number: formatPhone(contactInfo.celular), flag: contactInfo.exibir_celular, hidden: false, isWhatsApp: contactInfo.has_whatsapp_celular && isPagante, obs: contactInfo.obs_celular },
        { label: 'Outro Telefone', number: formatPhone(contactInfo.telefone_outro), flag: contactInfo.exibir_tel_outro, hidden: false, isWhatsApp: contactInfo.has_whatsapp_outro && isPagante, obs: contactInfo.obs_telefone_outro },
    ].filter(p => p.number && p.flag && !p.hidden) : [];

    const allPhones = (rawPhones.length === 0 && !isPagante)
        ? [{ label: 'Telefone', number: 'Informação não disponível', flag: true, hidden: false, isWhatsApp: false, obs: '' }]
        : rawPhones;

    const primaryPhone = allPhones[0]?.number;
    const hasPhone = allPhones.length > 0 && allPhones[0].number !== 'Informação não disponível';

    let primaryWhatsApp = null;
    if (contactInfo?.whatsapp_selected && contactInfo[contactInfo.whatsapp_selected]) {
        const isSelectedHidden = contactInfo.whatsapp_selected === 'telefone_principal' && isPrincipalHidden;
        if (!isSelectedHidden) primaryWhatsApp = contactInfo[contactInfo.whatsapp_selected];
    }
    if (!primaryWhatsApp) {
        primaryWhatsApp = allPhones.find(p => p.isWhatsApp)?.number || allPhones[0]?.number;
    }
    const hasWhatsApp = !!primaryWhatsApp && isPagante;

    const tabs = isPagante ? ['Sobre', 'Fotos'] : ['Sobre'];
    if (client.reviews?.length > 0 && isPagante) tabs.push('Avaliações');
    if (client.job_opportunities?.length > 0 && isPagante) tabs.push('Vagas');
    const daysMap: Record<number, string> = {
        1: 'Segunda', 2: 'Terça', 3: 'Quarta', 4: 'Quinta', 5: 'Sexta', 6: 'Sábado', 7: 'Domingo'
    };

    const schedule = Array.isArray(client.horario_atendimento)
        ? client.horario_atendimento
        : [];

    const getTodayStatus = () => {
        if (!schedule || schedule.length === 0) return null;

        const today = new Date().getDay();
        const systemDay = today === 0 ? 7 : today;
        const todaySchedule = schedule.find((s: any) => s.day === systemDay);

        if (!todaySchedule || todaySchedule.closed) return { open: false, label: 'Fechado' };

        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        // Primeiro turno
        if (currentTime >= todaySchedule.open && currentTime <= todaySchedule.close) {
            return { open: true, label: `Aberto até ${todaySchedule.close}` };
        }

        // Segundo turno
        if (todaySchedule.open2 && todaySchedule.close2 && currentTime >= todaySchedule.open2 && currentTime <= todaySchedule.close2) {
            return { open: true, label: `Aberto até ${todaySchedule.close2}` };
        }

        // Se estiver entre os turnos (meio-dia)
        if (todaySchedule.open2 && currentTime < todaySchedule.open2 && currentTime > todaySchedule.close) {
            return { open: false, label: `Fechado (Abre às ${todaySchedule.open2})` };
        }

        return { open: false, label: `Fechado (Abre às ${todaySchedule.open})` };
    };

    const status = getTodayStatus();

    // 🧠 JSON-LD Structured Data for SEO
    const schemaData = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": client.nome_fantasia,
        "image": client.logotipo_url || client.banner_url,
        "@id": typeof window !== 'undefined' ? window.location.href : '',
        "url": typeof window !== 'undefined' ? window.location.href : '',
        "telephone": contactInfo?.telefone_principal || contactInfo?.celular,
        "address": client.enderecos?.[0] ? {
            "@type": "PostalAddress",
            "streetAddress": client.enderecos[0].exibir_apenas_cidade ? undefined : `${client.enderecos[0].rua}, ${client.enderecos[0].numero}${client.enderecos[0].complemento ? `, ${client.enderecos[0].complemento}` : ''}`,
            "addressLocality": client.enderecos[0].cidade,
            "addressRegion": client.enderecos[0].estado,
            "postalCode": client.enderecos[0].exibir_apenas_cidade ? undefined : client.enderecos[0].cep,
            "addressCountry": "BR"
        } : undefined,
        "geo": (client.enderecos?.[0]?.latitude && !client.enderecos[0].exibir_apenas_cidade) ? {
            "@type": "GeoCoordinates",
            "latitude": client.enderecos[0].latitude,
            "longitude": client.enderecos[0].longitude
        } : undefined,
        "openingHoursSpecification": schedule.map((s: any) => ({
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": [
                "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
            ][s.day - 1],
            "opens": s.open,
            "closes": s.close
        })),
        "aggregateRating": client.google_rating ? {
            "@type": "AggregateRating",
            "ratingValue": client.google_rating,
            "reviewCount": client.reviews_count || 1
        } : undefined,
        "keywords": client.seo_keywords?.join(", "),
        "sameAs": client.redes_sociais?.map((r: any) => r.url) || [],
        "areaServed": client.cidades_atendidas?.length > 0 ? client.cidades_atendidas.map((c: any) => ({
            "@type": "City",
            "name": c.nome,
            "addressRegion": c.uf || "RS",
            "addressCountry": "BR"
        })) : undefined
    };

    const breadcrumbData = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Início",
                "item": "https://novo.overmelhinho.com.br"
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": client.segmentos?.[0]?.nome || "Clientes",
                "item": `https://novo.overmelhinho.com.br/busca?segmento=${client.segmentos?.[0]?.id || ''}`
            },
            {
                "@type": "ListItem",
                "position": 3,
                "name": client.nome_fantasia,
                "item": typeof window !== 'undefined' ? window.location.href : ''
            }
        ]
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-24 md:pb-0 overflow-x-hidden w-full max-w-[100vw]">
            {/* 🤖 SEO Structured Data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
            />

            {/* 📍 Banner de Atendimento Local (SEO Context) */}
            {cityNameContext && (
                <div className="bg-brand-red/5 border-b border-brand-red/10 py-2 px-4 text-center">
                    <p className="text-[10px] md:text-xs font-black text-brand-red uppercase tracking-[0.2em] flex items-center justify-center">
                        <MapPin size={12} className="mr-2" />
                        Atendimento em destaque: {cityNameContext}
                    </p>
                </div>
            )}





            {/* 📸 HERO / COVER */}
            <section className={`relative overflow-hidden ${client.banner_url && isPagante ? 'h-[32vh] md:h-[46vh]' : 'h-[20vh] md:h-[30vh]'}`}>
                {/* 📱 MOBILE ACTIONS (Absolute instead of Fixed to avoid logo overlap) */}
                <div className="md:hidden absolute top-4 left-0 right-0 z-[100] px-6 flex justify-between pointer-events-none">
                    <button onClick={() => router.back()} className="w-10 h-10 bg-black/20 backdrop-blur-xl rounded-2xl border border-white/30 text-white flex items-center justify-center shadow-2xl active:scale-75 transition-all pointer-events-auto cursor-pointer">
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex space-x-3 pointer-events-auto">
                        <button
                            onClick={handleShareClick}
                            className="w-10 h-10 bg-black/20 backdrop-blur-xl rounded-2xl border border-white/30 text-white flex items-center justify-center shadow-2xl active:scale-75 transition-all cursor-pointer"
                        >
                            <Share2 size={20} />
                        </button>
                        <button
                            onClick={() => setIsFavorite(!isFavorite)}
                            className={`w-10 h-10 backdrop-blur-xl rounded-2xl border border-white/30 flex items-center justify-center shadow-2xl active:scale-75 transition-all cursor-pointer ${isFavorite ? 'bg-brand-red text-white' : 'bg-black/20 text-white'}`}
                        >
                            <Heart size={20} fill={isFavorite ? "white" : "none"} />
                        </button>
                    </div>
                </div>

                {client.banner_url && isPagante ? (
                    <img
                        src={client.banner_url}
                        className="w-full h-full object-cover escala-focus-top"
                        alt={client.nome_fantasia}
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200"></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 md:to-transparent"></div>
            </section>

            {/* 🏢 PROFILE AREA */}
            <div className="max-w-7xl mx-auto px-6 lg:px-12 relative -mt-16 md:-mt-24 z-10">

                <div className="bg-white rounded-[2.5rem] md:rounded-[4rem] p-7 md:p-12 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.12)] border-2 border-white gummy-card relative">

                    {/* Floating Profile Image */}
                    {isPagante && client.logotipo_url && (
                        <div className="absolute -top-16 md:-top-24 left-6 md:left-10 w-32 h-32 md:w-48 md:h-48 rounded-[2rem] bg-white p-1.5 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] border-[4px] md:border-[6px] border-white overflow-hidden group flex items-center justify-center">
                            <img
                                src={client.logotipo_url}
                                className="w-full h-full object-contain rounded-[1.6rem] group-hover:scale-110 transition-transform duration-700"
                                alt={`Logotipo de ${client.nome_fantasia}`}
                                onError={(e) => {
                                    e.currentTarget.src = '/logo-overmelhinho.png';
                                    e.currentTarget.onerror = null;
                                }}
                            />
                        </div>
                    )}

                    <div className={`mt-16 md:mt-0 ${isPagante ? 'md:ml-56' : ''} space-y-4`}>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="space-y-2">
                                <div className="flex items-center space-x-3">
                                    <h1 className="text-lg md:text-2xl font-black text-gray-900 tracking-tighter font-serif italic uppercase leading-tight">{client.nome_fantasia}</h1>
                                </div>

                                <div className="flex flex-wrap items-center gap-4 text-[11px] md:text-xs font-black uppercase tracking-widest font-sans">
                                    {status && isPagante && (
                                        <>
                                            <div className={`flex items-center py-1 px-3 rounded-full ${status.open ? 'bg-green-50 text-green-500 border border-green-100' : 'bg-red-50 text-brand-red border border-red-100'}`}>
                                                <div className={`w-2 h-2 rounded-full mr-2 ${status.open ? 'bg-green-500' : 'bg-brand-red'} animate-pulse`}></div>
                                                {status.label}
                                            </div>
                                            <span className="text-gray-300 md:block hidden">•</span>
                                        </>
                                    )}
                                    {client.registro_profissional && (
                                        <>
                                            <div className="flex items-center py-1 px-3 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                                                <FileText size={12} className="mr-1.5" />
                                                {client.registro_profissional}
                                            </div>
                                            <span className="text-gray-300 md:block hidden">•</span>
                                        </>
                                    )}
                                    <p className="text-gray-400 flex items-center">
                                        <MapPin size={14} className="mr-1.5 text-brand-red" />
                                        {client.enderecos?.[0]
                                            ? (client.enderecos[0].exibir_apenas_cidade
                                                ? `Atendimento em ${client.enderecos[0].cidade} - ${client.enderecos[0].estado}${client.enderecos.length > 1 ? ` (+${client.enderecos.length - 1} filiais)` : ''}`
                                                : `${client.enderecos[0].rua}, ${client.enderecos[0].numero}${client.enderecos[0].complemento ? `, ${client.enderecos[0].complemento}` : ''} - ${client.enderecos[0].cidade}${client.enderecos.length > 1 ? ` (+${client.enderecos.length - 1} filiais)` : ''}`)
                                            : 'Endereço não informado'}
                                    </p>
                                </div>
                            </div>

                            {/* CTAs DESKTOP */}
                            <div className="hidden md:flex mt-4 md:mt-0 flex-wrap items-center gap-3">
                                {hasWhatsApp && (
                                    <button
                                        onClick={handleWhatsAppClick}
                                        className="bg-[#25D366] text-white px-8 py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl shadow-green-100 flex items-center active:scale-95 transition-all hover:brightness-110 border-b-4 border-green-700"
                                    >
                                        <MessageCircle size={20} className="mr-2" fill="currentColor" /> WhatsApp
                                    </button>
                                )}
                                {hasPhone && (
                                    <button
                                        onClick={handleCallClick}
                                        className="bg-gray-100 text-gray-900 px-8 py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest flex items-center active:scale-95 transition-all hover:bg-gray-200"
                                    >
                                        <Phone size={20} className="mr-2" /> Ligar Agora
                                    </button>
                                )}
                                {client.enderecos?.[0] && !client.enderecos[0].exibir_apenas_cidade && isPagante && (
                                    <>
                                        {/* Waze: Apenas Mobile */}
                                        <a
                                            href={`https://waze.com/ul?q=${encodeURIComponent(`${client.enderecos[0].rua}, ${client.enderecos[0].numero}, ${client.enderecos[0].bairro}, ${client.enderecos[0].cidade} - ${client.enderecos[0].estado}`)}&navigate=yes`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="md:hidden bg-blue-50 text-blue-600 border border-blue-100 px-8 py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest flex items-center active:scale-95 transition-all hover:bg-blue-100"
                                        >
                                            <MapPin size={20} className="mr-2" fill="currentColor" /> Waze
                                        </a>

                                        {/* Google Maps: Apenas Desktop */}
                                        <a
                                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${client.enderecos[0].rua}, ${client.enderecos[0].numero}, ${client.enderecos[0].bairro}, ${client.enderecos[0].cidade} - ${client.enderecos[0].estado}`)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="hidden md:flex bg-gray-50 text-gray-600 border border-gray-100 px-8 py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest items-center active:scale-95 transition-all hover:bg-gray-100"
                                        >
                                            <MapPin size={20} className="mr-2" fill="currentColor" /> Google Maps
                                        </a>
                                    </>
                                )}
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
                <div className="mt-10 border-b border-gray-100 flex items-center space-x-10 md:space-x-16 overflow-x-auto no-scrollbar scroll-smooth max-w-full">
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
                                        <h2 className="text-lg md:text-2xl font-black text-gray-900 tracking-tighter font-serif">Sobre a {client.nome_fantasia}</h2>
                                        <div>
                                            <p className={`text-gray-500 leading-relaxed text-sm md:text-lg font-medium whitespace-pre-line break-words ${!isDescriptionExpanded ? 'line-clamp-4 md:line-clamp-none' : ''}`}>
                                                {client.descricao || `O ${client.nome_fantasia} oferecendo soluções na sua área de atuação. Atendimento, Serviços na área, Suporte e orientação Entre em contato para mais informações.`}
                                            </p>
                                            <button 
                                                onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                                                className="md:hidden mt-3 text-[10px] font-black uppercase tracking-widest text-brand-red hover:underline flex items-center"
                                            >
                                                {isDescriptionExpanded ? 'Ler menos' : 'Ler mais'}
                                                <ChevronRight size={12} className={`ml-1 transition-transform ${isDescriptionExpanded ? '-rotate-90' : 'rotate-90'}`} />
                                            </button>
                                        </div>

                                        {/* Info Boxes */}
                                        <div className="grid grid-cols-2 gap-3">
                                            {client.data_fundacao && client.exibir_data_fundacao !== false && (
                                                <div className={`bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col justify-center ${!client.registro_profissional ? 'col-span-2' : 'col-span-1'}`}>
                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Fundada em</p>
                                                    <p className="text-xs font-bold text-gray-800">{new Date(client.data_fundacao).getFullYear()}</p>
                                                </div>
                                            )}
                                            {client.registro_profissional && (
                                                <div className={`bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col justify-center ${(!client.data_fundacao || client.exibir_data_fundacao === false) ? 'col-span-2' : 'col-span-1'}`}>
                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Registro Profissional</p>
                                                    <p className="text-xs font-bold text-gray-800">{client.registro_profissional}</p>
                                                </div>
                                            )}
                                            {client.segmentos?.length > 0 && isPagante && (
                                                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 col-span-2">
                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Segmentos de Atuação</p>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {client.segmentos.map((seg: any) => (
                                                            <span key={seg.id} className="text-xs text-gray-800 bg-white px-2.5 py-1 rounded-xl border border-gray-100 shadow-sm font-medium">
                                                                {seg.nome}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </section>

                                    {client.beneficios?.length > 0 && isPagante && (
                                        <section className="space-y-6">
                                            <h2 className="text-lg md:text-2xl font-black text-gray-900 tracking-tighter font-serif">Benefícios e Pagamentos</h2>
                                            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                                                {client.beneficios.map((benId: string) => {
                                                    const ben = BENEFICIOS_MAP[benId];
                                                    if (!ben) return null;
                                                    const Icon = ben.icon;
                                                    return (
                                                        <div key={benId} className="relative flex flex-col items-center justify-center border-2 border-red-50 bg-red-50/50 rounded-2xl p-4 shadow-sm">
                                                            <div className="absolute top-2.5 right-2.5 text-brand-red">
                                                                <CheckCircle2 size={14} />
                                                            </div>
                                                            <Icon className="w-6 h-6 mb-2 text-brand-red" />
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-brand-red text-center leading-tight">
                                                                {ben.label}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </section>
                                    )}

                                    {client.cidades_atendidas?.length > 0 && (
                                        <section className="space-y-6">
                                            <h2 className="text-lg md:text-2xl font-black text-gray-900 tracking-tighter font-serif">Cidades Atendidas</h2>
                                            <div>
                                                <div className="flex flex-wrap gap-3">
                                                    {client.cidades_atendidas.map((city: any, i: number) => {
                                                        const cityUrlSlug = slugify(city.nome);
                                                        const segmentUrlSlug = client.segmentos?.[0] ? slugify(client.segmentos[0].nome) : 'servicos';
                                                        const clientUrlSlug = client.slug || client.id;
                                                        
                                                        return (
                                                            <Link 
                                                                key={i} 
                                                                href={`/${cityUrlSlug}/${segmentUrlSlug}/${clientUrlSlug}`}
                                                                className={`bg-white hover:bg-brand-red/5 hover:border-brand-red/30 border border-gray-100 shadow-sm text-gray-500 hover:text-brand-red px-5 py-3 rounded-2xl text-[10px] md:text-xs font-bold flex items-center transition-all group ${!isCitiesExpanded && i >= 6 ? 'hidden md:flex' : ''}`}
                                                            >
                                                                <MapPin size={14} className="mr-2 text-brand-red group-hover:scale-110 transition-transform" />
                                                                {city.nome} - {city.uf}
                                                            </Link>
                                                        );
                                                    })}
                                                </div>
                                                {client.cidades_atendidas.length > 6 && (
                                                    <button 
                                                        onClick={() => setIsCitiesExpanded(!isCitiesExpanded)}
                                                        className="md:hidden mt-4 text-[10px] font-black uppercase tracking-widest text-brand-red hover:underline flex items-center"
                                                    >
                                                        {isCitiesExpanded ? 'Ver menos' : `Ver mais ${client.cidades_atendidas.length - 6} cidades`}
                                                        <ChevronRight size={12} className={`ml-1 transition-transform ${isCitiesExpanded ? '-rotate-90' : 'rotate-90'}`} />
                                                    </button>
                                                )}
                                            </div>
                                        </section>
                                    )}

                                    {client.redes_sociais?.length > 0 && isPagante && (
                                        <section className="lg:hidden space-y-6">
                                            <h2 className="text-lg md:text-2xl font-black text-gray-900 tracking-tighter font-serif">Redes Sociais</h2>
                                            <div className="flex flex-wrap gap-4">
                                                {client.redes_sociais.map((rede: any) => {
                                                    const t = rede.tipo?.toLowerCase() || '';
                                                    const formattedUrl = rede.url?.startsWith('http') ? rede.url : `https://${rede.url}`;
                                                    const colorClass = t.includes('instagram') ? 'text-[#E1306C] hover:bg-pink-50' :
                                                                       t.includes('facebook') ? 'text-[#1877F2] hover:bg-blue-50' :
                                                                       t.includes('linkedin') ? 'text-[#0A66C2] hover:bg-blue-50' :
                                                                       t.includes('youtube') ? 'text-[#FF0000] hover:bg-red-50' :
                                                                       'text-gray-500 hover:text-brand-red hover:bg-gray-100';
                                                    return (
                                                        <a
                                                            key={rede.id}
                                                            href={formattedUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className={`w-14 h-14 bg-white shadow-xl rounded-2xl flex items-center justify-center border border-gray-50 active:scale-75 transition-all ${colorClass}`}
                                                        >
                                                            {t.includes('instagram') && <Instagram size={24} />}
                                                            {t.includes('facebook') && <Facebook size={24} />}
                                                            {t.includes('linkedin') && <Linkedin size={24} />}
                                                            {t.includes('youtube') && <Youtube size={24} />}
                                                            {(t.includes('site') || t.includes('globo') || t.includes('website')) && <Globe size={24} />}
                                                            {!['instagram', 'facebook', 'linkedin', 'youtube', 'site', 'globo', 'website'].some(k => t.includes(k)) && <ExternalLink size={24} />}
                                                        </a>
                                                    );
                                                })}
                                            </div>
                                        </section>
                                    )}

                                    {client.video && (
                                        <section className="space-y-6">
                                            <h2 className="text-lg md:text-2xl font-black text-gray-900 tracking-tighter font-serif">Apresentação</h2>
                                            <div className="w-full aspect-video rounded-[3rem] overflow-hidden bg-gray-100 relative shadow-inner border-4 border-white gummy-card">
                                                <iframe
                                                    width="100%"
                                                    height="100%"
                                                    src={client.video.replace('watch?v=', 'embed/').split('&')[0]}
                                                    title="Vídeo"
                                                    frameBorder="0"
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                    allowFullScreen
                                                ></iframe>
                                            </div>
                                        </section>
                                    )}

                                    {client.portfolio_url && (
                                        <section className="space-y-6">
                                            <h2 className="text-lg md:text-2xl font-black text-gray-900 tracking-tighter font-serif">Materiais</h2>
                                            <div className="bg-white p-8 rounded-[3rem] border-2 border-gray-50 shadow-xl gummy-card flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                                <div className="flex items-center space-x-4">
                                                    <div className="w-16 h-16 bg-red-50 text-brand-red rounded-2xl flex items-center justify-center">
                                                        {client.tipo_arquivo_midia === 'cardapio' ? <Utensils size={28} /> :
                                                            client.tipo_arquivo_midia === 'portfolio' ? <Briefcase size={28} /> :
                                                                <BookOpen size={28} />}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xl font-black font-serif italic text-gray-900">
                                                            {client.tipo_arquivo_midia === 'cardapio' ? 'Cardápio Digital' :
                                                                client.tipo_arquivo_midia === 'portfolio' ? 'Portfólio / Apresentação' :
                                                                    'Catálogo & Preços'}
                                                        </h4>
                                                        <p className="text-xs font-bold text-gray-400 mt-1">Conheça mais sobre as ofertas</p>
                                                    </div>
                                                </div>
                                                <a href={client.portfolio_url} target="_blank" rel="noopener noreferrer" className="bg-gray-900 text-white w-full md:w-auto px-8 py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all hover:bg-brand-red focus:outline-none flex whitespace-nowrap justify-center">
                                                    <ExternalLink size={16} className="mr-2" /> Acessar Material
                                                </a>
                                            </div>
                                        </section>
                                    )}

                                    {isPagante && client.enderecos?.length > 1 && (<section className="space-y-8 hidden lg:block">
                                        <h2 className="text-lg md:text-2xl font-black text-gray-900 tracking-tighter font-serif">Onde nos Encontrar</h2>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {client.enderecos?.length > 0 ? client.enderecos.map((end: any, i: number) => (
                                                <div key={i} className="bg-white p-6 rounded-[2.5rem] border-2 border-gray-50 shadow-xl gummy-card group hover:border-brand-red/30 transition-all flex flex-col justify-between">
                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 bg-red-50 text-brand-red rounded-2xl flex items-center justify-center font-black">
                                                                    {i + 1}
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-black text-gray-900 uppercase tracking-widest text-xs leading-tight">
                                                                        {end.nome_unidade || (i === 0 ? 'Matriz' : `Unidade ${i + 1}`)}
                                                                    </h4>
                                                                    <p className="text-[11px] text-gray-400 font-black uppercase tracking-widest">{end.cidade} - {end.estado}</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {!end.exibir_apenas_cidade ? (
                                                            <p className="text-base text-gray-500 font-medium leading-relaxed">
                                                                {end.rua}, {end.numero} {end.complemento ? `- ${end.complemento}` : ''}<br/>
                                                                {end.bairro} • {end.cep}
                                                            </p>
                                                        ) : (
                                                            <p className="text-base text-gray-400 font-medium italic mt-2">
                                                                Endereço completo não exibido. Atendimento em {end.cidade} - {end.estado}.
                                                            </p>
                                                        )}
                                                    </div>

                                                    {isPagante && (
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
                                                            {(i === 0 ? allPhones : [{ label: 'Telefone', number: end.telefone, isWhatsApp: false }]).map((p: any, idx: number) => (
                                                                p.number && (
                                                                    <a 
                                                                        key={idx}
                                                                        href={`tel:${p.number.replace(/\D/g, '')}`}
                                                                        className={`col-span-full bg-green-50 hover:bg-green-100 py-2.5 rounded-[1.2rem] text-[11px] font-black uppercase tracking-[0.15em] text-green-600 text-center transition-all border border-green-100 flex flex-col items-center justify-center`}
                                                                    >
                                                                        <div className="flex items-center justify-center gap-2">
                                                                            <Phone size={14} className="flex-shrink-0" /> 
                                                                            <span className="text-center whitespace-nowrap">
                                                                                {p.label}: <span>{p.number}</span>
                                                                            </span>
                                                                        </div>
                                                                        {p.obs && (
                                                                            <span className="text-[9px] text-green-600/70 font-semibold normal-case tracking-normal italic mt-0.5 leading-none">
                                                                                ({p.obs})
                                                                            </span>
                                                                        )}
                                                                    </a>
                                                                )
                                                            ))}
                                                        </div>
                                                    )}

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                                                        {!end.exibir_apenas_cidade && (
                                                            <a 
                                                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${end.rua}, ${end.numero} - ${end.bairro}, ${end.cidade}`)}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="bg-gray-50 hover:bg-gray-100 py-3 rounded-[1.2rem] text-[11px] font-black uppercase tracking-[0.15em] text-gray-600 text-center transition-all border border-gray-100"
                                                            >
                                                                Google Maps
                                                            </a>
                                                        )}
                                                        {(!end.exibir_apenas_cidade && isPagante) && (
                                                            <a 
                                                                href={`https://waze.com/ul?q=${encodeURIComponent(`${end.rua}, ${end.numero}, ${end.bairro}, ${end.cidade} - ${end.estado}`)}&navigate=yes`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="md:hidden bg-blue-50 hover:bg-blue-100 py-3 rounded-[1.2rem] text-[11px] font-black uppercase tracking-[0.15em] text-blue-600 text-center transition-all border border-blue-100"
                                                            >
                                                                Waze
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            )) : (
                                                <div className="col-span-full py-12 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-[3rem]">
                                                    <MapPin size={32} className="mb-3 opacity-20" />
                                                    <p className="font-bold italic">Nenhum endereço cadastrado</p>
                                                </div>
                                            )}
                                        </div>
                                    </section>)}
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
                                                className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110"
                                                alt={`Foto de ${client.nome_fantasia} - ${i + 1}`}
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
                                                <CompanyLogo 
                                                    company={client.nome_fantasia} 
                                                    logo={client.logotipo_url} 
                                                    className="w-16 h-16 bg-red-50 text-brand-red text-3xl rounded-2xl" 
                                                />
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

                        {/* Telefones Section */}
                        {(allPhones.length > 0 || (client.contatos?.[0]?.email_principal && client.contatos?.[0]?.exibir_email !== false)) && (
                            <div className="bg-white p-10 rounded-[3rem] shadow-xl border-2 border-white gummy-card space-y-6">
                                <h3 className="text-xl font-black font-serif italic text-gray-900">Contatos</h3>
                                <div className="space-y-4">
                                    {allPhones.map((p, idx) => (
                                        <div key={idx} className="group relative">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{p.label}</span>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex flex-col">
                                                        {p.number === 'Informação não disponível' ? (
                                                            <span className="text-base font-black text-gray-400 font-serif italic leading-none">
                                                                {p.number}
                                                            </span>
                                                        ) : (
                                                            <a 
                                                                href={`tel:${p.number.replace(/\D/g, '')}`} 
                                                                className="text-lg font-black text-gray-900 hover:text-brand-red transition-colors font-serif italic leading-none"
                                                            >
                                                                {p.number}
                                                            </a>
                                                        )}
                                                        {p.obs && (
                                                            <span className="text-[11px] text-gray-400 font-medium italic mt-1.5 leading-tight">{p.obs}</span>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-2">
                                                        {p.number !== 'Informação não disponível' && (
                                                            <a 
                                                                href={`tel:${p.number.replace(/\D/g, '')}`}
                                                                className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 hover:text-brand-red hover:bg-red-50 transition-all border border-gray-100"
                                                                title="Ligar"
                                                            >
                                                                <Phone size={16} />
                                                            </a>
                                                        )}
                                                        {p.isWhatsApp && (
                                                            <button 
                                                                onClick={() => {
                                                                    const cleanNumber = p.number.replace(/\D/g, '');
                                                                    window.open(`https://wa.me/55${cleanNumber}?text=Olá! Vi seu anúncio no O Vermelhinho.`, '_blank');
                                                                }}
                                                                className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-500 hover:bg-green-100 transition-all border border-green-100"
                                                                title="WhatsApp"
                                                            >
                                                                <MessageCircle size={18} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            {idx < allPhones.length - 1 && <div className="h-px bg-gray-50 mt-4" />}
                                        </div>
                                    ))}
                                    
                                    {client.contatos?.[0]?.email_principal && client.contatos?.[0]?.exibir_email !== false && (
                                        <div className="group relative mt-4">
                                            {allPhones.length > 0 && <div className="h-px bg-gray-50 mb-4" />}
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">E-mail</span>
                                                <div className="flex items-center justify-between gap-2">
                                                    <a 
                                                        href={`mailto:${client.contatos[0].email_principal}`} 
                                                        className="flex-1 min-w-0 text-sm font-black text-gray-900 hover:text-brand-red transition-colors font-serif italic truncate"
                                                        title={client.contatos[0].email_principal}
                                                    >
                                                        {client.contatos[0].email_principal}
                                                    </a>
                                                    <div className="flex-shrink-0 flex gap-2">
                                                        <button 
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(client.contatos[0].email_principal);
                                                                setCopiedEmail(true);
                                                                setTimeout(() => setCopiedEmail(false), 2000);
                                                            }}
                                                            className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 hover:text-brand-red hover:bg-red-50 transition-all border border-gray-100"
                                                            title="Copiar E-mail"
                                                        >
                                                            {copiedEmail ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                                                        </button>
                                                        <a 
                                                            href={`mailto:${client.contatos[0].email_principal}`}
                                                            className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 hover:text-brand-red hover:bg-red-50 transition-all border border-gray-100"
                                                            title="Enviar E-mail"
                                                        >
                                                            <Mail size={16} />
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Hours Section (Real Data) */}
                        {isPagante && (<div className="bg-white p-10 rounded-[3rem] shadow-xl border-2 border-white gummy-card space-y-6">
                            <h3 className="text-xl font-black font-serif italic text-gray-900">Funcionamento</h3>
                            <div className="space-y-3 font-black text-[10px] uppercase tracking-widest">
                                {schedule.length > 0 ? schedule.map((s: any) => (
                                    <div key={s.day} className={`flex justify-between items-center ${new Date().getDay() === (s.day === 7 ? 0 : s.day) ? 'text-brand-red' : 'text-gray-900'}`}>
                                        <span className="w-24">{daysMap[s.day]}</span>
                                        <div className="flex-1 h-px border-t border-dotted border-gray-100 mx-4"></div>
                                        {s.closed ? (
                                            <span className="text-gray-300 text-right">Fechado</span>
                                        ) : (
                                            <div className="text-right flex flex-col items-end">
                                                <span>{s.open} - {s.close}</span>
                                                {s.open2 && s.close2 && (
                                                    <span className="text-[8px] opacity-60 leading-tight">{s.open2} - {s.close2}</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )) : <p className="text-gray-400 font-bold italic lowercase">Não informado</p>}
                            </div>
                        </div>)}

                        {/* WhatsApp CTA */}
                        {hasWhatsApp && (
                            <div className="relative group overflow-hidden bg-[#25D366] rounded-[2rem] p-5 md:p-6 text-white shadow-xl shadow-green-100 gummy-card cursor-pointer border-b-[3px] border-green-700 active:border-b-0 active:translate-y-1 transition-all" onClick={handleWhatsAppClick}>
                                <div className="relative space-y-3">
                                    <div className="bg-white/20 w-10 h-10 rounded-lg flex items-center justify-center">
                                        <MessageCircle size={20} fill="white" className="text-green-500" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <h4 className="text-lg md:text-xl font-black font-serif italic leading-none">Precisa de uma<br />resposta rápida?</h4>
                                        <p className="text-white/80 text-[9px] md:text-[10px] font-bold font-sans">Entre em contato diretamente no WhatsApp.</p>
                                    </div>
                                    <div className="flex items-center space-x-2 text-[9px] font-black uppercase tracking-widest pt-1">
                                        <span>Enviar Mensagem</span>
                                        <ChevronRight size={12} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Redes Sociais Dinâmicas */}
                        {client.redes_sociais?.length > 0 && isPagante && (
                            <div className="hidden lg:block bg-white p-10 rounded-[3rem] shadow-xl border-2 border-white gummy-card space-y-6">
                                <h3 className="text-xl font-black font-serif italic text-gray-900">Redes Sociais</h3>
                                <div className="flex flex-wrap gap-4">
                                    {client.redes_sociais.map((rede: any) => {
                                        const t = rede.tipo?.toLowerCase() || '';
                                        const formattedUrl = rede.url?.startsWith('http') ? rede.url : `https://${rede.url}`;
                                        const colorClass = t.includes('instagram') ? 'text-[#E1306C] hover:bg-pink-50' :
                                                           t.includes('facebook') ? 'text-[#1877F2] hover:bg-blue-50' :
                                                           t.includes('linkedin') ? 'text-[#0A66C2] hover:bg-blue-50' :
                                                           t.includes('youtube') ? 'text-[#FF0000] hover:bg-red-50' :
                                                           'text-gray-500 hover:text-brand-red hover:bg-gray-100';
                                        return (
                                            <a
                                                key={rede.id}
                                                href={formattedUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 active:scale-75 transition-all ${colorClass}`}
                                            >
                                                {t.includes('instagram') && <Instagram size={24} />}
                                                {t.includes('facebook') && <Facebook size={24} />}
                                                {t.includes('linkedin') && <Linkedin size={24} />}
                                                {t.includes('youtube') && <Youtube size={24} />}
                                                {(t.includes('site') || t.includes('globo') || t.includes('website')) && <Globe size={24} />}
                                                {!['instagram', 'facebook', 'linkedin', 'youtube', 'site', 'globo', 'website'].some(k => t.includes(k)) && <ExternalLink size={24} />}
                                            </a>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Onde nos Encontrar (Mobile Only) */}
                        {isPagante && client.enderecos?.length > 1 && (
                            <section className="space-y-6 lg:hidden mt-8">
                                <h3 className="text-xl font-black font-serif italic text-gray-900">Onde nos Encontrar</h3>
                                <div className="space-y-4">
                                    {client.enderecos?.length > 0 ? client.enderecos.map((end: any, i: number) => (
                                        <div key={i} className="bg-white p-6 rounded-[2.5rem] border-2 border-gray-50 shadow-xl gummy-card group hover:border-brand-red/30 transition-all flex flex-col justify-between">
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-red-50 text-brand-red rounded-2xl flex items-center justify-center font-black">
                                                            {i + 1}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-black text-gray-900 uppercase tracking-widest text-xs leading-tight">
                                                                {end.nome_unidade || (i === 0 ? 'Matriz' : `Unidade ${i + 1}`)}
                                                            </h4>
                                                            <p className="text-[11px] text-gray-400 font-black uppercase tracking-widest">{end.cidade} - {end.estado}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {!end.exibir_apenas_cidade ? (
                                                    <p className="text-base text-gray-500 font-medium leading-relaxed">
                                                        {end.rua}, {end.numero} {end.complemento ? `- ${end.complemento}` : ''}<br/>
                                                        {end.bairro} • {end.cep}
                                                    </p>
                                                ) : (
                                                    <p className="text-base text-gray-400 font-medium italic mt-2">
                                                        Endereço completo não exibido. Atendimento em {end.cidade} - {end.estado}.
                                                    </p>
                                                )}
                                            </div>

                                            {isPagante && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
                                                    {(i === 0 ? allPhones : [{ label: 'Telefone', number: end.telefone, isWhatsApp: false }]).map((p: any, idx: number) => (
                                                        p.number && (
                                                            <a 
                                                                key={idx}
                                                                href={`tel:${p.number.replace(/\D/g, '')}`}
                                                                className={`col-span-full bg-green-50 hover:bg-green-100 py-2.5 rounded-[1.2rem] text-[11px] font-black uppercase tracking-[0.15em] text-green-600 text-center transition-all border border-green-100 flex flex-col items-center justify-center`}
                                                            >
                                                                <div className="flex items-center justify-center gap-2">
                                                                    <Phone size={14} className="flex-shrink-0" /> 
                                                                    <span className="text-center whitespace-nowrap">
                                                                        {p.label}: <span>{p.number}</span>
                                                                    </span>
                                                                </div>
                                                                {p.obs && (
                                                                    <span className="text-[9px] text-green-600/70 font-semibold normal-case tracking-normal italic mt-0.5 leading-none">
                                                                        ({p.obs})
                                                                    </span>
                                                                )}
                                                            </a>
                                                        )
                                                    ))}
                                                </div>
                                            )}

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                                                {!end.exibir_apenas_cidade && (
                                                    <a 
                                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${end.rua}, ${end.numero} - ${end.bairro}, ${end.cidade}`)}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="bg-gray-50 hover:bg-gray-100 py-3 rounded-[1.2rem] text-[11px] font-black uppercase tracking-[0.15em] text-gray-600 text-center transition-all border border-gray-100"
                                                    >
                                                        Google Maps
                                                    </a>
                                                )}
                                                {(!end.exibir_apenas_cidade && isPagante) && (
                                                    <a 
                                                        href={`https://waze.com/ul?q=${encodeURIComponent(`${end.rua}, ${end.numero}, ${end.bairro}, ${end.cidade} - ${end.estado}`)}&navigate=yes`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="md:hidden bg-blue-50 hover:bg-blue-100 py-3 rounded-[1.2rem] text-[11px] font-black uppercase tracking-[0.15em] text-blue-600 text-center transition-all border border-blue-100"
                                                    >
                                                        Waze
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="col-span-full py-12 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-[3rem]">
                                            <MapPin size={32} className="mb-3 opacity-20" />
                                            <p className="font-bold italic">Nenhum endereço cadastrado</p>
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}
                    </aside>
                </div>

                {/* 🧩 RECOMMENDATIONS */}
                {recommendations?.length > 0 && (
                    <section className="mt-20 space-y-8">
                        <h2 className="text-lg md:text-2xl font-black text-gray-900 tracking-tighter font-serif">Poderá gostar também</h2>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                            {recommendations.map((rec: any) => (
                                <div
                                    key={rec.id}
                                    onClick={() => {
                                        window.scrollTo(0, 0);
                                        router.push(`/cliente/${rec.slug || rec.id}`);
                                    }}
                                    className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden shadow-lg md:shadow-xl border-2 md:border-4 border-white gummy-card group cursor-pointer hover:-translate-y-2 transition-all flex flex-col"
                                >
                                    <div className="aspect-square md:h-48 md:aspect-auto overflow-hidden relative bg-gray-50 flex items-center justify-center p-4">
                                        {(rec.galeria?.[0]?.url || rec.logotipo_url) ? (
                                            <img
                                                src={rec.galeria?.[0]?.url || rec.logotipo_url}
                                                className={`w-full h-full group-hover:scale-110 transition-all duration-700 ${rec.galeria?.[0]?.url ? 'object-cover rounded-xl' : 'object-contain'}`}
                                                alt={rec.nome_fantasia}
                                            />
                                        ) : (
                                            <Briefcase size={32} className="text-gray-300 group-hover:scale-110 transition-all duration-700" />
                                        )}
                                        <div className="absolute top-2 right-2 md:top-4 md:right-4 bg-gray-900/70 backdrop-blur-md px-2 py-1 md:px-3 rounded-full text-[8px] font-black text-white uppercase tracking-widest max-w-[80%] truncate">
                                            {rec.segmentos?.[0]?.nome || 'Negócio Local'}
                                        </div>
                                    </div>
                                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                                        <h4 className="font-black font-serif italic text-sm md:text-lg leading-tight line-clamp-2 text-gray-900">{rec.nome_fantasia}</h4>
                                        <button className="w-full bg-gray-50 py-2.5 md:py-3 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:bg-brand-red group-hover:text-white transition-all">Ver Empresa</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
                {/* 🏷️ SEO Keywords / Tags - Modern SaaS Style (Interactive & Linked) */}
                {client.seo_keywords?.length > 0 && (
                    <section className="mt-20 pt-10 border-t border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-6 text-center">Tags & Segmentos</p>
                        
                        <div className="relative">
                            <motion.div 
                                initial={false}
                                animate={{ height: isTagsExpanded ? 'auto' : '100px' }}
                                className="flex flex-wrap justify-center gap-2 overflow-hidden relative"
                            >
                                {client.seo_keywords.map((tag: string, idx: number) => (
                                    <button 
                                        key={idx}
                                        onClick={() => {
                                            window.scrollTo(0, 0);
                                            router.push(`/busca?q=${encodeURIComponent(tag)}`);
                                        }}
                                        className="text-[9px] md:text-[10px] font-bold text-gray-400 bg-white hover:text-brand-red hover:border-brand-red/30 px-4 py-2 rounded-xl border border-gray-100 transition-all shadow-sm active:scale-95"
                                    >
                                        <span className="opacity-50 mr-1">#</span>{tag}
                                    </button>
                                ))}

                                {!isTagsExpanded && (
                                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-gray-50 to-transparent pointer-events-none"></div>
                                )}
                            </motion.div>

                            {client.seo_keywords.length > 15 && (
                                <div className="mt-6 text-center">
                                    <button 
                                        onClick={() => setIsTagsExpanded(!isTagsExpanded)}
                                        className="text-[10px] font-black uppercase tracking-widest text-brand-red hover:underline flex items-center justify-center mx-auto"
                                    >
                                        {isTagsExpanded ? 'Recolher Tags' : `Ver mais ${client.seo_keywords.length - 15} tags`}
                                        <ChevronRight size={14} className={`ml-1 transition-transform ${isTagsExpanded ? '-rotate-90' : 'rotate-90'}`} />
                                    </button>
                                </div>
                            )}
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
            <footer className="md:hidden fixed bottom-0 left-0 right-0 p-4 pb-6 z-[100] pointer-events-none bg-gradient-to-t from-gray-50 via-gray-50/80 to-transparent">
                <div className="flex space-x-3 pointer-events-auto max-w-sm mx-auto">
                    {hasPhone && (
                        <button
                            onClick={handleCallClick}
                            className="flex-[0.4] bg-white text-gray-900 py-4 rounded-full shadow-[0_8px_20px_-6px_rgba(0,0,0,0.15)] border border-gray-100 font-bold text-[11px] uppercase tracking-widest flex items-center justify-center space-x-2 active:scale-95 transition-all font-sans"
                        >
                            <Phone size={16} />
                            <span>Ligar</span>
                        </button>
                    )}
                    {hasWhatsApp && (
                        <button
                            onClick={handleWhatsAppClick}
                            className="flex-1 bg-[#25D366] text-white py-4 rounded-full shadow-[0_8px_20px_-6px_rgba(37,211,102,0.4)] font-black text-sm flex items-center justify-center space-x-2 active:scale-95 transition-all overflow-hidden relative font-sans border border-[#20B054]"
                        >
                            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] active:translate-x-[100%] transition-transform duration-500"></div>
                            <WhatsAppIcon size={20} />
                            <span>WhatsApp</span>
                        </button>
                    )}
                    {(!hasPhone && !hasWhatsApp && client.enderecos?.[0] && !client.enderecos[0].exibir_apenas_cidade && isPagante) && (
                        <a
                            href={`https://waze.com/ul?q=${encodeURIComponent(`${client.enderecos[0].rua}, ${client.enderecos[0].numero} - ${client.enderecos[0].bairro}, ${client.enderecos[0].cidade}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 bg-blue-50 text-blue-600 border border-blue-100 py-4 rounded-full shadow-[0_8px_20px_-6px_rgba(37,136,211,0.2)] font-black text-sm flex items-center justify-center space-x-2 active:scale-95 transition-all overflow-hidden relative font-sans"
                        >
                            <MapPin size={20} fill="currentColor" />
                            <span>Waze</span>
                        </a>
                    )}
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
