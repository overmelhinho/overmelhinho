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
        Schema::create('radar_alvos_prospectados', function (Blueprint $table) {
            $table->id();
            $table->string('place_id')->index();
            $table->string('nome_empresa');
            $table->string('termo');
            $table->string('cidade');
            $table->unsignedBigInteger('user_id')->nullable();
            $table->timestamps();

            $table->unique(['place_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('radar_alvos_prospectados');
    }
};
