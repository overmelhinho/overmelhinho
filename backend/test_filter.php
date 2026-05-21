<?php
require 'vendor/autoload.php';
var_dump(filter_var('false', FILTER_VALIDATE_BOOLEAN));
var_dump((bool) 'false');
