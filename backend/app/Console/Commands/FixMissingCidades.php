<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Cliente;
use App\Models\Cidade;
use Illuminate\Support\Str;

class FixMissingCidades extends Command
{
    protected $signature = 'data:fix-missing-cidades';
    protected $description = 'Atribui a cidade do endereço principal como "Cidade Atendida" para clientes que não tem nenhuma cidade selecionada.';

    public function handle()
    {
        $this->info("Buscando clientes sem cidades atendidas...");

        $query = Cliente::doesntHave('cidadesAtendidas')->with('enderecos');
        $total = $query->count();
        
        $this->info("Encontrados {$total} clientes.");

        if ($total === 0) {
            return;
        }

        $bar = $this->output->createProgressBar($total);
        $corrigidos = 0;

        foreach ($query->cursor() as $cliente) {
            $endereco = $cliente->enderecos->first();
            
            if ($endereco && !empty($endereco->cidade)) {
                $estado = $endereco->estado ?? 'RS';
                $cidadeNome = trim($endereco->cidade);
                
                $cidadeObj = Cidade::where('nome', $cidadeNome)->where('uf', $estado)->first();
                
                if (!$cidadeObj) {
                    $cidadeObj = Cidade::create([
                        'nome' => $cidadeNome,
                        'uf' => $estado,
                        'slug' => Str::slug($cidadeNome . '-' . $estado)
                    ]);
                }

                $cliente->cidadesAtendidas()->attach($cidadeObj->id);
                $corrigidos++;
            }
            
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info("Concluído. $corrigidos clientes corrigidos com a cidade principal.");
    }
}
