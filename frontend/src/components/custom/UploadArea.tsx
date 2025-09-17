import React from 'react';

interface UploadAreaProps {
  name: string;
  onChange: (file: File | null) => void;
}

export default function UploadArea({ name, onChange }: UploadAreaProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onChange(file);
  };

  return (
    <div className="border border-dashed border-gray-400 p-4 rounded-lg text-center">
      <label className="cursor-pointer text-sm text-gray-600">
        Clique para selecionar um arquivo
        <input
          type="file"
          name={name}
          className="hidden"
          onChange={handleFileChange}
        />
      </label>
    </div>
  );
}
