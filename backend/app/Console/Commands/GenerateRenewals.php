<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

use App\Models\Cliente;
use App\Models\Renewal;
use App\Models\Ticket;
use Carbon\Carbon;
use Illuminate\Support\Str;

class GenerateRenewals extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'renewals:generate';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Gera automaticamente registros de renovação para clientes que vencem no mês seguinte';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Iniciando geração de renovações...');

        $nextMonthStart = Carbon::now()->addMonth()->startOfMonth();
        $nextMonthEnd = Carbon::now()->addMonth()->endOfMonth();

        $clientes = Cliente::whereBetween('contract_ends_at', [$nextMonthStart, $nextMonthEnd])->get();

        if ($clientes->isEmpty()) {
            $this->info('Nenhum cliente com vencimento para o próximo mês.');
            return;
        }

        foreach ($clientes as $cliente) {
            // Verifica se já existe renovação pendente
            $exists = Renewal::where('cliente_id', $cliente->id)
                ->whereIn('status', ['pending', 'sent'])
                ->exists();

            if ($exists) {
                continue;
            }

            // Cria a renovação
            $renewal = Renewal::create([
                'cliente_id' => $cliente->id,
                'expiration_date' => $cliente->contract_ends_at,
                'status' => 'pending',
                'magic_link_token' => Str::random(64),
            ]);

            // Determina a prioridade do ticket
            $prioridade = 'baixa';
            if ($cliente->contact_preference === 'presential') {
                $prioridade = 'alta';
            } elseif (in_array($cliente->contact_preference, ['call', 'email'])) {
                $prioridade = 'media';
            }

            // Cria o ticket para o comercial
            Ticket::create([
                'cliente_id' => $cliente->id,
                'titulo' => "Renovação: {$cliente->nome_fantasia}",
                'descricao' => "O contrato do cliente {$cliente->nome_fantasia} vence em {$cliente->contract_ends_at->format('d/m/Y')}.\nPreferência: {$cliente->contact_preference} | Turno: {$cliente->best_contact_shift}.",
                'setor' => 'comercial',
                'prioridade' => $prioridade,
                'status' => 'aberto',
                'meta' => json_encode(['renewal_id' => $renewal->id]),
            ]);

            $this->info("Renovação e ticket gerados para o cliente: {$cliente->nome_fantasia}");
        }

        $this->info('Processamento concluído.');
    }
}
