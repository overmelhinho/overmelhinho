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
        'sync_status',
    ];

    protected $casts = [
        'amount'          => 'decimal:2',
        'permuta_amount'  => 'decimal:2',
        'payable_amount'  => 'decimal:2',

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

    /**
     * Scope para buscar faturas por nome do cliente, CNPJ, telefones ou número da autorização
     */
    public function scopeSearch($query, $search)
    {
        if (empty($search)) {
            return $query;
        }

        static $unaccentExists = null;
        if ($unaccentExists === null) {
            try {
                \Illuminate\Support\Facades\DB::select("SELECT unaccent('a')");
                $unaccentExists = true;
            } catch (\Exception $e) {
                $unaccentExists = false;
            }
        }

        return $query->where(function ($subQuery) use ($search, $unaccentExists) {
            // 1. Busca por campos do cliente (nome, CNPJ, telefones)
            $subQuery->whereHas('client', function ($q) use ($search, $unaccentExists) {
                $q->where(function ($inner) use ($search, $unaccentExists) {
                    if ($unaccentExists) {
                        $inner->whereRaw("unaccent(nome_fantasia) ilike unaccent(?)", ["%{$search}%"])
                              ->orWhere('cpf_cnpj', 'like', "%{$search}%");
                    } else {
                        $inner->where('nome_fantasia', 'ilike', "%{$search}%")
                              ->orWhere('cpf_cnpj', 'like', "%{$search}%");
                    }
                });

                // Busca por telefones de contato
                $q->orWhereHas('contatos', function ($qContatos) use ($search) {
                    $digits = preg_replace('/\D/', '', $search);
                    $qContatos->where('telefone_principal', 'like', "%{$search}%")
                              ->orWhere('telefone_secundario', 'like', "%{$search}%")
                              ->orWhere('celular', 'like', "%{$search}%")
                              ->orWhere('telefone_outro', 'like', "%{$search}%");

                    if (!empty($digits)) {
                        $qContatos->orWhereRaw("regexp_replace(telefone_principal, '[^0-9]', '', 'g') like ?", ["%{$digits}%"])
                                  ->orWhereRaw("regexp_replace(telefone_secundario, '[^0-9]', '', 'g') like ?", ["%{$digits}%"])
                                  ->orWhereRaw("regexp_replace(celular, '[^0-9]', '', 'g') like ?", ["%{$digits}%"])
                                  ->orWhereRaw("regexp_replace(telefone_outro, '[^0-9]', '', 'g') like ?", ["%{$digits}%"]);
                    }
                });

                // Busca por telefone do endereço
                $q->orWhereHas('enderecos', function ($qEnderecos) use ($search) {
                    $digits = preg_replace('/\D/', '', $search);
                    $qEnderecos->where('telefone', 'like', "%{$search}%");

                    if (!empty($digits)) {
                        $qEnderecos->orWhereRaw("regexp_replace(telefone, '[^0-9]', '', 'g') like ?", ["%{$digits}%"]);
                    }
                });
            });

            // 2. Busca pelo número da autorização (se for numérico)
            if (is_numeric($search)) {
                $authId = \App\Models\Autorizacao::where('numero', $search)->value('id');
                if ($authId) {
                    $subQuery->orWhere('group_id', 'autorizacao-' . $authId);
                }
            }
        });
    }
}
