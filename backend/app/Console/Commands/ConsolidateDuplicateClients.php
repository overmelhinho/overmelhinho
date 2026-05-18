<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Cliente;
use App\Models\Endereco;
use App\Models\Autorizacao;
use App\Models\GaleriaImagem;
use Illuminate\Support\Facades\DB;

class ConsolidateDuplicateClients extends Command
{
    protected $signature = 'data:consolidate-clients';
    protected $description = 'Consolida clientes duplicados (mesmo nome) em uma única matriz, movendo as cidades para cidades_atendidas.';

    public function handle()
    {
        $this->info('Iniciando consolidação de clientes duplicados...');

        // 1. Encontrar todos os nomes fantasia que se repetem
        $duplicates = Cliente::select('nome_fantasia')
            ->whereNotNull('nome_fantasia')
            ->where('nome_fantasia', '!=', '')
            ->where('nome_fantasia', '!=', 'Sem Nome')
            ->groupBy('nome_fantasia')
            ->havingRaw('COUNT(*) > 1')
            ->get();

        $this->info("Encontrados {$duplicates->count()} nomes de empresas com duplicatas.");

        $bar = $this->output->createProgressBar($duplicates->count());

        foreach ($duplicates as $dup) {
            // Obter todos os cadastros com este nome, ordenados pelo ID (o menor será a Matriz)
            $clientes = Cliente::where('nome_fantasia', $dup->nome_fantasia)
                ->orderBy('id', 'asc')
                ->get();

            if ($clientes->count() <= 1) {
                $bar->advance();
                continue;
            }

            $matriz = $clientes->first();
            $duplicatesToMerge = $clientes->slice(1);

            $cidadesAtendidasIds = [];

            // Adicionar a cidade da matriz como primeira cidade atendida, se houver
            $enderecoMatriz = Endereco::where('cliente_id', $matriz->id)->first();
            if ($enderecoMatriz && $enderecoMatriz->cidade_id) {
                $cidadesAtendidasIds[] = $enderecoMatriz->cidade_id;
            }

            foreach ($duplicatesToMerge as $duplicate) {
                DB::beginTransaction();
                try {
                    // 1. Pegar a cidade do endereço do duplicado e adicionar às cidades atendidas da matriz
                    $enderecosDuplicado = Endereco::where('cliente_id', $duplicate->id)->get();
                    foreach ($enderecosDuplicado as $end) {
                        if ($end->cidade_id) {
                            $cidadesAtendidasIds[] = $end->cidade_id;
                        }
                    }

                    // 2. Mover as Cidades Atendidas existentes no duplicado (se já houver)
                    $cidadesJaAtendidas = DB::table('cliente_cidade')->where('cliente_id', $duplicate->id)->pluck('cidade_id')->toArray();
                    $cidadesAtendidasIds = array_merge($cidadesAtendidasIds, $cidadesJaAtendidas);

                    // 3. Mover Publicidades (Autorizações)
                    Autorizacao::where('cliente_id', $duplicate->id)->update(['cliente_id' => $matriz->id]);

                    // 4. Mover Galeria de Imagens
                    GaleriaImagem::where('cliente_id', $duplicate->id)->update(['cliente_id' => $matriz->id]);

                    // 5. Mover Segmentos
                    $segmentos = DB::table('cliente_segmento')->where('cliente_id', $duplicate->id)->pluck('segmento_id')->toArray();
                    foreach (array_unique($segmentos) as $segId) {
                        DB::statement("INSERT INTO cliente_segmento (cliente_id, segmento_id) VALUES (?, ?) ON CONFLICT DO NOTHING", [$matriz->id, $segId]);
                    }

                    // 6. Atualizar a Matriz se ela não tiver logo, mas a duplicata tiver
                    if (!$matriz->logo_url && $duplicate->logo_url) {
                        $matriz->logo_url = $duplicate->logo_url;
                        $matriz->save();
                    }

                    // 7. Mover Reviews (se houver)
                    DB::table('cliente_reviews')->where('cliente_id', $duplicate->id)->update(['cliente_id' => $matriz->id]);

                    // 8. Excluir os registros filhos não essenciais do duplicado antes de deletar
                    DB::table('enderecos')->where('cliente_id', $duplicate->id)->delete();
                    DB::table('contatos')->where('cliente_id', $duplicate->id)->delete();
                    DB::table('redes_sociais')->where('cliente_id', $duplicate->id)->delete();
                    DB::table('cliente_segmento')->where('cliente_id', $duplicate->id)->delete();
                    DB::table('cliente_cidade')->where('cliente_id', $duplicate->id)->delete();
                    
                    // Excluir os logs de auditoria do duplicado para não violar Foreign Key na hora de deletar
                    DB::table('audit_logs')->where('cliente_id', $duplicate->id)->delete();

                    // 9. Finalmente, deletar o cliente duplicado (desabilitando eventos para não disparar Observer)
                    Cliente::withoutEvents(function() use ($duplicate) {
                        $duplicate->delete();
                    });

                    DB::commit();
                } catch (\Exception $e) {
                    DB::rollBack();
                    $this->error("\nErro ao mesclar cliente {$duplicate->id} na matriz {$matriz->id}: " . $e->getMessage());
                }
            }

            // Anexar todas as cidades encontradas na matriz
            if (!empty($cidadesAtendidasIds)) {
                $cidadesAtendidasIds = array_unique($cidadesAtendidasIds);
                $matriz->cidadesAtendidas()->syncWithoutDetaching($cidadesAtendidasIds);
            }

            $bar->advance();
        }

        $bar->finish();
        $this->info("\nConsolidação finalizada com sucesso!");
    }
}
