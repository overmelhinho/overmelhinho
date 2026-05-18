<?php

namespace App\Services;

use Illuminate\Support\Str;

class SlugService
{
    /**
     * Gera um slug altamente sanitizado, removendo acentos, cedilhas e caracteres especiais.
     * 
     * @param string|null $text
     * @return string|null
     */
    public static function create(?string $text): ?string
    {
        if (empty($text)) {
            return null;
        }

        // 1. Converter para minúsculo e remover espaços extras
        $text = mb_strtolower(trim($text), 'UTF-8');

        // 2. Mapeamento manual de caracteres para garantir substituição correta
        $map = [
            'á' => 'a', 'à' => 'a', 'â' => 'a', 'ã' => 'a', 'ä' => 'a',
            'é' => 'e', 'è' => 'e', 'ê' => 'e', 'ë' => 'e',
            'í' => 'i', 'ì' => 'i', 'î' => 'i', 'ï' => 'i',
            'ó' => 'o', 'ò' => 'o', 'ô' => 'o', 'õ' => 'o', 'ö' => 'o',
            'ú' => 'u', 'ù' => 'u', 'û' => 'u', 'ü' => 'u',
            'ç' => 'c', 'ñ' => 'n', 'ý' => 'y', 'ÿ' => 'y',
            'æ' => 'ae', 'œ' => 'oe',
        ];

        $text = strtr($text, $map);

        // 3. Remover qualquer caractere que não seja letra, número ou espaço
        $text = preg_replace('/[^a-z0-9\s-]/', '', $text);

        // 4. Utilizar o helper nativo do Laravel para finalização (limpeza de hífens duplos, etc)
        return Str::slug($text);
    }
}
