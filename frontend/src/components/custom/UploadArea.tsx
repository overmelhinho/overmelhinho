import { useRef, useState } from "react";
import toast from "react-hot-toast";

type Props = {
  name: string;
  accept?: string;
  maxSizeMB?: number;
  onChange: (file: File | null) => void;
};

export default function UploadArea({
  name,
  accept = "image/*",
  maxSizeMB = 5,
  onChange,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);

  const maxBytes = maxSizeMB * 1024 * 1024;

  const openPicker = () => {
    inputRef.current?.click();
  };

  const handleFile = (file: File | null) => {
    if (!file) {
      onChange(null);
      return;
    }

    if (file.size > maxBytes) {
      toast.error(`Arquivo muito grande. Limite: ${maxSizeMB}MB`);
      onChange(null);
      return;
    }

    onChange(file);
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    handleFile(file);
    // permitir selecionar o mesmo arquivo novamente
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);

    const file = e.dataTransfer.files?.[0] ?? null;
    handleFile(file);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const onDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  };

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        name={name}
        type="file"
        accept={accept}
        className="hidden"
        onChange={onInputChange}
      />

      <div
        className={[
          "border-2 border-dashed rounded-xl p-6 bg-gray-50 cursor-pointer transition",
          dragging ? "border-[#B70F0A] bg-[#B70F0A]/5" : "border-gray-300 hover:border-[#B70F0A]/50",
        ].join(" ")}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          openPicker();
        }}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openPicker();
          }
        }}
      >
        <div className="text-center space-y-2">
          <div className="text-sm text-gray-700 font-medium">
            Clique para selecionar ou arraste um arquivo aqui
          </div>
          <div className="text-xs text-gray-500">
            Limite: {maxSizeMB}MB
          </div>

          <div className="pt-2">
            {/* ✅ IMPORTANTE: type="button" para nunca submeter o Formik Form */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                openPicker();
              }}
              className="px-4 py-2 rounded-md bg-[#B70F0A] text-white hover:bg-[#a00d08] text-sm"
            >
              Selecionar arquivo
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onChange(null);
              }}
              className="ml-2 px-4 py-2 rounded-md border text-sm hover:bg-gray-100"
            >
              Remover
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
