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
        // No PostgreSQL, o ENUM cria uma check constraint que precisa ser removida manualmente
        // antes de mudar o tipo da coluna, caso contrÃ¡rio a mudanÃ§a de tipo nÃ£o remove a restriÃ§Ã§o.
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE client_interactions DROP CONSTRAINT IF EXISTS client_interactions_interaction_type_check');
        }

        Schema::table('client_interactions', function (Blueprint $table) {
            $table->string('interaction_type')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('client_interactions', function (Blueprint $table) {
            $table->enum('interaction_type', ['page_view', 'whatsapp_click', 'waze_click', 'social_click'])->change();
        });
    }
};
