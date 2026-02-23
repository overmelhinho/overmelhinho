<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use Spatie\Permission\Models\Role;

class UsersTableSeeder extends Seeder
{
    public function run(): void
    {
        // ✅ CORRIGIDO: usa o Model User (resolve HasRoles) e vincula roles após criação

        $adminRole      = Role::where('name', 'Admin')->first();
        $diretorRole    = Role::where('name', 'Diretor')->first();
        $comercialRole  = Role::where('name', 'Comercial')->first();
        $operacionalRole = Role::where('name', 'Operacional')->first();

        // Usuário Admin principal
        $admin = User::firstOrCreate(
            ['email' => 'admin@overmelhinho.com.br'],
            [
                'name'     => 'Administrador',
                'password' => Hash::make('admin@2024'),
            ]
        );
        if ($adminRole) $admin->syncRoles([$adminRole]);

        // Usuário de teste João (Diretor)
        $joao = User::firstOrCreate(
            ['email' => 'joao@example.com'],
            [
                'name'     => 'João Teste',
                'password' => Hash::make('senha123'),
            ]
        );
        if ($diretorRole) $joao->syncRoles([$diretorRole]);

        // Usuário de teste Maria (Comercial)
        $maria = User::firstOrCreate(
            ['email' => 'maria@example.com'],
            [
                'name'     => 'Maria Teste',
                'password' => Hash::make('senha123'),
            ]
        );
        if ($comercialRole) $maria->syncRoles([$comercialRole]);
    }
}
