import React, { forwardRef, useEffect, useState } from "react";

let LazyInputMask: any = null;

/**
 * MaskedInput — blindado contra "Invalid hook call"
 * ✅ Só importa react-input-mask após o mount
 * ✅ Funciona com React 18+ e build minificado (Vite + nginx)
 */
const MaskedInput = forwardRef<HTMLInputElement, any>(
  ({ mask, maskChar = "", value = "", onChange, formatChars, ...props }, ref) => {
    const [ready, setReady] = useState(false);

    useEffect(() => {
      (async () => {
        try {
          const mod = await import("react-input-mask");
          LazyInputMask = mod.default || mod;
        } catch (err) {
          console.error("Erro ao carregar react-input-mask:", err);
        } finally {
          setReady(true);
        }
      })();
    }, []);

    // Enquanto a lib não estiver carregada, renderiza input nativo
    if (!ready || !LazyInputMask) {
      return (
        <input
          {...props}
          ref={ref}
          type="text"
          value={value || ""}
          onChange={onChange}
          className={
            props.className ||
            "border rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-[#B70F0A] outline-none transition"
          }
        />
      );
    }

    const InputMask = LazyInputMask;

    return (
      <InputMask
        mask={mask}
        maskChar={maskChar}
        formatChars={formatChars}
        value={value || ""}
        onChange={onChange}
        alwaysShowMask={false}
      >
        {(inputProps: any) => (
          <input
            {...inputProps}
            {...props}
            ref={ref}
            type="text"
            className={
              props.className ||
              "border rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-[#B70F0A] outline-none transition"
            }
          />
        )}
      </InputMask>
    );
  }
);

MaskedInput.displayName = "MaskedInput";
export default MaskedInput;
