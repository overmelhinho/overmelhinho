const { Client } = require('pg');

const client = new Client({
  host: 'aws-0-sa-east-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.spefwgjsltjryxcizype',
  password: 'JcSz;Yp9@@?BF3Zf7Qj',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    
    // Find clients with more than 9 images
    const resCli = await client.query(`
      SELECT cliente_id, count(id) as total FROM galerias_imagens GROUP BY cliente_id HAVING count(id) > 9 ORDER BY total DESC LIMIT 5;
    `);
    console.log("Clientes com mais imagens:", resCli.rows);
    
    if (resCli.rows.length > 0) {
      const cliId = resCli.rows[0].cliente_id;
      const resGal = await client.query(`
        SELECT id, ordem, url FROM galerias_imagens WHERE cliente_id = $1 ORDER BY id ASC LIMIT 20;
      `, [cliId]);
      console.log(`Galeria do cliente ${cliId}:`, resGal.rows);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
