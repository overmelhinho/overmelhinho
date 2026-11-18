'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
    HelpCircle, 
    CheckCircle2, 
    Sparkles, 
    ChevronDown, 
    Building2, 
    MapPin, 
    Lightbulb,
    ShieldCheck,
    MessageCircle
} from 'lucide-react';

interface ClientItem {
    id: number | string;
    nome_fantasia: string;
    slug?: string;
    enderecos?: Array<{
        bairro?: string;
        rua?: string;
        numero?: string;
        cidade?: string;
    }>;
    contatos?: Array<{
        telefone_principal?: string;
        celular?: string;
        whatsapp?: string;
    }>;
}

interface DynamicSeoTextProps {
    cityName: string;
    citySlug?: string;
    segmentName: string;
    segmentSlug?: string;
    clientCount?: number;
    clients?: ClientItem[];
}

type DomainType = 
    | 'GASTRONOMY'
    | 'HEALTH'
    | 'AUTOMOTIVE'
    | 'LEGAL_FINANCIAL'
    | 'BEAUTY_WELLNESS'
    | 'CONSTRUCTION'
    | 'RETAIL'
    | 'PET'
    | 'EDUCATION'
    | 'DEFAULT';

function normalize(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}

function detectDomain(segmentName: string): DomainType {
    const s = normalize(segmentName);

    if (['restaurante', 'pizzaria', 'lanche', 'hamburgueria', 'cafe', 'bar', 'doces', 'padaria', 'confeitaria', 'galeteria', 'churrascaria', 'sushi', 'gastronomia'].some(k => s.includes(k))) {
        return 'GASTRONOMY';
    }
    if (['dentista', 'odontolog', 'medico', 'clinica', 'saude', 'fisiotera', 'psicolog', 'farmacia', 'nutricao', 'laboratorio', 'hospital'].some(k => s.includes(k))) {
        return 'HEALTH';
    }
    if (['mecanica', 'oficina', 'auto', 'carro', 'pneu', 'borracharia', 'chapea', 'funilaria', 'veiculo', 'troca de oleo', 'suspensao', 'eletrica automotiva'].some(k => s.includes(k))) {
        return 'AUTOMOTIVE';
    }
    if (['advocacia', 'advogado', 'juridic', 'contabil', 'contador', 'contabilidade', 'imobiliaria', 'seguro', 'banco', 'financeira'].some(k => s.includes(k))) {
        return 'LEGAL_FINANCIAL';
    }
    if (['salao de beleza', 'cabeleireir', 'barbearia', 'estetica', 'manicure', 'podologia', 'academia', 'fitness', 'pilates', 'massagem', 'spa'].some(k => s.includes(k))) {
        return 'BEAUTY_WELLNESS';
    }
    if (['construcao', 'reforma', 'serralheria', 'vidracaria', 'pintura', 'eletricista', 'encanador', 'marcenaria', 'arquitetura', 'engenharia'].some(k => s.includes(k))) {
        return 'CONSTRUCTION';
    }
    if (['vestuario', 'roupa', 'calcado', 'moveis', 'decoracao', 'otica', 'joalheria', 'loja', 'presentes', 'bazar', 'supermercado', 'mercado'].some(k => s.includes(k))) {
        return 'RETAIL';
    }
    if (['pet', 'veterinari', 'agropecuaria', 'racao', 'banho e tosa'].some(k => s.includes(k))) {
        return 'PET';
    }
    if (['escola', 'colegio', 'educacao', 'creche', 'curso', 'idiomas'].some(k => s.includes(k))) {
        return 'EDUCATION';
    }
    return 'DEFAULT';
}

interface DomainContent {
    introTitle: string;
    introParagraph: string;
    tipsTitle: string;
    tips: Array<{ title: string; desc: string }>;
    faqs: Array<{ question: string; answer: string }>;
}

function buildDomainContent(domain: DomainType, segmentName: string, cityName: string): DomainContent {
    switch (domain) {
        case 'GASTRONOMY':
            return {
                introTitle: `Gastronomia e Sabores: Guia de ${segmentName} em ${cityName}`,
                introParagraph: `A tradição gastronômica da Serra Gaúcha se reflete na diversidade de ${segmentName} em ${cityName}. Os estabelecimentos reúnem receitas tradicionais, ambientes aconchegantes para famílias e opções práticas com serviço de entrega (delivery) e retirada no balcão. Seja para um almoço executivo, jantar especial ou lanche rápido, você encontra o cardápio ideal com comodidade.`,
                tipsTitle: `Dicas para sua experiência gastronômica em ${cityName}`,
                tips: [
                    { title: 'Consulte os Horários e Dias de Abertura', desc: 'Muitos restaurantes e estabelecimentos operam com horários diferenciados aos fins de semana e feriados.' },
                    { title: 'Atendimento Rápido via WhatsApp', desc: 'Faça reservas de mesa ou consulte o cardápio digital do dia enviando mensagem diretamente para os estabelecimentos listados.' },
                    { title: 'Delivery e Retirada Local', desc: 'Verifique as opções de entrega nos bairros da cidade para saborear seus pratos favoritos onde estiver.' }
                ],
                faqs: [
                    {
                        question: `Como pedir delivery ou reservar mesa em ${segmentName} em ${cityName}?`,
                        answer: `Basta clicar no botão de WhatsApp ou telefone presente no perfil da empresa no Guia O Vermelhinho. Você falará diretamente com o atendente do estabelecimento, sem taxas intermediárias.`
                    },
                    {
                        question: `Quais os horários de atendimento de ${segmentName} em ${cityName}?`,
                        answer: `Os horários variam por estabelecimento. No perfil de cada empresa no Guia O Vermelhinho, você pode conferir a tabela completa de horários de funcionamento de segunda a domingo.`
                    },
                    {
                        question: `Como avaliar ou indicar estabelecimentos de ${segmentName} na região?`,
                        answer: `No perfil da empresa, clientes podem conferir avaliações reais e registrar feedbacks sobre a qualidade do atendimento e produtos oferecidos.`
                    }
                ]
            };

        case 'HEALTH':
            return {
                introTitle: `Saúde e Cuidados Especializados: ${segmentName} em ${cityName}`,
                introParagraph: `O acesso a profissionais qualificados de ${segmentName} em ${cityName} é fundamental para a prevenção, diagnóstico e bem-estar de toda a família. O município conta com consultórios modernos, clínicas equipadas e especialistas dedicados a proporcionar um atendimento humanizado e seguro.`,
                tipsTitle: `Orientações para o seu atendimento em ${cityName}`,
                tips: [
                    { title: 'Agendamento Prévia de Consultas', desc: 'Entre em contato com antecedência para garantir os melhores horários e verificar disponibilidade de datas.' },
                    { title: 'Documentos e Histórico Clínico', desc: 'Mantenha em mãos exames anteriores e anote sintomas ou dúvidas para otimizar sua consulta.' },
                    { title: 'Localização e Facilidade de Acesso', desc: 'Consulte o endereço exato e proximidade com vias de fácil estacionamento nos bairros da cidade.' }
                ],
                faqs: [
                    {
                        question: `Como marcar uma consulta de ${segmentName} em ${cityName}?`,
                        answer: `Acesse o perfil do profissional ou clínica no Guia O Vermelhinho e clique em WhatsApp ou Telefone para agendar seu horário diretamente com a recepção.`
                    },
                    {
                        question: `Os estabelecimentos atendem por convênio ou particular?`,
                        answer: `Cada clínica possui sua própria política de convênios médicos e odontológicos ou atendimento particular. Recomendamos confirmar as parcerias no momento do contato.`
                    },
                    {
                        question: `Onde encontrar endereços e horários de atendimento na cidade?`,
                        answer: `Todas as empresas listadas possuem seus endereços físicos, mapas interativos e horários semanais especificados em seus perfis no portal.`
                    }
                ]
            };

        case 'AUTOMOTIVE':
            return {
                introTitle: `Serviços Automotivos e Manutenção: ${segmentName} em ${cityName}`,
                introParagraph: `Manter o veículo em perfeitas condições é essencial para a segurança nas estradas e serras da nossa região. Em ${cityName}, as empresas de ${segmentName} oferecem diagnósticos precisos, profissionais experientes e tecnologia para reparos mecânicos, elétricos e preventivos em veículos leves e pesados.`,
                tipsTitle: `Boas práticas para cuidar do seu carro em ${cityName}`,
                tips: [
                    { title: 'Manutenção Preventiva Regular', desc: 'Realize revisões periódicas de freios, suspensão, óleo e pneus, especialmente antes de viajar pelas serras.' },
                    { title: 'Orçamento Detalhado com Peças e Mão de Obra', desc: 'Solicite clareza prévia sobre os itens substituídos e prazos de entrega do serviço.' },
                    { title: 'Socorro e Atendimento Emergencial', desc: 'Mantenha os contatos de oficinas de confiança salvos para eventuais emergências mecânicas.' }
                ],
                faqs: [
                    {
                        question: `Como solicitar orçamento para serviços de ${segmentName} em ${cityName}?`,
                        answer: `Você pode enviar uma mensagem direta pelo WhatsApp para as oficinas cadastradas, descrevendo o modelo do seu veículo e o serviço necessário.`
                    },
                    {
                        question: `As oficinas oferecem garantia nos serviços mecânicos?`,
                        answer: `Sim, oficinas sérias e estabelecidas oferecem garantia legal e contratual sobre as peças aplicadas e a mão de obra realizada.`
                    },
                    {
                        question: `Onde encontrar oficinas com boa reputação em ${cityName}?`,
                        answer: `O Guia O Vermelhinho reúne as melhores oficinas mecânicas e automotivas da cidade com endereços verificados e canais de contato diretos.`
                    }
                ]
            };

        case 'LEGAL_FINANCIAL':
            return {
                introTitle: `Assessoria Profissional: ${segmentName} em ${cityName}`,
                introParagraph: `Tomar decisões com segurança jurídica, contábil e patrimonial exige profissionais credenciados e de confiança. Os escritórios de ${segmentName} em ${cityName} prestam consultoria personalizada para pessoas físicas, empreendedores e indústrias da Serra Gaúcha, garantindo conformidade legal e planejamento estratégico.`,
                tipsTitle: `Recomendações ao contratar assessoria em ${cityName}`,
                tips: [
                    { title: 'Profissionais Regularizados', desc: 'Verifique se os especialistas possuem inscrição ativa em seus respectivos conselhos de classe (OAB, CRC, CRECI).' },
                    { title: 'Reunião de Diagnóstico Inicial', desc: 'Agende uma conversa prévia para expor seu caso e alinhar expectativas e cronogramas.' },
                    { title: 'Transparência em Honorários e Custas', desc: 'Defina em contrato claro as etapas do trabalho e condições de honorários acordadas.' }
                ],
                faqs: [
                    {
                        question: `Como agendar uma reunião com especialistas de ${segmentName} em ${cityName}?`,
                        answer: `Utilize os canais de contato (WhatsApp ou telefone) listados no perfil do escritório no Guia O Vermelhinho para agendar seu atendimento presencial ou online.`
                    },
                    {
                        question: `Quais áreas de atuação são atendidas pelos escritórios locais?`,
                        answer: `No perfil de cada profissional você confere as especialidades detalhadas (trabalhista, cível, empresarial, tributário, imobiliário, etc.).`
                    },
                    {
                        question: `Os escritórios oferecem consultoria para micro e pequenas empresas?`,
                        answer: `Sim, a maioria das empresas de contabilidade e advocacia da região oferece planos e assessorias sob medida para MEIs, PMEs e grandes empresas.`
                    }
                ]
            };

        case 'BEAUTY_WELLNESS':
            return {
                introTitle: `Beleza, Estética e Bem-estar: ${segmentName} em ${cityName}`,
                introParagraph: `Cuidar da autoestima e do bem-estar físico é uma prioridade acessível em ${cityName}. Os profissionais e espaços de ${segmentName} contam com ambientes modernos, produtos de alta qualidade e procedimentos atualizados para valorizar sua imagem e proporcionar momentos de relaxamento.`,
                tipsTitle: `Dicas para o seu momento de autocuidado em ${cityName}`,
                tips: [
                    { title: 'Agende com Antecedência', desc: 'Garanta seu horário com seu profissional preferido, especialmente em sextas-feiras e sábados.' },
                    { title: 'Conheça o Portfólio de Trabalhos', desc: 'Consulte fotos e resultados de procedimentos para alinhar o estilo desejado.' },
                    { title: 'Produtos e Procedimentos Certificados', desc: 'Prefira espaços que utilizem cosméticos e equipamentos regularizados pelos órgãos de saúde.' }
                ],
                faqs: [
                    {
                        question: `Como agendar horário em espaços de ${segmentName} em ${cityName}?`,
                        answer: `Acesse o perfil do estabelecimento no Guia O Vermelhinho e envie uma mensagem direta no WhatsApp para escolher o melhor dia e horário.`
                    },
                    {
                        question: `Quais serviços complementares posso encontrar no mesmo local?`,
                        answer: `Muitos espaços oferecem pacotes completos combinando cabelo, barba, manicure, estética corporal e cuidados para noivas ou formandos.`
                    },
                    {
                        question: `Como chegar ao estabelecimento na cidade?`,
                        answer: `O perfil de cada empresa exibe o endereço completo com mapa interativo e referências de localização nos bairros de ${cityName}.`
                    }
                ]
            };

        case 'CONSTRUCTION':
            return {
                introTitle: `Construção, Reformas e Projetos: ${segmentName} em ${cityName}`,
                introParagraph: `Construir ou reformar seu imóvel residencial, comercial ou industrial em ${cityName} exige parceiros técnicos confiáveis. As empresas de ${segmentName} oferecem materiais de qualidade, mão de obra capacitada e soluções sob medida para garantir durabilidade, segurança e excelente acabamento.`,
                tipsTitle: `Orientações para o sucesso da sua obra em ${cityName}`,
                tips: [
                    { title: 'Planejamento e Orçamentos Comparativos', desc: 'Solicite orçamentos discriminando materiais e mão de obra para planejar os custos com clareza.' },
                    { title: 'Contrato e Prazos de Entrega', desc: 'Formalize prazos de entrega e garantias estruturais por escrito antes do início dos trabalhos.' },
                    { title: 'Fornecedores Locais da Serra Gaúcha', desc: 'Comprar no comércio local facilita reposições rápidas e reduz custos logísticos.' }
                ],
                faqs: [
                    {
                        question: `Como solicitar orçamento para obras de ${segmentName} em ${cityName}?`,
                        answer: `Envie sua planta ou descrição do projeto diretamente pelo WhatsApp para as empresas cadastradas no Guia O Vermelhinho.`
                    },
                    {
                        question: `As empresas atendem obras residenciais e comerciais?`,
                        answer: `Sim, grande parte dos prestadores e fornecedores locais atende desde pequenos reparos até grandes projetos estruturais.`
                    },
                    {
                        question: `Como verificar referências de obras anteriores?`,
                        answer: `No perfil das empresas é possível visualizar fotos de trabalhos realizados, avaliações e tempo de atuação no mercado.`
                    }
                ]
            };

        case 'RETAIL':
            return {
                introTitle: `Comércio e Varejo: As Melhores Opções de ${segmentName} em ${cityName}`,
                introParagraph: `O comércio local de ${cityName} se destaca pela atenção no atendimento, variedade de produtos e tradição da Serra Gaúcha. Ao comprar em ${segmentName} no município, você fortalece a economia local, encontra novidades e aproveita condições especiais de pagamento.`,
                tipsTitle: `Dicas de compras inteligentes em ${cityName}`,
                tips: [
                    { title: 'Valorize o Comércio de Bairro', desc: 'Encontre tudo o que precisa perto de casa com praticidade e atendimento acolhedor.' },
                    { title: 'Consulte Estoque e Modelos pelo WhatsApp', desc: 'Tire dúvidas sobre tamanhos, cores ou modelos diretamente com a loja antes de se deslocar.' },
                    { title: 'Promoções e Condições de Pagamento', desc: 'Aproveite descontos à vista e facilidades no parcelamento nos comércios da cidade.' }
                ],
                faqs: [
                    {
                        question: `Como consultar produtos disponíveis em ${segmentName} em ${cityName}?`,
                        answer: `Acesse o perfil da loja no Guia O Vermelhinho e chame a equipe de vendas pelo WhatsApp para ver fotos e tirar dúvidas sobre produtos.`
                    },
                    {
                        question: `As lojas oferecem entrega em domicílio na cidade?`,
                        answer: `Muitas lojas realizam entregas locais e envios rápidos em ${cityName} e região metropolitana da serra.`
                    },
                    {
                        question: `Quais os horários do comércio aos sábados?`,
                        answer: `Consulte a tabela de horários de atendimento no perfil da loja para conferir o expediente no fim de semana.`
                    }
                ]
            };

        case 'PET':
            return {
                introTitle: `Cuidados para seu Pet: ${segmentName} em ${cityName}`,
                introParagraph: `A saúde e felicidade dos animais de estimação merecem atenção dedicada. Em ${cityName}, os estabelecimentos de ${segmentName} combinam amor aos animais, produtos de nutrição de ponta, serviços de higiene e profissionais veterinários prontos para acolher seu melhor amigo.`,
                tipsTitle: `Cuidados essenciais com seu animal de estimação em ${cityName}`,
                tips: [
                    { title: 'Agendamento de Banho e Tosa', desc: 'Marque com antecedência e informe sobre preferências de tosa e produtos para peles sensíveis.' },
                    { title: 'Vacinas e Saúde Preventiva', desc: 'Mantenha a caderneta de vacinação e controle antipulgas atualizados junto ao veterinário.' },
                    { title: 'Rações de Qualidade e Acessórios', desc: 'Consulte especialistas para escolher a ração adequada à raça e idade do seu pet.' }
                ],
                faqs: [
                    {
                        question: `Como agendar banho e tosa para meu pet em ${cityName}?`,
                        answer: `Clique no botão de WhatsApp do pet shop escolhido no Guia O Vermelhinho e agende o horário mais conveniente.`
                    },
                    {
                        question: `Existe serviço de tele-busca (táxi dog) disponível?`,
                        answer: `Diversos estabelecimentos oferecem transporte seguro para buscar e levar seu pet em casa. Consulte a disponibilidade no perfil do local.`
                    },
                    {
                        question: `Como encontrar clínicas com atendimento de urgência?`,
                        answer: `No perfil dos estabelecimentos veterinários você encontra telefones para plantão e localização detalhada.`
                    }
                ]
            };

        case 'EDUCATION':
            return {
                introTitle: `Educação e Desenvolvimento: ${segmentName} em ${cityName}`,
                introParagraph: `Investir em conhecimento, formação profissional e educação de qualidade abre portas para o futuro. Em ${cityName}, as instituições de ${segmentName} contam com metodologias modernas, professores qualificados e infraestrutura pensada para o aprendizado seguro e contínuo.`,
                tipsTitle: `Dicas para escolher a instituição ideal em ${cityName}`,
                tips: [
                    { title: 'Conheça a Proposta Pedagógica', desc: 'Agende uma visita para conhecer o corpo docente, a metodologia de ensino e os valores da instituição.' },
                    { title: 'Estrutura e Segurança', desc: 'Observe a infraestrutura, acessibilidade e medidas de proteção para os estudantes.' },
                    { title: 'Período de Matrículas e Vagas', desc: 'Fique atento aos calendários semestrais e anuais para garantir a inscrição dentro do prazo.' }
                ],
                faqs: [
                    {
                        question: `Como agendar uma visita em instituições de ${segmentName} em ${cityName}?`,
                        answer: `Entre em contato diretamente pela secretaria através dos telefones ou WhatsApp disponíveis no perfil do Guia O Vermelhinho.`
                    },
                    {
                        question: `Quais as faixas etárias ou níveis atendidos?`,
                        answer: `Cada instituição detalha suas turmas e cursos em seu perfil completo no portal.`
                    },
                    {
                        question: `Onde encontrar escolas e cursos próximos ao meu bairro?`,
                        answer: `O portal lista os endereços completos em ${cityName}, facilitando a escolha da opção mais conveniente para a rotina familiar.`
                    }
                ]
            };

        default:
            return {
                introTitle: `Guia Completo: ${segmentName} em ${cityName}`,
                introParagraph: `Encontrar empresas e prestadores de serviços de ${segmentName} em ${cityName} ficou muito mais simples e seguro. O Guia O Vermelhinho reúne estabelecimentos locais com telefones atualizados, WhatsApp direto, endereços com mapas interativos e avaliações autênticas da comunidade da Serra Gaúcha.`,
                tipsTitle: `Como escolher o melhor estabelecimento em ${cityName}`,
                tips: [
                    { title: 'Atendimento Direto e Humanizado', desc: 'Tire dúvidas e solicite cotações diretamente com os responsáveis pelos negócios locais.' },
                    { title: 'Verifique Endereço e Horários', desc: 'Consulte os dados no perfil antes de se deslocar para garantir que o local está aberto.' },
                    { title: 'Fortaleça a Economia da Região', desc: 'Comprar e contratar em ${cityName} gera empregos e impulsiona o desenvolvimento de nossa comunidade.' }
                ],
                faqs: [
                    {
                        question: `Como entrar em contato com as empresas de ${segmentName} em ${cityName}?`,
                        answer: `No perfil de cada empresa você encontra botões diretos para chamada telefônica e WhatsApp, além de links para redes sociais e site oficial.`
                    },
                    {
                        question: `As informações do Guia O Vermelhinho são verificadas?`,
                        answer: `Sim, nosso diretório realiza atualizações constantes para manter dados de contato, endereços e horários de atendimento precisos.`
                    },
                    {
                        question: `Como cadastrar minha empresa de ${segmentName} em ${cityName}?`,
                        answer: `Você pode cadastrar seu negócio no Guia O Vermelhinho acessando nossa página de anúncios. Empresas locais ganham visibilidade em buscas do Google e assistentes de IA.`
                    }
                ]
            };
    }
}

export default function DynamicSeoText({ 
    cityName, 
    citySlug,
    segmentName, 
    segmentSlug,
    clientCount = 0, 
    clients = [] 
}: DynamicSeoTextProps) {
    if (clientCount === 0) return null;

    const domain = detectDomain(segmentName);
    const content = buildDomainContent(domain, segmentName, cityName);
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const toggleFaq = (idx: number) => {
        setOpenFaq(prev => prev === idx ? null : idx);
    };

    // Schema estruturado FAQPage (100% conforme, pois todo o conteúdo está visível no HTML)
    const faqJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        'mainEntity': content.faqs.map(f => ({
            '@type': 'Question',
            'name': f.question,
            'acceptedAnswer': {
                '@type': 'Answer',
                'text': f.answer
            }
        }))
    };

    // Filtra empresas com endereço ou contato relevante para a tabela semântica de entidades
    const verifiedClients = clients.slice(0, 8);

    return (
        <section className="bg-white py-14 border-t border-gray-100 mt-16 font-sans">
            <script
                type="application/ld+json"
                {...{ ['dangerously' + 'SetInnerHTML']: { __html: JSON.stringify(faqJsonLd).replace(/</g, '\\u003c') } }}
            />

            <div className="max-w-7xl mx-auto px-6 lg:px-8 space-y-14">
                {/* 1. VISÃO GERAL TEMÁTICA COM CONTEXTO REGIONAL */}
                <div className="max-w-4xl space-y-4">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-brand-red text-xs font-bold uppercase tracking-wider">
                        <Sparkles size={14} /> Guia Regional de {cityName}
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black text-gray-900 font-serif tracking-tight leading-tight">
                        {content.introTitle}
                    </h2>
                    <p className="text-base text-gray-600 leading-relaxed">
                        {content.introParagraph}
                    </p>
                </div>

                {/* 2. TABELA SEMÂNTICA DE ENTIDADES (KEY ENTITIES ANCHORS) */}
                {verifiedClients.length > 0 && (
                    <div className="bg-gray-50/70 rounded-3xl p-6 md:p-8 border border-gray-100 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-black text-gray-900 font-serif flex items-center gap-2">
                                <Building2 size={20} className="text-brand-red" />
                                Empresas e Estabelecimentos Cadastrados em {cityName}
                            </h3>
                            <span className="text-xs font-semibold text-gray-400">
                                {clientCount} {clientCount === 1 ? 'local' : 'locais'}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500">
                            Resumo das principais opções verificadas no Guia O Vermelhinho para {segmentName}:
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                            {verifiedClients.map((client) => {
                                const address = client.enderecos?.[0];
                                const phone = client.contatos?.[0]?.telefone_principal || client.contatos?.[0]?.celular;
                                const whatsapp = client.contatos?.[0]?.whatsapp;
                                const clientUrl = citySlug && segmentSlug 
                                    ? `/${citySlug}/${segmentSlug}/${client.slug || client.id}`
                                    : `/cliente/${client.slug || client.id}`;

                                return (
                                    <div 
                                        key={client.id}
                                        className="bg-white p-3.5 rounded-2xl border border-gray-100 flex items-center justify-between gap-3 shadow-xs hover:border-brand-red/30 transition-all"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <Link 
                                                href={clientUrl}
                                                className="text-sm font-bold text-gray-900 hover:text-brand-red transition-colors line-clamp-1 block"
                                            >
                                                {client.nome_fantasia}
                                            </Link>
                                            {address?.bairro && (
                                                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5 line-clamp-1">
                                                    <MapPin size={11} className="shrink-0 text-gray-400" />
                                                    {address.bairro}{address.rua ? ` • ${address.rua}` : ''}
                                                </p>
                                            )}
                                        </div>

                                        {(whatsapp || phone) && (
                                            <div className="shrink-0 flex items-center gap-1.5">
                                                {whatsapp ? (
                                                    <a
                                                        href={`https://wa.me/55${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá! Vi sua empresa no Guia O Vermelhinho em ${cityName}.`)}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-2 rounded-xl bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                                                        title="WhatsApp"
                                                        aria-label="WhatsApp"
                                                    >
                                                        <MessageCircle size={15} />
                                                    </a>
                                                ) : (
                                                    <span className="p-2 rounded-xl bg-gray-50 text-gray-600 text-xs font-semibold">
                                                        <ShieldCheck size={15} className="text-brand-red" />
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* 3. DICAS PRÁTICAS PARA O CONSUMIDOR */}
                <div className="space-y-6">
                    <h3 className="text-xl font-black text-gray-900 font-serif flex items-center gap-2">
                        <Lightbulb size={20} className="text-amber-500" />
                        {content.tipsTitle}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {content.tips.map((tip, idx) => (
                            <div 
                                key={idx}
                                className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-2 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-center gap-2 text-brand-red">
                                    <CheckCircle2 size={18} />
                                    <h4 className="text-sm font-bold text-gray-900">{tip.title}</h4>
                                </div>
                                <p className="text-xs text-gray-600 leading-relaxed">
                                    {tip.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 4. PERGUNTAS FREQUENTES (FAQ VISUAL & ACCORDION) */}
                <div className="space-y-6 pt-4 border-t border-gray-100">
                    <div className="max-w-2xl">
                        <h3 className="text-xl font-black text-gray-900 font-serif flex items-center gap-2">
                            <HelpCircle size={20} className="text-brand-red" />
                            Dúvidas Frequentes sobre {segmentName} em {cityName}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                            Perguntas e respostas para ajudar você a encontrar o melhor serviço na região
                        </p>
                    </div>

                    <div className="space-y-3 max-w-4xl">
                        {content.faqs.map((faq, idx) => {
                            const isOpen = openFaq === idx;

                            return (
                                <div 
                                    key={idx}
                                    className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden transition-all shadow-xs"
                                >
                                    <button
                                        type="button"
                                        onClick={() => toggleFaq(idx)}
                                        className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors"
                                        aria-expanded={isOpen}
                                    >
                                        <span className="text-sm font-bold text-gray-900">
                                            {faq.question}
                                        </span>
                                        <ChevronDown 
                                            size={18} 
                                            className={`text-gray-400 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-brand-red' : ''}`} 
                                        />
                                    </button>

                                    {isOpen && (
                                        <div className="px-5 pb-5 pt-1 text-xs md:text-sm text-gray-600 leading-relaxed border-t border-gray-100/60 bg-gray-50/30">
                                            {faq.answer}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
