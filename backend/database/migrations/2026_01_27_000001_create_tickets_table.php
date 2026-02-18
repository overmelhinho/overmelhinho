<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('tickets', function (Blueprint $table) {
            $table->bigIncrements('id');

            $table->unsignedBigInteger('cliente_id')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();

            // criativo | financeiro
            $table->string('setor', 30);

            // aberto | em_andamento | concluido | cancelado
            $table->string('status', 30)->default('aberto');

            $table->string('titulo', 191);
            $table->text('descricao')->nullable();

            // baixa | media | alta
            $table->string('prioridade', 20)->default('media');

            $table->timestamps();

            $table->foreign('cliente_id')->references('id')->on('clientes')->onDelete('cascade');
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();

            $table->index(['setor', 'status']);
            $table->index(['cliente_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tickets');
    }
};
