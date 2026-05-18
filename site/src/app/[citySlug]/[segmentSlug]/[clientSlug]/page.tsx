import api from '@/services/api';
import { Metadata } from 'next';
import ClientProfileClient from '@/app/cliente/[id]/ClientProfileClient';
import { redirect } from 'next/navigation';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://novo.overmelhinho.com.br';

// Função auxiliar para formatar slugs em nomes legíveis (fallback)
function formatSlug(slug: string) {
    return slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

async function getClient(slug: string) {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
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
    const cityName = address.cidade || formatSlug(citySlug);
    const uf = address.estado || 'RS';
    const segmentName = client.segmentos?.[0]?.nome || formatSlug(segmentSlug);
    
    // Padrão Exigido: [Categoria] em [Cidade] - [UF]: [Nome da Empresa] | O Vermelhinho
    const title = `${segmentName} em ${cityName} - ${uf}: ${client.nome_fantasia} | O Vermelhinho`;
    const description = `Precisando de ${segmentName} em ${cityName}? Conheça a ${client.nome_fantasia}. Confira endereços, telefones e horários no portal O Vermelhinho.`;

    return {
        title,
        description,
        keywords: [client.nome_fantasia, cityName, segmentName, uf, ...(client.seo_keywords || [])].filter(Boolean).join(', '),
        alternates: {
            // ✅ CANONICAL: Aponta para a página principal para evitar conteúdo duplicado
            canonical: `${SITE_URL}/cliente/${client.slug || client.id}`,
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
    const { citySlug, clientSlug } = await params;
    const client = await getClient(clientSlug);

    if (!client) {
        redirect('/');
    }

    // Passamos o contexto da cidade via URL se necessário no futuro
    // Por enquanto, o ClientProfileClient já gerencia o estado via id/slug
    return <ClientProfileClient />;
}
