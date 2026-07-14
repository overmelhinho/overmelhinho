# Desenvolvimento PWA (Offline-First) - O Vermelhinho

Este é o guia de tarefas prático para transformarmos o atual painel web em um aplicativo instalável com capacidade de funcionar offline, utilizando React Query, IndexedDB e a nossa API Laravel.

## Fase 1: Infraestrutura e PWA Básico
- [x] **Instalar Dependências PWA:** Adicionar `vite-plugin-pwa` no frontend.
- [x] **Configurar Manifesto PWA:** Criar e configurar o `manifest.json` com ícones, cores da marca (Vermelhinho), e `display: standalone` para que instale como um app nativo.
- [x] **Configurar Service Worker Inicial:** Ativar o cache de arquivos estáticos (JS, CSS, Imagens) para que a interface carregue sem internet.
- [x] **Prompt de Atualização do App:** Adicionar um aviso na tela "Nova versão disponível" sempre que publicarmos alterações no código (para que o app da vendedora não fique defasado preso no cache offline).

## Fase 2: Segurança e Autenticação Offline
- [x] **Validação de Sessão Local:** Permitir acesso ao painel (sem internet) apenas se existir um Token de Sessão válido armazenado no aparelho.
- [x] **Rotina de Logout Seguro:** Garantir que o botão "Sair" apague imediatamente o Token e destrua todo o banco de dados local (IndexedDB), prevenindo vazamento de dados caso o aparelho seja furtado.
- [x] **Retenção de Fila em Erro 401:** Se a vendedora sincronizar a fila e o token tiver expirado, o sistema deve pausar a fila, redirecioná-la para o Login, e só voltar a enviar os dados após a autenticação bem-sucedida.

## Fase 3: Cache de Leitura (IndexedDB)
- [x] **Instalar Dependências de Banco Local:** Adicionar biblioteca para IndexedDB (ex: `localforage` ou `idb-keyval`).
- [x] **Configurar `persistQueryClient`:** Acoplar o IndexedDB ao `QueryClient` do React Query.
- [x] **Ajustar Tempos de Cache (`staleTime`):** Garantir que a carteira de clientes completa da vendedora fique em cache agressivo para estar disponível offline. (Nota: Buscas muito complexas ficarão limitadas apenas aos clientes já cacheados localmente).
- [x] **Sinalizador Visual de Status:** Adicionar um ícone/badge na barra superior avisando o status da rede (🟢 Online / 🔴 Offline).

## Fase 4: Fila de Sincronização (Ações Offline)
- [x] **Criar Estrutura da `Outbox` (Fila):** Criar tabela local no IndexedDB dedicada a armazenar ações de POST/PUT pendentes.
- [x] **Configurar Interceptador de API (Axios):**
  - Se offline, transformar o payload da requisição num objeto e salvá-lo na Fila (`Outbox`).
  - Retornar uma resposta "falsa" de sucesso (Mock) para o Frontend não quebrar.
- [x] **Implementar Mutações Otimistas:** Adaptar telas para que a interface reflita o dado novo instantaneamente (ex: mostrar a autorização gerada antes mesmo de ir para o Laravel).

## Fase 5: O Mecanismo de Sincronização Automática
- [ ] **Processador da Fila (Sync Engine):**
  - Ficar escutando o evento `window.addEventListener('online')` para iniciar.
  - Processar requisições da Outbox de forma sequencial (1 a 1).
  - Em caso de Sucesso, remover da Fila. Em caso de Falha de validação, mover para "Atenção Necessária".
- [ ] **Painel de Sincronizações:** Criar uma aba discreta onde a vendedora possa ver quantas ações estão aguardando envio.

## Fase 6: Ajustes no Backend (Laravel) e Testes
- [ ] **Prevenção de Duplicidade (Idempotência):** Garantir que o backend não gere uma fatura dupla se o PWA reenviar uma ação (baseado num UUID gerado no frontend).
- [ ] **Upload de Imagens Offline:** Refatorar componentes de upload para salvar o base64 localmente até a rede voltar e só então enviar para o Laravel subir no Supabase Storage.
- [ ] **Testes de Estresse:** Simular desligamento do Wi-Fi, realizar cadastros e religar a internet.
