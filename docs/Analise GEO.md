# O VERMELHINHO — ANÁLISE GEO & SEO (FASE 5)
## Documento de Transição e Continuidade (Handover)

**Data de Registro:** 18 de Novembro de 2026  
**Status Atual:** Release 3A publicada, Desbloqueio de IA no Cloudflare Homologado (HTTP 200 OK) e **Release 3B implementada e testada localmente com 100% de sucesso**.  
**Próxima Ação:** Validação final e deploy da **Release 3B** para o GitHub / VPS, seguido da **Release 3C** (City Hubs `/[citySlug]`).

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

### Passo 3: Release 3B (CONCLUÍDA E TESTADA LOCALMENTE)
✅ **CONCLUÍDO:**
- Criado helper `site/src/utils/schemaOrg.ts` com tipagem e testes unitários aprovados.
- Mapeamento granular de categorias para subtipos específicos do Schema.org (`AutoRepair`, `Dentist`, `MedicalClinic`, `Restaurant`, `LegalService`, etc.) mantendo compatibilidade `['LocalBusiness', Subtype]`.
- Injeção de `openingHoursSpecification` estruturada com turnos (manhã/tarde) e dias da semana conforme dados reais do banco, omitindo dias fechados.
- Inclusão dos schemas de raiz `@graph` contendo `WebSite` (com `SearchAction` apontando para `/busca?q={search_term_string}`) e `Organization` (com logo oficial e perfis em redes sociais) no `site/src/app/layout.tsx`.
- Removido schema redundante isolado em `site/src/app/page.tsx`.
- Typecheck TypeScript (`tsc --noEmit`): **0 erros**.
- Build de Produção (`npm run build` no Next.js): **Sucesso (Exit code 0)**.
- DevSecOps Security Scanner: **✅ Todos os arquivos com SCAN LIMPO**.

### Passo 4: Próxima Etapa — Release 3C (Hubs Municipais)
- Criação da rota `site/src/app/[citySlug]/page.tsx` para City Hubs (ex: `/caxias-do-sul`, `/farroupilha`).
- Inclusão da cidade no `BreadcrumbList` (`Home` -> `Cidade` -> `Segmento` -> `Empresa`).
- Adição de sitemap dinâmico de cidades em `site/src/app/sitemap.ts`.

