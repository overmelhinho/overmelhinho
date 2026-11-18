# O VERMELHINHO — ANÁLISE GEO & SEO (FASE 5)
## Documento de Transição e Continuidade (Handover)

**Data de Registro:** 17 de Novembro de 2026  
**Status Atual:** Auditoria concluída e **Release 3A implementada e testada localmente**.  
**Próxima Ação na Retomada:** Publicação da Release 3A (Git commit/push e deploy supervisionado) e avanço para as configurações de borda/Releases 3B-3D.

---

## 1. Contexto e Onde Paramos

Concluímos com sucesso a **Sprint 4** em produção (Frontend commit `4805ec4b`, Backend commit `0cff0310`), estabilizando a geração de sitemaps via streaming e eliminando gargalos de memória (INC-01).

Em seguida, foi realizada a auditoria técnica profunda de **GEO (Generative Engine Optimization)** e **SEO Técnico**, analisando o comportamento do portal frente aos motores tradicionais (Google, Bing) e sistemas de IA (ChatGPT Search, Perplexity, Claude, Gemini, Copilot).

A **Release 3A** foi completamente codificada e validada localmente, deixando o ambiente pronto para publicação assim que a demanda prioritária da cliente for finalizada.

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
1. Revisar `git status` para confirmar que apenas `site/src/app/[citySlug]/[segmentSlug]/[clientSlug]/page.tsx` será enviado.
2. Com a autorização expressa do usuário ("suba para o github"), executar:
   ```bash
   git add site/src/app/[citySlug]/[segmentSlug]/[clientSlug]/page.tsx
   git commit -m "fix(seo): release 3a - remocao de faqpage artificial e redirecionamento 301 canonico estrito"
   git push origin main
   ```
3. Na VPS, executar o deploy manual supervisionado:
   ```bash
   sudo bash /var/www/deploy.sh
   ```
4. Validar na VPS:
   ```bash
   curl -I -s "https://www.overmelhinho.com.br/cidade/empresa/auto-eletrica-bentaqui"
   # Deve retornar HTTP 301/308 para /farroupilha/auto-eletrica/auto-eletrica-bentaqui
   curl -I -s "https://www.overmelhinho.com.br/farroupilha/auto-eletrica/auto-eletrica-bentaqui"
   # Deve retornar HTTP 200 OK
   ```

### Passo 2: Ajuste no Cloudflare (Borda)
No painel do Cloudflare:
- Ir em **Security > Bots** e desativar **"Block AI Scrapers and Crawlers"** (ou criar regra de Skip em WAF para `GPTBot`, `PerplexityBot` e `ClaudeBot`).
- Validar via terminal:
  ```bash
  curl.exe -I -s -A "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.2; +https://openai.com/gptbot)" "https://www.overmelhinho.com.br/caxias-do-sul/borracharias"
  # Deve retornar HTTP 200 OK
  ```

### Passo 3: Início da Release 3B
- Mapeamento de subtipos específicos de `LocalBusiness` (`AutoRepair`, `Dentist`, `MedicalClinic`, etc.).
- Injeção de `openingHoursSpecification` para empresas com horários preenchidos.
- Inclusão dos schemas `WebSite (SearchAction)` e `Organization` no `layout.tsx`.

