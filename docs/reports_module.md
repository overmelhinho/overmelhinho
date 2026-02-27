# Módulo de Relatórios e Dashboards

O Módulo de Relatórios e Dashboards fornece inteligência de negócios tanto para a administração do portal (Visão Interna) quanto para os lojistas (Visão Externa/Performance), consolidando dados de tracking, financeiro, vagas e SEO.

---

## 🏗️ Arquitetura de Dados

O sistema utiliza um modelo de **Tracking Ativo** para capturar interações que ocorrem fora do fluxo transacional padrão (cliques em botões externos).

### Coleta de Dados (ClientInteraction)
- **Tabela**: `client_interactions`
- **Tipos de Interação**:
    - `page_view`: Acesso à página de detalhe do cliente ou vaga.
    - `whatsapp_click`: Clique no botão de contato direto via WhatsApp.
    - `waze_click`: Clique para abrir rota no Waze/Maps.
    - `social_click`: Clique em links de redes sociais (Instagram, Facebook).

### APIs de Agregação
- **Endpoint Lojista**: `GET /api/v1/clients/{id}/reports/dashboard`
    - Consolida visibilidade dos últimos 30 dias (Dados Híbridos: DB Local + GA4 Data API).
    - Métricas de GA4: Visualizações reais e eventos de conversão filtrados por `client_id`.
    - Sparkline de acessos dos últimos 7 dias.
    - Status de SEO (tabela `seo_rankings`).
    - Performance de Vagas (tabelas `job_opportunities` e `candidates`).

- **Endpoint Admin**: `GET /api/v1/admin/reports/dashboard`
    - Financeiro: MRR (Mensal Recorrente) baseado em planos ativos.
    - Inadimplência: Comparativo MRR vs Invoices pendentes.
    - Operacional: Eficiência da IA nos orçamentos.
    - Estratégico: Ticket Médio por cliente ativo.
    - Audiência: Top 5 clientes com mais interações.
    - Mercado: Termos de busca sem resultado (Gaps).

---

## 🎨 Interface (UI/UX)

Desenvolvida com o conceito de **Bento Grid**, focando em modularidade e clareza visual.

- **Stack**: React + Recharts + Tailwind.
- **Cores**: Fundo `#F2F2F2` (Cloud Dancer), Vermelho Brand `#C00000` para KPIs de destaque.
- **Componentes principais**:
    - `ClientReportDashboard.tsx`: Visão de performance para provar valor ao lojista.
    - `AdminReportDashboard.tsx`: Cockpit operacional para gestão da rede.

---

## 🔌 Integração (Tracking Externo)

Para que os dados de visibilidade sejam reais, o site público deve disparar os eventos de tracking.

### Utilitário Frontend
Localizado em: `frontend/src/lib/tracking.ts`

### Como integrar novos eventos:
1. Importar o utilitário: `import { trackInteraction } from "@/lib/tracking";`
2. Disparar no evento de clique:
```javascript
// Exemplo: Botão de WhatsApp
<button onClick={() => trackInteraction(clientId, 'whatsapp_click')}>
   Falar no WhatsApp
</button>
```

---

## 📊 KPIs de Negócio (Fórmulas)

- **MRR**: $\sum (\text{Preço do Plano})$ de todos os clientes com `status_assinatura = 'ativo'`.
- **Taxa de Inadimplência**: $(\text{Total Pendente} / \text{MRR}) \times 100$.
- **Eficiência IA**: $(\text{Orçamentos Notificados} / \text{Total de Orçamentos}) \times 100$.
- **Ticket Médio**: $\text{MRR} / \text{Total de Clientes Ativos}$.
- **Top Clientes**: Ranking baseado no volume total de registros na tabela `client_interactions`.
