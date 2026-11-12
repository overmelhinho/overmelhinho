$urls = @(
    '/barao/produtos-caseiros',
    '/gramado/comunicacao-integrada',
    '/farroupilha/produtos-caseiros',
    '/garibaldi/produtos-caseiros',
    '/farroupilha/filtros'
)

foreach ($u in $urls) {
    try {
        $res = Invoke-WebRequest -Uri ("http://localhost:3000" + $u) -UseBasicParsing -TimeoutSec 15
        Write-Host "$u => HTTP $($res.StatusCode)" -ForegroundColor Green
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        Write-Host "$u => HTTP $code" -ForegroundColor Yellow
    }
}

