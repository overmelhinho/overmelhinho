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
    console.log("Iniciando deduplicação avançada...");

    const resCli = await client.query('SELECT DISTINCT cliente_id FROM galerias_imagens');
    const clientes = resCli.rows;
    let totalDeletadas = 0;

    for (const cli of clientes) {
      const cliId = cli.cliente_id;
      
      const resGal = await client.query(
        'SELECT id, ordem, url FROM galerias_imagens WHERE cliente_id = $1 ORDER BY ordem ASC, id ASC',
        [cliId]
      );
      
      const imagens = resGal.rows;
      const visto = new Set();
      let ordemAtual = 0;

      for (const img of imagens) {
        let cleanName = img.url;
        
        // Extrai o nome real se tiver o prefixo aleatório de 5 chars do painel antigo (ex: 1c950_nome.jpg)
        const match = cleanName.match(/^[a-f0-9]{5}_(.*)$/i);
        if (match) {
          cleanName = match[1];
        } else {
          // Também pode ser uma URL completa do supabase, extrair o basename final
          cleanName = cleanName.substring(cleanName.lastIndexOf('/') + 1);
        }

        if (visto.has(cleanName)) {
          // Duplicada, deletar
          await client.query('DELETE FROM galerias_imagens WHERE id = $1', [img.id]);
          totalDeletadas++;
        } else {
          visto.add(cleanName);
          
          if (img.ordem !== ordemAtual) {
            await client.query('UPDATE galerias_imagens SET ordem = $1 WHERE id = $2', [ordemAtual, img.id]);
          }
          ordemAtual++;
        }
      }
    }

    console.log(`Deduplicação finalizada! Total de imagens removidas: ${totalDeletadas}`);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
