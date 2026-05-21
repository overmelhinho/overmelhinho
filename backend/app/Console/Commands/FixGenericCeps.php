<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Endereco;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FixGenericCeps extends Command
{
    protected $signature = 'data:fix-generic-ceps 
                            {--cep=95180-000 : O CEP genérico que queremos substituir}
                            {--cidade=Farroupilha : O nome da cidade}
                            {--uf=RS : A UF da cidade}
                            {--limit=0 : Limite de registros (0 para todos)}';

    protected $description = 'Corrige CEPs genéricos de uma cidade usando a API do ViaCEP via busca por logradouro.';

    public function handle()
    {
        $cepGenerico = $this->option('cep');
        $cidadeNome = $this->option('cidade');
        $uf = $this->option('uf');
        $limit = (int) $this->option('limit');

        $this->info("Iniciando correção de CEPs genéricos ({$cepGenerico}) para a cidade {$cidadeNome} ({$uf})");

        $query = Endereco::where('cep', $cepGenerico)
            ->whereNotNull('rua')
            ->where('rua', '!=', '')
            ->where('cidade', $cidadeNome);

        if ($limit > 0) {
            $query->limit($limit);
        }

        $total = $query->count();
        $this->info("Encontrados {$total} endereços para verificação.");

        if ($total === 0) {
            return;
        }

        $bar = $this->output->createProgressBar($total);
        $corrigidos = 0;
        $falhas = 0;

        foreach ($query->cursor() as $endereco) {
            $ruaLimpa = $this->sanitizeStreetName($endereco->rua);

            if (strlen($ruaLimpa) < 3) {
                $falhas++;
                $bar->advance();
                continue;
            }

            try {
                // ViaCEP requer no mínimo 3 letras
                $url = "https://viacep.com.br/ws/{$uf}/" . rawurlencode($cidadeNome) . "/" . rawurlencode($ruaLimpa) . "/json/";
                $response = Http::timeout(10)->get($url);

                if ($response->successful()) {
                    $dados = $response->json();
                    
                    if (!is_array($dados) || empty($dados) || isset($dados['erro'])) {
                        $falhas++;
                    } else {
                        $novoCep = $this->resolveConflict($dados, $endereco->bairro);
                        
                        if ($novoCep) {
                            $endereco->update(['cep' => $novoCep]);
                            $corrigidos++;
                        } else {
                            $falhas++;
                        }
                    }
                } else {
                    $falhas++;
                }
            } catch (\Exception $e) {
                Log::error("[FixGenericCeps] Erro ao buscar ViaCEP para {$ruaLimpa}: " . $e->getMessage());
                $falhas++;
            }

            // Atraso de 1 segundo para evitar bloqueio da API do ViaCEP
            sleep(1);
            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);
        $this->info("Concluído!");
        $this->info("Corrigidos: {$corrigidos}");
        $this->error("Falhas (Rua não encontrada ou ambígua): {$falhas}");
    }

    private function sanitizeStreetName(string $street): string
    {
        // Remove prefixos comuns
        $street = preg_replace('/^(Rua|Av\.|Av|Avenida|Travessa|Rodovia|Rod\.|Rod|Alameda|Praça|Praca|Beco|Estrada|Viela)\s+/i', '', $street);
        // Remove tudo após vírgula ou traço (ex: "Rua Julio de Castilhos, 123" -> "Rua Julio de Castilhos")
        $street = preg_replace('/[,\\-].*$/', '', $street);
        // Remove números caso existam no meio do texto
        $street = preg_replace('/[0-9]+/', '', $street);
        
        return trim($street);
    }

    private function resolveConflict(array $resultadosViaCep, ?string $bairroCliente): ?string
    {
        // Se a API retornou exatamente 1 resultado, não há conflito.
        if (count($resultadosViaCep) === 1) {
            return $resultadosViaCep[0]['cep'];
        }

        // Se há múltiplos resultados, precisamos cruzar com o bairro.
        // ViaCEP retorna o bairro. Vamos tentar achar o mais parecido.
        if (!$bairroCliente) {
            return null; // Não temos como desempatar
        }

        $bairroClienteLimpo = strtolower(trim($bairroCliente));

        foreach ($resultadosViaCep as $resultado) {
            $bairroViaCep = strtolower(trim($resultado['bairro'] ?? ''));
            
            // Match exato ou se um contém o outro
            if ($bairroViaCep === $bairroClienteLimpo || 
                (strlen($bairroViaCep) > 3 && str_contains($bairroClienteLimpo, $bairroViaCep)) ||
                (strlen($bairroClienteLimpo) > 3 && str_contains($bairroViaCep, $bairroClienteLimpo))) {
                
                return $resultado['cep'];
            }
        }

        return null; // Não conseguiu desempatar
    }
}
