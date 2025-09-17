<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('oportunidades', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('lead_id')->nullable();     // Vincula ao lead original
            $table->unsignedBigInteger('cliente_id')->nullable();  // Opcional: se já convertido em cliente
            $table->string('nome');                                // Nome resumido da oportunidade
            $table->string('etapa')->default('novo');              // Ex: novo, contato, proposta, negociacao, ganho, perdido
            $table->decimal('valor_estimado', 12, 2)->nullable();
            $table->string('responsavel')->nullable();             // Ou user_id se for multiusuário
            $table->date('previsao_fechamento')->nullable();
            $table->text('observacoes')->nullable();
            $table->string('origem')->nullable();                  // Ex: site, indicação, evento...
            $table->string('status')->default('aberta');           // aberta, ganha, perdida
            $table->timestamps();

            $table->foreign('lead_id')->references('id')->on('leads')->onDelete('set null');
            $table->foreign('cliente_id')->references('id')->on('clientes')->onDelete('set null');
        });
    }

    public function down()
    {
        Schema::dropIfExists('oportunidades');
    }
};
