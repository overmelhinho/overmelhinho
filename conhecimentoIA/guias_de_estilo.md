# Guias de Estilo e Padrões de Código - O Vermelhinho

Este guia define as convenções de escrita de código para o projeto. O agente de IA deve aderir a estes padrões para manter a base de código consistente e profissional.

## 1. Backend (Laravel / PHP)

*   **Padrão de Código:** Seguir as recomendações PSR-12.
*   **Arquitetura:** Utilizamos o padrão MVC tradicional do Laravel, com ênfase na abordagem *Fat Models, Skinny Controllers*. A lógica de negócios pesada deve residir no Model ou em Classes de Serviço (Services), mantendo os Controllers enxutos.
*   **APIs REST:** As respostas da API devem ser sempre padronizadas em formato JSON, preferencialmente utilizando as `Resource` classes do Laravel (`JsonResource`) para envelopamento de dados.
*   **Validação:** Sempre utilize `FormRequests` do Laravel em vez de validar diretamente dentro do Controller.
*   **Nomenclatura:** 
    *   Arquivos e Classes Estruturais (Controllers, Jobs, Middleware): Em Inglês (ex: `ProcessClienteSeoJob`).
    *   Tabelas de Banco de Dados e Nomes de Models (Entidades de Negócio): Em Português, no singular para models e plural para tabelas (ex: Model `Cliente`, Tabela `clientes`).

## 2. Frontend (React / Vite / TypeScript)

*   **Linguagem Oficial:** O frontend é tipado. Use **TypeScript** (`.ts`, `.tsx`) por padrão, garantindo que props e estados tenham interfaces bem definidas.
*   **Estilização:** Utilizamos **Tailwind CSS**. Evite criar arquivos de CSS puro a menos que seja estritamente necessário (ex: para sobrescrever classes muito específicas que o Tailwind não alcança).
*   **Componentes UI:** O projeto utiliza **shadcn/ui** (`components.json` está na raiz do frontend). Sempre priorize a reutilização de componentes pré-construídos do shadcn/ui em vez de criar do zero (ex: botões, modais, formulários).
*   **Gerenciamento de Estado/Hooks:** Priorize componentes funcionais e o uso de Hooks (`useState`, `useEffect`, React Query para fetch de dados).

## 3. Idioma e Comentários

*   Mensagens de erro exibidas ao usuário, strings de UI e validações devem ser estritamente em **Português do Brasil (pt-BR)**.
*   Comentários de código técnicos podem ser em inglês, mas comentários explicando regras de negócio devem ser em português para facilitar o entendimento da equipe.
