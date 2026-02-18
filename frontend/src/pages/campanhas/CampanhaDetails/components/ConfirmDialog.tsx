import { useEffect, useState } from "react";

export type ConfirmState =
  | null
  | {
      title: string;
      description?: string;
      confirmText?: string;
      cancelText?: string;
      tone?: "default" | "danger";
      requireComment?: boolean;
      commentLabel?: string;
      commentPlaceholder?: string;
      defaultComment?: string;
      onConfirm: (comment?: string) => Promise<void> | void;
    };

export default function ConfirmDialog({
  open,
  loading,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  tone = "default",
  requireComment,
  commentLabel = "Comentário",
  commentPlaceholder = "Descreva o motivo/ação…",
  defaultComment,
}: {
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (comment?: string) => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  tone?: "default" | "danger";
  requireComment?: boolean;
  commentLabel?: string;
  commentPlaceholder?: string;
  defaultComment?: string;
}) {
  const [comment, setComment] = useState<string>(defaultComment || "");

  useEffect(() => {
    if (open) setComment(defaultComment || "");
  }, [open, defaultComment]);

  if (!open) return null;

  const commentOk = !requireComment || !!comment.trim();

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={loading ? undefined : onClose}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-xl">
          <div className="text-base font-semibold text-gray-900">{title}</div>

          {description && (
            <div className="mt-2 whitespace-pre-line text-sm text-gray-600">
              {description}
            </div>
          )}

          {requireComment ? (
            <div className="mt-4">
              <label className="mb-1 block text-xs font-medium text-gray-600">
                {commentLabel}
              </label>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={commentPlaceholder}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-black/5"
                disabled={!!loading}
              />
              {!commentOk ? (
                <div className="mt-1 text-xs text-red-600">
                  Comentário obrigatório.
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="mt-5 flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              disabled={!!loading}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-50"
            >
              {cancelText}
            </button>

            <button
              onClick={() => {
                if (!commentOk) return;
                onConfirm(requireComment ? comment.trim() : undefined);
              }}
              disabled={!!loading || !commentOk}
              className={`rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-50 ${
                tone === "danger"
                  ? "bg-red-600 hover:opacity-95"
                  : "bg-gray-900 hover:opacity-95"
              }`}
            >
              {loading ? "Processando..." : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
