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
        Schema::table('autorizacoes', function (Blueprint $table) {
            $table->unsignedBigInteger('parent_id')->nullable()->after('id');
            $table->boolean('is_bonificacao')->default(false)->after('parent_id');
            $table->foreign('parent_id')->references('id')->on('autorizacoes')->onDelete('set null');
        });

        // Change numero to string to allow '000013-2'
        Schema::table('autorizacoes', function (Blueprint $table) {
            $table->string('numero', 50)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('autorizacoes', function (Blueprint $table) {
            $table->dropForeign(['parent_id']);
            $table->dropColumn(['parent_id', 'is_bonificacao']);
            // Reverting back to integer might lose data like '13-2', so we leave it as string or change back cautiously.
            // $table->unsignedBigInteger('numero')->change();
        });
    }
};
