<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('cliente_cidade', function (Blueprint $table) {
            $table->id();

            $table->foreignId('cliente_id')
                ->constrained('clientes')
                ->cascadeOnDelete();

            $table->foreignId('cidade_id')
                ->constrained('cidades')
                ->cascadeOnDelete();

            $table->timestamps();

            $table->unique(['cliente_id', 'cidade_id']);
            $table->index('cliente_id');
            $table->index('cidade_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cliente_cidade');
    }
};
