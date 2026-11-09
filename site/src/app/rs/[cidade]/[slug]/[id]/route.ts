import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { slugify } from '@/utils/slugify';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.overmelhinho.com.br';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cidade: string; slug: string; id: string }> }
) {
  const resolvedParams = await params;
  const { cidade, id } = resolvedParams;

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://dash.overmelhinho.com.br/api/v1';
    const res = await fetch(`${apiUrl}/public/clientes/${id}`, { next: { revalidate: 3600 } });
    
    if (res.ok) {
      const data = await res.json();
      const client = data.data || data;

      const addressCity = client.enderecos?.[0]?.cidade || '';
      const cidades = client.cidades_atendidas || client.cidadesAtendidas || client.cidades || [];
      const categorias = client.segmentos || client.categorias || [];
      const primaryCategory = categorias.find((c: any) => c.pivot?.is_primary) || categorias[0];

      const cityName = addressCity || cidades[0]?.nome || cidade;
      const citySlug = slugify(cityName);
      const categorySlug = primaryCategory ? slugify(primaryCategory.slug || primaryCategory.nome) : 'empresa';
      const clientSlug = client.slug || client.id || id;

      if (citySlug && clientSlug) {
        const newUrl = `${SITE_URL}/${citySlug}/${categorySlug}/${clientSlug}`;
        return NextResponse.redirect(newUrl, 301);
      }
    } else if (res.status === 404) {
      const data = await res.json().catch(() => null);
      if (data?.redirect_suggestion?.city_slug && data?.redirect_suggestion?.segment_slug) {
        return NextResponse.redirect(
          `${SITE_URL}/${slugify(data.redirect_suggestion.city_slug)}/${slugify(data.redirect_suggestion.segment_slug)}`,
          301
        );
      }
    }
  } catch (err) {
    console.error('Error fetching client for redirect:', err);
  }

  return NextResponse.redirect(`${SITE_URL}/cliente/${id}`, 301);
}
