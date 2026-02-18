// /var/www/frontend/src/pages/campanhas/CampanhaCreate/components/ui/Chip.tsx
function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

type Tone = "neutral" | "info" | "warn" | "success" | "danger";

export default function Chip({
  children,
  tone = "neutral",
  onRemove,
}: {
  children: any;
  tone?: Tone;
  onRemove?: () => void;
}) {
  const cls =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : tone === "warn"
      ? "border-amber-200 bg-amber-50 text-amber-900"
      : tone === "danger"
      ? "border-red-200 bg-red-50 text-red-900"
      : tone === "info"
      ? "border-sky-200 bg-sky-50 text-sky-900"
      : "border-slate-200 bg-white text-slate-700";

  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold shadow-sm",
        "transition",
        cls
      )}
    >
      <span className="truncate">{children}</span>

      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className={cx(
            "ml-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full",
            "text-slate-500 hover:text-slate-800 hover:bg-slate-900/5",
            "focus:outline-none focus:ring-4 focus:ring-slate-900/10"
          )}
          aria-label="Remover"
          title="Remover"
        >
          ×
        </button>
      ) : null}
    </span>
  );
}
