<?php $ctx = stream_context_create(["http" => ["ignore_errors" => true]]); echo file_get_contents("https://dash.overmelhinho.com.br/api/v1/public/fix-italiani", false, $ctx);
