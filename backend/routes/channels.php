<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// 📢 FASE 5: Canal de sincronização de clientes
Broadcast::channel('clientes', function ($user) {
    return $user !== null; // Qualquer usuário logado pode escutar
});
