<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    protected $fillable = [
        'client_id',
        'plan_id',
        'amount',
        'due_date',
        'status',
        'tiny_account_id',
        'payment_url',
        'justification',
        'action_date',
        'payment_method',
        'parcel_number',
        'total_parcels',
        'group_id',
        // Permuta (Barter/Trade)
        'is_permuta',
        'permuta_amount',
        'payable_amount',
        'permuta_description',
    ];

    protected $casts = [
        'amount'          => 'decimal:2',
        'permuta_amount'  => 'decimal:2',
        'payable_amount'  => 'decimal:2',
        'is_permuta'      => 'boolean',
        'due_date'        => 'date',
        'action_date'     => 'datetime',
    ];

    public function client()
    {
        return $this->belongsTo(Cliente::class);
    }

    public function plan()
    {
        return $this->belongsTo(Plan::class);
    }

    public function autorizacao()
    {
        return $this->belongsTo(Autorizacao::class, 'group_id', 'id')
            ->where('group_id', 'LIKE', 'autorizacao-%');
    }

    // Accessor para facilitar o acesso ao vendedor
    public function vendedor()
    {
        return $this->hasOneThrough(
            User::class,
            Autorizacao::class,
            'id', // Local key on autorizacoes
            'id', // Local key on users
            'group_id', // Foreign key on invoices (stored as autorizacao-ID)
            'vendedor_id' // Foreign key on autorizacoes
        );
    }
}
