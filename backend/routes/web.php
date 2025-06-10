<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Mail;
use App\Mail\TesteMailtrap;

Route::get('/teste-mailtrap', function () {
    Mail::to('prezziep@gmail.com')->send(new TesteMailtrap('Admin'));
    return 'Email de teste enviado com sucesso!';
});
