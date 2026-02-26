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
        // Tabela de Segmentos
        if (!Schema::hasTable('segmentos')) {
            Schema::create('segmentos', function (Blueprint $table) {
                $table->id();
                $table->string('nome');
                $table->timestamps();
            });
        }

        // Tabela de Endereços
        if (!Schema::hasTable('enderecos')) {
            Schema::create('enderecos', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('cliente_id')->index();
                $table->string('cep')->nullable();
                $table->string('estado')->nullable();
                $table->string('cidade')->nullable();
                $table->string('bairro')->nullable();
                $table->string('rua')->nullable();
                $table->string('numero')->nullable();
                $table->string('complemento')->nullable();
                $table->string('caixa_postal')->nullable();
                $table->string('link_maps', 500)->nullable();
                $table->string('link_waze', 500)->nullable();
                $table->text('iframe_maps')->nullable();
                $table->timestamps();

                $table->foreign('cliente_id')->references('id')->on('clientes')->onDelete('cascade');
            });
        }

        // Tabela de Contatos
        if (!Schema::hasTable('contatos')) {
            Schema::create('contatos', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('cliente_id')->index();
                $table->string('telefone_principal', 50)->nullable();
                $table->string('telefone_secundario', 50)->nullable();
                $table->string('celular', 50)->nullable();
                $table->boolean('exibir_email')->default(true);
                $table->string('email_principal')->nullable();
                $table->string('email_cobranca')->nullable();
                $table->string('site')->nullable();
                $table->string('nome_contato')->nullable();
                $table->timestamps();

                $table->foreign('cliente_id')->references('id')->on('clientes')->onDelete('cascade');
            });
        }

        // Tabela de Redes Sociais
        if (!Schema::hasTable('redes_sociais')) {
            Schema::create('redes_sociais', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('cliente_id')->index();
                $table->string('tipo'); // instagram, facebook, etc
                $table->string('url', 500)->nullable();
                $table->timestamps();

                $table->foreign('cliente_id')->references('id')->on('clientes')->onDelete('cascade');
            });
        }

        // Tabela Pivot Cliente-Segmento
        if (!Schema::hasTable('cliente_segmento')) {
            Schema::create('cliente_segmento', function (Blueprint $table) {
                $table->unsignedBigInteger('cliente_id');
                $table->unsignedBigInteger('segmento_id');
                $table->foreign('cliente_id')->references('id')->on('clientes')->onDelete('cascade');
                $table->foreign('segmento_id')->references('id')->on('segmentos')->onDelete('cascade');
                $table->primary(['cliente_id', 'segmento_id']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cliente_segmento');
        Schema::dropIfExists('contatos');
        Schema::dropIfExists('enderecos');
        Schema::dropIfExists('segmentos');
    }
};
