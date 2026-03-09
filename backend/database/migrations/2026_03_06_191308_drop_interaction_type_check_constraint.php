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
            // Remove a restriÃ§Ã£o de CHECK que causa o erro 500 no Postgres
            DB::statement('ALTER TABLE client_interactions DROP CONSTRAINT IF EXISTS client_interactions_interaction_type_check');
            
            // Garante que a coluna Ã© string (redundante mas seguro)
            DB::statement('ALTER TABLE client_interactions ALTER COLUMN interaction_type TYPE VARCHAR(255)');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // NÃ£o faz nada no rollback para evitar erros de sintaxe de Enum do Laravel no Postgres
    }
};
