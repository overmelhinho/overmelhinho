<?php
namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\Endereco;

class FixMigratedAddresses extends Command
{
    protected $signature = 'migrate:fix_addresses';
    protected $description = 'Corrige os enderecos migrados devido ao erro da tabela enderecos_bairros e campos corretos';

    public function handle()
    {
        $this->info('Lendo bairros, cidades e endereços_bairros...');
        $bairros = DB::connection('legacy')->table('bairros')->pluck('bairro', 'id')->toArray();
        $cidades = DB::connection('legacy')->table('cidades')->get()->keyBy('id');
        $enderecosBairrosMap = DB::connection('legacy')->table('enderecos_bairros')->get()->keyBy('id');
        
        $this->info('Lendo tabela enderecos real...');
        $enderecos = DB::connection('legacy')->table('enderecos')->get()->keyBy('id');

        // Carregar IDs de clientes existentes para evitar Foreign Key Violations
        $existingClients = DB::connection('pgsql')->table('clientes')->pluck('id', 'id')->toArray();

        $this->info('Fixando enderecos dos clientes...');
        $total = DB::connection('legacy')->table('clientes')->count();
        $bar = $this->output->createProgressBar($total);

        Endereco::flushEventListeners();

        DB::connection('legacy')->table('clientes')->orderBy('id')->chunk(500, function ($clientes) use ($bar, $bairros, $cidades, $enderecosBairrosMap, $enderecos, $existingClients) {
            foreach ($clientes as $lc) {
                if (!$lc->id_endereco || !isset($existingClients[$lc->id])) {
                    $bar->advance();
                    continue;
                }

                $leb = $enderecosBairrosMap[$lc->id_endereco] ?? null;
                if ($leb) {
                    $le = $enderecos[$leb->id_endereco] ?? null;
                    if ($le) {
                        $idBairro = $leb->id_bairro;
                        $nomeBairro = $bairros[$idBairro] ?? null;

                        $cidadeObj = $cidades[$le->id_cidade] ?? null;
                        $nomeCidade = $cidadeObj ? $cidadeObj->cidade : null;
                        $ufCidade = $cidadeObj ? $cidadeObj->uf : null;

                        Endereco::updateOrCreate(
                            ['cliente_id' => $lc->id],
                            [
                                'rua' => $le->endereco,
                                'numero' => $lc->numero,
                                'complemento' => $lc->complemento,
                                'bairro' => $nomeBairro,
                                'cidade' => $nomeCidade,
                                'estado' => $ufCidade,
                                'cep' => $le->cep,
                            ]
                        );
                    }
                }
                $bar->advance();
            }
        });

        $bar->finish();
        $this->newLine();
        $this->info('Correção de endereços concluída com campos rua e cidade corretos!');
    }
}
