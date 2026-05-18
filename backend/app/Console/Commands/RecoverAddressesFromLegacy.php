<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Cliente;
use App\Models\Endereco;
use Illuminate\Support\Facades\DB;

class RecoverAddressesFromLegacy extends Command
{
    protected $signature = 'data:recover-addresses';
    protected $description = 'Recupera os endereços de todos os clientes baseados no banco legado.';

    public function handle()
    {
        $this->info('Iniciando recuperação de endereços para todos os clientes...');

        // Vamos buscar todos os clientes na base atual
        // Processaremos em lotes para não estourar memória
        $totalClientes = Cliente::count();
        $bar = $this->output->createProgressBar($totalClientes);

        // Pre-carregar dados auxiliares do legado para mapeamento
        $cidades = DB::connection('legacy')->table('cidades')->pluck('cidade', 'id')->toArray();
        $bairros = DB::connection('legacy')->table('bairros')->pluck('bairro', 'id')->toArray();
        $enderecoBairroMap = DB::connection('legacy')->table('enderecos_bairros')->pluck('id_bairro', 'id_endereco')->toArray();

        $recoveredCount = 0;

        Cliente::chunkById(500, function ($clientes) use ($bar, $cidades, $bairros, $enderecoBairroMap, &$recoveredCount) {
            
            // Buscar os id_endereco no banco legado para este lote de clientes
            $legacyClientes = DB::connection('legacy')->table('clientes')
                ->whereIn('id', $clientes->pluck('id')->toArray())
                ->get()
                ->keyBy('id');

            // Coletar todos os id_endereco necessários para este lote
            $idEnderecosNeeded = [];
            foreach ($clientes as $cliente) {
                if (isset($legacyClientes[$cliente->id]) && $legacyClientes[$cliente->id]->id_endereco) {
                    $idEnderecosNeeded[] = $legacyClientes[$cliente->id]->id_endereco;
                }
            }

            // Buscar os endereços reais no banco legado
            $legacyEnderecos = [];
            if (!empty($idEnderecosNeeded)) {
                $legacyEnderecos = DB::connection('legacy')->table('enderecos')
                    ->whereIn('id', array_unique($idEnderecosNeeded))
                    ->get()
                    ->keyBy('id');
            }

            // Preparar array de inserts
            $inserts = [];

            foreach ($clientes as $cliente) {
                // Verificar se o cliente já tem endereço
                $hasEndereco = Endereco::where('cliente_id', $cliente->id)->exists();
                if ($hasEndereco) {
                    $bar->advance();
                    continue;
                }

                $lc = $legacyClientes[$cliente->id] ?? null;
                if ($lc && $lc->id_endereco && isset($legacyEnderecos[$lc->id_endereco])) {
                    $le = $legacyEnderecos[$lc->id_endereco];
                    $nomeCidade = $cidades[$le->id_cidade] ?? null;
                    
                    $idBairro = $enderecoBairroMap[$le->id] ?? null;
                    $nomeBairro = $bairros[$idBairro] ?? null;

                    $inserts[] = [
                        'cliente_id' => $cliente->id,
                        'rua' => $le->endereco ?: '',
                        'numero' => $lc->numero ?: '',
                        'complemento' => $lc->complemento ?: '',
                        'bairro' => $nomeBairro ?: '',
                        'cidade' => $nomeCidade ?: '',
                        'estado' => 'RS',
                        'cep' => $le->cep,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                    $recoveredCount++;
                }

                $bar->advance();
            }

            // Inserir os endereços recuperados
            if (!empty($inserts)) {
                Endereco::insert($inserts);
            }
        });

        $bar->finish();
        $this->newLine();
        $this->info("Recuperação concluída! $recoveredCount endereços foram reestabelecidos com sucesso.");
    }
}
