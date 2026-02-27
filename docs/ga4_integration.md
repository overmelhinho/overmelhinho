# 📊 Módulo de Integração GA4 (Google Analytics 4)

Este módulo implementa a infraestrutura de rastreamento híbrido para o portal **O Vermelhinho**, combinando rastreamento via navegador (Frontend) e via servidor (Backend - Measurement Protocol), além de consumir a Data API para relatórios.

---

## 🏗️ Arquitetura Híbrida

O sistema utiliza duas frentes de rastreamento para garantir a máxima precisão dos dados, contornando limitações de AdBlockers e cookies.

### 1. Rastreamento de Navegador (Client-Side)
- **Tecnologia**: `react-ga4`
- **Hook**: `useClientAnalytics.ts`
- **Funcionamento**: Ao carregar a página de um cliente ou vaga, o hook dispara um evento `page_view` enriquecido com dimensões personalizadas.
- **Vantagem**: Captura dados ricos do navegador (origem, dispositivo, localização, tempo de sessão).

### 2. Rastreamento de Servidor (Server-Side)
- **Tecnologia**: GA4 Measurement Protocol
- **Service**: `Ga4MeasurementProtocolService.php`
- **Funcionamento**: Toda vez que o banco de dados registra uma interação (clique em WhatsApp, Waze, etc), o servidor envia simultaneamente um evento para o Google Analytics via HTTP.
- **Vantagem**: Garante o rastreamento mesmo se o usuário tiver AdBlocker ativado ou se houver falha no JavaScript do cliente.

---

## 🛠️ Implementação Técnica

### Backend (Laravel)

- **`Ga4MeasurementProtocolService.php`**: Envia eventos de conversão diretamente para o GA4 usando o `api_secret`.
- **`Ga4ReportingService.php`**: Consulta a *Beta Analytics Data API* para extrair métricas de performance específicas de cada cliente.
- **`TrackingController.php`**: Ponto de entrada das interações que dispara o rastreamento server-side.
- **`ReportController.php`**: Integra os dados reais do GA4 no dashboard do lojista.

### Frontend (React)

- **`lib/analytics.ts`**: Utilitário de inicialização global do GA4.
- **`hooks/useClientAnalytics.ts`**: Hook que automatiza o disparo de page views e fornece a função `trackInteraction` para botões de conversão.

---

## 🎯 Dimensões Personalizadas (Custom Dimensions)

Para que os relatórios funcionem, as seguintes dimensões **devem** ser criadas no console do Google Analytics 4:

| Dimensão | Nome no GA4 | Escopo | Descrição |
| :--- | :--- | :--- | :--- |
| `client_id` | `customEvent:client_id` | Evento | ID numérico do cliente no banco de dados. |
| `client_segment` | `customEvent:client_segment` | Evento | Segmento/Ramo de atividade do cliente. |
| `client_city` | `customEvent:client_city` | Evento | Cidade base do anunciante. |

---

## ⚙️ Configuração (.env)

### Frontend
```env
VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Backend
```env
GA4_MEASUREMENT_ID=G-XXXXXXXXXX
GA4_API_SECRET=seu_api_secret_do_fluxo_de_dados
GA4_PROPERTY_ID=123456789
GOOGLE_APPLICATION_CREDENTIALS=storage/app/analytics/service-account.json
```

---

## 📋 Como Configurar o Acesso à API

1. **Google Cloud Console**:
   - Ative a "Google Analytics Data API".
   - Crie uma **Conta de Serviço (Service Account)**.
   - Gere uma chave em formato **JSON** e salve em `backend/storage/app/analytics/service-account.json`.
2. **Google Analytics**:
   - Vá em Admin > Propriedade > Gerenciamento de Acesso à Propriedade.
   - Adicione o e-mail da Service Account (ex: `analitica@projeto.iam.gserviceaccount.com`) com permissão de **Visualizador**.

---

## 📦 Eventos Padronizados

- `page_view`: Visualização do perfil ou da vaga.
- `whatsapp_click`: Clique no botão de WhatsApp.
- `waze_click`: Clique no botão de Mapa/Waze.
- `social_click`: Clique em links de Redes Sociais.
- `view_client_profile`: Evento explícito de interesse no lojista.
