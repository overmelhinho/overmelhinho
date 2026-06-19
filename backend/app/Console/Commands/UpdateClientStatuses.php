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
        // Apenas promove se forem clientes pagantes inativos, ou se forem gratuitos que foram automaticamente cancelados.
        $reativadosCount = DB::table('clientes')
            ->where(function($q) {
                $q->where(function($sub) {
                    $sub->where('tipo_cliente', 'gratuito')
                        ->where('status_assinatura', 'cancelada');
                })
                ->orWhere(function($sub) {
                    $sub->where('tipo_cliente', 'pagante')
                        ->whereNotIn('status_assinatura', ['ativa', 'ativo', 'inadimplente']);
                });
            })
            ->whereExists(function ($query) use ($today) {
                $query->select(DB::raw(1))
                    ->from('autorizacoes')
                    ->whereColumn('autorizacoes.cliente_id', 'clientes.id')
                    ->where('autorizacoes.status', 'assinado')
                    ->where('autorizacoes.data_fim', '>=', $today);
            })
            ->update(['tipo_cliente' => 'pagante', 'status_assinatura' => 'ativa', 'updated_at' => now()]);

        $threeMonthsAgo = now()->subMonths(3)->format('Y-m-d');

        // 3. Identificar clientes inadimplentes (2+ parcelas vencidas ou 1 vencida há 3 meses ou mais)
        $inadimplentesClientIds = DB::table('invoices')
            ->select('client_id')
            ->where('status', 'pending')
            ->where('due_date', '<', $today)
            ->groupBy('client_id')
            ->havingRaw('COUNT(*) >= 2 OR MIN(due_date) <= ?', [$threeMonthsAgo])
            ->pluck('client_id')
            ->toArray();

        $inadimplentesCount = DB::table('clientes')
            ->whereIn('id', $inadimplentesClientIds)
            ->update(['status_assinatura' => 'inadimplente', 'updated_at' => now()]);

        // 4. Restaurar para ativa os inadimplentes que voltaram a ter menos de 2 parcelas vencidas
        $normalizadosCount = DB::table('clientes')
            ->where('tipo_cliente', 'pagante')
            ->where('status_assinatura', 'inadimplente')
            ->whereNotIn('id', $inadimplentesClientIds)
            ->whereExists(function ($query) use ($today) {
                $query->select(DB::raw(1))
                    ->from('autorizacoes')
                    ->whereColumn('autorizacoes.cliente_id', 'clientes.id')
                    ->where('autorizacoes.status', 'assinado')
                    ->where('autorizacoes.data_fim', '>=', $today);
            })
            ->update(['status_assinatura' => 'ativa', 'updated_at' => now()]);

        // 5. Restaurar para cancelada os inadimplentes gratuitos que pagaram suas dividas
        $normalizadosGratuitosCount = DB::table('clientes')
            ->where('tipo_cliente', 'gratuito')
            ->where('status_assinatura', 'inadimplente')
            ->whereNotIn('id', $inadimplentesClientIds)
            ->update(['status_assinatura' => 'cancelada', 'updated_at' => now()]);
        
        $this->info("Processo concluído!");
        $this->line("Clientes marcados como GRATUITO/CANCELADA (Sem autorização): {$vencidosCount}");
        $this->line("Clientes reativados como PAGANTE/ATIVA: {$reativadosCount}");
        $this->line("Clientes marcados como INADIMPLENTE (2+ parcelas vencidas): {$inadimplentesCount}");
        $this->line("Clientes inadimplentes normalizados para ATIVA: {$normalizadosCount}");
        
        Log::info("Verificação de contratos concluída. Vencidos: {$vencidosCount}. Reativados: {$reativadosCount}. Inadimplentes: {$inadimplentesCount}. Normalizados: {$normalizadosCount}");
    }
}
