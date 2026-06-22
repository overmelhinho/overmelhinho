const mysql = require('mysql2/promise');
const fs = require('fs');

async function main() {
  try {
    const connection = await mysql.createConnection({
      host: '31.97.27.242',
      user: 'overmelhinhocom',
      password: 'w$JkD69Vzz6*n5',
      database: 'overmelhinho'
    });

    const [cols] = await connection.execute('SHOW COLUMNS FROM clientes');
    const allCols = cols.map(c => c.Field);
    console.log(allCols.join(', '));
    
    // Attempting a better guess for nome
    const nameCol = allCols.includes('pj_nome_fantasia') ? 'pj_nome_fantasia' : (allCols.includes('razao_social') ? 'razao_social' : (allCols.includes('nome') ? 'nome' : 'id'));

    const [rows] = await connection.execute(`
      SELECT 
        id, 
        ${nameCol} as nome_fantasia, 
        observacoes_fone_principal, 
        observacoes_fone_secundario, 
        observacoes_fone_celular, 
        observacoes_pj_fone_gratuito,
        observacoes_fone_fax
      FROM clientes
      WHERE 
        (observacoes_fone_principal IS NOT NULL AND observacoes_fone_principal != '')
        OR (observacoes_fone_secundario IS NOT NULL AND observacoes_fone_secundario != '')
        OR (observacoes_fone_celular IS NOT NULL AND observacoes_fone_celular != '')
        OR (observacoes_pj_fone_gratuito IS NOT NULL AND observacoes_pj_fone_gratuito != '')
        OR (observacoes_fone_fax IS NOT NULL AND observacoes_fone_fax != '')
    `);

    let markdown = '# Clientes com Observações de Telefone (Legado)\\n\\n';
    markdown += '| ID | Cliente | Obs. Principal | Obs. Secundário | Obs. Celular | Obs. Gratuito | Obs. Fax |\\n';
    markdown += '|---|---|---|---|---|---|---|\\n';

    for (const r of rows) {
      markdown += `| ${r.id} | ${r.nome_fantasia || ''} | ${r.observacoes_fone_principal || ''} | ${r.observacoes_fone_secundario || ''} | ${r.observacoes_fone_celular || ''} | ${r.observacoes_pj_fone_gratuito || ''} | ${r.observacoes_fone_fax || ''} |\\n`;
    }

    fs.writeFileSync('C:\\\\Users\\\\Windows\\\\.gemini\\\\antigravity\\\\brain\\\\55302974-fc37-4382-8861-5bc9666db745\\\\legacy_phone_obs.md', markdown);
    console.log('Saved to legacy_phone_obs.md');

    await connection.end();
  } catch (err) {
    console.error(err);
  }
}

main();
