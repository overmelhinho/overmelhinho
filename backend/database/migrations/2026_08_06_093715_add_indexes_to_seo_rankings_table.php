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
        Schema::table('seo_rankings', function (Blueprint $table) {
            $table->index(['cliente_id', 'keyword', 'created_at'], 'idx_cliente_keyword_created');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('seo_rankings', function (Blueprint $table) {
            $table->dropIndex('idx_cliente_keyword_created');
        });
    }
};
