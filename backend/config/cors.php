<?php

return [

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'http://localhost:5173',
        'http://localhost:3000',
        'https://dash.overmelhinho.com.br',
        'https://www.overmelhinho.com.br',
        'https://overmelhinho.com.br',
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    // ✅ melhora UX/performance (menos preflight repetido)
    'max_age' => 86400,

    // ✅ vocês usam Bearer token, então continua false
    'supports_credentials' => false,

];
