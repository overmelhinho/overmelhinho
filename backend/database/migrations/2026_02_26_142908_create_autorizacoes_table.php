<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('autorizacoes', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('numero')->unique()->comment('Número sequencial da autorização');
            $table->foreignId('cliente_id')->constrained('clientes')->onDelete('cascade');
            $table->unsignedBigInteger('vendedor_id')->nullable()->comment('ID do usuário vendedor');

            // Publicidade
            $table->string('tipo_publicidade')->default('WEB')->comment('WEB, APP, FISICO, etc.');
            $table->string('titulo_anuncio');
            $table->text('descricao_anuncio')->nullable();

            // Valores
            $table->decimal('valor_total', 10, 2);
            $table->decimal('taxa_cadastro', 10, 2)->default(0);
            $table->decimal('valor_liquido', 10, 2)->storedAs('valor_total - taxa_cadastro');

            // Datas
            $table->date('data_inicio');
            $table->date('data_fim');

            // Pagamento
            $table->string('modo_pagamento')->default('parcelado')->comment('direto, parcelado');
            $table->unsignedTinyInteger('num_parcelas')->default(1);
            $table->date('data_primeira_parcela');
            $table->string('payment_method')->default('pix')->comment('pix, boleto, cartao, dinheiro');

            // Observações
            $table->text('observacoes_anuncio')->nullable();
            $table->text('observacoes_financeiro')->nullable();

            // Status e assinatura
            $table->string('status')->default('rascunho')
                ->comment('rascunho, aguardando_assinatura, assinado, cancelado');
            $table->string('magic_link_token', 100)->nullable()->unique();
            $table->timestamp('assinado_em')->nullable();
            $table->string('assinatura_ip', 45)->nullable();
            $table->text('assinatura_base64')->nullable()->comment('Imagem base64 da assinatura manual');

            // PDF
            $table->string('pdf_path')->nullable()->comment('Caminho do PDF no storage');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('autorizacoes');
    }
};
