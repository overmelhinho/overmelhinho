import { NextResponse } from 'next/server';
import { slugify } from '@/utils/slugify';

export const revalidate = 86400; // Cache de 24 horas com suporte a On-Demand ISR

const getApiUrl = () => {
    let API_URL = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';
    API_URL = API_URL.replace('localhost', '127.0.0.1');
    if (!API_URL.endsWith('/v1')) {
        API_URL += '/v1';
    }
    return API_URL;
};

export async function GET() {
    try {
        const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.overmelhinho.com.br';
        const res = await fetch(`${getApiUrl()}/public/sitemap-data`, {
            next: {
                tags: ['sitemap-companies'],
                revalidate: 86400
            }
        });

        if (!res.ok) {
            return new NextResponse('Erro ao buscar empresas da API', { status: 500 });
        }

        const clients = await res.json();
        const lastModDefault = new Date().toISOString().split('T')[0];

        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

        for (const client of clients) {
            const slug = client.slug || client.id;
            const address = client.enderecos?.[0] || {};
            const addressCity = address.cidade || '';
            const citiesServed = client.cidades_atendidas || [];

            let targetCity = addressCity;
            if (citiesServed.length > 0) {
                const hasAddressCityInServed = citiesServed.some((c: any) =>
                    c.nome.toLowerCase().trim() === addressCity.toLowerCase().trim()
                );
                if (!hasAddressCityInServed) {
                    targetCity = citiesServed[0].nome;
                }
            }

            const citySlug = targetCity ? slugify(targetCity) : 'cidade';
            const primarySegment = client.segmentos?.find((s: any) => s.is_primary || s.pivot?.is_primary) || client.segmentos?.[0];
            const segmentSlug = primarySegment ? slugify(primarySegment.slug || primarySegment.nome) : 'empresa';

            const lastMod = client.updated_at ? client.updated_at.split('T')[0] : lastModDefault;

            xml += '  <url>\n';
            xml += `    <loc>${SITE_URL}/${citySlug}/${segmentSlug}/${slug}</loc>\n`;
            xml += `    <lastmod>${lastMod}</lastmod>\n`;
            xml += `    <changefreq>weekly</changefreq>\n`;
            xml += `    <priority>0.8</priority>\n`;
            xml += '  </url>\n';
        }

        xml += '</urlset>';

        return new NextResponse(xml, {
            status: 200,
            headers: {
                'Content-Type': 'application/xml; charset=utf-8',
                'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200'
            }
        });
    } catch (error) {
        console.error('Erro na geração do Sitemap de Empresas:', error);
        return new NextResponse('Erro interno no servidor', { status: 500 });
    }
}
