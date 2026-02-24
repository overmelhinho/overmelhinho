<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Quote;
use App\Models\Cliente;

class QuoteSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $clientes = Cliente::limit(3)->get();

        if ($clientes->isEmpty()) {
            return;
        }

        $fakes = [
            [
                'customer_name' => 'Ricardo Silva',
                'customer_whatsapp' => '(54) 99887-7665',
                'service_requested' => 'Preciso de um guincho urgente para a BR-116, km 42. Meu carro parou.',
                'urgency' => 'emergencia',
                'status' => 'new',
                'ai_draft_response' => 'Olá Ricardo! Sou da equipe de atendimento. Identificamos sua urgência na BR-116. Já estamos verificando o guincho mais próximo para te atender imediatamente. Qual a placa do veículo?',
            ],
            [
                'customer_name' => 'Maria Oliveira',
                'customer_whatsapp' => '(51) 98765-4321',
                'service_requested' => 'Gostaria de um orçamento para revisão de 40.000km em um Jeep Compass.',
                'urgency' => 'semana',
                'status' => 'new',
                'ai_draft_response' => 'Olá Maria, tudo bem? Podemos realizar a revisão do seu Jeep Compass esta semana mesmo. Temos horários disponíveis na quarta e quinta-feira. Gostaria de agendar?',
            ],
            [
                'customer_name' => 'Carlos Eduardo',
                'customer_whatsapp' => '(48) 99112-2334',
                'service_requested' => 'Apenas pesquisando preços de pneus aro 15, marca Michelin.',
                'urgency' => 'pesquisa',
                'status' => 'new',
                'ai_draft_response' => 'Olá Carlos! Temos pneus Michelin aro 15 em estoque. O valor unitário está em promoção este mês. Posso te enviar a tabela completa de preços?',
            ],
            [
                'customer_name' => 'Fernanda Souza',
                'customer_whatsapp' => '(11) 97766-5544',
                'service_requested' => 'Troca de óleo e filtro urgente, estou saindo para viagem.',
                'urgency' => 'emergencia',
                'status' => 'new',
                'ai_draft_response' => 'Oi Fernanda! Entendido, você precisa da troca antes de viajar. Se chegar aqui nos próximos 30 minutos conseguimos encaixar seu veículo. Vamos garantir sua segurança na estrada!',
            ]
        ];

        foreach ($fakes as $index => $data) {
            // Distribui entre os clientes disponíveis
            $cliente = $clientes[$index % $clientes->count()];
            
            Quote::create(array_merge($data, [
                'cliente_id' => $cliente->id,
                'created_at' => now()->subMinutes(rand(5, 120))
            ]));
        }
    }
}
