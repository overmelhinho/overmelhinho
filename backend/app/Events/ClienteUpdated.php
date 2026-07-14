<?php

namespace App\Events;

use App\Models\Cliente;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ClienteUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $cliente;

    /**
     * Create a new event instance.
     */
    public function __construct(Cliente $cliente)
    {
        $this->cliente = $cliente;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        // Dispara para o canal genérico da aplicação. 
        // No futuro, pode ser um canal por empresa ou por vendedor.
        // O Header.tsx precisará escutar o "App.Models.User.{id}" ou um canal global como 'clientes'.
        // Como o Echo já escuta o canal do User em AuthContext (private-App.Models.User.X),
        // precisaríamos disparar pra todos os usuários se fosse global.
        // Para simplificar e economizar, vamos disparar num canal global privado (ou público se não tiver dados sensíveis totais)
        // ou criar um canal 'empresa'. Vamos usar um canal 'clientes' autorizado.
        return [
            new PrivateChannel('clientes'),
        ];
    }
    
    public function broadcastWith(): array
    {
        // Envia apenas o necessário para atualizar o cache Lite da Fase 5
        return [
            'id' => $this->cliente->id,
            'nome_fantasia' => $this->cliente->nome_fantasia,
            'razao_social' => $this->cliente->razao_social,
            'cpf_cnpj' => $this->cliente->cpf_cnpj,
            'logo_url' => $this->cliente->logo_url,
            'tipo_cliente' => $this->cliente->tipo_cliente,
            'status_assinatura' => $this->cliente->status_assinatura,
            'possui_publicidade' => $this->cliente->possui_publicidade,
        ];
    }
}
