// /var/www/frontend/src/pages/campanhas/CampanhaCreate/components/ui/PlacementCard.tsx
import Chip from "@/pages/campanhas/CampanhaCreate/components/ui/Chip";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export default function PlacementCard({
  title,
  subtitle,
  icon,
  checked,
  onToggle,
  isGlobal,
}: {
  title: string;
  subtitle: string;
  icon: string;
  checked: boolean;
  onToggle: (next: boolean) => void;
  isGlobal?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(!checked)}
      className={cx(
        "group flex w-full items-start gap-3 rounded-3xl border p-4 text-left shadow-sm transition",
        "focus:outline-none focus:ring-4",
        checked
          ? "border-[#B70F0A]/30 bg-[#B70F0A]/5 ring-[#B70F0A]/10"
          : "border-slate-200 bg-white hover:bg-slate-50 ring-transparent"
      )}
    >
      <span
        className={cx(
          "mt-0.5 inline-flex h-11 w-11 items-center justify-center rounded-2xl border text-lg shadow-sm transition",
          checked
            ? "border-[#B70F0A]/30 bg-white"
            : "border-slate-200 bg-white group-hover:border-slate-300"
        )}
        aria-hidden="true"
      >
        {icon}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-slate-900">{title}</span>
          {isGlobal ? <Chip tone="warn">Global</Chip> : null}
          {checked ? <Chip tone="success">Selecionado</Chip> : null}
        </span>

        <span className="mt-1 block text-sm text-slate-600">{subtitle}</span>
      </span>

      <span
        className={cx(
          "mt-1 inline-flex h-6 w-6 items-center justify-center rounded-xl border text-xs font-bold shadow-sm",
          checked
            ? "border-[#B70F0A] bg-[#B70F0A] text-white"
            : "border-slate-200 bg-white text-slate-400"
        )}
        aria-hidden="true"
      >
        ✓
      </span>
    </button>
  );
}
