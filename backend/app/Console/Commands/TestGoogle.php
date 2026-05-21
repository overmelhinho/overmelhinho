<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class TestGoogle extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:test-google';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Command description';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $cidade = 'Farroupilha';
        $segmento = 'Joalherias';

        $clientesNaCidade = \App\Models\Cliente::whereHas('enderecos', function($q) use ($cidade) {
                $q->where('cidade', 'ILIKE', '%' . $cidade . '%');
            })
            ->pluck('nome_fantasia')
            ->map(function($n) {
                $clean = preg_replace('/[^a-z0-9]/', ' ', mb_strtolower(\Illuminate\Support\Str::ascii($n)));
                return array_values(array_filter(explode(' ', $clean), fn($w) => strlen($w) > 2));
            })->toArray();

        $googleService = app(\App\Services\GooglePlacesService::class);
        $query = $segmento . ' em ' . $cidade . ' - RS';
        $places = $googleService->searchPlaces($query);

        $stopwords = ['loja', 'comercial', 'comercio', 'industria', 'mercado', 'supermercado', 'padaria', 'farmacia', 'restaurante', 'lanchonete', 'pizzaria', 'bar', 'cafe', 'joalheria', 'otica', 'clinica', 'consultorio', 'escritorio', 'advocacia', 'centro', 'estetica', 'salao', 'auto', 'posto', 'mecanica', 'oficina', 'servicos', 'distribuidora', 'transportes', 'imobiliaria', 'construtora', 'arquitetura', 'engenharia', 'contabilidade', 'escola', 'academia', 'pet', 'shop', 'veterinaria', 'hospital', 'hotel', 'pousada', 'motel', 'clube', 'sindicato', 'igreja', 'templo', 'centro', 'veiculos', 'pecas', 'motopeças', 'autopeças', 'informatica', 'celulares', 'assistencia', 'tecnica', 'rs', 'brasil', 'ltda', 'me', 'epp', 'sa', 'cia', 'e', 'do', 'da', 'de', 'dos', 'das', 'com', 'para', 'por', 'na', 'no', 'nas', 'nos'];

        if ($cidade) {
            $cidadeWords = explode(' ', mb_strtolower(\Illuminate\Support\Str::ascii($cidade)));
            $stopwords = array_merge($stopwords, $cidadeWords);
        }

        $this->info(count($places) . " lugares encontrados no Google");
        $targets = [];
        foreach ($places as $place) {
            $name = $place['name'];
            $cleanGName = preg_replace('/[^a-z0-9]/', ' ', mb_strtolower(\Illuminate\Support\Str::ascii($name)));
            $gWords = array_values(array_filter(explode(' ', $cleanGName), fn($w) => strlen($w) > 2 && !in_array($w, $stopwords)));
            
            $existsByName = false;
            foreach ($clientesNaCidade as $dbWords) {
                $dbWordsFiltered = array_values(array_filter($dbWords, fn($w) => !in_array($w, $stopwords)));
                if (empty($dbWordsFiltered) || empty($gWords)) continue;
                
                $intersect = array_intersect($gWords, $dbWordsFiltered);
                if (count($intersect) >= min(2, count($dbWordsFiltered))) {
                    $this->warn("Filtrado: $name. Bateu com BD: " . implode(' ', $dbWords));
                    $existsByName = true;
                    break;
                }
            }
            if (!$existsByName) {
                $targets[] = $name;
            }
        }
        $this->info(count($targets) . " alvos validados");
    }
}
