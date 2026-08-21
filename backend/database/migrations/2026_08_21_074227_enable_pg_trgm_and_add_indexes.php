<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement('CREATE EXTENSION IF NOT EXISTS pg_trgm;');
        
        DB::statement("
            CREATE OR REPLACE FUNCTION f_unaccent(text)
            RETURNS text AS
            $$
            SELECT public.unaccent('public.unaccent', $1)
            $$  LANGUAGE sql IMMUTABLE;
        ");

        DB::statement('CREATE INDEX IF NOT EXISTS clientes_nome_fantasia_trgm_idx ON clientes USING gin (f_unaccent(nome_fantasia) gin_trgm_ops);');
        DB::statement('CREATE INDEX IF NOT EXISTS clientes_nome_alternativo_trgm_idx ON clientes USING gin (f_unaccent(nome_alternativo) gin_trgm_ops);');
        DB::statement('CREATE INDEX IF NOT EXISTS segmentos_nome_trgm_idx ON segmentos USING gin (f_unaccent(nome) gin_trgm_ops);');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS segmentos_nome_trgm_idx;');
        DB::statement('DROP INDEX IF EXISTS clientes_nome_alternativo_trgm_idx;');
        DB::statement('DROP INDEX IF EXISTS clientes_nome_fantasia_trgm_idx;');
        DB::statement('DROP FUNCTION IF EXISTS f_unaccent(text);');
        // We do not drop pg_trgm extension as it might be used elsewhere
    }
};
