<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Se a coluna não existir, não faz nada
        if (!Schema::hasColumn('clientes', 'seo_keywords')) {
            return;
        }

        // Converte de text[] para jsonb mantendo dados existentes
        // to_jsonb(text[]) => vira JSON array
        DB::statement("
            ALTER TABLE clientes
            ALTER COLUMN seo_keywords
            TYPE jsonb
            USING to_jsonb(seo_keywords)
        ");
    }

    public function down(): void
    {
        if (!Schema::hasColumn('clientes', 'seo_keywords')) {
            return;
        }

        // Reverte de jsonb (array) para text[]
        // jsonb_array_elements_text => explode em linhas, array_agg => volta pro array
        DB::statement("
            ALTER TABLE clientes
            ALTER COLUMN seo_keywords
            TYPE text[]
            USING (
                SELECT COALESCE(array_agg(value), ARRAY[]::text[])
                FROM jsonb_array_elements_text(seo_keywords) AS t(value)
            )
        ");
    }
};
