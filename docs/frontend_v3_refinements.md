# Refinamentos de UI/UX e Frontend V3 - O Vermelhinho

## 📌 Visão Geral
Esta documentação detalha as implementações feitas no portal público (site) para adotar a tendência estética **"Mutant Heritage"**, integrar **Busca por Voz (VUI)** e estabelecer o sistema de **Analytics & Tracking** integrado ao Radar de Oportunidades.

---

## 🎨 1. Design System: Mutant Heritage & Gimme Gummy
A aplicação agora segue uma identidade visual que equilibra a autoridade jornalística com a funcionalidade moderna.

- **Tipografia:**
  - **Serifada (Títulos):** *Playfair Display* (400-900). Traz contraste, elegância e autoridade.
  - **Sans-Serif (Corpo):** *Poppins* (400-700). Garante legibilidade técnica e modernidade.
- **Estética Gimme Gummy:**
  - Botões e pílulas de filtro com bordas super arredondadas (`rounded-full`).
  - Efeito tátil de "esmagamento" ao clique via `active:scale-95`.
  - Sombras suaves e fundos translúcidos com `backdrop-blur`.

---

## 🔍 2. Busca e Listagem de Resultados (Search 2026)
A página de busca foi totalmente reformulada para suportar uma experiência de "Atrito Zero" e Split-Layout.

### 2.1 Estrutura Visual
- **Desktop Split-Layout:** Lado esquerdo com lista rolável e lado direito com **Mapa Fixo Sticky**.
- **Mapa Vivo (Light Skeuomorphism):** Os marcadores no mapa são bolhas brancas flutuantes com sombras projetadas, que pulsam ou aumentam de escala ao interagir com a lista.
- **Mobile-First App Feel:** Barra de navegação inferior estilo iOS (`BottomNav`) para acesso rápido a Home, Busca, Vagas e Salvos.

### 2.2 Estratégias de Conversão
- **Match Perfeito (Zero-Click):** O primeiro resultado é um Bento Block destacado pela IA, exibindo alta afinidade (ex: 98%) e botão de WhatsApp gigante.
- **Bento Premium Cards:** Resultados patrocinados usam layout de "Capa + Logo Sobreposto", focando no visual do estabelecimento.
- **Cinematic Ad Blocks:** Publicidade integrada de forma orgânica no meio da lista (Scrollytelling), abandonando banners estáticos tradicionais.
- **Atrito Zero (Outros Resultados):** Lista minimalista com botão de telefone flutuante para contato imediato.

---

## 🎙️ 3. VUI (Voice User Interface)
O portal agora oferece uma experiência de busca multimodal.

- **Animação Typewriter:** O título principal da Home alterna dinamicamente entre "sua região", "sua cidade", "seu bairro" e "sua rua".
- **Busca por Voz Real:** Integrada via **Web Speech API**. Processamento automático do transcript e redirecionamento.

---

## 📊 4. Analytics & Tracking System (Radar)
Implementação do hook `useAnalytics` para centralizar a coleta de dados.

### Rastreamentos Ativos:
1. **Buscas Orgânicas (`trackSearch`):** Detecta o que a região está procurando e alimenta o Radar no backend.
2. **Interações de Conversão (`trackInteraction`):** Registra cliques em WhatsApp, Waze (endereço), Redes Sociais e visualizações de perfil.
3. **Dados Dinâmicos:** Integração total com `/v1/public/search` e `/v1/public/clientes/{id}`.

---

## 📁 Estrutura de Arquivos Relevante
- `src/app/busca/page.tsx`: Core da listagem disruptiva.
- `src/app/cliente/[id]/page.tsx`: Perfil dinâmico e rastreado.
- `src/app/page.tsx`: Home com VUI.
- `src/hooks/useAnalytics.ts`: Motor de tracking.

---

## 🚀 Próximos Passos
- [ ] Implementar listagem dinâmica de vagas reais no perfil do cliente.
- [ ] Conectar os horários de funcionamento reais (JSON) na UI.
- [ ] Finalizar setup das credenciais do GA4 no VPS.
