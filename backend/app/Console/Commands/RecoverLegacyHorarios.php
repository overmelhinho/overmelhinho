<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\Cliente;

class RecoverLegacyHorarios extends Command
{
    protected $signature = 'data:recover-legacy-horarios';
    protected $description = 'Recupera o campo pj_horario_atendimento do banco legado e salva em legacy_horario no banco atual.';

    public function handle()
    {
        $this->info('Iniciando recuperação de horários legados...');

        $lastId = 0;
        $total = DB::connection('legacy')->table('clientes')->count();
        $this->info("Total de clientes no legado: $total");
        
        if ($total === 0) return;

        $bar = $this->output->createProgressBar($total);

        DB::connection('legacy')->table('clientes')->orderBy('id')->chunk(500, function ($clientes) use ($bar) {
            foreach ($clientes as $lc) {
                if (!empty($lc->pj_horario_atendimento)) {
                    Cliente::withoutEvents(function() use ($lc) {
                        Cliente::where('id', $lc->id)->update([
                            'legacy_horario' => $lc->pj_horario_atendimento
                        ]);
                    });
                }
                $bar->advance();
            }
        });

        $bar->finish();
        $this->newLine();
        $this->info('Recuperação de horários finalizada com sucesso!');
    }
}
