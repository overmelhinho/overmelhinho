<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Lead;
use App\Models\Cliente;
use App\Models\Ticket;
use App\Models\Invoice;
use App\Models\TicketSubtask;
use App\Models\Plan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TicketsAndFinanceiroFeatureTest extends TestCase
{
    use RefreshDatabase;

    protected $admin;
    protected $comercial;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed roles and permissions
        $this->artisan('db:seed', ['--class' => 'RolesAndPermissionsSeeder']);

        // Create Admin user
        $this->admin = User::create([
            'name' => 'Admin Test',
            'email' => 'admin@test.com',
            'password' => bcrypt('password'),
        ]);
        $this->admin->assignRole('Admin');

        // Create Comercial user
        $this->comercial = User::create([
            'name' => 'Comercial User',
            'email' => 'comercial@test.com',
            'password' => bcrypt('password'),
        ]);
        $this->comercial->assignRole('Comercial');
    }

    /** @test */
    public function it_performs_full_crud_on_tickets()
    {
        // 1. Create a lead and client
        $lead = Lead::create([
            'nome' => 'Lead E2E Test Ticket',
            'email' => 'lead.ticket@example.com',
            'origem' => 'site',
            'status' => 'novo'
        ]);

        $client = Cliente::create([
            'nome_fantasia' => 'Cliente E2E Test Ticket',
            'tipo_cliente' => 'gratuito',
            'status_assinatura' => 'ativa'
        ]);

        // 2. Create Ticket
        $payload = [
            'lead_id' => $lead->id,
            'cliente_id' => $client->id,
            'titulo' => 'Ticket Teste E2E',
            'setor' => 'comercial',
            'descricao' => 'Descrição do ticket de teste',
            'prioridade' => 'alta',
            'tipo' => 'tarefa',
            'assignee_id' => $this->comercial->id,
            'due_at' => now()->addDays(2)->toIso8601String()
        ];

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/v1/tickets', $payload);

        $response->assertStatus(201);
        $ticketId = $response->json('data.id') ?? $response->json('id');

        $this->assertDatabaseHas('tickets', [
            'titulo' => 'Ticket Teste E2E',
            'setor' => 'comercial'
        ]);

        // 3. List Tickets
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/tickets');

        $response->assertStatus(200);

        // 4. Update Ticket Status
        $updatePayload = [
            'status' => 'resolvido',
            'titulo' => 'Ticket Teste E2E Alterado'
        ];

        $response = $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/v1/tickets/{$ticketId}", $updatePayload);

        $response->assertStatus(200);
        $this->assertDatabaseHas('tickets', [
            'id' => $ticketId,
            'status' => 'resolvido',
            'titulo' => 'Ticket Teste E2E Alterado'
        ]);

        // 5. Create Subtask
        $subtaskPayload = [
            'title' => 'Subtarefa 1'
        ];

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/v1/tickets/{$ticketId}/subtasks", $subtaskPayload);

        $response->assertStatus(201);
        $subtaskId = $response->json('data.id') ?? $response->json('id');

        $this->assertDatabaseHas('ticket_subtasks', [
            'ticket_id' => $ticketId,
            'title' => 'Subtarefa 1'
        ]);

        // 6. Toggle Subtask
        $response = $this->actingAs($this->admin, 'sanctum')
            ->patchJson("/api/v1/tickets/{$ticketId}/subtasks/{$subtaskId}/toggle");

        $response->assertStatus(200);

        // 7. Delete Subtask
        $response = $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/v1/tickets/{$ticketId}/subtasks/{$subtaskId}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('ticket_subtasks', [
            'id' => $subtaskId
        ]);
    }

    /** @test */
    public function it_manages_financeiro_invoices()
    {
        // 1. Create a client and plan
        $client = Cliente::create([
            'nome_fantasia' => 'Cliente E2E Test Invoice',
            'tipo_cliente' => 'pagante',
            'status_assinatura' => 'ativa'
        ]);

        $plan = Plan::create([
            'name' => 'Plano Teste',
            'price' => 150.00,
            'billing_cycle' => 'monthly'
        ]);

        // 2. Create Invoice for Client
        $payload = [
            'plan_id' => $plan->id,
            'due_date' => now()->addDays(10)->format('Y-m-d'),
            'amount' => 150.00,
            'payment_method' => 'boleto'
        ];

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/v1/clientes/{$client->id}/invoices", $payload);

        $response->assertStatus(201);
        
        $invoices = $response->json('invoices');
        $invoiceId = $invoices[0]['id'];

        $this->assertDatabaseHas('invoices', [
            'client_id' => $client->id,
            'plan_id' => $plan->id,
            'amount' => 150.00,
            'status' => 'pending'
        ]);

        // 3. List Client Invoices
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson("/api/v1/clientes/{$client->id}/invoices");

        $response->assertStatus(200);

        // 4. List All Invoices
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/financial/invoices');

        $response->assertStatus(200);

        // 5. Update Invoice Status
        $response = $this->actingAs($this->admin, 'sanctum')
            ->patchJson("/api/v1/financial/invoices/{$invoiceId}/status", [
                'status' => 'paid'
            ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('invoices', [
            'id' => $invoiceId,
            'status' => 'paid'
        ]);
    }

    /** @test */
    public function it_processes_partial_payments()
    {
        // 1. Create a client and plan
        $client = Cliente::create([
            'nome_fantasia' => 'Cliente E2E Partial Payment',
            'tipo_cliente' => 'pagante',
            'status_assinatura' => 'ativa'
        ]);

        $plan = Plan::create([
            'name' => 'Plano Teste Parcial',
            'price' => 150.00,
            'billing_cycle' => 'monthly'
        ]);

        // 2. Create Invoice
        $payload = [
            'plan_id' => $plan->id,
            'due_date' => now()->addDays(10)->format('Y-m-d'),
            'amount' => 150.00,
            'payment_method' => 'boleto'
        ];

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/v1/clientes/{$client->id}/invoices", $payload);

        $response->assertStatus(201);
        $invoiceId = $response->json('invoices')[0]['id'];

        // 3. Make first partial payment of 50.00
        $response = $this->actingAs($this->admin, 'sanctum')
            ->patchJson("/api/v1/financial/invoices/{$invoiceId}/edit", [
                'amount_paid' => 50.00,
                'due_date' => now()->addDays(5)->format('Y-m-d'),
                'payment_method' => 'pix',
                'justification' => 'Primeira baixa parcial'
            ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('invoices', [
            'id' => $invoiceId,
            'amount_paid' => 50.00,
            'payable_amount' => 100.00,
            'status' => 'pending'
        ]);

        // 4. Make second partial payment of 100.00 (settles the balance)
        $response = $this->actingAs($this->admin, 'sanctum')
            ->patchJson("/api/v1/financial/invoices/{$invoiceId}/edit", [
                'amount_paid' => 100.00,
                'due_date' => now()->addDays(5)->format('Y-m-d'),
                'payment_method' => 'pix',
                'justification' => 'Segunda baixa parcial e liquidacao'
            ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('invoices', [
            'id' => $invoiceId,
            'amount_paid' => 150.00,
            'payable_amount' => 0.00,
            'status' => 'paid'
        ]);
    }
}
