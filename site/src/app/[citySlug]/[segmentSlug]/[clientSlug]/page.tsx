import api from '@/services/api';
import { Metadata } from 'next';
import ClientProfileClient from '@/app/cliente/[id]/ClientProfileClient';
import { notFound, permanentRedirect } from 'next/navigation';
import { slugify } from '@/utils/slugify';

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

export async function generateMetadata({ params }: { params: Promise<{ citySlug: string, segmentSlug: string, clientSlug: string }> }): Promise<Metadata> {
    const { citySlug, segmentSlug, clientSlug } = await params;
    const cleanCitySlugParam = slugify(citySlug);
    const cleanSegmentSlugParam = slugify(segmentSlug);
    const client = await getClient(clientSlug);
    
    if (!client || client.is_inactive_redirect) return { title: 'O Vermelhinho | Guia de Empresas' };

    const address = client.enderecos?.[0] || {};
    const mainCityName = (address.cidade || '').trim();
    const uf = (address.estado || 'RS').trim();
    const primarySegment = client.segmentos?.find((s: any) => s.pivot?.is_primary) || client.segmentos?.[0];
    const segmentName = (primarySegment?.nome || formatSlug(cleanSegmentSlugParam)).trim();
    
    // SEO Strategy: Multi-City support
    let targetCityName = mainCityName;
    let targetCitySlug = mainCityName ? slugify(mainCityName) : 'cidade';

    if (cleanCitySlugParam) {
        const isMainCity = mainCityName && slugify(mainCityName) === cleanCitySlugParam;
        const attendedCity = client.cidades_atendidas?.find((c: any) => slugify(c.nome) === cleanCitySlugParam);
        
        if (isMainCity || attendedCity) {
            targetCityName = isMainCity ? mainCityName : attendedCity.nome.trim();
            targetCitySlug = cleanCitySlugParam;
        }
    }

    const canonicalSegmentSlug = primarySegment ? slugify(primarySegment.slug || primarySegment.nome) : cleanSegmentSlugParam;
    const { title, description } = buildSeoTitleAndDescription(client, targetCityName, uf, segmentName);
    const canonicalUrl = `${SITE_URL}/${targetCitySlug}/${canonicalSegmentSlug}/${client.slug || client.id}`;

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
        const { city_slug, segment_slug } = client.redirect_suggestion;
        permanentRedirect(`/${slugify(city_slug)}/${slugify(segment_slug)}`);
    }

    const address = client.enderecos?.[0] || {};
    const mainCityName = (address.cidade || '').trim();
    const uf = (address.estado || 'RS').trim();
    const primarySegment = client.segmentos?.find((s: any) => s.pivot?.is_primary) || client.segmentos?.[0];
    const cleanCitySlugParam = slugify(citySlug);
    const cleanSegmentSlugParam = slugify(segmentSlug);
    const segmentName = (primarySegment?.nome || formatSlug(cleanSegmentSlugParam)).trim();
    const canonicalSegmentSlug = primarySegment ? slugify(primarySegment.slug || primarySegment.nome) : cleanSegmentSlugParam;
    
    let targetCityName = mainCityName;
    let targetCitySlug = mainCityName ? slugify(mainCityName) : cleanCitySlugParam;
    
    if (cleanCitySlugParam) {
        const isMainCity = mainCityName && slugify(mainCityName) === cleanCitySlugParam;
        const attendedCity = client.cidades_atendidas?.find((c: any) => slugify(c.nome) === cleanCitySlugParam);
        
        if (isMainCity || attendedCity) {
            targetCityName = isMainCity ? mainCityName : attendedCity.nome.trim();
            targetCitySlug = cleanCitySlugParam;
        }
    }

    // Se a URL acessada tinha hífen extra (ex: /agendamento-de-consultas-/) ou um slug antigo da empresa (ex: jaqueline-perottoni-master-coach-elevass), redireciona 301 para a URL atualizada
    const canonicalClientSlug = String(client.slug || client.id);
    if (citySlug !== cleanCitySlugParam || segmentSlug !== cleanSegmentSlugParam || clientSlug !== canonicalClientSlug) {
        permanentRedirect(`/${targetCitySlug}/${cleanSegmentSlugParam}/${canonicalClientSlug}`);
    }

    const { h1Title, description } = buildSeoTitleAndDescription(client, targetCityName, uf, segmentName);
    const canonicalUrl = `${SITE_URL}/${targetCitySlug}/${canonicalSegmentSlug}/${client.slug || client.id}`;

    // Esquemas JSON-LD para SEO
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
                "name": `${segmentName} em ${targetCityName}`,
                "item": `${SITE_URL}/${targetCitySlug}/${canonicalSegmentSlug}`
            },
            {
                "@type": "ListItem",
                "position": 3,
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
    const fullStreetAddress = address && !address.exibir_apenas_cidade && address.rua
        ? `${address.tipo_logradouro ? `${address.tipo_logradouro} ` : ''}${address.rua}${address.numero ? `, ${address.numero}` : ''}${address.complemento ? ` (${address.complemento})` : ''}${address.bairro ? ` - Bairro ${address.bairro}` : ''}, ${targetCityName} - ${uf}${address.cep ? `, CEP ${address.cep}` : ''}`
        : `${targetCityName} - ${uf}`;

    // FAQ Dinâmico (Schema FAQPage) gerado 100% automaticamente a partir dos dados do cliente
    const faqQuestions: Array<{ question: string; answer: string }> = [];

    if (allSegmentNames.length > 0) {
        const cleanDescSnippet = (client.descricao || '')
            .replace(/[\r\n*#]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        faqQuestions.push({
            question: `Quais serviços e especialidades ${client.nome_fantasia} oferece em ${targetCityName}?`,
            answer: `${client.nome_fantasia} atua em ${targetCityName} (${uf}) nas áreas de: ${allSegmentNames.join(', ')}.${cleanDescSnippet ? ` ${cleanDescSnippet.substring(0, 280)}` : ''}`
        });
    }

    if (targetCityName) {
        faqQuestions.push({
            question: `Qual o endereço e onde encontrar ${client.nome_fantasia} em ${targetCityName}?`,
            answer: !address.exibir_apenas_cidade && address.rua
                ? `${client.nome_fantasia} está localizada em ${fullStreetAddress}.`
                : `${client.nome_fantasia} realiza atendimento na cidade de ${targetCityName} - ${uf}.`
        });
    }

    const cInfo = client.contatos?.[0];
    const isPayingClient = client.tipo_cliente === 'pagante';
    const rawContactPhones = cInfo ? [
        { number: cInfo.telefone_principal, show: cInfo.exibir_tel_principal !== false, isWhats: !!cInfo.has_whatsapp_principal && isPayingClient },
        { number: cInfo.telefone_secundario, show: cInfo.exibir_tel_secundario !== false, isWhats: !!cInfo.has_whatsapp_secundario && isPayingClient },
        { number: cInfo.celular, show: cInfo.exibir_celular !== false, isWhats: !!cInfo.has_whatsapp_celular && isPayingClient },
        { number: cInfo.telefone_outro, show: cInfo.exibir_tel_outro !== false, isWhats: !!cInfo.has_whatsapp_outro && isPayingClient },
    ].filter(p => p.number && p.show) : [];

    const whatsappPhoneList = rawContactPhones.filter(p => p.isWhats).map(p => p.number);
    const regularPhoneList = rawContactPhones.filter(p => !p.isWhats).map(p => p.number);

    if (rawContactPhones.length > 0 || (client.cidades_atendidas && client.cidades_atendidas.length > 0)) {
        const otherCities = (client.cidades_atendidas || [])
            .map((c: any) => (c.nome || '').trim())
            .filter((nome: string) => nome && nome.toLowerCase() !== targetCityName.toLowerCase());
        const citiesSentence = otherCities.length > 0
            ? (targetCityName ? ` Além de ${targetCityName}, também atende clientes de ${otherCities.join(', ')}.` : ` Atende clientes de ${otherCities.join(', ')}.`)
            : (targetCityName ? ` Atende clientes em ${targetCityName}.` : '');

        let contactSentence = `Você pode solicitar atendimento com ${client.nome_fantasia} diretamente pelo Guia O Vermelhinho.`;
        if (regularPhoneList.length > 0 && whatsappPhoneList.length > 0) {
            contactSentence = `Você pode falar diretamente com a equipe pelo telefone ${regularPhoneList.join(' / ')} ou pelo WhatsApp ${whatsappPhoneList.join(' e ')}.`;
        } else if (whatsappPhoneList.length > 0) {
            contactSentence = `Você pode falar diretamente com a equipe pelo telefone/WhatsApp ${whatsappPhoneList.join(' e ')}.`;
        } else if (regularPhoneList.length > 0) {
            contactSentence = `Você pode falar diretamente com a equipe pelo telefone ${regularPhoneList.join(' / ')}.`;
        }

        faqQuestions.push({
            question: `Como entrar em contato ou agendar atendimento em ${client.nome_fantasia}?`,
            answer: `${contactSentence}${citiesSentence}`
        });
    }

    const faqJsonLd = faqQuestions.length > 0 ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqQuestions.map(q => ({
            "@type": "Question",
            "name": q.question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": q.answer
            }
        }))
    } : null;

    const localBusinessJsonLd = client.enderecos?.length > 0 
        ? client.enderecos.map((end: any, index: number) => ({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
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
            "telephone": (index === 0 ? primaryPhoneNumber : end.telefone),
            "sameAs": sameAsLinks.length > 0 ? sameAsLinks : undefined,
            "knowsAbout": allSegmentNames.length > 0 ? allSegmentNames : undefined,
            "areaServed": client.cidades_atendidas?.length > 0 ? client.cidades_atendidas.map((c: any) => ({
                "@type": "City",
                "name": c.nome,
                "addressRegion": c.uf || "RS",
                "addressCountry": "BR"
            })) : undefined,
        }))
        : null;

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
            {faqJsonLd && (
                <script
                    type="application/ld+json"
                    {...{ ['dangerously' + 'SetInnerHTML']: { __html: JSON.stringify(faqJsonLd).replace(/</g, '\\u003c') } }}
                />
            )}
            <ClientProfileClient initialClient={client} />
        </>
    );
}
