<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Cliente;
use Illuminate\Support\Facades\DB;

class ResyncAllLegacyCities extends Command
{
    protected $signature = 'data:resync-legacy-cities';
    protected $description = 'Sincroniza corretamente as cidades atendidas a partir do banco legado, corrigindo o erro de mapeamento inicial, sem sobrescrever edições manuais feitas no painel novo.';

    public function handle()
    {
        $this->info('Lendo endereços e endereços_bairros do banco legado...');
        
        $enderecosBairrosMap = DB::connection('legacy')->table('enderecos_bairros')->get()->keyBy('id');
        $enderecosMap = DB::connection('legacy')->table('enderecos')->get()->keyBy('id');

        $this->info('Processando clientes do banco legado...');
        $legacyClientes = DB::connection('legacy')->table('clientes')
            ->select('pj_nome_fantasia', 'id_endereco')
            ->whereNotNull('pj_nome_fantasia')
            ->where('pj_nome_fantasia', '!=', '')
            ->get();

        // Agrupar as cidades verdadeiras por nome fantasia
        $citiesByNomeFantasia = [];

        foreach ($legacyClientes as $lf) {
            if ($lf->id_endereco) {
                $leb = $enderecosBairrosMap[$lf->id_endereco] ?? null;
                if ($leb) {
                    $legacyEnd = $enderecosMap[$leb->id_endereco] ?? null;
                    if ($legacyEnd && $legacyEnd->id_cidade) {
                        $nome = trim($lf->pj_nome_fantasia);
                        if (!isset($citiesByNomeFantasia[$nome])) {
                            $citiesByNomeFantasia[$nome] = [];
                        }
                        $citiesByNomeFantasia[$nome][] = $legacyEnd->id_cidade;
                    }
                }
            }
        }

        $this->info('Sincronizando cidades no banco de dados novo...');
        $clientesNovos = Cliente::select('id', 'nome_fantasia')->get();
        $bar = $this->output->createProgressBar($clientesNovos->count());

        $corrigidos = 0;
        $ignoradosManual = 0;

        foreach ($clientesNovos as $cliente) {
            $nome = trim($cliente->nome_fantasia);
            
            if (isset($citiesByNomeFantasia[$nome])) {
                $cidadesLegadas = array_unique($citiesByNomeFantasia[$nome]);

                // Verifica se o usuário já editou as cidades no painel novo
                $hasManualEdit = DB::table('audit_logs')
                    ->where('cliente_id', $cliente->id)
                    ->where('action', 'like', '%cidades%')
                    ->exists();

                if ($hasManualEdit) {
                    $ignoradosManual++;
                } else {
                    $cidadesAtuais = DB::table('cliente_cidade')
                        ->where('cliente_id', $cliente->id)
                        ->pluck('cidade_id')
                        ->toArray();

                    sort($cidadesLegadas);
                    sort($cidadesAtuais);

                    if ($cidadesLegadas !== $cidadesAtuais) {
                        $cliente->cidadesAtendidas()->sync($cidadesLegadas);
                        $corrigidos++;
                    }
                }
            }
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info("Concluído! $corrigidos clientes tiveram suas cidades corrigidas.");
        if ($ignoradosManual > 0) {
            $this->warn("$ignoradosManual clientes foram ignorados porque o usuário já havia editado as cidades manualmente.");
        }
    }
}
