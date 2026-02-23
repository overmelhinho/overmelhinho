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
            $table->integer('clicks')->default(0)->after('previous_position');
            $table->integer('impressions')->default(0)->after('clicks');
            $table->decimal('ctr', 5, 2)->default(0)->after('impressions');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('seo_rankings', function (Blueprint $table) {
            $table->dropColumn(['clicks', 'impressions', 'ctr']);
        });
    }
};
