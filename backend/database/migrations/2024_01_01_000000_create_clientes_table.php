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
        if (!Schema::hasTable('clientes')) {
            Schema::create('clientes', function (Blueprint $table) {
                $table->id();
                $table->string('nome_fantasia')->nullable();
                $table->string('razao_social')->nullable();
                $table->string('nome_alternativo')->nullable();
                $table->string('cpf_cnpj')->nullable();
                $table->string('inscricao_estadual')->nullable();
                $table->string('inscricao_municipal')->nullable();
                $table->string('registro_profissional')->nullable();
                $table->text('descricao')->nullable();
                $table->text('observacoes')->nullable();
                $table->string('video')->nullable();
                $table->string('portfolio_url')->nullable();
                $table->string('logo_url')->nullable();
                $table->boolean('possui_publicidade')->default(false)->nullable();
                $table->timestamps(); // created_at, updated_at

                // Campos que sofreram alteração em migrations futuras (mas precisam existir aqui)
                $table->text('seo_keywords')->nullable(); // Será convertido para jsonb em outra migration
                $table->string('seo_keywords_source')->nullable();
                $table->timestamp('seo_keywords_updated_at')->nullable();
                $table->string('status_assinatura')->nullable();
                $table->string('tipo_cliente')->nullable();
                $table->json('horario_atendimento')->nullable();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('clientes');
    }
};
