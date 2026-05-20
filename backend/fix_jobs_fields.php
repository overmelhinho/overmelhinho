<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\JobOpportunity;

$jobs = JobOpportunity::all();

$salaryMap = [
    '1' => 'Até R$ 1.000,00',
    '2' => 'R$ 1.000,00 a R$ 2.000,00',
    '3' => 'R$ 2.000,00 a R$ 3.000,00',
    '4' => 'R$ 3.000,00 a R$ 4.000,00',
    '5' => 'R$ 4.000,00 a R$ 5.000,00',
    '6' => 'Acima de R$ 5.000,00',
    '7' => 'A Combinar',
    '8' => 'A Combinar',
];

$contractMap = [
    '1' => 'CLT (Efetivo)',
    '2' => 'PJ (Pessoa Jurídica)',
    '3' => 'Estágio',
    '4' => 'Temporário',
    '5' => 'Freelancer',
    '6' => 'Trainee',
];

$educationMap = [
    '1' => 'Ensino Fundamental Incompleto',
    '2' => 'Ensino Fundamental Completo',
    '3' => 'Ensino Médio Incompleto',
    '4' => 'Ensino Médio Completo',
    '5' => 'Ensino Técnico Incompleto',
    '6' => 'Ensino Técnico Completo',
    '7' => 'Ensino Superior Incompleto',
    '8' => 'Ensino Superior Completo',
    '9' => 'Pós-graduação',
    '10' => 'Indiferente / Não Informado',
];

$count = 0;
foreach ($jobs as $job) {
    $updated = false;
    
    // Fix Salary
    if (array_key_exists($job->salary_range, $salaryMap)) {
        $job->salary_range = $salaryMap[$job->salary_range];
        $updated = true;
    }
    
    // Fix Contract Type
    if (array_key_exists($job->hiring_type, $contractMap)) {
        $job->hiring_type = $contractMap[$job->hiring_type];
        $updated = true;
    }

    // Fix Education
    if (array_key_exists($job->education_level, $educationMap)) {
        $job->education_level = $educationMap[$job->education_level];
        $updated = true;
    }

    // Fix Description HTML
    if ($job->description && (str_contains($job->description, '<br>') || str_contains($job->description, '<p>'))) {
        $desc = $job->description;
        // Decode HTML entities (e.g. &aacute;)
        $desc = html_entity_decode($desc, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        // Replace br with newline
        $desc = str_ireplace(['<br>', '<br/>', '<br />'], "\n", $desc);
        // Remove other tags
        $desc = strip_tags($desc);
        // Decode again just in case there were double encoded
        $desc = html_entity_decode($desc, ENT_QUOTES, 'UTF-8');
        // clean up multiple newlines
        $desc = preg_replace("/\n{3,}/", "\n\n", $desc);
        
        $job->description = trim($desc);
        $updated = true;
    }
    
    if ($updated) {
        $job->save();
        $count++;
    }
}

echo "Jobs updated: $count\n";
