import { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://novo.overmelhinho.com.br';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/login', '/admin'],
        },
        sitemap: `${SITE_URL}/sitemap.xml`,
    };
}
