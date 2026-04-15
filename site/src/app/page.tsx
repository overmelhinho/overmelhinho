'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, Sparkles, Menu, Search, User, Home as HomeIcon, Briefcase, Heart, MessageCircle, ArrowRight } from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useAds } from '@/hooks/useAds';
import { useLocation } from '@/contexts/LocationContext';
import Logo from '@/components/Logo';
import { SearchAutocomplete } from '@/components/SearchAutocomplete';

function WhatsAppIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

export default function Home() {
  const router = useRouter();
  const { trackSearch, trackAdInteraction } = useAnalytics();
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [trackedHomeAd, setTrackedHomeAd] = useState(false);
  const scrollyRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const { cityId } = useLocation();
  const { data: homeAds } = useAds({ city_id: cityId, tipo: 'BANNER' });

  // Animação de escrita do título
  const [textIndex, setTextIndex] = useState(0);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [currentPhrase, setCurrentPhrase] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const phrases = ['da sua cidade', 'do seu bairro', 'da sua rua'];
  const typingSpeed = isDeleting ? 50 : 150;

  useEffect(() => {
    const timer = setTimeout(() => {
      const fullText = phrases[phraseIndex];

      if (!isDeleting) {
        setCurrentPhrase(fullText.substring(0, currentPhrase.length + 1));
        if (currentPhrase === fullText) {
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        setCurrentPhrase(fullText.substring(0, currentPhrase.length - 1));
        if (currentPhrase === '') {
          setIsDeleting(false);
          setPhraseIndex((phraseIndex + 1) % phrases.length);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [currentPhrase, isDeleting, phraseIndex]);

  // Lógica de Scrollytelling
  useEffect(() => {
    const handleScroll = () => {
      if (!scrollyRef.current) return;
      const rect = scrollyRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const start = rect.top;
      const progress = Math.max(0, Math.min(1, (viewportHeight - start) / (viewportHeight + rect.height)));
      setScrollProgress(progress * 2);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollyAd = useMemo(() => {
    if (!homeAds || homeAds.length === 0) return null;
    const ad = homeAds[0];
    const midia = ad.midias['BANNER'] || Object.values(ad.midias)[0];
    
    return {
      ...ad,
      imageUrl: (typeof window !== 'undefined' && window.innerWidth < 768) 
          ? (midia.mobile?.url || midia.desktop?.url) 
          : (midia.desktop?.url || midia.mobile?.url)
    };
  }, [homeAds]);

  const categories = [
    { id: 2, name: 'Saúde', icon: '🩺', color: 'bg-[#E6F9F4]', desc: 'Bem-estar' },
    { id: 3, name: 'Serviços', icon: '🛠️', color: 'bg-[#E6F0FF]', desc: 'Soluções' },
    { id: 1, name: 'Gastronomia', icon: '🍕', color: 'bg-[#FFF4E6]', desc: 'Sabor da região' },
    { id: 4, name: 'Vagas', icon: '💼', color: 'bg-[#F3E8FF]', desc: 'Carreira' },
  ];

  const featured = [
    {
      name: "Giardino Restaurante",
      category: "Gastronomia",
      rating: 4.9,
      img: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80",
      location: "Centro, Farroupilha - RS",
      whatsapp: "5554999999001",
      desc: "Culinária italiana autêntica no coração da Serra Gaúcha."
    },
    {
      name: "Clínica Serra Saúde",
      category: "Saúde",
      rating: 4.8,
      img: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&auto=format&fit=crop&q=80",
      location: "Bairro Centro, Garibaldi - RS",
      whatsapp: "5554999999002",
      desc: "Atendimento médico completo com especialistas da região."
    },
    {
      name: "Serra Fit Academia",
      category: "Fitness",
      rating: 5.0,
      img: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80",
      location: "Av. Principal, Bento Gonçalves - RS",
      whatsapp: "5554999999003",
      desc: "Musculação, cardio e aulas coletivas 6 dias por semana."
    },
  ];

  const handleQuickSearch = (term: string) => {
    trackSearch(term);
    router.push(`/busca?q=${encodeURIComponent(term)}`);
  };

    // Tracking de Impressão do Banner Home
    useEffect(() => {
        if (scrollyAd && !trackedHomeAd) {
            trackAdInteraction(scrollyAd.id, 'view', 'HOME_TOP', scrollyAd.cliente.id);
            setTrackedHomeAd(true);
        }
    }, [scrollyAd, trackedHomeAd]);

    return (
        <div className="min-h-screen bg-cloud-dancer pb-0 font-sans">
            <main className="px-4 pt-10 pb-0 max-w-6xl mx-auto space-y-20 md:px-6">
                {/* 2. HERO & VUI (Busca Conversacional) */}
                <section className="text-center space-y-10 py-6">
                    <div className="space-y-4">
                        <h1 className="text-5xl md:text-8xl text-gray-900 tracking-tighter leading-none italic font-serif">
                            <span className="font-normal">Encontre o melhor</span><br />
                            <span className="text-brand-red font-black relative inline-block min-h-[1em]">
                                {currentPhrase || '\u200B'}
                                <span className="absolute -right-2 top-0 bottom-0 w-2 bg-brand-red animate-pulse"></span>
                            </span>
                        </h1>
                        <p className="text-gray-500 font-medium text-sm md:text-lg max-w-2xl mx-auto leading-relaxed font-sans">Milhares de empresas, serviços e profissionais perto de você em um só clique.</p>
                    </div>

                    <SearchAutocomplete />

                </section>

                {/* 3. BENTO GRID CATEGORIAS */}
                <section className="space-y-8">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tighter font-serif">Explore Categorias</h2>
                        <div className="w-12 h-1 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-red w-1/3"></div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        {categories.map((cat) => (
                            <div
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id === activeCategory ? null : cat.id)}
                                className={`gummy-card p-6 md:p-8 rounded-[3rem] md:rounded-[4rem] flex flex-col justify-between cursor-pointer relative overflow-hidden transition-all duration-700 border-4 border-white ${cat.color} ${activeCategory === cat.id ? 'h-64 md:h-[18rem]' : 'h-40 md:h-56'
                                    }`}
                            >
                                <div className={`bg-white/80 w-12 h-12 md:w-16 md:h-16 rounded-[1.4rem] md:rounded-[1.8rem] flex items-center justify-center text-2xl md:text-4xl shadow-xl transition-all duration-500 ${activeCategory === cat.id ? 'scale-110 md:scale-125 rotate-12' : ''}`}>
                                    {cat.icon}
                                </div>
                                <div className="relative z-10 transition-all duration-500">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-1 font-sans">{cat.desc}</p>
                                    <h3 className="font-black text-lg md:text-2xl text-gray-900 tracking-tighter font-serif leading-tight">{cat.name}</h3>
                                    {activeCategory === cat.id && (
                                        <div
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (cat.name === 'Vagas') {
                                                    router.push('/vagas');
                                                } else {
                                                    handleQuickSearch(cat.name);
                                                }
                                            }}
                                            className="mt-4 flex items-center space-x-2 text-brand-red font-black text-sm uppercase animate-in fade-in slide-in-from-left-2 transition-all font-sans cursor-pointer"
                                        >
                                            <span>Descobrir</span>
                                            <ArrowRight size={16} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 5. MATCH PERFEITO */}
                <section className="space-y-10 pb-0 pt-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div className="space-y-3">
                            <h2 className="text-3xl font-black text-gray-900 md:text-5xl tracking-tighter leading-none font-serif">O Match Perfeito</h2>
                            <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] max-w-md font-sans">
                                Nossa IA cruzou seu histórico com a proximidade para selecionar estas jóias.
                            </p>
                        </div>
                        <button className="bg-white text-brand-red px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest border-4 border-white shadow-xl hover:shadow-brand-red/10 transition-all active:scale-95 font-sans cursor-pointer">
                            Ver Favoritos
                        </button>
                    </div>

                    <div className="flex space-x-6 overflow-x-auto pb-4 pt-4 no-scrollbar snap-x snap-mandatory md:grid md:grid-cols-3 md:space-x-0 md:gap-10">
                        {featured.map((item, idx) => (
                            <div key={idx} className="snap-center min-w-[92%] md:min-w-0 bg-white rounded-[4rem] overflow-hidden shadow-[0_40px_100px_-30px_rgba(0,0,0,0.15)] border-4 border-white flex flex-col gummy-card group">
                                <div className="relative h-72 overflow-hidden">
                                    <img src={item.img} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                                    <div className="absolute top-8 right-8 bg-white/95 backdrop-blur-md px-5 py-3 rounded-full flex items-center space-x-2 shadow-2xl">
                                        <span className="text-yellow-500 text-xl font-black">★</span>
                                        <span className="text-lg font-black text-gray-900">{item.rating}</span>
                                    </div>
                                    <div className="absolute bottom-8 left-8 bg-black/60 backdrop-blur-md text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20 font-sans">
                                        Destaque Portal
                                    </div>
                                </div>
                                <div className="p-8 flex-1 flex flex-col justify-between space-y-6">
                                    <div className="space-y-2">
                                        <span className="text-[11px] font-black text-brand-red uppercase tracking-[0.4em] font-sans">{item.category}</span>
                                        <h4 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tighter leading-none font-serif">{item.name}</h4>
                                        <p className="text-gray-400 font-bold tracking-tight font-sans">{item.location}</p>
                                        <p className="text-gray-400 font-medium text-sm mt-2">{item.desc}</p>
                                    </div>

                                    <a
                                        href={`https://wa.me/${item.whatsapp}?text=Olá! Vi sua empresa no portal O Vermelhinho e gostaria de saber mais.`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full bg-[#25D366] text-white py-4 md:py-5 rounded-2xl md:rounded-[2rem] font-black text-sm md:text-base active:scale-95 transition-all shadow-[0_20px_40px_-5px_rgba(37,211,102,0.4)] flex items-center justify-center space-x-3 border-b-4 border-[#128C7E]/40 hover:brightness-105 active:border-b-0 active:translate-y-1 font-sans"
                                    >
                                        <WhatsAppIcon size={20} />
                                        <span>Contato pelo WhatsApp</span>
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 4. COMO FUNCIONA — 3 passos */}
                <section className="space-y-8 !mt-0">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tighter font-serif">Como Funciona</h2>
                        <button onClick={() => router.push('/como-funciona')} className="text-[10px] font-black text-brand-red uppercase tracking-widest hover:underline">Ver mais →</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { step: '01', icon: '🔍', title: 'Busque', desc: 'Digite o que precisa ou fale pelo microfone. Nossa IA entende sua intenção.' },
                            { step: '02', icon: '📍', title: 'Encontre', desc: 'Veja empresas e serviços próximos a você, ordenados por relevância e avaliação.' },
                            { step: '03', icon: '💬', title: 'Conecte', desc: 'Entre em contato pelo WhatsApp. Simples e rápido.' },
                        ].map((s) => (
                            <div key={s.step} className="bg-white rounded-2xl md:rounded-[2.5rem] p-5 md:p-7 border border-gray-50 shadow-sm space-y-2 md:space-y-3 hover:shadow-lg hover:scale-[1.02] transition-all">
                                <div className="flex items-center justify-between">
                                    <div className="text-3xl md:text-4xl">{s.icon}</div>
                                    <span className="text-[10px] font-black text-gray-200 tracking-[0.3em]">{s.step}</span>
                                </div>
                                <h3 className="text-base md:text-lg font-black text-gray-900 tracking-tight font-serif">{s.title}</h3>
                                <p className="text-gray-400 font-medium text-xs md:text-sm leading-relaxed">{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 5. SCROLLYTELLING ADS */}
                <section ref={scrollyRef} className="h-[120vh] relative pt-10 px-2 sm:px-0">
                    <div className="sticky top-20 h-[70vh] w-full bg-black rounded-[5rem] overflow-hidden shadow-3xl group">
                        <div
                            className="absolute inset-0 transition-all duration-200"
                            style={{
                                transform: `scale(${1 + scrollProgress})`,
                                opacity: Math.min(1, scrollProgress + 0.3)
                            }}
                        >
                            <img
                                src={scrollyAd?.imageUrl || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1600&auto=format&fit=crop&q=80"}
                                className="w-full h-full object-cover filter brightness-[0.4] contrast-[1.2]"
                                alt="Destaque Patrocinado"
                            />
                        </div>

                        <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center text-white space-y-6">
                            <div className="bg-brand-red/90 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.4em] shadow-xl font-sans">
                                {scrollyAd ? 'Destaque Patrocinado' : 'Espaço Publicitário'}
                            </div>
                            <h3 className="text-4xl md:text-6xl font-black tracking-tighter leading-none max-w-4xl mx-auto font-serif italic">
                                {scrollyAd ? scrollyAd.nome : <>Sua empresa aqui,<br />onde todos<br />estão olhando.</>}
                            </h3>
                            <p className="text-xl font-bold opacity-60 font-sans">
                                {scrollyAd ? `Oferecido por ${scrollyAd.cliente.nome}` : 'Destaque Premium no Portal O Vermelhinho'}
                            </p>
                            <button
                                onClick={() => {
                                    if (scrollyAd) {
                                        trackAdInteraction(scrollyAd.id, 'click', 'HOME_TOP', scrollyAd.cliente_id);
                                        if (scrollyAd.cliente.whatsapp) window.open(`https://wa.me/55${scrollyAd.cliente.whatsapp.replace(/\D/g, '')}`, '_blank');
                                        else router.push(`/cliente/${scrollyAd.cliente.slug}`);
                                    } else {
                                        router.push('/anuncie');
                                    }
                                }}
                                className="mt-10 bg-white text-black px-12 py-6 rounded-[2.5rem] font-black text-xl active:scale-90 transition-transform shadow-2xl hover:bg-brand-red hover:text-white font-sans cursor-pointer"
                            >
                                {scrollyAd ? 'Aproveitar Agora' : 'Quero Anunciar'}
                            </button>
                        </div>

                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-60"></div>
                    </div>
                </section>

            </main>
        </div>
    );
}
