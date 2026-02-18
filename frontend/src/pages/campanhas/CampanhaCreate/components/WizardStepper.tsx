// /var/www/frontend/src/pages/campanhas/CampanhaCreate/components/WizardStepper.tsx
import Chip from "@/pages/campanhas/CampanhaCreate/components/ui/Chip";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export type WizardStepStatus = "ok" | "pending" | "optional";

export type WizardStep = {
  key: string;
  label: string;
  status: WizardStepStatus;
};

export default function WizardStepper({
  steps,
  activeKey,
  onGo,
}: {
  steps: WizardStep[];
  activeKey: string;
  onGo: (key: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        {steps.map((s, idx) => {
          const active = s.key === activeKey;
          const tone =
            s.status === "ok" ? "success" : s.status === "pending" ? "warn" : "info";

          return (
            <button
              key={s.key}
              type="button"
              onClick={() => onGo(s.key)}
              className={cx(
                "group inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition",
                active
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-200 bg-white text-gray-900 hover:bg-gray-50"
              )}
            >
              <span
                className={cx(
                  "inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs font-bold",
                  active
                    ? "border-white/20 bg-white/10 text-white"
                    : "border-gray-200 bg-gray-50 text-gray-700"
                )}
              >
                {idx + 1}
              </span>

              <span>{s.label}</span>

              <span className={cx(active ? "opacity-90" : "")}>
                {s.status === "ok" ? (
                  <Chip tone="success">OK</Chip>
                ) : s.status === "pending" ? (
                  <Chip tone="warn">Pendente</Chip>
                ) : (
                  <Chip tone="info">Opcional</Chip>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
