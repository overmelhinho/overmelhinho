<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class ClienteTimelineController extends Controller
{
    public function index(Request $request, int $clienteId)
    {
        $limit = (int) $request->query('limit', 50);
        $limit = max(1, min($limit, 200));

        // cursor formato: "2026-01-29T12:34:56.000000Z|123"
        $cursor = $request->query('cursor');
        $cursorCreatedAt = null;
        $cursorId = null;

        if ($cursor) {
            [$cursorCreatedAt, $cursorId] = array_pad(explode('|', $cursor, 2), 2, null);
        }

        $q = AuditLog::query()
            ->where('cliente_id', $clienteId)
            ->orderByDesc('created_at')
            ->orderByDesc('id');

        if ($cursorCreatedAt && $cursorId) {
            $q->where(function ($sub) use ($cursorCreatedAt, $cursorId) {
                $sub->where('created_at', '<', $cursorCreatedAt)
                    ->orWhere(function ($sub2) use ($cursorCreatedAt, $cursorId) {
                        $sub2->where('created_at', '=', $cursorCreatedAt)
                             ->where('id', '<', (int) $cursorId);
                    });
            });
        }

        $items = $q->limit($limit + 1)->get();

        $nextCursor = null;
        if ($items->count() > $limit) {
            $last = $items[$limit - 1];
            $nextCursor = $last->created_at->toISOString() . '|' . $last->id;
            $items = $items->take($limit);
        }

        return response()->json([
            'data' => $items->values(),
            'next_cursor' => $nextCursor,
        ]);
    }
}
