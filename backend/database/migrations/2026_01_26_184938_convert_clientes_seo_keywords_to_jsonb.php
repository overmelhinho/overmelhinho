<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('clientes', 'seo_keywords')) {
            return;
        }

        // Converte text[] -> jsonb (array json)
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

        // Reverte jsonb array -> text[]
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
