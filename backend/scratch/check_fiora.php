<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$invs = App\Models\Invoice::whereHas('client', function($q) { $q->where('nome_fantasia', 'like', '%Fiora%'); })->get(['id', 'amount', 'payable_amount', 'status', 'group_id', 'parcel_number', 'due_date'])->toArray();
print_r($invs);

$auths = App\Models\Autorizacao::whereHas('cliente', function($q){ $q->where('nome_fantasia', 'like', '%Fiora%'); })->pluck('id');
$parcelas = App\Models\AutorizacaoParcela::whereIn('autorizacao_id', $auths)->get(['id', 'numero', 'valor', 'payable_amount', 'status', 'invoice_id'])->toArray();
print_r($parcelas);
