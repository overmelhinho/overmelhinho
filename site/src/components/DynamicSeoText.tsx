import React from 'react';

interface DynamicSeoTextProps {
    cityName: string;
    segmentName: string;
    clientCount?: number;
}

export default function DynamicSeoText({ cityName, segmentName, clientCount = 0 }: DynamicSeoTextProps) {
    if (clientCount === 0) return null;

    return (
        <section className="bg-white py-12 border-t border-gray-100 mt-12">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="prose prose-lg text-gray-600 max-w-4xl">
                    <h2 className="text-2xl font-bold text-gray-900 font-serif mb-4">
                        Encontre {segmentName} em {cityName}
                    </h2>
                    <p>
                        Se você está buscando pelos melhores profissionais ou empresas de <strong>{segmentName} em {cityName}</strong>, 
                        você está no lugar certo. O Guia O Vermelhinho reúne uma seleção criteriosa para facilitar sua busca na região.
                    </p>
                    <p>
                        Ao navegar pelo nosso diretório de <strong>{segmentName}</strong> localizados em <strong>{cityName}</strong>, 
                        você tem acesso a avaliações autênticas, horários de funcionamento, endereços atualizados e contatos diretos por WhatsApp. 
                        Tudo isso para garantir que você encontre exatamente o que precisa, com rapidez e segurança.
                    </p>
                    <p>
                        Valorize o comércio local e entre em contato direto com os estabelecimentos. Encontrar <strong>{segmentName} na cidade de {cityName}</strong> nunca foi tão simples!
                    </p>
                </div>
            </div>
        </section>
    );
}
