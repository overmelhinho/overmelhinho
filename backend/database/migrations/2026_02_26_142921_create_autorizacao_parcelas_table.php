<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('autorizacao_parcelas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('autorizacao_id')->constrained('autorizacoes')->onDelete('cascade');
            $table->unsignedSmallInteger('numero')->comment('Número da parcela (1, 2, 3...)');
            $table->date('vencimento');
            $table->decimal('valor', 10, 2);
            $table->string('status')->default('pendente')->comment('pendente, pago, cancelado');
            $table->foreignId('invoice_id')->nullable()->constrained('invoices')->onDelete('set null')
                ->comment('Invoice gerada para esta parcela após assinatura');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('autorizacao_parcelas');
    }
};
