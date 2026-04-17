<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contatos', function (Blueprint $table) {
            if (!Schema::hasColumn('contatos', 'exibir_email')) {
                $table->boolean('exibir_email')->default(true)->after('exibir_tel_outro');
            }
        });
    }

    public function down(): void
    {
        Schema::table('contatos', function (Blueprint $table) {
            if (Schema::hasColumn('contatos', 'exibir_email')) {
                $table->dropColumn('exibir_email');
            }
        });
    }
};
