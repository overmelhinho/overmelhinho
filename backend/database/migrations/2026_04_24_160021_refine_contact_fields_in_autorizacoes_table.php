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
            // Renomeando para ficar mais claro conforme pedido
            $table->renameColumn('contato_nome', 'responsavel_nome');
            $table->renameColumn('contato_horario', 'responsavel_turno');
            $table->string('responsavel_preferencia')->nullable()->after('responsavel_nome');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('autorizacoes', function (Blueprint $table) {
            $table->renameColumn('responsavel_nome', 'contato_nome');
            $table->renameColumn('responsavel_turno', 'contato_horario');
            $table->dropColumn('responsavel_preferencia');
        });
    }
};
