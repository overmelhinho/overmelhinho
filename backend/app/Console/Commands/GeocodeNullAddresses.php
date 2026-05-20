<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Endereco;
use Illuminate\Support\Facades\Http;

class GeocodeNullAddresses extends Command
{
    protected $signature = 'geocode:addresses {--limit=100}';
    protected $description = 'Preenche latitude e longitude vazios utilizando Nominatim (OpenStreetMap)';

    public function handle()
    {
        $limit = $this->option('limit');
        $enderecos = Endereco::whereNull('latitude')
            ->whereNotNull('rua')
            ->whereNotNull('cidade')
            ->limit($limit)
            ->get();

        if ($enderecos->isEmpty()) {
            $this->info("Nenhum endereço sem coordenada encontrado (ou sem rua/cidade).");
            return;
        }

        $this->info("Iniciando geocodificação de {$enderecos->count()} endereços via OpenStreetMap...");
        $bar = $this->output->createProgressBar($enderecos->count());

        $sucesso = 0;
        $falhas = 0;

        foreach ($enderecos as $endereco) {
            // Evitar ruas vazias ou apenas "S/N"
            if (trim($endereco->rua) === '' || trim(strtolower($endereco->rua)) === 'vazio') {
                $endereco->update([
                    'latitude' => 0, 
                    'longitude' => 0
                ]);
                $bar->advance();
                continue;
            }

            // Construir query de busca
            $queryParts = [];
            
            // Número é opcional, mas ajuda se não for S/N ou 0
            $numeroStr = '';
            if ($endereco->numero && !in_array(strtolower(trim($endereco->numero)), ['s/n', '0', 's\n', 'sn'])) {
                $numeroStr = $endereco->numero . ' ';
            }
            
            $ruaCompleta = $numeroStr . trim($endereco->rua);
            $queryParts[] = $ruaCompleta;

            if ($endereco->bairro) {
                $queryParts[] = trim($endereco->bairro);
            }
            if ($endereco->cidade) {
                $queryParts[] = trim($endereco->cidade);
            }
            if ($endereco->estado) {
                $queryParts[] = trim($endereco->estado);
            }
            $queryParts[] = 'Brasil';

            $queryString = implode(', ', $queryParts);

            try {
                // Nominatim API: Free OpenStreetMap geocoding
                // Respecting their usage policy: 1 req/sec, identifying via User-Agent
                $response = Http::withHeaders([
                    'User-Agent' => 'OvermelhinhoDataMigrator/1.0 (daniel@overmelhinho.com.br)'
                ])->timeout(10)->get('https://nominatim.openstreetmap.org/search', [
                    'q' => $queryString,
                    'format' => 'json',
                    'limit' => 1
                ]);

                if ($response->successful() && !empty($response->json())) {
                    $data = $response->json()[0];
                    $endereco->update([
                        'latitude' => (float) $data['lat'],
                        'longitude' => (float) $data['lon']
                    ]);
                    $sucesso++;
                } else {
                    // Se não achar, atualiza com algo inválido (ou deixa null) para não ficar travando
                    // Como não achou, marcamos com 0 para não tentar de novo infinitamente
                    $endereco->update([
                        'latitude' => 0, 
                        'longitude' => 0
                    ]);
                    $falhas++;
                }
            } catch (\Exception $e) {
                $this->error("\nErro ao consultar Nominatim: " . $e->getMessage());
                $falhas++;
            }

            // Respeitar Rate Limit do Nominatim (1 request por segundo)
            sleep(1);
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info("Concluído! Sucesso: $sucesso | Não localizados/Falhas: $falhas");
        
        $restantes = Endereco::whereNull('latitude')->count();
        $this->info("Ainda restam $restantes endereços na fila.");
    }
}
