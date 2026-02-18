<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CampanhaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'cliente_id' => ['required', 'integer', 'exists:clientes,id'],
            'nome' => ['required', 'string', 'max:191'],
            'tipo' => ['required', 'string', 'in:banner,popup,destaque,combo'],
            'origem' => ['nullable', 'string', 'in:venda_nova,renovacao,upgrade'],

            'data_inicio' => ['required', 'date'],
            'data_fim' => ['required', 'date', 'after_or_equal:data_inicio'],

            /**
             * ✅ cidades_ids agora é opcional (placements globais não exigem cidades).
             * O frontend já valida (wizard).
             */
            'cidades_ids' => ['nullable', 'array'],
            'cidades_ids.*' => ['integer', 'exists:cidades,id'],

            'keywords' => ['nullable', 'array'],
            'keywords.*' => ['string', 'max:191'],

            /**
             * Placements (doc oficial) — opcional
             */
            'placements' => ['nullable', 'array'],
            'placements.*' => ['string', 'in:SEARCH_RESULT,SEGMENT_LISTING,HOME_TOP,POPUP_GLOBAL'],

            /**
             * Financeiro
             * Aceita UPPER e lowercase (compat)
             */
            'financeiro' => ['nullable', 'array'],
            'financeiro.status' => [
                'nullable',
                'string',
                'in:AGUARDANDO_PAGAMENTO,PAGO,CORTESIA,aguardando_pagamento,pago,cortesia',
            ],
            'financeiro.forma' => ['nullable', 'string', 'max:30'],
            'financeiro.valor' => ['nullable', 'numeric', 'min:0'],
            'financeiro.vencimento' => ['nullable', 'date'],
            'financeiro.pago_em' => ['nullable', 'date'],
            'financeiro.observacao' => ['nullable', 'string'],

            'gerar_tickets' => ['nullable', 'boolean'],
            'prioridade' => ['nullable', 'string', 'in:baixa,media,alta'],
            'due_at' => ['nullable', 'date'],

            /**
             * Plano: seu schema tem plano_id (não string)
             */
            'plano_id' => ['nullable', 'integer'],
        ];
    }
}
