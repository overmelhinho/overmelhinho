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
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE clientes ADD COLUMN IF NOT EXISTS search_vector tsvector');

            // 2. Atualiza o vetor de busca para os registros existentes
            DB::statement('CREATE INDEX IF NOT EXISTS clientes_search_vector_gin ON clientes USING GIN (search_vector)');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS clientes_search_vector_gin');
        DB::statement('ALTER TABLE clientes DROP COLUMN IF EXISTS search_vector');
    }
};
