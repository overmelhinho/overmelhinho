<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Adiciona coluna `label` à tabela redes_sociais.
     * Permite que cada rede social tenha um identificador
     * amigável (ex: "Principal", "Comercial") exibido no badge
     * do perfil público quando há múltiplas contas do mesmo tipo.
     */
    public function up(): void
    {
        if (!Schema::hasColumn('redes_sociais', 'label')) {
            Schema::table('redes_sociais', function (Blueprint $table) {
                $table->string('label', 100)->nullable();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('redes_sociais', 'label')) {
            Schema::table('redes_sociais', function (Blueprint $table) {
                $table->dropColumn('label');
            });
        }
    }
};
