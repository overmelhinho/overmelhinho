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

        // Query base: buscar cidades
        $query = Cidade::query()
            ->select(['id', 'nome', 'uf'])
            ->distinct()
            ->orderBy('nome');

        // 1. Caso venha ids=1,2,3 (hidratar labels das selecionadas) - Sem filtro restrito para não bugar exibição
        if ($ids->isNotEmpty()) {
            $query->whereIn('id', $ids->all());

            return response()->json([
                'data' => $query->get(),
            ]);
        }

        // 2. Trava o sistema para exibir e buscar apenas no grupo das 28 cidades autorizadas
        $cidadesPermitidas = [
            'Alto Feliz', 'Arroio do Sal', 'Barão', 'Bento Gonçalves', 'Boa Vista do Sul',
            'Bom Princípio', 'Campo Bom', 'Canela', 'Carlos Barbosa', 'Caxias do Sul',
            'Coronel Pilar', 'Farroupilha', 'Feliz', 'Flores da Cunha', 'Garibaldi',
            'Gramado', 'Lajeado', 'Monte Belo do Sul', 'Nova Prata', 'Nova Roma do Sul',
            'Novo Hamburgo', 'Pinto Bandeira', 'Salvador do Sul', 'São Marcos',
            'São Pedro da Serra', 'São Sebastião do Caí', 'São Vendelino', 'Veranópolis'
        ];

        $query->where('uf', 'RS')
              ->whereIn(\Illuminate\Support\Facades\DB::raw('trim(nome)'), $cidadesPermitidas);

        // 3. Busca por texto (q=...) - Usando 'ilike' para busca case-insensitive no PostgreSQL
        if ($q !== '') {
            $query->where(function ($sub) use ($q) {
                $sub->where('nome', 'ilike', "%{$q}%")
                    ->orWhere('uf', 'ilike', "%{$q}%");
            });
        }
        
        // Limita a 150 registros para evitar travamento se buscar vazio
        $query->limit(150);

        return response()->json([
            'data' => $query->get(),
        ]);
    }
}
