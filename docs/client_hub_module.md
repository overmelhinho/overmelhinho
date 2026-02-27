# 📋 Módulo: Client Hub

> **Arquivo:** `frontend/src/pages/clientes/ClientHubPage.tsx`  
> **Rota:** `/clientes/:id/hub`  
> **Acesso:** Admin autenticado com permissão `view_client`  
> **Criado em:** Fevereiro de 2026

---

## 1. Visão Geral

O **Client Hub** é a página central de visão rápida de um cliente específico no painel Admin do "O Vermelhinho". Seu objetivo é permitir que o time comercial/operacional tenha uma leitura instantânea do status e desempenho do cliente **sem precisar abrir o formulário de edição**.

Ele combina dados de três fontes:
- **API de Clientes** (`/v1/clientes/:id`) — dados cadastrais
- **API de Relatórios** (`/v1/clients/:id/reports/dashboard`) — métricas GA4 + banco de dados
- **API de Tickets** (`/v1/tickets?cliente_id=:id`) — fila de suporte ativa

---

## 2. Arquitetura Visual (Bento Grid)

O layout usa um **CSS Grid responsivo** com `grid-cols-4` no desktop, `grid-cols-3` no tablet e `grid-cols-1` no mobile.

```
┌─────────────────────────────────────────────────────────────┐
│  HUB DO CLIENTE · [Nome da Empresa]        VER TODOS OS DADOS  │
├──────────────┬──────────────────────────┬───────────────────┤
│ BLOCO 1      │ BLOCO 2                  │ BLOCO 3           │
│ Perfil &     │ Performance GA4          │ Tickets em Aberto │
│ Status       │ (col-span-2)             │                   │
│              │ Pageviews + Conversões   │ Lista compacta    │
│ Logo/Avatar  │ WhatsApp · Waze · Social │ com badges        │
│ Badge Status │                          │ de status         │
│ Plano Ativo  │                          │                   │
│ Btn Editar   │                          │                   │
├──────────────┴──────────────────────────┴───────────────────┤
│ BLOCO 4: Quick Actions (col-span-4)                         │
│  [Vagas PRO] [Campanhas] [Performance] [Editar Dados]       │
└─────────────────────────────────────────────────────────────┘
```

### Estilo de Design

| Propriedade | Valor |
|---|---|
| Background | `bg-gray-50` |
| Cards | `bg-white rounded-2xl border border-gray-100 shadow-sm` |
| Hover | `hover:shadow-md hover:-translate-y-0.5 transition-all` |
| Clique | `active:scale-95` (Gimme Gummy / efeito tátil) |
| Fonte dos números | Extra Large, `font-black tracking-tighter` |

---

## 3. Bloco 1: Perfil & Status

**Conteúdo:**
- **Logo/Avatar:** Se `logo_url` existir, exibe a imagem; caso contrário mostra ícone `Building2` em fundo vermelho claro.
- **StatusBadge:** Mapa de status → cores: `ativo` → verde, `inativo` → cinza, `suspenso` → âmbar, `trial` → azul.
- **Plano Ativo:** Nome e preço mensal do plano (se houver).
- **Botão "Editar Cadastro":** Abre o Slide-over (ver seção 5).

---

## 4. Bloco 2: Performance GA4

Consome o endpoint `/v1/clients/:id/reports/dashboard` que retorna dados híbridos (GA4 → Fallback para banco de dados).

| Campo | Fonte | Descrição |
|---|---|---|
| `visibilidade.total_views` | GA4 / DB | Total de visualizações do perfil em 30 dias |
| `visibilidade.whatsapp` | DB (ClientInteraction) | Cliques no botão de WhatsApp |
| `visibilidade.waze` | DB (ClientInteraction) | Cliques no botão do Waze/Mapa |
| `visibilidade.social` | DB (ClientInteraction) | Cliques em Redes Sociais |
| `visibilidade.ga4_status` | Backend | `'active'` se GA4 retornou dados, `'fallback'` se usou DB |

**Badge de Fonte:**
- `Dados GA4` → indicador verde quando os dados vêm da API do Google.
- `Dados Locais` → indicador cinza quando usa fallback do banco.

---

## 5. Bloco 3: Fila de Tickets

Consome `/v1/tickets?cliente_id=:id&limit=5`.

Exibe até 5 tickets mais recentes com:
- **Título** (truncado se longo)
- **Badge de Status:** `Aberto` (vermelho), `Pendente` (âmbar), `Resolvido` (verde)
- **Data de criação**
- **Clique** navega para `/tickets/:id`

Se não houver tickets, exibe feedback visual com ícone `CheckCircle2`.

---

## 6. Slide-over de Edição

Estado local `const [isEditOpen, setIsEditOpen] = useState(false)`.

**Comportamento:**
- Disparado pelo botão "⚙️ Editar Cadastro" no Bloco 1.
- Ocupa **42% a 48% da largura** no desktop (`w-full md:w-[48%] lg:w-[42%]`).
- Desliza da borda direita: `translate-x-full` → `translate-x-0`.
- Backdrop com `backdrop-blur-sm` e opacidade animada.
- Botão de fallback para navegar para a página completa `/clientes/:id/editar`.

> ⚠️ **Placeholder:** O interior do Slide-over contém um placeholder para integração futura do `ClientForm` completo. Para integrar, substitua o `<div>` pelo componente de edição desejado.

---

## 7. Quick Actions (Bloco 4)

Quatro atalhos de navegação rápida:

| Botão | Rota | Cor |
|---|---|---|
| Vagas PRO | `/vagas?cliente_id=:id` | Vermelho |
| Campanhas | `/campanhas?cliente_id=:id` | Roxo |
| Performance | `/clientes/:id/performance` | Azul |
| Editar Dados | `/clientes/:id/editar` | Verde |

> 💡 Quando a página de **Histórico** for criada, o botão "Editar Dados" deve ser substituído por `/clientes/:id/historico`.

---

## 8. Acesso via Lista de Clientes

Na `ClientesList.tsx`, cada linha da tabela possui um botão **"Hub ✦"** que navega diretamente para o Hub do cliente correspondente. O botão tem estilo diferenciado: hover vermelho suave com borda vermelha.

---

## 9. Queries e Cache

| Query | Endpoint | Intervalo de Refresh |
|---|---|---|
| Dados do cliente | `GET /v1/clientes/:id` | 1x ao carregar |
| Relatório de performance | `GET /v1/clients/:id/reports/dashboard` | A cada **5 minutos** |
| Tickets | `GET /v1/tickets?cliente_id=:id&limit=5` | 1x ao carregar |

---

## 10. Próximos Passos

- [ ] Integrar o formulário de edição (`ClienteEdit`) dentro do Slide-over.
- [ ] Criar a página `/clientes/:id/historico` com Timeline de atividades.
- [ ] Adicionar sparkline de acessos (mini gráfico de linha) no Bloco 2.
- [ ] Adicionar dados de Last Invoice (última fatura) no Bloco 1.
