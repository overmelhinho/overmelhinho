import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, Phone, MessageCircle, Star } from 'lucide-react';
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

export async function generateMetadata(props: { params: Promise<{ citySlug: string; segmentSlug: string }> }): Promise<Metadata> {
    const params = await props.params;
    const city = await fetchCity(params.citySlug);
    const segment = await fetchSegment(params.segmentSlug);

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
    const city = await fetchCity(params.citySlug);
    const segment = await fetchSegment(params.segmentSlug);

    if (!city || !segment) {
        notFound();
    }

    const clients = await fetchClients(city.id, segment.nome);

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
                    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
                        <div className="max-w-3xl">
                            <h1 className="text-4xl md:text-5xl font-black text-gray-900 font-serif tracking-tight leading-tight">
                                As melhores <span className="text-brand-red italic">{segment.nome}</span> em {city.nome}
                            </h1>
                            <p className="mt-4 text-lg text-gray-500">
                                Encontramos {clients.length} {clients.length === 1 ? 'resultado' : 'resultados'} para você na região de {city.nome}.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Clients Grid */}
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {clients.map((client: any) => {
                                const isPremium = client.tipo_cliente === 'pagante' && ['ativa', 'ativo', 'inadimplente'].includes(client.status_assinatura);
                                const seoUrl = `/${params.citySlug}/${params.segmentSlug}/${client.slug || client.id}`;

                                return (
                                    <div key={client.id} className={`group flex flex-col bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border ${isPremium ? 'border-brand-red/40 shadow-red-500/5' : 'border-gray-100 hover:border-brand-red/20'}`}>
                                        <Link href={seoUrl} className="flex flex-col flex-1 relative">
                                            <div className="h-48 relative overflow-hidden bg-gray-50">
                                                {client.banner_url || client.galeria?.[0]?.url ? (
                                                    <img src={client.banner_url || client.galeria[0].url} alt={client.nome_fantasia} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                                ) : (
                                                    <div className="w-full h-full bg-brand-red/5 flex items-center justify-center">
                                                        <span className="text-4xl text-brand-red/20 font-black">{client.nome_fantasia.charAt(0)}</span>
                                                    </div>
                                                )}
                                                {client.logotipo_url && (
                                                    <div className="absolute -bottom-6 left-6 w-20 h-20 rounded-2xl bg-white p-1 shadow-lg border border-gray-100 z-10">
                                                        <img src={client.logotipo_url} alt="Logo" className="w-full h-full object-cover rounded-xl" />
                                                    </div>
                                                )}
                                                {isPremium && (
                                                    <div className="absolute top-4 right-4 bg-brand-red text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg z-10">
                                                        Destaque
                                                    </div>
                                                )}
                                            </div>

                                            <div className="p-6 pt-10 flex flex-col flex-1">
                                                <h2 className="text-xl font-bold text-gray-900 group-hover:text-brand-red transition-colors line-clamp-1">{client.nome_fantasia}</h2>
                                                
                                                <div className="mt-4 flex flex-col space-y-2 text-sm text-gray-500">
                                                    <div className="flex items-center">
                                                        <MapPin size={16} className="mr-2 text-gray-400" />
                                                        <span className="line-clamp-1">
                                                            {client.enderecos?.[0]?.rua ? `${(client.enderecos[0].tipo_logradouro ? client.enderecos[0].tipo_logradouro + ' ' : '') + client.enderecos[0].rua}` : (client.enderecos?.[0]?.cidade || city.nome)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>

                                        <div className="p-6 pt-0 mt-auto space-y-3">
                                            {isPremium && client.contatos?.[0]?.celular && (
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
                                            <Link href={seoUrl} className={`flex justify-center items-center px-4 py-3 w-full text-[10px] font-black uppercase tracking-widest rounded-2xl transition-colors ${isPremium ? 'bg-gray-50 text-gray-700 hover:bg-gray-100' : 'bg-brand-red text-white shadow-lg shadow-red-500/20 hover:bg-red-600 active:scale-[0.98]'}`}>
                                                Ver detalhes
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <DynamicSeoText cityName={city.nome} segmentName={segment.nome} clientCount={clients.length} />
            </main>
        </div>
    );
}
