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
        Schema::table('leads', function (Blueprint $coluna) {
            if (!Schema::hasColumn('leads', 'google_place_id')) {
                $coluna->string('google_place_id')->nullable()->index();
            }
            if (!Schema::hasColumn('leads', 'endereco')) {
                $coluna->text('endereco')->nullable();
            }
            if (!Schema::hasColumn('leads', 'referencia')) {
                $coluna->string('referencia')->nullable();
            }
            if (!Schema::hasColumn('leads', 'interesse')) {
                $coluna->text('interesse')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('leads', function (Blueprint $coluna) {
            $coluna->dropColumn(['google_place_id', 'endereco', 'referencia', 'interesse']);
        });
    }
};
