# 🧠 Módulo: Busca Inteligente (Smart Search)

O sistema de busca do **O Vermelhinho** foi projetado para ser resiliente, rápido e comercialmente estratégico. Ele utiliza tecnologias de processamento de linguagem natural básico e extensões de banco de dados para garantir que o usuário encontre o que precisa, mesmo digitando com erros.

## 🚀 Funcionalidades Principais

### 1. Tolerância a Erros (Fuzzy Search)
Utiliza a extensão `pg_trgm` (PostgreSQL Trigram) para calcular a similaridade entre o termo digitado e os nomes das empresas no banco de dados.
- **Exemplo:** "vermelinio" -> Encontra "O Vermelhinho".
- **Threshold:** Configurado em `0.15` para equilibrar precisão e abrangência.

### 2. Normalização Inteligente
Antes de processar a busca, o sistema remove artigos e preposições comuns no início da frase para focar no que realmente importa.
- **Removidos:** `o`, `a`, `os`, `as`, `de`, `do`, `da`.
- **Benefício:** Evita que a busca falhe porque o usuário escreveu "A Pizzaria" em vez de apenas "Pizzaria".

### 3. Autocomplete Preditivo
Dropdown em tempo real que exibe sugestões enquanto o usuário digita.
- **Resultados Instantâneos:** Exibe até 5 empresas com match de nome ou similaridade.
- **Categorias Relacionadas:** Exibe até 3 categorias vinculadas ao termo.
- **Design Premium:** Interface mobile-first com efeito glassmorphism e micro-animações.

### 4. Contexto de Geolocalização
Integração nativa com o `LocationContext` do frontend.
- **Detecção Automática:** Se o usuário permitir geolocalização, a busca prioriza empresas que atendem àquela cidade específica.
- **Placeholder Dinâmico:** O campo de busca se adapta: *"O que você precisa em [Cidade]?"*.

### 5. Priorização Comercial
Algoritmo de ordenação que protege o modelo de negócio:
1. **Clientes Pagantes (Ativos):** Aparecem sempre no topo, com o badge "Premium".
2. **Clientes Gratuitos:** Aparecem logo abaixo.
3. **Ordenação Secundária:** Por nome fantasia.

---

## 🛠️ Implementação Técnica

### Backend (Laravel)
O núcleo da inteligência reside no `ClienteController.php`:
- **Métodos principais:** `indexPublic` (Busca completa) e `suggestions` (Autocomplete).
- **Extensões Requeridas:**
  ```sql
  CREATE EXTENSION IF NOT EXISTS pg_trgm;
  CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;
  ```
- **Fallback Seguro:** Caso a extensão não esteja disponível no ambiente, o sistema utiliza uma busca por palavras individuais (`ILIKE %word%`) para manter a funcionalidade básica.

### Frontend (Next.js)
Componentes envolvidos:
- `SearchAutocomplete.tsx`: Gerencia o estado da busca, debounce de 300ms e renderização do dropdown.
- `LocationContext.tsx`: Provê a cidade atual detectada via IP ou GPS.

### Endpoints
- `GET /api/v1/public/search`: Retorna resultados paginados.
- `GET /api/v1/public/search/suggestions`: Retorna JSON com resultados e categorias para o autocomplete.

---

## 📈 Métricas de Sucesso (KPIs)
- **Taxa de Conversão de Busca:** Cliques no resultado vs buscas realizadas.
- **Redução de "Nenhum Resultado":** Impactada diretamente pela lógica Fuzzy.
- **Uso do Autocomplete:** Quantos usuários clicam na sugestão antes de apertar "Enter".
