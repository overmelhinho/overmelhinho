# Módulo de Cadastro de Clientes

Este documento detalha o funcionamento técnico e as funcionalidades do módulo de cadastro e gestão de clientes do sistema administrativo "O Vermelhinho".

---

## 1. Visão Geral

O formulário de cadastro de clientes é dividido em **abas temáticas**, cada uma responsável por uma área de dados do cliente. O fluxo é o mesmo tanto para **criação** quanto para **edição** (via `ClienteCreate.tsx` e `ClienteEdit.tsx`).

### Abas disponíveis

| # | Aba | Conteúdo |
|---|-----|-----------|
| 0 | **Identificação** | Nome, CNPJ, Razão Social, palavras-chave SEO, Descrição |
| 1 | **Endereço** | CEP, Estado, Cidade, Bairro, Rua, Número, Complemento |
| 2 | **Contato** | Até 4 telefones, WhatsApp principal, E-mail, Responsável |
| 3 | **Cidades** | Cidades atendidas (multi-seleção) |
| 4 | **Redes Sociais** | Facebook, Instagram, LinkedIn, YouTube, TikTok, X |
| 5 | **Segmentos** | Segmentos de mercado do cliente |
| 6 | **Benefícios** | Vantagens e diferenciais do estabelecimento |
| 7 | **Horário** | Horário de atendimento por dia da semana |
| 8 | **Logotipo** | Upload do logo (com preview) |
| 9 | **Mídia** | Vídeo do YouTube + material em arquivo ou link |
| 10 | **Galeria** | Galeria de imagens com drag & drop e compressão automática |
| 11 | **Financeiro** | Tipo de cliente, status de assinatura, data de contrato |

> **Nota:** Para clientes do tipo **Gratuito**, as abas 3 a 11 são ocultadas automaticamente.

---

## 2. Funcionalidades com Inteligência Artificial

### 2.1 Geração de Descrição com IA (`ClientAiService`)

Na aba **Identificação**, há um botão **"Gerar com IA"** ao lado do campo de descrição.

**Fluxo:**
1. O usuário preenche o nome e a cidade da empresa.
2. Ao clicar em "Gerar com IA", uma requisição é enviada para `POST /api/v1/clientes/ai-description`.
3. O `ClientAiService` integra com a **API do Google Places** para buscar dados públicos da empresa (endereço, telefone, website, redes sociais).
4. Em seguida, o serviço utiliza **OpenAI GPT-4o-mini** para gerar uma descrição de 1 parágrafo + 3 a 6 bullets, otimizada para SEO e UX.
5. A descrição é preenchida automaticamente no campo.

**Variáveis de ambiente necessárias:**
```env
OPENAI_API_KEY=sk-...
GOOGLE_PLACES_KEY=AIza...
```

---

## 3. Inteligência Geográfica — Google Maps

### 3.1 Importação de Horários (`GooglePlacesService`)

Na aba **Horário**, há um botão **"Importar do Google Maps"**.

**Fluxo:**
1. O sistema busca o estabelecimento na **Google Places API** usando nome + cidade.
2. A API retorna os `periods` de horários de funcionamento.
3. O `GooglePlacesService::mapOpeningHoursToSystem()` converte para o formato interno:
   - Dias com **múltiplos períodos** (ex: 08:00–12:00 e 13:00–18:00) são **mesclados** automaticamente, usando o first open e o last close do dia → `08:00–18:00`.
   - Dias sem dados ficam com status **Fechado** e campos de hora vazios.
4. O formulário é preenchido automaticamente.

**Mapeamento de dias (Google → Sistema):**
| Google API | Sistema |
|-----------|---------|
| 0 (Sunday) | 7 (Domingo) |
| 1 (Monday) | 1 (Segunda) |
| ... | ... |
| 6 (Saturday) | 6 (Sábado) |

**Endpoint:** `GET /api/v1/clientes/google-hours?nome=...&cidade=...`

> ⚠️ **Atenção sobre a ordem de rotas:** As rotas `/clientes/ai-description` e `/clientes/google-hours` devem estar **antes** do `Route::apiResource('clientes', ...)` no `routes/api.php`. Caso contrário, o Laravel interpreta a string como `{id}` e retorna erro de tipo bigint.

---

## 4. Campos de Contato

### 4.1 Telefones (até 4 números)

A aba **Contato** suporta até **4 números de telefone**:

| Campo | Máscara | Exibição |
|-------|---------|----------|
| `telefone_principal` | `(99) 9999-9999` | Checkbox "Exibir no site" |
| `telefone_secundario` | `(99) 9999-9999` | Checkbox "Exibir no site" |
| `celular` | `(99) 99999-9999` | Checkbox "Exibir no site" |
| `telefone_outro` | Livre (0800, etc.) | Checkbox "Exibir no site" |

### 4.2 WhatsApp Principal

Cada número possui um **radio button** para marcar qual é o **WhatsApp principal**. O campo `whatsapp_selected` na tabela `contatos` armazena o nome do campo selecionado (ex: `"celular"`).

### 4.3 E-mail

O campo de **e-mail é opcional** nas regras de validação. Uma checkbox "Exibir e-mail no site" controla a visibilidade pública.

### 4.4 Responsável

Campo **obrigatório** (marcado com `*`), armazenado como `nome_contato` na tabela `contatos`.

---

## 5. Aba de Horários

A aba exibe uma **tabela interativa** com os 7 dias da semana. Comportamento padrão:

- Ao entrar na aba sem dados salvos: todos os dias aparecem como **Fechado**, sem horários pré-preenchidos.
- Clicar no badge de status alterna entre **Aberto / Fechado**.
- Quando aberto, os campos de hora (input type="time") ficam disponíveis para edição.
- Ao importar do Google Maps, os dados são preenchidos automaticamente.

---

## 6. Aba de Mídia

### 6.1 Vídeo

Cole um link do YouTube. O sistema gera preview via embed ou thumbnail via oEmbed automaticamente.

### 6.2 Materiais (Cardápio / Portfólio / Catálogo)

A seção de materiais possui um **toggle** para escolher o tipo:

| Tipo | Descrição |
|------|-----------|
| **Arquivo** | Upload de PDF ou imagem (limite: 10MB) |
| **Link** | URL externa para material digital |

O tipo escolhido é salvo no campo `tipo_material`.

---

## 7. Galeria de Imagens

- Upload múltiplo com **compressão automática** para WebP (max 0.6MB por imagem, 1600px max).
- **Drag & drop** para reordenar imagens.
- Erros de upload exibem mensagens amigáveis com detalhes do problema.
- Imagens são enviadas temporariamente para a pasta `temp/` no Supabase Storage e confirmadas (commit) apenas no momento de salvar o cliente.

---

## 8. Banco de Dados

### Tabela `contatos` (campos adicionados)

```sql
telefone_outro      VARCHAR(50)  NULLABLE
whatsapp_selected   VARCHAR(50)  NULLABLE  -- ex: 'celular', 'telefone_principal'
exibir_tel_principal BOOLEAN    DEFAULT false
exibir_tel_secundario BOOLEAN   DEFAULT false
exibir_celular      BOOLEAN     DEFAULT false
exibir_tel_outro    BOOLEAN     DEFAULT false
```

### Tabela `client_materials` (nova)

```sql
id              BIGINT PRIMARY KEY
cliente_id      BIGINT NOT NULL (FK → clientes)
name            VARCHAR NULL
path            TEXT NULL        -- caminho no Supabase Storage
type            VARCHAR NULL     -- 'file' | 'link'
mime_type       VARCHAR NULL
size            BIGINT NULL      -- em bytes
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### Cast em `Cliente` (model)

```php
'horario_atendimento' => 'array'
```

O campo `horario_atendimento` é um **JSON** no banco. Estrutura:

```json
[
  { "day": 1, "open": "08:00", "close": "18:00", "closed": false },
  { "day": 6, "open": "",      "close": "",       "closed": true  },
  { "day": 7, "open": "",      "close": "",       "closed": true  }
]
```

---

## 9. Serviços Externos

| Serviço | Uso | Env Var |
|---------|-----|---------|
| OpenAI GPT-4o-mini | Gerar descrição da empresa | `OPENAI_API_KEY` |
| Google Places API | Dados e horários da empresa | `GOOGLE_PLACES_KEY` |
| Supabase Storage | Upload de logotipo, galeria e mídia | `SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_BUCKET` |

---

## 10. Rotas de API Relacionadas

```
POST   /api/v1/clientes/ai-description    → Gera descrição com IA
GET    /api/v1/clientes/google-hours      → Importa horários do Google Maps
POST   /api/v1/clientes                   → Cria cliente
PUT    /api/v1/clientes/{id}              → Atualiza cliente
POST   /api/v1/clientes/{id}/logo/commit-temp   → Confirma upload do logo
POST   /api/v1/clientes/{id}/midia/commit-temp  → Confirma upload de mídia
POST   /api/v1/clientes/{id}/galeria            → Adiciona item à galeria
POST   /api/v1/clientes/{id}/galeria/commit-temp → Confirma imagens da galeria
```
