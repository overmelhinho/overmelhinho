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
        // Adiciona a coluna TSVECTOR
        DB::statement('ALTER TABLE clientes ADD COLUMN IF NOT EXISTS search_vector tsvector');
        
        // Adiciona o índice GIN para buscas ultrarrápidas
        DB::statement('CREATE INDEX IF NOT EXISTS clientes_search_vector_gin ON clientes USING GIN (search_vector)');
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
