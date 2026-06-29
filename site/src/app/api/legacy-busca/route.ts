import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    const id_categoria = searchParams.get('id_categoria');
    const id_cidade = searchParams.get('id_cidade');
    const palavra = searchParams.get('palavra');

    // Remove the trailing /v1 if present in NEXT_PUBLIC_API_URL so we can append /v1/cidades cleanly
    let API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://dash.overmelhinho.com.br/api/v1';
    if (!API_URL.endsWith('/v1')) {
        API_URL += '/v1';
    }

    try {
        let citySlug = '';
        let segmentSlug = '';

        if (id_cidade) {
            const cidadesRes = await fetch(`${API_URL}/cidades`, { next: { revalidate: 3600 } });
            if (cidadesRes.ok) {
                const cidadesData = await cidadesRes.json();
                const cidade = cidadesData.data?.find((c: any) => c.id === Number(id_cidade));
                if (cidade) {
                    citySlug = cidade.nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-');
                }
            }
        }

        if (id_categoria) {
            const segRes = await fetch(`${API_URL}/segmentos`, { next: { revalidate: 3600 } });
            if (segRes.ok) {
                const segData = await segRes.json();
                const segmento = segData.data?.find((s: any) => s.id === Number(id_categoria));
                if (segmento) {
                    segmentSlug = segmento.nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-');
                }
            }
        }

        const url = request.nextUrl.clone();
        url.search = '';

        if (citySlug && segmentSlug) {
            url.pathname = `/${citySlug}/${segmentSlug}`;
            return NextResponse.redirect(url, 301);
        } else if (segmentSlug) {
            url.pathname = '/busca';
            url.search = `?q=${segmentSlug}`;
            return NextResponse.redirect(url, 301);
        } else if (palavra) {
            url.pathname = '/busca';
            url.search = `?q=${palavra}`;
            return NextResponse.redirect(url, 301);
        } else {
            url.pathname = '/busca';
            return NextResponse.redirect(url, 301);
        }
    } catch (e) {
        const url = request.nextUrl.clone();
        url.pathname = '/busca';
        url.search = `?q=${palavra || ''}`;
        return NextResponse.redirect(url, 301);
    }
}
