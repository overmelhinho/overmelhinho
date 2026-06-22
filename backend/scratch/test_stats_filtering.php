<?php
require dirname(__DIR__) . '/vendor/autoload.php';
$app = require_once dirname(__DIR__) . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$cidadesPermitidas = [
    'Alto Feliz', 'Arroio do Sal', 'Barão', 'Bento Gonçalves', 'Boa Vista do Sul',
    'Bom Princípio', 'Campo Bom', 'Canela', 'Carlos Barbosa', 'Caxias do Sul',
    'Coronel Pilar', 'Farroupilha', 'Feliz', 'Flores da Cunha', 'Garibaldi',
    'Gramado', 'Lajeado', 'Monte Belo do Sul', 'Nova Prata', 'Nova Roma do Sul',
    'Novo Hamburgo', 'Pinto Bandeira', 'Salvador do Sul', 'São Marcos',
    'São Pedro da Serra', 'São Sebastião do Caí', 'São Vendelino', 'Veranópolis'
];

// Without restriction
$cobertura1 = DB::selectOne("
    SELECT 
        COUNT(*) AS total,
        COUNT(last_audit_at) AS auditados,
        COUNT(CASE WHEN audit_status = 'ok' THEN 1 END) AS verificados,
        COUNT(CASE WHEN audit_status = 'pending' THEN 1 END) AS pendentes,
        COUNT(CASE WHEN audit_status = 'manual_review' THEN 1 END) AS revisao_manual
    FROM clientes
");

echo "Without restriction:\n";
print_r($cobertura1);

// With restriction (using Eloquent to easily check relations, or raw sql with exists)
$query = \App\Models\Cliente::query();
$query->where(function($q) use ($cidadesPermitidas) {
    $q->whereHas('enderecos', function($sub) use ($cidadesPermitidas) {
        $sub->whereIn(DB::raw('trim(cidade)'), $cidadesPermitidas);
    })->orWhereHas('cidadesAtendidas', function($sub) use ($cidadesPermitidas) {
        $sub->whereIn(DB::raw('trim(cidades.nome)'), $cidadesPermitidas);
    });
});

$total = $query->clone()->count();
$auditados = $query->clone()->whereNotNull('last_audit_at')->count();
$verificados = $query->clone()->where('audit_status', 'ok')->count();
$pendentes = $query->clone()->where('audit_status', 'pending')->count();
$revisao_manual = $query->clone()->where('audit_status', 'manual_review')->count();

echo "\nWith restriction:\n";
echo "Total: $total\n";
echo "Auditados: $auditados\n";
echo "Verificados: $verificados\n";
echo "Pendentes: $pendentes\n";
echo "Revisão Manual: $revisao_manual\n";
