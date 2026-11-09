import { MetadataRoute } from 'next'
import { slugify } from '@/utils/slugify'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.overmelhinho.com.br';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://dash.overmelhinho.com.br/api/v1';

  const sitemapData: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    }
  ];

  try {
    // 1. Busca rotas regionais (Segmento + Cidade)
    const combinationsRes = await fetch(`${apiUrl}/public/active-sitemap-combinations`, { next: { revalidate: 3600 } });
    if (combinationsRes.ok) {
      const combinations = await combinationsRes.json();
      const combos = combinations.data || [];
      combos.forEach((combo: { city_name: string, segment_name: string }) => {
        const citySlug = slugify(combo.city_name);
        const segSlug = slugify(combo.segment_name);
        if (citySlug && segSlug) {
          sitemapData.push({
            url: `${baseUrl}/${citySlug}/${segSlug}`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
          });
        }
      });
    }

    // 2. Busca clientes ativos para suas páginas de perfil
    const clientsRes = await fetch(`${apiUrl}/public/sitemap-data`, { next: { revalidate: 3600 } });
    if (clientsRes.ok) {
      const clients = await clientsRes.json();
      clients.forEach((client: any) => {
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
        const primarySegment = client.segmentos?.find((s: any) => s.pivot?.is_primary) || client.segmentos?.[0];
        const segmentName = primarySegment?.nome || 'segmento';
        const segmentSlug = slugify(segmentName);

        sitemapData.push({
          url: `${baseUrl}/${citySlug}/${segmentSlug}/${slug}`,
          lastModified: client.updated_at ? new Date(client.updated_at) : new Date(),
          changeFrequency: 'weekly',
          priority: 0.8,
        });
      });
    }
  } catch (error) {
    console.error("Error generating sitemap:", error);
  }

  return sitemapData;
}
