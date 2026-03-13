# Módulo: Radar de Oportunidades (Gaps de Mercado)

## 📌 Visão Geral
O **Radar de Oportunidades** é uma ferramenta comercial do painel Administrativo (SaaS) projetada para otimizar a prospecção da equipe de vendas d'O Vermelhinho. Ele utiliza dados de busca em tempo real e o cruza com a densidade de concorrentes ativos na plataforma para gerar listas de "Gaps" (Alta procura, Baixa oferta). Além disso, está integrado a Inteligência Artificial (OpenAI GTP-4o-mini) para formular discursos ('Pitch') de vendas de alta performance.

## 🏗 Arquitetura do Módulo

### 1. Frontend (React + Vite)
- **Caminho:** `frontend/src/pages/oportunidades/OportunidadesPage.tsx`
- **Design System:** Usa a abordagem de *Bento Grid*, com estética *Light Skeuomorphism* e micro-interações *Gimme Gummy* (táteis e responsivas aos cliques).
- **Consumo de Api:** O componente consome as rotas protegidas do Laravel via `axios` e as gerencia reativamente através do `@tanstack/react-query`.
- **Paginação e Filtros:** Implementação de paginação no lado do servidor e filtros por status (`pendente`, `prospectado`).
- **Painel Lateral Sticky:** O bloco de script de IA e alvos do Google Maps permanece fixo durante o scroll para melhor usabilidade.

### 2. Backend (Laravel API)
- **Controller:** `backend/app/Http/Controllers/Api/V1/RadarController.php`
- **Lógica de Gaps:** Consulta a tabela `search_logs` dos últimos 30 dias para identificar termos com alta busca e baixa oferta (resultados <= 3).
- **Inteligência de Alvos:** Integrado ao **Google Places API** para buscar empresas reais que atendam ao gap detectado na cidade específica.
- **Filtro Anti-Duplicação:** Cruza dados do Google Maps com a tabela de `clientes` para não sugerir prospecção de quem já está no portal.
- **Automação CRM:** O método `markTargetAsProspected` cria automaticamente um Lead no Kanban com a origem "Radar" e status "Em negociação" ao iniciar o contato via WhatsApp.

### 3. Banco de Dados / Persistência
- **RadarOportunidade:** Rastreia o status de prospecção geral de um termo/cidade.
- **RadarAlvoProspectado:** Rastreia individualmente cada empresa do Google Maps que foi contatada.
- **SearchLog:** Motor de dados bruto das intenções de busca do usuário do portal.

---

## 🚀 Fluxo de Prospecção (Funil do Radar)
1. **Identificação**: O sistema detecta um termo (ex: "Pizza") com buscas mas poucos resultados.
2. **Seleção**: O comercial escolhe a oportunidade e a IA gera um Pitch de vendas matador.
3. **Escaneamento**: O sistema busca alvos reais no Google Maps que não são clientes.
4. **Venda**: O comercial clica em "Abrir WhatsApp", o contato é aberto com o script preenchido.
5. **Conversão**: Inicia-se o tracking automático no **Kanban de Leads** para acompanhamento comercial.

---

## 🛠 Tarefas Futuras (Roadmap do Radar)
- [x] **Integração Front-end Público**: Coleta orgânica via `/v1/tracking/search` ativa.
- [x] **Conexão com CRM e Google Maps**: Busca inteligente e criação de leads automática.
- [x] **Paginação e Organização**: Controle de volume de dados na UI.
- [ ] **Integração Real-Time com Reverb**: Notificar a equipe comercial sobre "Mega Gaps" instantaneamente.
- [ ] **Follow-up Inteligente**: IA que analisa se o prospectado do Radar converteu e ajusta os próximos scripts.
- [ ] **Relatório de ROI do Radar**: Dashboard mostrando quanto de MRR o Radar gerou efetivamente.
