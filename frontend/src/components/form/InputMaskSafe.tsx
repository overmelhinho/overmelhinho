import React from "react";

type InputMaskSafeProps = React.InputHTMLAttributes<HTMLInputElement> & {
  mask?: string;
};

/**
 * InputMaskSafe — substitui react-input-mask, compatível com React 18
 * Implementa máscara simples para telefone, CNPJ, CPF, CEP etc.
 */
export default function InputMaskSafe({
  mask,
  value = "",
  onChange,
  ...props
}: InputMaskSafeProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value;

    if (mask === "cnpj") {
      v = v
        .replace(/\D/g, "")
        .replace(/^(\d{2})(\d)/, "$1.$2")
        .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1/$2")
        .replace(/(\d{4})(\d)/, "$1-$2")
        .slice(0, 18);
    } else if (mask === "phone") {
      v = v
        .replace(/\D/g, "")
        .replace(/^(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{4,5})(\d{4})$/, "$1-$2")
        .slice(0, 15);
    } else if (mask === "cep") {
      v = v.replace(/\D/g, "").replace(/(\d{5})(\d{3})$/, "$1-$2").slice(0, 9);
    }

    e.target.value = v;
    onChange?.(e);
  };

  return (
    <input
      {...props}
      value={value}
      onChange={handleChange}
      className={`border rounded-lg px-3 py-2 w-full outline-none focus:ring-2 focus:ring-[#B70F0A] ${props.className || ""}`}
    />
  );
}
