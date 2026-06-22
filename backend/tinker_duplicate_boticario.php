<?php
$client = \App\Models\Cliente::with('enderecos', 'contatos')->find(21232);
if ($client) {
    $data = $client->toArray();
    
    // Removemos chaves e campos que são UNIQUE no banco e gerariam erro de duplicidade
    unset(
        $data['id'],
        $data['slug'],
        $data['cpf_cnpj'],
        $data['inscricao_estadual'],
        $data['inscricao_municipal'],
        $data['registro_profissional'],
        $data['nome_alternativo'],
        $data['tiny_id'],
        $data['google_place_id'],
        $data['enderecos'],
        $data['contatos']
    );
    
    // Setamos como pagante bonificado por +1 ano
    $data['tipo_cliente'] = 'pagante';
    $data['status_assinatura'] = 'ativa';
    $data['contract_ends_at'] = now()->addYear();
    $data['plan_id'] = null;
    
    // Criamos um slug totalmente único manualmente
    $data['slug'] = 'o-boticario-independencia-' . uniqid();
    
    // Insere direto no DB para evitar problemas com models
    $newId = \Illuminate\Support\Facades\DB::table('clientes')->insertGetId($data);
    
    // 2. Duplicamos o Endereço com a rua correta
    foreach($client->enderecos as $endereco) {
        $endData = $endereco->toArray();
        unset($endData['id'], $endData['cliente_id']);
        $endData['cliente_id'] = $newId;
        $endData['rua'] = 'Rua Independência';
        $endData['numero'] = '481';
        $endData['complemento'] = 'Sala 11 e 12';
        \Illuminate\Support\Facades\DB::table('enderecos')->insert($endData);
    }
    
    // 3. Duplicamos os contatos
    foreach($client->contatos as $contato) {
        $contData = $contato->toArray();
        unset($contData['id'], $contData['cliente_id']);
        $contData['cliente_id'] = $newId;
        \Illuminate\Support\Facades\DB::table('contatos')->insert($contData);
    }
    
    echo "Client duplicated successfully! New ID: " . $newId . "\n";
} else {
    echo "Client 21232 not found.\n";
}
