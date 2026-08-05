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
        Schema::create('seo_insights', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cliente_id')->constrained('clientes')->onDelete('cascade');
            $table->string('keyword');
            $table->string('url')->nullable();
            $table->string('insight_type'); // 'low_ctr', 'page_2', 'drop'
            $table->integer('position');
            $table->integer('impressions');
            $table->integer('clicks');
            $table->decimal('ctr', 5, 2)->default(0);
            $table->string('status')->default('pending'); // 'pending', 'applied', 'ignored'
            $table->timestamps();
            
            // Índices para otimização das buscas no painel
            $table->index(['cliente_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('seo_insights');
    }
};
