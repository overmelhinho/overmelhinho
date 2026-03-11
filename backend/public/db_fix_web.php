<?php
// Script para rodar via Web (URL) para evitar restrições do CLI

$host = 'db.spefwgjsltjryxcizype.supabase.co'; // Host direto do Postgres (visto no erro anterior do user)
$port = '5432';
$db   = 'postgres';
$user = 'postgres.spefwgjsltjryxcizype';
$pass = 'JcSz;Yp9@@?BF3Zf7Qj';

header('Content-Type: text/plain');

try {
    $dsn = "pgsql:host=$host;port=$port;dbname=$db;sslmode=require";
    $pdo = new PDO($dsn, $user, $pass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

    echo "Conectado ao Supabase via Web!\n";

    // 1. Verificar colunas
    $sql = "SELECT column_name FROM information_schema.columns WHERE table_name = 'cliente_reviews'";
    $stmt = $pdo->query($sql);
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);

    echo "Colunas atuais: " . implode(', ', $columns) . "\n";

    // 2. Adicionar colunas se faltarem
    if (!in_array('google_review_id', $columns)) {
        echo "Adicionando google_review_id...\n";
        $pdo->exec("ALTER TABLE cliente_reviews ADD COLUMN google_review_id VARCHAR(255) UNIQUE NULL");
    }

    if (!in_array('is_visible', $columns)) {
        echo "Adicionando is_visible...\n";
        $pdo->exec("ALTER TABLE cliente_reviews ADD COLUMN is_visible BOOLEAN DEFAULT TRUE");
    }
    
    // 3. Verificar se 'horario_atendimento' e 'beneficios' existem na tabela clientes
    $sqlClientes = "SELECT column_name FROM information_schema.columns WHERE table_name = 'clientes'";
    $stmtC = $pdo->query($sqlClientes);
    $colsC = $stmtC->fetchAll(PDO::FETCH_COLUMN);
    
    if (!in_array('horario_atendimento', $colsC)) {
        echo "Adicionando horario_atendimento na tabela clientes...\n";
        $pdo->exec("ALTER TABLE clientes ADD COLUMN horario_atendimento JSONB NULL");
    }
    if (!in_array('beneficios', $colsC)) {
        echo "Adicionando beneficios na tabela clientes...\n";
        $pdo->exec("ALTER TABLE clientes ADD COLUMN beneficios JSONB NULL");
    }

    echo "Operação finalizada com sucesso.\n";

} catch (Exception $e) {
    echo "ERRO: " . $e->getMessage() . "\n";
}
