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
        Schema::create('job_opportunities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('clientes')->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('salary_range')->nullable();
            $table->string('hiring_type')->nullable(); // CLT, PJ, Estágio
            $table->string('work_model')->nullable(); // Presencial, Híbrido, Remoto
            $table->string('city')->nullable();
            $table->string('status')->default('Draft'); // Draft, Published, Closed, Paused
            $table->boolean('is_active')->default(false); // Aprovação do Admin
            $table->integer('views_count')->default(0);
            $table->timestamp('published_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('job_opportunities');
    }
};
