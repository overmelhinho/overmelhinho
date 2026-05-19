<?php
namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\Contato;

class FixMigratedContacts extends Command
{
    protected $signature = 'migrate:fix_contacts';
    protected $description = 'Corrige as flags de exibição e whatsapp nos contatos migrados';

    public function handle()
    {
        $this->info('Fixando flags de contatos...');
        
        $lastId = 0;
        $total = DB::connection('legacy')->table('clientes')->count();
        $bar = $this->output->createProgressBar($total);

        Contato::flushEventListeners();

        DB::connection('legacy')->table('clientes')->orderBy('id')->chunk(500, function ($clientes) use ($bar) {
            foreach ($clientes as $lc) {
                
                // Mapear telefone_outro: usar fax ou pj_fone_gratuito
                $telefoneOutro = $lc->pj_fone_gratuito ?: $lc->fax;
                
                Contato::where('cliente_id', $lc->id)->update([
                    'telefone_outro' => $telefoneOutro,
                    
                    'exibir_tel_principal' => $lc->visualizar_site_fone_principal === 'Sim' ? 'true' : 'false',
                    'exibir_tel_secundario' => $lc->visualizar_site_fone_secundario === 'Sim' ? 'true' : 'false',
                    'exibir_celular' => $lc->visualizar_site_celular === 'Sim' ? 'true' : 'false',
                    'exibir_tel_outro' => ($lc->visualizar_site_pj_fone_gratuito === 'Sim' || $lc->visualizar_site_fax === 'Sim') ? 'true' : 'false',
                    'exibir_email' => $lc->visualizar_site_email === 'Sim' ? 'true' : 'false',
                    
                    'has_whatsapp_principal' => $lc->fone_principal_possui_whatsapp === 'Sim' ? 'true' : 'false',
                    'has_whatsapp_secundario' => $lc->fone_secundario_possui_whatsapp === 'Sim' ? 'true' : 'false',
                    'has_whatsapp_celular' => $lc->celular_possui_whatsapp === 'Sim' ? 'true' : 'false',
                    'has_whatsapp_outro' => $lc->fax_possui_whatsapp === 'Sim' ? 'true' : 'false',
                ]);

                $bar->advance();
            }
        });

        $bar->finish();
        $this->newLine();
        $this->info('Correção de contatos concluída!');
    }
}
