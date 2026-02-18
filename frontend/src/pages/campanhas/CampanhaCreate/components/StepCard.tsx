// /var/www/frontend/src/pages/campanhas/CampanhaCreate/components/StepCard.tsx
import Chip from "@/pages/campanhas/CampanhaCreate/components/ui/Chip";

export default function StepCard({
  step,
  title,
  description,
  rightLabel,
  children,
}: {
  step: number;
  title: string;
  description?: string;
  rightLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800">
              {step}
            </span>

            <div className="min-w-0">
              <h2 className="text-base font-semibold text-slate-900">{title}</h2>
              {description ? (
                <p className="mt-1 text-sm text-slate-600">{description}</p>
              ) : null}
            </div>
          </div>
        </div>

        {rightLabel ? (
          <div className="shrink-0">
            <Chip tone="info">{rightLabel}</Chip>
          </div>
        ) : null}
      </div>

      {children}
    </section>
  );
}
