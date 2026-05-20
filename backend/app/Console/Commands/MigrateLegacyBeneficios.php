<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\Cliente;

class MigrateLegacyBeneficios extends Command
{
    protected $signature = 'migrate:legacy-beneficios';
    protected $description = 'Migrate legacy beneficios and payment methods to new JSON column';

    public function handle()
    {
        $this->info("Iniciando migracao de beneficios legados...");

        $total = DB::connection('legacy')->table('clientes')->count();
        $this->info("Total de clientes legados a processar: $total");

        if ($total === 0) return;

        $bar = $this->output->createProgressBar($total);
        $updated = 0;

        DB::connection('legacy')->table('clientes')->orderBy('id')->chunk(500, function ($clientes) use ($bar, &$updated) {
            foreach ($clientes as $lc) {
                $beneficios = [];

                if ($lc->pj_24hrs === 'Sim') $beneficios[] = '24h';
                if ($lc->pj_tele_entrega === 'Sim') $beneficios[] = 'tele_entrega';
                if ($lc->pj_aberto_meiodia === 'Sim') $beneficios[] = 'meio_dia';

                if (!empty(trim((string)$lc->pj_forma_pgto_credito))) $beneficios[] = 'credito';
                if (!empty(trim((string)$lc->pj_forma_pgto_debito))) $beneficios[] = 'debito';
                if (!empty(trim((string)$lc->pj_forma_pgto_pix))) $beneficios[] = 'pix';
                if (!empty(trim((string)$lc->pj_forma_pgto_boleto))) $beneficios[] = 'boleto';
                if (!empty(trim((string)$lc->pj_forma_pgto_dinheiro))) $beneficios[] = 'dinheiro';

                // Se tinha algum beneficio, atualizar no cliente
                if (!empty($beneficios)) {
                    // Update sem carregar model para ficar rapido
                    $affected = DB::table('clientes')
                                ->where('id', $lc->id)
                                ->update(['beneficios' => json_encode($beneficios)]);
                    
                    if ($affected) {
                        $updated++;
                    }
                }
                
                $bar->advance();
            }
        });

        $bar->finish();
        $this->newLine();
        $this->info("Migracao de beneficios concluida! $updated clientes atualizados.");
    }
}
