const mysql = require('mysql2/promise');
const { Client } = require('pg');

async function main() {
  let mysqlConn;
  let pgClient;
  try {
    console.log("Connecting to MySQL (Legacy)...");
    mysqlConn = await mysql.createConnection({
      host: '31.97.27.242',
      user: 'overmelhinhocom',
      password: 'w$JkD69Vzz6*n5',
      database: 'overmelhinho'
    });

    console.log("Connecting to Postgres (New)...");
    pgClient = new Client({
      host: 'aws-0-sa-east-1.pooler.supabase.com',
      port: 6543,
      database: 'postgres',
      user: 'postgres.spefwgjsltjryxcizype',
      password: 'JcSz;Yp9@@?BF3Zf7Qj',
      ssl: { rejectUnauthorized: false }
    });
    await pgClient.connect();

    console.log("Fetching data from legacy...");
    const [rows] = await mysqlConn.execute(`
      SELECT 
        id, 
        observacoes_fone_principal, 
        observacoes_fone_secundario, 
        observacoes_fone_celular, 
        observacoes_pj_fone_gratuito
      FROM clientes
      WHERE 
        (observacoes_fone_principal IS NOT NULL AND observacoes_fone_principal != '')
        OR (observacoes_fone_secundario IS NOT NULL AND observacoes_fone_secundario != '')
        OR (observacoes_fone_celular IS NOT NULL AND observacoes_fone_celular != '')
        OR (observacoes_pj_fone_gratuito IS NOT NULL AND observacoes_pj_fone_gratuito != '')
    `);

    console.log(`Found ${rows.length} rows to import.`);
    let updatedCount = 0;

    for (const r of rows) {
      // Postgres contatos update
      const res = await pgClient.query(`
        UPDATE contatos 
        SET 
          obs_telefone_principal = $1,
          obs_telefone_secundario = $2,
          obs_celular = $3,
          obs_telefone_outro = $4
        WHERE cliente_id = $5
      `, [
        r.observacoes_fone_principal || null,
        r.observacoes_fone_secundario || null,
        r.observacoes_fone_celular || null,
        r.observacoes_pj_fone_gratuito || null,
        r.id
      ]);

      if (res.rowCount > 0) {
        updatedCount++;
      }
    }

    console.log(`Successfully updated ${updatedCount} contatos records in Postgres.`);

  } catch (err) {
    console.error("Error:", err);
  } finally {
    if (mysqlConn) await mysqlConn.end();
    if (pgClient) await pgClient.end();
  }
}

main();
