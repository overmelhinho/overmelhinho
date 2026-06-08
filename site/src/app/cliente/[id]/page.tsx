import api from '@/services/api';
import { Metadata } from 'next';
import ClientProfileClient from './ClientProfileClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://novo.overmelhinho.com.br';

async function getClient(id: string) {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
        const response = await fetch(`${baseUrl}/public/clientes/${id}`, {
            headers: {
                'Accept': 'application/json',
            },
            next: { revalidate: 60 } // Opcional: cache de 60 segundos
        });

        if (!response.ok) return null;
        
        const data = await response.json();
        return data.data;
    } catch (e) {
        return null;
    }
}

// Função auxiliar para criar slug a partir de string
function slugify(text: string) {
    return text
        .toString()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-')
        .trim();
}

// 🔍 SEO Dinâmico: Título, Descrição e Keywords baseadas na intenção de busca (Serviço + Cidade)
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const client = await getClient(id);
    if (!client) return { title: 'O Vermelhinho | Guia de Empresas' };

    const address = client.enderecos?.[0] || {};
    const city = address.cidade || '';
    const uf = address.estado || 'RS';
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
        return <ClientProfileClient />;
    }

    const address = client.enderecos?.[0] || {};
    const city = address.cidade || '';
    const uf = address.estado || 'RS';
    const segment = client.segmentos?.[0]?.nome || 'Empresa';
    
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
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
            />
            {localBusinessJsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
                />
            )}
            
            {/* H1 Oculto visualmente ou passado para o componente para garantir SEO */}
            <h1 className="sr-only">{h1Title}</h1>
            
            <ClientProfileClient />
        </>
    );
}
