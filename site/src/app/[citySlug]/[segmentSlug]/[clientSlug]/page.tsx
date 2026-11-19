import api from '@/services/api';
import { Metadata } from 'next';
import ClientProfileClient from '@/app/cliente/[id]/ClientProfileClient';
import { notFound, permanentRedirect } from 'next/navigation';
import { slugify } from '@/utils/slugify';
import { getSchemaLocalBusinessType, formatOpeningHoursSpecification } from '@/utils/schemaOrg';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.overmelhinho.com.br';

// Função auxiliar para formatar slugs em nomes legíveis (fallback)
function formatSlug(slug: string) {
    return slug
        .replace(/^-+|-+$/g, '')
        .split('-')
        .filter(Boolean)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function buildSeoTitleAndDescription(client: any, targetCityName: string, uf: string, primarySegmentName: string) {
    const cleanCompanyName = (client.nome_fantasia || '').trim();
    const cleanCity = (targetCityName || '').trim();
    const cleanSegment = (primarySegmentName || '').trim();

    // Evita duplicar a cidade se ela já estiver no nome fantasia (ex: "Vida Card Cartão de Saúde - Farroupilha")
    const companyHasCity = cleanCity && cleanCompanyName.toLowerCase().includes(cleanCity.toLowerCase());
    const nameWithLocation = companyHasCity
        ? `${cleanCompanyName} (${uf})`
        : (cleanCity ? `${cleanCompanyName} em ${cleanCity} - ${uf}` : cleanCompanyName);

    const secondarySegments = (client.segmentos || [])
        .slice(1, 3)
        .map((s: any) => (s.nome || '').trim())
        .filter(Boolean);

    const segmentContext = [cleanSegment, ...secondarySegments].filter(Boolean).join(', ');

    const defaultTitle = cleanSegment
        ? `${nameWithLocation} | ${cleanSegment} | O Vermelhinho`
        : `${nameWithLocation} | O Vermelhinho`;

    // Só utiliza seo_title salvo no banco se não for um texto genérico e contiver pelo menos a primeira palavra relevante do nome fantasia
    const firstWord = cleanCompanyName.split(/[\s-]+/).find((w: string) => w.length > 2)?.toLowerCase() || '';
    const hasValidCustomTitle = client.seo_title &&
        !client.seo_title.toLowerCase().includes('descubra o vermelhinho') &&
        (firstWord ? client.seo_title.toLowerCase().includes(firstWord) : true);

    const title = hasValidCustomTitle ? client.seo_title : defaultTitle;

    // Monta uma meta description rica usando endereço, telefone e descrição real
    const addr = client.enderecos?.[0];
    const streetPart = addr && !addr.exibir_apenas_cidade && addr.rua
        ? `${addr.rua}${addr.numero ? `, ${addr.numero}` : ''}${addr.bairro ? ` - ${addr.bairro}` : ''}, ${cleanCity}/${uf}. `
        : (cleanCity ? `Atendimento em ${cleanCity} - ${uf}. ` : '');

    const rawDesc = (client.descricao || '')
        .replace(/[\r\n*#]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    let defaultDescription = '';
    if (rawDesc.length > 20) {
        const snippet = rawDesc.length > 115 ? `${rawDesc.substring(0, 112).trim()}...` : rawDesc;
        defaultDescription = `${cleanCompanyName}: ${ streetPart }${snippet}`;
    } else {
        defaultDescription = `${cleanCompanyName} em ${cleanCity} - ${uf}. Especialista em ${segmentContext || cleanSegment}. ${streetPart}Confira telefone, WhatsApp, endereço e avaliações no O Vermelhinho.`;
    }

    const hasValidCustomDesc = client.seo_description &&
        !client.seo_description.toLowerCase().includes('oportunidades imperdíveis esperam por você') &&
        (firstWord ? client.seo_description.toLowerCase().includes(firstWord) : true);

    const description = hasValidCustomDesc ? client.seo_description : defaultDescription.substring(0, 165);
    const h1Title = `${nameWithLocation}${cleanSegment ? ` - ${cleanSegment}` : ''}`;

    return { title, description, h1Title };
}

async function getClient(slug: string) {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://dash.overmelhinho.com.br/api/v1';
        const response = await fetch(`${baseUrl}/public/clientes/${slug}`, {
            headers: {
                'Accept': 'application/json',
            },
            next: { revalidate: 3600, tags: ['client-' + slug] } // Cache com Tag para Webhook
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
            if (response.status === 404 && data?.redirect_suggestion) {
                return { is_inactive_redirect: true, redirect_suggestion: data.redirect_suggestion };
            }
            return null;
        }
        
        return data?.data || null;
    } catch (e) {
        return null;
    }
}

function getCanonicalParams(client: any, currentCitySlug: string, currentSegmentSlug: string) {
    const address = client.enderecos?.[0] || {};
    const mainCityName = (address.cidade || '').trim();
    const firstAttendedCity = (client.cidades_atendidas?.[0]?.nome || '').trim();
    const defaultCityName = mainCityName || firstAttendedCity || '';
    const cleanCitySlugParam = slugify(currentCitySlug);
    const cleanSegmentSlugParam = slugify(currentSegmentSlug);

    let targetCityName = defaultCityName;
    let targetCitySlug = defaultCityName ? slugify(defaultCityName) : 'cidade';

    if (cleanCitySlugParam) {
        const isMainCity = mainCityName && slugify(mainCityName) === cleanCitySlugParam;
        const attendedCity = client.cidades_atendidas?.find((c: any) => slugify(c.nome) === cleanCitySlugParam);
        if (isMainCity || attendedCity) {
            targetCityName = isMainCity ? mainCityName : attendedCity.nome.trim();
            targetCitySlug = cleanCitySlugParam;
        }
    }

    const primarySegment = client.segmentos?.find((s: any) => s.pivot?.is_primary || s.is_primary) || client.segmentos?.[0];
    const canonicalSegmentSlug = primarySegment 
        ? slugify(primarySegment.slug || primarySegment.nome) 
        : cleanSegmentSlugParam;
    const canonicalClientSlug = String(client.slug || client.id);

    return {
        targetCityName,
        targetCitySlug,
        canonicalSegmentSlug,
        canonicalClientSlug,
        primarySegment,
        address,
        uf: (address.estado || 'RS').trim(),
    };
}

export async function generateMetadata({ params }: { params: Promise<{ citySlug: string, segmentSlug: string, clientSlug: string }> }): Promise<Metadata> {
    const { citySlug, segmentSlug, clientSlug } = await params;
    const client = await getClient(clientSlug);
    
    if (!client || client.is_inactive_redirect) return { title: 'O Vermelhinho | Guia de Empresas' };

    const {
        targetCityName,
        targetCitySlug,
        canonicalSegmentSlug,
        canonicalClientSlug,
        primarySegment,
        uf
    } = getCanonicalParams(client, citySlug, segmentSlug);

    const segmentName = (primarySegment?.nome || formatSlug(slugify(segmentSlug))).trim();
    const { title, description } = buildSeoTitleAndDescription(client, targetCityName, uf, segmentName);
    const canonicalUrl = `${SITE_URL}/${targetCitySlug}/${canonicalSegmentSlug}/${canonicalClientSlug}`;

    return {
        title,
        description,
        keywords: [client.nome_fantasia, targetCityName, segmentName, uf, ...(client.seo_keywords || [])].filter(Boolean).join(', '),
        alternates: {
            canonical: canonicalUrl,
        },
        openGraph: {
            title,
            description,
            url: canonicalUrl,
            siteName: 'O Vermelhinho',
            locale: 'pt_BR',
            images: [client.logotipo_url, client.banner_url, client.galeria?.[0]?.url].filter(Boolean).map(url => url as string),
            type: 'website',
        }
    };
}

export default async function Page({ params }: { params: Promise<{ citySlug: string, segmentSlug: string, clientSlug: string }> }) {
    const { citySlug, segmentSlug, clientSlug } = await params;
    const client = await getClient(clientSlug);

    if (!client) {
        notFound();
    }

    if (client.is_inactive_redirect) {
        if (client.redirect_suggestion?.city_slug && client.redirect_suggestion?.segment_slug) {
            const { city_slug, segment_slug } = client.redirect_suggestion;
            permanentRedirect(`/${slugify(city_slug)}/${slugify(segment_slug)}`);
        } else {
            notFound();
        }
    }

    const {
        targetCityName,
        targetCitySlug,
        canonicalSegmentSlug,
        canonicalClientSlug,
        primarySegment,
        address,
        uf
    } = getCanonicalParams(client, citySlug, segmentSlug);

    // Redirecionamento permanente estrito (301):
    // Garante que cidade, segmento e slug da empresa coincidam exatamente com os valores canônicos
    if (citySlug !== targetCitySlug || segmentSlug !== canonicalSegmentSlug || clientSlug !== canonicalClientSlug) {
        permanentRedirect(`/${targetCitySlug}/${canonicalSegmentSlug}/${canonicalClientSlug}`);
    }

    const segmentName = (primarySegment?.nome || formatSlug(canonicalSegmentSlug)).trim();
    const { h1Title, description } = buildSeoTitleAndDescription(client, targetCityName, uf, segmentName);
    const canonicalUrl = `${SITE_URL}/${targetCitySlug}/${canonicalSegmentSlug}/${canonicalClientSlug}`;

    // Esquemas JSON-LD para SEO (Hierarquia Completa de 4 Níveis: Home -> Cidade -> Segmento -> Empresa)
    const breadcrumbJsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": SITE_URL
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": targetCityName,
                "item": `${SITE_URL}/${targetCitySlug}`
            },
            {
                "@type": "ListItem",
                "position": 3,
                "name": `${segmentName} em ${targetCityName}`,
                "item": `${SITE_URL}/${targetCitySlug}/${canonicalSegmentSlug}`
            },
            {
                "@type": "ListItem",
                "position": 4,
                "name": client.nome_fantasia,
                "item": canonicalUrl
            }
        ]
    };

    const sameAsLinks = (client.redes_sociais || client.redesSociais || [])
        .map((r: any) => r.url)
        .filter((u: any) => typeof u === 'string' && u.startsWith('http'));

    const allSegmentNames = (client.segmentos || []).map((s: any) => (s.nome || '').trim()).filter(Boolean);
    const primaryPhoneNumber = client.contatos?.[0]?.telefone_principal || client.contatos?.[0]?.celular || '';
    const specificType = getSchemaLocalBusinessType(segmentName, allSegmentNames);
    const schemaTypes = specificType === 'LocalBusiness' ? 'LocalBusiness' : ['LocalBusiness', specificType];
    const openingHoursSpec = formatOpeningHoursSpecification(client.horario_atendimento, client.is_horario_marcado);

    const catalogItems: any[] = [];
    if (client.portfolio_url) {
        catalogItems.push({
            "@type": "Offer",
            "itemOffered": {
                "@type": "Service",
                "name": `Apresentação Comercial e Portfólio de Marcas de ${client.nome_fantasia}`,
                "url": client.portfolio_url
            }
        });
    }
    allSegmentNames.slice(0, 5).forEach((seg: string) => {
        catalogItems.push({
            "@type": "Offer",
            "itemOffered": {
                "@type": "Service",
                "name": seg
            }
        });
    });

    const offerCatalog = catalogItems.length > 0 ? {
        "@type": "OfferCatalog",
        "name": `Catálogo de Produtos e Serviços de ${client.nome_fantasia}`,
        "itemListElement": catalogItems
    } : undefined;

    const localBusinessJsonLd = client.enderecos?.length > 0 
        ? client.enderecos.map((end: any, index: number) => ({
            "@context": "https://schema.org",
            "@type": schemaTypes,
            "@id": `${canonicalUrl}#localbusiness-${index + 1}`,
            "name": client.enderecos.length > 1 ? `${client.nome_fantasia} - ${end.nome_unidade || `Unidade ${index + 1}`}` : client.nome_fantasia,
            "alternateName": client.razao_social || undefined,
            "image": [client.logotipo_url, client.banner_url, ...(client.galeria?.map((g: any) => g.url) || [])].filter(Boolean),
            "description": client.descricao || description,
            "address": {
                "@type": "PostalAddress",
                "streetAddress": end.exibir_apenas_cidade ? undefined : `${end.rua || ''}${end.numero ? `, ${end.numero}` : ''}${end.complemento ? ` - ${end.complemento}` : ''}`,
                "addressLocality": (end.cidade || targetCityName).trim(),
                "addressRegion": (end.estado || uf).trim(),
                "postalCode": end.exibir_apenas_cidade ? undefined : (end.cep || ''),
                "addressCountry": "BR"
            },
            "geo": (end.latitude && !end.exibir_apenas_cidade) ? {
                "@type": "GeoCoordinates",
                "latitude": end.latitude,
                "longitude": end.longitude
            } : undefined,
            "url": canonicalUrl,
            "telephone": (index === 0 ? primaryPhoneNumber : end.telefone) || undefined,
            "sameAs": sameAsLinks.length > 0 ? sameAsLinks : undefined,
            "knowsAbout": allSegmentNames.length > 0 ? allSegmentNames : undefined,
            "hasOfferCatalog": offerCatalog,
            "openingHoursSpecification": openingHoursSpec,
            "areaServed": client.cidades_atendidas?.length > 0 ? client.cidades_atendidas.map((c: any) => ({
                "@type": "City",
                "name": c.nome,
                "addressRegion": c.uf || "RS",
                "addressCountry": "BR"
            })) : undefined,
        }))
        : [{
            "@context": "https://schema.org",
            "@type": schemaTypes,
            "@id": `${canonicalUrl}#localbusiness`,
            "name": client.nome_fantasia,
            "alternateName": client.razao_social || undefined,
            "image": [client.logotipo_url, client.banner_url, ...(client.galeria?.map((g: any) => g.url) || [])].filter(Boolean),
            "description": client.descricao || description,
            "url": canonicalUrl,
            "telephone": primaryPhoneNumber || undefined,
            "sameAs": sameAsLinks.length > 0 ? sameAsLinks : undefined,
            "knowsAbout": allSegmentNames.length > 0 ? allSegmentNames : undefined,
            "hasOfferCatalog": offerCatalog,
            "openingHoursSpecification": openingHoursSpec,
            "areaServed": client.cidades_atendidas?.length > 0 ? client.cidades_atendidas.map((c: any) => ({
                "@type": "City",
                "name": c.nome,
                "addressRegion": c.uf || "RS",
                "addressCountry": "BR"
            })) : undefined,
        }];

    return (
        <>
            <script
                type="application/ld+json"
                {...{ ['dangerously' + 'SetInnerHTML']: { __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, '\\u003c') } }}
            />
            {localBusinessJsonLd && (
                <script
                    type="application/ld+json"
                    {...{ ['dangerously' + 'SetInnerHTML']: { __html: JSON.stringify(localBusinessJsonLd).replace(/</g, '\\u003c') } }}
                />
            )}
            <ClientProfileClient initialClient={client} />
        </>
    );
}
