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

        const citiesCount = (citiesData.data || []).length;
        const segmentsCount = (segmentsData.data || []).length;
        const totalUrls = citiesCount * segmentsCount;
        
        const URLS_PER_SITEMAP = 40000; // Margem segura abaixo do limite de 50.000 do Google
        const totalPages = Math.ceil(totalUrls / URLS_PER_SITEMAP) || 1;

        const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.overmelhinho.com.br';
        const lastMod = new Date().toISOString().split('T')[0];

        // 2. Building the Sitemap Index XML
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

        for (let i = 1; i <= totalPages; i++) {
            xml += '  <sitemap>\n';
            xml += `    <loc>${SITE_URL}/sitemap-categorias/${i}/sitemap.xml</loc>\n`;
            xml += `    <lastmod>${lastMod}</lastmod>\n`;
            xml += '  </sitemap>\n';
        }

        xml += '</sitemapindex>';

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
