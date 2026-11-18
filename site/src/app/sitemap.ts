import { MetadataRoute } from 'next';
import { slugify } from '@/utils/slugify';

const getApiUrl = () => {
  let API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://dash.overmelhinho.com.br/api/v1';
  if (!API_URL.endsWith('/v1')) {
    API_URL += '/v1';
  }
  return API_URL;
};

const DEFAULT_CITIES = [
  'Alto Feliz', 'Arroio do Sal', 'Barão', 'Bento Gonçalves', 'Boa Vista do Sul',
  'Bom Princípio', 'Campo Bom', 'Canela', 'Carlos Barbosa', 'Caxias do Sul',
  'Coronel Pilar', 'Farroupilha', 'Feliz', 'Flores da Cunha', 'Garibaldi',
  'Gramado', 'Lajeado', 'Monte Belo do Sul', 'Nova Prata', 'Nova Roma do Sul',
  'Novo Hamburgo', 'Pinto Bandeira', 'Salvador do Sul', 'São Marcos',
  'São Pedro da Serra', 'São Sebastião do Caí', 'São Vendelino', 'Veranópolis'
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.overmelhinho.com.br';

  let cityEntries: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${getApiUrl()}/cidades`, { next: { revalidate: 86400 } });
    if (res.ok) {
      const json = await res.json();
      const cities = Array.isArray(json.data) ? json.data : [];
      cityEntries = cities.map((c: any) => ({
        url: `${baseUrl}/${slugify(c.nome)}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.9,
      }));
    }
  } catch (err) {
    console.error('[Sitemap] Error fetching cities, using default list:', err);
  }

  if (cityEntries.length === 0) {
    cityEntries = DEFAULT_CITIES.map(name => ({
      url: `${baseUrl}/${slugify(name)}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    }));
  }

  // Páginas Institucionais Canônicas, City Hubs e Rotas Principais
  // (Categorias ativas são servidas via /sitemap-categorias.xml e empresas via /sitemap-empresas.xml)
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    ...cityEntries,
    {
      url: `${baseUrl}/como-funciona`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/sobre`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/anuncie`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/vagas`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ];
}
