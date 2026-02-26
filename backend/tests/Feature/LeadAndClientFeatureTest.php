<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Lead;
use App\Models\Cliente;
use App\Models\Segmento;
use App\Models\Cidade;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LeadAndClientFeatureTest extends TestCase
{
    use RefreshDatabase;

    protected $admin;

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

        // Create initial data for segments and cities
        Segmento::create(['nome' => 'Tecnologia']);
        Cidade::create(['nome' => 'Porto Alegre', 'estado' => 'RS']);
    }

    /** @test */
    public function it_creates_a_lead_successfully()
    {
        $payload = [
            'nome'        => 'João Lead',
            'email'       => 'joao.lead@example.com',
            'telefone'    => '51999999999',
            'origem'      => 'site',
            'status'      => 'novo',
            'responsavel' => 'Admin Test'
        ];

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/v1/leads', $payload);

        $response->assertStatus(201);
        $this->assertDatabaseHas('leads', [
            'nome' => 'João Lead',
            'email' => 'joao.lead@example.com'
        ]);
    }

    /** @test */
    public function it_edits_a_lead_successfully()
    {
        $lead = Lead::create([
            'nome' => 'Lead Original',
            'email' => 'original@test.com',
            'origem' => 'manual',
            'status' => 'novo'
        ]);

        $payload = [
            'nome' => 'Lead Alterado',
            'status' => 'em_contato'
        ];

        $response = $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/v1/leads/{$lead->id}", $payload);

        $response->assertStatus(200);
        $this->assertDatabaseHas('leads', [
            'id' => $lead->id,
            'nome' => 'Lead Alterado',
            'status' => 'em_contato'
        ]);
    }

    /** @test */
    public function it_validates_required_fields_for_lead()
    {
        $payload = [
            'email' => 'invalido'
        ];

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/v1/leads', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['nome']);
    }

    /** @test */
    public function it_creates_a_client_with_full_payload()
    {
        $segmento = Segmento::first();
        
        $payload = [
            'nome_fantasia' => 'Empresa Teste Full',
            'cpf_cnpj'      => '12.345.678/0001-90',
            'tipo_cliente'  => 'pagante',
            'status_assinatura' => 'ativa',
            'segmentos'     => [$segmento->id],
            'endereco'      => [
                'cep' => '90000-000',
                'estado' => 'RS',
                'cidade' => 'Porto Alegre',
                'bairro' => 'Centro',
                'rua' => 'Rua Teste',
                'numero' => '123'
            ],
            'contatos' => [
                [
                    'nome_contato' => 'Contato Teste',
                    'email_principal' => 'contato@empresa.com',
                    'telefone_principal' => '5133333333'
                ]
            ]
        ];

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/v1/clientes', $payload);

        $response->assertStatus(201);
        
        $this->assertDatabaseHas('clientes', ['nome_fantasia' => 'Empresa Teste Full']);
        $this->assertDatabaseHas('enderecos', ['rua' => 'Rua Teste']);
        $this->assertDatabaseHas('contatos', ['email_principal' => 'contato@empresa.com']);
    }
}
