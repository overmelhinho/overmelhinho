# Módulo de Busca com Mapa Real (Leaflet)

## 🗺️ Visão Geral

O Módulo de Busca do "O Vermelhinho" foi refatorado para entregar uma experiência imersiva e responsiva baseada em mapas, chamada de **"Zero-Click Search Flow"** com forte inspiração no Airbnb e filosofias de design orientadas ao luxo. 

Esta interface substitui a listagem clássica monótona por uma combinação de Scroll Infinito à esquerda e um Mapa Interativo à direita, garantindo que o usuário veja a exata distribuição geográfica dos resultados simultaneamente à sua rolagem.

---

## ✨ Funcionalidades Principais

*   **Fundo de Mapa Realístico**: Integrado com a API pública do **OpenStreetMap** (via `react-leaflet`), entregando visualização real de ruas, rodovias e bairros.
*   **Design Premium de Tiles**: O css customizado desatura as cores tradicionais do mapa (grayscale, alto contraste) para combinar com a identidade "Vermelhinho" e não destoar dos Cards "Gimmy Gummy".
*   **Pins Sincronizados**: Mapeamento simultâneo entre a interação do cursor na lista da esquerda e a elevação animada do pin no mapa da direita.
*   **Logos de Lojistas no Mapa**: Contas da categoria Premium têm os ícones de mapa genéricos substituídos pelas suas **Logomarcas arredondadas**. O sistema injeta o logo ou uma imagem de galeria diretamente no marcador do GPS.
*   **O "Modal Airbnb Experience"**: Ao clicar em um pin no mapa, ao invés de forçar o usuário para outra página, um *Glassmorphism Preview Card* salta do fundo com dados vitais, incluindo a galeria, botões "Ver Detalhes" e um botão rápido pro "WhatsApp" — promovendo chamadas de ação diretas.
*   **Scroll Infinito Nativo**: A medida que novos endereços vêm do Laravel via Observer de Scroll (Tanstack Query), `lat` e `lng` dessas novas parcelas caem assincronamente no mapa e ajustam o `bounds` de visão na tela.

---

## 🛠️ Stack Tecnológica Envolvida

*   `react-leaflet` / `leaflet`: Renderização do mapa (com componente encapsulado em `next/dynamic` para evitar erros de SSR no Next.js App Router).
*   `@tanstack/react-query`: Paginação do tipo `useInfiniteQuery`.
*   `lucide-react`: Para os ícones modais (Estrela, Match Perfeito, Zap, etc.).
*   **Tailwind CSS**: Para o design responsivo, blur de backdrop e micro-animações CSS no Hover dos custom Markers.

---

## 🧬 Alterações no Backend (Arquitetura de Dados)

Para sustentar o GPS real:
1.  **Migration**: Foi adicionado `latitude` (decimal 10,8) e `longitude` (decimal 11,8) nativo à tabela primária `enderecos`.
2.  **Resource API**: O endpoint json `/api/v1/public/search` foi atualizado em `EnderecoResource` para sempre repassar as chaves `latitude` e `longitude` pro front.
3.  **Seeding**: Os dados antigos foram apagados. Uma rotina matemática calculou um radius circular para randomizar endereços falsos perto de **Farroupilha - RS**, garantindo um ambiente de QA coeso aos bairros existentes.

---

## 🏗️ Estrutura de Diretórios Frontend

*   `/src/app/busca/page.tsx`: Controla estado de hover, invoca rota da API buscando coordenadas, e orquestra o Side-by-Side Viewport (Listagem / Mapa).
*   `/src/components/SearchMap.tsx`: Contém a complexidade pesada do **React-Leaflet**, a renderização por string do SVG customizado e o comportamento do *FlyTo* (MaxZoom bounds).

## 🚀 Próximos Passos & Otimizações Futuras

*   **Geolocalização do Aparelho**: Enviar o GPS atual do usuário do navegador na query Laravel para ordenar sempre pelo lojista hiper-local (Mais perto).
*   **Clusterização**: Adicionar `leaflet.markercluster` se o banco atingir milhares de clientes em um zoom longínquo para não travar o DOM com nodos de DivIcon.
