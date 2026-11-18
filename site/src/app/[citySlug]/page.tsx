import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { 
    MapPin, 
    Search, 
    ChevronRight, 
    Building2, 
    Briefcase, 
    Sparkles, 
    Layers, 
    Compass,
    Phone,
    MessageCircle
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { slugify } from '@/utils/slugify';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.overmelhinho.com.br';

const getApiUrl = () => {
    let API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://dash.overmelhinho.com.br/api/v1';
    if (!API_URL.endsWith('/v1')) {
        API_URL += '/v1';
    }
    return API_URL;
};

// 1. Busca todas as cidades permitidas
async function fetchCities(): Promise<any[]> {
    try {
        const res = await fetch(`${getApiUrl()}/cidades`, { next: { revalidate: 3600 } });
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data.data) ? data.data : [];
    } catch (err) {
        console.error('[CityHub] Error fetching cities:', err);
        return [];
    }
}

// 2. Busca combinações ativas de (cidade, segmento)
async function fetchActiveCombinations(): Promise<any[]> {
    try {
        const res = await fetch(`${getApiUrl()}/public/active-sitemap-combinations`, { next: { revalidate: 3600 } });
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
    } catch (err) {
        console.error('[CityHub] Error fetching combinations:', err);
        return [];
    }
}

// 3. Busca empresas em destaque na cidade
async function fetchFeaturedClients(cityId: number): Promise<any[]> {
    try {
        const res = await fetch(`${getApiUrl()}/public/search?city_id=${cityId}&per_page=12`, {
            next: { revalidate: 3600 }
        });
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data.data) ? data.data : [];
    } catch (err) {
        console.error('[CityHub] Error fetching featured clients:', err);
        return [];
    }
}

// Categorias prioritárias para destaque com ícones visuais
const POPULAR_CATEGORY_KEYWORDS = [
    { name: 'Restaurantes & Gastronomia', slug: 'restaurantes', icon: '🍽️', keywords: ['restaurante', 'pizzaria', 'lanches'] },
    { name: 'Oficinas & Mecânicas', slug: 'mecanica', icon: '🚗', keywords: ['mecanica', 'oficina', 'auto'] },
    { name: 'Dentistas & Odontologia', slug: 'dentistas', icon: '🦷', keywords: ['dentista', 'odontolog'] },
    { name: 'Médicos & Clínicas', slug: 'clinicas-medicas', icon: '🩺', keywords: ['medico', 'clinica', 'saude'] },
    { name: 'Advocacia & Jurídico', slug: 'advocacia', icon: '⚖️', keywords: ['advocacia', 'advogado'] },
    { name: 'Contabilidade', slug: 'contabilidade', icon: '📊', keywords: ['contabil', 'contador'] },
    { name: 'Supermercados & Mercados', slug: 'supermercados', icon: '🛒', keywords: ['supermercado', 'mercado'] },
    { name: 'Lojas & Vestuário', slug: 'loja-de-vestuario', icon: '👗', keywords: ['vestuario', 'roupas', 'moda'] },
    { name: 'Academias & Fitness', slug: 'academias', icon: '💪', keywords: ['academia', 'fitness'] },
    { name: 'Salões de Beleza & Estética', slug: 'salao-de-beleza', icon: '✂️', keywords: ['salao de beleza', 'cabeleireir', 'estetica'] },
    { name: 'Pet Shop & Veterinária', slug: 'pet-shop', icon: '🐾', keywords: ['pet shop', 'veterinari'] },
    { name: 'Construção & Reformas', slug: 'construcao-civil', icon: '🏗️', keywords: ['construcao', 'materiais de construcao', 'reforma'] },
];

export async function generateMetadata({ params }: { params: Promise<{ citySlug: string }> }): Promise<Metadata> {
    const { citySlug } = await params;
    const cities = await fetchCities();
    const city = cities.find((c: any) => slugify(c.nome) === citySlug);

    if (!city) {
        return {
            title: 'Cidade não encontrada | O Vermelhinho',
            robots: { index: false, follow: false }
        };
    }

    const cityName = city.nome.trim();
    const uf = city.uf || 'RS';
    const title = `Guia de Empresas e Negócios em ${cityName} - ${uf} | O Vermelhinho`;
    const description = `Encontre as melhores empresas, comércios, profissionais liberais e serviços em ${cityName} - ${uf}. Telefones, endereços, horários e WhatsApp direto no Guia O Vermelhinho.`;
    const canonical = `${SITE_URL}/${citySlug}`;

    return {
        title,
        description,
        alternates: {
            canonical,
        },
        openGraph: {
            title,
            description,
            url: canonical,
            siteName: 'O Vermelhinho',
            locale: 'pt_BR',
            type: 'website',
            images: [
                {
                    url: `${SITE_URL}/logo-overmelhinho.png`,
                    width: 1200,
                    height: 630,
                    alt: `Guia O Vermelhinho - ${cityName} (${uf})`
                }
            ]
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [`${SITE_URL}/logo-overmelhinho.png`]
        }
    };
}

export default async function CityHubPage({ params }: { params: Promise<{ citySlug: string }> }) {
    const { citySlug } = await params;
    const cities = await fetchCities();
    const city = cities.find((c: any) => slugify(c.nome) === citySlug);

    if (!city) {
        notFound();
    }

    const cityName = city.nome.trim();
    const uf = city.uf || 'RS';
    const canonicalUrl = `${SITE_URL}/${citySlug}`;

    // Buscar dados paralelos: combinações e empresas em destaque
    const [allCombinations, featuredClients] = await Promise.all([
        fetchActiveCombinations(),
        fetchFeaturedClients(city.id)
    ]);

    // Filtrar os segmentos ativos desta cidade
    const cityCombinations = allCombinations.filter(
        (item: any) => item.city_name && slugify(item.city_name) === citySlug
    );

    // Extrair lista única de segmentos da cidade ordenados alfabeticamente
    const segmentMap = new Map<string, string>();
    for (const combo of cityCombinations) {
        if (combo.segment_name) {
            const segSlug = slugify(combo.segment_name);
            if (!segmentMap.has(segSlug)) {
                segmentMap.set(segSlug, combo.segment_name.trim());
            }
        }
    }
    const allCitySegments = Array.from(segmentMap.entries())
        .map(([slug, name]) => ({ slug, name }))
        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

    // Selecionar categorias populares presentes na cidade
    const highlightedCategories = POPULAR_CATEGORY_KEYWORDS.map(cat => {
        // Encontra o melhor match de segmento nesta cidade
        const matched = allCitySegments.find(s => {
            const norm = slugify(s.name);
            return cat.keywords.some(kw => norm.includes(slugify(kw)));
        });
        return {
            ...cat,
            actualSlug: matched?.slug || cat.slug,
            available: !!matched
        };
    }).filter(c => c.available);

    // Outras cidades da Serra para navegação cruzada
    const otherCities = cities
        .filter((c: any) => slugify(c.nome) !== citySlug)
        .slice(0, 10);

    // Schemas estruturados JSON-LD
    const breadcrumbJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
            {
                '@type': 'ListItem',
                'position': 1,
                'name': 'Home',
                'item': SITE_URL
            },
            {
                '@type': 'ListItem',
                'position': 2,
                'name': `${cityName} - ${uf}`,
                'item': canonicalUrl
            }
        ]
    };

    const collectionJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        '@id': `${canonicalUrl}#collection`,
        'name': `Guia de Empresas e Serviços em ${cityName} - ${uf}`,
        'description': `Diretório comercial completo com empresas, comércio e serviços locais em ${cityName} - ${uf}.`,
        'url': canonicalUrl,
        'about': {
            '@type': 'City',
            'name': cityName,
            'address': {
                '@type': 'PostalAddress',
                'addressRegion': uf,
                'addressCountry': 'BR'
            }
        },
        'mainEntity': {
            '@type': 'ItemList',
            'numberOfItems': allCitySegments.length,
            'itemListElement': allCitySegments.slice(0, 20).map((seg, idx) => ({
                '@type': 'ListItem',
                'position': idx + 1,
                'name': `${seg.name} em ${cityName}`,
                'url': `${SITE_URL}/${citySlug}/${seg.slug}`
            }))
        }
    };

    return (
        <div className="min-h-screen font-sans bg-gray-50 flex flex-col justify-between">
            <Header />

            <script
                type="application/ld+json"
                {...{ ['dangerously' + 'SetInnerHTML']: { __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, '\\u003c') } }}
            />
            <script
                type="application/ld+json"
                {...{ ['dangerously' + 'SetInnerHTML']: { __html: JSON.stringify(collectionJsonLd).replace(/</g, '\\u003c') } }}
            />

            <main className="pt-24 pb-20">
                {/* 1. BREADCRUMB BAR */}
                <div className="bg-white border-b border-gray-100">
                    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-3.5">
                        <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs text-gray-500">
                            <Link href="/" className="hover:text-brand-red transition-colors flex items-center gap-1">
                                <span>Home</span>
                            </Link>
                            <ChevronRight size={12} className="text-gray-300" />
                            <span className="font-semibold text-gray-800">{cityName} - {uf}</span>
                        </nav>
                    </div>
                </div>

                {/* 2. HERO SECTION COM BUSCA MUNICIPAL */}
                <section className="bg-gradient-to-b from-white via-red-50/20 to-gray-50 border-b border-gray-100 py-12 md:py-16">
                    <div className="max-w-7xl mx-auto px-6 lg:px-8">
                        <div className="max-w-3xl space-y-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-red/10 text-brand-red text-xs font-bold uppercase tracking-wider">
                                <MapPin size={14} /> Polo Comercial da Serra Gaúcha
                            </div>
                            <h1 className="text-3xl md:text-5xl font-black text-gray-900 font-serif tracking-tight leading-tight">
                                Empresas, Serviços e Comércio em <span className="text-brand-red italic">{cityName}</span>
                            </h1>
                            <p className="text-base md:text-lg text-gray-600 leading-relaxed">
                                Encontre telefones, WhatsApp, localização e horários de atendimento das melhores empresas de {cityName} - {uf}. Mais de <strong>{allCitySegments.length} categorias</strong> ativas no Guia O Vermelhinho.
                            </p>
                        </div>

                        {/* Barra de Busca Pre-escopada para a Cidade */}
                        <form 
                            action="/busca" 
                            method="GET" 
                            className="mt-8 max-w-2xl bg-white p-2 rounded-2xl md:rounded-3xl shadow-xl border border-gray-100 flex items-center gap-2"
                        >
                            <input type="hidden" name="city_id" value={city.id} />
                            <div className="pl-3 text-gray-400">
                                <Search size={20} />
                            </div>
                            <input
                                type="text"
                                name="q"
                                placeholder={`O que você procura em ${cityName}? (ex: dentista, oficina, pizzaria)`}
                                className="flex-1 bg-transparent px-2 py-2.5 text-sm md:text-base text-gray-900 placeholder-gray-400 focus:outline-none"
                                required
                            />
                            <button
                                type="submit"
                                className="bg-brand-red hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl md:rounded-2xl text-sm transition-all shadow-md active:scale-95"
                            >
                                Buscar
                            </button>
                        </form>
                    </div>
                </section>

                <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 space-y-16">
                    {/* 3. CATEGORIAS EM DESTAQUE */}
                    {highlightedCategories.length > 0 && (
                        <section className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 font-serif tracking-tight flex items-center gap-2">
                                        <Sparkles size={22} className="text-brand-red" />
                                        Categorias Populares em {cityName}
                                    </h2>
                                    <p className="text-sm text-gray-500 mt-1">Acesso rápido aos segmentos mais procurados da cidade</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {highlightedCategories.map(cat => (
                                    <Link
                                        key={cat.slug}
                                        href={`/${citySlug}/${cat.actualSlug}`}
                                        className="bg-white p-4 rounded-2xl border border-gray-100 hover:border-brand-red/30 shadow-sm hover:shadow-md transition-all group flex flex-col items-center text-center space-y-2 hover:-translate-y-0.5"
                                    >
                                        <div className="text-3xl group-hover:scale-110 transition-transform">{cat.icon}</div>
                                        <span className="text-xs font-bold text-gray-800 group-hover:text-brand-red transition-colors line-clamp-2">
                                            {cat.name}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* 4. EMPRESAS EM DESTAQUE NA CIDADE */}
                    {featuredClients.length > 0 && (
                        <section className="space-y-6">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 font-serif tracking-tight flex items-center gap-2">
                                    <Building2 size={22} className="text-brand-red" />
                                    Empresas em Destaque em {cityName}
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">Conheça algumas das principais empresas cadastradas</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {featuredClients.slice(0, 6).map((client: any) => {
                                    const primarySeg = client.segmentos?.[0]?.slug || client.segmentos?.[0]?.nome || 'empresa';
                                    const segSlug = slugify(primarySeg);
                                    const clientSlug = client.slug || client.id;
                                    const clientUrl = `/${citySlug}/${segSlug}/${clientSlug}`;
                                    const address = client.enderecos?.[0];
                                    const phone = client.contatos?.[0]?.telefone_principal || client.contatos?.[0]?.celular;
                                    const whatsapp = client.contatos?.[0]?.whatsapp || (phone?.length >= 10 ? phone : null);

                                    return (
                                        <div 
                                            key={client.id}
                                            className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-xl transition-all duration-300 group"
                                        >
                                            <Link href={clientUrl} className="relative h-44 bg-gray-100 overflow-hidden block">
                                                {client.banner_url ? (
                                                    <Image
                                                        src={client.banner_url}
                                                        alt={client.nome_fantasia}
                                                        fill
                                                        sizes="(max-width: 768px) 100vw, 33vw"
                                                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-brand-red/10 flex items-center justify-center">
                                                        <span className="text-4xl text-brand-red/20 font-black">{client.nome_fantasia?.charAt(0)}</span>
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                                                
                                                {client.logotipo_url && (
                                                    <div className="absolute bottom-3 left-4 w-14 h-14 rounded-2xl bg-white p-1 shadow-md border-2 border-white">
                                                        <div className="relative w-full h-full rounded-xl overflow-hidden">
                                                            <Image
                                                                src={client.logotipo_url}
                                                                alt={client.nome_fantasia}
                                                                fill
                                                                sizes="56px"
                                                                className="object-cover"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </Link>

                                            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                                                <div>
                                                    <span className="text-[10px] font-bold text-brand-red uppercase tracking-wider bg-red-50 px-2 py-0.5 rounded-md">
                                                        {client.segmentos?.[0]?.nome || 'Empresa'}
                                                    </span>
                                                    <Link href={clientUrl}>
                                                        <h3 className="text-lg font-black text-gray-900 hover:text-brand-red transition-colors line-clamp-1 mt-1 font-serif">
                                                            {client.nome_fantasia}
                                                        </h3>
                                                    </Link>
                                                    {address?.rua && (
                                                        <p className="text-xs text-gray-500 mt-1 line-clamp-1 flex items-center gap-1">
                                                            <MapPin size={12} className="shrink-0 text-gray-400" />
                                                            {address.rua}{address.numero ? `, ${address.numero}` : ''}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="pt-2 border-t border-gray-50 flex items-center justify-between gap-2">
                                                    <Link 
                                                        href={clientUrl}
                                                        className="text-xs font-bold text-gray-700 hover:text-brand-red transition-colors flex items-center gap-1"
                                                    >
                                                        Ver Perfil <ChevronRight size={14} />
                                                    </Link>
                                                    {whatsapp && (
                                                        <a
                                                            href={`https://wa.me/55${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá! Vi sua empresa no Guia O Vermelhinho em ${cityName}.`)}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="bg-[#25D366] hover:bg-[#20ba59] text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
                                                        >
                                                            <MessageCircle size={14} />
                                                            WhatsApp
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* 5. ÍNDICE COMPLETO DE SEGMENTOS NA CIDADE */}
                    {allCitySegments.length > 0 && (
                        <section className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm space-y-6">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 font-serif tracking-tight flex items-center gap-2">
                                    <Layers size={22} className="text-brand-red" />
                                    Todos os Segmentos em {cityName}
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    Navegue por todas as {allCitySegments.length} categorias de empresas e comércios atendidos em {cityName}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-[500px] overflow-y-auto pr-2">
                                {allCitySegments.map(seg => (
                                    <Link
                                        key={seg.slug}
                                        href={`/${citySlug}/${seg.slug}`}
                                        className="text-xs text-gray-600 hover:text-brand-red hover:bg-red-50/50 p-2 rounded-xl transition-all flex items-center justify-between group border border-transparent hover:border-red-100"
                                    >
                                        <span className="line-clamp-1">{seg.name}</span>
                                        <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 text-brand-red transition-opacity shrink-0" />
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* 6. OUTRAS CIDADES DA SERRA GAÚCHA */}
                    {otherCities.length > 0 && (
                        <section className="space-y-4 pt-4 border-t border-gray-200">
                            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Compass size={16} className="text-brand-red" /> Cidades Vizinhas na Serra Gaúcha
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {otherCities.map((other: any) => (
                                    <Link
                                        key={other.id}
                                        href={`/${slugify(other.nome)}`}
                                        className="bg-white hover:bg-brand-red text-gray-700 hover:text-white px-4 py-2 rounded-xl text-xs font-semibold border border-gray-200 hover:border-brand-red transition-all shadow-sm"
                                    >
                                        {other.nome} ({other.uf || 'RS'})
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}

