<?php

return [

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    // ✅ mantém dash e adiciona localhost (não quebra produção)
    'allowed_origins' => [
        'https://dash.overmelhinho.com.br',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    // ✅ melhora UX/performance (menos preflight repetido)
    'max_age' => 86400,

    // ✅ vocês usam Bearer token, então continua false
    'supports_credentials' => false,

];
