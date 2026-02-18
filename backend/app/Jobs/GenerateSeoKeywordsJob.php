<?php

namespace App\Jobs;

use App\Models\Cliente;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Throwable;

class GenerateSeoKeywordsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 120;
    public int $tries = 3;
    public array $backoff = [10, 30, 60];

    public function __construct(public int $clienteId)
    {
    }

    public function handle(): void
    {
        try {
            if (!Schema::hasColumn('clientes', 'seo_keywords')) {
                Log::info('[SEO] Skip job (column seo_keywords missing)', [
                    'cliente_id' => $this->clienteId,
                ]);
                return;
            }

            /** @var Cliente|null $cliente */
            $cliente = Cliente::with(['enderecos', 'contatos', 'segmentos', 'cidadesAtendidas'])
                ->find($this->clienteId);

            if (!$cliente) {
                Log::warning('[SEO] Cliente not found', [
                    'cliente_id' => $this->clienteId,
                ]);
                return;
            }

            // Se manual, não sobrescreve
            if (Schema::hasColumn('clientes', 'seo_keywords_source')) {
                if (($cliente->seo_keywords_source ?? null) === 'manual') {
                    Log::info('[SEO] Skip job (manual source)', [
                        'cliente_id' => $this->clienteId,
                    ]);
                    return;
                }
            }

            Log::info('[SEO] Start generate keywords', [
                'cliente_id' => $this->clienteId,
            ]);

            $keywords = $this->generateKeywords($cliente);

            // ✅ JSONB: salva array direto (sem erro de Postgres ARRAY literal)
            $payload = [
                'seo_keywords' => $keywords,
                'seo_keywords_updated_at' => now(),
            ];

            if (Schema::hasColumn('clientes', 'seo_keywords_source')) {
                $payload['seo_keywords_source'] = 'generated';
            }

            $cliente->update($payload);

            Log::info('[SEO] Keywords generated', [
                'cliente_id' => $this->clienteId,
                'count' => count($keywords),
                'sample' => array_slice($keywords, 0, 5),
            ]);
        } catch (Throwable $e) {
            Log::error('[SEO] Job failed', [
                'cliente_id' => $this->clienteId,
                'message' => $e->getMessage(),
                'exception' => get_class($e),
            ]);

            throw $e;
        }
    }

    private function generateKeywords(Cliente $cliente): array
    {
        $nomeFantasia = trim((string) ($cliente->nome_fantasia ?? ''));
        $razao = trim((string) ($cliente->razao_social ?? ''));
        $alt = trim((string) ($cliente->nome_alternativo ?? ''));

        $segmentos = [];
        if ($cliente->relationLoaded('segmentos')) {
            foreach (($cliente->segmentos ?? []) as $s) {
                $n = trim((string) ($s->nome ?? ''));
                if ($n !== '') $segmentos[] = $n;
            }
        }

        $cidades = [];
        if ($cliente->relationLoaded('cidadesAtendidas')) {
            foreach (($cliente->cidadesAtendidas ?? collect())->take(3) as $c) {
                $nome = trim((string) ($c->nome ?? ''));
                $uf = trim((string) ($c->uf ?? ''));
                if ($nome === '') continue;

                $cidades[] = $uf ? "{$nome} {$uf}" : $nome;
                if ($uf) $cidades[] = "{$nome} - {$uf}";
            }
        }

        $bairro = '';
        $cidadeEndereco = '';
        $estadoEndereco = '';
        if ($cliente->relationLoaded('enderecos') && ($cliente->enderecos ?? null) && $cliente->enderecos->count() > 0) {
            $e = $cliente->enderecos->first();
            $bairro = trim((string) ($e->bairro ?? ''));
            $cidadeEndereco = trim((string) ($e->cidade ?? ''));
            $estadoEndereco = trim((string) ($e->estado ?? ''));
        }

        if (empty($cidades) && $cidadeEndereco !== '') {
            $cidades[] = $estadoEndereco ? "{$cidadeEndereco} {$estadoEndereco}" : $cidadeEndereco;
            if ($estadoEndereco) $cidades[] = "{$cidadeEndereco} - {$estadoEndereco}";
        }

        $raw = [];

        if ($nomeFantasia !== '') $raw[] = $nomeFantasia;
        if ($alt !== '') $raw[] = $alt;
        if ($razao !== '' && mb_strtolower($razao, 'UTF-8') !== mb_strtolower($nomeFantasia, 'UTF-8')) $raw[] = $razao;

        foreach ($segmentos as $seg) {
            $raw[] = $seg;

            foreach ($cidades as $cid) {
                $raw[] = "{$seg} em {$cid}";
                $raw[] = "{$seg} {$cid}";
                $raw[] = "{$seg} perto de mim {$cid}";
            }

            if ($bairro !== '' && !empty($cidades)) {
                $cid0 = $cidades[0];
                $raw[] = "{$seg} no {$bairro} {$cid0}";
                $raw[] = "{$seg} {$bairro} {$cid0}";
            }
        }

        if ($nomeFantasia !== '' && !empty($cidades)) {
            $cid0 = $cidades[0];
            $raw[] = "telefone {$nomeFantasia} {$cid0}";
            $raw[] = "whatsapp {$nomeFantasia} {$cid0}";
            $raw[] = "endereço {$nomeFantasia} {$cid0}";
            $raw[] = "como chegar {$nomeFantasia} {$cid0}";
        }

        $descricao = trim((string) ($cliente->descricao ?? ''));
        if ($descricao !== '' && !empty($segmentos) && !empty($cidades)) {
            $raw[] = "{$segmentos[0]} especializado em {$cidades[0]}";
        }

        return $this->normalize($raw, 20);
    }

    private function normalize(array $items, int $limit): array
    {
        $out = [];
        $seen = [];

        foreach ($items as $it) {
            $k = trim((string) $it);
            if ($k === '') continue;

            $k = preg_replace('/\s+/u', ' ', $k) ?? $k;
            $key = mb_strtolower($k, 'UTF-8');

            if (isset($seen[$key])) continue;
            $seen[$key] = true;

            $out[] = $k;
            if (count($out) >= $limit) break;
        }

        return $out;
    }
}
