import api from '@/services/api';
import { Metadata } from 'next';
import ClientProfileClient from './ClientProfileClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.overmelhinho.com.br';

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

// 🔍 SEO Dinâmico: Título, Descrição e Keywords baseadas na empresa real
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const client = await getClient(id);
    if (!client) return { title: 'O Vermelhinho | Guia de Empresas' };

    const city = client.enderecos?.[0]?.cidade || '';
    const segment = client.segmentos?.[0]?.nome || '';
    const title = `${client.nome_fantasia} em ${city} | ${segment} | O Vermelhinho`;
    const description = client.descricao?.substring(0, 160) || `Encontre ${client.nome_fantasia} em ${city}. Confira fotos, contatos, horários e vagas de emprego no guia O Vermelhinho.`;

    return {
        title,
        description,
        keywords: [client.nome_fantasia, city, segment, ...(client.seo_keywords || [])].filter(Boolean).join(', '),
        openGraph: {
            title,
            description,
            images: [client.logotipo_url, client.galeria?.[0]?.url].filter(Boolean).map(url => url as string),
            type: 'website',
        },
        alternates: {
            canonical: `/cliente/${client.slug || client.id}`,
        }
    };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const client = await getClient(id);

    if (!client) {
        return <ClientProfileClient />;
    }

    const city = client.enderecos?.[0]?.cidade || '';
    const segment = client.segmentos?.[0] || {};
    
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
                "name": segment.nome || "Empresas",
                "item": `${SITE_URL}/busca?segmento=${segment.id || ''}`
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
                "streetAddress": `${end.rua || ''}, ${end.numero || ''}`,
                "addressLocality": end.cidade || '',
                "addressRegion": end.estado || '',
                "postalCode": end.cep || '',
                "addressCountry": "BR"
            },
            "geo": {
                "@type": "GeoCoordinates",
                "latitude": end.latitude,
                "longitude": end.longitude
            },
            "url": `${SITE_URL}/cliente/${client.slug || client.id}`,
            "telephone": (index === 0 ? (client.contatos?.[0]?.telefone_principal || client.contatos?.[0]?.celular) : end.telefone)
        }))
        : {
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": client.nome_fantasia,
            "description": client.descricao,
            "url": `${SITE_URL}/cliente/${client.slug || client.id}`,
        };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
            />
            <ClientProfileClient />
        </>
    );
}
