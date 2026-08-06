<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class GaleriaImagemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'url'       => 'required|string|max:255',
            'legenda'   => 'nullable|string|max:191',
            'ordem'     => 'nullable|integer|min:0',
            'thumb_url' => 'nullable|string|max:255',
            // 🔒 ANTI-WEB SHELL
            'imagem'    => 'nullable|file|image|mimes:jpeg,png,jpg,webp,svg|max:10240',
        ];
    }
}
