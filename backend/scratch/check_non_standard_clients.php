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

$clientes = Cliente::with(['enderecos', 'cidadesAtendidas'])->get();
echo "Total clients in DB: " . $clientes->count() . "\n";

$outsideCount = 0;
$cidadesDosClientesOutside = [];

foreach ($clientes as $c) {
    // Check if client belongs to any standard city
    $belongsToStandard = false;
    
    // Check enderecos
    foreach ($c->enderecos as $end) {
        $cidadeEnd = trim($end->cidade);
        foreach ($cidadesPermitidas as $cp) {
            if (strcasecmp($cidadeEnd, $cp) === 0) {
                $belongsToStandard = true;
                break 2;
            }
        }
    }
    
    // Check cidadesAtendidas
    if (!$belongsToStandard) {
        foreach ($c->cidadesAtendidas as $ca) {
            $cidadeCA = trim($ca->nome);
            foreach ($cidadesPermitidas as $cp) {
                if (strcasecmp($cidadeCA, $cp) === 0) {
                    $belongsToStandard = true;
                    break 2;
                }
            }
        }
    }
    
    if (!$belongsToStandard) {
        $outsideCount++;
        // Get all city names associated with this client
        $names = [];
        foreach ($c->enderecos as $end) {
            $names[] = trim($end->cidade) . " (Endereco)";
        }
        foreach ($c->cidadesAtendidas as $ca) {
            $names[] = trim($ca->nome) . " (Atendida)";
        }
        $cidadesDosClientesOutside[] = "Client ID: {$c->id} | Name: {$c->nome_fantasia} | Cities: " . implode(', ', $names);
    }
}

echo "Clients outside standard cities: {$outsideCount}\n";
echo "First 20 outside clients:\n";
foreach (array_slice($cidadesDosClientesOutside, 0, 20) as $line) {
    echo " - {$line}\n";
}
