import { MetadataRoute } from 'next';
import api from '@/services/api';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.overmelhinho.com.br';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    try {
        // 1. Buscar os dados do sitemap no backend
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://dash.overmelhinho.com.br/api/v1';
        const response = await fetch(`${baseUrl}/public/sitemap-data`, {
            next: { revalidate: 3600 } // Cache de 1 hora para o sitemap
        });

        if (!response.ok) {
            throw new Error('API request failed');
        }
        
        const clients = await response.json();

        // 2. Mapear os clientes para o formato do sitemap
        const clientEntries = clients.map((client: any) => ({
            url: `${SITE_URL}/${client.citySlug || 'cidade'}/${client.segmentSlug || 'segmento'}/${client.slug || client.id}`,
            lastModified: client.updated_at ? new Date(client.updated_at) : new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.7,
        }));

        // 3. Páginas estáticas principais
        const staticEntries: MetadataRoute.Sitemap = [
            {
                url: SITE_URL,
                lastModified: new Date(),
                changeFrequency: 'daily',
                priority: 1,
            },
            {
                url: `${SITE_URL}/busca`,
                lastModified: new Date(),
                changeFrequency: 'daily',
                priority: 0.8,
            },
            {
                url: `${SITE_URL}/anuncie`,
                lastModified: new Date(),
                changeFrequency: 'monthly',
                priority: 0.9,
            },
            {
                url: `${SITE_URL}/vagas`,
                lastModified: new Date(),
                changeFrequency: 'daily',
                priority: 0.8,
            },
        ];

        return [...staticEntries, ...clientEntries];
    } catch (error) {
        console.error('Erro ao gerar sitemap:', error);
        return [
            {
                url: SITE_URL,
                lastModified: new Date(),
                changeFrequency: 'daily',
                priority: 1,
            },
        ];
    }
}
