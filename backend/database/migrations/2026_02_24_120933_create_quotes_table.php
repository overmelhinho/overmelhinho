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
        Schema::create('quotes', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('cliente_id'); // Referenciado como cliente_id no restante do projeto
            $table->string('customer_name');
            $table->string('customer_whatsapp');
            $table->text('service_requested');
            $table->enum('urgency', ['pesquisa', 'semana', 'emergencia']);
            $table->enum('status', ['new', 'replied', 'closed'])->default('new');
            $table->text('ai_draft_response')->nullable();
            $table->timestamps();

            $table->foreign('cliente_id')->references('id')->on('clientes')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quotes');
    }
};
