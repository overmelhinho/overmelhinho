# Documentação de Integração Google Analytics 4 (GA4)

Esta integração permite que o portal "O Vermelhinho" exiba métricas detalhadas de tráfego, comportamento do usuário e monitoramento em tempo real diretamente no Cockpit Administrativo.

## 🛠️ Configuração do Ambiente (.env)

Para que a integração funcione, as seguintes variáveis devem estar configuradas no `backend/.env`:

```env
# ID numérico da Propriedade GA4 (visível na URL do painel do Google Analytics)
GA4_PROPERTY_ID=354052616

# Caminho absoluto para o arquivo JSON da conta de serviço (Service Account)
GOOGLE_APPLICATION_CREDENTIALS=C:/Dev/overmelhinho/backend/storage/app/google-credentials.json
```

**Nota:** A Conta de Serviço associada ao JSON deve ter, no mínimo, a permissão de "Visualizador" na propriedade do Analytics.

## 🏗️ Arquitetura Técnica

A integração está dividida em três camadas principais:

### 1. Camada de Serviço (`app/Services/Ga4ReportingService.php`)
Centraliza as chamadas à API GA4 Data V1 Beta.
- **`getGlobalMetrics`**: Busca pageviews totais e histórico diário. Aceita períodos flexíveis (7d, 30d, mês atual, etc) ou datas customizadas.
- **`getRealtimeMetrics`**: Consulta o endpoint de tempo real do Google para identificar usuários ativos nos últimos 30 minutos e as URLs/Títulos de página mais acessados agora.
- **`getTrafficSources`/`getDeviceMetrics`/`getTopContent`**: Métodos especializados para extrair dimensões específicas (Origem, Dispositivo, Conteúdo).

### 2. Camada de Controller (`app/Http/Controllers/Api/V1/ReportController.php`)
Expõe os dados para o frontend.
- **`adminDashboard`**: Orquestra os dados do GA4 com dados internos do banco (MRR, Clientes, Inadimplência).
- **`realtimeMetrics`**: Um endpoint rápido e leve para ser consultado em alta frequência (Live Polling).

### 3. Camada Frontend (`frontend/src/pages/reports/AdminReportDashboard.tsx`)
Exibe os dados de forma visual e interativa.
- **Filtros Dinâmicos:** Permite alternar entre períodos pré-definidos ou selecionar um intervalo de datas no calendário.
- **Live Polling:** O sistema de tempo real utiliza uma consulta separada (`useQuery`) com intervalo de **30 segundos** para garantir o efeito "On-time".

## 📊 Métricas Implementadas

- **Usuários Ativos (Realtime):** Número de pessoas no site agora (janela de 30min).
- **Pageviews Totais:** Volume total de visualizações no período.
- **Conversões (Ações):** Cliques em WhatsApp e Waze (capturados via eventos customizados no site e processados via GA4).
- **Origem de Tráfego:** Google (Organic), Redes Sociais, Direto, etc.
- **Dispositivos:** Divisão entre Mobile e Desktop.
- **Top Conteúdo:** Ranking das notícias/páginas mais lidas.

## 🔍 Resolução de Problemas (Gotchas)

- **Dimensões em Tempo Real:** A API Realtime usa nomes de dimensões diferentes da API padrão. Ex: use `unifiedPageScreen` em vez de `pagePath` para evitar erros de argumento inválido.
- **Fuso Horário:** Os dados de histórico refletem o fuso horário configurado na propriedade do GA4.
- **Latência:** Dados em tempo real são imediatos, mas dados de histórico (pageviews totais) podem levar de 24h a 48h para estabilizar 100% no Google.
