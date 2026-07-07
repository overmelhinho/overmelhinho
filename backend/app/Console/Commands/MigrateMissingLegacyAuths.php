<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\Cliente;
use App\Models\Autorizacao;
use App\Models\AutorizacaoParcela;

class MigrateMissingLegacyAuths extends Command
{
    protected $signature = 'migrate:missing-auths {--month= : Mês específico (formato YYYY-MM)}';
    protected $description = 'Resgata autorizações legadas que foram puladas na migração original (devido ao salto de IDs manuais)';

    public function handle()
    {
        $month = $this->option('month');
        $this->info("Iniciando resgate de autorizações perdidas" . ($month ? " para o mês $month" : ""));

        // 1. Carregar mapeamento atual de Autorizações no Postgres
        $this->info("Carregando autorizações atuais...");
        $pgAuths = Autorizacao::select('id', 'valor_total')->get()->keyBy('id');

        // 2. Buscar Publicidades legadas no MySQL
        $query = DB::connection('legacy')->table('publicidades');
        
        if ($month) {
            $query->whereRaw("DATE_FORMAT(data_cadastro, '%Y-%m') = ?", [$month]);
        }

        $totalLegacy = $query->count();
        $this->info("Encontradas $totalLegacy publicidades no sistema antigo no período.");

        $bar = $this->output->createProgressBar($totalLegacy);

        $skippedAuths = [];
        $query->orderBy('id')->chunk(500, function ($publicidades) use ($pgAuths, &$skippedAuths, $bar) {
            foreach ($publicidades as $lp) {
                $pgAuth = $pgAuths->get($lp->id);
                
                $isMissing = false;
                if (!$pgAuth) {
                    $isMissing = true;
                } else if ((float)$pgAuth->valor_total !== (float)$lp->valor) {
                    // ID foi "roubado" por uma inserção manual não relacionada
                    $isMissing = true;
                }

                if ($isMissing) {
                    $skippedAuths[] = $lp;
                }

                $bar->advance();
            }
        });

        $bar->finish();
        $this->newLine();
        
        $this->info("Total de autorizações perdidas identificadas: " . count($skippedAuths));

        if (count($skippedAuths) === 0) {
            return;
        }

        $this->info("Iniciando importação...");
        $barImport = $this->output->createProgressBar(count($skippedAuths));

        // Pre-carregar pagamentos para o lote
        $idsSkipped = array_column($skippedAuths, 'id');
        $this->info("Carregando parcelas e pagamentos...");
        
        $todasParcelas = DB::connection('legacy')->table('publicidades_parcelas')
            ->whereIn('id_publicidade', $idsSkipped)
            ->get()
            ->groupBy('id_publicidade');

        $todosPagamentos = DB::connection('legacy')->table('publicidades_parcelas_pagamentos')
            ->pluck('id_parcela')
            ->flip()
            ->toArray();

        foreach ($skippedAuths as $lp) {
            try {
                // Verificar se o cliente existe
                if (!Cliente::find($lp->id_cliente)) {
                    $barImport->advance();
                    continue;
                }

                $numero = $lp->num_autorizacao ?: $lp->id;
                
                // Verificar conflito de número (ignora o id da autorizacao pq vai ser gerado um novo)
                $exists = Autorizacao::where('numero', $numero)->exists();
                if ($exists) {
                    $numero = $numero . '-legado';
                }

                // Inserir como um NOVO registro (sem forçar o ID para evitar sobrescrever as manuais)
                $autorizacao = Autorizacao::create([
                    'cliente_id' => $lp->id_cliente,
                    'numero' => $numero,
                    'titulo_anuncio' => $lp->titulo ?: 'Publicidade Legada',
                    'descricao_anuncio' => $lp->observacoes_anuncio,
                    'valor_total' => is_numeric($lp->valor) ? $lp->valor : 0,
                    'data_inicio' => $this->sanitizeDate($lp->data_inicial) ?: $this->sanitizeDate($lp->data_emissao) ?: $this->sanitizeDate($lp->data_cadastro) ?: '2000-01-01',
                    'data_fim' => $this->sanitizeDate($lp->data_final) ?: '2099-12-31',
                    'modo_pagamento' => strtolower($lp->tipo_pagamento) === 'parcelado' ? 'parcelado' : 'direto',
                    'num_parcelas' => $lp->parcelamento_qtd ?: 1,
                    'data_primeira_parcela' => $this->sanitizeDate($lp->parcelamento_data_parcela1 ?: $lp->data_inicial ?: $lp->data_emissao) ?: '2000-01-01',
                    'payment_method' => $this->mapPaymentMethod($lp->modo_pagamento),
                    'assinatura_base64' => $lp->arquivo_assinatura,
                    'status' => 'assinado',
                    'vendedor_id' => $lp->id_vendedor,
                    // Preservar as datas originais para os relatórios!
                    'created_at' => $this->sanitizeDate($lp->data_cadastro) ?: now(),
                ]);

                // Migrar Parcelas
                $legacyParcelas = $todasParcelas[$lp->id] ?? collect();

                foreach ($legacyParcelas as $idx => $lpar) {
                    $isPago = isset($todosPagamentos[$lpar->id]);

                    AutorizacaoParcela::create([
                        'autorizacao_id' => $autorizacao->id,
                        'numero' => $idx + 1,
                        'vencimento' => $this->sanitizeDate($lpar->data_vencimento) ?: $autorizacao->data_inicio,
                        'valor' => is_numeric($lpar->valor) ? $lpar->valor : 0,
                        'status' => $isPago ? 'pago' : 'pendente',
                        'created_at' => $this->sanitizeDate($lp->data_cadastro) ?: now(),
                    ]);
                }
            } catch (\Exception $e) {
                $this->error("Erro na publicidade ID {$lp->id}: " . $e->getMessage());
                \Log::error("Migração Publicidade (Resgate) ID {$lp->id}: " . $e->getMessage());
            }

            $barImport->advance();
        }

        $barImport->finish();
        $this->newLine();
        $this->info("Resgate finalizado!");
    }

    private function sanitizeDate($date)
    {
        if (!$date || str_starts_with($date, '0000') || str_starts_with($date, '-')) {
            return null;
        }
        return $date;
    }

    private function mapPaymentMethod($legacyMethod)
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
}
