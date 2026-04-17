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
        Schema::table('contatos', function (Blueprint $table) {
            $table->boolean('exibir_email')->default(true)->after('site');
            $table->boolean('exibir_tel_secundario')->default(true)->after('telefone_secundario');
            $table->boolean('exibir_tel_outro')->default(true)->after('telefone_outro');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('contatos', function (Blueprint $table) {
            $table->dropColumn(['exibir_email', 'exibir_tel_secundario', 'exibir_tel_outro']);
        });
    }
};
