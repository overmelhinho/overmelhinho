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
        Schema::table('invoices', function (Blueprint $table) {
            $table->string('payment_method')->nullable()->default('boleto')->after('status');
            $table->integer('parcel_number')->nullable()->default(1)->after('payment_method');
            $table->integer('total_parcels')->nullable()->default(1)->after('parcel_number');
            $table->string('group_id')->nullable()->after('total_parcels')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn(['payment_method', 'parcel_number', 'total_parcels', 'group_id']);
        });
    }
};
