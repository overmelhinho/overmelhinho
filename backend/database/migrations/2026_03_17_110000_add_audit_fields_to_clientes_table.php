<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clientes', function (Blueprint $blueprint) {
            $blueprint->timestamp('last_audit_at')->nullable();
            $blueprint->string('audit_status')->default('ok'); // ok, pending, scanning
            $blueprint->json('audit_differences')->nullable(); // Guardar o que a IA achou de diferente
        });
    }

    public function down(): void
    {
        Schema::table('clientes', function (Blueprint $blueprint) {
            $blueprint->dropColumn(['last_audit_at', 'audit_status', 'audit_differences']);
        });
    }
};
