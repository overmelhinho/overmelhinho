<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Adiciona coluna `label` à tabela redes_sociais.
     * Permite que cada rede social tenha um identificador
     * amigável (ex: "Principal", "Comercial") exibido no badge
     * do perfil público quando há múltiplas contas do mesmo tipo.
     */
    public function up(): void
    {
        DB::statement('ALTER TABLE redes_sociais ADD COLUMN IF NOT EXISTS label VARCHAR(100) NULL');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE redes_sociais DROP COLUMN IF EXISTS label');
    }
};
