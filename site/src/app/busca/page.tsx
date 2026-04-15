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
    ExternalLink
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAnalytics } from '@/hooks/useAnalytics';
import api from '@/services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from '@/contexts/LocationContext';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useAds } from '@/hooks/useAds';
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

function SearchContent() {
    const [hoveredResult, setHoveredResult] = useState<number | null>(null);
    const [selectedMapResult, setSelectedMapResult] = useState<number | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
    const [isCityModalOpen, setIsCityModalOpen] = useState(false);
    const [availableCities, setAvailableCities] = useState<any[]>([]);
    const [citySearchQuery, setCitySearchQuery] = useState('');
    const [isListening, setIsListening] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const router = useRouter();
    const searchParams = useSearchParams();
    const [query, setQuery] = useState('');
    const observerTarget = useRef(null);
    const { cityId, cityName, setCity } = useLocation();

    // Buscar cidades iniciais
    useEffect(() => {
        api.get('/cidades').then(res => setAvailableCities(res.data.data || res.data)).catch(() => { });
        // ✅ Foco automático no input ao carregar a página (Abre o teclado no Mobile)
        if (inputRef.current) inputRef.current.focus();
    }, []);

    const filteredCities = useMemo(() => {
        if (!citySearchQuery) return availableCities.slice(0, 10);
        return availableCities.filter(c =>
            c.nome.toLowerCase().includes(citySearchQuery.toLowerCase())
        ).slice(0, 10);
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

    // 1. Hero Ad (Topo) - Prioriza SEARCH_RESULT
    const heroAd = useMemo(() => {
        if (!searchAds || searchAds.length === 0) return null;
        
        // Tenta encontrar um que seja especificamente para busca
        const ad = searchAds.find(a => a.placements?.includes('SEARCH_RESULT')) || searchAds[0];
        const midia = ad.midias['BANNER'] || ad.midias['banner_topo'] || Object.values(ad.midias)[0] || {};
        
        return {
            id: ad.id,
            title: ad.nome,
            image: (typeof window !== 'undefined' && window.innerWidth < 768) 
                ? (midia.mobile?.url || midia.desktop?.url) 
                : (midia.desktop?.url || midia.mobile?.url),
            link: ad.url || null,
        };
    }, [searchAds]);

    // 2. Listing Ad (Meio) - Prioriza SEGMENT_LISTING
    const listAd = useMemo(() => {
        if (!searchAds || searchAds.length === 0) return null;

        // Tenta encontrar um que seja para listagem e que não seja o mesmo do hero
        const ad = searchAds.find(a => a.placements?.includes('SEGMENT_LISTING') && a.id !== heroAd?.id) 
                 || searchAds.find(a => a.placements?.includes('SEGMENT_LISTING'))
                 || (searchAds.length > 1 ? searchAds[1] : null);

        if (!ad) return null;
        const midia = ad.midias['BANNER'] || ad.midias['banner_topo'] || Object.values(ad.midias)[0] || {};

        return {
            id: ad.id,
            title: ad.nome,
            image: (typeof window !== 'undefined' && window.innerWidth < 768) 
                ? (midia.mobile?.url || midia.desktop?.url) 
                : (midia.desktop?.url || midia.mobile?.url),
            link: ad.url || null,
        };
    }, [searchAds, heroAd]);

    const interstitialAds = useMemo(() => {
        if (!searchAds || searchAds.length < 2) {
            // Fallback para ads internos se não houver campanhas suficientes
            return [
                {
                    id: 101,
                    title: "Anuncie no O Vermelhinho",
                    description: "Sua empresa em destaque para quem realmente procura.",
                    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
                    cta: "Saber Mais",
                    link: "https://overmelhinho.com.br/anuncie",
                    bgColor: "bg-indigo-600"
                }
            ];
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
                    per_page: 10,
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
        if (heroAd) {
            trackAd(heroAd.id, 'view', 'SEARCH_RESULT');
        }
    }, [heroAd?.id]);
 
    useEffect(() => {
        if (listAd) {
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

    const matchPerfeito = allResults[0] ?? null;
    const patrocinados = allResults.slice(1, 4);
    const outrosResultados = allResults.length < 4 ? [] : allResults.slice(4);

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

            <div className="lg:flex lg:h-screen lg:overflow-hidden">

                {/* ============ LADO ESQUERDO: LISTA ============ */}
                <div className={`flex-1 lg:w-[520px] lg:flex-shrink-0 lg:overflow-y-auto no-scrollbar lg:border-r border-gray-100 ${viewMode === 'map' ? 'hidden lg:block' : 'block'}`}>

                    <header className="sticky top-0 z-50 bg-cloud-dancer/90 backdrop-blur-2xl border-b border-gray-100 p-3 space-y-3 shadow-sm">
                        <div className="flex items-center space-x-3">
                            <button onClick={() => router.push('/')} className="p-2.5 bg-white rounded-2xl shadow-sm border border-gray-100 active:scale-90 transition-all cursor-pointer text-gray-400 hover:text-brand-red">
                                <ArrowLeft size={18} />
                            </button>
                            <div className="flex-1 relative group">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                    <SearchIcon size={16} className={isListening ? 'text-brand-red animate-pulse' : 'text-brand-red'} />
                                </div>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    key={query}
                                    defaultValue={query}
                                    placeholder="O que você procura?"
                                    onKeyDown={handleNewSearch}
                                    className={`w-full bg-white rounded-full py-3 pl-12 pr-14 shadow-sm border transition-all font-bold text-gray-900 text-sm outline-none ${isListening ? 'border-brand-red ring-8 ring-red-100/50' : 'border-gray-100 focus:ring-4 focus:ring-brand-red/5 focus:border-brand-red'
                                        }`}
                                />
                                <button
                                    onClick={startVoiceSearch}
                                    className={`absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-all active:scale-75 ${isListening ? 'bg-brand-red text-white shadow-lg animate-bounce' : 'text-gray-400 hover:text-brand-red'
                                        }`}
                                >
                                    <Mic size={16} />
                                </button>
                            </div>
                            <button
                                onClick={() => setIsCityModalOpen(true)}
                                className="hidden md:flex items-center space-x-2 px-4 py-3 bg-white rounded-full border border-gray-100 shadow-sm hover:border-brand-red transition-all active:scale-95 group"
                            >
                                <MapPin size={16} className="text-brand-red" />
                                <span className="text-sm font-black text-gray-900 truncate max-w-[100px]">{cityName || 'Cidade'}</span>
                            </button>
                        </div>

                        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-1">
                            <button
                                onClick={() => setIsCityModalOpen(true)}
                                className="md:hidden flex items-center space-x-2 px-4 py-2.5 bg-brand-red text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-100 active:scale-95"
                            >
                                <MapPin size={14} />
                                <span>{cityName || 'Cidade'}</span>
                            </button>

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
                    </header>

                    <main className="px-5 py-6 space-y-12 pb-40">

                        {/* HERO AD BANNER (PATROCINADO) */}
                        {heroAd && heroAd.image && (
                            <motion.section
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`relative group ${heroAd.link ? 'cursor-pointer' : 'cursor-default'}`}
                                onClick={() => {
                                    if (heroAd.link) {
                                        trackAd(heroAd.id, 'click', 'SEARCH_RESULT');
                                        window.open(heroAd.link, heroAd.link.startsWith('http') ? '_blank' : '_self');
                                    }
                                }}
                            >
                                <div className={`relative h-auto md:h-auto rounded-[2.5rem] md:rounded-[4rem] overflow-hidden shadow-2xl border-4 border-white transition-transform duration-700 ${heroAd.link ? 'group-hover:scale-[1.01]' : ''}`}>
                                    <img 
                                        src={heroAd.image} 
                                        className="w-full h-full object-contain" 
                                        alt={heroAd.title} 
                                    />
                                    {/* Link Indicator (Optional but subtle) */}
                                    {heroAd.link && (
                                        <div className="absolute bottom-6 right-6 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-white/30">
                                            <ExternalLink size={16} className="text-white" />
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

                        {/* 1. MATCH PERFEITO */}
                        {!isLoading && matchPerfeito && (
                            <section className="relative animate-in slide-in-from-bottom-10 duration-1000">
                                <div
                                    onMouseEnter={() => setHoveredResult(matchPerfeito.id)}
                                    onMouseLeave={() => setHoveredResult(null)}
                                    className="relative bg-white rounded-[2.5rem] md:rounded-[3.5rem] p-5 md:p-8 shadow-2xl border-4 border-white gummy-card overflow-hidden"
                                >
                                    <div className="flex justify-between items-start mb-4 md:mb-10">
                                        <div className="bg-brand-red/5 px-4 py-1.5 rounded-full flex items-center space-x-2 border border-brand-red/10 shadow-sm">
                                            <Sparkles size={14} className="text-brand-red animate-pulse" />
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-brand-red">Sugestão Inteligente</span>
                                        </div>
                                        <div className="flex flex-col items-end space-y-1">
                                            <div className="text-right">
                                                <p className="text-[8px] md:text-[10px] font-black text-gray-300 uppercase tracking-widest leading-none">Afinidade</p>
                                                <p className="text-2xl md:text-3xl font-black text-brand-red font-serif italic tracking-tighter">98%</p>
                                            </div>
                                            {isExpansionClient(matchPerfeito) && (
                                                <span className="bg-amber-100/80 backdrop-blur-sm text-amber-700 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-amber-200">
                                                    ✨ Regional
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4 md:space-x-8 mb-4 md:mb-10 cursor-pointer group/item" onClick={() => router.push(`/cliente/${matchPerfeito.slug || matchPerfeito.id}`)}>
                                        <div className="w-14 h-14 md:w-24 md:h-24 rounded-[1.5rem] md:rounded-[2.5rem] bg-gray-50 flex-shrink-0 overflow-hidden shadow-2xl border-4 border-white group-hover/item:scale-105 transition-transform duration-500">
                                            <img src={matchPerfeito.logotipo_url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200"} alt="" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="space-y-0.5">
                                            <h2 className="text-lg md:text-3xl font-black text-gray-900 tracking-tighter font-serif italic leading-tight">{matchPerfeito.nome_fantasia}</h2>
                                            <div className="flex items-center text-[9px] md:text-[10px] font-bold text-gray-400 space-x-2">
                                                <MapPin size={9} className="text-brand-red" />
                                                <span className="truncate max-w-[110px] md:max-w-[140px] uppercase tracking-widest">{matchPerfeito.enderecos?.[0]?.bairro || 'Centro'}</span>
                                                <span className="w-1 h-1 bg-gray-100 rounded-full"></span>
                                                <span className="flex items-center text-yellow-500 font-black whitespace-nowrap"><Star size={10} className="mr-1 fill-yellow-500" /> 4.9</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleWhatsApp(matchPerfeito.id, matchPerfeito.contatos?.[0]?.celular || '')}
                                        className="w-fit px-8 md:px-14 mx-auto bg-[#25D366] text-white py-3 md:py-5 rounded-2xl md:rounded-[2rem] font-black text-[10px] md:text-sm uppercase tracking-[0.2em] shadow-[0_20px_40px_-5px_rgba(37,211,102,0.3)] hover:shadow-green-500/40 active:scale-[0.97] transition-all flex items-center justify-center space-x-3 group/btn cursor-pointer border-b-4 border-green-700/40"
                                    >
                                        <WhatsAppIcon size={20} />
                                        <span>Iniciar no WhatsApp</span>
                                        <ChevronRight size={18} className="translate-x-0 group-hover/btn:translate-x-2 transition-transform" />
                                    </button>
                                </div>
                            </section>
                        )}

                        {/* 2. RECOMENDADOS */}
                        {!isLoading && patrocinados.length > 0 && (
                            <section className="space-y-8">
                                <div className="flex justify-between items-end px-2">
                                    <h3 className="text-2xl font-black text-gray-900 tracking-tighter font-serif">Acesso Rápido</h3>
                                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em] mb-1">Destaque</span>
                                </div>
                                <div className="grid grid-cols-1 gap-12">
                                    {patrocinados.map((item: any) => (
                                        <div
                                            key={item.id}
                                            onClick={() => router.push(`/cliente/${item.slug || item.id}`)}
                                            onMouseEnter={() => setHoveredResult(item.id)}
                                            onMouseLeave={() => setHoveredResult(null)}
                                            className="bg-white rounded-[2rem] md:rounded-[3.5rem] shadow-xl border border-white gummy-card group overflow-hidden cursor-pointer"
                                        >
                                            <div className="h-28 md:h-52 overflow-hidden relative">
                                                <img src={item.galeria?.[0]?.url || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600"} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt="" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                                            </div>
                                            <div className="px-4 pb-6 md:px-8 md:pb-10 pt-1 relative">
                                                <div className="absolute -top-8 left-4 w-16 h-16 md:w-24 md:h-24 rounded-[1.2rem] md:rounded-[2.5rem] bg-white p-1 shadow-2xl border-2 border-white group-hover:-translate-y-4 transition-transform duration-500">
                                                    <img src={item.logotipo_url || "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=200"} className="w-full h-full object-cover rounded-[1rem] md:rounded-[2rem]" alt="" />
                                                </div>
                                                <div className="pt-10 md:pt-16 space-y-2 md:space-y-4">
                                                    <div className="flex justify-between items-center">
                                                        <h4 className="text-lg md:text-2xl font-black text-gray-900 tracking-tight font-serif italic leading-none truncate max-w-[160px] md:max-w-[200px]">{item.nome_fantasia}</h4>
                                                        {isExpansionClient(item) ? (
                                                            <div className="flex flex-col items-end">
                                                                <span className="text-[8px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">✨ ATENDE AQUI</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-[8px] md:text-xs font-black text-brand-red bg-brand-red/5 px-2 py-1 rounded-lg border border-brand-red/10">PREMIUM</span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center text-[10px] font-bold text-gray-400 space-x-4 uppercase tracking-[0.1em]">
                                                        <span className="flex items-center"><MapPin size={14} className="mr-1 text-brand-red" /> {item.enderecos?.[0]?.bairro || 'Local'}</span>
                                                        <span className="text-green-500 font-black border-l border-gray-100 pl-4">Aberto Agora</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* AD BANNER (DINÂMICO OU FALLBACK) */}
                        <section className="relative px-2">
                            {listAd ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    className={`relative rounded-[2.5rem] md:rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white transition-all transform ${listAd.link ? 'cursor-pointer hover:scale-[1.01]' : 'cursor-default'}`}
                                    onClick={() => {
                                        if (listAd.link) {
                                            trackAd(listAd.id, 'click', 'SEGMENT_LISTING');
                                            window.open(listAd.link, listAd.link.startsWith('http') ? '_blank' : '_self');
                                        }
                                    }}
                                >
                                    <img 
                                        src={listAd.image} 
                                        className="w-full h-full object-contain" 
                                        alt={listAd.title} 
                                    />
                                    {listAd.link && (
                                        <div className="absolute bottom-6 right-6 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity border border-white/30">
                                            <ExternalLink size={16} className="text-white" />
                                        </div>
                                    )}
                                </motion.div>
                            ) : (
                                <div className="bg-brand-red rounded-[2.5rem] md:rounded-[3rem] p-8 md:p-10 text-white shadow-[0_30px_60px_-15px_rgba(183,15,10,0.3)] relative overflow-hidden group cursor-pointer active:scale-95 transition-all">
                                    <div className="relative z-10 space-y-4 md:space-y-6">
                                        <h3 className="text-2xl md:text-3xl font-black tracking-tighter leading-tight font-serif italic uppercase">Seja o próximo<br />Match Perfeito</h3>
                                        <p className="text-red-100 text-[8px] md:text-[9px] font-black uppercase tracking-[0.4em] opacity-80">Conecte sua empresa a novos clientes</p>
                                        <button className="bg-white text-brand-red px-8 md:px-10 py-4 md:py-4.5 rounded-2xl md:rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-2xl group-hover:scale-105 transition-transform duration-300">Quero Posicionar</button>
                                    </div>
                                    <div className="absolute -bottom-20 -right-20 w-64 h-64 md:w-80 md:h-80 bg-white/10 rounded-full blur-[100px] group-hover:bg-white/20 transition-all duration-1000" />
                                    <Sparkles className="absolute top-6 right-6 md:top-8 md:right-8 rotate-12 opacity-10 group-hover:rotate-0 transition-transform duration-700" size={100} />
                                </div>
                            )}
                        </section>

                        {/* 4. TODOS OS RESULTADOS + SCROLL INFINITO */}
                        {!isLoading && outrosResultados.length > 0 && (
                            <section className="space-y-8">
                                <h3 className="text-xl font-black text-gray-900 tracking-tight font-serif px-2">Todos os Resultados</h3>
                                <div className="bg-white rounded-[4rem] shadow-2xl border border-white overflow-hidden p-2">
                                    {outrosResultados.map((item: any, idx: number) => {
                                        const showAd = (idx + 1) % 5 === 0;
                                        const ad = interstitialAds[Math.floor(idx / 5) % interstitialAds.length];

                                        return (
                                            <React.Fragment key={item.id}>
                                                    <div
                                                        onClick={() => router.push(`/cliente/${item.slug || item.id}`)}
                                                        onMouseEnter={() => setHoveredResult(item.id)}
                                                        onMouseLeave={() => setHoveredResult(null)}
                                                        className={`flex items-center justify-between p-4 md:p-7 hover:bg-gray-50/80 transition-all group cursor-pointer ${idx !== outrosResultados.length - 1 ? 'border-b border-gray-50' : ''}`}
                                                    >
                                                        <div className="flex items-center space-x-4 md:space-x-6">
                                                            <div className="w-14 h-14 md:w-16 md:h-16 rounded-[1.2rem] md:rounded-[1.8rem] bg-gray-50 overflow-hidden shadow-inner flex-shrink-0 group-hover:scale-110 transition-transform duration-500">
                                                                <img src={item.logotipo_url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100"} className="w-full h-full object-cover" alt="" />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <h5 className="font-black text-gray-900 font-serif italic tracking-tight text-lg md:text-xl leading-none">{item.nome_fantasia}</h5>
                                                                <p className="text-[9px] md:text-[10px] font-medium text-gray-400 uppercase tracking-widest">{item.segmentos?.[0]?.nome || 'Negócio Parceiro'}</p>
                                                            </div>
                                                        </div>
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleWhatsApp(item.id, item.contatos?.[0]?.celular || '');
                                                        }}
                                                        className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-gray-100 text-[#25D366] flex items-center justify-center active:scale-90 transition-all hover:bg-[#25D366] hover:text-white group-hover:shadow-md"
                                                    >
                                                        <WhatsAppIcon size={20} />
                                                    </button>
                                                </div>

                                                {showAd && (
                                                    <div className="mx-4 my-8">
                                                        <div 
                                                            className={`relative ${ad.bgColor} rounded-[3rem] p-8 overflow-hidden group/ad cursor-pointer`}
                                                            onClick={() => {
                                                                if (ad.link) {
                                                                    trackAd(ad.id, 'click', 'INTERSTITIAL');
                                                                    window.open(ad.link, ad.link.startsWith('http') ? '_blank' : '_self');
                                                                }
                                                            }}
                                                        >
                                                            <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                                                                <div className="flex-1 space-y-2 text-center md:text-left">
                                                                    <span className="text-[9px] font-black text-white/50 uppercase tracking-widest">Publicidade</span>
                                                                    <h4 className="text-2xl font-black text-white font-serif italic tracking-tight leading-none">
                                                                        {ad.title}
                                                                    </h4>
                                                                    <p className="text-white/70 text-xs font-medium leading-relaxed">
                                                                        {ad.description}
                                                                    </p>
                                                                    <div className="pt-2">
                                                                        <button className="bg-white text-gray-900 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-transform">
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
                                </div>
                            </section>
                        )}

                    </main>
                </div>

                {/* ============ LADO DIREITO: MAPA LEAFLET REAL ============ */}
                <div className={`flex-1 relative overflow-hidden ${viewMode === 'list' ? 'hidden lg:block' : 'block h-screen lg:h-auto'}`}>

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
                                {allResults.slice(0, 3).map((item: any, i) => (
                                    <div key={i} className="inline-block h-8 w-8 rounded-full ring-4 ring-white shadow-sm overflow-hidden bg-gray-100 flex-shrink-0">
                                        <img src={item.logotipo_url || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=50"} alt="" className="w-full h-full object-cover" />
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
                                        <img
                                            src={selectedMapItem.galeria?.[0]?.url || selectedMapItem.logotipo_url || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400"}
                                            className="w-full h-full object-cover group-hover/modal:scale-110 transition-transform duration-700"
                                            alt={selectedMapItem.nome_fantasia}
                                        />
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
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleWhatsApp(selectedMapItem.id, selectedMapItem.contatos?.[0]?.celular || ''); }}
                                            className="w-12 h-12 flex-shrink-0 bg-green-500 text-white rounded-full flex items-center justify-center shadow-md border-b-4 border-green-700 active:border-b-0 active:translate-y-1 transition-all"
                                        >
                                            <MessageCircle size={16} fill="currentColor" />
                                        </button>
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

            {/* 🏙️ MODAL SELETOR DE CIDADE */}
            <AnimatePresence>
                {isCityModalOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsCityModalOpen(false)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl overflow-hidden gummy-card"
                        >
                            <div className="p-10 space-y-8">
                                <div className="flex justify-between items-center">
                                    <div className="space-y-1">
                                        <h3 className="text-3xl font-black text-gray-900 font-serif italic tracking-tighter">Mudar Região</h3>
                                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Encontre serviços em outras cidades</p>
                                    </div>
                                    <button onClick={() => setIsCityModalOpen(false)} className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 active:scale-75 transition-all">
                                        <X size={24} />
                                    </button>
                                </div>

                                <div className="relative">
                                    <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-red" size={20} />
                                    <input
                                        type="text"
                                        value={citySearchQuery}
                                        onChange={(e) => setCitySearchQuery(e.target.value)}
                                        placeholder="Digite o nome da cidade..."
                                        className="w-full bg-gray-50 border-2 border-transparent focus:border-brand-red/20 focus:bg-white rounded-3xl py-5 pl-14 pr-6 font-bold text-gray-900 transition-all outline-none shadow-inner"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest px-2">Sugestões próximos de você</p>
                                    <div className="grid grid-cols-1 gap-2">
                                        {filteredCities.map((city: any) => (
                                            <button
                                                key={city.id}
                                                onClick={() => {
                                                    setCity(city.id, city.nome);
                                                    setIsCityModalOpen(false);
                                                }}
                                                className={`flex items-center justify-between p-5 rounded-3xl border-2 transition-all ${cityName === city.nome ? 'bg-brand-red/5 border-brand-red' : 'bg-white border-gray-50 hover:bg-gray-50'}`}
                                            >
                                                <div className="flex items-center space-x-4">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cityName === city.nome ? 'bg-brand-red text-white' : 'bg-gray-100 text-gray-400'}`}>
                                                        <MapPin size={20} />
                                                    </div>
                                                    <span className={`font-black tracking-tight ${cityName === city.nome ? 'text-brand-red' : 'text-gray-900'}`}>{city.nome}</span>
                                                </div>
                                                {cityName === city.nome && <CheckCircle2 size={20} className="text-brand-red" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 p-6 text-center">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest opacity-50">O Vermelhinho • Geo Intelligence v2.0</p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style jsx global>{`
        .gummy-card { transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .gummy-card:active { transform: scale(0.97); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
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
