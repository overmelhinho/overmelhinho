/**
 * Utilitários Schema.org para SEO e GEO (Generative Engine Optimization)
 * Padronização conforme especificações do Schema.org e Google Search Central
 */

export interface OpeningHoursSpec {
    '@type': 'OpeningHoursSpecification';
    dayOfWeek: string;
    opens: string;
    closes: string;
}

const DAY_MAP: Record<number, string> = {
    1: 'Monday',
    2: 'Tuesday',
    3: 'Wednesday',
    4: 'Thursday',
    5: 'Friday',
    6: 'Saturday',
    7: 'Sunday',
};

/**
 * Remove acentos e converte para minúsculas para comparações resilientes
 */
function normalizeText(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}

/**
 * Converte o array semanal estruturado de horário_atendimento para openingHoursSpecification do Schema.org
 */
export function formatOpeningHoursSpecification(
    horarioData: any,
    isHorarioMarcado?: boolean
): OpeningHoursSpec[] | undefined {
    if (isHorarioMarcado) {
        return undefined;
    }

    let schedule = horarioData;
    if (typeof schedule === 'string') {
        try {
            schedule = JSON.parse(schedule);
        } catch {
            return undefined;
        }
    }

    if (!Array.isArray(schedule) || schedule.length === 0) {
        return undefined;
    }

    const timeRegex = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
    const result: OpeningHoursSpec[] = [];

    for (const item of schedule) {
        if (!item || item.closed) continue;
        const dayOfWeek = DAY_MAP[Number(item.day)];
        if (!dayOfWeek) continue;

        // Turno 1 (ex: Manhã / Integral)
        const open1 = typeof item.open === 'string' ? item.open.trim() : '';
        const close1 = typeof item.close === 'string' ? item.close.trim() : '';
        if (timeRegex.test(open1) && timeRegex.test(close1)) {
            result.push({
                '@type': 'OpeningHoursSpecification',
                dayOfWeek,
                opens: open1,
                closes: close1,
            });
        }

        // Turno 2 (ex: Tarde / Pós-almoço)
        const open2 = typeof item.open2 === 'string' ? item.open2.trim() : '';
        const close2 = typeof item.close2 === 'string' ? item.close2.trim() : '';
        if (timeRegex.test(open2) && timeRegex.test(close2)) {
            result.push({
                '@type': 'OpeningHoursSpecification',
                dayOfWeek,
                opens: open2,
                closes: close2,
            });
        }
    }

    return result.length > 0 ? result : undefined;
}

/**
 * Mapeia segmentos comerciais para subtipos granulares do Schema.org LocalBusiness
 * Permite que IAs e motores de busca compreendam a natureza exata do negócio
 */
export function getSchemaLocalBusinessType(primarySegmentName?: string, allSegmentNames: string[] = []): string {
    const combined = [primarySegmentName || '', ...allSegmentNames].filter(Boolean);
    if (combined.length === 0) return 'LocalBusiness';

    const normalizedList = combined.map(normalizeText);
    const textBlob = normalizedList.join(' ');

    const has = (keywords: string[]) => keywords.some(k => textBlob.includes(k));

    // 1. Saúde e Odontologia
    if (has(['dentista', 'odontolog', 'cirurgiao dentista', 'ortodontia'])) return 'Dentist';
    if (has(['farmacia', 'drogaria'])) return 'Pharmacy';
    if (has(['hospital', 'pronto socorro'])) return 'Hospital';
    if (has(['medico', 'clinica geral', 'pediatra', 'oftalmolog', 'dermatolog', 'ginecolog', 'cardiolog', 'ortopedista', 'psiquiatra'])) return 'Physician';
    if (has(['clinica medica', 'posto de saude', 'centro medico', 'policlinica', 'psicolog', 'psicologia', 'fisiotera', 'fisioterapia', 'nutricao', 'nutricionista', 'fonoaudiolog', 'laboratorio'])) return 'MedicalClinic';

    // 2. Automotivo
    if (has(['chapea', 'funilaria', 'pintura automotiva'])) return 'AutoBodyShop';
    if (has(['concessionaria', 'revenda de veiculo', 'revenda de automovel', 'loja de carros'])) return 'AutoDealer';
    if (has(['auto pecas', 'pecas automotivas', 'autopecas'])) return 'AutoPartsStore';
    if (has(['posto de combustivel', 'combustiveis', 'gasolina'])) return 'GasStation';
    if (has(['lava rapido', 'lava jato', 'lavagem automotiva'])) return 'AutoWash';
    if (has(['mecanica', 'oficina', 'auto eletrica', 'borracharia', 'pneu', 'balanceamento', 'suspensao', 'troca de oleo', 'radiador', 'escapamento', 'automoveis mecanica'])) return 'AutoRepair';

    // 3. Alimentação e Gastronomia
    if (has(['padaria', 'confeitaria', 'doces', 'panificadora'])) return 'Bakery';
    if (has(['bar', 'pub', 'boteco', 'choperia', 'cervejaria'])) return 'BarOrPub';
    if (has(['cafe', 'cafeteria', 'casa de cha'])) return 'CafeOrCoffeeShop';
    if (has(['lanchonete', 'lanches', 'pastelaria', 'hamburgueria', 'fast food', 'hot dog'])) return 'FastFoodRestaurant';
    if (has(['restaurante', 'pizzaria', 'churrascaria', 'galeteria', 'sushi', 'gastronomia', 'alimentacao', 'buffet', 'creperia'])) return 'Restaurant';

    // 4. Animais e Pet Care
    if (has(['veterinari', 'clinica veterinaria', 'hospital veterinario'])) return 'VeterinaryCare';
    if (has(['pet shop', 'petshop', 'agropecuaria', 'banho e tosa'])) return 'PetStore';

    // 5. Beleza e Bem-estar
    if (has(['cabeleireir', 'barbearia', 'barbeiro'])) return 'HairSalon';
    if (has(['salao de beleza', 'estetica', 'manicure', 'podologia', 'spa', 'massagem', 'depilacao', 'tatuagem'])) return 'BeautySalon';

    // 6. Fitness e Esportes
    if (has(['academia', 'crossfit', 'pilates', 'fitness', 'personal trainer', 'musculacao', 'artes marciais'])) return 'ExerciseGym';

    // 7. Hospedagem
    if (has(['hotel', 'pousada', 'resort', 'motel', 'hostel', 'hospedagem'])) return 'Hotel';

    // 8. Jurídico e Financeiro
    if (has(['advoga', 'advocacia', 'juridic'])) return 'LegalService';
    if (has(['contabil', 'contador', 'contabilidade'])) return 'AccountingService';
    if (has(['banco', 'cooperativa de credito', 'financeira'])) return 'BankOrCreditUnion';
    if (has(['imobiliaria', 'corretor de imoveis', 'administradora de imoveis'])) return 'RealEstateAgent';

    // 9. Viagem e Turismo
    if (has(['turismo', 'agencia de viagens'])) return 'TravelAgency';

    // 10. Educação
    if (has(['escola', 'colegio', 'educacao infantil', 'creche', 'autoescola', 'escola de idiomas', 'curso'])) return 'School';

    // 11. Construção, Reformas e Manutenção
    if (has(['eletricista', 'instalacao eletrica'])) return 'Electrician';
    if (has(['encanador', 'hidraulica'])) return 'Plumber';
    if (has(['construcao civil', 'reforma', 'empreiteira', 'serralheria', 'vidracaria', 'pintura', 'gesso', 'marcenaria', 'arquitetura', 'engenharia', 'metalurgica'])) return 'GeneralContractor';

    // 12. Varejo e Lojas
    if (has(['supermercado', 'mercado', 'mercearia', 'acougue', 'fruteira'])) return 'GroceryStore';
    if (has(['vestuario', 'moda feminina', 'moda masculina', 'moda unissex', 'loja de roupas', 'boutique', 'confeccao', 'malharia'])) return 'ClothingStore';
    if (has(['calcados', 'loja de sapatos', 'sapataria'])) return 'ShoeStore';
    if (has(['moveis', 'loja de moveis', 'decoracao', 'colchoes'])) return 'FurnitureStore';
    if (has(['otica', 'oticas'])) return 'Optician';
    if (has(['floricultura', 'flores'])) return 'Florist';
    if (has(['joalheria', 'relojoaria', 'semijoias'])) return 'JewelryStore';
    if (has(['informatica', 'computador', 'celular', 'eletronico'])) return 'ElectronicsStore';
    if (has(['livraria', 'papelaria'])) return 'BookStore';
    if (has(['loja', 'presentes', 'comercio', 'bazar', 'embalagens'])) return 'Store';

    return 'LocalBusiness';
}

/**
 * Constrói os Schemas estruturados de nível de raiz (WebSite com SearchAction e Organization)
 */
export function buildRootSchemas(siteUrl: string = 'https://www.overmelhinho.com.br') {
    const cleanUrl = siteUrl.replace(/\/+$/, '');
    return {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'WebSite',
                '@id': `${cleanUrl}/#website`,
                'url': cleanUrl,
                'name': 'O Vermelhinho',
                'description': 'Maior Guia de Empresas e Negócios da Serra Gaúcha',
                'inLanguage': 'pt-BR',
                'potentialAction': {
                    '@type': 'SearchAction',
                    'target': {
                        '@type': 'EntryPoint',
                        'urlTemplate': `${cleanUrl}/busca?q={search_term_string}`
                    },
                    'query-input': 'required name=search_term_string'
                }
            },
            {
                '@type': 'Organization',
                '@id': `${cleanUrl}/#organization`,
                'name': 'O Vermelhinho',
                'url': cleanUrl,
                'logo': {
                    '@type': 'ImageObject',
                    '@id': `${cleanUrl}/#logo`,
                    'url': `${cleanUrl}/logo-overmelhinho.png`,
                    'contentUrl': `${cleanUrl}/logo-overmelhinho.png`,
                    'caption': 'O Vermelhinho'
                },
                'image': `${cleanUrl}/logo-overmelhinho.png`,
                'sameAs': [
                    'https://www.instagram.com/overmelhinho/',
                    'https://www.facebook.com/guia.vermelhinho',
                    'https://www.youtube.com/channel/UCS8qDu-fmdODhqzXrXf0FEA'
                ],
                'contactPoint': {
                    '@type': 'ContactPoint',
                    'contactType': 'customer service',
                    'availableLanguage': 'Portuguese'
                }
            }
        ]
    };
}

