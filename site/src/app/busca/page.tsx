'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
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
    Menu,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useInfiniteQuery } from '@tanstack/react-query';
import api from '@/services/api';
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
    const router = useRouter();
    const searchParams = useSearchParams();
    const [query, setQuery] = useState('');
    const observerTarget = useRef(null);

    useEffect(() => {
        let q = searchParams.get('q');
        if (!q && typeof window !== 'undefined') {
            const raw = window.location.search;
            if (raw.includes('q-')) q = raw.split('q-')[1]?.split('&')[0];
        }
        setQuery(q || '');
    }, [searchParams]);

    const { trackSearch, trackInteraction } = useAnalytics();

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
    } = useInfiniteQuery({
        queryKey: ['search', query],
        queryFn: async ({ pageParam = 1 }) => {
            const res = await api.get(`/public/search?q=${encodeURIComponent(query)}&page=${pageParam}&per_page=10`);
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
        return data?.pages.flatMap(page => page.data) || [];
    }, [data]);

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
        if (query && data) trackSearch(query, 'Geral', allResults.length);
    }, [query, data, allResults.length]);

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

    return (
        <div className="min-h-screen bg-cloud-dancer font-sans selection:bg-brand-red/10 overflow-x-hidden">

            <div className="lg:flex lg:h-screen lg:overflow-hidden">

                {/* ============ LADO ESQUERDO: LISTA ============ */}
                <div className="flex-1 lg:w-[520px] lg:flex-shrink-0 lg:overflow-y-auto no-scrollbar lg:border-r border-gray-100">

                    <header className="sticky top-0 z-50 bg-cloud-dancer/90 backdrop-blur-2xl border-b border-gray-100 p-4 space-y-4 shadow-sm">
                        <div className="flex items-center space-x-3">
                            <button onClick={() => router.push('/')} className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100 active:scale-90 transition-all cursor-pointer text-gray-400 hover:text-brand-red">
                                <ArrowLeft size={20} />
                            </button>
                            <div className="flex-1 relative group">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                    <SearchIcon size={18} className="text-brand-red" />
                                </div>
                                <input
                                    type="text"
                                    key={query}
                                    defaultValue={query}
                                    placeholder="O que você procura?"
                                    onKeyDown={handleNewSearch}
                                    className="w-full bg-white rounded-full py-4 pl-12 pr-4 shadow-sm border border-gray-100 focus:ring-4 focus:ring-brand-red/5 focus:border-brand-red transition-all font-bold text-gray-900 text-sm outline-none"
                                />
                            </div>
                        </div>
                        <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-1">
                            {['Aberto Agora', 'Entrega Grátis', 'Com IA', 'Melhores Notas'].map((filter) => (
                                <button key={filter} className="whitespace-nowrap px-5 py-2.5 bg-white/70 backdrop-blur-md border border-gray-100 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-400 active:scale-95 hover:bg-white hover:text-brand-red transition-all shadow-sm cursor-pointer">
                                    {filter}
                                </button>
                            ))}
                        </div>
                    </header>

                    <main className="px-5 py-6 space-y-12 pb-40">

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
                                    className="relative bg-white rounded-[3.5rem] p-8 shadow-2xl border-4 border-white gummy-card overflow-hidden"
                                >
                                    <div className="flex justify-between items-start mb-10">
                                        <div className="bg-brand-red/5 px-5 py-2 rounded-full flex items-center space-x-2 border border-brand-red/10 shadow-sm">
                                            <Sparkles size={16} className="text-brand-red animate-pulse" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-red">Sugestão Inteligente</span>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest leading-none">Afinidade</p>
                                            <p className="text-3xl font-black text-brand-red font-serif italic tracking-tighter">98%</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-8 mb-10 cursor-pointer group/item" onClick={() => router.push(`/cliente/${matchPerfeito.id}`)}>
                                        <div className="w-24 h-24 rounded-[2.5rem] bg-gray-50 flex-shrink-0 overflow-hidden shadow-2xl border-4 border-white group-hover/item:scale-105 transition-transform duration-500">
                                            <img src={matchPerfeito.logotipo_url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200"} alt="" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="space-y-2">
                                            <h2 className="text-3xl font-black text-gray-900 tracking-tighter font-serif italic leading-none">{matchPerfeito.nome_fantasia}</h2>
                                            <div className="flex items-center text-xs font-bold text-gray-400 space-x-3">
                                                <MapPin size={12} className="text-brand-red" />
                                                <span className="truncate max-w-[140px]">{matchPerfeito.enderecos?.[0]?.bairro || 'Centro'}</span>
                                                <span className="w-1.5 h-1.5 bg-gray-100 rounded-full"></span>
                                                <span className="flex items-center text-yellow-500 font-black whitespace-nowrap"><Star size={12} className="mr-1 fill-yellow-500" /> 4.9</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleWhatsApp(matchPerfeito.id, matchPerfeito.contatos?.[0]?.celular || '')}
                                        className="w-full bg-brand-red text-white py-6 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.2em] shadow-[0_20px_60px_-15px_rgba(183,15,10,0.4)] hover:shadow-brand-red/60 active:scale-[0.97] transition-all flex items-center justify-center space-x-3 group/btn cursor-pointer"
                                    >
                                        <MessageCircle fill="currentColor" size={20} />
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
                                            onClick={() => router.push(`/cliente/${item.id}`)}
                                            onMouseEnter={() => setHoveredResult(item.id)}
                                            onMouseLeave={() => setHoveredResult(null)}
                                            className="bg-white rounded-[3.5rem] shadow-xl border border-white gummy-card group overflow-hidden cursor-pointer"
                                        >
                                            <div className="h-52 overflow-hidden relative">
                                                <img src={item.galeria?.[0]?.url || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600"} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt="" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                                            </div>
                                            <div className="px-8 pb-10 pt-1 relative">
                                                <div className="absolute -top-12 left-8 w-24 h-24 rounded-[2.5rem] bg-white p-1 shadow-2xl border-4 border-white group-hover:-translate-y-4 transition-transform duration-500">
                                                    <img src={item.logotipo_url || "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=200"} className="w-full h-full object-cover rounded-[2rem]" alt="" />
                                                </div>
                                                <div className="pt-16 space-y-4">
                                                    <div className="flex justify-between items-center">
                                                        <h4 className="text-2xl font-black text-gray-900 tracking-tight font-serif italic leading-none truncate max-w-[200px]">{item.nome_fantasia}</h4>
                                                        <span className="text-xs font-black text-brand-red bg-brand-red/5 px-3 py-1.5 rounded-xl border border-brand-red/10">PREMIUM</span>
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

                        {/* AD BANNER */}
                        <section className="relative px-2">
                            <div className="bg-brand-red rounded-[4rem] p-12 text-white shadow-[0_45px_100px_-20px_rgba(183,15,10,0.35)] relative overflow-hidden group cursor-pointer active:scale-95 transition-all">
                                <div className="relative z-10 space-y-8">
                                    <h3 className="text-4xl md:text-5xl font-black tracking-tighter leading-none font-serif italic">Seja o próximo<br />Match Perfeito.</h3>
                                    <p className="text-red-100 text-[10px] font-black uppercase tracking-[0.4em] opacity-80">Conecte sua empresa a novos clientes</p>
                                    <button className="bg-white text-brand-red px-12 py-5 rounded-[1.8rem] font-black text-xs uppercase tracking-widest shadow-2xl group-hover:scale-105 transition-transform duration-300">Quero Posicionar</button>
                                </div>
                                <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-white/10 rounded-full blur-[120px] group-hover:bg-white/20 transition-all duration-1000" />
                                <Sparkles className="absolute top-10 right-10 rotate-12 opacity-10 group-hover:rotate-0 transition-transform duration-700" size={200} />
                            </div>
                        </section>

                        {/* 4. TODOS OS RESULTADOS + SCROLL INFINITO */}
                        {!isLoading && outrosResultados.length > 0 && (
                            <section className="space-y-8">
                                <h3 className="text-xl font-black text-gray-900 tracking-tight font-serif px-2">Todos os Resultados</h3>
                                <div className="bg-white rounded-[4rem] shadow-2xl border border-white overflow-hidden p-2">
                                    {outrosResultados.map((item: any, idx: number) => (
                                        <div
                                            key={item.id}
                                            onClick={() => router.push(`/cliente/${item.id}`)}
                                            onMouseEnter={() => setHoveredResult(item.id)}
                                            onMouseLeave={() => setHoveredResult(null)}
                                            className={`flex items-center justify-between p-7 hover:bg-gray-50/80 transition-all group cursor-pointer ${idx !== outrosResultados.length - 1 ? 'border-b border-gray-50' : ''}`}
                                        >
                                            <div className="flex items-center space-x-6">
                                                <div className="w-16 h-16 rounded-[1.8rem] bg-gray-50 overflow-hidden shadow-inner flex-shrink-0 group-hover:scale-110 transition-transform duration-500">
                                                    <img src={item.logotipo_url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100"} className="w-full h-full object-cover" alt="" />
                                                </div>
                                                <div className="space-y-1">
                                                    <h5 className="font-black text-gray-900 font-serif italic tracking-tight text-xl leading-none">{item.nome_fantasia}</h5>
                                                    <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">{item.segmentos?.[0]?.nome || 'Negócio Parceiro'}</p>
                                                </div>
                                            </div>
                                            <button className="w-14 h-14 rounded-[1.8rem] bg-white shadow-sm border border-gray-100 text-brand-red flex items-center justify-center active:scale-90 transition-all hover:bg-brand-red hover:text-white group-hover:shadow-md">
                                                <Phone size={20} fill="currentColor" className="opacity-20 group-hover:opacity-100 transition-opacity" />
                                            </button>
                                        </div>
                                    ))}

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
                <div className="hidden lg:block lg:flex-1 relative overflow-hidden">

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

                    {/* =========== AIRBNB-STYLE MODAL CARD =========== */}
                    {selectedMapItem && (
                        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[1000] w-[90%] max-w-sm animate-in slide-in-from-bottom-5 fade-in duration-300 pointer-events-auto">
                            <div className="bg-white/80 backdrop-blur-3xl p-3 border border-white/50 rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] gummy-card">
                                <div className="relative group/modal cursor-pointer" onClick={() => router.push(`/cliente/${selectedMapItem.id}`)}>
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
            <nav className="fixed bottom-0 left-0 right-0 z-[100] p-6 lg:hidden">
                <div className="bg-white/80 backdrop-blur-3xl border border-white/20 rounded-[3rem] p-4 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.2)] flex items-center justify-around">
                    {[
                        { icon: <Home size={22} />, active: false, path: '/' },
                        { icon: <SearchIcon size={22} />, active: true, path: '/busca' },
                        { icon: <Briefcase size={22} />, active: false, path: '#' },
                        { icon: <Heart size={22} />, active: false, path: '#' },
                        { icon: <Menu size={22} />, active: false, path: '#' },
                    ].map((item, idx) => (
                        <button key={idx} onClick={() => item.path !== '#' && router.push(item.path)} className={`p-4 transition-all active:scale-75 ${item.active ? 'text-brand-red bg-brand-red/5 rounded-[1.5rem]' : 'text-gray-300'}`}>
                            {item.icon}
                        </button>
                    ))}
                </div>
            </nav>

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
