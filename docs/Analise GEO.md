# O VERMELHINHO — ANÁLISE GEO & SEO (FASE 5)
## Documento de Transição e Continuidade (Handover)

**Data de Registro:** 18 de Novembro de 2026  
**Status Atual:** Releases 3A e 3B publicadas em produção (`3b8bbdb`) e **Release 3C (Hubs Municipais) implementada e testada localmente com 100% de sucesso**.  
**Próxima Ação:** Validação e deploy da **Release 3C** para o GitHub / VPS, seguido da **Release 3D** (Enriquecimento textual e conteúdo dinâmico).

---

## 1. Contexto e Onde Paramos

Concluímos com sucesso a **Sprint 4** e a **Release 3A** em produção (commit `e3696d0`), estabilizando sitemaps em streaming, eliminando o markup artificial de `FAQPage` e implementando a canonicalização estrita 301/308 para URLs de clientes.

Em 18 de Novembro de 2026, concluímos o **desbloqueio dos crawlers de IA na borda do Cloudflare** (OpenAI `GPTBot`, `OAI-SearchBot`, Perplexity `PerplexityBot`, Anthropic `ClaudeBot`), todos respondendo com **HTTP 200 OK**.

O portal agora está totalmente acessível para os motores de busca generativa (ChatGPT Search, Perplexity, Claude, Gemini, Copilot).

---

## 2. Diagnóstico Técnico Consolidado (Auditoria)

### A. Borda Cloudflare — Bloqueio de Crawlers de IA (P0)
- **Problema:** O Cloudflare está respondendo **HTTP 403 Forbidden** (*"Your request was blocked."*) para requisições de crawlers autônomos de IA (`GPTBot`, `PerplexityBot`, `ClaudeBot`).
- **Causa:** Recurso nativo *"Block AI Scrapers and Crawlers"* ativado no painel da Cloudflare (Security > Bots).
- **Impacto:** O portal não é indexado de forma autônoma pelos índices do ChatGPT Search e Perplexity, impedindo citações orgânicas em respostas de IA.
- **Solução Planejada:** No painel da Cloudflare (`dash.cloudflare.com` > Zona `overmelhinho.com.br` > Security > Bots), desativar o toggle ou criar uma regra de exceção WAF permitindo esses User-Agents no topo da lista.

### B. Schema.org — `FAQPage` Oculto do Usuário (P0)
- **Problema:** As páginas de empresas injetavam um bloco JSON-LD `@type: "FAQPage"` com 3 perguntas e respostas automáticas, mas esse conteúdo **não era exibido visualmente no HTML** para o visitante.
- **Causa/Risco:** Violação direta das *Google Search Central Structured Data Guidelines* (*Spammy Structured Markup*), que acarreta perda de rich snippets e risco de ação manual.
- **Solução Implementada (Release 3A):** O markup artificial de FAQ foi completamente removido do código de `page.tsx`, sem necessidade de alterar a interface do usuário. `BreadcrumbList` e `LocalBusiness` continuam ativos e 100% válidos.

### C. Roteamento de Empresas — URLs Não-Canônicas (P0)
- **Problema:** URLs com parâmetros genéricos como `/cidade/empresa/auto-eletrica-bentaqui` ou com cidades não atendidas respondiam **HTTP 200 OK**, gerando páginas duplicadas e diluição de autoridade.
- **Solução Implementada (Release 3A):** Implementada a função centralizada `getCanonicalParams` em `site/src/app/[citySlug]/[segmentSlug]/[clientSlug]/page.tsx`. Qualquer acesso com cidade incorreta, segmento genérico ou ID numérico agora emite **HTTP 301 Permanente** diretamente para a URL canônica exata. URLs canônicas respondem 200 OK sem loops.

### D. Lacunas Estruturais para as Próximas Releases
1. **City Hubs Inexistentes (`/[citySlug]` retorna 404):** URLs como `/caxias-do-sul` e `/farroupilha` retornam 404. O `BreadcrumbList` pula o nível da cidade. (Alvo da **Release 3C**).
2. **Subtipos de LocalBusiness e Horários Omitidos:** 1.208 empresas têm horários semanais estruturados no banco, mas o Schema.org não serializa `openingHoursSpecification`. Todas usam o tipo genérico `LocalBusiness`. (Alvo da **Release 3B**).
3. **Ausência de `WebSite` e `Organization` no Layout:** `layout.tsx` não declara `WebSite` com `SearchAction` (Sitelinks Searchbox). (Alvo da **Release 3B**).
4. **Boilerplate em Categorias (`DynamicSeoText.tsx`):** Texto repetitivo em milhares de páginas. (Alvo da **Release 3D**).

---

## 3. Estado Atual dos Arquivos Locais (Release 3A Pronta)

### Arquivo Modificado:
- `site/src/app/[citySlug]/[segmentSlug]/[clientSlug]/page.tsx`
  - Removido gerador de `faqQuestions` e injeção do schema `FAQPage`.
  - Implementada função `getCanonicalParams(client, citySlug, segmentSlug)`.
  - Inserida validação estrita de redirecionamento 301 para cidade, segmento e slug canônicos.
  - Preservados `breadcrumbJsonLd` e `localBusinessJsonLd`.

### Testes Realizados e Aprovados:
1. **TypeScript Typecheck:** `npx tsc --noEmit` executado em `site/` -> **0 erros (Exit code 0)**.
2. **DevSecOps Security Scanner:** `php .agents/skills/security_scanner/scripts/scan.php` -> **✅ SCAN LIMPO**.
3. **Suíte Canônica de Roteamento (9 cenários testados):**
   - URL canônica exata -> **HTTP 200 OK**.
   - URL `/cidade/empresa/slug` -> **HTTP 301** para canônica.
   - Cidade não atendida -> **HTTP 301** para cidade principal.
   - Cidade secundária atendida legítima -> **HTTP 200 OK**.
   - Acesso por ID numérico em vez de slug -> **HTTP 301** para slug canônico.
   - URL com maiúsculas/espaços -> **HTTP 301** para normalizada.
   - Empresa sem slug -> **HTTP 200 OK** usando ID canônico.
   - Empresa inativa com redirect suggestion -> **HTTP 301** para categoria.
   - Empresa inexistente -> **HTTP 404 notFound**.

---

## 4. Guia Passo a Passo para Retomada

Quando formos retomar as atividades de GEO/SEO, seguir a ordem abaixo:

### Passo 1: Publicação da Release 3A
✅ **CONCLUÍDO:** Código publicado no commit `e3696d0` e ativo em produção.

### Passo 2: Ajuste no Cloudflare (Borda)
✅ **CONCLUÍDO E HOMOLOGADO:**
- Configurações de IA ajustadas no painel da Cloudflare.
- Testes reais de requisição realizados com sucesso:
  - `GPTBot/1.2`: **HTTP 200 OK**
  - `PerplexityBot/1.0`: **HTTP 200 OK**
  - `ClaudeBot/1.0`: **HTTP 200 OK**
  - `OAI-SearchBot/1.0`: **HTTP 200 OK**

### Passo 3: Release 3B (CONCLUÍDA E PUBLICADA)
✅ **CONCLUÍDO:** Código publicado no commit `3b8bbdb` e ativo em produção.

### Passo 4: Release 3C (Hubs Municipais) — CONCLUÍDA E TESTADA LOCALMENTE
✅ **CONCLUÍDO:**
- Criada a página `site/src/app/[citySlug]/page.tsx` para City Hubs municipais (ex: `/caxias-do-sul`, `/farroupilha`, `/garibaldi`, etc.), eliminando os 404 anteriores.
- Exibição dinâmica de:
  - Total de categorias ativas na cidade.
  - Barra de busca comercial pré-escopada para a cidade.
  - Categorias populares em destaque com ícones visuais e links navegáveis.
  - Empresas em destaque na cidade com fotos, logotipos, segmento e botão direto de WhatsApp.
  - Índice completo em grade de todos os segmentos atendidos na cidade.
  - Links para cidades vizinhas da Serra Gaúcha.
- Schemas estruturados de SEO:
  - `BreadcrumbList`: 2 níveis (`Home` -> `${Cidade} - ${UF}`).
  - `CollectionPage` e `City`: entidade geográfica e lista de itens locais.
- Ajustada hierarquia de Breadcrumbs em todo o portal:
  - Página de Categoria (`/[citySlug]/[segmentSlug]`): 3 níveis (`Home` -> `${Cidade}` -> `${Segmento}`).
  - Página de Cliente (`/[citySlug]/[segmentSlug]/[clientSlug]`): 4 níveis (`Home` -> `${Cidade}` -> `${Segmento}` -> `${Empresa}`).
- Adicionado sitemap de cidades em `site/src/app/sitemap.ts` com prioridade 0.9 cobrindo as 28 cidades autorizadas.
- Typecheck TypeScript (`tsc --noEmit`): **0 erros**.
- Build de Produção (`npm run build` no Next.js): **Sucesso (Exit code 0)**.
- DevSecOps Security Scanner: **✅ Todos os arquivos com SCAN LIMPO**.

### Passo 5: Próxima Etapa — Release 3D (Enriquecimento Textual e Otimização GEO)
- Otimização do componente de texto SEO dinâmico (`DynamicSeoText.tsx`) para eliminar boilerplate e entregar resumos semânticos reais sobre o segmento na região.
- Testes de recomendação em LLMs.

