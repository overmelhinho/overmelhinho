<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Cidade;
use Illuminate\Http\Request;

class CidadeController extends Controller
{
    public function index(Request $request)
    {
        $q = trim((string) $request->get('q', ''));
        $idsRaw = (string) $request->get('ids', '');
        $ids = collect(explode(',', $idsRaw))
            ->map(fn ($v) => (int) trim($v))
            ->filter(fn ($v) => $v > 0)
            ->unique()
            ->values();

        $operacionais = [
            'Alto Feliz', 'Arroio do Sal', 'Barão', 'Bento Gonçalves', 'Boa Vista do Sul',
            'Bom Princípio', 'Campo Bom', 'Canela', 'Carlos Barbosa', 'Caxias do Sul',
            'Coronel Pilar', 'Farroupilha', 'Feliz', 'Flores da Cunha', 'Garibaldi',
            'Gramado', 'Lajeado', 'Monte Belo do Sul', 'Nova Prata', 'Nova Roma do Sul',
            'Novo Hamburgo', 'Pinto Bandeira', 'Salvador do Sul', 'São Marcos',
            'São Pedro da Serra', 'São Sebastião do Caí', 'São Vendelino', 'Veranópolis'
        ];

        $query = Cidade::query()
            ->select(['id', 'nome', 'uf'])
            ->where('uf', 'RS')
            ->whereIn('nome', $operacionais)
            ->orderBy('nome');

        // Caso venha ids=1,2,3 (hidratar labels das selecionadas)
        if ($ids->isNotEmpty()) {
            $query->whereIn('id', $ids->all());

            return response()->json([
                'data' => $query->get(),
            ]);
        }

        // Busca por texto (q=...)
        if ($q !== '') {
            $query->where(function ($sub) use ($q) {
                // Postgres: busca case-insensitive robusta
                $sub->where('nome', 'ilike', "%{$q}%")
                    ->orWhere('uf', 'ilike', "%{$q}%");
            });

            // Limite para não pesar em digitação rápida
            $query->limit(100);
        } else {
            // Sem busca, ainda é OK retornar tudo (497), mas mantemos limite razoável se quiser
            // Se você quiser sempre listar tudo sem q, comente o limit abaixo.
            $query->limit(497);
        }

        return response()->json([
            'data' => $query->get(),
        ]);
    }
}
