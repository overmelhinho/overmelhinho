<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Adiciona coluna para ocultar o telefone principal por 10 dias.
     * null = exibe normalmente. Data futura = oculto até aquela data.
     */
    public function up(): void
    {
        Schema::table('contatos', function (Blueprint $table) {
            $table->timestamp('telefone_principal_hidden_until')->nullable()->after('exibir_tel_principal');
        });
    }

    public function down(): void
    {
        Schema::table('contatos', function (Blueprint $table) {
            $table->dropColumn('telefone_principal_hidden_until');
        });
    }
};
