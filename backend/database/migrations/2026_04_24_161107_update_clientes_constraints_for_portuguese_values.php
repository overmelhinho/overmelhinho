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
            if (DB::getDriverName() === 'pgsql') {
                DB::statement("ALTER TABLE clientes DROP CONSTRAINT IF EXISTS clientes_best_contact_shift_check");
                DB::statement("ALTER TABLE clientes ADD CONSTRAINT clientes_best_contact_shift_check CHECK (best_contact_shift IN ('morning', 'afternoon', 'both', 'manha', 'tarde', 'ambos'))");

                DB::statement("ALTER TABLE clientes DROP CONSTRAINT IF EXISTS clientes_contact_preference_check");
                DB::statement("ALTER TABLE clientes ADD CONSTRAINT clientes_contact_preference_check CHECK (contact_preference IN ('presential', 'call', 'email', 'whatsapp', 'presencial', 'ligacao'))");
            }
        });
    }

    public function down(): void
    {
        Schema::table('clientes', function (Blueprint $table) {
            if (DB::getDriverName() === 'pgsql') {
                DB::statement("ALTER TABLE clientes DROP CONSTRAINT IF EXISTS clientes_best_contact_shift_check");
                DB::statement("ALTER TABLE clientes ADD CONSTRAINT clientes_best_contact_shift_check CHECK (best_contact_shift IN ('morning', 'afternoon'))");

                DB::statement("ALTER TABLE clientes DROP CONSTRAINT IF EXISTS clientes_contact_preference_check");
                DB::statement("ALTER TABLE clientes ADD CONSTRAINT clientes_contact_preference_check CHECK (contact_preference IN ('presential', 'call', 'email', 'whatsapp'))");
            }
        });
    }
};
