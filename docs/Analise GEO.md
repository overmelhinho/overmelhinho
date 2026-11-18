# O VERMELHINHO — ANÁLISE GEO & SEO (FASE 5)
## Documento de Transição e Continuidade (Handover)

**Data de Registro:** 18 de Novembro de 2026  
**Status Atual:** Releases 3A (`e3696d0`), 3B (`3b8bbdb`) e 3C (`97ff280`) publicadas em produção. **Release 3D (Enriquecimento Semântico GEO, Âncoras de Entidades e FAQPage Visível) implementada e validada localmente**.  
**Próxima Ação:** Deploy da **Release 3D** para o GitHub / VPS, seguido de monitoramento contínuo de indexação e citações GEO.

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

### Passo 4: Release 3C (Hubs Municipais) — CONCLUÍDA E PUBLICADA
✅ **CONCLUÍDO:** Código publicado no commit `97ff280` e ativo em produção:
- Hubs municipais `/cidade` ativos com índice e destaques de empresas.
- Breadcrumbs canônicos de 3 níveis em categorias e 4 níveis em empresas.
- Sitemap dinâmico das 28 cidades da Serra Gaúcha em `sitemap.ts`.

### Passo 5: Release 3D (Enriquecimento Semântico GEO, Âncoras de Entidades e FAQPage Visível)
✅ **CONCLUÍDO E VALIDADO LOCALMENTE:**
- Reformulação integral do componente `site/src/components/DynamicSeoText.tsx`:
  - Fim do boilerplate repetitivo: categorização temática por domínio de atividade (Gastronomia, Saúde, Automotivo, Jurídico/Financeiro, Moda/Confecções, Construção, Beleza, Educação, Pet/Agro e Serviços Gerais).
  - Conteúdo prático com dicas de consumo e critérios de contratação específicos para cada segmento na cidade.
  - Tabela resumida de empresas verificadas (*Entity Anchors*) com nome, bairro, endereço e link direto de WhatsApp para ancoragem semântica em LLMs (ChatGPT, Perplexity, Claude, Gemini).
  - Bloco de Perguntas e Respostas (FAQ) 100% interativo e visível na interface do usuário através de acordeons expansíveis.
  - Injeção legítima e segura do schema Schema.org `@type: "FAQPage"` correspondente aos mesmos dados visíveis na tela, em conformidade estrita com as diretrizes do Google Search Central.
- Integração em `site/src/app/[citySlug]/[segmentSlug]/page.tsx` passando contexto da cidade, segmento e lista de empresas verificadas.
- Validação DevSecOps: `security_scanner` aprovado com **SCAN LIMPO**.
- Validação TypeScript: `tsc --noEmit` com **0 erros**.
- Testes SSR em ambiente local (`http://localhost:3000`) confirmando renderização de HTML semântico e bloco JSON-LD estruturado.

