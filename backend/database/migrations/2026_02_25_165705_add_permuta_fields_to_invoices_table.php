<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            // Flag: esta fatura tem permuta?
            $table->boolean('is_permuta')->default(false)->after('status');

            // Valor total combinado em permuta (bens/serviços trocados)
            $table->decimal('permuta_amount', 10, 2)->nullable()->after('is_permuta');

            // Valor real a cobrar em dinheiro (PIX/Boleto): amount - permuta_amount
            $table->decimal('payable_amount', 10, 2)->nullable()->after('permuta_amount');

            // Descrição do que foi permutado (Ex: "2 vouchers de jantar + 1 dia de estúdio")
            $table->text('permuta_description')->nullable()->after('payable_amount');
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn(['is_permuta', 'permuta_amount', 'payable_amount', 'permuta_description']);
        });
    }
};
