<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Cliente;

class DecodeHtmlEntities extends Command
{
    protected $signature = 'data:decode-html';
    protected $description = 'Converte HTML entities (como &#9888; e &#769;) de volta para texto unicode nos dados dos clientes.';

    public function handle()
    {
        $this->info("Buscando clientes com HTML Entities...");

        // Usamos LIKE '%&#%' para identificar os registros afetados.
        $query = Cliente::where('descricao', 'like', '%&#%')
            ->orWhere('nome_fantasia', 'like', '%&#%')
            ->orWhere('razao_social', 'like', '%&#%')
            ->orWhere('observacoes', 'like', '%&#%');

        $total = $query->count();
        
        $this->info("Encontrados {$total} clientes com entidades HTML.");

        if ($total === 0) {
            return;
        }

        $bar = $this->output->createProgressBar($total);
        $corrigidos = 0;

        foreach ($query->cursor() as $cliente) {
            $updateData = [];

            $fieldsToCheck = ['nome_fantasia', 'razao_social', 'descricao', 'observacoes'];

            foreach ($fieldsToCheck as $field) {
                if (!empty($cliente->$field) && str_contains($cliente->$field, '&#')) {
                    // ENT_QUOTES | ENT_HTML5 garante a tradução de todas as entidades numéricas e símbolos
                    $decoded = html_entity_decode($cliente->$field, ENT_QUOTES | ENT_HTML5, 'UTF-8');
                    
                    if ($decoded !== $cliente->$field) {
                        $updateData[$field] = $decoded;
                    }
                }
            }

            if (!empty($updateData)) {
                $cliente->update($updateData);
                $corrigidos++;
            }
            
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info("Concluído. $corrigidos clientes tiveram seus textos decodificados.");
    }
}
