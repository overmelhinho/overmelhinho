<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Código de Verificação</title>
</head>
<body>
    <h1>Olá!</h1>

    {{-- Log de verificação --}}
    {{-- @php \Log::info("Renderizando email com código: " . ($code ?? 'código não definido')) @endphp --}}

    <p>Você solicitou acesso com autenticação em duas etapas.</p>
    <p>Seu código de verificação é:</p>
    <h2>{{ $code ?? 'Código indisponível' }}</h2>

    <p>Este código expira em 10 minutos.</p>
</body>
</html>
