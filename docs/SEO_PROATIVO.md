# Sistema de SEO Proativo e Overrides Manuais

Este documento mapeia a viabilidade, a estratégia de negócio e a arquitetura técnica necessária para implementar um motor inteligente de SEO no painel administrativo do O Vermelhinho. O objetivo é transformar o painel em uma máquina proativa de marketing, conectando a API do Google Search Console com o sistema interno.

## 1. O Problema e a Oportunidade
Atualmente, O Vermelhinho utiliza **Programmatic SEO** para gerar milhares de páginas dinâmicas (ex: `/[cidade]/[segmento]`) utilizando fórmulas automáticas (`Melhores {Segmento} em {Cidade}`).
Com os dados do Google Search Console (GSC), notamos que algumas páginas possuem **alta taxa de impressões, mas zero/baixos cliques** (Baixo CTR).
O objetivo é extrair essa informação do Google automaticamente e permitir que o administrador do painel faça "ajustes finos" manuais apenas nas páginas que precisam de otimização, sem quebrar o piloto automático das demais.

## 2. Casos de Uso (Gatilhos do Motor de Inteligência)
O robô analisará semanalmente a performance e sugerirá ações no Dashboard baseadas em regras:

- **Alerta de CTR Baixo:**
  - **Regra:** `Impressões > 100` E `Cliques == 0`
  - **Ação:** O painel sugere trocar a `<title>` e a `meta description` para atrair mais cliques.
- **Alerta de "Quase lá" (Página 2):**
  - **Regra:** `Posição entre 11 e 15`.
  - **Ação:** Sugerir a inclusão de mais links internos ou de clientes nesta categoria para forçar a subida para a Página 1.

## 3. Arquitetura Técnica Proposta

A implementação exigirá alterações no Banco de Dados, Backend (Laravel), Painel Admin (Dashboard) e Front-end (Next.js).

### Passo 1: Configuração do Google Cloud (GCP) e API
1. Criar um projeto no **Google Cloud Platform**.
2. Ativar a **Google Search Console API**.
3. Gerar uma Service Account (Credencial JSON) e adicioná-la como usuária delegada na propriedade do site no GSC.

### Passo 2: Backend (Laravel) - O Robô e o Banco de Dados
1. **Modelagem de Dados (Overrides):**
   Criar uma tabela `seo_overrides` para salvar as edições manuais.
   ```sql
   CREATE TABLE seo_overrides (
       id BIGINT AUTO_INCREMENT PRIMARY KEY,
       city_id BIGINT NOT NULL,
       segment_id BIGINT NOT NULL,
       custom_title VARCHAR(255) NULL,
       custom_description TEXT NULL,
       created_at TIMESTAMP,
       updated_at TIMESTAMP
   );
   ```
2. **Integração com GSC:**
   Instalar o pacote `google/apiclient` via Composer.
3. **Cron Job (Task Scheduling):**
   Criar um Command Artisan (ex: `php artisan seo:fetch-insights`) agendado para rodar todo domingo de madrugada, que bata na API do GSC e alimente uma tabela `seo_insights`.

### Passo 3: Painel Administrativo (Dash) com Assistente de IA
1. Criar uma tela **"Oportunidades de SEO"**.
2. Essa tela lerá a tabela `seo_insights` e exibirá os Cards de Alerta.
3. Ao clicar em "Otimizar", em vez de exigir que o cliente (ou você) escreva o texto do zero, **o próprio painel fará a sugestão mágica**.
4. **Motor de Sugestão:** O sistema analisará automaticamente o que os 3 maiores concorrentes no Google (para aquela cidade e segmento) estão escrevendo, e gerará por Inteligência Artificial (como eu!) opções perfeitas de Título e Descrição.
5. O cliente apenas revisa, escolhe a melhor opção sugerida pela IA e clica em **"Aprovar"**. Os dados são salvos diretamente na tabela `seo_overrides`.

### Passo 4: Front-end (Next.js) - O Padrão Fallback
Atualizar a função `generateMetadata` nos arquivos dinâmicos (ex: `app/[citySlug]/[segmentSlug]/page.tsx`).
A lógica deverá ser atualizada para perguntar à API se existe um *Override*:

```typescript
// Exemplo Conceitual da lógica no Next.js
export async function generateMetadata({ params }): Promise<Metadata> {
    const seoData = await fetchSeoOverride(params.citySlug, params.segmentSlug);
    
    // Se existir override no BD, usa o customizado. Senão, usa a fórmula.
    const title = seoData?.custom_title || `Melhores ${segment.nome} em ${city.nome}`;
    const description = seoData?.custom_description || `Encontre os melhores ${segment.nome} em ${city.nome}...`;

    return {
        title,
        description,
    }
}
```

## 4. Conclusão
Essa arquitetura preserva a escala automatizada do SEO Programático e introduz a capacidade de atuar cirurgicamente como um Especialista em SEO apenas onde há dinheiro e cliques sendo deixados na mesa.
