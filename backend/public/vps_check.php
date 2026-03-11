<?php
header('Content-Type: text/plain');

echo "--- GIT STATUS ---\n";
echo shell_exec('cd /var/www && git status 2>&1');
echo "\n--- GIT LOG ---\n";
echo shell_exec('cd /var/www && git log -n 5 --oneline 2>&1');
echo "\n--- FRONTEND DIR ---\n";
echo shell_exec('cd /var/www/frontend && ls -la 2>&1');
echo "\n--- FRONTEND DIST ---\n";
echo shell_exec('cd /var/www/frontend/dist && ls -la 2>&1');
echo "\n--- FRONTEND INDEX.HTML ---\n";
echo shell_exec('cat /var/www/frontend/index.html 2>&1');
echo "\n--- DIST INDEX.HTML ---\n";
echo shell_exec('cat /var/www/frontend/dist/index.html 2>&1');

?>
