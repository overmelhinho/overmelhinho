import { NextResponse } from 'next/server';

export const revalidate = 86400; // Cache de 24 horas

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

export async function GET(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const pageId = parseInt(params.id, 10);
        if (isNaN(pageId) || pageId < 1) {
            return new NextResponse('Página inválida', { status: 400 });
        }

        const res = await fetch(`${getApiUrl()}/public/active-sitemap-combinations`, { next: { revalidate: 86400 } });

        if (!res.ok) {
            return new NextResponse('Erro ao buscar dados da API', { status: 500 });
        }

        const data = await res.json();
        const combinations = data.data || [];

        const URLS_PER_SITEMAP = 40000;
        const startIndex = (pageId - 1) * URLS_PER_SITEMAP;
        const endIndex = startIndex + URLS_PER_SITEMAP;

        const urlsToGenerate = combinations.slice(startIndex, endIndex).map((comb: any) => ({
            citySlug: slugify(comb.city_name),
            segmentSlug: slugify(comb.segment_name)
        }));

        if (urlsToGenerate.length === 0) {
            return new NextResponse('Página não encontrada', { status: 404 });
        }

        const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.overmelhinho.com.br';
        const lastMod = new Date().toISOString().split('T')[0];

        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

        for (const url of urlsToGenerate) {
            xml += '  <url>\n';
            xml += `    <loc>${SITE_URL}/${url.citySlug}/${url.segmentSlug}</loc>\n`;
            xml += `    <lastmod>${lastMod}</lastmod>\n`;
            xml += `    <changefreq>weekly</changefreq>\n`;
            xml += `    <priority>0.8</priority>\n`;
            xml += '  </url>\n';
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
        console.error('Erro na geração do Sitemap Paginado:', error);
        return new NextResponse('Erro interno no servidor', { status: 500 });
    }
}
