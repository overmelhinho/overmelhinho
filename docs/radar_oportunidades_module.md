# Módulo: Radar de Oportunidades (Gaps de Mercado)

## 📌 Visão Geral
O **Radar de Oportunidades** é uma ferramenta comercial do painel Administrativo (SaaS) projetada para otimizar a prospecção da equipe de vendas d'O Vermelhinho. Ele utiliza dados de busca em tempo real e o cruza com a densidade de concorrentes ativos na plataforma para gerar listas de "Gaps" (Alta procura, Baixa oferta). Além disso, está integrado a Inteligência Artificial (OpenAI GTP-4o-mini) para formular discursos ('Pitch') de vendas de alta performance.

## 🏗 Arquitetura do Módulo

### 1. Frontend (React + Vite)
- **Caminho:** `frontend/src/pages/oportunidades/OportunidadesPage.tsx`
- **Design System:** Usa a abordagem de *Bento Grid*, com estética *Light Skeuomorphism* e micro-interações *Gimme Gummy* (táteis e responsivas aos cliques).
- **Consumo de Api:** O componente consome as rotas protegidas do Laravel via `axios` e as gerencia reativamente de forma performática através do `@tanstack/react-query` (`useQuery` e `useMutation`).
- **Estado Dinâmico:** Exibe um Loader interativo ao simular a IA "escrevendo" a copy do script no painel lateral. 

### 2. Backend (Laravel API)
- **Controller:** `backend/app/Http/Controllers/Api/V1/RadarController.php`
- O Controller não expõe dados maquiados ("mocks"): Ele efetivamente consulta os últimos 30 dias na tabela `search_logs` da aplicação (usando agregação SQL `GROUP BY`) limitando aos nichos que possuam *baixo número de concorrentes* (`results_count <= 3`).
- **Endpoint de IA (`generateScript`):** Dispara a geração dinâmica com OpenAI utilizando as variáveis de `termo`, `cidade`, `buscas` e `concorrentes`. Possui tratamento de `Timeout` e `Fallback` sem internet ou falha de chave de API.

### 3. Banco de Dados / Tracking de Pesquisa
- **Model:** `SearchLog` (`database/migrations/2026_02_27_182635_create_search_logs_table.php`)
- Retém todo o ecossistema de dados das intenções de busca do usuário do portal público: Termo pesquisado, Cidade filtrada, Contagem de Resultados na tela, IP e User-Agent.
- **Rastreamento Server-Side:** Integrada diretamente via API pelo `TrackingController->search`. 

---

## 🛠 Tarefas Futuras (Roadmap do Radar)
- [ ] **Integração Front-end Público:** Ligar o campo de pesquisa do site ao endpoint `/v1/tracking/search` para iniciar de fato a coleta orgânica.
- [ ] **Integração Real-Time com Websockets (Reverb):** Se um "Gap gigante" bater no sistema, notificar a equipe comercial ao vivo.
- [ ] **Oportunidades Arquivadas ou Excluídas:** Permitir ao administrador "dispensar" uma sugestão de oportunidade e ocultá-la do Radar.
- [ ] **Feedback da IA Gen:** Permitir edição e regeneração de *Tone of Voice* (ex. Botões alternativos: "Gerar mais agressivo", "Gerar mais formal").
- [ ] **Conexão com CRM:** Acoplar o "Prospectar" para abrir um modal puxando possíveis links/Google Maps locais antes de jogar pro WhatsApp - facilitando encontrar o prospect.
