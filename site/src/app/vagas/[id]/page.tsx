import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { slugify } from '@/utils/slugify';
import JobDetailClient from './JobDetailClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.overmelhinho.com.br';

const formatStorageUrl = (url?: string) => {
    if (!url) return undefined;
    if (url.startsWith('http')) return url;
    if (url.startsWith('v1/object/public/')) return `https://spefwgjsltjryxcizype.supabase.co/storage/${url}`;
    return `https://api.overmelhinho.com.br/storage/${url}`;
};

interface Job {
    id: number;
    title: string;
    company: string;
    location: string;
    salary: string;
    salaryNum: number;
    type: 'CLT' | 'PJ' | 'Freelancer' | 'Estágio';
    date: string;
    daysAgo: number;
    tags: string[];
    category: string;
    desc: string;
    requirements: string[];
    benefits: string[];
    contact: string;
    logo?: string;
    timestamp: number;
    clientSlug?: string;
    whatsapp?: string | null;
}

async function getJob(id: string) {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://dash.overmelhinho.com.br/api/v1';
        const response = await fetch(`${baseUrl}/jobs/public/${id}`, {
            headers: {
                'Accept': 'application/json',
            },
            next: { revalidate: 60 } // Cache com revalidação de 60 segundos
        });

        if (!response.ok) return null;
        
        const data = await response.json();
        return data; // O endpoint público retorna a vaga diretamente
    } catch (e) {
        console.error("Erro ao buscar vaga no servidor:", e);
        return null;
    }
}

// 🔍 SEO Dinâmico: Título, Descrição, OG e Canonical
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const numericId = id.split('-')[0];
    const job = await getJob(numericId);

    if (!job) {
        return {
            title: 'Vaga não encontrada | O Vermelhinho',
            description: 'A vaga de emprego buscada não está mais ativa ou foi removida.'
        };
    }

    const companyName = job.client?.nome_fantasia || 'Empresa Confidencial';
    const jobCity = job.city || 'Farroupilha';
    const jobTitle = job.title;

    // Título no padrão semântico otimizado para busca
    const title = `${jobTitle} em ${jobCity} - RS: ${companyName} | O Vermelhinho`;
    
    // Descrição limpa de tags HTML
    const cleanDesc = job.description ? job.description.replace(/<[^>]*>/g, '').substring(0, 160).trim() : '';
    const description = cleanDesc || `Confira a vaga de ${jobTitle} na empresa ${companyName} em ${jobCity}. Veja requisitos e envie seu currículo no Vermelhinho.`;
    
    const canonicalUrl = `${SITE_URL}/vagas/${job.id}-${slugify(jobTitle)}`;

    return {
        title,
        description,
        keywords: [jobTitle, companyName, jobCity, job.hiring_type, job.work_model, 'vagas de emprego', 'Farroupilha'].filter(Boolean).join(', '),
        openGraph: {
            title,
            description,
            type: 'website',
            images: job.client?.logo_url ? [
                formatStorageUrl(job.client.logo_url) as string
            ] : [],
        },
        alternates: {
            canonical: canonicalUrl,
        }
    };
}

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const numericId = id.split('-')[0];
    const j = await getJob(numericId);

    // Se a vaga não existe
    if (!j) {
        return (
            <div className="min-h-screen bg-cloud-dancer pt-20 md:pt-36 flex flex-col items-center justify-center max-w-lg mx-auto px-6 text-center space-y-6">
                <div className="text-5xl">⚠️</div>
                <h3 className="font-black text-2xl text-gray-900">Vaga Não Encontrada</h3>
                <p className="text-gray-500 font-medium">Esta vaga de emprego não está ativa ou não existe mais.</p>
                <a
                    href="/vagas"
                    className="bg-brand-red text-white px-8 py-3 rounded-xl font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg text-center"
                >
                    Voltar para Vagas
                </a>
            </div>
        );
    }

    // 🔄 REDIRECIONAMENTO CANONICAL / URL AMIGÁVEL
    const expectedSlug = `${j.id}-${slugify(j.title)}`;
    if (id !== expectedSlug) {
        redirect(`/vagas/${expectedSlug}`);
    }

    // Mapeamento dos dados
    const mappedJob: Job = {
        id: j.id,
        title: j.title,
        company: j.client?.nome_fantasia || 'Empresa Confidencial',
        location: j.city || 'Não informado',
        salary: j.salary_range || 'A combinar',
        salaryNum: parseInt(String(j.salary_range).replace(/\D/g, '')) || 0,
        type: j.hiring_type || 'CLT',
        date: j.published_at ? new Date(j.published_at).toLocaleDateString('pt-BR') : 'Recente',
        timestamp: j.published_at ? new Date(j.published_at).getTime() : new Date().getTime(),
        daysAgo: j.published_at ? Math.floor((new Date().getTime() - new Date(j.published_at).getTime()) / (1000 * 3600 * 24)) : 0,
        tags: [j.work_model, j.role, j.education_level].filter(Boolean),
        category: j.area || 'Outros',
        desc: j.description || 'Sem descrição.',
        requirements: j.experience_required ? [j.experience_required] : [],
        benefits: [],
        contact: j.contact_whatsapp || j.contact_email || 'Não informado',
        logo: formatStorageUrl(j.client?.logo_url),
        clientSlug: j.client?.slug,
        whatsapp: (j.contact_whatsapp) || (j.client?.contatos?.[0]?.whatsapp_selected) || (j.client?.contatos?.[0]?.exibir_tel_principal && j.client?.contatos?.[0]?.has_whatsapp_principal ? j.client?.contatos?.[0]?.telefone_principal : null) || (j.client?.contatos?.[0]?.exibir_celular && j.client?.contatos?.[0]?.has_whatsapp_celular ? j.client?.contatos?.[0]?.celular : null) || null,
    };

    const mapEmploymentType = (type: string) => {
        switch (type) {
            case 'CLT': return 'FULL_TIME';
            case 'PJ': return 'CONTRACTOR';
            case 'Freelancer': return 'TEMPORARY';
            case 'Estágio': return 'INTERN';
            default: return 'FULL_TIME';
        }
    };

    // Estruturação de dados estruturados (JobPosting) do Google
    const salaryNum = mappedJob.salaryNum;
    const baseSalaryJsonLd = salaryNum > 0 ? {
        "baseSalary": {
            "@type": "MonetaryAmount",
            "currency": "BRL",
            "value": {
                "@type": "QuantitativeValue",
                "value": salaryNum,
                "unitText": "MONTH"
            }
        }
    } : {};

    const jobPostingJsonLd = {
        "@context": "https://schema.org",
        "@type": "JobPosting",
        "title": mappedJob.title,
        "description": mappedJob.desc,
        "datePosted": j.published_at || j.created_at || new Date().toISOString(),
        "hiringOrganization": {
            "@type": "Organization",
            "name": mappedJob.company,
            "sameAs": mappedJob.clientSlug ? `${SITE_URL}/cliente/${mappedJob.clientSlug}` : undefined,
            "logo": mappedJob.logo,
        },
        "jobLocation": {
            "@type": "Place",
            "address": {
                "@type": "PostalAddress",
                "addressLocality": mappedJob.location,
                "addressRegion": "RS",
                "addressCountry": "BR"
            }
        },
        "employmentType": mapEmploymentType(mappedJob.type),
        ...baseSalaryJsonLd
    };

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
                "name": "Vagas",
                "item": `${SITE_URL}/vagas`
            },
            {
                "@type": "ListItem",
                "position": 3,
                "name": mappedJob.title,
                "item": `${SITE_URL}/vagas/${expectedSlug}`
            }
        ]
    };

    const h1Title = `${mappedJob.title} em ${mappedJob.location} - RS: ${mappedJob.company}`;

    return (
        <>
            {/* 🤖 Dados Estruturados para o Google */}
            <script type="application/ld+json">
                {JSON.stringify(jobPostingJsonLd)}
            </script>
            <script type="application/ld+json">
                {JSON.stringify(breadcrumbJsonLd)}
            </script>

            {/* H1 para semântica do Google SEO */}
            <h1 className="sr-only">{h1Title}</h1>

            <JobDetailClient job={mappedJob} />
        </>
    );
}
