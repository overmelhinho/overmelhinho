# 🏁 Checklist de Ativação: Google Analytics 4 (GA4)

Este documento serve para acompanhar o progresso da configuração final do GA4. Siga a ordem abaixo para garantir que a integração híbrida funcione corretamente.

---

## 🟦 FASE 1: Google Analytics 4 (Admin Console)
*Configurações manuais no painel do GA4.*

- [x] **1.1. Dimensões Personalizadas**: Criar 3 dimensões de escopo "Evento":
    - `client_id` (Parâmetro: `client_id`)
    - `client_segment` (Parâmetro: `client_segment`)
    - `client_city` (Parâmetro: `client_city`)
- [x] **1.2. API Secret**: Gerar o segredo do *Measurement Protocol* (Fluxos de Dados > Selecionar Fluxo > Protocolo de medição).
- [x] **1.3. Acesso**: Adicionar o e-mail da Service Account (`analitica-overmelhinho@...`) como **"Visualizador"** na Propriedade.



---

## 🟧 FASE 2: Google Cloud Console (API & Credenciais)
*Configurações de infraestrutura e segurança.*

- [x] **2.1. Ativação de API**: Ativar a **"Google Analytics Data API"** no projeto Cloud.
- [x] **2.2. Service Account**: Criar uma Conta de Serviço e salvar o e-mail dela.
- [x] **2.3. Chave JSON**: Gerar uma chave JSON para a Service Account, renomear para `service-account.json`.


---

## 🟩 FASE 3: Integração de Código (Backend/Frontend)
*Finalização do rastreamento em pontos de conversão.*

- [x] **3.1. Infraestrutura Base**: Services Laravel e Hooks React criados.
- [x] **3.2. Tracking de Vagas**: Implementado na página de detalhes de vagas públicas.
- [ ] **3.3. Tracking do Portal Público**: Injetar `useClientAnalytics` nos botões de contato (WhatsApp, Waze, Redes Sociais) do perfil da empresa.
- [ ] **3.4. Validar Relatórios**: Verificar se `ClientReportDashboard` está consumindo os dados da Data API sem erros.

---

## 🚀 FASE 4: Configuração de Produção & Deploy (VPS)
*Ativação no servidor final.*

- [x] **4.1. Upload de Credenciais**: Enviar o `service-account.json` para `backend/storage/app/analytics/`.

- [ ] **4.2. Variáveis de Ambiente (.env)**: Configurar no servidor:
    - `GA4_MEASUREMENT_ID`
    - `GA4_API_SECRET`
    - `GA4_PROPERTY_ID`
    - `VITE_GA4_MEASUREMENT_ID`
- [ ] **4.3. Build Frontend**: Rodar `npm run build` no servidor para compilar a nova biblioteca `react-ga4`.
- [ ] **4.4. Cache Laravel**: Rodar `php artisan config:clear` e `php artisan config:cache`.

---

### 📝 Notas Adicionais:
*   **AdBlockers**: Após concluir o passo 1.2 e 4.2, o tracking do servidor (Measurement Protocol) começará a funcionar instantaneamente, mesmo que o usuário bloqueie o Google no navegador.
*   **Dados Iniciais**: O Google leva até 24h para começar a mostrar dados de Dimensões Personalizadas nos relatórios da Data API.
