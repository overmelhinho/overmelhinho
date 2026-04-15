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
        Schema::create('campanha_interacoes', function (Blueprint $table) {
            $table->id();
            $table->integer('campanha_id')->index();
            $table->integer('cliente_id')->nullable()->index();
            $table->enum('type', ['view', 'click'])->default('view');
            $table->string('placement')->nullable()->index(); // HOME_TOP, SEARCH_RESULT, etc.
            $table->string('ip_address')->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('campanha_interacoes');
    }
};
