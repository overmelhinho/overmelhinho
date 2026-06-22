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

async function test() {
    const url = 'https://dash.overmelhinho.com.br/api/v1/public/search?q=desentupidora&city_id=4&per_page=20';
    console.log(`Fetching ${url}...`);
    try {
        const res = await get(url);
        const allResults = res.data || [];
        console.log(`API returned ${allResults.length} items.`);

        // Simulating the logic from page.tsx:
        const query = 'desentupidora';
        const matchPerfeito = (() => {
            if (!allResults.length || !query) return null;
            
            const first = allResults[0];
            const q = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
            const n = first.nome_fantasia.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
            
            const qWords = q.split(' ').filter(Boolean);
            
            // Match exato
            if (n === q) return first;

            // Se a busca tem mais de uma palavra (busca mais específica) e o nome bate, consideramos match
            if (qWords.length > 1 && (n.includes(q) || q.includes(n))) {
                return first;
            }
            
            return null;
        })();

        console.log("Match Perfeito:", matchPerfeito ? matchPerfeito.nome_fantasia : "None");

        const destaques = allResults.filter((item, idx) => {
            if (matchPerfeito && item.id === matchPerfeito.id) return false;
            
            if (idx === 0 && !matchPerfeito) return true;
            return item.tipo_cliente === 'pagante' && ['ativa', 'ativo'].includes(item.status_assinatura);
        });

        console.log("\nDestaques (Recomendados):");
        destaques.forEach((item, idx) => {
            console.log(`  ${idx+1}. ID: ${item.id} | Name: ${item.nome_fantasia} | Status: ${item.status_assinatura} | Type: ${item.tipo_cliente}`);
        });

        const destaquesIds = new Set(destaques.map(item => item.id));
        if (matchPerfeito) destaquesIds.add(matchPerfeito.id);

        const outrosResultados = allResults.filter(item => !destaquesIds.has(item.id));

        console.log("\nTodos os Resultados (Outros):");
        outrosResultados.forEach((item, idx) => {
            console.log(`  ${idx+1}. ID: ${item.id} | Name: ${item.nome_fantasia} | Status: ${item.status_assinatura} | Type: ${item.tipo_cliente}`);
        });

    } catch (err) {
        console.error("Error:", err.message);
    }
}

test();

