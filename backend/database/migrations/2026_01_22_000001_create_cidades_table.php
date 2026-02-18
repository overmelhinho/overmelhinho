<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('cidades', function (Blueprint $table) {
            $table->id();
            $table->string('nome');
            $table->string('uf', 2)->nullable();
            $table->timestamps();

            $table->index('nome');
            $table->index('uf');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cidades');
    }
};
