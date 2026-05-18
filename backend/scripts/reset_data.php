<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

echo "Iniciando limpeza de dados para migração...\n";

// Desabilitar chaves estrangeiras para truncate (específico para alguns bancos, mas em Postgres usaremos CASCADE)
// No Postgres, TRUNCATE ... CASCADE é o ideal.

$tables = [
    'campanha_interacoes',
    'campanhas',
    'autorizacao_parcelas',
    'invoices',
    'autorizacoes',
    'cliente_reviews',
    'cliente_cidade',
    'cliente_segmento',
    'contatos',
    'enderecos',
    'galerias_imagens',
    'quotes',
    'leads',
    'ticket_logs',
    'ticket_subtasks',
    'tickets',
    'seo_rankings',
    'search_logs',
    'search_corrections',
    'client_interactions',
    'client_materials',
    'client_reports',
    'renewals',
    'notifications',
    'audit_logs',
    'clientes',
];

foreach ($tables as $table) {
    if (Schema::hasTable($table)) {
        echo "Limpando tabela: $table...\n";
        DB::statement("TRUNCATE TABLE $table RESTART IDENTITY CASCADE;");
    }
}

echo "Limpeza concluída com sucesso!\n";
