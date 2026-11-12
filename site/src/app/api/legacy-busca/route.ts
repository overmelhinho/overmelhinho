import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { slugify } from '@/utils/slugify';

export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    const id_categoria = searchParams.get('id_categoria') || searchParams.get('segmento');
    const id_cidade = searchParams.get('id_cidade') || searchParams.get('city_id');
    const palavra = (searchParams.get('palavra') || searchParams.get('q') || '').replace(/^[-_\s]+|[-_\s]+$/g, '');

    // Remove the trailing /v1 if present in NEXT_PUBLIC_API_URL so we can append /v1/cidades cleanly
    let API_URL = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';
    API_URL = API_URL.replace('localhost', '127.0.0.1');
    if (!API_URL.endsWith('/v1')) {
        API_URL += '/v1';
    }

    try {
        let citySlug = '';
        let segmentSlug = '';
        let segmentName = '';

        if (id_cidade) {
            const cidadesRes = await fetch(`${API_URL}/cidades`, { next: { revalidate: 3600 } });
            if (cidadesRes.ok) {
                const cidadesData = await cidadesRes.json();
                const cidade = cidadesData.data?.find((c: any) => c.id === Number(id_cidade));
                if (cidade) {
                    citySlug = slugify(cidade.nome);
                }
            }
        }

        if (id_categoria) {
            const segRes = await fetch(`${API_URL}/segmentos`, { next: { revalidate: 3600 } });
            if (segRes.ok) {
                const segData = await segRes.json();
                const segmento = segData.data?.find((s: any) => s.id === Number(id_categoria));
                if (segmento) {
                    segmentSlug = slugify(segmento.nome);
                    segmentName = segmento.nome;
                }
            }
        }

        if (citySlug && segmentSlug) {
            return new Response(null, { status: 301, headers: { 'Location': `/${citySlug}/${segmentSlug}` } });
        } else if (segmentSlug) {
            return new Response(null, { status: 301, headers: { 'Location': `/busca?q=${encodeURIComponent(segmentName || segmentSlug)}` } });
        } else if (palavra) {
            return new Response(null, { status: 301, headers: { 'Location': `/busca?q=${encodeURIComponent(palavra)}` } });
        } else {
            return new Response(null, { status: 301, headers: { 'Location': '/busca' } });
        }
    } catch (e) {
        return new Response(null, { status: 301, headers: { 'Location': `/busca?q=${encodeURIComponent(palavra || '')}` } });
    }
}
