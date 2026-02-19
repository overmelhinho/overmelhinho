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
        Schema::table('clientes', function (Blueprint $table) {
            $table->unsignedBigInteger('plan_id')->nullable()->after('tiny_id');
            $table->integer('recurrence_day')->nullable()->after('plan_id')->comment('Dia do mês para renovação (1-31)');
            $table->date('last_invoice_generated_at')->nullable()->after('recurrence_day');

            $table->foreign('plan_id')->references('id')->on('plans')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('clientes', function (Blueprint $table) {
            $table->dropForeign(['plan_id']);
            $table->dropColumn(['plan_id', 'recurrence_day', 'last_invoice_generated_at']);
        });
    }
};
