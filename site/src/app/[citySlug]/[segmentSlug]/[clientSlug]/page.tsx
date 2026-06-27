import api from '@/services/api';
import { Metadata } from 'next';
import ClientProfileClient from '@/app/cliente/[id]/ClientProfileClient';
import { redirect } from 'next/navigation';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://novo.overmelhinho.com.br';

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

// Função auxiliar para formatar slugs em nomes legíveis (fallback)
function formatSlug(slug: string) {
    return slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

async function getClient(slug: string) {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://dash.overmelhinho.com.br/api/v1';
        const response = await fetch(`${baseUrl}/public/clientes/${slug}`, {
            headers: {
                'Accept': 'application/json',
            },
            next: { revalidate: 3600 } // Cache maior para landing pages
        });

        if (!response.ok) return null;
        
        const data = await response.json();
        return data.data;
    } catch (e) {
        return null;
    }
}

export async function generateMetadata({ params }: { params: Promise<{ citySlug: string, segmentSlug: string, clientSlug: string }> }): Promise<Metadata> {
    const { citySlug, segmentSlug, clientSlug } = await params;
    const client = await getClient(clientSlug);
    
    if (!client) return { title: 'O Vermelhinho | Guia de Empresas' };

    const address = client.enderecos?.[0] || {};
    const mainCityName = address.cidade || '';
    const uf = address.estado || 'RS';
    const segmentName = client.segmentos?.[0]?.nome || formatSlug(segmentSlug);
    
    // SEO Strategy: Multi-City Doorway Pages
    // Verifica se a cidade acessada na URL é válida para este cliente (está na matriz ou cidades atendidas)
    let targetCityName = mainCityName;
    let targetCitySlug = mainCityName ? slugify(mainCityName) : 'cidade';

    if (citySlug) {
        const isMainCity = mainCityName && slugify(mainCityName) === citySlug;
        const attendedCity = client.cidades_atendidas?.find((c: any) => slugify(c.nome) === citySlug);
        
        if (isMainCity || attendedCity) {
            targetCityName = isMainCity ? mainCityName : attendedCity.nome;
            targetCitySlug = citySlug;
        }
    }

    const canonicalSegmentSlug = client.segmentos?.[0] ? slugify(client.segmentos[0].nome) : segmentSlug;
    
    // Padrão Exigido: [Categoria] em [Cidade] - [UF]: [Nome da Empresa] | O Vermelhinho
    const title = `${segmentName} em ${targetCityName} - ${uf}: ${client.nome_fantasia} | O Vermelhinho`;
    const description = `Precisando de ${segmentName} em ${targetCityName}? Conheça a ${client.nome_fantasia}. Confira endereços, telefones e horários no portal O Vermelhinho.`;

    return {
        title,
        description,
        keywords: [client.nome_fantasia, targetCityName, segmentName, uf, ...(client.seo_keywords || [])].filter(Boolean).join(', '),
        alternates: {
            // ✅ CANONICAL: Aponta para a página da cidade correta, gerando SEO para cada cidade atendida
            canonical: `${SITE_URL}/${targetCitySlug}/${canonicalSegmentSlug}/${client.slug || client.id}`,
        },
        openGraph: {
            title,
            description,
            images: [client.logotipo_url, client.galeria?.[0]?.url].filter(Boolean).map(url => url as string),
            type: 'website',
        }
    };
}

export default async function Page({ params }: { params: Promise<{ citySlug: string, segmentSlug: string, clientSlug: string }> }) {
    const { citySlug, segmentSlug, clientSlug } = await params;
    const client = await getClient(clientSlug);

    if (!client) {
        redirect('/');
    }

    const address = client.enderecos?.[0] || {};
    const mainCityName = address.cidade || '';
    const uf = address.estado || 'RS';
    const segmentName = client.segmentos?.[0]?.nome || formatSlug(segmentSlug);
    
    let targetCityName = mainCityName;
    
    if (citySlug) {
        const isMainCity = mainCityName && slugify(mainCityName) === citySlug;
        const attendedCity = client.cidades_atendidas?.find((c: any) => slugify(c.nome) === citySlug);
        
        if (isMainCity || attendedCity) {
            targetCityName = isMainCity ? mainCityName : attendedCity.nome;
        }
    }

    const h1Title = `${segmentName} em ${targetCityName} - ${uf}: ${client.nome_fantasia}`;

    // Passamos o contexto da cidade via URL se necessário no futuro
    // Por enquanto, o ClientProfileClient já gerencia o estado via id/slug
    return (
        <>
            {/* H1 Oculto visualmente focado em SEO Local Dinâmico */}
            <h1 className="sr-only">{h1Title}</h1>
            <ClientProfileClient />
        </>
    );
}
