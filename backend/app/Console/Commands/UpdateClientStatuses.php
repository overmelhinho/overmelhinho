<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Cliente;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class UpdateClientStatuses extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:update-client-statuses';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Atualiza o status de assinatura dos clientes com base na vigência de seus contratos/autorizações';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $today = Carbon::today()->format('Y-m-d');
        
        $this->info("Iniciando verificação de vigência de autorizações ({$today})...");
        Log::info("Iniciando verificação de vigência de autorizações ({$today})...");

        // 1. Encontrar todos os clientes pagantes que estão ativos ou pendentes
        $clientesPagantes = Cliente::where('tipo_cliente', 'pagante')
            ->whereIn('status_assinatura', ['ativa', 'ativo', 'pendente', 'premium'])
            ->get();
            
        $atualizadosParaVencido = 0;
        $atualizadosParaAtivo = 0;

        foreach ($clientesPagantes as $cliente) {
            // Verifica se possui pelo menos UMA autorização vigente e assinada
            // Ou seja, status = 'assinado' E data_fim >= hoje
            $temVigente = DB::table('autorizacoes')
                ->where('cliente_id', $cliente->id)
                ->where('status', 'assinado')
                ->where('data_fim', '>=', $today)
                ->exists();

            if (!$temVigente) {
                // Não tem contrato vigente -> status deve ser 'vencida'
                $oldStatus = $cliente->status_assinatura;
                $cliente->status_assinatura = 'vencida';
                $cliente->save();
                
                $atualizadosParaVencido++;
                $this->warn("Cliente ID {$cliente->id} ({$cliente->nome_fantasia}): {$oldStatus} -> vencida (Sem contrato vigente)");
            } else {
                // Tem contrato vigente -> garantir que status seja 'ativa'
                if (!in_array($cliente->status_assinatura, ['ativa', 'ativo'])) {
                    $oldStatus = $cliente->status_assinatura;
                    $cliente->status_assinatura = 'ativa';
                    $cliente->save();
                    
                    $atualizadosParaAtivo++;
                    $this->info("Cliente ID {$cliente->id} ({$cliente->nome_fantasia}): {$oldStatus} -> ativa (Contrato vigente encontrado)");
                }
            }
        }
        
        $this->info("Processo concluído!");
        $this->line("Clientes marcados como VENCIDA: {$atualizadosParaVencido}");
        $this->line("Clientes reativados: {$atualizadosParaAtivo}");
        
        Log::info("Verificação de contratos concluída. Vencidos: {$atualizadosParaVencido}. Reativados: {$atualizadosParaAtivo}");
    }
}
