<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RedeSocialRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'tipo' => 'required|string|max:50',
            'url'  => 'nullable|string|max:500',
        ];
    }
}
