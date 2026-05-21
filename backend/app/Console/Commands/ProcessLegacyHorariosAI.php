<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Cliente;
use App\Services\ClientAiService;
use Illuminate\Support\Facades\Log;

class ProcessLegacyHorariosAI extends Command
{
    protected $signature = 'data:process-legacy-horarios-ai {--limit=0 : Limite de registros a processar (0 para todos)}';
    protected $description = 'Processa a coluna legacy_horario usando a OpenAI para gerar a estrutura JSON em horario_atendimento.';

    public function handle(ClientAiService $aiService)
    {
        $this->info('Iniciando processamento em lote via OpenAI...');

        $query = Cliente::whereNotNull('legacy_horario')
            ->where('legacy_horario', '!=', '');

        $limit = (int) $this->option('limit');
        if ($limit > 0) {
            $query->limit($limit);
        }

        $total = $query->count();
        $this->info("Total de clientes pendentes para conversão com IA: {$total}");

        if ($total === 0) {
            return;
        }

        $bar = $this->output->createProgressBar($total);

        // Utilizamos cursor para economizar memória em tabelas grandes
        foreach ($query->cursor() as $cliente) {
            try {
                $horarios = $aiService->parseLegacyHorario($cliente->legacy_horario);

                if (!empty($horarios)) {
                    // Desabilitar eventos para não triggar auditoria pesada no processamento em lote
                    Cliente::withoutEvents(function () use ($cliente, $horarios) {
                        $cliente->update(['horario_atendimento' => $horarios]);
                    });
                } else {
                    Log::warning("[ProcessLegacyHorariosAI] IA retornou vazio para Cliente ID: {$cliente->id}");
                }

                // Pequeno sleep para evitar Rate Limits agressivos da OpenAI
                usleep(200000); // 200ms

            } catch (\Exception $e) {
                Log::error("[ProcessLegacyHorariosAI] Falha no Cliente ID {$cliente->id}: " . $e->getMessage());
                // Se for Rate Limit (429), pausar mais tempo
                if (str_contains($e->getMessage(), '429')) {
                    $this->warn("\nRate limit atingido. Pausando por 10 segundos...");
                    sleep(10);
                }
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info('Processamento via IA finalizado!');
    }
}
