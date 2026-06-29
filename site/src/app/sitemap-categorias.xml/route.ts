import { NextResponse } from 'next/server';

export const revalidate = 86400; // Cache de 24 horas para não sobrecarregar a API Laravel

const getApiUrl = () => {
    let API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://dash.overmelhinho.com.br/api/v1';
    if (!API_URL.endsWith('/v1')) {
        API_URL += '/v1';
    }
    return API_URL;
};

const slugify = (text: string) => {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-')
        .trim();
};

export async function GET() {
    try {
        // 1. Fetching data in parallel to save time
        const [citiesRes, segmentsRes] = await Promise.all([
            fetch(`${getApiUrl()}/cidades`),
            fetch(`${getApiUrl()}/segmentos`)
        ]);

        if (!citiesRes.ok || !segmentsRes.ok) {
            return new NextResponse('Erro ao buscar dados da API', { status: 500 });
        }

        const citiesData = await citiesRes.json();
        const segmentsData = await segmentsRes.json();

        const cities = citiesData.data || [];
        const segments = segmentsData.data || [];

        const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.overmelhinho.com.br';

        // 2. Building the XML string
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

        const lastMod = new Date().toISOString().split('T')[0]; // Data de hoje (YYYY-MM-DD)

        // 3. Cartesian Product (Cities x Segments)
        for (const city of cities) {
            if (!city.nome) continue;
            const citySlug = slugify(city.nome);

            for (const segment of segments) {
                if (!segment.nome) continue;
                const segmentSlug = slugify(segment.nome);

                xml += '  <url>\n';
                xml += `    <loc>${SITE_URL}/${citySlug}/${segmentSlug}</loc>\n`;
                xml += `    <lastmod>${lastMod}</lastmod>\n`;
                xml += `    <changefreq>weekly</changefreq>\n`;
                xml += `    <priority>0.8</priority>\n`;
                xml += '  </url>\n';
            }
        }

        xml += '</urlset>';

        return new NextResponse(xml, {
            status: 200,
            headers: {
                'Content-Type': 'application/xml',
                'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200'
            }
        });

    } catch (error) {
        console.error('Erro na geração do Sitemap:', error);
        return new NextResponse('Erro interno no servidor', { status: 500 });
    }
}
