<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('galerias_imagens', function (Blueprint $table) {
            $table->string('thumb_url')->nullable()->after('url');
        });
    }

    public function down()
    {
        Schema::table('galerias_imagens', function (Blueprint $table) {
            $table->dropColumn('thumb_url');
        });
    }
};
