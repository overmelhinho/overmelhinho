import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, Phone, MessageCircle, Star, ExternalLink, ChevronRight } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import DynamicSeoText from '@/components/DynamicSeoText';

const getApiUrl = () => {
    let API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://dash.overmelhinho.com.br/api/v1';
    if (!API_URL.endsWith('/v1')) {
        API_URL += '/v1';
    }
    return API_URL;
};

const slugify = (text: string) => {
    return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-');
};

async function fetchCity(citySlug: string) {
    try {
        const res = await fetch(`${getApiUrl()}/cidades`, { next: { revalidate: 3600 } });
        if (!res.ok) return null;
        const data = await res.json();
        return data.data?.find((c: any) => slugify(c.nome) === citySlug) || null;
    } catch {
        return null;
    }
}

async function fetchSegment(segmentSlug: string) {
    try {
        const res = await fetch(`${getApiUrl()}/segmentos`, { next: { revalidate: 3600 } });
        if (!res.ok) return null;
        const data = await res.json();
        return data.data?.find((s: any) => slugify(s.nome) === segmentSlug) || null;
    } catch {
        return null;
    }
}

async function fetchClients(cityId: number, segmentName: string) {
    try {
        const res = await fetch(`${getApiUrl()}/public/search?q=${encodeURIComponent(segmentName)}&city_id=${cityId}&per_page=100`, {
            next: { revalidate: 3600 }
        });
        if (!res.ok) return [];
        const data = await res.json();
        return data.data || [];
    } catch {
        return [];
    }
}

async function fetchAds(cityId: number, segmentName: string) {
    try {
        const res = await fetch(`${getApiUrl()}/public/ads?city_id=${cityId}&keywords=${encodeURIComponent(segmentName)}&tipo=BANNER`, {
            next: { revalidate: 3600 }
        });
        if (!res.ok) return [];
        const data = await res.json();
        return data.data || [];
    } catch {
        return [];
    }
}

export async function generateMetadata(props: { params: Promise<{ citySlug: string; segmentSlug: string }> }): Promise<Metadata> {
    const params = await props.params;
    const cleanCitySlug = params.citySlug.replace(/-+$/, '');
    const cleanSegmentSlug = params.segmentSlug.replace(/-+$/, '');
    const city = await fetchCity(cleanCitySlug);
    const segment = await fetchSegment(cleanSegmentSlug);

    if (!city || !segment) {
        return {
            title: 'Não Encontrado | O Vermelhinho',
        };
    }

    return {
        title: `${segment.nome} em ${city.nome} - Telefones e Endereços | O Vermelhinho`,
        description: `Encontre as melhores opções de ${segment.nome} em ${city.nome}. Veja avaliações, horários de funcionamento, endereços e chame direto no WhatsApp pelo Guia O Vermelhinho.`,
        openGraph: {
            title: `${segment.nome} em ${city.nome} | O Vermelhinho`,
            description: `Encontre as melhores opções de ${segment.nome} em ${city.nome}. Veja avaliações, horários de funcionamento, endereços e chame direto no WhatsApp pelo Guia O Vermelhinho.`,
            url: `https://overmelhinho.com.br/${params.citySlug}/${params.segmentSlug}`,
            siteName: 'O Vermelhinho',
            locale: 'pt_BR',
            type: 'website',
        },
    };
}

export default async function SegmentCityPage(props: { params: Promise<{ citySlug: string; segmentSlug: string }> }) {
    const params = await props.params;
    const cleanCitySlug = params.citySlug.replace(/-+$/, '');
    const cleanSegmentSlug = params.segmentSlug.replace(/-+$/, '');
    const city = await fetchCity(cleanCitySlug);
    const segment = await fetchSegment(cleanSegmentSlug);

    if (!city || !segment) {
        notFound();
    }

    const clients = await fetchClients(city.id, segment.nome);
    const searchAds = await fetchAds(city.id, segment.nome);

    const pagantes = clients
        .filter((c: any) => c.tipo_cliente === 'pagante' && ['ativa', 'ativo', 'inadimplente'].includes(c.status_assinatura))
        .sort((a: any, b: any) => a.nome_fantasia.localeCompare(b.nome_fantasia, 'pt-BR'));
    const gratuitos = clients.filter((c: any) => !(c.tipo_cliente === 'pagante' && ['ativa', 'ativo', 'inadimplente'].includes(c.status_assinatura)));

    // Extract Hero Ad (topBanner)
    const heroAdData = searchAds?.find((a: any) => Object.keys(a.midias || {}).some(k => ['banner_topo', 'BANNER', 'SEARCH_RESULT', 'IMAGEM'].includes(k.toUpperCase()) || ['banner_topo', 'BANNER', 'SEARCH_RESULT', 'IMAGEM'].includes(k)));
    
    let topBanner = null;
    if (heroAdData) {
        const midia = heroAdData.midias['banner_topo'] || heroAdData.midias['BANNER'] || Object.values(heroAdData.midias)[0] || {};
        topBanner = {
            id: heroAdData.id,
            title: heroAdData.nome,
            image: midia.desktop?.url || midia.mobile?.url,
            link: heroAdData.url || null,
        };
    }

    // Extract List Ad
    let listAd = null;
    const listAdData = searchAds?.find((a: any) => Object.keys(a.midias || {}).some(k => ['banner_segmento', 'SEGMENT_LISTING'].includes(k.toUpperCase()) || ['banner_segmento', 'SEGMENT_LISTING'].includes(k)));
    if (listAdData) {
        const midia = listAdData.midias['banner_segmento'] || listAdData.midias['SEGMENT_LISTING'] || Object.values(listAdData.midias)[0] || {};
        listAd = {
            id: listAdData.id,
            title: listAdData.nome,
            image: midia.desktop?.url || midia.mobile?.url,
            link: listAdData.url || null,
        };
    }

    const schemaData = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": `${segment.nome} em ${city.nome}`,
        "description": `As melhores opções de ${segment.nome} em ${city.nome}`,
        "url": `https://overmelhinho.com.br/${params.citySlug}/${params.segmentSlug}`,
        "itemListElement": clients.slice(0, 10).map((client: any, index: number) => ({
            "@type": "ListItem",
            "position": index + 1,
            "item": {
                "@type": "LocalBusiness",
                "name": client.nome_fantasia,
                "url": `https://overmelhinho.com.br/${params.citySlug}/${params.segmentSlug}/${client.slug || client.id}`,
                "address": {
                    "@type": "PostalAddress",
                    "addressLocality": city.nome,
                    "addressRegion": city.estado || "RS",
                    "streetAddress": client.enderecos?.[0]?.rua || ""
                }
            }
        }))
    };

    return (
        <div className="min-h-screen font-sans bg-gray-50">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
            />
            <main className="pt-24 pb-20">
                {/* Hero Section */}
                <div className="bg-white border-b border-gray-100">
                    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
                        <div className="max-w-3xl">
                            <h1 className="text-4xl md:text-5xl font-black text-gray-900 font-serif tracking-tight leading-tight">
                                Melhores <span className="text-brand-red italic">{segment.nome}</span> em {city.nome}
                            </h1>
                            <p className="mt-4 text-lg text-gray-500">
                                Encontramos {clients.length} {clients.length === 1 ? 'resultado' : 'resultados'} para você na região de {city.nome}.
                            </p>
                        </div>
                    </div>
                </div>

                {/* HERO AD BANNER (PATROCINADO) */}
                {topBanner && topBanner.image && (
                    <section className={`relative group mb-12 ${topBanner.link ? 'cursor-pointer' : 'cursor-default'} lg:max-w-[85%] lg:mx-auto px-6`}>
                        <a href={topBanner.link || '#'} target={topBanner.link && topBanner.link.startsWith('http') ? "_blank" : "_self"} className="block relative h-auto md:h-auto rounded-[2rem] md:rounded-[2.5rem] overflow-hidden bg-gray-50/50 transition-transform duration-700 hover:scale-[1.01]">
                            <img 
                                src={topBanner.image} 
                                className="w-full h-auto max-h-[350px] lg:max-h-[280px] object-contain mx-auto" 
                                alt={topBanner.title} 
                            />
                            {topBanner.link && (
                                <div className="absolute bottom-4 right-4 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-white/30">
                                    <ExternalLink size={14} className="text-white" />
                                </div>
                            )}
                        </a>
                    </section>
                )}

                {/* Clients Grid & List */}
                <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
                    {clients.length === 0 ? (
                        <div className="text-center py-20">
                            <h3 className="text-2xl font-bold text-gray-900">Nenhuma empresa encontrada</h3>
                            <p className="mt-2 text-gray-500">Ainda não temos empresas cadastradas nesta categoria para {city.nome}.</p>
                            <div className="mt-6">
                                <Link href="/anuncie" className="inline-flex px-6 py-3 bg-brand-red text-white font-bold rounded-full hover:bg-red-700 transition">
                                    Seja o primeiro a aparecer!
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-16">
                            
                            {/* BLOCO 1: PAGANTES (CARDS) */}
                            {pagantes.length > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {pagantes.map((client: any) => {
                                        const seoUrl = `/${params.citySlug}/${params.segmentSlug}/${client.slug || client.id}`;

                                        return (
                                            <div key={client.id} className="bg-white rounded-[2rem] md:rounded-[2rem] shadow-xl border border-white group overflow-hidden flex flex-col hover:shadow-2xl transition-all duration-300">
                                                <Link href={seoUrl} className="flex flex-col flex-1 relative">
                                                    <div className="h-48 relative overflow-hidden bg-gray-50">
                                                        {client.banner_url || client.galeria?.[0]?.url ? (
                                                            <img src={client.banner_url || client.galeria[0].url} alt={client.nome_fantasia} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                                        ) : (
                                                            <div className="w-full h-full bg-brand-red/10 flex items-center justify-center">
                                                                <span className="text-4xl text-brand-red/20 font-black uppercase">{client.nome_fantasia.charAt(0)}</span>
                                                            </div>
                                                        )}
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                                                    </div>

                                                    <div className="px-5 pb-6 pt-1 relative flex-1 flex flex-col">
                                                        {client.logotipo_url && (
                                                            <div className="absolute -top-12 left-5 w-24 h-24 rounded-[1.5rem] bg-white p-1 shadow-2xl border-[3px] border-white group-hover:-translate-y-2 transition-transform duration-500 z-10">
                                                                <img src={client.logotipo_url} alt="Logo" className="w-full h-full object-cover rounded-[1.3rem]" />
                                                            </div>
                                                        )}
                                                        <div className="pt-14 space-y-2 flex-1 flex flex-col">
                                                            <h4 className="text-lg font-black text-gray-900 tracking-tight font-serif italic leading-tight line-clamp-2">{client.nome_fantasia}</h4>
                                                            <div className="flex flex-wrap items-center gap-2 mt-auto pt-2">
                                                                <span className="flex items-center text-[9px] font-black text-brand-red bg-red-50/80 px-2.5 py-1 rounded-lg border border-red-100 uppercase tracking-wider shadow-sm">
                                                                    <MapPin size={11} className="mr-1" />
                                                                    {client.enderecos?.[0]?.cidade || city.nome}
                                                                </span>
                                                                {client.enderecos?.[0]?.bairro && client.enderecos[0].bairro.toLowerCase() !== 'vazio' && (
                                                                    <span className="text-[9px] font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100 uppercase tracking-wider truncate max-w-[100px]">
                                                                        {client.enderecos[0].bairro}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Link>

                                                <div className="p-5 pt-0 mt-auto space-y-3">
                                                    {client.contatos?.[0]?.celular && (
                                                        <a 
                                                            href={`https://wa.me/55${client.contatos[0].celular.replace(/\D/g, '')}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="w-full px-4 py-3 bg-green-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-green-500/20 hover:bg-green-600 active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
                                                        >
                                                            <MessageCircle size={16} />
                                                            <span>Chamar no WhatsApp</span>
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* BANNER LISTING AD */}
                            {listAd && listAd.image && (
                                <section className={`relative group my-12 ${listAd.link ? 'cursor-pointer' : 'cursor-default'} w-full`}>
                                    <a href={listAd.link || '#'} target={listAd.link && listAd.link.startsWith('http') ? "_blank" : "_self"} className="block relative rounded-[2rem] md:rounded-[3rem] overflow-hidden bg-gray-50 shadow-lg transition-transform hover:scale-[1.01]">
                                        <img 
                                            src={listAd.image} 
                                            className="w-full h-auto max-h-[300px] object-cover" 
                                            alt={listAd.title} 
                                        />
                                    </a>
                                </section>
                            )}

                            {/* BLOCO 2: GRATUITOS (LISTA) */}
                            {gratuitos.length > 0 && (
                                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden mt-8">
                                    <div className="divide-y divide-gray-50">
                                        {gratuitos.map((client: any) => {
                                            const seoUrl = `/${params.citySlug}/${params.segmentSlug}/${client.slug || client.id}`;
                                            
                                            return (
                                                <Link 
                                                    key={client.id}
                                                    href={seoUrl}
                                                    className="flex items-center justify-between p-4 md:p-5 hover:bg-gray-50/80 transition-all group cursor-pointer"
                                                >
                                                    <div className="flex-1 min-w-0 pr-4">
                                                        <h4 className="text-sm md:text-base font-black text-gray-900 truncate group-hover:text-brand-red transition-colors">
                                                            {client.nome_fantasia}
                                                        </h4>
                                                        <div className="flex items-center mt-1 text-xs text-gray-400 truncate">
                                                            <MapPin size={12} className="mr-1 flex-shrink-0" />
                                                            <span className="truncate">
                                                                {client.enderecos?.[0]?.bairro ? client.enderecos[0].bairro + ', ' : ''}{client.enderecos?.[0]?.cidade || city.nome}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex-shrink-0">
                                                        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-red-50 group-hover:text-brand-red text-gray-400 transition-colors">
                                                            <ChevronRight size={16} />
                                                        </div>
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                        </div>
                    )}
                </div>

                <DynamicSeoText cityName={city.nome} segmentName={segment.nome} clientCount={clients.length} />
            </main>
        </div>
    );
}
