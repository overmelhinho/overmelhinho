import React, { forwardRef } from "react";

/**
 * Formata número de telefone brasileiro em tempo real:
 * - até 10 dígitos → (XX) XXXX-XXXX  (fixo)
 * - 11 dígitos     → (XX) XXXXX-XXXX (celular)
 */
function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);

  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    // fixo: (XX) XXXX-XXXX
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  // celular: (XX) XXXXX-XXXX
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

interface PhoneInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value = "", onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatPhone(e.target.value);
      // Cria um evento sintético com o valor formatado
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
        value={formatPhone(String(value))}
        onChange={handleChange}
        placeholder="(00) 0000-0000"
        {...props}
      />
    );
  }
);

PhoneInput.displayName = "PhoneInput";
export default PhoneInput;
