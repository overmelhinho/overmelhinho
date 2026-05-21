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

        // 1. Rebaixar para 'gratuito' (e status 'cancelada') os clientes pagantes que NÃO possuem nenhuma autorização vigente
        $vencidosCount = DB::table('clientes')
            ->where('tipo_cliente', 'pagante')
            ->whereNotExists(function ($query) use ($today) {
                $query->select(DB::raw(1))
                    ->from('autorizacoes')
                    ->whereColumn('autorizacoes.cliente_id', 'clientes.id')
                    ->where('autorizacoes.status', 'assinado')
                    ->where('autorizacoes.data_fim', '>=', $today);
            })
            ->update(['tipo_cliente' => 'gratuito', 'status_assinatura' => 'cancelada', 'updated_at' => now()]);

        // 2. Promover para 'pagante' (e status 'ativa') os clientes que POSSUEM autorização vigente
        $reativadosCount = DB::table('clientes')
            ->where(function($q) {
                $q->where('tipo_cliente', '!=', 'pagante')
                  ->orWhereNotIn('status_assinatura', ['ativa', 'ativo']);
            })
            ->whereExists(function ($query) use ($today) {
                $query->select(DB::raw(1))
                    ->from('autorizacoes')
                    ->whereColumn('autorizacoes.cliente_id', 'clientes.id')
                    ->where('autorizacoes.status', 'assinado')
                    ->where('autorizacoes.data_fim', '>=', $today);
            })
            ->update(['tipo_cliente' => 'pagante', 'status_assinatura' => 'ativa', 'updated_at' => now()]);
        
        $this->info("Processo concluído!");
        $this->line("Clientes marcados como VENCIDA: {$vencidosCount}");
        $this->line("Clientes reativados: {$reativadosCount}");
        
        Log::info("Verificação de contratos concluída. Vencidos: {$vencidosCount}. Reativados: {$reativadosCount}");
    }
}
