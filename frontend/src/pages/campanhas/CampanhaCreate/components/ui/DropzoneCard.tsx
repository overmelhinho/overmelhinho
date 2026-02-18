// /var/www/frontend/src/pages/campanhas/CampanhaCreate/components/ui/DropzoneCard.tsx
import { useCallback, useMemo, useRef, useState } from "react";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

type Props = {
  title: string;
  subtitle?: string;
  hint?: string;
  accept?: string;
  disabled?: boolean;

  valueUrl?: string | null;
  fileName?: string | null;
  uploading?: boolean;
  error?: string | null;

  onPick: (file: File) => void;
  onRemove?: () => void;
};

export default function DropzoneCard({
  title,
  subtitle,
  hint,
  accept = "image/*",
  disabled,
  valueUrl,
  fileName,
  uploading,
  error,
  onPick,
  onRemove,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const hasValue = !!valueUrl;

  const openPicker = useCallback(() => {
    if (disabled) return;
    inputRef.current?.click();
  }, [disabled]);

  const onChangeInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f) return;
      onPick(f);
      e.target.value = "";
    },
    [onPick]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
      if (disabled) return;

      const f = e.dataTransfer.files?.[0];
      if (!f) return;
      onPick(f);
    },
    [disabled, onPick]
  );

  const onDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (disabled) return;
      setDragOver(true);
    },
    [disabled]
  );

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const borderCls = useMemo(() => {
    if (error) return "border-red-200";
    if (dragOver) return "border-gray-900";
    return "border-gray-200";
  }, [dragOver, error]);

  const bgCls = useMemo(() => {
    if (error) return "bg-red-50";
    if (dragOver) return "bg-gray-50";
    return "bg-white";
  }, [dragOver, error]);

  return (
    <div className={cx("rounded-2xl border p-4 shadow-sm transition", borderCls, bgCls)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-gray-900">{title}</div>
          {subtitle ? <div className="mt-1 text-xs text-gray-600">{subtitle}</div> : null}
        </div>

        {hasValue && onRemove ? (
          <button
            type="button"
            className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 hover:bg-gray-50"
            onClick={onRemove}
            disabled={disabled || uploading}
          >
            Remover
          </button>
        ) : (
          <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] font-semibold text-gray-700">
            {uploading ? "Enviando..." : "Opcional"}
          </span>
        )}
      </div>

      <div className={cx("mt-4 grid grid-cols-1 gap-4 md:grid-cols-12", disabled ? "opacity-70" : "")}>
        <div className="md:col-span-4">
          <div className="flex h-28 w-full items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
            {valueUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={valueUrl} alt={title} className="h-full w-full object-cover" />
            ) : (
              <div className="text-xs text-gray-500">
                Arraste e solte aqui
                <div className="mt-1 text-[11px] text-gray-400">ou escolha um arquivo</div>
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-8">
          <div
            onClick={openPicker}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            className={cx(
              "cursor-pointer rounded-2xl border border-dashed p-4 transition",
              dragOver ? "border-gray-900 bg-gray-50" : "border-gray-200 bg-white hover:bg-gray-50"
            )}
          >
            <div className="text-sm font-semibold text-gray-900">
              {hasValue ? "Arquivo selecionado" : "Enviar criativo"}
            </div>

            <div className="mt-1 text-sm text-gray-600">{fileName ? fileName : "PNG, JPG ou WebP"}</div>

            {hint ? <div className="mt-2 text-xs text-gray-500">{hint}</div> : null}

            {error ? (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</div>
            ) : null}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  openPicker();
                }}
                disabled={disabled || uploading}
                className="rounded-xl bg-gray-900 px-4 py-2 text-xs font-semibold text-white hover:opacity-95 disabled:opacity-50"
              >
                {uploading ? "Enviando..." : "Escolher arquivo"}
              </button>

              <span className="text-xs text-gray-500">ou arraste e solte acima</span>
            </div>
          </div>

          <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={onChangeInput} />
        </div>
      </div>
    </div>
  );
}
