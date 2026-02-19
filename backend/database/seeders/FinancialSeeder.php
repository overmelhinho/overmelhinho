<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Plan;

class FinancialSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $plans = [
            [
                'name' => 'Banner Topo',
                'price' => 219.00,
                'billing_cycle' => 'mensal',
                'tiny_product_id' => 'SERV-BANNER-TOPO',
            ],
            [
                'name' => 'Pacote Vagas',
                'price' => 129.00,
                'billing_cycle' => 'mensal',
                'tiny_product_id' => 'SERV-VAGAS',
            ],
            [
                'name' => 'Pop-up Comercial',
                'price' => 1800.00,
                'billing_cycle' => 'avulso',
                'tiny_product_id' => 'SERV-POPUP',
            ],
            [
                'name' => 'Anuidade Portal',
                'price' => 1200.00,
                'billing_cycle' => 'anual',
                'tiny_product_id' => 'SERV-ANUAL',
            ],
        ];

        foreach ($plans as $plan) {
            Plan::updateOrCreate(['name' => $plan['name']], $plan);
        }
    }
}
