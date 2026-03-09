import api from '@/services/api';
import { Metadata } from 'next';
import ClientProfileClient from './ClientProfileClient';

// 🔍 SEO Dinâmico: Título, Descrição e Keywords baseadas na empresa real
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
    try {
        const id = params.id;
        const res = await api.get(`/public/clientes/${id}`);
        const client = res.data.data;

        const city = client.enderecos?.[0]?.cidade || '';
        const segment = client.segmentos?.[0]?.nome || '';
        const title = `${client.nome_fantasia} em ${city} | ${segment} | O Vermelhinho`;
        const description = client.descricao?.substring(0, 160) || `Encontre ${client.nome_fantasia} em ${city}. Confira fotos, contatos, horários e vagas de emprego no guia O Vermelhinho.`;

        return {
            title,
            description,
            keywords: [client.nome_fantasia, city, segment, ...(client.seo_keywords || [])].join(', '),
            openGraph: {
                title,
                description,
                images: [client.logotipo_url || client.galeria?.[0]?.url || ''],
                type: 'website',
            },
            alternates: {
                canonical: `https://www.overmelhinho.com.br/cliente/${client.slug || client.id}`,
            }
        };
    } catch (e) {
        return { title: 'O Vermelhinho | Guia de Empresas' };
    }
}

export default function Page() {
    return <ClientProfileClient />;
}
