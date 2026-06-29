import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
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

        if (citySlug && segmentSlug) {
            return NextResponse.redirect(new URL(`/${citySlug}/${segmentSlug}`, request.url), 301);
        } else if (segmentSlug) {
            return NextResponse.redirect(new URL(`/busca?q=${segmentSlug}`, request.url), 301);
        } else if (palavra) {
            return NextResponse.redirect(new URL(`/busca?q=${palavra}`, request.url), 301);
        } else {
            return NextResponse.redirect(new URL(`/busca`, request.url), 301);
        }
    } catch (e) {
        // Fallback in case of error
        const term = palavra || '';
        return NextResponse.redirect(new URL(`/busca?q=${term}`, request.url), 301);
    }
}
