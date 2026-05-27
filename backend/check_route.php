<?php
$ch = curl_init("http://127.0.0.1:8000/api/v1/autorizacoes/alertas/tiny-cancellations");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$res = curl_exec($ch);
echo "RESPONSE: " . $res . "\n";
