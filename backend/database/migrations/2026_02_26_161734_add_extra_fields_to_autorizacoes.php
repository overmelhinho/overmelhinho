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
            $table->foreignId('plan_id')->nullable()->constrained('plans')->nullOnDelete();
            $table->boolean('is_permuta')->default(false);
            $table->decimal('permuta_amount', 15, 2)->nullable();
            $table->text('permuta_description')->nullable();
            $table->string('desconto_tipo')->nullable(); // fixed, percent
            $table->decimal('desconto_valor', 15, 2)->default(0);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('autorizacoes', function (Blueprint $table) {
            $table->dropForeign(['plan_id']);
            $table->dropColumn([
                'plan_id',
                'is_permuta',
                'permuta_amount',
                'permuta_description',
                'desconto_tipo',
                'desconto_valor'
            ]);
        });
    }
};
