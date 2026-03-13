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
        Schema::create('radar_oportunidades', function (Blueprint $table) {
            $table->id();
            $table->string('termo');
            $table->string('cidade');
            $table->string('status')->default('pendente'); // pendente, prospectado
            $table->timestamp('prospectado_em')->nullable();
            $table->unsignedBigInteger('user_id')->nullable(); // Vendedor que prospectou
            $table->timestamps();

            $table->unique(['termo', 'cidade']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('radar_oportunidades');
    }
};
