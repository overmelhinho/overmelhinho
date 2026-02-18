<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // Se você já rodou o SQL no Supabase, a tabela já existe.
        // Essa migration só cria se não existir, mantendo o projeto consistente.
        if (!Schema::hasTable('audit_logs')) {
            Schema::create('audit_logs', function (Blueprint $table) {
                $table->bigIncrements('id');

                $table->unsignedBigInteger('actor_user_id');
                $table->string('action');       // create | update | delete | status_change | publish | convert | upload | etc.
                $table->string('entity_type');  // cliente | lead | banner | etc.
                $table->unsignedBigInteger('entity_id');

                $table->unsignedBigInteger('cliente_id')->nullable();
                $table->unsignedBigInteger('lead_id')->nullable();

                $table->jsonb('field_changes')->nullable();
                $table->jsonb('metadata')->nullable();

                $table->timestampTz('created_at')->useCurrent();
            });

            // Índices (mesmo do SQL que você rodou)
            DB::statement("CREATE INDEX IF NOT EXISTS idx_audit_cliente_created_at ON audit_logs (cliente_id, created_at DESC) WHERE cliente_id IS NOT NULL");
            DB::statement("CREATE INDEX IF NOT EXISTS idx_audit_lead_created_at ON audit_logs (lead_id, created_at DESC) WHERE lead_id IS NOT NULL");
            DB::statement("CREATE INDEX IF NOT EXISTS idx_audit_entity_created_at ON audit_logs (entity_type, entity_id, created_at DESC)");
            DB::statement("CREATE INDEX IF NOT EXISTS idx_audit_actor_created_at ON audit_logs (actor_user_id, created_at DESC)");
            DB::statement("CREATE INDEX IF NOT EXISTS idx_audit_action_created_at ON audit_logs (action, created_at DESC)");
            DB::statement("CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs (created_at DESC)");
        }

        // Você disse que os dados antigos são descartáveis:
        if (Schema::hasTable('historico_alteracoes')) {
            Schema::drop('historico_alteracoes');
        }
    }

    public function down(): void
    {
        // Não recrio historico_alteracoes no down porque você declarou descartável.
        Schema::dropIfExists('audit_logs');
    }
};
