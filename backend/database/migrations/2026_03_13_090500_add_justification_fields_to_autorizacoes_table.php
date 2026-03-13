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
        Schema::table('autorizacoes', function (Blueprint $col) {
            $col->text('justificativa_assinatura')->nullable();
            $col->foreignId('justificado_por')->nullable()->constrained('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('autorizacoes', function (Blueprint $col) {
            $col->dropColumn(['justificativa_assinatura', 'justificado_por']);
        });
    }
};
