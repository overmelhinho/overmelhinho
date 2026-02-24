<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('clientes', function (Blueprint $table) {
            $table->enum('contact_preference', ['presential', 'call', 'email', 'whatsapp'])->default('whatsapp')->after('status_assinatura');
            $table->enum('best_contact_shift', ['morning', 'afternoon'])->default('morning')->after('contact_preference');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('clientes', function (Blueprint $table) {
            $table->dropColumn(['contact_preference', 'best_contact_shift']);
        });
    }
};
