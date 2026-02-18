// /var/www/frontend/src/pages/campanhas/CampanhaCreate/components/CampanhaCreateHeader.tsx
import Chip from "@/pages/campanhas/CampanhaCreate/components/ui/Chip";
import ProgressBar from "@/pages/campanhas/CampanhaCreate/components/ui/ProgressBar";

export default function CampanhaCreateHeader({
  breadcrumb,
  title,
  progressPct,
  isGlobal,
  hint,
  onBack,
  // mantemos props para compatibilidade, mas não exibimos CTA duplicado
  onSubmit,
  submitDisabled,
  submitLoading,
}: {
  breadcrumb: React.ReactNode;
  title: string;
  progressPct: number;
  isGlobal: boolean;
  hint: string;
  onBack: () => void;
  onSubmit: () => void;
  submitDisabled: boolean;
  submitLoading: boolean;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          {breadcrumb}

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
            <Chip tone={progressPct === 100 ? "success" : progressPct >= 60 ? "info" : "neutral"}>
              Progresso: {progressPct}%
            </Chip>
            {isGlobal ? <Chip tone="warn">Placement global</Chip> : null}
          </div>

          <div className="mt-4 max-w-2xl">
            <ProgressBar value={progressPct} />
            <div className="mt-2 text-sm text-gray-600">{hint}</div>
            <div className="mt-3 text-xs text-gray-500">
              Dica: complete os passos obrigatórios para liberar a criação com segurança.
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
            onClick={onBack}
          >
            Voltar
          </button>

          {/* CTA final fica no StickyActionBar (evita duplicação). Mantemos aqui apenas estado "fantasma" (compat). */}
          <button
            type="button"
            onClick={onSubmit}
            disabled={true}
            className="hidden"
            aria-hidden="true"
          >
            {submitLoading ? "Salvando..." : "Criar campanha"}
          </button>
        </div>
      </div>
    </div>
  );
}
