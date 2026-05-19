<?php
namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\Contato;

class FixWhatsAppSelected extends Command
{
    protected $signature = 'migrate:fix_whatsapp_selected';
    protected $description = 'Atribui o whatsapp principal com base nas flags de whatsapp';

    public function handle()
    {
        $this->info('Atribuindo whatsapp_selected...');
        
        $total = Contato::count();
        $bar = $this->output->createProgressBar($total);

        Contato::flushEventListeners();

        Contato::orderBy('id')->chunk(1000, function ($contatos) use ($bar) {
            foreach ($contatos as $c) {
                $selected = null;
                if ($c->has_whatsapp_principal && $c->telefone_principal) {
                    $selected = 'telefone_principal';
                } elseif ($c->has_whatsapp_celular && $c->celular) {
                    $selected = 'celular';
                } elseif ($c->has_whatsapp_secundario && $c->telefone_secundario) {
                    $selected = 'telefone_secundario';
                } elseif ($c->has_whatsapp_outro && $c->telefone_outro) {
                    $selected = 'telefone_outro';
                }

                // Salvar como string vazia em vez de null para que o frontend não caia no "|| 'telefone_principal'"
                $c->whatsapp_selected = $selected ?: '';
                // usar query builder update para evitar events
                DB::connection('pgsql')->table('contatos')->where('id', $c->id)->update([
                    'whatsapp_selected' => $selected ?: ''
                ]);

                $bar->advance();
            }
        });

        $bar->finish();
        $this->newLine();
        $this->info('Correção concluída!');
    }
}
