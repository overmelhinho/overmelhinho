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
        Schema::table('autorizacao_parcelas', function (Blueprint $table) {
            $table->decimal('permuta_amount', 15, 2)->default(0);
            $table->decimal('payable_amount', 15, 2)->default(0);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('autorizacao_parcelas', function (Blueprint $table) {
            $table->dropColumn(['permuta_amount', 'payable_amount']);
        });
    }
};
