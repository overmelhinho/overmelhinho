<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('tickets', function (Blueprint $table) {

            // ✅ responsável
            if (!Schema::hasColumn('tickets', 'assignee_id')) {
                $table->unsignedBigInteger('assignee_id')->nullable()->after('created_by');
                $table->foreign('assignee_id')->references('id')->on('users')->nullOnDelete();
                $table->index(['assignee_id']);
            }

            // ✅ tipo/subtipo
            if (!Schema::hasColumn('tickets', 'tipo')) {
                $table->string('tipo', 50)->nullable()->after('setor');
                $table->index(['tipo']);
            }

            // ✅ prazos e fechamento
            if (!Schema::hasColumn('tickets', 'due_at')) {
                $table->timestamp('due_at')->nullable()->after('prioridade');
                $table->index(['due_at']);
            }

            if (!Schema::hasColumn('tickets', 'resolved_at')) {
                $table->timestamp('resolved_at')->nullable()->after('due_at');
            }

            if (!Schema::hasColumn('tickets', 'closed_at')) {
                $table->timestamp('closed_at')->nullable()->after('resolved_at');
            }

            // ✅ meta (json)
            if (!Schema::hasColumn('tickets', 'meta')) {
                // postgres: jsonb é ideal, mas json funciona e não quebra
                $table->json('meta')->nullable()->after('descricao');
            }
        });
    }

    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {

            // down com cuidado (só remove se existir)
            if (Schema::hasColumn('tickets', 'meta')) {
                $table->dropColumn('meta');
            }

            if (Schema::hasColumn('tickets', 'closed_at')) {
                $table->dropColumn('closed_at');
            }

            if (Schema::hasColumn('tickets', 'resolved_at')) {
                $table->dropColumn('resolved_at');
            }

            if (Schema::hasColumn('tickets', 'due_at')) {
                $table->dropColumn('due_at');
            }

            if (Schema::hasColumn('tickets', 'tipo')) {
                $table->dropColumn('tipo');
            }

            if (Schema::hasColumn('tickets', 'assignee_id')) {
                // remover FK antes
                try { $table->dropForeign(['assignee_id']); } catch (\Throwable $e) {}
                try { $table->dropIndex(['assignee_id']); } catch (\Throwable $e) {}
                $table->dropColumn('assignee_id');
            }
        });
    }
};
