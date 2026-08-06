Write-Host "Iniciando Auditoria de Dependencias (CVEs) no projeto O Vermelhinho..." -ForegroundColor Cyan

$backendPath = "C:\Dev\overmelhinho\backend"
$frontendPath = "C:\Dev\overmelhinho\frontend"
$sitePath = "C:\Dev\overmelhinho\site"

if (Test-Path "$backendPath\composer.json") {
    Write-Host " [BACKEND] Rodando composer audit..." -ForegroundColor Yellow
    Set-Location $backendPath
    composer audit
    if ($LASTEXITCODE -eq 0) {
        Write-Host " Backend limpo!" -ForegroundColor Green
    } else {
        Write-Host " Vulnerabilidades encontradas no Backend!" -ForegroundColor Red
    }
}

if (Test-Path "$frontendPath\package.json") {
    Write-Host " [FRONTEND] Rodando npm audit..." -ForegroundColor Yellow
    Set-Location $frontendPath
    npm audit
    if ($LASTEXITCODE -eq 0) {
        Write-Host " Frontend limpo!" -ForegroundColor Green
    } else {
        Write-Host " Vulnerabilidades encontradas no Frontend!" -ForegroundColor Red
    }
}

if (Test-Path "$sitePath\package.json") {
    Write-Host " [SITE] Rodando npm audit..." -ForegroundColor Yellow
    Set-Location $sitePath
    npm audit
    if ($LASTEXITCODE -eq 0) {
        Write-Host " Site limpo!" -ForegroundColor Green
    } else {
        Write-Host " Vulnerabilidades encontradas no Site!" -ForegroundColor Red
    }
}
Write-Host "Auditoria concluida." -ForegroundColor Cyan
