<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class PublicAdController extends Controller
{
    /**
     * ✅ Retorna campanhas ativas filtradas por cidade, keywords e tipo.
     */
    public function index(Request $request)
    {
        $now = now();
        $tipo = $request->query('tipo'); // BANNER, POPUP, etc.
        $cidadeId = $request->query('city_id');
        $keywords = $request->query('keywords'); // string separada por vírgula ou espaço
        $placement = $request->query('placement');

        $q = DB::table('campanhas as c')
            ->where('c.status', 'ativa')
            ->where(function ($query) use ($now) {
                $query->where(function ($sub) use ($now) {
                    $sub->whereDate('c.data_inicio', '<=', $now)
                        ->whereDate('c.data_fim', '>=', $now);
                })->orWhere(function ($sub) {
                    $sub->whereNull('c.data_inicio')->whereNull('c.data_fim');
                });
            });

        if ($tipo) {
            $q->whereRaw('UPPER(c.tipo) = ?', [strtoupper($tipo)]);
        }

        if ($placement) {
            $mediaTypes = [];
            if ($placement === 'HOME_TOP') {
                $mediaTypes = ['banner_topo'];
            } elseif ($placement === 'SEARCH_RESULT') {
                $mediaTypes = ['banner_keyword', 'imagem'];
            } elseif ($placement === 'POPUP_GLOBAL') {
                $mediaTypes = ['popup'];
            } elseif ($placement === 'SEGMENT_LISTING') {
                $mediaTypes = ['banner_segmento'];
            }

            if (!empty($mediaTypes)) {
                $q->whereExists(function ($sub) use ($mediaTypes) {
                    $sub->select(DB::raw(1))
                        ->from('campanha_midias')
                        ->whereColumn('campanha_id', 'c.id')
                        ->whereIn('status', ['publicado', 'ativa'])
                        ->whereIn('tipo', $mediaTypes);
                });
            }
        }

        // 1) Filtro de Cidade (Se a campanha tem cidades, a cidade_id deve estar lá)
        if ($cidadeId) {
            $q->where(function ($query) use ($cidadeId) {
                $query->whereExists(function ($sub) use ($cidadeId) {
                    $sub->select(DB::raw(1))
                        ->from('campanha_cidades')
                        ->whereColumn('campanha_id', 'c.id')
                        ->where('cidade_id', (int) $cidadeId);
                })->orWhereNotExists(function ($sub) {
                    $sub->select(DB::raw(1))
                        ->from('campanha_cidades')
                        ->whereColumn('campanha_id', 'c.id');
                });
            });
        }

        // 2) Filtro de Keywords
        if ($keywords) {
            $phrases = array_filter(array_map('trim', explode(',', $keywords)));
            if (!empty($phrases)) {
                $q->whereExists(function ($sub) use ($phrases) {
                    $sub->select(DB::raw(1))
                        ->from('campanha_keywords')
                        ->whereColumn('campanha_id', 'c.id')
                        ->where(function ($subInner) use ($phrases) {
                            foreach ($phrases as $phrase) {
                                $subInner->orWhere(function ($qAnd) use ($phrase) {
                                    $words = array_filter(explode(' ', $phrase));
                                    foreach ($words as $word) {
                                        $normalizedWord = $this->normalizeKeyword($word);
                                        $qAnd->where('keyword_normalizada', 'LIKE', '%' . $normalizedWord . '%');
                                    }
                                });
                            }
                        });
                });
            }
        }

        $q->leftJoin('clientes as cli', 'c.cliente_id', '=', 'cli.id')
          ->leftJoin('contatos as cont', 'cli.id', '=', 'cont.cliente_id');

        $cols = [
            'c.id', 'c.nome', 'c.tipo', 'c.url', 'c.cliente_id',
            'cli.nome_fantasia as cliente_nome', 'cli.slug as cliente_slug', 'cont.celular as cliente_whatsapp'
        ];

        if (Schema::hasColumn('campanhas', 'is_institucional')) {
            $cols[] = 'c.is_institucional';
        }
        
        $hasPlacementsJson = Schema::hasColumn('campanhas', 'placements_json');
        $hasPlacements = Schema::hasColumn('campanhas', 'placements');

        if ($hasPlacementsJson) {
            $cols[] = 'c.placements_json';
        } elseif ($hasPlacements) {
            $cols[] = 'c.placements';
        }

        $campanhas = $q->get($cols);
        
        // Se estiver vazio e houver filtros, tenta buscar institucionais (somente se a coluna existir)
        if ($campanhas->isEmpty() && ($cidadeId || $keywords) && Schema::hasColumn('campanhas', 'is_institucional')) {
            $qi = DB::table('campanhas as c')
                ->leftJoin('clientes as cli', 'c.cliente_id', '=', 'cli.id')
                ->leftJoin('contatos as cont', 'cli.id', '=', 'cont.cliente_id')
                ->where('c.status', 'ativa')
                ->whereRaw('c.is_institucional = true')
                ->where(function ($query) use ($now) {
                    $query->where(function ($sub) use ($now) {
                        $sub->whereDate('c.data_inicio', '<=', $now)
                            ->whereDate('c.data_fim', '>=', $now);
                    })->orWhere(function ($sub) {
                        $sub->whereNull('c.data_inicio')->whereNull('c.data_fim');
                    });
                });
                
            if ($tipo) {
                $qi->whereRaw('UPPER(c.tipo) = ?', [strtoupper($tipo)]);
            }
            
            $campanhas = $qi->get($cols);
        }

        $res = [];
        foreach ($campanhas as $camp) {
            // Pegar mídias ativas para esta campanha
            $midias = DB::table('campanha_midias')
                ->where('campanha_id', $camp->id)
                ->whereIn('status', ['publicado', 'ativa'])
                ->orderByDesc('versao')
                ->orderByDesc('id')
                ->get();

            if ($midias->isEmpty()) continue;

            // Organizar por tipo/slot (semelhante ao CampanhaMidiaController@ativas)
            $midiaRes = [];
            $tiposMidia = $midias->pluck('tipo')->unique();
            
            foreach ($tiposMidia as $tm) {
                $base = $midias->where('tipo', $tm);
                
                $desktop = $base->whereNotNull('desktop_url')->first();
                $mobile = $base->whereNotNull('mobile_url')->first();

                if ($desktop || $mobile) {
                    $dUrl = $desktop ? $desktop->desktop_url : null;
                    if ($dUrl && !\Illuminate\Support\Str::startsWith($dUrl, ['http://', 'https://'])) {
                        $dUrl = url($dUrl);
                    }

                    $mUrl = $mobile ? $mobile->mobile_url : null;
                    if ($mUrl && !\Illuminate\Support\Str::startsWith($mUrl, ['http://', 'https://'])) {
                        $mUrl = url($mUrl);
                    }

                    $midiaRes[$tm] = [
                        'desktop' => $desktop ? ['url' => $dUrl] : null,
                        'mobile'  => $mobile ? ['url' => $mUrl] : null,
                    ];
                }
            }

            if (empty($midiaRes)) continue;

            // Parse Placements
            $placements = [];
            $rawPlacements = $camp->placements_json ?? $camp->placements ?? null;
            if ($rawPlacements) {
                $decoded = json_decode($rawPlacements, true);
                if (is_array($decoded)) {
                    $placements = $decoded;
                }
            }

            $res[] = [
                'id' => $camp->id,
                'nome' => $camp->nome,
                'tipo' => $camp->tipo,
                'url' => $camp->url,
                'is_institucional' => (bool) ($camp->is_institucional ?? false),
                'placements' => $placements,
                'midias' => $midiaRes,
                'cliente' => [
                    'id' => $camp->cliente_id,
                    'nome' => $camp->cliente_nome ?? 'O Vermelhinho',
                    'slug' => $camp->cliente_slug,
                    'whatsapp' => $camp->cliente_whatsapp
                ]
            ];
        }

        return response()->json([
            'data' => $res,
            'count' => count($res)
        ]);
    }

    private function normalizeKeyword(string $original): string
    {
        $v = trim($original);
        $v = mb_strtolower($v);

        // remover acentos sem depender de ext intl
        $ascii = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $v);
        if (is_string($ascii) && $ascii !== '') {
            $v = $ascii;
        }

        // colapsa espaços
        $v = preg_replace('/\s+/', ' ', $v) ?? $v;

        return trim($v);
    }
}
