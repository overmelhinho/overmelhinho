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
        Schema::table('seo_insights', function (Blueprint $table) {
            $table->index(['cliente_id', 'keyword', 'status'], 'idx_seo_insights_lookup');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('seo_insights', function (Blueprint $table) {
            $table->dropIndex('idx_seo_insights_lookup');
        });
    }
};
