'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, Sparkles, Menu, Search, User, Home as HomeIcon, Briefcase, Heart, MessageCircle, ArrowRight } from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { SearchAutocomplete } from '@/components/SearchAutocomplete';

export default function Home() {
  const router = useRouter();
  const { trackSearch } = useAnalytics();
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const scrollyRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Animação de escrita do título
  const [textIndex, setTextIndex] = useState(0);
  const [currentPhrase, setCurrentPhrase] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const phrases = ['sua região', 'sua cidade', 'seu bairro', 'sua rua'];
  const typingSpeed = isDeleting ? 50 : 150;

  useEffect(() => {
    const timer = setTimeout(() => {
      const fullText = phrases[textIndex];

      if (!isDeleting) {
        setCurrentPhrase(fullText.substring(0, currentPhrase.length + 1));
        if (currentPhrase === fullText) {
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        setCurrentPhrase(fullText.substring(0, currentPhrase.length - 1));
        if (currentPhrase === '') {
          setIsDeleting(false);
          setTextIndex((textIndex + 1) % phrases.length);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [currentPhrase, isDeleting, textIndex]);

  // Categorias
  const categories = [
    { id: 1, name: 'Gastronomia', icon: '🍕', color: 'bg-[#FFF4E6]', desc: 'Sabor da região' },
    { id: 2, name: 'Saúde', icon: '🩺', color: 'bg-[#E6F9F4]', desc: 'Bem-estar' },
    { id: 3, name: 'Serviços', icon: '🛠️', color: 'bg-[#E6F0FF]', desc: 'Soluções' },
    { id: 4, name: 'Vagas', icon: '💼', color: 'bg-[#F3E8FF]', desc: 'Carreira' },
  ];

  const featured = [
    { name: "Bistrô do Vale", category: "Restaurante", rating: 4.9, img: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80", location: "Centro, Petrolina" },
    { name: "Odonto Clean", category: "Saúde", rating: 4.8, img: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&auto=format&fit=crop&q=80", location: "Vila Eduardo, Petrolina" },
    { name: "Guerreiros Gym", category: "Fitness", rating: 5.0, img: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80", location: "Areia Branca, Petrolina" },
  ];

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

  const handleQuickSearch = (term: string) => {
    trackSearch(term);
    router.push(`/busca?q=${encodeURIComponent(term)}`);
  };

  return (
    <div className="min-h-screen bg-cloud-dancer pb-32 font-sans">
      <main className="px-4 py-10 max-w-6xl mx-auto space-y-20 md:px-6">
        {/* 2. HERO & VUI (Busca Conversacional) */}
        <section className="text-center space-y-10 py-6">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-8xl font-black text-gray-900 tracking-tighter leading-none italic font-serif">
              Encontre o melhor da<br />
              <span className="text-brand-red relative">
                {currentPhrase}
                <span className="absolute -right-2 top-0 bottom-0 w-2 bg-brand-red animate-pulse"></span>
              </span>
            </h1>
            <p className="text-gray-400 font-bold text-[10px] md:text-sm uppercase tracking-[0.4em] max-w-md mx-auto leading-relaxed">Milhares de empresas, serviços e profissionais perto de você em um só clique.</p>
          </div>

          <SearchAutocomplete />

          {/* Shortcut Tags */}
          <div className="flex space-x-3 overflow-x-auto pb-4 pt-2 no-scrollbar mask-fade-right justify-center">
            {['Pizzaria', 'Pet Shop', 'Manutenção', 'Academia', 'Vagas'].map((tag) => (
              <button
                key={tag}
                onClick={() => handleQuickSearch(tag)}
                className="whitespace-nowrap bg-white border border-gray-100 px-8 py-4 rounded-full text-[11px] font-black text-gray-500 shadow-sm active:scale-95 transition-all hover:text-brand-red hover:border-brand-red/20 uppercase tracking-[0.2em] font-sans cursor-pointer"
              >
                {tag}
              </button>
            ))}
          </div>
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
                className={`gummy-card p-8 rounded-[4rem] flex flex-col justify-between cursor-pointer relative overflow-hidden transition-all duration-700 border-4 border-white ${cat.color} ${activeCategory === cat.id ? 'h-[18rem] col-span-2' : 'h-56'
                  } ${cat.id === 1 && !activeCategory ? 'col-span-2' : ''}`}
              >
                <div className={`bg-white/80 w-16 h-16 rounded-[1.8rem] flex items-center justify-center text-4xl shadow-xl transition-all duration-500 ${activeCategory === cat.id ? 'scale-125 rotate-12' : ''}`}>
                  {cat.icon}
                </div>
                <div className="relative z-10 transition-all duration-500">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-1 font-sans">{cat.desc}</p>
                  <h3 className="font-black text-2xl text-gray-900 tracking-tighter font-serif leading-none">{cat.name}</h3>
                  {activeCategory === cat.id && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickSearch(cat.name);
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

        {/* 4. SCROLLYTELLING ADS */}
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
                src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1600&auto=format&fit=crop&q=80"
                className="w-full h-full object-cover filter brightness-[0.4] contrast-[1.2]"
                alt="Patrocinador Master"
              />
            </div>

            <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center text-white space-y-6">
              <div className="bg-brand-red/90 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.4em] shadow-xl font-sans">
                AD Premium
              </div>
              <h3 className="text-4xl md:text-6xl font-black tracking-tighter leading-none max-w-4xl mx-auto font-serif italic">
                A melhor pizza <br />da cidade agora <br />no seu portal.
              </h3>
              <p className="text-xl font-bold opacity-60 font-sans">Pizzaria Napolitana • Entrega Grátis hoje</p>
              <button className="mt-10 bg-white text-black px-12 py-6 rounded-[2.5rem] font-black text-xl active:scale-90 transition-transform shadow-2xl hover:bg-brand-red hover:text-white font-sans cursor-pointer">
                Pedir Agora
              </button>
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-60"></div>
          </div>
        </section>

        {/* 5. MATCH PERFEITO */}
        <section className="space-y-10 pt-10">
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

          <div className="flex space-x-6 overflow-x-auto pb-16 pt-4 no-scrollbar snap-x snap-mandatory md:grid md:grid-cols-3 md:space-x-0 md:gap-10">
            {featured.map((item, idx) => (
              <div key={idx} className="snap-center min-w-[92%] md:min-w-0 bg-white rounded-[4.5rem] overflow-hidden shadow-[0_40px_100px_-30px_rgba(0,0,0,0.15)] border-4 border-white flex flex-col gummy-card group">
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
                <div className="p-10 flex-1 flex flex-col justify-between space-y-10">
                  <div className="space-y-2">
                    <span className="text-[11px] font-black text-brand-red uppercase tracking-[0.4em] font-sans">{item.category}</span>
                    <h4 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tighter leading-none font-serif">{item.name}</h4>
                    <p className="text-gray-400 font-bold tracking-tight font-sans">{item.location}</p>
                  </div>

                  <button className="w-full bg-[#25D366] text-white py-7 rounded-[2.5rem] font-black text-xl active:scale-95 transition-all shadow-[0_20px_40px_-5px_rgba(37,211,102,0.4)] flex items-center justify-center space-x-4 border-b-8 border-[#128C7E]/40 hover:brightness-105 active:border-b-0 active:translate-y-2 font-sans cursor-pointer">
                    <MessageCircle fill="currentColor" size={28} />
                    <span>WhatsApp</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 6. CTA BANNER FINAL */}
        <section className="mt-10 mb-20 px-2 font-sans">
          <div className="bg-brand-red rounded-[6rem] p-10 md:p-20 text-center space-y-12 shadow-[0_50px_100px_-20px_rgba(192,0,0,0.3)] relative overflow-hidden group border-[15px] border-white/10 ring-1 ring-brand-red/50">
            <div className="relative z-10 space-y-8">
              <h2 className="text-4xl font-black text-white md:text-7xl tracking-tighter leading-[0.9] font-serif uppercase">
                Sua empresa <br />em evidência.
              </h2>
              <p className="text-red-100 font-bold text-lg md:text-2xl max-w-sm mx-auto opacity-70 tracking-tight">
                O único portal que conversa com o cliente.
              </p>
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-8">
                <button className="bg-white text-brand-red px-10 md:px-16 py-5 md:py-8 rounded-[3rem] font-black text-xl md:text-3xl shadow-3xl active:scale-95 transition-all hover:bg-red-50 hover:scale-105 font-sans cursor-pointer">
                  Anunciar
                </button>
                <button className="bg-black/20 text-white px-8 md:px-12 py-5 md:py-7 rounded-[2.5rem] font-black text-xs md:text-sm active:scale-95 border border-white/10 backdrop-blur-md uppercase tracking-[0.2em] font-sans cursor-pointer">
                  Consultoria
                </button>
              </div>
            </div>

            <div className="absolute -top-40 -left-40 w-[40rem] h-[40rem] bg-white opacity-[0.05] rounded-full blur-[120px] group-hover:scale-125 transition-transform duration-1000" />
            <div className="absolute -bottom-40 -right-40 w-[40rem] h-[40rem] bg-black opacity-[0.1] rounded-full blur-[120px]" />
          </div>
        </section>
      </main>

      {/* 7. BOTTOM NAV */}
      <nav className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[60] md:hidden w-[94%] max-w-md">
        <div className="bg-white/70 backdrop-blur-3xl border border-white/30 rounded-[3.5rem] p-3 shadow-[0_40px_100px_-10px_rgba(0,0,0,0.5)] flex items-center justify-around">
          {[
            { icon: <HomeIcon size={28} strokeWidth={2.5} />, label: 'Portal', path: '/', active: true },
            { icon: <Search size={28} strokeWidth={2.5} />, label: 'Busca', path: '/busca' },
            { icon: <Briefcase size={28} strokeWidth={2.5} />, label: 'Vagas', path: '/busca?q=vagas' },
            { icon: <Heart size={28} strokeWidth={2.5} />, label: 'Salvos', path: '#' },
            { icon: <User size={28} strokeWidth={2.5} />, label: 'Conta', path: '#' },
          ].map((item, idx) => (
            <button
              key={idx}
              onClick={() => item.path !== '#' && router.push(item.path)}
              className={`flex flex-col items-center justify-center p-4 transition-all active:scale-50 ${item.active ? 'text-brand-red bg-red-100/50 rounded-[2.5rem] px-8 shadow-inner' : 'text-gray-400'
                } font-sans`}
            >
              {item.icon}
              {item.active && <span className="text-[10px] font-black mt-2 uppercase tracking-tighter">{item.label}</span>}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
