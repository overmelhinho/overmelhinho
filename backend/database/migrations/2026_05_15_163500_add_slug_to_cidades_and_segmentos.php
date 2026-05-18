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
        Schema::table('cidades', function (Blueprint $table) {
            if (!Schema::hasColumn('cidades', 'slug')) {
                $table->string('slug')->nullable()->after('nome');
                $table->index('slug');
            }
        });

        Schema::table('segmentos', function (Blueprint $table) {
            if (!Schema::hasColumn('segmentos', 'slug')) {
                $table->string('slug')->nullable()->after('nome');
                $table->index('slug');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cidades', function (Blueprint $table) {
            $table->dropColumn('slug');
        });

        Schema::table('segmentos', function (Blueprint $table) {
            $table->dropColumn('slug');
        });
    }
};
