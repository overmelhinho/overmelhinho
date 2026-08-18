<RULE[safe_git_push]>
REGRA DE PUSH SEGURO (O Vermelhinho): Sempre que o usuário solicitar explicitamente 'suba para o github' ou 'deploy':
1. Antes de realizar o commit, o agente DEVE revisar os arquivos que serão enviados (rodando 'git status') para garantir que não existem arquivos de dados (como backups .sql, logs, dumps ou pastas de scratch) que estejam aguardando upload.
2. Se houver arquivos sensíveis ou grandes, adicione-os ao .gitignore antes de executar o 'git add .'.
3. Lembre-se sempre que o GitHub tem limite estrito de 100MB por arquivo.
</RULE[safe_git_push]>
4. O comando 'git push' DEVE ser sempre executado sozinho (não encadeado com '&&' ou ';') e utilizando permissão 'unsandboxed'. Isso garante que o agente consiga utilizar as credenciais SSH/Windows do usuário para o GitHub sem travar o terminal aguardando senha.

<RULE[strict_no_auto_deploy]>
**BLOQUEIO DE VERSIONAMENTO E DEPLOY**: O agente está terminantemente PROIBIDO de executar git commit, git push, ou qualquer script de deploy (ex: deploy.ps1, deploy-auto.sh) por iniciativa própria, **mesmo em situações de emergência ou para tentar "corrigir a produção"**.
Essas ações só podem ser executadas se, e somente se, a mensagem atual do usuário contiver EXPLICITAMENTE a frase "suba para o github" ou "deploy". Sem isso, o agente deve se limitar a alterar arquivos localmente e orientar o usuário.
</RULE[strict_no_auto_deploy]>


<RULE[local_environment]>
**AMBIENTE LOCAL (XAMPP)**: Para iniciar os serviços ou executar comandos PHP/Laravel localmente, NUNCA utilize Docker (ignore o docker-compose.yml).
O ambiente local roda estritamente no XAMPP localizado em C:\xampp2.
Sempre utilize o executável do PHP do XAMPP: C:\xampp2\php\php.exe (ex: C:\xampp2\php\php.exe artisan serve).
O frontend deve ser iniciado na pasta rontend rodando 
pm run dev.
</RULE[local_environment]>
- O site principal (Next.js) deve ser iniciado na pasta site rodando 
pm run dev (Porta 3000).

<RULE[strict_local_validation]>
**VALIDAÇÃO LOCAL OBRIGATÓRIA (TDD/Tinker)**: O agente está terminantemente PROIBIDO de realizar um `git push` ou dar uma tarefa de Backend/API como concluída sem antes testá-la no ambiente local.
1. Se for uma nova Rota ou Controller, o agente DEVE fazer uma requisição real localmente (via `curl`, `Invoke-RestMethod` ou Script PHP) para provar que retorna 200 OK e não um Erro 500.
2. Se for um Job ou lógica de Banco de Dados, o agente DEVE rodá-la via `php artisan tinker` e verificar o output.
3. Não presuma que o código está certo apenas por inspeção visual. Falhas de banco de dados e campos nulos só aparecem ao rodar.
</RULE[strict_local_validation]>

<RULE[security_scanning_policy]>
**Fluxo de Trabalho DevSecOps Obrigatório**:
1. Após escrever ou modificar qualquer arquivo, o agente é OBRIGADO a invocar a skill security_scanner no arquivo modificado.
2. O agente NUNCA deve aprovar o próprio código ou finalizar a tarefa se a ferramenta de segurança retornar alertas (🚨).
3. Se houver falha de segurança, analise, corrija o código de forma segura e rode o scanner novamente até passar (✅).
</RULE[security_scanning_policy]>
