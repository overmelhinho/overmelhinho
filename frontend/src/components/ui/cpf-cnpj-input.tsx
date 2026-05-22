import React, { forwardRef } from "react";

function formatCpfCnpj(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 14);

  if (digits.length === 0) return "";
  
  if (digits.length <= 11) {
    // CPF
    let formatted = digits;
    if (formatted.length > 3) formatted = formatted.replace(/^(\d{3})(\d)/, "$1.$2");
    if (formatted.length > 6) formatted = formatted.replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3");
    if (formatted.length > 9) formatted = formatted.replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
    return formatted;
  } else {
    // CNPJ
    let formatted = digits;
    if (formatted.length > 2) formatted = formatted.replace(/^(\d{2})(\d)/, "$1.$2");
    if (formatted.length > 5) formatted = formatted.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
    if (formatted.length > 8) formatted = formatted.replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3/$4");
    if (formatted.length > 12) formatted = formatted.replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, "$1.$2.$3/$4-$5");
    return formatted;
  }
}

interface CpfCnpjInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const CpfCnpjInput = forwardRef<HTMLInputElement, CpfCnpjInputProps>(
  ({ value = "", onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatCpfCnpj(e.target.value);
      const syntheticEvent = {
        ...e,
        target: { ...e.target, value: formatted, name: e.target.name },
      } as React.ChangeEvent<HTMLInputElement>;
      onChange?.(syntheticEvent);
    };

    return (
      <input
        ref={ref}
        type="tel"
        inputMode="numeric"
        value={formatCpfCnpj(String(value))}
        onChange={handleChange}
        placeholder="000.000.000-00 ou 00.000.000/0000-00"
        {...props}
      />
    );
  }
);

CpfCnpjInput.displayName = "CpfCnpjInput";
export default CpfCnpjInput;
