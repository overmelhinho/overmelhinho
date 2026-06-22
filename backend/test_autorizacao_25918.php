<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Autorizacao;
use App\Models\Invoice;

$aut = Autorizacao::with(['parcelas', 'cliente'])->where('numero', '25918')->first();
if (!$aut) {
    echo "Autorizacao 25918 not found!\n";
    exit;
}

echo "Autorizacao ID: {$aut->id}, Numero: {$aut->numero}\n";
echo "Valor Total: {$aut->valor_total}\n";
echo "Modo Pagamento: {$aut->modo_pagamento}\n";
echo "Num Parcelas: {$aut->num_parcelas}\n";
echo "Payment Method: {$aut->payment_method}\n";
echo "Status: {$aut->status}\n\n";

echo "--- Parcelas ---\n";
foreach ($aut->parcelas as $p) {
    echo "ID: {$p->id}, Numero: {$p->numero}, Vencimento: {$p->vencimento?->format('d/m/Y')}, Valor: {$p->valor}, Payable: {$p->payable_amount}, Invoice ID: {$p->invoice_id}\n";
}
echo "\n";

echo "--- Local Invoices (Group ID: 'autorizacao-{$aut->id}') ---\n";
$invoices = Invoice::where('group_id', 'autorizacao-' . $aut->id)->orWhere('group_id', (string)$aut->id)->get();
foreach ($invoices as $i) {
    echo "ID: {$i->id}, Amount: {$i->amount}, Payable: {$i->payable_amount}, Due: {$i->due_date?->format('d/m/Y')}, Tiny Account ID: {$i->tiny_account_id}, Status: {$i->status}, Payment Method: {$i->payment_method}\n";
}
