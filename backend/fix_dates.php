<?php

$pubs = DB::connection('legacy')->table('publicidades')->orderBy('id')->chunk(2000, function ($pubs) {
    $cases = '';
    $ids = [];
    foreach ($pubs as $p) {
        $date = $p->data_cadastro ?: $p->data_emissao ?: '2000-01-01';
        if ($date === '0000-00-00' || str_starts_with($date, '0000')) {
            $date = '2000-01-01';
        }
        $cases .= " WHEN id = {$p->id} THEN '{$date} 00:00:00'::timestamp";
        $ids[] = $p->id;
    }
    if (!empty($ids)) {
        $idsStr = implode(',', $ids);
        DB::statement("UPDATE autorizacoes SET created_at = CASE $cases END WHERE id IN ($idsStr)");
    }
});
echo "Done!\n";
