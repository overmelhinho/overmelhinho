<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class CidadesRioGrandeDoSulSeeder extends Seeder
{
    public function run(): void
    {
        // UF pode ser "RS" (sigla) ou o código.
        // A doc oficial mostra o padrão /estados/{UF}/municipios. :contentReference[oaicite:1]{index=1}
        $url = 'https://servicodados.ibge.gov.br/api/v1/localidades/estados/RS/municipios';

        $response = Http::timeout(30)
            ->retry(3, 800)
            ->get($url);

        if (!$response->ok()) {
            $this->command?->error("Falha ao buscar cidades do IBGE. HTTP: {$response->status()}");
            $this->command?->error("Body: " . substr($response->body(), 0, 300));
            return;
        }

        $municipios = $response->json();

        if (!is_array($municipios)) {
            $this->command?->error("Resposta inesperada do IBGE (não é array).");
            return;
        }

        $count = 0;

        DB::beginTransaction();

        try {
            foreach ($municipios as $m) {
                $nome = $m['nome'] ?? null;

                if (!$nome) {
                    continue;
                }

                // updateOrInsert não exige índice unique (bom pro seu cenário atual)
                DB::table('cidades')->updateOrInsert(
                    ['nome' => $nome, 'uf' => 'RS'],
                    ['updated_at' => now(), 'created_at' => now()]
                );

                $count++;
            }

            DB::commit();

            $this->command?->info("Seeder concluído: {$count} municípios do RS processados.");
        } catch (\Throwable $e) {
            DB::rollBack();
            $this->command?->error("Erro ao salvar no banco: " . $e->getMessage());
        }
    }
}
