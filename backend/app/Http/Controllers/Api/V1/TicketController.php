<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Cliente;
use App\Models\Ticket;
use App\Models\TicketLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class TicketController extends Controller
{
    /**
     * GET /v1/tickets
     * Filtros suportados:
     * - cliente_id
     * - setor
     * - status
     * - prioridade
     * - assignee_id
     * - my=1 (assignee_id = auth)
     * - open=1 (todos em aberto: aberto + assigned + em_andamento + aguardando_*)
     * - overdue=1 (vencidos)
     * - per_page (default 20, max 100)
     */
    public function index(Request $request)
    {
        $perPage = (int)($request->input('per_page', 20));
        if ($perPage <= 0)
            $perPage = 20;
        if ($perPage > 100)
            $perPage = 100;

        $q = Ticket::query()
            ->with([
            'cliente:id,nome_fantasia,razao_social,cpf_cnpj,logo_url',
            'createdBy:id,name,email',
            'assignee:id,name,email',
            'subtasks',
        ])
            ->withCount(['subtasks as completed_subtasks_count' => function ($query) {
            $query->where('is_completed', true);
        }])
            ->withCount('subtasks')
            ->orderBy('created_at', 'desc');

        if ($request->filled('cliente_id')) {
            $q->where('cliente_id', $request->input('cliente_id'));
        }

        if ($request->filled('setor')) {
            $q->where('setor', $request->input('setor'));
        }

        // open=1 -> "todos em aberto"
        if ($request->boolean('open')) {
            $q->whereIn('status', [
                'aberto',
                'assigned',
                'em_andamento',
                'aguardando_cliente',
                'aguardando_interno',
            ]);
        }
        elseif ($request->filled('status')) {
            $q->where('status', $request->input('status'));
        }

        if ($request->filled('prioridade')) {
            $q->where('prioridade', $request->input('prioridade'));
        }

        // Minha fila
        if ($request->boolean('my')) {
            $q->where('assignee_id', auth()->id());
        }
        elseif ($request->filled('assignee_id')) {
            $q->where('assignee_id', $request->input('assignee_id'));
        }

        // Vencidos
        if ($request->boolean('overdue')) {
            $q->whereNotNull('due_at')
                ->where('due_at', '<', now())
                ->whereNotIn('status', ['fechado', 'closed', 'cancelado', 'canceled']);
        }

        return response()->json([
            'success' => true,
            'data' => $q->paginate($perPage),
        ]);
    }

    /**
     * GET /v1/tickets/{id}
     * Retorna ticket com logs (timeline)
     */
    public function show($id)
    {
        $ticket = Ticket::with([
            'cliente:id,nome_fantasia,razao_social,cpf_cnpj,logo_url',
            'createdBy:id,name,email',
            'assignee:id,name,email',
            'logs.user:id,name,email',
            'subtasks.completedBy:id,name',
        ])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $ticket,
        ]);
    }

    /**
     * GET /v1/tickets/assignees?setor=criativo
     * Retorna usuários elegíveis por setor para delegação.
     * Segurança: somente Administrador/Diretor (ou perm manage_tickets).
     */
    public function assignees(Request $request)
    {
        if (!$this->canManageTickets(auth()->user())) {
            return response()->json([
                'success' => false,
                'message' => 'Sem permissão para listar usuários para delegação.',
            ], 403);
        }

        $allowedSetores = ['criativo', 'financeiro', 'admin', 'suporte'];

        $validated = $request->validate([
            'setor' => ['required', 'string', Rule::in($allowedSetores)],
        ]);

        $setor = $validated['setor'];

        $eligible = $this->eligibleUsersForSetor($setor);

        $data = $eligible->map(function ($u) {
            return [
            'id' => (int)$u->id,
            'name' => (string)$u->name,
            'email' => $u->email ?? null,
            ];
        })->values();

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * POST /v1/tickets
     * - se não vier assignee_id e houver só 1 usuário elegível ao setor, auto-atribui
     */
    public function store(Request $request)
    {
        $allowedSetores = ['criativo', 'financeiro', 'admin', 'suporte'];
        $allowedPrioridades = ['baixa', 'media', 'alta', 'urgente'];

        $validated = $request->validate([
            'cliente_id' => 'required|integer|exists:clientes,id',
            'setor' => ['required', 'string', 'max:30', Rule::in($allowedSetores)],
            'titulo' => 'required|string|max:191',
            'descricao' => 'nullable|string',
            'prioridade' => ['nullable', 'string', 'max:20', Rule::in($allowedPrioridades)],

            'tipo' => 'nullable|string|max:50',
            'assignee_id' => 'nullable|integer|exists:users,id',
            'due_at' => 'nullable|date',
            'meta' => 'nullable|array',
        ]);

        $assigneeId = $validated['assignee_id'] ?? null;

        // Auto-atribuição: se não veio assignee_id e existe apenas 1 elegível pro setor
        if (!$assigneeId) {
            $eligible = $this->eligibleUsersForSetor($validated['setor']);
            if ($eligible->count() === 1) {
                $assigneeId = (int)$eligible->first()->id;
            }
        }

        $ticket = Ticket::create([
            'cliente_id' => (int)$validated['cliente_id'],
            'created_by' => auth()->id(),
            'assignee_id' => $assigneeId,
            'setor' => $validated['setor'],
            'tipo' => $validated['tipo'] ?? null,
            'status' => 'aberto',
            'titulo' => $validated['titulo'],
            'descricao' => $validated['descricao'] ?? null,
            'prioridade' => $validated['prioridade'] ?? 'media',
            'due_at' => $validated['due_at'] ?? null,
            'meta' => $validated['meta'] ?? null,
        ]);

        $this->logAction($ticket->id, auth()->id(), 'created', 'Ticket criado');

        if (!empty($assigneeId)) {
            $this->logAction($ticket->id, auth()->id(), 'assigned', "Ticket atribuído (assignee_id={$assigneeId})");
        }

        // DISPARA A NOTIFICAÇÃO DO NOVO TICKET PARA A FILA "ASSIGNEE" OU "SETOR"
        $usersToNotify = null;
        if ($assigneeId) {
            $usersToNotify = \App\Models\User::where('id', $assigneeId)->get();
        }
        else {
            $usersToNotify = $this->eligibleUsersForSetor($ticket->setor);
        }

        if ($usersToNotify && $usersToNotify->isNotEmpty()) {
            \Illuminate\Support\Facades\Notification::send(
                $usersToNotify,
                new \App\Notifications\TicketAssignedNotification($ticket, 'Novo Ticket Criado', 'created')
            );
        }

        return response()->json([
            'success' => true,
            'data' => $ticket->load([
                'cliente:id,nome_fantasia,razao_social,cpf_cnpj,logo_url',
                'createdBy:id,name,email',
                'assignee:id,name,email',
            ]),
        ], 201);
    }

    /**
     * PATCH/PUT /v1/tickets/{id}
     * - permite delegar via assignee_id (com regras de permissão)
     * - criativo só resolve se tiver logo + imagens no cliente
     */
    public function update(Request $request, $id)
    {
        $ticket = Ticket::findOrFail($id);

        $allowedPrioridades = ['baixa', 'media', 'alta', 'urgente'];

        $allowedStatus = [
            'aberto', 'em_andamento', 'concluido', 'cancelado',
            'assigned', 'aguardando_cliente', 'aguardando_interno',
            'resolvido', 'fechado', 'closed', 'canceled',
        ];

        $validated = $request->validate([
            'status' => ['nullable', 'string', 'max:30', Rule::in($allowedStatus)],
            'titulo' => 'nullable|string|max:191',
            'descricao' => 'nullable|string',
            'prioridade' => ['nullable', 'string', 'max:20', Rule::in($allowedPrioridades)],

            'assignee_id' => 'nullable|integer|exists:users,id',
            'tipo' => 'nullable|string|max:50',
            'due_at' => 'nullable|date',
            'meta' => 'nullable|array',

            'comment' => 'nullable|string',
        ]);

        /**
         * Regra de permissão para delegação:
         * - usuário comum pode assumir a si mesmo (assignee_id = auth id)
         * - delegar para OUTRO usuário, ou remover responsável (null) => só Administrador/Diretor (ou perm manage_tickets)
         */
        if (array_key_exists('assignee_id', $validated)) {
            $requestedAssignee = $validated['assignee_id']; // pode ser null
            $authId = auth()->id();

            $isSelfAssign = !empty($requestedAssignee) && (int)$requestedAssignee === (int)$authId;
            $isRemove = empty($requestedAssignee);

            if (!$isSelfAssign) {
                if (!$this->canManageTickets(auth()->user())) {
                    return response()->json([
                        'success' => false,
                        'message' => $isRemove
                        ? 'Sem permissão para remover responsável do ticket.'
                        : 'Sem permissão para delegar ticket para outro usuário.',
                    ], 403);
                }
            }
        }

        /**
         * Regra Criativo:
         * só resolve/conclui/fecha se cliente tiver logo_url e imagens na galeria
         */
        if (array_key_exists('status', $validated) && $ticket->setor === 'criativo') {
            $target = $validated['status'];
            $isResolving = in_array($target, ['resolvido', 'concluido', 'fechado', 'closed'], true);

            if ($isResolving) {
                $clienteId = (int)($ticket->cliente_id ?? 0);

                if ($clienteId <= 0) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Não foi possível validar os materiais: ticket sem cliente vinculado.',
                    ], 422);
                }

                $check = $this->creativeAssetsCheck($clienteId);
                if (!$check['ok']) {
                    return response()->json([
                        'success' => false,
                        'message' => $check['message'],
                    ], 422);
                }
            }
        }

        $oldStatus = $ticket->status;
        $oldAssignee = $ticket->assignee_id;
        $oldPrioridade = $ticket->prioridade;

        $updateData = [];

        foreach (['status', 'titulo', 'descricao', 'prioridade', 'assignee_id', 'tipo', 'due_at', 'meta'] as $field) {
            if (array_key_exists($field, $validated)) {
                $updateData[$field] = $validated[$field];
            }
        }

        // Se atribuiu responsável e ticket ainda estava aberto, vira assigned automaticamente
        if (array_key_exists('assignee_id', $updateData) && !empty($updateData['assignee_id'])) {
            if (!array_key_exists('status', $updateData) && $ticket->status === 'aberto') {
                $updateData['status'] = 'assigned';
            }
        }

        // timestamps de resolução/fechamento
        if (array_key_exists('status', $updateData)) {
            $newStatus = $updateData['status'];

            if (in_array($newStatus, ['resolvido', 'concluido'], true)) {
                if (empty($ticket->resolved_at)) {
                    $updateData['resolved_at'] = now();
                }
            }

            if (in_array($newStatus, ['fechado', 'closed'], true)) {
                if (empty($ticket->closed_at)) {
                    $updateData['closed_at'] = now();
                }
                if (empty($ticket->resolved_at)) {
                    $updateData['resolved_at'] = now();
                }
            }

            if (in_array($newStatus, ['cancelado', 'canceled'], true)) {
                if (empty($ticket->closed_at)) {
                    $updateData['closed_at'] = now();
                }
            }
        }

        if (!empty($updateData)) {
            $ticket->update($updateData);
        }

        // Logs
        if (!empty($validated['comment'])) {
            $this->logAction($ticket->id, auth()->id(), 'comment', $validated['comment']);
        }

        if (array_key_exists('status', $updateData) && $oldStatus !== $ticket->status) {
            $this->logAction(
                $ticket->id,
                auth()->id(),
                'status_changed',
                "Status: {$oldStatus} → {$ticket->status}"
            );
        }

        if (array_key_exists('assignee_id', $updateData) && $oldAssignee !== $ticket->assignee_id) {
            $msg = $ticket->assignee_id
                ? "Responsável atribuído (assignee_id={$ticket->assignee_id})"
                : "Responsável removido";
            $this->logAction($ticket->id, auth()->id(), 'assigned', $msg);
        }

        if (array_key_exists('prioridade', $updateData) && $oldPrioridade !== $ticket->prioridade) {
            $this->logAction(
                $ticket->id,
                auth()->id(),
                'priority_changed',
                "Prioridade: {$oldPrioridade} → {$ticket->prioridade}"
            );
        }

        return response()->json([
            'success' => true,
            'data' => $ticket->load([
                'cliente:id,nome_fantasia,razao_social,cpf_cnpj,logo_url',
                'createdBy:id,name,email',
                'assignee:id,name,email',
                'logs.user:id,name,email',
            ]),
        ]);
    }

    /**
     * Verificação real do Criativo:
     * - logo_url preenchido
     * - >= 1 imagem em galeriaImagens
     */
    private function creativeAssetsCheck(int $clienteId): array
    {
        try {
            $cliente = Cliente::query()
                ->withCount('galeriaImagens')
                ->find($clienteId);

            if (!$cliente) {
                return ['ok' => false, 'message' => 'Cliente não encontrado para validar logo e imagens.'];
            }

            $logoOk = !empty($cliente->logo_url);
            $imgsOk = ((int)($cliente->galeria_imagens_count ?? 0)) > 0;

            if ($logoOk && $imgsOk) {
                return ['ok' => true, 'message' => 'ok'];
            }

            if (!$logoOk && !$imgsOk) {
                return ['ok' => false, 'message' => 'Não foi possível resolver: não foram encontradas LOGO e IMAGENS cadastradas no cliente.'];
            }

            if (!$logoOk) {
                return ['ok' => false, 'message' => 'Não foi possível resolver: não foi encontrada LOGO cadastrada no cliente.'];
            }

            return ['ok' => false, 'message' => 'Não foi possível resolver: não foram encontradas IMAGENS cadastradas na galeria do cliente.'];
        }
        catch (\Throwable $e) {
            Log::warning('creativeAssetsCheck failed', ['cliente_id' => $clienteId, 'error' => $e->getMessage()]);
            return ['ok' => false, 'message' => 'Não foi possível validar os materiais do cliente no momento. Tente novamente.'];
        }
    }

    /**
     * Checagem de "admin/gestor" do seu sistema atual
     * Roles atuais: editor, Diretor, Administrador, Comercial, Criativo
     */
    private function canManageTickets($user): bool
    {
        if (!$user)
            return false;

        try {
            if (method_exists($user, 'hasAnyRole') && $user->hasAnyRole(['Administrador', 'Diretor'])) {
                return true;
            }

            if (method_exists($user, 'can') && $user->can('manage_tickets')) {
                return true;
            }
        }
        catch (\Throwable $e) {
        // ignore
        }

        return false;
    }

    /**
     * Mapeia setor -> roles elegíveis
     */
    private function eligibleUsersForSetor(string $setor)
    {
        $map = [
            'criativo' => ['Criativo'],
            'admin' => ['Administrador', 'Diretor'],
            'financeiro' => [], // quando criar role "Financeiro", coloque aqui
            'suporte' => [], // quando criar role "Suporte", coloque aqui
        ];

        $roles = $map[$setor] ?? [];

        if (empty($roles)) {
            return collect(); // sempre Collection
        }

        try {
            return User::query()->role($roles)->get(['id', 'name', 'email']);
        }
        catch (\Throwable $e) {
            return collect();
        }
    }

    public function storeSubtask(Request $request, $ticketId)
    {
        $ticket = Ticket::findOrFail($ticketId);

        $validated = $request->validate([
            'title' => 'required|string|max:255'
        ]);

        $subtask = $ticket->subtasks()->create([
            'title' => $validated['title'],
            'is_completed' => false
        ]);

        $this->logAction($ticket->id, auth()->id(), 'subtask_created', "Subtarefa adicionada: {$subtask->title}");

        return response()->json([
            'success' => true,
            'data' => $subtask
        ], 201);
    }

    public function toggleSubtask(Request $request, $ticketId, $subtaskId)
    {
        $subtask = \App\Models\TicketSubtask::where('ticket_id', $ticketId)->findOrFail($subtaskId);

        $subtask->is_completed = !$subtask->is_completed;
        $subtask->completed_at = $subtask->is_completed ? now() : null;
        $subtask->completed_by = $subtask->is_completed ? auth()->id() : null;
        $subtask->save();

        $status = $subtask->is_completed ? 'concluída' : 'reaberta';
        $this->logAction($ticketId, auth()->id(), 'subtask_toggled', "Subtarefa {$status}: {$subtask->title}");

        return response()->json([
            'success' => true,
            'data' => $subtask->load('completedBy:id,name')
        ]);
    }

    public function destroySubtask($ticketId, $subtaskId)
    {
        $subtask = \App\Models\TicketSubtask::where('ticket_id', $ticketId)->findOrFail($subtaskId);
        $title = $subtask->title;
        $subtask->delete();

        $this->logAction($ticketId, auth()->id(), 'subtask_deleted', "Subtarefa removida: {$title}");

        return response()->json([
            'success' => true,
            'message' => 'Subtarefa removida.'
        ]);
    }

    private function logAction(int $ticketId, ?int $userId, string $action, ?string $message = null): void
    {
        try {
            TicketLog::create([
                'ticket_id' => $ticketId,
                'user_id' => $userId,
                'action' => $action,
                'message' => $message,
            ]);
        }
        catch (\Throwable $e) {
            Log::warning('TicketLog create failed', [
                'ticket_id' => $ticketId,
                'user_id' => $userId,
                'action' => $action,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
