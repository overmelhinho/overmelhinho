<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('campanhas', function (Blueprint $table) {
            $table->unsignedBigInteger('cliente_id')->nullable()->change();
            $table->date('data_inicio')->nullable()->change();
            $table->date('data_fim')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('campanhas', function (Blueprint $table) {
            $table->unsignedBigInteger('cliente_id')->nullable(false)->change();
            $table->date('data_inicio')->nullable(false)->change();
            $table->date('data_fim')->nullable(false)->change();
        });
    }
};
