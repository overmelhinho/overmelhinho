function simulatePaste(pasteText, maskFn) {
  let value = '';
  // paste replaces all if selected all, but let's assume empty
  value = pasteText;
  let formatted = maskFn(value);
  return formatted;
}

function formatCpfCnpj(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 14);
  if (digits.length === 0) return '';
  if (digits.length <= 11) {
    let formatted = digits;
    if (formatted.length > 3) formatted = formatted.replace(/^(\d{3})(\d)/, '$1.$2');
    if (formatted.length > 6) formatted = formatted.replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3');
    if (formatted.length > 9) formatted = formatted.replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
    return formatted;
  } else {
    let formatted = digits;
    if (formatted.length > 2) formatted = formatted.replace(/^(\d{2})(\d)/, '$1.$2');
    if (formatted.length > 5) formatted = formatted.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
    if (formatted.length > 8) formatted = formatted.replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3/$4');
    if (formatted.length > 12) formatted = formatted.replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, '$1.$2.$3/$4-$5');
    return formatted;
  }
}

function formatPhone(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 11);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return '(' + digits;
  if (digits.length <= 6) return '(' + digits.slice(0, 2) + ') ' + digits.slice(2);
  if (digits.length <= 10) return '(' + digits.slice(0, 2) + ') ' + digits.slice(2, 6) + '-' + digits.slice(6);
  return '(' + digits.slice(0, 2) + ') ' + digits.slice(2, 7) + '-' + digits.slice(7);
}

console.log('Phone:', simulatePaste('(54) 9.9249-0687', formatPhone));
console.log('CNPJ:', simulatePaste('04.951.787/0001-28', formatCpfCnpj));
