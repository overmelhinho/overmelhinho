# O VERMELHINHO — AUDITORIA SEO + GEO
## Fase 4 / Sprint 3 — Diagnóstico de Redirecionamentos, Links Internos e Sitemaps

**Site:** https://www.overmelhinho.com.br  
**Data:** 12/11/2026  
**Status da Etapa:** Diagnóstico Preliminar para Aprovação (Nenhuma alteração ou deploy executado)  
**Ambiente Auditado:** Código-fonte de Desenvolvimento (`main`), Servidor de Homologação Local (`localhost:3000` / `8000`) e Produção (`overmelhinho.com.br`)  

---

### 1. Inventário de URLs e Redirecionamentos Antigos

A auditoria identificou padrões de inconsistência, cadeias de redirecionamento de múltiplos saltos (*redirect chains*), divergência de protocolos e descarte indevido de parâmetros.

#### A. Host Canônico e Protocolos (HTTP vs HTTPS / WWW vs sem WWW)
- **Comportamento Atual:**
  - `http://overmelhinho.com.br` $\rightarrow$ 301 $\rightarrow$ `https://overmelhinho.com.br/` (HTTP 200)
  - `http://www.overmelhinho.com.br` $\rightarrow$ 301 $\rightarrow$ `https://www.overmelhinho.com.br/` (HTTP 200)
  - `https://overmelhinho.com.br` $\rightarrow$ **HTTP 200 Direto**
  - `https://www.overmelhinho.com.br` $\rightarrow$ **HTTP 200 Direto**
- **Impacto SEO:** O portal responde com HTTP 200 simultaneamente em `overmelhinho.com.br` e `www.overmelhinho.com.br`. Para o Googlebot, tratam-se de **dois sites espelho**, gerando diluição de autoridade e divisão de PageRank, embora a tag canonical aponte para `www`.
- **Proposta:** Configurar redirecionamento 301 forçado e universal de `https://overmelhinho.com.br/*` $\rightarrow$ `https://www.overmelhinho.com.br/*` (a ser alinhado no Nginx/Cloudflare e reforçado no Next.js middleware).

#### B. Cadeias de Redirecionamento (Redirect Chains)
Foram mapeadas as seguintes cadeias com 2 ou mais saltos:

1. **Busca HTTP para Busca HTTPS com Parâmetro:**
   - `http://overmelhinho.com.br/busca.php?palavra=restaurante`
   - *Salto 1:* 301 $\rightarrow$ `https://overmelhinho.com.br/busca.php?palavra=restaurante`
   - *Salto 2:* 301 $\rightarrow$ `https://overmelhinho.com.br/busca?q=restaurante`
   - *Destino Final:* HTTP 200 (2 saltos).

2. **Busca Legada com Cidade e Categoria (`busca.php` $\rightarrow$ `/api/legacy-busca`):**
   - Requisição: `/busca.php?id_cidade=64&id_categoria=899`
   - *Salto 1:* 301 $\rightarrow$ `/api/legacy-busca?id_categoria=899&id_cidade=64` (disparado pelo `middleware.ts`)
   - *Salto 2:* 301 $\rightarrow$ `/busca?q=comunicacao-integrada` (disparado por `legacy-busca/route.ts`)
   - *Destino Final:* HTTP 200 (2 saltos).
   - ⚠️ **Descarte Crítico de Parâmetro:** O `id_cidade=64` foi descartado durante o salto no Route Handler porque o `API_URL` local/remoto não localizou a cidade de forma síncrona, convertendo uma busca regional específica em uma busca textual ampla (`/busca?q=...`).

3. **Empresas Legadas de outros Estados ou vias genéricas:**
   - Requisição: `/pr/curitiba/empresa/107316` ou `/:slug;contato:id107316.php`
   - *Salto 1:* 301 $\rightarrow$ `/cliente/107316` (via `next.config.ts` ou `middleware.ts`)
   - *Salto 2:* 308 $\rightarrow$ `/barao/produtos-caseiros/colina-verde-doces-e-geleia` (via `cliente/[id]/page.tsx`)
   - *Destino Final:* HTTP 200 (2 saltos, combinando 301 com 308).

4. **Padrão HTTP 308 vs HTTP 301 no Next.js:**
   - O Next.js App Router usa por padrão o método `permanentRedirect()`, que emite **HTTP 308 (Permanent Redirect)**.
   - Embora padronizado pela RFC 7538, ferramentas legadas de SEO e diretrizes tradicionais do Google recomendam estritamente **HTTP 301 (Moved Permanently)** para garantir o repasse integral de link equity (*link juice*) e compatibilidade universal com proxies.

#### C. Redirecionamentos para Páginas Inexistentes (Redirecionamento para 404)
- **Empresas Inativas com Sugestão de Redirecionamento:**
  - Em `backend/app/Http/Controllers/Api/V1/ClienteController.php` (linha 919), quando um cliente está com `exibir_no_site = false`, a API retorna `redirect_suggestion: { city_slug: X, segment_slug: Y }`.
  - Nos componentes `site/src/app/cliente/[id]/page.tsx` e `[citySlug]/[segmentSlug]/[clientSlug]/page.tsx`, o frontend executa imediatamente:
    `permanentRedirect('/' + city_slug + '/' + segment_slug)`
  - 🚨 **Cenário de Erro:** Se essa categoria sugerida não possuir nenhuma outra empresa ativa, a Sprint 2 dispara legitimamente `notFound()` (**HTTP 404**).
  - **Resultado:** O usuário e o robô sofrem um **301/308 que cai direto em um HTTP 404**. O Google Search Console classifica isso como erro grave de rastreamento (*Faulty Redirect*).

---

### 2. Auditoria de Links Internos

Foram analisados todos os componentes de layout, navegação, rodapé e páginas de conteúdo.

#### A. Links Quebrados em Nível Global (100% das páginas afetadas)
1. **Link para `/blog` (HTTP 404):**
   - Presente no **Header** (`site/src/components/Header.tsx`, linha 12: menu desktop e mobile).
   - Presente no **Footer** (`site/src/components/Footer.tsx`, linha 42: Acesso Rápido).
   - A rota `/blog` não foi implementada no Next.js, gerando links quebrados em todas as páginas indexadas do portal.

2. **Links de Destaques Regionais no Rodapé (HTTP 404):**
   - No `site/src/components/Footer.tsx` (linhas 103-105):
     - `href="/farroupilha/saude"` $\rightarrow$ **HTTP 404** (categoria sem empresas ativas ou slug desatualizado).
     - `href="/bento-goncalves/gastronomia"` $\rightarrow$ **HTTP 404** (categoria sem empresas ativas; no banco o slug é `restaurantes`).
   - Apenas `href="/caxias-do-sul/servicos"` retorna HTTP 200.
   - **Gravidade Alta:** O rodapé é replicado em todas as URLs, espalhando links internos diretos para páginas 404, prejudicando o rastreamento do Google.

#### B. Ausência da Rota Raiz de Cidades (`/{citySlug}`)
- URLs como `/farroupilha`, `/caxias-do-sul` e `/bento-goncalves` retornam **HTTP 404**.
- O Next.js possui apenas a rota com dois segmentos `/[citySlug]/[segmentSlug]`.
- Quando um usuário clica no seletor de cidade ou um robô tenta descobrir a cidade raiz, recebe 404.

#### C. Links Internos com Redirecionamento Transitório
- Em `site/src/app/vagas/[id]/JobDetailClient.tsx` (linha 362):
  - O card da empresa vinculada à vaga utiliza: `href={'/cliente/' + job.clientSlug}`.
  - Isso gera um link interno para uma rota intermediária que obriga o navegador a processar um redirecionamento 308 até a URL canônica `/{cidade}/{categoria}/{slug}`.
- Em `site/src/components/SearchAutocomplete.tsx` e `HeaderSearch.tsx`:
  - Ao clicar em uma categoria sugerida, a busca redireciona para `/busca?q=...` em vez da URL canônica estruturada `/{cidade}/{categoria}`.

---

### 3. Auditoria Completa dos Sitemaps

#### A. A Auditoria das 63 Combinações Comerciais Ausentes
- **Origem do Problema Identificada:**
  - O método `ClienteController::activeSitemapCombinations()` consulta exclusivamente a tabela pivô `cliente_cidade` (empresas que atendem a cidade).
  - O método não consulta a tabela `enderecos` (onde reside a sede física das empresas).
  - Quando a empresa é sediada fisicamente em uma cidade mas não foi cadastrada manualmente na tabela de abrangência `cliente_cidade`, a busca pública da Sprint 1 a exibe normalmente (HTTP 200), mas o sitemap a ignora.
- **Validação no Banco de Dados:**
  - Combinações via `cliente_cidade` (atendidas): **8.719**
  - Combinações via `enderecos` (sediadas): **8.318**
  - Combinações legítimas existentes **estritamente via endereço físico**: **Exatamente 63 combinações**.
  - Exemplos de páginas válidas (HTTP 200 com empresas ativas) que estavam fora do sitemap:
    - *Caxias do Sul / Provedor de Internet* (ID 847)
    - *Flores da Cunha / Transporte rodoviário de carga* (ID 1274)
    - *Bento Gonçalves / Massagem* (ID 1746)
    - *Farroupilha / Metal Mecânica* (ID 2016)
    - *Flores da Cunha / PPCI* (ID 1801)

#### B. Verificação de Combinações Vazias nos Sitemaps
- **Resultado:** **Zero combinações vazias publicadas.**
- A consulta SQL atual utiliza `INNER JOIN` obrigatório com `clientes` onde `exibir_no_site = 'true'` e status de assinatura ativo/gratuito. Nenhuma combinação com 0 empresas ativas está presente nos sitemaps gerados.

#### C. Duplicação Massiva entre `/sitemap.xml` e `/sitemap-categorias.xml`
- No arquivo `site/src/app/robots.ts`, estão declarados:
  ```ts
  sitemap: [
      `${SITE_URL}/sitemap.xml`,
      `${SITE_URL}/sitemap-categorias.xml`,
  ]
  ```
- **Conflito Detectado:**
  1. `/sitemap.xml` (gerado por `sitemap.ts`) inclui as **8.719 combinações de categorias** + as **2.500 empresas ativas**.
  2. `/sitemap-categorias.xml` (gerado por `sitemap-categorias.xml/route.ts`) é um índice que aponta para `/sitemap-categorias/1/sitemap.xml`, que lista **as mesmas 8.719 combinações de categorias**.
- **Impacto:** O Googlebot é forçado a processar as mesmas 8.719 URLs em duplicidade em dois sitemaps concorrentes.

---

### 4. Matriz de Priorização por Risco e Impacto

| Prioridade | Ação Recomendada | Impacto SEO | Risco | Esforço |
| :---: | :--- | :---: | :---: | :---: |
| **P1 — Crítica** | Corrigir links 404 do Header e Footer (`/blog`, `/farroupilha/saude`, `/bento-goncalves/gastronomia`). | Altíssimo | Quase nulo | Baixo |
| **P1 — Crítica** | Evitar redirecionamento de empresas inativas para categorias vazias (404). Se a categoria for vazia, responder 404/410 diretamente na empresa. | Alto | Baixo | Baixo |
| **P1 — Crítica** | Corrigir unificação WWW vs non-WWW (canonical host 301). | Altíssimo | Médio | Baixo |
| **P2 — Alta** | Incluir as 63 combinações de endereços físicos em `activeSitemapCombinations` (unindo `cliente_cidade` + `enderecos`). | Alto | Quase nulo | Baixo |
| **P2 — Alta** | Eliminar a duplicação entre sitemaps (definir `/sitemap.xml` como índice ou separar categorias de empresas). | Médio | Baixo | Médio |
| **P2 — Alta** | Eliminar cadeias de redirecionamento no `busca.php` e rotas antigas de empresas, apontando direto para o destino final (1 hop 301). | Médio | Baixo | Médio |
| **P3 — Média** | Atualizar link interno em `JobDetailClient.tsx` para usar a URL canônica da empresa em vez de `/cliente/:slug`. | Baixo | Quase nulo | Baixo |
| **P3 — Média** | Implementar rota de transição amigável para `/{citySlug}` (listando principais categorias da cidade) para eliminar o 404 em nomes diretos de municípios. | Médio | Baixo | Médio |

---

### 5. Proposta Detalhada de Correções por Arquivo

#### 1. `site/src/components/Header.tsx` e `Footer.tsx`
- **Alteração:**
  - Remover link para `/blog` ou apontar temporariamente para `/anuncie` / central informativa, enquanto a seção de blog não for desenvolvida.
  - Atualizar os links de Destaques no Footer para categorias com empresas ativas comprovadas:
    - `/farroupilha/saude` $\rightarrow$ `/farroupilha/farmacias` ou `/farroupilha/produtos-caseiros` (HTTP 200).
    - `/bento-goncalves/gastronomia` $\rightarrow$ `/bento-goncalves/restaurantes` (HTTP 200, 101 empresas ativas).

#### 2. `backend/app/Http/Controllers/Api/V1/ClienteController.php` (`activeSitemapCombinations`)
- **Alteração:**
  - Atualizar a query de combinações ativas para realizar a união (`UNION`) entre as empresas vinculadas por `cliente_cidade` e as empresas vinculadas por `enderecos.cidade`.
  - **Efeito:** Inclui com precisão cirúrgica as 63 combinações legítimas que possuem empresas sediadas, totalizando **8.782 combinações ativas** (100% com HTTP 200).

#### 3. `site/src/app/cliente/[id]/page.tsx` e `[citySlug]/[segmentSlug]/[clientSlug]/page.tsx`
- **Alteração:**
  - Antes de executar `permanentRedirect` para a categoria de uma empresa inativa, verificar se a categoria possui empresas ativas.
  - Se a categoria estiver vazia, retornar `notFound()` (404) diretamente, evitando a cadeia de redirecionamento que deságua em erro.
  - Substituir o uso de `permanentRedirect` (HTTP 308) por resposta com status explícito **HTTP 301** nos redirecionamentos canônicos.

#### 4. `site/src/middleware.ts` e `site/next.config.ts`
- **Alteração:**
  - Consolidar a resolução de rotas legadas em um único ponto.
  - Eliminar o salto intermediário em `/api/legacy-busca`: o próprio middleware ou route handler deve resolver a URL canônica e emitir o 301 em salto único.
  - Padronizar a captura de `/-{slug}-;cat{id}.php` e `:slug;cat:id{id}.php`.

#### 5. `site/src/app/sitemap.ts` e `sitemap-categorias.xml/route.ts`
- **Alteração:**
  - Arquitetar uma divisão limpa de sitemaps:
    - `/sitemap.xml`: Sitemap Index mestre apontando para `/sitemap-categorias.xml` e `/sitemap-empresas.xml`.
    - `/sitemap-categorias.xml`: Contém exclusivamente as 8.782 categorias regionais ativas.
    - `/sitemap-empresas.xml`: Contém exclusivamente os perfis de empresas ativas.
  - Elimina 100% da redundância reportada aos motores de busca.

#### 6. `site/src/app/vagas/[id]/JobDetailClient.tsx`
- **Alteração:**
  - Gerar o link da empresa contratante utilizando a função utilitária `getClientSeoUrl()`, direcionando para `/{cidade}/{categoria}/{slug}` em vez de `/cliente/{id}`.

---

### 6. Plano de Testes e Rollback

#### Matriz de Testes Pré e Pós-Implementação:
1. **Teste de Links Internos (Crawl Local):**
   - Executar crawler automatizado em todas as páginas estáticas e de templates (`/`, `/vagas`, `/como-funciona`, páginas de categoria) para garantir **0 links internos com código HTTP 404**.
2. **Teste de Redirecionamentos em Salto Único:**
   - Testar rotas de `busca.php`, legacy empresas e legacy categorias garantindo que o cabeçalho `Location` aponte diretamente para a URL final (máximo 1 salto 301).
3. **Teste de Cobertura do Sitemap:**
   - Validar que as 63 combinações anteriormente ausentes agora constam no sitemap gerado.
   - Validar que 100% das URLs listadas no sitemap retornam HTTP 200 (zero 404 nos sitemaps).
4. **Verificação de Resiliência de Inativos:**
   - Simular acesso a empresa inativa com categoria vazia e comprovar ausência de redirecionamento para 404.

#### Procedimento de Rollback:
- As alterações de código da Sprint 3 serão desenvolvidas em branch dedicada `fix/seo-sitemaps-redirects-sprint3`.
- Nenhuma alteração destrutiva no banco de dados.
- Em caso de inconsistência, o retorno à versão estável `3d6c63e` (Sprint 2) é garantido via `git checkout main`.

---

> **Aviso Operacional:** Conforme solicitado, nenhuma linha de código em produção foi modificada e nenhum deploy foi realizado nesta fase. Este relatório aguarda análise e aprovação das diretrizes técnicas antes do início da implementação.

