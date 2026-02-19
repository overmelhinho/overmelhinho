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
        // Só cria se não existir (segurança para prod/dev onde já existe)
        if (!Schema::hasTable('galerias_imagens')) {
            Schema::create('galerias_imagens', function (Blueprint $table) {
                $table->id();
                $table->foreignId('cliente_id')->constrained('clientes')->onDelete('cascade');
                $table->string('url');
                $table->string('legenda')->nullable();
                $table->integer('ordem')->default(0);
                $table->timestamps(); // Cria created_at e updated_at
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('galerias_imagens');
    }
};
