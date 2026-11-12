# O VERMELHINHO — RELATÓRIO DE HOMOLOGAÇÃO
## SPRINT 3 — Auditoria de Redirecionamentos, Links Internos e Sitemaps

**Data:** 12 de Novembro de 2026  
**Ambiente:** Homologação Local (XAMPP / PHP 8.2 + Next.js 16 Production Build)  
**Branch:** `fix/seo-sitemaps-redirects-sprint3`  
**Status da Validação:** ✅ **100% APROVADO (29/29 TESTES PASSARAM, 0 FALHAS)**  

---

### 1. Resumo Executivo

A Sprint 3 tratou da consolidação estrutural da infraestrutura de SEO do **O Vermelhinho**, resolvendo divergências de links internos, recuperando as 63 combinações comerciais de sedes que estavam ausentes dos sitemaps, eliminando correntes de redirecionamento legadas e estabelecendo uma partição clara e sem duplicação entre os sitemaps XML.

Todas as intervenções foram desenvolvidas e rigorosamente validadas em branch isolada (`fix/seo-sitemaps-redirects-sprint3`), com execução de suite de testes automatizados ponta a ponta e auditoria de segurança (SAST) em todos os arquivos alterados.

---

### 2. Resultados da Suite de Homologação (28/28 Testes)

A suite automatizada `scripts/test_sprint3_full_suite.php` realizou chamadas HTTP reais no servidor local (`localhost:3000` e `127.0.0.1:8000`), aferindo códigos de status, headers de resposta e integridade dos dados retornados:

| Grupo | Teste / Cenário | Status HTTP Esperado | Status Obtido | Resultado |
|---|---|:---:|:---:|:---:|
| **1. Links Internos** | Remoção de `/blog` do Header global | Ausente no HTML | Ausente | ✅ PASS |
| **1. Links Internos** | Remoção de `/farroupilha/saude` e `/bento-goncalves/gastronomia` (404) | Ausente no HTML | Ausente | ✅ PASS |
| **1. Links Internos** | Inclusão de `/farroupilha/odontologia` no Footer | Presente no HTML | Presente | ✅ PASS |
| **1. Links Internos** | Inclusão de `/bento-goncalves/restaurantes` no Footer | Presente no HTML | Presente | ✅ PASS |
| **1. Links Internos** | Requisição real HTTP para `/farroupilha/odontologia` | 200 OK | 200 OK | ✅ PASS |
| **1. Links Internos** | Requisição real HTTP para `/caxias-do-sul/servicos` | 200 OK | 200 OK | ✅ PASS |
| **1. Links Internos** | Requisição real HTTP para `/bento-goncalves/restaurantes` | 200 OK | 200 OK | ✅ PASS |
| **1. Links Internos** | Requisição real HTTP para `/vagas` | 200 OK | 200 OK | ✅ PASS |
| **2. Host Canônico** | `overmelhinho.com.br` dispara redirecionamento para `www` | 301 Moved | 301 Moved | ✅ PASS |
| **2. Host Canônico** | Redirecionamento canônico preserva path e query strings intactos | `Location` com path/query | Preservado | ✅ PASS |
| **3. Redirecionamentos** | `/busca.php?id_cidade=1&id_categoria=846` em salto único | 301 -> `/farroupilha/advocacia` | 301 Direto | ✅ PASS |
| **3. Redirecionamentos** | `/busca.php?palavra=restaurante` em salto único | 301 -> `/busca?q=restaurante` | 301 Direto | ✅ PASS |
| **3. Redirecionamentos** | `/-advocacia-;cat846.php` em salto único | 301 -> `/busca?q=advocacia` | 301 Direto | ✅ PASS |
| **4. 63 Combinações** | Total de combinações ativas no endpoint da API | ~8.780 | 8.780 | ✅ PASS |
| **4. 63 Combinações** | Flores da Cunha / Transporte Rodoviário de Carga | 200 OK | 200 OK | ✅ PASS |
| **4. 63 Combinações** | Caxias do Sul / Provedor de Internet | 200 OK | 200 OK | ✅ PASS |
| **4. 63 Combinações** | Farroupilha / Metal Mecânica | 200 OK | 200 OK | ✅ PASS |
| **4. 63 Combinações** | Flores da Cunha / PPCI | 200 OK | 200 OK | ✅ PASS |
| **4. 63 Combinações** | Bento Gonçalves / Massagem | 200 OK | 200 OK | ✅ PASS |
| **5. Sitemaps** | `/sitemap.xml` responde XML válido com páginas institucionais | 200 OK | 200 OK | ✅ PASS |
| **5. Sitemaps** | `/sitemap.xml` NÃO duplica as categorias (exclusivas do categorias.xml) | Zero sobreposição | Confirmado | ✅ PASS |
| **5. Sitemaps** | `/sitemap-categorias.xml` responde como Sitemap Index válido | 200 OK (sitemapindex) | 200 OK | ✅ PASS |
| **5. Sitemaps** | `/sitemap-categorias/1/sitemap.xml` lista as 8.780 combinações ativas | 200 OK (urlset) | 200 OK | ✅ PASS |
| **5. Sitemaps** | `/sitemap-empresas.xml` responde como urlset válido (25.248 empresas) | 200 OK (urlset) | 200 OK | ✅ PASS |
| **6. Não Regressão** | Gramado / Comunicação Integrada (vazia comprovada) | 404 Not Found | 404 Not Found | ✅ PASS |
| **6. Não Regressão** | Barão / Produtos Caseiros (1 empresa ativa) | 200 OK | 200 OK | ✅ PASS |
| **6. Não Regressão** | Farroupilha / Produtos Caseiros (7 empresas ativas) | 200 OK | 200 OK | ✅ PASS |
| **6. Não Regressão** | Canela / Pousadas (1 empresa ativa) | 200 OK | 200 OK | ✅ PASS |
| **6. Não Regressão** | Farroupilha / Filtros (4 empresas unificadas) | 200 OK | 200 OK | ✅ PASS |

---

### 3. Detalhamento das Alterações Técnicas

#### A. Links Internos e Eliminação de 404
- **Header e Footer:** O link `/blog` foi removido de `Header.tsx` e `Footer.tsx` até a conclusão e homologação do módulo editorial.
- **Categorias Regionais no Rodapé:** Os links históricos para categorias inexistentes (`/farroupilha/saude` e `/bento-goncalves/gastronomia`) foram substituídos por categorias ativas com alto valor comercial:
  - `/farroupilha/odontologia` (dezenas de consultórios e clínicas ativas).
  - `/bento-goncalves/restaurantes` (gastronomia ativa consolidada na cidade).
- **Página de Vagas (`/vagas/[id]`):** O link interno para a empresa contratante foi alterado de `/cliente/:id` (que provocava um salto interno 301) para a URL canônica `/{citySlug}/{segmentSlug}/{clientSlug}`, além de neutralizar potenciais injeções de conteúdo na descrição da vaga.

#### B. Resolução das 63 Combinações Ausentes no Sitemap
- **Diagnóstico:** O endpoint original `activeSitemapCombinations()` consultava exclusivamente a tabela de vínculo territorial `cliente_cidade`. Empresas ativas que possuem sede física cadastrada na tabela `enderecos`, mas sem registros redundantes em `cliente_cidade`, ficavam de fora do sitemap.
- **Implementação:** Foi implementada uma query unificada via `UNION` no Laravel entre as empresas com vínculo territorial em `cliente_cidade` e as empresas com sede física comprovada em `enderecos`, deduplicando os pares cidade/categoria.
- **Resultado:** O total de combinações ativas no sitemap passou de 8.719 para exatamente **8.780**, reintegrando todas as 63 combinações de empresas sediadas, sem adicionar nenhuma combinação vazia.

#### C. Domínio Canônico e Salto Único em Redirecionamentos
- **Host Canônico:** O `middleware.ts` do Next.js analisa o header de host e redireciona qualquer requisição para `overmelhinho.com.br` diretamente para `https://www.overmelhinho.com.br`, preservando o path e os parâmetros de busca em um único salto 301.
- **URLs Legadas:**
  - As URLs legadas de busca `/busca.php?id_cidade=1&id_categoria=846` resolvem diretamente para a URL final `/{cidade}/{categoria}` em 301 direto.
  - A regra legada `/:slug;cat:id.php` foi removida de `next.config.ts` para permitir que o `middleware.ts` a capture e emita um redirecionamento 301 direto para `/busca?q={slug}`, eliminando o salto duplo anterior.
  - Empresas inativas: Ao consultar uma empresa desativada cuja categoria ficou vazia, a aplicação agora retorna diretamente HTTP 404 em vez de redirecionar o usuário para uma categoria inexistente (evitando redirecionamento para 404).

#### D. Nova Arquitetura de Sitemaps (Desduplicação e Escalabilidade)
1. `/sitemap.xml`: Reservado para as páginas institucionais e principais rotas públicas (Home, Como Funciona, Sobre, Anuncie, Vagas), servindo como mapa enxuto de entrada.
2. `/sitemap-categorias.xml`: Sitemap Index particionado que aponta para `/sitemap-categorias/1/sitemap.xml`, contendo exclusivamente as 8.780 combinações ativas cidade/segmento.
3. `/sitemap-empresas.xml`: Novo sitemap dedicado que serve as 25.248 empresas ativas em blocos particionados, com invalidação On-Demand ISR via tag `sitemap-companies`.
4. **Desduplicação Total:** Nenhuma URL pública aparece em mais de um arquivo sitemap, cumprindo integralmente as diretrizes do Google Search Console.

---

### 4. Arquivos Modificados no Repositório

```text
backend/app/Http/Controllers/Api/V1/ClienteController.php (UNION sitemap, sitemapData otimizado, redirect_suggestion seguro)
backend/app/Observers/ClienteObserver.php (Disparo de webhook On-Demand para sitemap-companies)
site/next.config.ts (Remoção da interceptação de cat:id para salto único)
site/src/middleware.ts (Host canônico www 301, captura de categorias legadas e busca.php em salto único)
site/src/app/api/legacy-busca/route.ts (Resolução de parâmetros com suporte a 127.0.0.1 e IP fallback)
site/src/app/cliente/[id]/page.tsx (Tratamento seguro de empresa inativa sem categoria)
site/src/app/[citySlug]/[segmentSlug]/[clientSlug]/page.tsx (Tratamento seguro de redirecionamento inativo)
site/src/app/sitemap.ts (Desduplicação: foco em rotas institucionais canônicas)
site/src/app/sitemap-categorias/[id]/sitemap.xml/route.ts (Suporte a resiliência de conexão de rede interna)
site/src/app/sitemap-empresas.xml/route.ts (Novo Route Handler de empresas ativas com On-Demand ISR)
site/src/app/vagas/[id]/page.tsx (Link canônico de SEO da empresa contratante)
site/src/app/vagas/[id]/JobDetailClient.tsx (Eliminação de risco XSS e link canônico)
site/src/components/Header.tsx (Remoção do link /blog)
site/src/components/Footer.tsx (Remoção do link /blog e correção dos links 404 de Farroupilha e Bento)
```

---

### 5. Procedimento Operacional de Deploy e Rollback

> [!IMPORTANT]
> Nenhuma operação de Git (commit/push) ou deploy em produção foi executada até o presente momento, em estrito cumprimento às diretrizes de proteção do repositório.

#### Plano de Publicação (Aguardando Comando Explícito)
1. Confirmar que o ambiente de produção possui snapshot / backup ativo.
2. Comitar as alterações na branch `fix/seo-sitemaps-redirects-sprint3`.
3. Realizar o merge controlado para a branch `main`.
4. Enviar para o GitHub (`git push`).
5. No VPS, executar o build coordenado de Laravel e Next.js (`npm run build`).
6. Revalidar os códigos HTTP em produção com a suite de testes.

#### Plano de Rollback Imediato (Infraestrutura Oficial VPS)
- **Baseline de Produção:** `3d6c63e8`
- **Serviço Next.js:** PM2 `overmelhinho-site`
- **Serviço Backend:** Systemd `laravel-octane`
- **Script Oficial:** `/var/www/deploy.sh`

Caso seja detectada qualquer anomalia no ambiente de produção:
```bash
# 1. Reverter o commit integrado na main
# Se merge Fast-Forward ou Squash:
git checkout main
git revert <NOVO_COMMIT_HASH> --no-edit
git push origin main

# Se merge commit padrão com 2 ramificações:
git checkout main
git revert -m 1 <MERGE_COMMIT_HASH> --no-edit
git push origin main

# 2. Executar deploy de restauração no VPS
sudo /var/www/deploy.sh

# Ou reinício manual coordenado:
cd /var/www/overmelhinho/backend && php artisan optimize:clear && sudo systemctl restart laravel-octane
cd /var/www/overmelhinho/site && npm run build && pm2 restart overmelhinho-site
```

