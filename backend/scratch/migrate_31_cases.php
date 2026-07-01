<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use App\Models\Cliente;
use App\Models\Autorizacao;
use App\Models\AutorizacaoParcela;

function sanitizeDate($date)
{
    if (!$date || str_starts_with($date, '0000') || str_starts_with($date, '-')) {
        return null;
    }
    return $date;
}

function mapPaymentMethod($legacyMethod)
{
    $map = [
        'Direto' => 'dinheiro',
        'Boleto' => 'boleto',
        'Cheque' => 'dinheiro',
        'Permuta' => 'dinheiro',
        'Cartão de Débito' => 'cartao',
        'Cartão de Crédito' => 'cartao',
    ];
    return $map[$legacyMethod] ?? 'pix';
}

$query = "
    SELECT 
        p.id as publicidade_id, p.num_autorizacao, p.id_cliente,
        p.titulo, p.observacoes_anuncio, p.valor, p.data_inicial, p.data_emissao, p.data_cadastro,
        p.data_final, p.tipo_pagamento, p.parcelamento_qtd, p.parcelamento_data_parcela1,
        p.modo_pagamento, p.arquivo_assinatura, p.id_vendedor,
        pp.id as parcela_id, pp.valor as valor_parcela,
        COALESCE((SELECT SUM(valor_pago) FROM publicidades_parcelas_pagamentos WHERE id_parcela = pp.id), 0) as total_pago
    FROM publicidades p
    JOIN publicidades_parcelas pp ON pp.id_publicidade = p.id
    WHERE p.num_autorizacao IN (
        SELECT num_autorizacao 
        FROM publicidades 
        WHERE num_autorizacao IS NOT NULL AND num_autorizacao != '' 
        GROUP BY num_autorizacao 
        HAVING COUNT(id) > 1
    )
    HAVING (valor_parcela - total_pago) > 0.01
";

$results = DB::connection('legacy')->select($query);

$publicidadeIdsToMigrate = [];
foreach($results as $r) {
    $publicidadeIdsToMigrate[] = $r->publicidade_id;
}
$publicidadeIdsToMigrate = array_unique($publicidadeIdsToMigrate);

echo "Iniciando migração de " . count($publicidadeIdsToMigrate) . " publicidades problemáticas...\n";

$pagamentos = DB::connection('legacy')->table('publicidades_parcelas_pagamentos')->pluck('id_parcela')->toArray();
$pagamentos = array_flip($pagamentos);

$publicidades = DB::connection('legacy')->table('publicidades')->whereIn('id', $publicidadeIdsToMigrate)->get();

foreach ($publicidades as $lp) {
    echo "Processando Legado ID: {$lp->id} (Autorizacao: {$lp->num_autorizacao})\n";
    try {
        if (!Cliente::find($lp->id_cliente)) {
            echo "  - Cliente {$lp->id_cliente} não encontrado. Pulando.\n";
            continue;
        }

        // Adiciona o sufixo IMP conforme solicitado pelo usuário
        $numero = $lp->num_autorizacao . '-IMP';

        $autorizacao = Autorizacao::updateOrCreate(
            ['id' => $lp->id],
            [
                'cliente_id' => $lp->id_cliente,
                'numero' => $numero,
                'titulo_anuncio' => $lp->titulo ?: 'Publicidade Legada',
                'descricao_anuncio' => $lp->observacoes_anuncio,
                'valor_total' => is_numeric($lp->valor) ? $lp->valor : 0,
                'data_inicio' => sanitizeDate($lp->data_inicial) ?: sanitizeDate($lp->data_emissao) ?: sanitizeDate($lp->data_cadastro) ?: '2000-01-01',
                'data_fim' => sanitizeDate($lp->data_final) ?: '2099-12-31',
                'modo_pagamento' => strtolower($lp->tipo_pagamento) === 'parcelado' ? 'parcelado' : 'direto',
                'num_parcelas' => $lp->parcelamento_qtd ?: 1,
                'data_primeira_parcela' => sanitizeDate($lp->parcelamento_data_parcela1 ?: $lp->data_inicial ?: $lp->data_emissao) ?: '2000-01-01',
                'payment_method' => mapPaymentMethod($lp->modo_pagamento),
                'assinatura_base64' => $lp->arquivo_assinatura,
                'status' => 'assinado',
                'vendedor_id' => $lp->id_vendedor,
            ]
        );

        $legacyParcelas = DB::connection('legacy')->table('publicidades_parcelas')->where('id_publicidade', $lp->id)->get();

        foreach ($legacyParcelas as $idx => $lpar) {
            $isPago = isset($pagamentos[$lpar->id]);

            AutorizacaoParcela::updateOrCreate(
                ['id' => $lpar->id],
                [
                    'autorizacao_id' => $autorizacao->id,
                    'numero' => $idx + 1,
                    'vencimento' => sanitizeDate($lpar->data_vencimento) ?: $autorizacao->data_inicio,
                    'valor' => is_numeric($lpar->valor) ? $lpar->valor : 0,
                    'status' => $isPago ? 'pago' : 'pendente',
                ]
            );
        }
        echo "  - Sucesso: Migrada como {$numero} (Autorizacao ID: {$autorizacao->id})\n";
    } catch (\Exception $e) {
        echo "  - ERRO na publicidade ID {$lp->id}: " . $e->getMessage() . "\n";
    }
}
echo "\nConcluído!\n";
