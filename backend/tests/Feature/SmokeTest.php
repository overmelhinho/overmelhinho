<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;

class SmokeTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed básico para ter roles
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    /**
     * Teste 1: A API está respondendo?
     */
    public function test_api_shoud_be_online(): void
    {
        $response = $this->getJson('/api/v1/teste-segmento');
        $response->assertStatus(200);
    }

    /**
     * Teste 2: Login funciona?
     */
    public function test_login_flow(): void
    {
        // Criar usuário
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
        ]);

        // Tentar login
        $response = $this->postJson('/api/v1/login', [
            'email' => 'test@example.com',
            'password' => 'password',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['token']);
    }

    /**
     * Teste 3: Acesso a rotas protegidas (Admin)
     */
    public function test_admin_can_access_restricted_resources(): void
    {
        // Criar usuário Admin
        $user = User::factory()->create();
        $user->assignRole('Admin');

        // Autenticar com Sanctum
        Sanctum::actingAs($user, ['*']);

        // Testar listagem de Users (rota protegida)
        $this->getJson('/api/v1/users')
            ->assertStatus(200);

        // Testar listagem de Clientes (rota protegida)
        $this->getJson('/api/v1/clientes')
            ->assertStatus(200);
    }
}
