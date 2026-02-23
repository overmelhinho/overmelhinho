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

        // ✅ Todas as permissões utilizadas no front-end e back-end
        $permissions = [
            // Usuários
            'create users',
            'edit users',
            'delete users',
            'view users',
            'manage_users',

            // Roles e Permissões
            'manage roles',
            'manage permissions',
            'manage_roles',
            'manage_permissions',

            // Dashboard
            'view_dashboard',

            // Leads
            'view_lead',
            'create_lead',
            'edit_lead',
            'delete_lead',

            // Clientes
            'view_client',
            'create_cliente',
            'edit_cliente',
            'update_cliente',
            'delete_cliente',
            'manage_client',
            'manage_clients',
            'manage clients',

            // Campanhas
            'view_campaign',
            'view_campaigns',
            'view_campanha',
            'view_campanhas',
            'create_campaign',
            'create_campaigns',
            'create_campanha',
            'create_campanhas',
            'update_campaign',
            'edit_campaign',
            'update_campanha',
            'edit_campanha',
            'manage_campaigns',
            'manage_campaign',
            'manage campanhas',
            'manage_campanhas',

            // Tickets
            'view_ticket',
            'create_ticket',
            'edit_ticket',
            'manage_ticket',

            // Relatórios
            'view_report',

            // Criativo
            'manage_creative',

            // Configurações
            'manage_settings',

            // Financeiro
            'view_financial',
            'manage_financial',

            // Vagas
            'view_jobs',
            'manage_jobs',

            // SEO
            'view_seo',
            'manage_seo',
        ];

        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'web']);
        }

        // ✅ Permissões totais para o Admin
        $allPermissions = Permission::all();

        // Role Admin (acesso total)
        $admin = Role::firstOrCreate(['name' => 'Admin', 'guard_name' => 'web']);
        $admin->syncPermissions($allPermissions);

        // Role Diretor (acesso amplo, sem gerenciar permissões)
        $diretor = Role::firstOrCreate(['name' => 'Diretor', 'guard_name' => 'web']);
        $diretor->syncPermissions([
            'create users', 'edit users', 'view users', 'manage_users',
            'view_dashboard',
            'view_lead', 'create_lead', 'edit_lead',
            'view_client', 'create_cliente', 'edit_cliente', 'update_cliente', 'manage_client', 'manage_clients',
            'view_campaign', 'view_campaigns', 'view_campanha', 'view_campanhas',
            'create_campaign', 'create_campanha', 'update_campaign', 'edit_campaign', 'manage_campaigns', 'manage_campanhas',
            'view_ticket', 'create_ticket', 'edit_ticket', 'manage_ticket',
            'view_report',
            'view_financial', 'manage_financial',
            'view_jobs', 'manage_jobs',
            'view_seo',
        ]);

        // Role Comercial (acesso às áreas de vendas)
        $comercial = Role::firstOrCreate(['name' => 'Comercial', 'guard_name' => 'web']);
        $comercial->syncPermissions([
            'view_dashboard',
            'view_lead', 'create_lead', 'edit_lead',
            'view_client', 'create_cliente', 'edit_cliente',
            'view_campaign', 'view_campanha',
            'view_ticket', 'create_ticket',
            'view_report',
        ]);

        // Role Operacional (acesso interno limitado)
        $operacional = Role::firstOrCreate(['name' => 'Operacional', 'guard_name' => 'web']);
        $operacional->syncPermissions([
            'view_dashboard',
            'view_client',
            'view_ticket', 'create_ticket', 'edit_ticket', 'manage_ticket',
            'view_campaign', 'view_campanha',
            'manage_creative',
        ]);
    }
}
