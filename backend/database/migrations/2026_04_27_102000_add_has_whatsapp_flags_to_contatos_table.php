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
            $table->boolean('has_whatsapp_principal')->default(false)->after('telefone_principal');
            $table->boolean('has_whatsapp_secundario')->default(false)->after('telefone_secundario');
            $table->boolean('has_whatsapp_celular')->default(false)->after('celular');
            $table->boolean('has_whatsapp_outro')->default(false)->after('telefone_outro');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('contatos', function (Blueprint $table) {
            $table->dropColumn([
                'has_whatsapp_principal',
                'has_whatsapp_secundario',
                'has_whatsapp_celular',
                'has_whatsapp_outro'
            ]);
        });
    }
};
