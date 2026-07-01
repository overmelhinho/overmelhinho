<?php

return [

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => ['*'],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    // ✅ melhora UX/performance (menos preflight repetido)
    'max_age' => 86400,

    // ✅ vocês usam Bearer token, então continua false
    'supports_credentials' => false,

];
