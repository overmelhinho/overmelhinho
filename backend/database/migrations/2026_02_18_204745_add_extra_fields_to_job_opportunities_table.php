<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration 
{
    public function up(): void
    {
        Schema::table('job_opportunities', function (Blueprint $table) {
            $table->integer('vacancies')->default(1)->after('city'); // Número de vagas
            $table->string('area')->nullable()->after('vacancies'); // Área profissional (ex: Alimentação)
            $table->string('role')->nullable()->after('area'); // Cargo específico
            $table->string('education_level')->nullable()->after('role'); // Nível de escolaridade
            $table->text('experience_required')->nullable()->after('education_level'); // Experiência exigida (rich text)
            $table->string('contact_email')->nullable()->after('experience_required'); // E-mail para receber candidatos
            $table->string('contact_whatsapp')->nullable()->after('contact_email'); // WhatsApp para receber candidatos
        });
    }

    public function down(): void
    {
        Schema::table('job_opportunities', function (Blueprint $table) {
            $table->dropColumn([
                'vacancies',
                'area',
                'role',
                'education_level',
                'experience_required',
                'contact_email',
                'contact_whatsapp',
            ]);
        });
    }
};
