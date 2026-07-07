<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Mail;

Mail::raw('Este é um teste de e-mail em texto puro disparado pelo Laravel, sem HTML.', function ($message) {
    $message->to('angelica.overmelhinho@gmail.com')
            ->from('overmelhinho.seo@gmail.com', 'Teste Texto')
            ->subject('Teste Laravel Texto Puro');
});

echo "Email de texto enviado.\n";
