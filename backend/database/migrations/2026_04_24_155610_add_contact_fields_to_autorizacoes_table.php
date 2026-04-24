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
        Schema::table('autorizacoes', function (Blueprint $table) {
            $table->string('contato_nome')->nullable()->after('vendedor_id');
            $table->string('contato_horario')->nullable()->after('contato_nome');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('autorizacoes', function (Blueprint $table) {
            $table->dropColumn(['contato_nome', 'contato_horario']);
        });
    }
};
