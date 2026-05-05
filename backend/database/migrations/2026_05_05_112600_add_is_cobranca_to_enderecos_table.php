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
        if (!Schema::hasColumn('enderecos', 'is_cobranca')) {
            Schema::table('enderecos', function (Blueprint $table) {
                $table->boolean('is_cobranca')->default(false)->after('exibir_apenas_cidade');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('enderecos', function (Blueprint $table) {
            $table->dropColumn('is_cobranca');
        });
    }
};
