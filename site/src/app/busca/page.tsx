'use client';

function WhatsAppIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
    Search as SearchIcon,
    MapPin,
    Star,
    MessageCircle,
    ArrowLeft,
    Sparkles,
    ChevronRight,
    Phone,
    Home,
    Briefcase,
    Heart,
    User,
    X,
    CheckCircle2,
    Mic,
    Map as MapIcon,
    List as ListIcon,
    ExternalLink,
    ChevronDown
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAnalytics } from '@/hooks/useAnalytics';
import api from '@/services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from '@/contexts/LocationContext';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useAds } from '@/hooks/useAds';
import { useCidades } from '@/hooks/useCidades';
import { getClientSeoUrl } from '@/utils/seo';
import 'leaflet/dist/leaflet.css';

// Importação dinâmica do mapa (sem SSR, obrigatório para Leaflet)
const SearchMap = dynamic(() => import('@/components/SearchMap'), {
    ssr: false,
    loading: () => (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 space-y-4">
            <div className="w-10 h-10 border-4 border-brand-red border-t-transparent rounded-full animate-spin"></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Carregando mapa...</span>
        </div>
    )
});

import { Suspense } from 'react';

const getTodayStatus = (client: any) => {
    if (!client || client.tipo_cliente !== 'pagante' || !['ativa', 'ativo', 'inadimplente'].includes(client.status_assinatura)) return null;
    
    let schedule = [];
    if (Array.isArray(client.horario_atendimento)) {
        schedule = client.horario_atendimento;
    } else if (typeof client.horario_atendimento === 'string') {
        try { schedule = JSON.parse(client.horario_atendimento); } catch(e) {}
    }
    
    if (!schedule || schedule.length === 0) return null;

    const today = new Date().getDay();
    const systemDay = today === 0 ? 7 : today;
    const todaySchedule = schedule.find((s: any) => s.day === systemDay);

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const isWithinShift = (open: string, close: string, time: string) => {
        if (!open || !close) return false;
        return close >= open 
            ? (time >= open && time <= close) 
            : (time >= open || time <= close);
    };

    // 1. Check if we are within today's shifts
    if (todaySchedule && !todaySchedule.closed) {
        if (isWithinShift(todaySchedule.open, todaySchedule.close, currentTime)) {
            return { open: true, label: `Aberto até ${todaySchedule.close}` };
        }
        if (todaySchedule.open2 && todaySchedule.close2 && isWithinShift(todaySchedule.open2, todaySchedule.close2, currentTime)) {
            return { open: true, label: `Aberto até ${todaySchedule.close2}` };
        }
    }

    // 2. Check if we are within a shift that started yesterday and crossed midnight
    const yesterdayDay = systemDay === 1 ? 7 : systemDay - 1;
    const yesterdaySchedule = schedule.find((s: any) => s.day === yesterdayDay);
    if (yesterdaySchedule && !yesterdaySchedule.closed) {
        if (yesterdaySchedule.close < yesterdaySchedule.open && currentTime <= yesterdaySchedule.close) {
            return { open: true, label: `Aberto até ${yesterdaySchedule.close}` };
        }
        if (yesterdaySchedule.open2 && yesterdaySchedule.close2 && yesterdaySchedule.close2 < yesterdaySchedule.open2 && currentTime <= yesterdaySchedule.close2) {
            return { open: true, label: `Aberto até ${yesterdaySchedule.close2}` };
        }
    }

    // 3. Fallbacks for closed state
    if (todaySchedule && !todaySchedule.closed) {
        if (todaySchedule.open2 && currentTime < todaySchedule.open2 && currentTime > todaySchedule.close) {
            return { open: false, label: `Fechado (Abre às ${todaySchedule.open2})` };
        }
        if (currentTime < todaySchedule.open) {
            return { open: false, label: `Fechado (Abre às ${todaySchedule.open})` };
        }
        return { open: false, label: `Fechado (Abre às ${todaySchedule.open})` };
    }

    return { open: false, label: 'Fechado' };
};

function SearchContent() {
    const [hoveredResult, setHoveredResult] = useState<number | null>(null);
    const [selectedMapResult, setSelectedMapResult] = useState<number | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
    const [showMapDesktop, setShowMapDesktop] = useState(true);
    const { data: availableCities } = useCidades();
    const [citySearchQuery, setCitySearchQuery] = useState('');
    const [isListening, setIsListening] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const router = useRouter();
    const searchParams = useSearchParams();
    const [query, setQuery] = useState('');
    const observerTarget = useRef(null);
    const { cityId, cityName, setCity, setIsCityModalOpen } = useLocation();

    // Foco automático no input ao carregar a página (Abre o teclado no Mobile)
    useEffect(() => {
        if (inputRef.current) inputRef.current.focus();
    }, []);

    const filteredCities = useMemo(() => {
        if (!citySearchQuery) return availableCities;
        return availableCities.filter((c: any) =>
            c.nome.toLowerCase().includes(citySearchQuery.toLowerCase())
        );
    }, [availableCities, citySearchQuery]);

    // Mapeamento de filtros inteligentes
    const getDynamicFilters = useCallback(() => {
        const q = query.toLowerCase();
        if (q.includes('pizz') || q.includes('fome') || q.includes('comida'))
            return ['🍕 Aberto Agora', '🚚 Entrega Grátis', '⭐ Melhores Notas', '💸 Promoção'];
        if (q.includes('casa') || q.includes('apartamento') || q.includes('aluguel'))
            return ['🏠 Aluguel', '🔑 Venda', '🚗 Com Garagem', '✨ Lançamento'];
        if (q.includes('vaga') || q.includes('emprego') || q.includes('trabalho'))
            return ['💼 Home Office', '📝 CLT', '🎓 Estágio', '📍 Perto de Mim'];
        if (q.includes('carro') || q.includes('veiculo') || q.includes('moto'))
            return ['🚗 Seminovo', '💰 Financiamento', '🔄 Troca', '🔒 Blindado'];

        return ['📍 Aberto Agora', '🚚 Entrega Grátis', '✨ Com IA', '⭐ Melhores Notas'];
    }, [query]);


    const activeFilters = useMemo(() => getDynamicFilters(), [getDynamicFilters]);

    // ✅ Verifica se o cliente atende a região selecionada (mas é de fora da cidade)
    const isExpansionClient = useCallback((item: any) => {
        if (!cityName || !item.enderecos?.[0]?.cidade) return false;
        const normalizedSearchCity = cityName.toLowerCase().trim();
        const clientCity = item.enderecos[0].cidade.toLowerCase().trim();

        // Se a cidade do endereço é diferente da cidade buscada, mas ele está nos resultados,
        // é porque ele atende a região via contrato premium de expansão
        return !clientCity.includes(normalizedSearchCity) && normalizedSearchCity !== clientCity;
    }, [cityName]);

    // ✅ Campanhas de Banners (Busca)
    const { data: searchAds } = useAds({
        city_id: cityId,
        keywords: query,
        tipo: 'BANNER'
    });

    // 1. Hero Ad (Topo) - Exige midia de topo
    const heroAd = useMemo(() => {
        if (!searchAds || searchAds.length === 0) return null;
        
        // Procura campanha que tenha mídia de topo
        const ad = searchAds.find(a => Object.keys(a.midias || {}).some(k => ['banner_topo', 'BANNER', 'SEARCH_RESULT', 'IMAGEM'].includes(k.toUpperCase()) || ['banner_topo', 'BANNER', 'SEARCH_RESULT', 'IMAGEM'].includes(k)));
        if (!ad) return null;

        const midia = ad.midias['banner_topo'] || ad.midias['BANNER'] || Object.values(ad.midias)[0] || {};
        
        return {
            id: ad.id,
            title: ad.nome,
            image: (typeof window !== 'undefined' && window.innerWidth < 768) 
                ? (midia.mobile?.url || midia.desktop?.url) 
                : (midia.desktop?.url || midia.mobile?.url),
            link: ad.url || null,
        };
    }, [searchAds]);

    // 2. Listing Ad (Meio) - Exige midia de segmento/listagem
    const listAd = useMemo(() => {
        const defaultInstitutional = {
            id: 101,
            title: "Anuncie no O Vermelhinho",
            image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
            link: "https://overmelhinho.com.br/anuncie"
        };

        if (!searchAds || searchAds.length === 0) return defaultInstitutional;

        // Procura campanha que tenha mídia de segmento
        const ad = searchAds.find(a => Object.keys(a.midias || {}).some(k => ['banner_segmento', 'SEGMENT_LISTING'].includes(k.toUpperCase()) || ['banner_segmento', 'SEGMENT_LISTING'].includes(k)));

        if (!ad) return defaultInstitutional;

        const midia = ad.midias['banner_segmento'] || ad.midias['SEGMENT_LISTING'] || Object.values(ad.midias)[0] || {};

        return {
            id: ad.id,
            title: ad.nome,
            image: (typeof window !== 'undefined' && window.innerWidth < 768) 
                ? (midia.mobile?.url || midia.desktop?.url) 
                : (midia.desktop?.url || midia.mobile?.url),
            link: ad.url || null,
        };
    }, [searchAds, heroAd]);

    const topBanner = useMemo(() => {
        if (heroAd && heroAd.image) {
            return {
                ...heroAd,
                isInstitutional: false
            };
        }
        return null;
    }, [heroAd]);

    const interstitialAds = useMemo(() => {
        if (!searchAds || searchAds.length < 2) {
            return [];
        }
        
        return searchAds.slice(1).map(ad => {
            const midia = ad.midias['BANNER'] || ad.midias['banner_topo'] || Object.values(ad.midias)[0] || {};
            return {
                id: ad.id,
                title: ad.nome,
                description: `Destaque de ${ad.cliente.nome}`,
                image: (typeof window !== 'undefined' && window.innerWidth < 768) 
                    ? (midia.mobile?.url || midia.desktop?.url) 
                    : (midia.desktop?.url || midia.mobile?.url),
                cta: "Saber Mais",
                link: ad.cliente.whatsapp ? `https://wa.me/55${ad.cliente.whatsapp.replace(/\D/g, '')}` : `/cliente/${ad.cliente.slug}`,
                bgColor: "bg-brand-red"
            };
        });
    }, [searchAds, heroAd, listAd]);

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
    } = useInfiniteQuery({
        queryKey: ['search', query, cityId],
        queryFn: async ({ pageParam = 1 }) => {
            const res = await api.get(`/public/search`, {
                params: {
                    q: query,
                    page: pageParam,
                    per_page: 20,
                    city_id: cityId || searchParams.get('city_id')
                }
            });
            return res.data;
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage) => {
            const { current_page, last_page } = lastPage.meta || {};
            return current_page < last_page ? current_page + 1 : undefined;
        },
        enabled: !!query
    });

    const allResults = useMemo(() => {
        const results = data?.pages.flatMap(page => page.data) || [];
        // ✅ Remover duplicatas por ID (caso o backend retorne o mesmo item em páginas diferentes)
        const seen = new Set();
        return results.filter(item => {
            if (seen.has(item.id)) return false;
            seen.add(item.id);
            return true;
        });
    }, [data]);
 
    // ✅ Helper para gerar links SEO (Cidade/Segmento/Cliente)
    const getClientLink = (client: any) => getClientSeoUrl(client, cityName || null);

 
    const { trackSearch, trackInteraction, trackAdInteraction: trackAd } = useAnalytics();
 
    useEffect(() => {
        let q = searchParams.get('q');
        if (!q && typeof window !== 'undefined') {
            const raw = window.location.search;
            if (raw.includes('q-')) q = raw.split('q-')[1]?.split('&')[0];
        }
        setQuery(q || '');
    }, [searchParams]);
 
    // Tracking de busca
    useEffect(() => {
        if (!isLoading && (query || cityName)) {
            trackSearch(query || cityName || 'Busca Geral', cityName || 'Geral', allResults.length);
        }
    }, [isLoading, query, cityName, allResults.length]);
 
    useEffect(() => {
        if (topBanner) {
            trackAd(topBanner.id, 'view', topBanner.isInstitutional ? 'INSTITUTIONAL_TOP' : 'SEARCH_RESULT');
        }
    }, [topBanner?.id]);
 
    useEffect(() => {
        if (listAd && listAd.id !== 101) {
            trackAd(listAd.id, 'view', 'SEGMENT_LISTING');
        }
    }, [listAd?.id]);

    // Intersection Observer para scroll infinito
    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            { threshold: 0.1 }
        );
        if (observerTarget.current) observer.observe(observerTarget.current);
        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    // Auto-fetch until all pagantes are loaded
    useEffect(() => {
        if (!data || isFetchingNextPage || !hasNextPage) return;
        const lastPage = data.pages[data.pages.length - 1];
        if (!lastPage || !lastPage.data || lastPage.data.length === 0) return;
        
        const lastItem = lastPage.data[lastPage.data.length - 1];
        const isLastItemPagante = lastItem.tipo_cliente === 'pagante' && ['ativa', 'ativo', 'inadimplente'].includes(lastItem.status_assinatura);

        if (isLastItemPagante) {
            fetchNextPage();
        }
    }, [data, isFetchingNextPage, hasNextPage, fetchNextPage]);

    // Match Perfeito / Alta Certeza
    const matchPerfeito = useMemo(() => {
        if (!allResults.length || !query) return null;
        
        const first = allResults[0];
        const q = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        const n = first.nome_fantasia.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        
        const qWords = q.split(' ').filter(Boolean);
        
        // Match exato
        if (n === q) return first;

        // Se a busca tem mais de uma palavra (busca mais específica) e o nome bate, consideramos match
        // Isso evita que buscas genéricas de 1 palavra (ex: "desentupidora") deem match perfeito em "AG Desentupidora"
        if (qWords.length > 1 && (n.includes(q) || q.includes(n))) {
            return first;
        }
        
        return null;
    }, [allResults, query]);

    const qNorm = query ? query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() : '';

    const exactMatches = allResults.filter((item: any, idx: number) => {
        if (matchPerfeito && item.id === matchPerfeito.id) return false;
        const isPagante = item.tipo_cliente === 'pagante' && ['ativa', 'ativo', 'inadimplente'].includes(item.status_assinatura);
        if (isPagante) return false;
        
        const nNorm = item.nome_fantasia ? item.nome_fantasia.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() : '';
        return qNorm.length > 2 && nNorm.includes(qNorm);
    });

    const destaques = allResults.filter((item: any, idx: number) => {
        if (matchPerfeito && item.id === matchPerfeito.id) return false;
        return item.tipo_cliente === 'pagante' && ['ativa', 'ativo', 'inadimplente'].includes(item.status_assinatura);
    });
    
    const ignoreIds = new Set([...exactMatches.map((i: any) => i.id), ...destaques.map((i: any) => i.id)]);
    if (matchPerfeito) ignoreIds.add(matchPerfeito.id);
    
    const outrosResultados = allResults.filter((item: any) => !ignoreIds.has(item.id));

    const selectedMapItem = useMemo(() => allResults.find((r: any) => r.id === selectedMapResult), [allResults, selectedMapResult]);

    useEffect(() => {
        if (query && data) trackSearch(query, cityName || 'Geral', allResults.length);
    }, [query, data, allResults.length, cityName]);

    const handleNewSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const val = (e.target as HTMLInputElement).value;
            if (val.trim()) router.push(`/busca?q=${encodeURIComponent(val)}`);
        }
    };

    const handleWhatsApp = (id: number, phone: string) => {
        trackInteraction(id, 'whatsapp_click');
        const clean = phone ? phone.replace(/\D/g, '') : '87999999999';
        window.open(`https://wa.me/55${clean}`, '_blank');
    };

    const startVoiceSearch = async () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            alert('Busca por voz não suportada. Use Chrome ou Safari.');
            return;
        }

        try {
            setIsListening(true);

            // Tenta garantir permissão no nível do navegador
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                stream.getTracks().forEach(track => track.stop());
            }

            const recognition = new SpeechRecognition();
            recognition.lang = 'pt-BR';
            recognition.interimResults = true;
            recognition.continuous = false;

            recognition.onstart = () => setIsListening(true);
            recognition.onend = () => setIsListening(false);

            recognition.onerror = (event: any) => {
                setIsListening(false);
                if (event.error === 'not-allowed') {
                    alert('O Chrome está sem permissão de microfone no seu Android. Vá em Configurações > Apps > Chrome > Permissões e ative o Microfone.');
                }
            };

            recognition.onresult = (event: any) => {
                const transcript = event.results?.[0]?.[0]?.transcript;
                if (transcript) {
                    setQuery(transcript);
                    if (event.results[0].isFinal) {
                        router.push(`/busca?q=${encodeURIComponent(transcript)}${cityId ? `&city_id=${cityId}` : ''}`);
                    }
                }
            };

            // Delay para o hardware do celular processar a transição
            setTimeout(() => {
                try { recognition.start(); } catch (e) { setIsListening(false); }
            }, 250);

        } catch (err: any) {
            setIsListening(false);
            if (err.name === 'NotAllowedError') {
                alert('Acesso negado pelo sistema. Verifique as Permissões do App Chrome nas configurações do seu celular.');
            }
        }
    };

    return (
        <div className="min-h-screen bg-cloud-dancer font-sans selection:bg-brand-red/10 overflow-x-hidden">

            <div className="lg:flex lg:h-screen lg:overflow-hidden lg:justify-center">

                {/* ============ LADO ESQUERDO: LISTA ============ */}
                <div className={`w-full lg:w-[65%] lg:flex-shrink-0 lg:overflow-y-auto no-scrollbar ${showMapDesktop ? 'lg:border-r border-gray-100' : 'border-x border-gray-100'} ${viewMode === 'map' ? 'hidden lg:block' : 'block'} transition-all duration-700 ease-in-out`}>
                    
                    <div className="p-4 bg-cloud-dancer flex justify-between items-center">
                        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-1 flex-1">
                            {/* BOTÃO DE FILTRO DE CIDADE (Estilo iFood) */}
                            <button
                                onClick={() => setIsCityModalOpen(true)}
                                className="whitespace-nowrap flex items-center px-5 py-2.5 bg-white/70 backdrop-blur-md border border-gray-100 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-900 active:scale-95 hover:bg-white hover:text-brand-red transition-all shadow-sm cursor-pointer"
                            >
                                <span className="mr-2">📍 {cityName || 'Qualquer Cidade'}</span>
                                <ChevronDown size={14} className="opacity-70" />
                            </button>

                            {/* DEMAIS FILTROS DINÂMICOS */}
                            {activeFilters.map((filter) => (
                                <button
                                    key={filter}
                                    onClick={() => {
                                        const cleanFilter = filter.split(' ').slice(1).join(' ');
                                        router.push(`/busca?q=${encodeURIComponent(query + ' ' + cleanFilter)}`);
                                    }}
                                    className="whitespace-nowrap px-5 py-2.5 bg-white/70 backdrop-blur-md border border-gray-100 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-400 active:scale-95 hover:bg-white hover:text-brand-red transition-all shadow-sm cursor-pointer"
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>
                        <div className="hidden lg:flex bg-white/70 backdrop-blur-md rounded-full p-1 border border-gray-200 shadow-sm ml-4 flex-shrink-0">
                            <button onClick={() => setShowMapDesktop(false)} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${!showMapDesktop ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>📄 Lista</button>
                            <button onClick={() => setShowMapDesktop(true)} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${showMapDesktop ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>🗺️ Mapa</button>
                        </div>
                    </div>

                    <main className="px-5 py-6 space-y-12 pb-40">

                        {/* HERO AD BANNER (PATROCINADO / INSTITUCIONAL) */}
                        {topBanner && topBanner.image && (
                            <motion.section
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`relative group ${topBanner.link ? 'cursor-pointer' : 'cursor-default'} lg:max-w-[85%] lg:mx-auto`}
                                onClick={() => {
                                    if (topBanner.link) {
                                        trackAd(topBanner.id, 'click', topBanner.isInstitutional ? 'INSTITUTIONAL_TOP' : 'SEARCH_RESULT');
                                        window.open(topBanner.link, topBanner.link.startsWith('http') ? '_blank' : '_self');
                                    }
                                }}
                            >
                                <div className={`relative h-auto md:h-auto rounded-[2rem] md:rounded-[2.5rem] overflow-hidden bg-gray-50/50 transition-transform duration-700 ${topBanner.link ? 'group-hover:scale-[1.01]' : ''}`}>
                                    <img 
                                        src={topBanner.image} 
                                        className="w-full h-auto max-h-[350px] lg:max-h-[280px] object-contain mx-auto" 
                                        alt={topBanner.title} 
                                    />
                                    {/* Link Indicator (Optional but subtle) */}
                                    {topBanner.link && (
                                        <div className="absolute bottom-4 right-4 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-white/30">
                                            <ExternalLink size={14} className="text-white" />
                                        </div>
                                    )}
                                </div>
                            </motion.section>
                        )}

                        {/* LOADING */}
                        {isLoading && (
                            <div className="flex flex-col items-center justify-center py-40 space-y-4">
                                <div className="w-12 h-12 border-4 border-brand-red border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Escaneando a região...</p>
                            </div>
                        )}

                        {/* EMPTY */}
                        {!isLoading && allResults.length === 0 && (
                            <div className="text-center py-32 space-y-4">
                                <div className="bg-gray-50 w-20 h-20 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-inner border border-gray-100">
                                    <SearchIcon className="text-gray-200" size={32} />
                                </div>
                                <h4 className="text-2xl font-black text-gray-900 font-serif tracking-tighter">Sem resultados</h4>
                                <p className="text-sm text-gray-400 max-w-[200px] mx-auto leading-relaxed">Tente outro termo ou categoria.</p>
                            </div>
                        )}

                        {/* BLOCO HERO REMOVIDO A PEDIDO DO CLIENTE - RESTAURADO COM NOVA LÓGICA */}
                        {/* 1. HERO RESULT (MATCH PERFEITO) */}
                        {!isLoading && matchPerfeito && (
                            <section className="animate-fade-in relative z-10 w-full mb-3 md:mb-5 mt-4">

                                <div
                                    onClick={() => router.push(getClientLink(matchPerfeito))}
                                    onMouseEnter={() => setHoveredResult(matchPerfeito.id)}
                                    onMouseLeave={() => setHoveredResult(null)}
                                    className="bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-2xl border-4 border-brand-red/10 cursor-pointer overflow-hidden flex flex-col md:flex-row group gummy-card"
                                >
                                    {matchPerfeito.tipo_cliente === 'pagante' && ['ativa', 'ativo', 'inadimplente'].includes(matchPerfeito.status_assinatura) && (
                                        <div className="w-full md:w-2/5 h-40 md:h-auto relative overflow-hidden flex-shrink-0">
                                            {matchPerfeito.banner_url || matchPerfeito.galeria?.[0]?.url ? (
                                                <img src={matchPerfeito.banner_url || matchPerfeito.galeria[0].url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt="" />
                                            ) : (
                                                <div className="w-full h-full bg-brand-red/5 group-hover:scale-110 transition-transform duration-1000 flex items-center justify-center">
                                                    <span className="text-brand-red/20 font-black text-4xl uppercase">{matchPerfeito.nome_fantasia.charAt(0)}</span>
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                                            
                                            {matchPerfeito.logotipo_url && (
                                                <div className="absolute bottom-4 md:bottom-6 left-4 md:left-6 w-24 h-24 md:w-32 md:h-32 rounded-[1.5rem] md:rounded-[2rem] bg-white p-1 shadow-2xl border-4 border-white z-10 group-hover:scale-110 transition-transform duration-500">
                                                    <img src={matchPerfeito.logotipo_url} className="w-full h-full object-cover rounded-[1.2rem] md:rounded-[1.6rem]" alt="" onError={(e) => { e.currentTarget.parentElement!.style.display = 'none'; }} />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <div className="flex-1 p-5 md:p-8 flex flex-col justify-center relative bg-white">
                                        <div className="space-y-4">
                                            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h2 className="text-xl md:text-3xl font-black text-gray-900 tracking-tight font-serif italic leading-none">{matchPerfeito.nome_fantasia}</h2>

                                                    </div>
                                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">{matchPerfeito.segmentos?.[0]?.nome || 'Negócio Parceiro'}</p>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-3">
                                                <span className="flex items-center text-[10px] font-black text-brand-red uppercase tracking-widest bg-red-50 px-3 py-1.5 rounded-xl border border-red-100 shadow-sm">
                                                    <MapPin size={12} className="mr-1.5" /> 
                                                    {matchPerfeito.enderecos?.[0]?.cidade || 'Local'}
                                                </span>
                                                {matchPerfeito.enderecos?.[0]?.bairro && matchPerfeito.enderecos[0].bairro.toLowerCase() !== 'vazio' && (
                                                    <span className="flex items-center text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                                                        {matchPerfeito.enderecos[0].bairro}
                                                    </span>
                                                )}
                                                {getTodayStatus(matchPerfeito) && (
                                                    <span className={`${getTodayStatus(matchPerfeito)?.open ? 'text-green-500 bg-green-50 border-green-100' : 'text-brand-red bg-red-50 border-red-100'} font-black flex items-center text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-xl border`}>
                                                        <div className={`w-1.5 h-1.5 ${getTodayStatus(matchPerfeito)?.open ? 'bg-green-500' : 'bg-brand-red'} rounded-full mr-1.5 ${getTodayStatus(matchPerfeito)?.open ? 'animate-pulse' : ''}`}></div>
                                                        {getTodayStatus(matchPerfeito)?.label}
                                                    </span>
                                                )}
                                            </div>
                                            
                                            {matchPerfeito.tipo_cliente === 'pagante' && ['ativa', 'ativo', 'inadimplente'].includes(matchPerfeito.status_assinatura) && matchPerfeito.contatos?.[0]?.celular && (
                                                <div className="pt-2">
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleWhatsApp(matchPerfeito.id, matchPerfeito.contatos[0].celular);
                                                        }}
                                                        className="w-full md:w-auto px-6 py-3 bg-green-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-green-500/30 hover:bg-green-600 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 border border-green-400"
                                                    >
                                                        <MessageCircle size={16} />
                                                        <span>Chamar no WhatsApp</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}



                        {/* 1.5 EXACT MATCHES (Gratuitos Altamente Relevantes) */}
                        {!isLoading && exactMatches.length > 0 && (
                            <section className="space-y-4 mb-8">
                                <div className="bg-white rounded-[4rem] shadow-2xl border border-white overflow-hidden p-2">
                                    {exactMatches.map((item: any, idx: number) => {
                                        return (
                                            <div
                                                key={item.id}
                                                onClick={() => router.push(getClientLink(item))}
                                                onMouseEnter={() => setHoveredResult(item.id)}
                                                onMouseLeave={() => setHoveredResult(null)}
                                                className={`flex items-center justify-between p-4 md:p-5 hover:bg-gray-50/80 transition-all group cursor-pointer ${idx !== exactMatches.length - 1 ? 'border-b border-gray-50' : ''}`}
                                            >
                                                <div className="flex items-center space-x-4 md:space-x-6">
                                                    <div className="space-y-0.5">
                                                        <div className="flex items-center space-x-2">
                                                            <h5 className="font-black text-gray-900 font-serif italic tracking-tight text-base md:text-lg leading-tight">{item.nome_fantasia}</h5>
                                                        </div>
                                                        <p className="text-[10px] md:text-[11px] font-bold text-gray-400 uppercase tracking-[0.15em]">{item.segmentos?.[0]?.nome || 'Negócio Parceiro'}</p>
                                                        <div className="flex flex-wrap items-center gap-2 mt-1">
                                                            <span className="flex items-center text-[9px] font-black text-brand-red bg-red-50/80 px-2 py-0.5 rounded-lg border border-red-100 uppercase tracking-wider">
                                                                <MapPin size={10} className="mr-1" />
                                                                {item.enderecos?.[0]?.cidade || 'Local'}
                                                            </span>
                                                            {item.enderecos?.[0]?.bairro && item.enderecos[0].bairro.toLowerCase() !== 'vazio' && (
                                                                <span className="text-[9px] font-bold text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded-lg border border-gray-100 uppercase tracking-wider">
                                                                    {item.enderecos[0].bairro}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        )}

                        {/* 2. RECOMENDADOS */}
                        {!isLoading && destaques.length > 0 && (
                            <section className="space-y-8">
                                <div className="flex justify-between items-end px-2">
                                    <h3 className="text-base md:text-xl font-black text-gray-900 tracking-tight font-serif flex flex-wrap items-center gap-1.5 md:gap-2 leading-relaxed">
                                        <span>Encontramos</span>
                                        <span className="text-brand-red bg-red-50/80 px-2.5 py-1 rounded-xl border border-red-100 text-xs md:text-sm font-black shadow-sm tracking-wide">
                                            {allResults.length} {allResults.length === 1 ? 'resultado' : 'resultados'}
                                        </span>
                                        <span>em</span>
                                        <button
                                            onClick={() => setIsCityModalOpen(true)}
                                            className="inline-flex items-center px-4 py-2 bg-brand-red text-white hover:bg-brand-red/90 rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest shadow-lg shadow-red-500/20 active:scale-95 transition-all group cursor-pointer border-b-4 border-red-800"
                                        >
                                            <span>{cityName || 'Qualquer Cidade'}</span>
                                            <ChevronDown size={14} className="ml-1.5 group-hover:translate-y-0.5 transition-transform duration-300" />
                                        </button>
                                        <span>para você</span>
                                    </h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {destaques.map((item: any) => (
                                        <div
                                            key={item.id}
                                            onClick={() => router.push(getClientLink(item))}
                                            onMouseEnter={() => setHoveredResult(item.id)}
                                            onMouseLeave={() => setHoveredResult(null)}
                                            className="bg-white rounded-[2rem] md:rounded-[2rem] shadow-xl border border-white gummy-card group overflow-hidden cursor-pointer flex flex-col"
                                        >
                                            <div className="h-20 md:h-24 overflow-hidden relative flex-shrink-0">
                                                {item.banner_url || item.galeria?.[0]?.url ? (
                                                    <img src={item.banner_url || item.galeria[0].url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt="" />
                                                ) : (
                                                    <div className="w-full h-full bg-brand-red/10 group-hover:scale-110 transition-transform duration-1000"></div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                                            </div>
                                            <div className="px-4 pb-6 md:px-5 md:pb-6 pt-1 relative flex-1 flex flex-col">
                                                {item.tipo_cliente !== 'gratuito' && item.logotipo_url && (
                                                    <div className="absolute -top-10 md:-top-12 left-4 md:left-5 w-20 h-20 md:w-24 md:h-24 rounded-[1.2rem] md:rounded-[1.5rem] bg-white p-1 shadow-2xl border-[3px] border-white group-hover:-translate-y-2 transition-transform duration-500">
                                                        <img src={item.logotipo_url} className="w-full h-full object-cover rounded-[1rem] md:rounded-[1.3rem]" alt="" onError={(e) => { e.currentTarget.parentElement!.style.display = 'none'; }} />
                                                    </div>
                                                )}
                                                <div className="pt-12 md:pt-14 space-y-2 flex-1 flex flex-col">
                                                    <div className="flex justify-between items-start gap-2">
                                                        <h4 className="text-base md:text-lg font-black text-gray-900 tracking-tight font-serif italic leading-tight break-words flex-1">{item.nome_fantasia}</h4>
                                                        {isExpansionClient(item) && (
                                                            <div className="flex flex-col items-end flex-shrink-0">
                                                                <span className="text-[8px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">✨ ATENDE AQUI</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-2 mt-auto pt-2">
                                                        <span className="flex items-center text-[9px] font-black text-brand-red bg-red-50/80 px-2.5 py-1 rounded-lg border border-red-100 uppercase tracking-wider shadow-sm">
                                                            <MapPin size={11} className="mr-1" />
                                                            {item.enderecos?.[0]?.cidade || 'Local'}
                                                        </span>
                                                        {item.enderecos?.[0]?.bairro && item.enderecos[0].bairro.toLowerCase() !== 'vazio' && (
                                                            <span className="text-[9px] font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100 uppercase tracking-wider truncate max-w-[100px]">
                                                                {item.enderecos[0].bairro}
                                                            </span>
                                                        )}
                                                        {getTodayStatus(item) && (
                                                            <span className={`${getTodayStatus(item)?.open ? 'text-green-500 bg-green-50/80 border-green-100' : 'text-brand-red bg-red-50/80 border-red-100'} font-black flex items-center text-[9px] uppercase tracking-wider px-2 py-1 rounded-lg border`}>
                                                                <div className={`w-1 h-1 ${getTodayStatus(item)?.open ? 'bg-green-500' : 'bg-brand-red'} rounded-full mr-1 ${getTodayStatus(item)?.open ? 'animate-pulse' : ''}`}></div>
                                                                {getTodayStatus(item)?.label}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                        {/* AD BANNER (LISTAGEM) */}
                        {listAd && listAd.id !== 101 && (
                            <section className="relative px-6 md:px-20 mb-8 mt-4">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    className={`relative rounded-[2rem] md:rounded-[3rem] overflow-hidden transition-all transform ${listAd.link ? 'cursor-pointer hover:scale-[1.01]' : 'cursor-default'} w-full flex shadow-lg bg-gray-50`}
                                    onClick={() => {
                                        if (listAd.link) {
                                            trackAd(listAd.id, 'click', 'SEGMENT_LISTING');
                                            window.open(listAd.link, listAd.link.startsWith('http') ? '_blank' : '_self');
                                        }
                                    }}
                                >
                                    <img 
                                        src={listAd.image} 
                                        className="w-full h-auto max-h-[220px] md:max-h-[260px] object-contain mx-auto" 
                                        alt={listAd.title} 
                                    />
                                    {listAd.link && (
                                        <div className="absolute bottom-4 right-4 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center transition-opacity border border-white/30">
                                            <ExternalLink size={14} className="text-white" />
                                        </div>
                                    )}
                                </motion.div>
                            </section>
                        )}

                        {/* 4. TODOS OS RESULTADOS + SCROLL INFINITO */}
                        {!isLoading && outrosResultados.length > 0 && (
                            <section className="space-y-8">
                                <h3 className="text-xl font-black text-gray-900 tracking-tight font-serif px-2">Todos os Resultados</h3>
                                <div className="bg-white rounded-[4rem] shadow-2xl border border-white overflow-hidden p-2">
                                    {outrosResultados.map((item: any, idx: number) => {
                                        const showAd = idx >= 4 && (idx - 4) % 30 === 0 && interstitialAds.length > 0;
                                        const adIndex = idx >= 4 ? Math.floor((idx - 4) / 30) : 0;
                                        const ad = interstitialAds.length > 0 ? interstitialAds[adIndex % interstitialAds.length] : null;

                                        return (
                                            <React.Fragment key={item.id}>
                                                    <div
                                                        onClick={() => router.push(getClientLink(item))}
                                                        onMouseEnter={() => setHoveredResult(item.id)}
                                                        onMouseLeave={() => setHoveredResult(null)}
                                                        className={`flex items-center justify-between p-4 md:p-5 hover:bg-gray-50/80 transition-all group cursor-pointer ${idx !== outrosResultados.length - 1 ? 'border-b border-gray-50' : ''}`}
                                                    >
                                                        <div className="flex items-center space-x-4 md:space-x-6">
                                                            {item.tipo_cliente === 'pagante' && ['ativa', 'ativo', 'inadimplente'].includes(item.status_assinatura) && (
                                                                <div className="w-20 h-20 md:w-24 md:h-24 rounded-[1.2rem] md:rounded-[1.8rem] bg-white overflow-hidden shadow-md border-4 border-white flex-shrink-0 group-hover:scale-110 transition-transform duration-500 flex items-center justify-center">
                                                                    {item.logotipo_url ? (
                                                                        <img src={item.logotipo_url} className="w-full h-full object-cover rounded-[1rem] md:rounded-[1.5rem]" alt="" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = `<span class="text-2xl font-black text-gray-400 uppercase">${item.nome_fantasia.charAt(0)}</span>`; }} />
                                                                    ) : (
                                                                        <span className="text-2xl md:text-3xl font-black text-gray-400 uppercase">{item.nome_fantasia.charAt(0)}</span>
                                                                    )}
                                                                </div>
                                                            )}
                                                            <div className="space-y-0.5">
                                                                <div className="flex items-center space-x-2">
                                                                    <h5 className="font-black text-gray-900 font-serif italic tracking-tight text-base md:text-lg leading-tight">{item.nome_fantasia}</h5>
                                                                </div>
                                                                <p className="text-[10px] md:text-[11px] font-bold text-gray-400 uppercase tracking-[0.15em]">{item.segmentos?.[0]?.nome || 'Negócio Parceiro'}</p>
                                                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                                                    <span className="flex items-center text-[9px] font-black text-brand-red bg-red-50/80 px-2 py-0.5 rounded-lg border border-red-100 uppercase tracking-wider">
                                                                        <MapPin size={10} className="mr-1" />
                                                                        {item.enderecos?.[0]?.cidade || 'Local'}
                                                                    </span>
                                                                    {item.enderecos?.[0]?.bairro && item.enderecos[0].bairro.toLowerCase() !== 'vazio' && (
                                                                        <span className="text-[9px] font-bold text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded-lg border border-gray-100 uppercase tracking-wider">
                                                                            {item.enderecos[0].bairro}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    {item.tipo_cliente === 'pagante' && ['ativa', 'ativo', 'inadimplente'].includes(item.status_assinatura) && (
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleWhatsApp(item.id, item.contatos?.[0]?.celular || '');
                                                            }}
                                                            className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-gray-100 text-[#25D366] flex items-center justify-center active:scale-90 transition-all hover:bg-[#25D366] hover:text-white group-hover:shadow-md"
                                                        >
                                                            <WhatsAppIcon size={20} />
                                                        </button>
                                                    )}
                                                </div>

                                                {showAd && ad && (
                                                    <div className="mx-4 my-8">
                                                        <div 
                                                            className={`relative ${ad.bgColor} rounded-[2rem] p-6 overflow-hidden group/ad cursor-pointer shadow-sm`}
                                                            onClick={() => {
                                                                if (ad.link) {
                                                                    trackAd(ad.id, 'click', 'INTERSTITIAL');
                                                                    window.open(ad.link, ad.link.startsWith('http') ? '_blank' : '_self');
                                                                }
                                                            }}
                                                        >
                                                            <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                                                                <div className="flex-1 space-y-1 text-center md:text-left">
                                                                    <span className="text-[8px] font-black text-white/50 uppercase tracking-widest">Publicidade</span>
                                                                    <h4 className="text-xl font-black text-white font-serif italic tracking-tight leading-none">
                                                                        {ad.title}
                                                                    </h4>
                                                                    <p className="text-white/70 text-[10px] font-medium leading-relaxed">
                                                                        {ad.description}
                                                                    </p>
                                                                    <div className="pt-2">
                                                                        <button className="bg-white text-gray-900 px-5 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest active:scale-95 transition-transform">
                                                                            {ad.cta}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-2xl rotate-3 group-hover/ad:rotate-0 transition-transform duration-500 hidden sm:block">
                                                                    <img
                                                                        src={ad.image}
                                                                        className="w-full h-full object-cover"
                                                                        alt=""
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                                                        </div>
                                                    </div>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </div>
                            </section>
                        )}
                        
                        {/* INFINITE SCROLL OBSERVER - DEVE FICAR FORA DO CONDICIONAL */}
                        {!isLoading && (
                            <div ref={observerTarget} className="py-12 flex justify-center">
                                {isFetchingNextPage ? (
                                    <div className="flex items-center space-x-3 bg-gray-50 px-6 py-3 rounded-full border border-gray-100">
                                        <div className="w-4 h-4 border-2 border-brand-red border-t-transparent rounded-full animate-spin"></div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Carregando mais...</span>
                                    </div>
                                ) : hasNextPage ? (
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-200">↓ Role para ver mais</span>
                                ) : (
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-100">Fim dos resultados</span>
                                )}
                            </div>
                        )}

                    </main>
                </div>

                {/* ============ LADO DIREITO: MAPA LEAFLET REAL ============ */}
                <div className={`w-full ${showMapDesktop ? 'lg:w-[35%] lg:opacity-100' : 'lg:w-0 lg:opacity-0'} relative overflow-hidden ${viewMode === 'list' ? 'hidden lg:block' : 'block h-screen lg:h-screen'} transition-all duration-700 ease-in-out`}>

                    {/* Mapa real com OpenStreetMap */}
                    <SearchMap
                        results={allResults}
                        highlighted={hoveredResult || selectedMapResult}
                        onHover={setHoveredResult}
                        onClick={setSelectedMapResult}
                        onMapClick={() => setSelectedMapResult(null)}
                    />

                    {/* Header overlay com contagem */}
                    <div className="absolute top-6 left-6 z-[1000]">
                        <div className="bg-white/90 backdrop-blur-3xl px-6 py-3 rounded-full shadow-2xl border border-white/60 flex items-center space-x-4 cursor-default">
                            <div className="flex -space-x-3">
                                {allResults.filter((r: any) => r.tipo_cliente !== 'gratuito' && r.logotipo_url).slice(0, 3).map((item: any, i: number) => (
                                    <div key={i} className="inline-block h-8 w-8 rounded-full ring-4 ring-white shadow-sm overflow-hidden bg-gray-100 flex-shrink-0">
                                        <img src={item.logotipo_url} alt="" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.parentElement!.style.display = 'none'; }} />
                                    </div>
                                ))}
                            </div>
                            <div className="flex flex-col leading-none">
                                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400">Mapa Real</span>
                                <span className="text-[11px] font-black text-gray-900 uppercase tracking-widest">{allResults.length} Encontrados</span>
                            </div>
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        </div>
                    </div>

                    {/* MARCADOR DE VOLTAR PARA LISTA NO MOBILE (QUANDO NO MAPA) */}
                    <div className="absolute top-6 right-6 lg:hidden z-[1000]">
                        <button
                            onClick={() => setViewMode('list')}
                            className="bg-white/90 backdrop-blur-md p-4 rounded-[1.5rem] shadow-2xl border border-white active:scale-90 transition-all text-gray-900"
                        >
                            <ArrowLeft size={24} />
                        </button>
                    </div>

                    {/* =========== AIRBNB-STYLE MODAL CARD =========== */}
                    {selectedMapItem && (
                        <div className="absolute bottom-32 lg:bottom-10 left-1/2 -translate-x-1/2 z-[1000] w-[90%] max-w-sm animate-in slide-in-from-bottom-5 fade-in duration-300 pointer-events-auto">
                            <div className="bg-white/80 backdrop-blur-3xl p-3 border border-white/50 rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] gummy-card">
                                <div className="relative group/modal cursor-pointer" onClick={() => router.push(`/cliente/${selectedMapItem.slug || selectedMapItem.id}`)}>
                                    <div className="h-44 w-full rounded-[2rem] overflow-hidden relative shadow-inner">
                                        {selectedMapItem.galeria?.[0]?.url || selectedMapItem.logotipo_url ? (
                                            <img
                                                src={selectedMapItem.galeria?.[0]?.url || selectedMapItem.logotipo_url}
                                                className="w-full h-full object-cover group-hover/modal:scale-110 transition-transform duration-700"
                                                alt={selectedMapItem.nome_fantasia}
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-brand-red/10 group-hover/modal:scale-110 transition-transform duration-700"></div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-5">
                                            <div className="flex justify-between items-end">
                                                <div className="space-y-1">
                                                    <h3 className="text-white text-2xl font-black font-serif italic tracking-tighter leading-none">{selectedMapItem.nome_fantasia}</h3>
                                                    <p className="text-gray-300 text-[10px] font-black uppercase tracking-widest flex items-center">
                                                        <MapPin size={10} className="mr-1 text-brand-red" />
                                                        {selectedMapItem.enderecos?.[0]?.bairro || 'Centro'}
                                                    </p>
                                                </div>
                                                <div className="bg-white/20 backdrop-blur-md px-2 py-1 rounded-full flex items-center shadow-lg border border-white/10">
                                                    <Star size={10} className="fill-yellow-400 text-yellow-400 mr-1" />
                                                    <span className="text-white text-[10px] font-bold">4.9</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setSelectedMapResult(null); }}
                                            className="absolute top-3 right-3 w-8 h-8 bg-black/30 backdrop-blur-md text-white rounded-full flex items-center justify-center border border-white/20 hover:bg-black/50 transition-colors"
                                        >
                                            <span className="text-xs font-black">X</span>
                                        </button>
                                    </div>
                                    <div className="px-1 py-3 flex gap-2">
                                        <button className="flex-1 bg-brand-red text-white py-3 rounded-full font-black text-[11px] uppercase tracking-widest hover:bg-red-700 transition-colors">
                                            Ver Detalhes
                                        </button>
                                        {selectedMapItem.tipo_cliente !== 'gratuito' && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleWhatsApp(selectedMapItem.id, selectedMapItem.contatos?.[0]?.celular || ''); }}
                                                className="w-12 h-12 flex-shrink-0 bg-green-500 text-white rounded-full flex items-center justify-center shadow-md border-b-4 border-green-700 active:border-b-0 active:translate-y-1 transition-all"
                                            >
                                                <MessageCircle size={16} fill="currentColor" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>


            {/* BOTTOM NAV MOBILE */}
            <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-sm lg:hidden">
                <div className="bg-white/70 backdrop-blur-3xl border border-white/30 rounded-[2.5rem] p-1.5 shadow-[0_40px_100px_-10px_rgba(0,0,0,0.5)] flex items-center justify-around pointer-events-auto">
                    {[
                        { icon: <Home size={22} strokeWidth={2.5} />, label: 'Home', path: '/', active: false },
                        { icon: <SearchIcon size={22} strokeWidth={2.5} />, label: 'Busca', path: '/busca', active: true },
                        { icon: viewMode === 'list' ? <MapIcon size={22} strokeWidth={2.5} /> : <ListIcon size={22} strokeWidth={2.5} />, label: viewMode === 'list' ? 'Mapa' : 'Lista', path: 'TOGGLE_VIEW', active: false },
                        { icon: <Briefcase size={22} strokeWidth={2.5} />, label: 'Vagas', path: '/vagas', active: false },
                    ].map((item, idx) => (
                        <button
                            key={idx}
                            onClick={() => {
                                if (item.path === 'TOGGLE_VIEW') {
                                    setViewMode(viewMode === 'list' ? 'map' : 'list');
                                } else if (item.path === '/busca') {
                                    if (viewMode === 'map') setViewMode('list');
                                    // Dispara o clique no container do header para expandir a busca lá em cima
                                    document.getElementById('header-search-container')?.click();
                                    
                                    // Fallback para input local caso exista
                                    if (inputRef.current) inputRef.current.focus();
                                } else if (item.path !== '#') {
                                    router.push(item.path);
                                }
                            }}
                            className={`flex flex-col items-center justify-center py-1.5 px-3 transition-all active:scale-50 ${item.active ? 'text-brand-red' : 'text-gray-400'
                                } font-sans flex-1`}
                        >
                            <div className={item.active ? 'bg-red-100/50 rounded-2xl py-1 px-5 shadow-inner' : ''}>
                                {item.icon}
                            </div>
                            <span className={`text-[9px] font-black mt-0.5 uppercase tracking-tighter ${item.active ? 'opacity-100' : 'opacity-60'}`}>{item.label}</span>
                        </button>
                    ))}
                </div>
            </nav >

            {/* O Modal de Cidade agora é Global e está no Layout */}


            <style jsx global>{`
        .gummy-card { transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .gummy-card:active { transform: scale(0.97); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #f1f1f1;
            border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #e5e5e5;
        }
      `}</style>
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-cloud-dancer flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-brand-red border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <SearchContent />
        </Suspense>
    );
}
