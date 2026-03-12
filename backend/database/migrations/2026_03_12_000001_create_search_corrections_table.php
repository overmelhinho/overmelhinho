<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('search_corrections', function (Blueprint $blueprint) {
            $blueprint->id();
            $blueprint->string('typo')->index();
            $blueprint->string('correction')->index();
            $blueprint->integer('hit_count')->default(1);
            $blueprint->boolean('is_verified')->default(false);
            $blueprint->timestamps();

            $blueprint->unique(['typo', 'correction']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('search_corrections');
    }
};
