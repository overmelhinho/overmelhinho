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
            if (!Schema::hasColumn('contatos', 'exibir_email')) {
                $table->boolean('exibir_email')->default(true)->after('site');
            }
            if (!Schema::hasColumn('contatos', 'exibir_tel_secundario')) {
                $table->boolean('exibir_tel_secundario')->default(true)->after('telefone_secundario');
            }
            if (!Schema::hasColumn('contatos', 'exibir_tel_outro')) {
                $table->boolean('exibir_tel_outro')->default(true)->after('telefone_outro');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('contatos', function (Blueprint $table) {
            if (Schema::hasColumn('contatos', 'exibir_email')) {
                $table->dropColumn('exibir_email');
            }
            if (Schema::hasColumn('contatos', 'exibir_tel_secundario')) {
                $table->dropColumn('exibir_tel_secundario');
            }
            if (Schema::hasColumn('contatos', 'exibir_tel_outro')) {
                $table->dropColumn('exibir_tel_outro');
            }
        });
    }
};
