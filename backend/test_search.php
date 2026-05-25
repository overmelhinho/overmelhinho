<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$q = 'psicologia';
$cityName = 'Farroupilha';
$query = \App\Models\Cliente::query()
    ->where('exibir_no_site', 'true')
    ->where(function($sub) {
        $sub->whereIn('status_assinatura', ['ativa', 'ativo', 'pendente', 'vencida', 'vencido'])
            ->orWhere('tipo_cliente', 'gratuito');
    });

$query->where(function ($sub) use ($q) {
    $sub->whereRaw('unaccent(nome_fantasia) ilike unaccent(?)', ["%{$q}%"]);
    $sub->orWhereRaw('unaccent(seo_keywords::text) ilike unaccent(?)', ["%{$q}%"]);
});

$query->where(function($sub) use ($cityName) {
    $sub->whereHas('cidadesAtendidas', function($c) use ($cityName) {
        $c->whereRaw('unaccent(cidades.nome) ilike unaccent(?)', ["%{$cityName}%"]);
    })->orWhereHas('enderecos', function($e) use ($cityName) {
        $e->whereRaw('unaccent(cidade) ilike unaccent(?)', ["%{$cityName}%"]);
    });
});

echo "Count matches in Farroupilha: " . $query->count() . "\n";
