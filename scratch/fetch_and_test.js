const https = require('https');

function get(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
    });
}

async function run() {
    const url = 'https://dash.overmelhinho.com.br/api/v1/public/search?q=desentupidora&city_id=4&per_page=20';
    try {
        const res = await get(url);
        const data = res.data || [];
        console.log(`Returned ${data.length} items.`);
        data.forEach((item, index) => {
            console.log(`[Item ${index + 1}] ID: ${item.id} | Name: ${item.nome_fantasia}`);
            console.log(`  - status_assinatura: ${item.status_assinatura}`);
            console.log(`  - tipo_cliente: ${item.tipo_cliente}`);
            console.log(`  - exibir_no_site: ${item.exibir_no_site}`);
            console.log(`  - enderecos: ${JSON.stringify(item.enderecos)}`);
            console.log(`  - cidades_atendidas: ${item.cidades_atendidas ? item.cidades_atendidas.length : 'none'}`);
        });
    } catch (e) {
        console.error(e);
    }
}

run();
