<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */


public function up()
{
    Schema::table('leads', function (Blueprint $table) {
        $table->date('data_follow_up')->nullable()->after('motivo_perda');
    });
}

public function down()
{
    Schema::table('leads', function (Blueprint $table) {
        $table->dropColumn('data_follow_up');
    });
}


};
