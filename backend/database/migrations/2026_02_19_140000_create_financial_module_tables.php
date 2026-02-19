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
        // 1. Modificar tabela clientes (adicionar tiny_id)
        Schema::table('clientes', function (Blueprint $table) {
            $table->string('tiny_id')->nullable()->after('id')->index();
        });

        // 2. Criar tabela plans (Planos)
        Schema::create('plans', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->decimal('price', 10, 2);
            $table->enum('billing_cycle', ['mensal', 'anual', 'avulso'])->default('avulso');
            $table->string('tiny_product_id')->nullable()->comment('ID do serviço mapeado no Tiny');
            $table->timestamps();
        });

        // 3. Criar tabela invoices (Faturas)
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('client_id');
            $table->unsignedBigInteger('plan_id')->nullable();

            $table->decimal('amount', 10, 2);
            $table->date('due_date');

            $table->string('status')->default('pending'); // pending, paid, canceled

            $table->string('tiny_account_id')->nullable()->comment('ID da conta a receber no Tiny');
            $table->string('payment_url')->nullable()->comment('Link do boleto/pix gerado pelo Tiny');

            $table->timestamps();

            // Foreign Keys
            $table->foreign('client_id')->references('id')->on('clientes')->onDelete('cascade');
            $table->foreign('plan_id')->references('id')->on('plans')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoices');
        Schema::dropIfExists('plans');

        Schema::table('clientes', function (Blueprint $table) {
            $table->dropColumn('tiny_id');
        });
    }
};
