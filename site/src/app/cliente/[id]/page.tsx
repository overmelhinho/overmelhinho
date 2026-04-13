import api from '@/services/api';
import { Metadata } from 'next';
import ClientProfileClient from './ClientProfileClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.overmelhinho.com.br';

async function getClient(id: string) {
    try {
        const res = await api.get(`/public/clientes/${id}`);
        return res.data.data;
    } catch (e) {
        return null;
    }
}

// 🔍 SEO Dinâmico: Título, Descrição e Keywords baseadas na empresa real
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
    const client = await getClient(params.id);
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

export default async function Page({ params }: { params: { id: string } }) {
    const client = await getClient(params.id);

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

    const localBusinessJsonLd = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": client.nome_fantasia,
        "image": client.logotipo_url || client.galeria?.[0]?.url,
        "description": client.descricao,
        "address": {
            "@type": "PostalAddress",
            "streetAddress": `${client.enderecos?.[0]?.rua || ''}, ${client.enderecos?.[0]?.numero || ''}`,
            "addressLocality": client.enderecos?.[0]?.cidade || '',
            "addressRegion": client.enderecos?.[0]?.estado || '',
            "postalCode": client.enderecos?.[0]?.cep || '',
            "addressCountry": "BR"
        },
        "geo": {
            "@type": "GeoCoordinates",
            "latitude": client.enderecos?.[0]?.latitude,
            "longitude": client.enderecos?.[0]?.longitude
        },
        "url": `${SITE_URL}/cliente/${client.slug || client.id}`,
        "telephone": client.contatos?.[0]?.telefone_principal || client.contatos?.[0]?.celular
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
