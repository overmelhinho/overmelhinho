<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Renewal;
use App\Models\Cliente;
use App\Models\Ticket;
use App\Services\AuditLogger;
use Illuminate\Support\Str;

class RenewalController extends Controller
{
    /**
     * Lista todas as renovações (Admin)
     */
    public function index()
    {
        $renewals = Renewal::with('cliente')
            ->orderBy('expiration_date', 'asc')
            ->paginate(20);

        return response()->json($renewals);
    }

    /**
     * Busca os dados da renovação pelo token (Público)
     */
    public function showByToken($token)
    {
        $renewal = Renewal::with([
            'cliente.enderecos', 
            'cliente.contatos', 
            'cliente.redesSociais',
            'cliente.segmentos'
        ])
            ->where('magic_link_token', $token)
            ->firstOrFail();

        return response()->json($renewal);
    }

    /**
     * Aprova a renovação (Público)
     */
    public function approve($token)
    {
        $renewal = Renewal::where('magic_link_token', $token)->firstOrFail();
        
        if ($renewal->status === 'approved') {
             return response()->json(['message' => 'Renovação já aprovada.'], 400);
        }

        $renewal->update(['status' => 'approved']);

        // Registrar no Log de Auditoria
        app(AuditLogger::class)->log(
            'renew_approved',
            'cliente',
            $renewal->cliente_id,
            null,
            [
                'metadata' => [
                    'channel' => 'magic_link',
                    'renewal_id' => $renewal->id,
                    'tag' => 'Cliente Renovado Online'
                ]
            ]
        );

        // Criar ticket automático
        Ticket::create([
            'cliente_id' => $renewal->cliente_id,
            'titulo' => "Cliente Renovado Online: {$renewal->cliente->nome_fantasia}",
            'descricao' => "O cliente aprovou a renovação via link mágico. Vencimento: {$renewal->expiration_date->format('d/m/Y')}.",
            'setor' => 'financeiro',
            'prioridade' => 'media',
            'status' => 'aberto',
            'meta' => json_encode(['renewal_id' => $renewal->id, 'tag' => 'Cliente Renovado Online']),
        ]);

        return response()->json(['message' => 'Renovação confirmada com sucesso!']);
    }

    /**
     * Atualiza dados sugeridos (Público)
     */
    public function updateData(Request $request, $token)
    {
        $renewal = Renewal::where('magic_link_token', $token)->firstOrFail();
        
        $request->validate([
            'suggested_changes' => 'required|string',
        ]);

        $renewal->update([
            'status' => 'updated_data',
            'suggested_changes' => $request->suggested_changes,
        ]);

        // Registrar no Log de Auditoria
        app(AuditLogger::class)->log(
            'renew_data_update_requested',
            'cliente',
            $renewal->cliente_id,
            null,
            [
                'metadata' => [
                    'channel' => 'magic_link',
                    'renewal_id' => $renewal->id,
                    'suggested_changes' => $request->suggested_changes
                ]
            ]
        );

        // Criar ticket para o comercial revisar as alterações
        Ticket::create([
            'cliente_id' => $renewal->cliente_id,
            'titulo' => "Solicitação de Alteração de Dados: {$renewal->cliente->nome_fantasia}",
            'descricao' => "O cliente solicitou alterações de dados durante a renovação:\n\n{$request->suggested_changes}",
            'setor' => 'comercial',
            'prioridade' => 'media',
            'status' => 'aberto',
            'meta' => json_encode(['renewal_id' => $renewal->id]),
        ]);

        return response()->json(['message' => 'Solicitação de alteração enviada com sucesso.']);
    }

    /**
     * Gera um link de renovação sob demanda (Admin)
     */
    public function generateLink(Request $request)
    {
        $request->validate([
            'cliente_id' => 'required|exists:clientes,id',
            'expiration_date' => 'nullable|date',
        ]);

        $cliente = Cliente::findOrFail($request->cliente_id);
        
        $expirationDate = $request->expiration_date ?? $cliente->contract_ends_at ?? now()->addYear();

        // Tenta encontrar uma renovação existente que não esteja finalizada (aprovada/recusada)
        $renewal = Renewal::where('cliente_id', $cliente->id)
            ->whereIn('status', ['pending', 'sent', 'updated_data'])
            ->first();

        if ($renewal) {
            // Se já existe, apenas atualizamos a data e geramos um novo token se necessário
            $renewal->update([
                'expiration_date' => $expirationDate,
                'magic_link_token' => Str::random(64), // Novo token por segurança
                'status' => 'pending' // Reseta para pendente
            ]);
        } else {
            // Se não existe, cria do zero
            $renewal = Renewal::create([
                'cliente_id' => $cliente->id,
                'expiration_date' => $expirationDate,
                'status' => 'pending',
                'magic_link_token' => Str::random(64),
            ]);
        }

        return response()->json([
            'magic_link' => config('app.frontend_url') . "/renovar/{$renewal->magic_link_token}",
            'renewal' => $renewal
        ]);
    }
}
