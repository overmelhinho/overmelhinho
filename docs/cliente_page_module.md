# Módulo: Página do Cliente (Perfil da Empresa)

Este módulo é responsável por exibir o perfil detalhado de um cliente (empresa) no portal **O Vermelhinho**. Ele foi projetado com foco em **conversão, performance e design premium (Gummy/Skeuomorphic)**.

## 🏗️ Arquitetura

A página está localizada em `src/app/cliente/[id]/page.tsx` e utiliza uma estrutura de **Client Component** para permitir interatividade rica e animações complexas.

### Tecnologias Utilizadas:
- **Next.js 16 (App Router)**: Roteamento dinâmico.
- **TanStack Query (React Query)**: Gerenciamento de estado e cache de dados da API.
- **Framer Motion**: Animações de entrada, transições de abas e modais.
- **Lucide React**: Biblioteca de ícones.
- **Tailwind CSS**: Estilização responsiva e tokens de design.

---

## 🚀 Funcionalidades Principais

### 1. Sistema de Conversão Direta (CTAs)
- **WhatsApp**: Botão flutuante (Mobile) e fixo (Desktop) que abre o chat com mensagem pré-preenchida.
- **Ligar Agora**: Integração com protocolo `tel:` para chamadas rápidas.
- **Compartilhamento**: Utiliza a **Web Share API** nativa em dispositivos móveis ou **Clipboard API** (copiar link) no desktop com feedback visual (Toast).

### 2. Informações Dinâmicas & Reais
- **Status de Funcionamento**: Lógica em tempo real que compara o horário atual com o banco de dados para exibir "Aberto agora" ou "Fechado (Abre às XX:XX)".
- **Localização**: Mapa interativo real via Google Maps Iframe, com zoom de 16x focado no endereço da empresa.
- **Redes Sociais**: Mapeamento automático de links para ícones específicos (Instagram, Facebook, LinkedIn, YouTube, Website).
- **Fundação/Especialidade**: Exibição seletiva de metadados da empresa.

### 3. Experiência de Usuário Interativa
- **Sistema de Abas**: "Sobre", "Fotos", "Avaliações" e "Vagas".
- **Galeria Premium**: Grid de imagens com efeito de levitação e **Lightbox** (modal) integrado com navegação (próximo/anterior) e contador.
- **Motor de Recomendação**: Seção "Poderá gostar também" que sugere empresas similares na cidade, respeitando a regra de **Não Concorrência** (segue empresas de segmentos diferentes).

---

## 📡 Integração com API (Backend)

| Endpoint | Descrição |
|----------|-----------|
| `GET /public/clientes/{id}` | Busca todos os dados base, endereços, contatos e galeria. |
| `GET /public/clientes/{id}/recommendations` | Busca sugestões de empresas similares não concorrentes. |
| `POST /tracking/interaction` | Registra cliques (WhatsApp, Ligação, Share) para o dashboard do cliente. |

---

## 🎨 Guia de Estilo (Design Tokens)
- **Cards**: Estilo `gummy-card` (bordas arredondadas `[3rem]`, sombras suaves `shadow-xl`, bordas brancas `border-4`).
- **Cores**: 
  - `brand-red` (#EF4444): Primária para CTAs e destaques.
  - `gray-900`: Tipografia principal (Serif Italic para nomes).
- **Mobile First**: Design otimizado para dedos, com barra de conversão fixa na parte inferior e cabeçalho translúcido.

---

## 🛠️ Manutenção e Extensão
Para adicionar uma nova aba (ex: "Cardápio" ou "Serviços"):
1. Adicione o nome no array `tabs`.
2. Implemente o componente visual dentro do `AnimatePresence` no bloco de conteúdo.
3. Certifique-se de usar `motion.div` para manter a consistência das animações.
