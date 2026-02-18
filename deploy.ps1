# deploy.ps1
# Script para automatizar o push para o GitHub

$commitMsg = Read-Host "Digite a mensagem do commit (deixe vazio para 'Auto-deploy')"
if (-not $commitMsg) {
    $commitMsg = "Auto-deploy: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
}

Write-Host "🚀 Iniciando deploy para o GitHub..." -ForegroundColor Cyan

Write-Host "📦 Adicionando arquivos..."
git add .

Write-Host "💾 Fazendo commit..."
git commit -m "$commitMsg"

Write-Host "📤 Enviando para o GitHub (origin main)..."
git push origin main

Write-Host "✅ Deploy para o GitHub finalizado!" -ForegroundColor Green
