// src/components/form/MaskedField.tsx
import React from 'react';
import { useField } from 'formik';
import InputMask from 'react-input-mask';

const inputClass =
  "w-full rounded-xl border border-gray-300 focus:border-[#B70F0A] focus:ring-2 focus:ring-[#B70F0A]/40 transition-all px-3 py-2 text-sm shadow-sm";

const MaskedField = ({ label, mask, ...props }) => {
  const [field, meta] = useField(props);

  return (
    <div>
      {label && <label>{label}</label>}
      <InputMask {...field} {...props} mask={mask}>
        {(inputProps) => (
          <input {...inputProps} className={inputClass} />
        )}
      </InputMask>
      {meta.touched && meta.error && (
        <div className="text-red-500 text-sm">{meta.error}</div>
      )}
    </div>
  );
};

export default MaskedField;
