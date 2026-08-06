# Regras de Negócio e Arquitetura - O Vermelhinho

Este documento serve como a **Fonte da Verdade** para qualquer agente de inteligência artificial ou desenvolvedor atuando no projeto **O Vermelhinho**. As regras aqui contidas são **INEGOCIÁVEIS** e devem ser consultadas antes de qualquer alteração arquitetural, deploy ou manipulação de banco de dados.

## 1. Controle de Versão e Deploy (Extremamente Crítico)

*   **Proibição de Deploy Autônomo:** O agente está **terminantemente PROIBIDO** de executar comandos como `git commit`, `git push`, ou qualquer script de deploy (ex: `deploy.sh`) por iniciativa própria, mesmo em situações de emergência para tentar "corrigir a produção".
*   **Gatilho Exato:** Ações de versionamento e deploy SÓ PODEM ser executadas se, e somente se, o usuário digitar EXPLICITAMENTE as frases `"suba para o github"` ou `"deploy"`.
*   **Auditoria Pré-Commit (Push Seguro):** 
    1. Antes de commitar, o agente DEVE rodar `git status` para revisar os arquivos.
    2. Garantir que não existam arquivos de dados gigantes (backups `.sql`, logs, dumps, pastas de scratch) aguardando upload. Se houver, adicioná-los ao `.gitignore`. (Lembrete: O GitHub tem um limite rígido de 100MB por arquivo).
    3. O comando `git push` DEVE ser sempre executado sozinho (nunca encadeado com `&&` ou `;`) para garantir que as credenciais SSH/Windows funcionem sem travar o terminal.

## 2. Ambiente de Desenvolvimento Local (XAMPP)

*   **Zero Docker:** Para iniciar serviços locais ou executar comandos PHP/Laravel, **NUNCA utilize Docker**. Ignore a existência de qualquer `docker-compose.yml` para a execução da aplicação local.
*   **Caminho do PHP:** O ambiente local roda estritamente no XAMPP localizado em `C:\xampp2`. Sempre utilize o executável absoluto do PHP:
    *   `C:\xampp2\php\php.exe` (Ex: `C:\xampp2\php\php.exe artisan serve`).
*   **Estrutura de Frontend:**
    *   O painel/frontend (SPA) fica na pasta `frontend/`. Deve ser iniciado com `npm run dev`.
    *   O site principal (Next.js) fica na pasta `site/`. Deve ser iniciado com `npm run dev` (roda na Porta 3000).

## 3. Banco de Dados e Exclusão de Dados

*   **Soft Deletes Obrigatório:** NUNCA utilize exclusão física (`DELETE` SQL direto ou `$model->delete()` se o model não tiver a trait) em tabelas centrais do sistema (Clientes, Oportunidades, Leads, Tickets). Sempre utilize a lógica de **Soft Delete** (`deleted_at`) para manter a rastreabilidade e integridade referencial.
*   **Logs de Auditoria:** O sistema possui uma trait `Auditable` que rastreia alterações. Sempre que for adicionar novos campos vitais no banco, garanta que a auditoria está ciente.

## 4. Gestão de Mídia e Armazenamento (Storage)

*   **Transição de Infraestrutura:** O projeto possui um legado onde arquivos físicos eram hospedados no disco (`storage/app/public/` ou servidos via `api.overmelhinho.com.br`).
*   **Novo Padrão (Supabase):** Novos uploads e mídias devem ser apontados e armazenados no bucket do **Supabase**. 
*   **Tratamento de 403 / 404 em Imagens:** Se o banco de dados apontar para uma imagem local legada e ela retornar erro 403/404, significa que o arquivo foi fisicamente perdido na migração. A solução homologada é que o usuário faça o re-upload da imagem pela interface do sistema, forçando a criação no novo formato/Supabase, em vez de tentar recuperar os arquivos perdidos do disco.

---
*Fim das regras inegociáveis. Ao ler este documento, o agente de IA assume total responsabilidade pelo cumprimento destas diretrizes.*

## 5. Regras Avan�adas de Seguran�a e Zero Trust
*   **Autoriza��o Obrigat�ria (Anti-IDOR):** NENHUM endpoint de API (Controller) pode ser modificado ou criado sem verificar explicitamente a posse e autoriza��o sobre o recurso. Utilize sempre Policies (uthorize) ou valida��es de acesso para garantir que um cliente logado n�o consegue acessar os recursos de outro apenas alterando o ID na URL.
*   **Blindagem de Uploads:** Todo upload de arquivos processado pelo backend deve ser estritamente validado por tipo de arquivo (MIME type). Confiar apenas na extens�o do arquivo para validar imagens � estritamente proibido (evitando inje��o de web shells disfar�ados).
