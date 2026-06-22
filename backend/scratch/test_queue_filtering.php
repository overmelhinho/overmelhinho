<?php
require dirname(__DIR__) . '/vendor/autoload.php';
$app = require_once dirname(__DIR__) . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Cliente;

$cidadesPermitidas = [
    'Alto Feliz', 'Arroio do Sal', 'Barão', 'Bento Gonçalves', 'Boa Vista do Sul',
    'Bom Princípio', 'Campo Bom', 'Canela', 'Carlos Barbosa', 'Caxias do Sul',
    'Coronel Pilar', 'Farroupilha', 'Feliz', 'Flores da Cunha', 'Garibaldi',
    'Gramado', 'Lajeado', 'Monte Belo do Sul', 'Nova Prata', 'Nova Roma do Sul',
    'Novo Hamburgo', 'Pinto Bandeira', 'Salvador do Sul', 'São Marcos',
    'São Pedro da Serra', 'São Sebastião do Caí', 'São Vendelino', 'Veranópolis'
];

$countBefore = Cliente::whereIn('audit_status', ['pending', 'manual_review'])->count();

$countAfter = Cliente::whereIn('audit_status', ['pending', 'manual_review'])
    ->where(function($q) use ($cidadesPermitidas) {
        $q->whereHas('enderecos', function($sub) use ($cidadesPermitidas) {
            $sub->whereIn(\Illuminate\Support\Facades\DB::raw('trim(cidade)'), $cidadesPermitidas);
        })->orWhereHas('cidadesAtendidas', function($sub) use ($cidadesPermitidas) {
            $sub->whereIn(\Illuminate\Support\Facades\DB::raw('trim(cidades.nome)'), $cidadesPermitidas);
        });
    })
    ->count();

echo "Queue count before restriction: {$countBefore}\n";
echo "Queue count after restriction: {$countAfter}\n";
