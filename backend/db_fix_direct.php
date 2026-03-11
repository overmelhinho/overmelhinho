<?php
// Script "Naked" para rodar SQL no Supabase sem carregar o Laravel (evitando mb_split error)

$host = 'aws-0-sa-east-1.pooler.supabase.com';
$port = '5432';
$db   = 'postgres';
$user = 'postgres.spefwgjsltjryxcizype';
$pass = 'JcSz;Yp9@@?BF3Zf7Qj';

try {
    $dsn = "pgsql:host=$host;port=$port;dbname=$db;sslmode=require";
    $pdo = new PDO($dsn, $user, $pass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

    echo "Conectado ao Supabase!\n";

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

    // 3. Verificar clientes
    $stmt = $pdo->query("SELECT id, nome_fantasia FROM clientes WHERE id = 48");
    $cliente = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($cliente) {
        echo "Cliente 48 encontrado: " . $cliente['nome_fantasia'] . "\n";
    } else {
        echo "Cliente 48 NÃO encontrado!\n";
    }

    echo "Operação finalizada com sucesso.\n";

} catch (PDOException $e) {
    echo "ERRO: " . $e->getMessage() . "\n";
}
