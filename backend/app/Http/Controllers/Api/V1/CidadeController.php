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

        // Query base: buscar cidades que possuem clientes ativos para exibir no site
        $query = Cidade::query()
            ->select(['id', 'nome', 'uf'])
            ->where('uf', 'RS')
            ->where(function ($sub) {
                // 1. Cidades onde os clientes possuem endereço cadastrado
                $sub->whereHas('enderecos.cliente', function ($c) {
                    $c->where('exibir_no_site', true);
                })
                // 2. OU cidades que o cliente marcou que atende (Expansão Regional)
                ->orWhereHas('clientesQueAtendem', function ($c) {
                    $c->where('exibir_no_site', true);
                });
            })
            ->distinct()
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
                $sub->where('nome', 'ilike', "%{$q}%")
                    ->orWhere('uf', 'ilike', "%{$q}%");
            });
            $query->limit(100);
        }

        return response()->json([
            'data' => $query->get(),
        ]);
    }
}
