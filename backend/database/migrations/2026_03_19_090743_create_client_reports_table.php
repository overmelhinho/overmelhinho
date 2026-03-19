<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('client_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cliente_id')->constrained('clientes')->cascadeOnDelete();
            $table->foreignId('generated_by')->nullable()->constrained('users')->nullOnDelete();

            // Identificação única para o link público
            $table->string('token', 64)->unique();

            // Período em texto legível
            $table->string('period_label')->default('Últimos 30 dias');
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();

            // Dados auto-coletados + overrides manuais (JSON)
            $table->jsonb('data'); // Contém todos os KPIs e breakdown por cidade

            // Mensagem personalizada para o cliente
            $table->text('notes')->nullable();

            // Status do relatório
            $table->enum('status', ['draft', 'sent', 'viewed'])->default('draft');

            // Quando o cliente abriu o link
            $table->timestamp('viewed_at')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('client_reports');
    }
};
