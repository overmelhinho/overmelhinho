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
            $table->string('telefone_outro')->nullable();
            $table->string('whatsapp_selected')->nullable(); // Nome do campo selecionado
            $table->boolean('exibir_tel_principal')->default(false);
            $table->boolean('exibir_tel_secundario')->default(false);
            $table->boolean('exibir_celular')->default(false);
            $table->boolean('exibir_tel_outro')->default(false);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('contatos', function (Blueprint $table) {
            //
        });
    }
};
