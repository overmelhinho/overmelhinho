<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AutorizacaoParcela extends Model
{
    protected $table = 'autorizacao_parcelas';

    protected $fillable = [
        'autorizacao_id',
        'numero',
        'vencimento',
        'valor',
        'status',
        'invoice_id',
        'permuta_amount',
        'payable_amount',
    ];

    protected $casts = [
        'vencimento' => 'date',
        'valor'      => 'decimal:2',
        'permuta_amount' => 'decimal:2',
        'payable_amount' => 'decimal:2',
    ];

    public function autorizacao()
    {
        return $this->belongsTo(Autorizacao::class);
    }

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }
}
