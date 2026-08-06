<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Usa raw SQL com IF NOT EXISTS para não falhar caso o índice já tenha sido criado manualmente em produção
        DB::statement('CREATE INDEX IF NOT EXISTS idx_cliente_keyword_created ON seo_rankings (cliente_id, keyword, created_at)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS idx_cliente_keyword_created');
    }
};
