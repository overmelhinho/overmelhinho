# Módulo de SEO e Integração Google Search Console

Este documento detalha o funcionamento, as integrações e a arquitetura do **Módulo de SEO** do sistema O Vermelhinho, o qual permite o acompanhamento em tempo real da performance das palavras-chave dos clientes nas buscas do Google.

---

## 🔗 Integração GSC (Google Search Console)

O motor central do módulo está integrado à API oficial do Google Search Console.
A comunicação é feita através de uma **Conta de Serviço (Service Account)** autenticada via um arquivo JSON de credenciais, o que permite o acesso seguro e de forma desacompanhada (sem a necessidade de login humano).

### Arquivos e Chaves Necessárias
- **Arquivo JSON de Credenciais:** `backend/storage/app/google/service-account.json`. (Contém as chaves criptográficas geradas no Google Cloud).
- **Variável `.env`:** O sistema busca automaticamente os dados da propriedade definida na variável `GOOGLE_SEARCH_CONSOLE_SITE_URL` (ex: `https://www.overmelhinho.com.br/`).
- Importante: O e-mail da Conta de Serviço foi adicionado na aba de *Usuários e permissões* da respectiva propriedade no painel do Google Search Console (Nível de acesso: Proprietário ou Leitura).

---

## ⚙️ Arquitetura e Lógica de Negócio (Backend)

O backend Laravel opera todo o maquinário de coletas e disparos de alertas de negócio usando ferramentas nativas.

### 1. Serviço de Comunicação (`App\Services\GoogleSearchConsoleService`)
Utiliza a biblioteca oficial do Google para PHP (`google/apiclient`).
Responsável por disparar a query de consulta informando um período fixo (últimos `14` dias), buscando pelos indicadores em torno da palavra em questão (`query`).
**Métricas coletadas:**
- **Posição Média:** Em qual página/posição do Google o site está listado.
- **Cliques:** Tráfego real gerado.
- **Impressões:** Número de vezes que o link apareceu nas telas de visualização dos usuários.
- **CTR ("Click-through Rate"):** Taxa de conversão de quem viu e aplicou o clique (`(Cliques / Impressões) * 100`).

### 2. Job Automático e de Alertas (`App\Console\Commands\CheckSeoRankings`)
Comando: `php artisan seo:check-rankings`.
*Como funciona:*
- Varre todos os clientes cadastrados baseando-se no banco de dados (`clientes`).
- Resgata os termos customizados vinculados à coluna JSON `seo_keywords`. Quando vazios, os preenche dinamicamente (baseado no `nome_fantasia` ou segmento) para manter um "fallback" de amostragem no painel.
- O sistema processa termo a termo fazendo as requisições à Google API e gravando cada resposta no banco `seo_rankings`.

**Regra de Queda no Ranking (Sistema Ticket):**
O script compara também o histórico imediato. Se a palavra testada caiu de posição no Google (**ex: perdeu 3 ou mais posições** em relação ao check anterior), um "Alerta" instantâneo em forma de `Ticket` é despachado para a gerência de Marketing. O ticket conterá recomendações explícitas informando a palavra, a posição de queda e pedindo medidas de suporte sobre o conteúdo.

### 3. Banco de Dados
A tabela principal `seo_rankings` arquiva o "clipping". As buscas constantes geram novos apontamentos em timestamps `checked_at` diferentes, tornando a tabela inteiramente baseada em Log Histórico para renderização dos gráficos na interface.

---

## 🖥️ Painel Gráfico no Portal (Frontend)

Na edição dos clientes, o pacote `SeoPerformanceWidget.tsx` encapsula as lógicas de frontend. 

### Características principais:
- **Integração Real-time:** Utiliza hooks isolados via `useSeoRankings` (`@tanstack/react-query`).
- **Lista Expansível (`SeoRow`) & Cards:** Mostra visões focadas e em listagem das buscas em andamento daquele momento de cada *keyword*.
- **Indicadores de Trend:** Através de funções matemáticas atreladas à listagem (`getTrendData`), informa visualmente através de cores as subidas (`verde/up`), quedas (`vermelho/down`) ou estagnação (`cinza/stable`).
- **DataViz interativo (Recharts):** 
  - Dentro dos relatórios expandidos do widget em Lista, constam gráficos em Layout do estilo "Google" baseados na biblioteca **Recharts**, formando uma curva de *Área* `AreaChart` ou *Linhas* em miniatura nos cards para evidenciar como as visualizações estão decrescendo/crescendo no curto prazo (últimas 10 passagens do bot).
- **Inteligência Auxiliar Insight IA:** Analisa o **CTR (%)** localmente e apresenta recomendações descritivas em balões coloridos. Por exemplo, CTRs ruins levantam apontamento sobre as "meta tags description" não atraentes ao visualizador no buscador.
