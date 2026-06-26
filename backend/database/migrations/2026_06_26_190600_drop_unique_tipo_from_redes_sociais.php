<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Remove o índice único (cliente_id, tipo) da tabela redes_sociais
     * para permitir múltiplas entradas do mesmo tipo por cliente
     * (ex: dois ou mais Instagrams para a mesma empresa).
     */
    public function up(): void
    {
        // O índice foi criado diretamente no banco; remove via raw SQL
        // pois o Schema Builder do Laravel não reconhece índices criados fora de migrations
        DB::statement('DROP INDEX IF EXISTS redes_sociais_cliente_tipo_unique');
    }

    public function down(): void
    {
        // Recria o índice único caso seja necessário reverter
        DB::statement('CREATE UNIQUE INDEX redes_sociais_cliente_tipo_unique ON redes_sociais (cliente_id, tipo)');
    }
};
