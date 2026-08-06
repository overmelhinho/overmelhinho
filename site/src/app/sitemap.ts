import { MetadataRoute } from 'next'
import { slugify } from '@/utils/slugify'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://overmelhinho.com.br';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.overmelhinho.com.br/api/v1';

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
        sitemapData.push({
          url: `${baseUrl}/${citySlug}/${segSlug}`,
          lastModified: new Date(),
          changeFrequency: 'daily',
          priority: 0.9,
        });
      });
    }

    // 2. Busca clientes ativos para suas páginas de perfil
    const clientsRes = await fetch(`${apiUrl}/public/sitemap-data`, { cache: 'no-store' });
    if (clientsRes.ok) {
      const clients = await clientsRes.json();
      clients.forEach((client: { id: string | number, slug: string | null, updated_at: string }) => {
        const slug = client.slug || client.id;
        sitemapData.push({
          url: `${baseUrl}/cliente/${slug}`,
          lastModified: new Date(client.updated_at),
          changeFrequency: 'weekly',
          priority: 0.7,
        });
      });
    }
  } catch (error) {
    console.error("Error generating sitemap:", error);
  }

  return sitemapData;
}
