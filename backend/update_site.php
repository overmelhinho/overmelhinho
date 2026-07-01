<?php
$files = [
    'c:/Dev/overmelhinho/site/src/app/cliente/[id]/page.tsx',
    'c:/Dev/overmelhinho/site/src/app/cliente/[id]/ClientProfileClient.tsx',
    'c:/Dev/overmelhinho/site/src/app/[citySlug]/[segmentSlug]/page.tsx',
];

foreach ($files as $file) {
    if (file_exists($file)) {
        $content = file_get_contents($file);
        
        // 1. `${end.rua}` => `${end.tipo_logradouro ? end.tipo_logradouro + ' ' : ''}${end.rua}`
        // 2. `${end.rua},` => `${end.tipo_logradouro ? end.tipo_logradouro + ' ' : ''}${end.rua},`
        // We can just replace `{end.rua}` with `{end.tipo_logradouro ? end.tipo_logradouro + ' ' : ''}{end.rua}` in template literals
        // Wait, better to replace `end.rua` and `client.enderecos[0].rua` but ONLY inside template literals or JSX.
        
        // Actually, if it's `{end.rua}`, replace with `{(end.tipo_logradouro ? end.tipo_logradouro + ' ' : '') + end.rua}`
        $content = str_replace('{end.rua}', '{(end.tipo_logradouro ? end.tipo_logradouro + \' \' : \'\') + end.rua}', $content);
        
        // If it's inside template literal: `${end.rua}`
        $content = str_replace('${end.rua}', '${(end.tipo_logradouro ? end.tipo_logradouro + \' \' : \'\') + end.rua}', $content);

        // Same for client.enderecos[0].rua
        $content = str_replace('{client.enderecos[0].rua}', '{(client.enderecos[0].tipo_logradouro ? client.enderecos[0].tipo_logradouro + \' \' : \'\') + client.enderecos[0].rua}', $content);
        
        $content = str_replace('${client.enderecos[0].rua}', '${(client.enderecos[0].tipo_logradouro ? client.enderecos[0].tipo_logradouro + \' \' : \'\') + client.enderecos[0].rua}', $content);

        // Exception in [citySlug]/[segmentSlug]/page.tsx:
        // `${client.enderecos[0].rua}`
        // `{client.enderecos?.[0]?.rua ? `${client.enderecos[0].rua}` : ...`
        $content = str_replace('${client.enderecos?.[0]?.rua}', '${(client.enderecos?.[0]?.tipo_logradouro ? client.enderecos[0].tipo_logradouro + \' \' : \'\') + client.enderecos?.[0]?.rua}', $content);

        file_put_contents($file, $content);
        echo "Updated $file\n";
    }
}
