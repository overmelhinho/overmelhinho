# Estrutura do Projeto e Mapa do Sistema

O projeto O Vermelhinho é estruturado como um monorepo lógico. A raiz contém pastas independentes que não devem misturar dependências (não instale pacotes npm na pasta do backend, por exemplo).

## 1. `/backend` (Laravel API)
É o motor do sistema. Roda em PHP/Octane.
*   `app/Models/`: Contém os modelos Eloquent. Entidades centrais: `Cliente`, `Lead`, `Ticket`, `GaleriaImagem`.
*   `app/Http/Controllers/Api/V1/`: Contém os controladores que servem o frontend React.
*   `app/Jobs/` e `app/Console/Commands/`: Lógica assíncrona e crons (como as checagens de SEO).
*   `routes/api.php`: Arquivo central de roteamento da API. As requisições REST são feitas por aqui.

## 2. `/frontend` (Painel Administrativo SPA)
O painel de controle operado pela equipe do O Vermelhinho. Feito em React + Vite.
*   `src/components/`: Componentes reutilizáveis (geralmente baseados no shadcn/ui).
*   `src/pages/` ou `src/views/`: As telas inteiras da aplicação (Ex: Lista de Clientes, Dashboard).
*   `src/services/` ou `src/hooks/`: Lógica de requisição de rede consumindo o `/backend`.

## 3. `/site` (Portal Público)
A vitrine do O Vermelhinho voltada para o consumidor final, otimizada para SEO.
*   Tecnologia: Next.js.
*   Consome a API pública do backend para renderizar a vitrine de clientes e catálogos.

## 4. `/conhecimentoIA` (RAG Knowledge Base)
A pasta onde este documento reside. Qualquer IA, agente ou novo desenvolvedor deve ler os arquivos `.md` desta pasta antes de interagir com o sistema.

## 5. Scripts de Automação e DevOps (Raiz)
*   `deploy.sh`: Script principal de deploy, responsável por fazer o build do frontend e limpar os caches do backend de forma segura com rollback automático.
