<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('cliente_reviews')) {
            Schema::table('cliente_reviews', function (Blueprint $table) {
                if (!Schema::hasColumn('cliente_reviews', 'google_review_id')) {
                    $table->string('google_review_id')->nullable()->unique();
                }
                
                if (!Schema::hasColumn('cliente_reviews', 'is_visible')) {
                    $table->boolean('is_visible')->default(true);
                }
                
                // Garantir que relative_time_description seja timestamp (já deve ser, mas por precaução)
                // Usando raw para garantir compatibilidade com Postgres
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('cliente_reviews')) {
            Schema::table('cliente_reviews', function (Blueprint $table) {
                // Não removemos para evitar perda de dados em produção
            });
        }
    }
};
