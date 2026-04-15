import os

file_path = r'c:\Dev\overmelhinho\backend\app\Http\Controllers\Api\V1\FinancialController.php'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if '$num = $auths[$id] ?? null;' in line and '$id = (int)' not in line:
        # Get indentation
        indent = line[:line.find('$num')]
        new_lines.append(f"{indent}$id = (int) str_replace('autorizacao-', '', $i->group_id);\n")
        new_lines.append(line)
    else:
        new_lines.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
