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
            $table->string('obs_telefone_principal')->nullable()->after('telefone_principal_hidden_until');
            $table->string('obs_telefone_secundario')->nullable()->after('exibir_tel_secundario');
            $table->string('obs_celular')->nullable()->after('celular');
            $table->string('obs_telefone_outro')->nullable()->after('exibir_tel_outro');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('contatos', function (Blueprint $table) {
            $table->dropColumn([
                'obs_telefone_principal',
                'obs_telefone_secundario',
                'obs_celular',
                'obs_telefone_outro'
            ]);
        });
    }
};
