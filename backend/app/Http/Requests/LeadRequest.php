<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LeadRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        $rules = [
            'email'         => 'nullable|email|max:255',
            'telefone'      => 'nullable|string|max:20',
            'origem'        => 'nullable|string|max:100',
            'status'        => 'nullable|string|max:100',
            'responsavel'   => 'nullable|string|max:255',
            'observacoes'   => 'nullable|string',
            'motivo_perda'  => 'nullable|string', // <- adicionado aqui
            'data_follow_up' => 'nullable|date',	
        ];

        if ($this->isMethod('post')) {
            $rules['nome'] = 'required|string|max:255';
        } else {
            $rules['nome'] = 'sometimes|required|string|max:255';
        }

        return $rules;
    }
}
