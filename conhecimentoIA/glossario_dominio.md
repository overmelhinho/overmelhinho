# Glossário de Domínio e Linguagem Ubíqua - O Vermelhinho

Este documento define a terminologia oficial do ecossistema do **O Vermelhinho**. O agente DEVE usar EXATAMENTE estes termos ao criar variáveis, tabelas de banco de dados, documentações ou ao responder chamadas para garantir o alinhamento com a regra de negócio da empresa.

## 1. Entidades de Negócio

*   **Cliente:** Empresa ou Pessoa Física que assina ou já assinou os serviços do O Vermelhinho. Representado no banco na tabela `clientes`. O campo `status_assinatura` dita o estado comercial do cliente.
*   **Lead:** Potencial cliente que entrou em contato ou foi prospectado, mas ainda não fechou negócio. Não se mistura na mesma tabela que clientes ativos (verificar tabela `leads` ou modelo de CRM interno).
*   **Oportunidade:** Um negócio em andamento com um Lead ou Cliente. Fica no pipeline de vendas aguardando fechamento.
*   **Ticket:** Um chamado de suporte interno, solicitação de manutenção ou demanda de marketing criada para um Cliente (Ex: Alerta de Queda de SEO).

## 2. Tecnologias e Infraestrutura

*   **Supabase:** Atual provedor de Banco de Dados PostgreSQL e Storage (Bucket) para novos arquivos de mídia e imagens de galeria.
*   **XAMPP:** O ambiente obrigatório de desenvolvimento local. Roda o PHP puro em `C:\xampp2`.
*   **PM2:** Gerenciador de processos utilizado no servidor VPS para manter os processos do Laravel Octane e do Next.js (Site) vivos em produção.

## 3. Tipos de Armazenamento de Imagens

*   **Imagem Legada:** Refere-se às mídias antigas que foram salvas diretamente no disco do VPS ou apontam para URLs como `api.overmelhinho.com.br`. Muitas foram perdidas na migração para o Supabase.
*   **Imagem Supabase:** Novo padrão de upload onde o arquivo real fica armazenado no bucket de `clientes-media` do Supabase e o banco salva apenas o path ou UUID.

---
*(Este documento é orgânico e deve ser expandido conforme novos módulos sejam criados no O Vermelhinho).*
