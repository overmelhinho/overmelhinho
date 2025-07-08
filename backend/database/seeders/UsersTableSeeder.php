<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UsersTableSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('users')->insert([
            [
                'name' => 'João Teste',
                'email' => 'joao@example.com',
                'password' => Hash::make('senha123'),
            ],
            [
                'name' => 'Maria Teste',
                'email' => 'maria@example.com',
                'password' => Hash::make('senha123'),
            ]
        ]);
    }
}
