<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use App\Models\Cliente;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('clientes', function (Blueprint $table) {
            $table->string('slug')->nullable()->unique()->after('nome_fantasia');
        });

        // Populate existing slugs
        Cliente::all()->each(function ($cliente) {
            $slug = Str::slug($cliente->nome_fantasia);
            
            // Handle collisions
            $originalSlug = $slug;
            $count = 1;
            while (Cliente::where('slug', $slug)->exists()) {
                $slug = "{$originalSlug}-" . ($cliente->id ?? $count++);
            }

            $cliente->update(['slug' => $slug]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('clientes', function (Blueprint $table) {
            $table->dropColumn('slug');
        });
    }
};
