export const getPrimaryCityName = (client: any): string => {
    if (!client) return '';
    const enderecos = client.enderecos || [];
    const addressCity = enderecos[0]?.cidade || '';
    const cidadesAtendidas = client.cidades_atendidas || client.cidadesAtendidas || [];

    if (cidadesAtendidas.length > 0) {
        const hasAddressCityInServed = cidadesAtendidas.some((c: any) => 
            c.nome.toLowerCase().trim() === addressCity.toLowerCase().trim()
        );

        if (hasAddressCityInServed) {
            return addressCity;
        }

        return cidadesAtendidas[0].nome || addressCity;
    }

    return addressCity;
};

export const getClientSeoUrl = (client: any, currentCityName?: string | null): string => {
    if (!client) return '#';

    // Se o cliente não tiver segmento, não temos como gerar a URL SEO completa
    if (!client.segmentos?.[0]?.nome) {
        return `/cliente/${client.slug || client.id}`;
    }

    let targetCity = currentCityName;

    // Se a cidade atual foi passada, verificamos se o cliente atende ela
    if (targetCity) {
        const cidadesAtendidas = client.cidades_atendidas || client.cidadesAtendidas || [];
        const enderecos = client.enderecos || [];

        const servesCity = cidadesAtendidas.some((c: any) => 
            c.nome.toLowerCase() === targetCity?.toLowerCase()
        ) || enderecos.some((e: any) => 
            e.cidade?.toLowerCase() === targetCity?.toLowerCase()
        );

        if (!servesCity) {
            targetCity = null;
        }
    }

    // Se targetCity for nula (busca global ou cliente não atende a cidade buscada), usamos a principal do cliente
    if (!targetCity) {
        targetCity = getPrimaryCityName(client);
    }

    // Se o cliente não possui nenhuma cidade, fallback
    if (!targetCity) {
        return `/cliente/${client.slug || client.id}`;
    }

    const citySlug = targetCity.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-');
    const segmentSlug = client.segmentos[0].nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-');
    const clientSlug = client.slug || client.id;

    return `/${citySlug}/${segmentSlug}/${clientSlug}`;
};
