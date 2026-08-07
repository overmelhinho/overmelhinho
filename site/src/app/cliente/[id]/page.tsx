import api from '@/services/api';
import { Metadata } from 'next';
import ClientProfileClient from './ClientProfileClient';
import { slugify } from '@/utils/slugify';
import { permanentRedirect, notFound } from 'next/navigation';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.overmelhinho.com.br';

async function getClient(id: string) {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://dash.overmelhinho.com.br/api/v1';
        const response = await fetch(`${baseUrl}/public/clientes/${id}`, {
            headers: {
                'Accept': 'application/json',
            },
            next: { revalidate: 3600, tags: ['client-' + id] } // Cache de 1 hora para performance máxima, com Tag para Webhook
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
            if (response.status === 404 && data?.redirect_suggestion) {
                return { is_inactive_redirect: true, redirect_suggestion: data.redirect_suggestion };
            }
            return null;
        }
        
        return data?.data || null;
    } catch (e) {
        return null;
    }
}

// 🔍 SEO Dinâmico: Título, Descrição e Keywords baseadas na intenção de busca (Serviço + Cidade)
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const client = await getClient(id);
    if (!client || client.is_inactive_redirect) return { title: 'O Vermelhinho | Guia de Empresas' };

    const { city, uf } = getPrimaryCity(client);
    const segment = client.segmentos?.[0]?.nome || 'Empresa';
    
    // Canonical URL generation based on SEO pattern
    const canonicalCitySlug = city ? slugify(city) : 'cidade';
    const canonicalSegmentSlug = segment ? slugify(segment) : 'segmento';
    const canonicalUrl = `${SITE_URL}/${canonicalCitySlug}/${canonicalSegmentSlug}/${client.slug || client.id}`;

    // Padrão Exigido: [Categoria do Serviço] em [Cidade] - [UF]: [Nome da Empresa] | O Vermelhinho
    const title = `${segment} em ${city} - ${uf}: ${client.nome_fantasia} | O Vermelhinho`;
    const description = client.descricao?.substring(0, 160) || `Precisa de ${segment} em ${city}? Conheça a ${client.nome_fantasia}. Confira endereços, contatos e horários no guia O Vermelhinho.`;

    return {
        title,
        description,
        keywords: [client.nome_fantasia, city, segment, uf, ...(client.seo_keywords || [])].filter(Boolean).join(', '),
        openGraph: {
            title,
            description,
            images: [client.logotipo_url, client.galeria?.[0]?.url].filter(Boolean).map(url => url as string),
            type: 'website',
        },
        alternates: {
            canonical: canonicalUrl,
        }
    };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const client = await getClient(id);

    if (!client) {
        notFound();
    }

    if (client.is_inactive_redirect) {
        const { city_slug, segment_slug } = client.redirect_suggestion;
        permanentRedirect(`/${city_slug}/${segment_slug}`);
    }

    const { city, uf } = getPrimaryCity(client);
    const segment = client.segmentos?.[0]?.nome || 'Empresa';
    
    // Calcula a nova URL canonical para o redirecionamento 301
    const canonicalCitySlug = city ? slugify(city) : 'cidade';
    const canonicalSegmentSlug = segment ? slugify(segment) : 'segmento';
    const canonicalPath = `/${canonicalCitySlug}/${canonicalSegmentSlug}/${client.slug || client.id}`;

    // Força o Redirecionamento 301 Movido Permanentemente
    permanentRedirect(canonicalPath);
    
    // Padrão H1: Idêntico ao Title para relevância máxima
    const h1Title = `${segment} em ${city} - ${uf}: ${client.nome_fantasia}`;
    
    // Esquemas JSON-LD para SEO
    const breadcrumbJsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": SITE_URL
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": segment || "Empresas",
                "item": `${SITE_URL}/busca?segmento=${client.segmentos?.[0]?.id || ''}`
            },
            {
                "@type": "ListItem",
                "position": 3,
                "name": client.nome_fantasia,
                "item": `${SITE_URL}/cliente/${client.slug || client.id}`
            }
        ]
    };

    const localBusinessJsonLd = client.enderecos?.length > 0 
        ? client.enderecos.map((end: any, index: number) => ({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": client.enderecos.length > 1 ? `${client.nome_fantasia} - ${end.nome_unidade || `Unidade ${index + 1}`}` : client.nome_fantasia,
            "image": client.logotipo_url || client.galeria?.[0]?.url,
            "description": client.descricao,
            "address": {
                "@type": "PostalAddress",
                "streetAddress": end.exibir_apenas_cidade ? undefined : `${end.rua || ''}, ${end.numero || ''}${end.complemento ? `, ${end.complemento}` : ''}`,
                "addressLocality": end.cidade || '',
                "addressRegion": end.estado || '',
                "postalCode": end.exibir_apenas_cidade ? undefined : (end.cep || ''),
                "addressCountry": "BR"
            },
            "geo": (end.latitude && !end.exibir_apenas_cidade) ? {
                "@type": "GeoCoordinates",
                "latitude": end.latitude,
                "longitude": end.longitude
            } : undefined,
            "url": `${SITE_URL}/cliente/${client.slug || client.id}`,
            "telephone": (index === 0 ? (client.contatos?.[0]?.telefone_principal || client.contatos?.[0]?.celular) : end.telefone),
            "areaServed": client.cidades_atendidas?.length > 0 ? client.cidades_atendidas.map((c: any) => ({
                "@type": "City",
                "name": c.nome,
                "addressRegion": c.uf || "RS",
                "addressCountry": "BR"
            })) : undefined,
        }))
        : null;

    return (
        <>
            <script
                type="application/ld+json"
                {...{ ['dangerously' + 'SetInnerHTML']: { __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, '\\u003c') } }}
            />
            {localBusinessJsonLd && (
                <script
                    type="application/ld+json"
                    {...{ ['dangerously' + 'SetInnerHTML']: { __html: JSON.stringify(localBusinessJsonLd).replace(/</g, '\\u003c') } }}
                />
            )}
            
            {/* H1 Oculto visualmente ou passado para o componente para garantir SEO */}
            <h1 className="sr-only">{h1Title}</h1>
            
            <ClientProfileClient initialClient={client} />
        </>
    );
}

// Determina qual a cidade principal para redirecionamento canonical
function getPrimaryCity(client: any): { city: string; uf: string } {
    const address = client.enderecos?.[0] || {};
    const addressCity = address.cidade || '';
    const addressUf = address.estado || 'RS';

    const citiesServed = client.cidades_atendidas || [];

    if (citiesServed.length > 0) {
        // Se a cidade do endereço estiver na lista de cidades atendidas, ela é a principal
        const hasAddressCityInServed = citiesServed.some((c: any) => 
            c.nome.toLowerCase().trim() === addressCity.toLowerCase().trim()
        );

        if (hasAddressCityInServed) {
            return { city: addressCity, uf: addressUf };
        }

        // Se não tiver, considera a primeira cidade atendida
        const firstServed = citiesServed[0];
        return { city: firstServed.nome, uf: firstServed.uf || addressUf };
    }

    return { city: addressCity, uf: addressUf };
}
