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
        if (!Schema::hasTable('campanhas')) {
            Schema::create('campanhas', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('cliente_id');
                $table->string('nome');
                $table->string('tipo');
                $table->string('origem')->nullable();
                $table->string('status')->default('pendente');
                $table->date('data_inicio');
                $table->date('data_fim');
                $table->text('placements_json')->nullable();
                $table->text('placements')->nullable();
                $table->unsignedBigInteger('created_by')->nullable();
                $table->unsignedBigInteger('updated_by')->nullable();
                $table->decimal('valor_total', 12, 2)->default(0);
                $table->timestamps();

                $table->foreign('cliente_id')->references('id')->on('clientes')->onDelete('cascade');
                $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
                $table->foreign('updated_by')->references('id')->on('users')->onDelete('set null');
            });
        }

        if (!Schema::hasTable('campanha_financeiro')) {
            Schema::create('campanha_financeiro', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('campanha_id');
                $table->string('status');
                $table->string('forma')->nullable();
                $table->decimal('valor', 12, 2)->default(0);
                $table->date('vencimento')->nullable();
                $table->timestamp('pago_em')->nullable();
                $table->text('observacao')->nullable();
                $table->unsignedBigInteger('created_by')->nullable();
                $table->timestamps();

                $table->foreign('campanha_id')->references('id')->on('campanhas')->onDelete('cascade');
                $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
            });
        }

        if (!Schema::hasTable('campanha_midias')) {
            Schema::create('campanha_midias', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('campanha_id');
                $table->string('tipo');
                $table->integer('versao')->default(1);
                $table->string('status');
                $table->string('desktop_url', 1000)->nullable();
                $table->string('mobile_url', 1000)->nullable();
                $table->text('meta_json')->nullable();
                $table->unsignedBigInteger('created_by')->nullable();
                $table->unsignedBigInteger('approved_by')->nullable();
                $table->timestamps();

                $table->foreign('campanha_id')->references('id')->on('campanhas')->onDelete('cascade');
                $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
                $table->foreign('approved_by')->references('id')->on('users')->onDelete('set null');
            });
        }

        if (!Schema::hasTable('campanha_cidades')) {
            Schema::create('campanha_cidades', function (Blueprint $table) {
                $table->unsignedBigInteger('campanha_id');
                $table->unsignedBigInteger('cidade_id');
                $table->timestamps();

                $table->primary(['campanha_id', 'cidade_id']);
                $table->foreign('campanha_id')->references('id')->on('campanhas')->onDelete('cascade');
                $table->foreign('cidade_id')->references('id')->on('cidades')->onDelete('cascade');
            });
        }

        if (!Schema::hasTable('campanha_segmentos')) {
            Schema::create('campanha_segmentos', function (Blueprint $table) {
                $table->unsignedBigInteger('campanha_id');
                $table->unsignedBigInteger('segmento_id');
                $table->timestamps();

                $table->primary(['campanha_id', 'segmento_id']);
                $table->foreign('campanha_id')->references('id')->on('campanhas')->onDelete('cascade');
                $table->foreign('segmento_id')->references('id')->on('segmentos')->onDelete('cascade');
            });
        }

        if (!Schema::hasTable('campanha_keywords')) {
            Schema::create('campanha_keywords', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('campanha_id');
                $table->string('keyword_original');
                $table->string('keyword_normalizada');
                $table->timestamps();

                $table->foreign('campanha_id')->references('id')->on('campanhas')->onDelete('cascade');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('campanha_keywords');
        Schema::dropIfExists('campanha_segmentos');
        Schema::dropIfExists('campanha_cidades');
        Schema::dropIfExists('campanha_midias');
        Schema::dropIfExists('campanha_financeiro');
        Schema::dropIfExists('campanhas');
    }
};
