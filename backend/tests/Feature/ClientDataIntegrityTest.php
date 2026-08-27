<?php

namespace Tests\Feature;

use App\Models\Cliente;
use App\Models\User;
use App\Jobs\GenerateSeoKeywordsJob;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ClientDataIntegrityTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Crie um administrador para autenticação
        $this->admin = User::factory()->create();
        
        \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'Admin', 'guard_name' => 'web']);
        $this->admin->assignRole('Admin');
    }

    /**
     * Testa se o Job de SEO preserva a descrição e outros campos do cliente.
     */
    public function test_seo_job_preserves_client_data()
    {
        $cliente = Cliente::create([
            'nome_fantasia' => 'Clínica Exemplo',
            'descricao' => 'Descrição original super importante',
            'logo_url' => 'http://example.com/logo.jpg',
            'razao_social' => 'Clínica Exemplo LTDA',
            'seo_keywords' => null,
            'slug' => 'clinica-exemplo',
            'cpf_cnpj' => '12345678901234'
        ]);

        // Dispara o Job manualmente
        $job = new GenerateSeoKeywordsJob($cliente->id);
        $job->handle();

        $cliente->refresh();

        // O Job de SEO deve apenas atualizar palavras-chave (se houver segmentos e cidades, vai gerar algo, senão fica no default)
        // O importante é que a descrição e outros campos não sumam.
        $this->assertEquals('Descrição original super importante', $cliente->descricao);
        $this->assertEquals('http://example.com/logo.jpg', $cliente->logo_url);
        $this->assertEquals('Clínica Exemplo LTDA', $cliente->razao_social);
    }

    /**
     * Testa se o endpoint de salvar auditoria não apaga dados não enviados.
     */
    public function test_audit_save_preserves_missing_fields()
    {
        $cliente = Cliente::create([
            'nome_fantasia' => 'Clínica Exemplo',
            'descricao' => 'Descrição original super importante',
            'logo_url' => 'http://example.com/logo.jpg',
            'razao_social' => 'Clínica Exemplo LTDA',
            'registro_profissional' => 'CRM 12345',
            'slug' => 'clinica-exemplo-2',
            'cpf_cnpj' => '12345678901235'
        ]);

        // Simula o payload que o frontend (AuditDashboard) envia ao aceitar dados
        $payload = [
            'nome_fantasia' => 'Clínica Nova', // Nome alterado
            'observacoes' => 'Revisado via auditoria',
            // Note que NÃO estamos enviando descricao, logo_url, razao_social, nem registro_profissional
        ];

        $response = $this->actingAs($this->admin)->postJson("/api/v1/clientes/{$cliente->id}/audit/save", $payload);

        $response->assertStatus(200);

        $cliente->refresh();

        $this->assertEquals('Clínica Nova', $cliente->nome_fantasia);
        $this->assertEquals('12345678901235', $cliente->cpf_cnpj); // Continua o mesmo, auditSave não atualiza isso
        $this->assertEquals('Revisado via auditoria', $cliente->observacoes);
        
        // Estes não foram enviados no request, logo, o backend DEVE preservá-los (BUG 3 resolvido)
        $this->assertEquals('Descrição original super importante', $cliente->descricao);
        $this->assertEquals('http://example.com/logo.jpg', $cliente->logo_url);
        $this->assertEquals('Clínica Exemplo LTDA', $cliente->razao_social);
        $this->assertEquals('CRM 12345', $cliente->registro_profissional);
    }

    /**
     * Testa se o endpoint de update principal não apaga dados não enviados.
     */
    public function test_standard_update_preserves_missing_fields()
    {
        $cliente = Cliente::create([
            'nome_fantasia' => 'Clínica Exemplo',
            'descricao' => 'Descrição original super importante',
            'logo_url' => 'http://example.com/logo.jpg',
            'razao_social' => 'Clínica Exemplo LTDA',
            'registro_profissional' => 'CRM 12345',
            'slug' => 'clinica-exemplo-3',
            'cpf_cnpj' => '12345678901236'
        ]);

        $payload = [
            'nome_fantasia' => 'Clínica Exemplo Editada',
            // Enviamos apenas o que queremos editar
        ];

        $response = $this->actingAs($this->admin)->putJson("/api/v1/clientes/{$cliente->id}", $payload);

        $response->assertStatus(200);

        $cliente->refresh();

        $this->assertEquals('Clínica Exemplo Editada', $cliente->nome_fantasia);
        
        // Campos que não foram submetidos devem continuar intactos
        $this->assertEquals('Descrição original super importante', $cliente->descricao);
        $this->assertEquals('http://example.com/logo.jpg', $cliente->logo_url);
        $this->assertEquals('Clínica Exemplo LTDA', $cliente->razao_social);
        $this->assertEquals('CRM 12345', $cliente->registro_profissional);
    }
}
