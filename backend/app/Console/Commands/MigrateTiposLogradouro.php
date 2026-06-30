<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\Endereco;

class MigrateTiposLogradouro extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'migrate:tipos_logradouro';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Migra os tipos de logradouro do banco legado para o novo banco de dados';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Iniciando migracao de tipos de logradouro...');

        // 1. Pegar todos os endereços do novo BD
        $enderecos = Endereco::whereNull('tipo_logradouro')->get();
        $this->info('Encontrados ' . $enderecos->count() . ' enderecos para avaliar.');

        // 2. Cachear logradouros antigos
        $this->info('Baixando dados do banco legado (isso pode levar alguns segundos)...');
        $logradourosLegado = DB::connection('legacy')->table('logradouros')->pluck('logradouro', 'id')->toArray();
        $enderecosLegado = DB::connection('legacy')->table('enderecos')->get()->keyBy('id');
        $enderecosBairrosLegado = DB::connection('legacy')->table('enderecos_bairros')->get()->keyBy('id');
        $clientesLegado = DB::connection('legacy')->table('clientes')->select('id', 'id_endereco')->get()->keyBy('id');
        $this->info('Dados do legado cacheados com sucesso!');

        $atualizados = 0;
        $bar = $this->output->createProgressBar($enderecos->count());

        foreach ($enderecos as $end) {
            $cliente_id = $end->cliente_id;
            $clienteLegado = $clientesLegado[$cliente_id] ?? null;

            if ($clienteLegado && $clienteLegado->id_endereco) {
                $endBairro = $enderecosBairrosLegado[$clienteLegado->id_endereco] ?? null;
                
                if ($endBairro && $endBairro->id_endereco) {
                    $endLegado = $enderecosLegado[$endBairro->id_endereco] ?? null;

                    if ($endLegado && $endLegado->id_logradouro) {
                        $tipo = $logradourosLegado[$endLegado->id_logradouro] ?? null;
                        
                        if ($tipo && trim($tipo) !== '') {
                            $end->tipo_logradouro = trim($tipo);
                            $end->save();
                            $atualizados++;
                        }
                    }
                }
            }
            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);
        $this->info("Pronto! $atualizados enderecos foram atualizados com o tipo de logradouro antigo.");
    }
}
