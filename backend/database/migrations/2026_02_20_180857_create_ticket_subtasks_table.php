<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration 
{
    public function up(): void
    {
        Schema::create('ticket_subtasks', function (Blueprint $blueprint) {
            $blueprint->id();
            $blueprint->foreignId('ticket_id')->constrained('tickets')->onDelete('cascade');
            $blueprint->string('title');
            $blueprint->boolean('is_completed')->default(false);
            $blueprint->timestamp('completed_at')->nullable();
            $blueprint->foreignId('completed_by')->nullable()->constrained('users');
            $blueprint->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ticket_subtasks');
    }
};
