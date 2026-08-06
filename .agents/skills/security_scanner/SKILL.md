---
name: security_scanner
description: Audita um arquivo ou diretório em busca de segredos vazados (chaves de API, senhas) e roda uma análise estática (Syntax Check). DEVE ser invocada sempre que o agente modificar um código.
---

# Security Scanner (SAST & Secrets)

## Propósito
Esta Skill garante que o agente nunca comite código contendo segredos hardcoded ou erros de sintaxe graves. Implementa a prática de Shift-Left Security exigida corporativamente.

## Como Usar
Para executar esta skill, utilize a ferramenta `run_command` com o executável PHP do XAMPP:

`C:\xampp2\php\php.exe .agents/skills/security_scanner/scripts/scan.php <caminho_absoluto_do_arquivo>`

## Regras de Comportamento
1. Se a ferramenta retornar qualquer alerta (🚨), você **DEVE** corrigir o código e executar a skill novamente.
2. Você **NUNCA** deve declarar a tarefa como concluída se o scanner acusar falhas.
3. Chaves de API e Senhas devem sempre ser movidas para variáveis de ambiente (`.env`) ou configs via `config()`.

## Auditoria de Dependências (CVEs)
Para verificar pacotes vulneráveis nas camadas do projeto (backend, frontend e site), execute o script auxiliar através da ferramenta `run_command`:
`powershell.exe -ExecutionPolicy Bypass -File .agents/skills/security_scanner/scripts/audit_deps.ps1`
