# 🔍 Busca e Filtros Inteligentes (Geo-Intelligence v2.0)

Este documento descreve o funcionamento técnico da experiência de busca, geolocalização e filtros dinâmicos do frontend do portal **O Vermelhinho**.

## 🚀 Visão Geral
A busca foi projetada para ser rápida, resiliente a erros de digitação (fuzzy search) e contextualmente inteligente. Ela não apenas encontra empresas, mas adapta a interface conforme a intenção do usuário.

---

## 🛠️ Componentes Principais

### 1. Sistema de Geolocalização (`LocationContext.tsx`)
Responsável por manter o estado global da cidade e coordenadas do usuário.
- **Persistência:** Salva a escolha do usuário no `localStorage` sob a chave `user_city`.
- **Detecção:** Tenta geolocalização do navegador -> Fallback para API de IP (`ipapi.co`).
- **Uso:** Fornece `cityId` e `cityName` para todos os componentes de busca.

### 2. Autocomplete de Busca (`SearchAutocomplete.tsx`)
O componente de entrada rápida presente na Home e no cabeçalho.
- **Debounce:** Espera 300ms após a digitação antes de chamar a API.
- **API:** Consome `/v1/public/search/suggestions`.
- **Deduplicação:** Remove resultados duplicados no client-side para evitar erros de renderização.
- **Navegação:** Prioriza o uso de `slug` para URLs amigáveis (Ex: `/cliente/pizzaria-do-joao`).

### 3. Filtros Inteligentes (Contextuais)
Localizados em `src/app/busca/page.tsx`, os filtros de topo mudam dinamicamente baseados na palavra-chave (`query`):

| Categoria Detectada | Palavras-Chave Exemplo | Filtros Sugeridos |
| :--- | :--- | :--- |
| **Alimentação** | pizza, burger, restaurante | Aberto Agora, Entrega Grátis, Notas |
| **Imóveis** | casa, aluguel, apto | Aluguel, Venda, Com Garagem |
| **Carreiras** | vaga, emprego, estágio | Home Office, CLT, Estágio |
| **Automotivo** | carro, moto, oficina | Seminovo, Financiamento, Troca |
| **Padrão** | (qualquer outro termo) | Aberto Agora, Entrega Grátis, IA |

---

## 🏗️ Fluxo de Funcionamento

1. **Entrada:** O usuário digita um termo no `SearchAutocomplete`.
2. **Geofencing:** A busca envia automaticamente o `city_id` atual para a API.
3. **Página de Resultados:**
   - Usa `useInfiniteQuery` (React Query) para scroll infinito.
   - **Remoção de Duplicidade:** Um `useMemo` com `Set` garante que itens carregados em diferentes páginas da API não se repitam na tela (resolvendo o erro de `duplicate keys`).
4. **Seletor de Cidade:**
   - Um modal (`Framer Motion`) permite trocar a cidade de busca.
   - Ao selecionar, o `LocationContext` é atualizado e a `useInfiniteQuery` dispara uma nova busca automaticamente devido à mudança na dependência do `cityId`.

---

## 📡 Backend (API V1)

### `ClienteController@indexPublic`
- **Fuzzy Search:** Utiliza a extensão `pg_trgm` do PostgreSQL para permitir buscas como "pizaria" (com erro) encontrarem "Pizzaria".
- **Filtro Geo:** Filtra via `cidadesAtendidas` (many-to-many) ou via endereço direto.
- **Logística de Expansão (Priority Order):** Quando uma cidade é selecionada, a ordenação segue este peso:
  1. **Locais:** Clientes Premium cuja sede física (endereço) é na mesma cidade buscada.
  2. **Expansão:** Clientes Premium de fora que contrataram a cidade buscada como "cidade atendida".
  3. **Demais:** Clientes gratuitos e outras categorias.

---

## 🎨 Publicidade e Banners Dinâmicos

Implementamos um sistema de publicidade nativa que permite aos anunciantes "dominarem" termos de busca ou categorias em cidades específicas.

### 1. Hero Banners (Anúncios de Topo)
O item de maior valor comercial do portal. Ele aparece acima do "Match Perfeito" e dos resultados orgânicos.

- **Critérios de Exibição:**
    - **Keywords:** O banner é ativado se a busca do usuário contiver palavras-chave cadastradas (Ex: "pizza", "carro").
    - **Geofencing:** O banner pode ser restrito a cidades específicas ou aparecer em todo o portal (Global).
    - **Contexto:** Se o usuário clicar em um filtro de categoria (Ex: "Gastronomia"), o sistema busca o banner correspondente.
- **Visual:** Peça horizontal de alto impacto com Imagem, Título, Subtítulo e Call to Action (CTA) para WhatsApp ou URL interna.

### 2. Fluxo de Seleção (Heurística de Ad-Matching)
Atualmente a lógica reside em `src/app/busca/page.tsx` no hook `heroAd`. Ela segue o seguinte fluxo:
1. Pega a `query` e a `cityName` atuais.
2. Varre a lista de campanhas ativas.
3. Faz o match: `(Palavra-Chave encontrada) AND (Cidade permitida OR Global)`.
4. Renderiza o primeiro banner que satisfaz os critérios com animação de entrada `framer-motion`.

---

## 🎨 Design e UX (Gummy Design)
- **Modais:** Cantos extremamente arredondados (`rounded-[3.5rem]`) e efeito de vidro (`backdrop-blur`).
- **Animações:** `AnimatePresence` do Framer Motion para entradas e saídas suaves de layouts.
- **Mobile First:** Seletor de cidade otimizado para o polegar em dispositivos móveis.
- **Badge "Atende Aqui":** Clientes que aparecem na busca via expansão (sede em outra cidade) recebem um selo dourado pulse (`animate-pulse`) para indicar relevância regional.

---

> [!TIP]
> Para testar novos filtros inteligentes, adicione novas condições no hook `getDynamicFilters` dentro de `src/app/busca/page.tsx`.
