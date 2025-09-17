<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run()
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Permissões do sistema
        $permissions = [
            'create users',
            'edit users',
            'delete users',
            'view users',
            'manage roles',
            'manage permissions',
        ];
        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'web']);
        }

        // Roles
        $admin = Role::firstOrCreate(['name' => 'Admin', 'guard_name' => 'web']);
        $diretor = Role::firstOrCreate(['name' => 'Diretor', 'guard_name' => 'web']);

        // Vincular permissões
        $admin->syncPermissions(Permission::all());
        $diretor->syncPermissions([
            'create users', 'edit users', 'view users',
        ]);
    }
}
