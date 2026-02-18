<?php

namespace App\Services;

use App\Models\HistoricoAlteracao;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class HistoricoAlteracaoService
{
    public static function logAction(int $clienteId, string $acao, $valorNovo = null, $valorAntigo = null, ?int $usuarioId = null): void
    {
        try {
            HistoricoAlteracao::create([
                'cliente_id'    => $clienteId,
                'usuario_id'    => $usuarioId ?? Auth::id(),
                'campo_alterado'=> $acao,
                'valor_antigo'  => self::toText($valorAntigo),
                'valor_novo'    => self::toText($valorNovo),
            ]);
        } catch (\Throwable $e) {
            Log::warning('HISTORICO_LOG_FAIL', [
                'cliente_id' => $clienteId,
                'acao' => $acao,
                'error' => $e->getMessage(),
            ]);
        }
    }

    public static function logDiff(int $clienteId, array $before, array $after, array $onlyFields = [], ?int $usuarioId = null): void
    {
        $fields = !empty($onlyFields) ? $onlyFields : array_unique(array_merge(array_keys($before), array_keys($after)));

        foreach ($fields as $field) {
            $old = $before[$field] ?? null;
            $new = $after[$field] ?? null;

            if (self::same($old, $new)) continue;

            self::logAction($clienteId, $field, $new, $old, $usuarioId);
        }
    }

    private static function same($a, $b): bool
    {
        // Normaliza strings
        if (is_string($a)) $a = trim($a);
        if (is_string($b)) $b = trim($b);

        // Normaliza arrays/objetos
        if (is_array($a) || is_object($a)) $a = json_encode($a, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if (is_array($b) || is_object($b)) $b = json_encode($b, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        return (string)$a === (string)$b;
    }

    private static function toText($v): ?string
    {
        if ($v === null) return null;
        if (is_bool($v)) return $v ? 'true' : 'false';
        if (is_scalar($v)) return (string)$v;

        return json_encode($v, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }
}
