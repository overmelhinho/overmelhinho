<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('ticket_logs')) {
            return;
        }

        Schema::create('ticket_logs', function (Blueprint $table) {
            $table->bigIncrements('id');

            $table->unsignedBigInteger('ticket_id');
            $table->unsignedBigInteger('user_id')->nullable();

            $table->string('action', 50);
            $table->text('message')->nullable();

            $table->timestamps();

            $table->foreign('ticket_id')->references('id')->on('tickets')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();

            $table->index(['ticket_id', 'created_at']);
            $table->index(['action']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ticket_logs');
    }
};
