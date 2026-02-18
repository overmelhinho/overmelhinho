<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ClienteRequest extends FormRequest
{
    public function authorize()
    {
        return true; // ajuste com políticas se necessário
    }

    public function rules()
    {
        return [
            // Identificação
            'nome' => 'required|string|max:191',
            'razao_social' => 'required|string|max:191',
            'cnpj' => 'required|string|max:20|unique:clientes,cnpj,' . $this->cliente,

            // Contatos
            'email' => 'required|email|max:191',
            'telefone_principal' => 'required|string|max:20',
            'telefone_secundario' => 'nullable|string|max:20',
            'celular' => 'nullable|string|max:20',
            'responsavel' => 'nullable|integer|exists:usuarios,id',

            // Endereço
            'cep' => 'required|string|max:10',
            'estado' => 'required|string|max:2',
            'cidade' => 'required|string|max:100',
            'bairro' => 'required|string|max:100',
            'rua' => 'required|string|max:255',
            'numero' => 'required|string|max:20',
            'complemento' => 'nullable|string|max:255',

            // Redes Sociais
            'instagram' => 'nullable|url|max:255',
            'facebook' => 'nullable|url|max:255',
            'linkedin' => 'nullable|url|max:255',
            'youtube' => 'nullable|url|max:255',
            'tiktok' => 'nullable|url|max:255',
            'x' => 'nullable|url|max:255',

            // Outros dados
            'descricao' => 'nullable|string|max:1000',
            'palavras_chave' => 'nullable|string|max:255',
            'horario_atendimento' => 'nullable|string|max:255',

            // Segmentos
            'segmentos' => 'required|array|min:1',
            'segmentos.*' => 'integer|exists:segmentos,id',

            // Benefícios
            'beneficios' => 'nullable|array',
            'beneficios.*' => 'string|max:50',

            // Logotipo (upload)
            'logotipo' => 'nullable|file|image|max:2048',
        ];
    }
}
