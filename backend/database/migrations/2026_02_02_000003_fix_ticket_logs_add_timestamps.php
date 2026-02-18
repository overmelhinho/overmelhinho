<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('ticket_logs', function (Blueprint $table) {

            // Se a tabela foi criada manualmente/antiga e não tem timestamps,
            // adicionamos sem quebrar dados existentes.

            if (!Schema::hasColumn('ticket_logs', 'created_at')) {
                $table->timestamp('created_at')->nullable();
            }

            if (!Schema::hasColumn('ticket_logs', 'updated_at')) {
                $table->timestamp('updated_at')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('ticket_logs', function (Blueprint $table) {
            if (Schema::hasColumn('ticket_logs', 'updated_at')) {
                $table->dropColumn('updated_at');
            }

            if (Schema::hasColumn('ticket_logs', 'created_at')) {
                $table->dropColumn('created_at');
            }
        });
    }
};
