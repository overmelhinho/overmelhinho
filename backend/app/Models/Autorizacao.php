<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Autorizacao extends Model
{
    use HasFactory;

    protected static function booted()
    {
        static::saved(function ($autorizacao) {
            if ($autorizacao->status === 'assinado' && $autorizacao->cliente_id) {
                $today = \Carbon\Carbon::today()->format('Y-m-d');
                $dataFim = $autorizacao->data_fim ? \Carbon\Carbon::parse($autorizacao->data_fim)->format('Y-m-d') : null;
                
                if ($dataFim && $dataFim >= $today) {
                    $cliente = $autorizacao->cliente;
                    if ($cliente && ($cliente->status_assinatura !== 'ativa' || $cliente->tipo_cliente !== 'pagante')) {
                        $cliente->update([
                            'tipo_cliente' => 'pagante',
                            'status_assinatura' => 'ativa'
                        ]);
                    }
                }
            }
        });
    }

    protected $table = 'autorizacoes';

    protected $fillable = [
        'id',
        'numero',
        'cliente_id',
        'plan_id',
        'vendedor_id',
        'tipo_publicidade',
        'titulo_anuncio',
        'descricao_anuncio',
        'valor_total',
        'taxa_cadastro',
        'data_inicio',
        'data_fim',
        'modo_pagamento',
        'num_parcelas',
        'data_primeira_parcela',
        'payment_method',
        'observacoes_anuncio',
        'observacoes_financeiro',
        'status',
        'magic_link_token',
        'assinado_em',
        'assinatura_ip',
        'assinatura_base64',
        'pdf_path',
        'is_permuta',
        'permuta_amount',
        'permuta_description',
        'desconto_tipo',
        'desconto_valor',
        'justificativa_assinatura',
        'justificado_por',
        'justificado_em',
        'responsavel_nome',
        'responsavel_preferencia',
        'responsavel_turno',
        'parent_id',
        'is_bonificacao',
        'tiny_needs_manual_cancellation',
    ];

    protected $casts = [
        'valor_total'          => 'decimal:2',
        'taxa_cadastro'        => 'decimal:2',
        'data_inicio'          => 'date',
        'data_fim'             => 'date',
        'data_primeira_parcela'=> 'date',
        'assinado_em'          => 'datetime',
        'justificado_em'       => 'datetime',
        'is_permuta'           => 'boolean',
        'permuta_amount'       => 'decimal:2',
        'desconto_valor'       => 'decimal:2',
        'is_bonificacao'       => 'boolean',
    ];

    protected $appends = [
        'has_invoices',
    ];

    // ─── Relacionamentos ─────────────────────────────────────────────────────

    public function cliente()
    {
        return $this->belongsTo(Cliente::class);
    }

    public function plan()
    {
        return $this->belongsTo(Plan::class);
    }

    public function vendedor()
    {
        return $this->belongsTo(User::class, 'vendedor_id');
    }

    public function justificadoPor()
    {
        return $this->belongsTo(User::class, 'justificado_por');
    }

    public function parcelas()
    {
        return $this->hasMany(AutorizacaoParcela::class)->orderBy('numero');
    }

    public function parentAutorizacao()
    {
        return $this->belongsTo(Autorizacao::class, 'parent_id');
    }

    public function subAutorizacoes()
    {
        return $this->hasMany(Autorizacao::class, 'parent_id');
    }

    // ─── Accessors ───────────────────────────────────────────────────────────

    public function getValorLiquidoAttribute(): float
    {
        return (float) $this->valor_total - (float) $this->taxa_cadastro;
    }

    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            'rascunho'              => 'Rascunho',
            'aguardando_assinatura' => 'Aguardando Assinatura',
            'assinado'              => 'Assinado',
            'cancelado'             => 'Cancelado',
            default                 => $this->status,
        };
    }

    public function getHasInvoicesAttribute(): bool
    {
        return $this->parcelas()->whereNotNull('invoice_id')->exists();
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    /**
     * Sincroniza as parcelas do contrato (AutorizacaoParcela) com as faturas reais (Invoice).
     * E regenera o PDF mantendo o mesmo número e caminho.
     */
    public static function syncParcelasWithInvoices(int $autorizacaoId)
    {
        $autorizacao = self::with(['parcelas'])->find($autorizacaoId);
        if (!$autorizacao) {
            return;
        }

        // Busca as faturas desta autorização
        $invoices = \App\Models\Invoice::where('group_id', 'autorizacao-' . $autorizacaoId)
            ->orderBy('due_date')
            ->orderBy('id')
            ->get();

        if ($invoices->isEmpty()) {
            return; // Evita apagar tudo se der erro ou se não houver faturas
        }

        \Illuminate\Support\Facades\DB::transaction(function () use ($autorizacao, $invoices) {
            // Apaga as parcelas antigas
            $autorizacao->parcelas()->delete();

            $numero = 1;
            $totalParcels = $invoices->count();

            foreach ($invoices as $invoice) {
                $autorizacao->parcelas()->create([
                    'numero' => $numero++,
                    'vencimento' => $invoice->due_date,
                    'valor' => $invoice->amount,
                    'payable_amount' => $invoice->payable_amount ?: $invoice->amount,
                    'invoice_id' => $invoice->id,
                ]);
            }

            // Opcional: Atualizar num_parcelas na autorização se mudou
            if ($autorizacao->num_parcelas != $totalParcels) {
                $autorizacao->updateQuietly(['num_parcelas' => $totalParcels]);
            }
        });

        // Regenerar o PDF
        $autorizacao->load(['cliente.enderecos', 'cliente.contatos', 'vendedor', 'parcelas']);

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.autorizacao', ['autorizacao' => $autorizacao])
            ->setPaper('a4', 'portrait')
            ->setOption(['isRemoteEnabled' => true, 'isHtml5ParserEnabled' => true, 'defaultFont' => 'sans-serif']);

        $filename = "autorizacoes/autorizacao-{$autorizacao->numero}.pdf";
        \Illuminate\Support\Facades\Storage::disk('public')->put($filename, $pdf->output());
        
        $autorizacao->updateQuietly(['pdf_path' => $filename]);
    }

    /**
     * Gera o próximo número sequencial de autorização.
     */
    public static function proximoNumero(): string
    {
        $max = static::whereRaw("numero ~ '^[0-9]+$'")
            ->selectRaw('MAX(CAST(numero AS INTEGER)) as max_num')
            ->value('max_num');
            
        return str_pad((string) ((int) $max + 1), 5, '0', STR_PAD_LEFT);
    }
}
