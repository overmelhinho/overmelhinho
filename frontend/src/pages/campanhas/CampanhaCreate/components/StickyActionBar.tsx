// /var/www/frontend/src/pages/campanhas/CampanhaCreate/components/StickyActionBar.tsx
export default function StickyActionBar({
  canSubmit,
  loading,
  stepIndex,
  stepCount,
  onCancel,
  onPrev,
  onNext,
  onSubmit,
  nextDisabled,
  submitLabel,
  submitLoadingLabel,
}: {
  canSubmit: boolean;
  loading: boolean;
  stepIndex: number; // 1-based
  stepCount: number;
  onCancel: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSubmit: () => void;
  nextDisabled: boolean;

  // ✅ novos (opcionais) — não quebra telas antigas
  submitLabel?: string;
  submitLoadingLabel?: string;
}) {
  const isLast = stepIndex >= stepCount;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white/90 p-3 shadow-lg backdrop-blur">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-gray-700">
          Etapa <span className="font-semibold">{stepIndex}</span> de{" "}
          <span className="font-semibold">{stepCount}</span>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </button>

          <button
            type="button"
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-50"
            onClick={onPrev}
            disabled={loading || stepIndex <= 1}
          >
            Anterior
          </button>

          {!isLast ? (
            <button
              type="button"
              className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50"
              onClick={onNext}
              disabled={loading || nextDisabled}
            >
              Próximo
            </button>
          ) : (
            <button
              type="button"
              disabled={!canSubmit || loading}
              onClick={onSubmit}
              className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50"
            >
              {loading ? (submitLoadingLabel ?? "Salvando...") : (submitLabel ?? "Criar campanha")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
