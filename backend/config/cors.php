<?php

return [

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    // ✅ mantém dash e adiciona localhost (não quebra produção)
    'allowed_origins' => [
        'https://dash.overmelhinho.com.br',
        'https://overmelhinho.com.br',
        'https://www.overmelhinho.com.br',
        'https://api.overmelhinho.com.br',
        'https://novo.overmelhinho.com.br',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3001',
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    // ✅ melhora UX/performance (menos preflight repetido)
    'max_age' => 86400,

    // ✅ vocês usam Bearer token, então continua false
    'supports_credentials' => false,

];
