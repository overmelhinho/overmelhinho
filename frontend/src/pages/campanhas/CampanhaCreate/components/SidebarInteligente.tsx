// /var/www/frontend/src/pages/campanhas/CampanhaCreate/components/SidebarInteligente.tsx
import Chip from "@/pages/campanhas/CampanhaCreate/components/ui/Chip";
import ProgressBar from "@/pages/campanhas/CampanhaCreate/components/ui/ProgressBar";

export default function SidebarInteligente({
  pct,
  nextHint,
  items,
  resumo,
}: {
  pct: number;
  nextHint: string;
  items: Array<{ key: string; label: string; ok: boolean; optional?: boolean }>;
  resumo: Record<string, string>;
  submitDisabled?: boolean;   // compat (não usado)
  submitLoading?: boolean;    // compat (não usado)
  onSubmit?: () => void;      // compat (não usado)
}) {
  const pendencias = items.filter((i) => !i.ok && !i.optional);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-gray-900">Resumo</div>
          <div className="mt-1 text-sm text-gray-500">Status em tempo real.</div>
        </div>
        <Chip tone={pct === 100 ? "success" : pct >= 60 ? "info" : "neutral"}>{pct}%</Chip>
      </div>

      <div className="mt-4">
        <ProgressBar value={pct} />
      </div>

      {pendencias.length > 0 ? (
        <div className="mt-4 rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
          <div className="text-sm font-semibold text-yellow-900">Pendências</div>
          <div className="mt-2 space-y-2">
            {pendencias.map((p) => (
              <div key={p.key} className="flex items-center justify-between gap-3">
                <div className="text-sm text-yellow-900/90">{p.label}</div>
                <Chip tone="warn">Falta</Chip>
              </div>
            ))}
          </div>

          <div className="mt-3 rounded-xl border border-yellow-200 bg-white/60 p-3 text-xs text-yellow-900/80">
            Próximo passo: <span className="font-semibold">{nextHint}</span>
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-4">
          <div className="text-sm font-semibold text-green-900">Tudo pronto</div>
          <div className="mt-1 text-sm text-green-900/80">
            Você pode criar a campanha.
          </div>
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-4">
        <div className="text-sm font-semibold text-gray-900">Detalhes</div>
        <div className="mt-4 space-y-3 text-sm">
          {Object.entries(resumo).map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-3">
              <span className="text-gray-500">{k}</span>
              <span className="font-semibold text-gray-900">{v}</span>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-xs text-gray-600">
          Nota: “Global” ignora cidade/segment/keyword, mas respeita elegibilidade, plano e rotação.
        </div>
      </div>
    </div>
  );
}
