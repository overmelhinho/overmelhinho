<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class DisableDataFundacao extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'data:disable-fundacao';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Disables exibir_data_fundacao for all clients';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Atualizando exibir_data_fundacao para false em todos os clientes...');
        $affected = DB::table('clientes')->update(['exibir_data_fundacao' => DB::raw('false')]);
        $this->info("Sucesso! {$affected} clientes foram atualizados.");
    }
}
