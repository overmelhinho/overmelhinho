// /var/www/frontend/src/pages/campanhas/CampanhaCreate/components/KeywordsEditor.tsx
import Chip from "@/pages/campanhas/CampanhaCreate/components/ui/Chip";
import ProgressBar from "@/pages/campanhas/CampanhaCreate/components/ui/ProgressBar";
import { normalizeKeyword, parseKeywords } from "@/pages/campanhas/CampanhaCreate/utils/form";

export default function KeywordsEditor({
  value,
  onChange,
  keywordsParsed,
  keywordsLimit,
}: {
  value: string;
  onChange: (v: string) => void;
  keywordsParsed: string[];
  keywordsLimit: number;
}) {
  const count = Math.min(keywordsParsed.length, keywordsLimit);
  const pct = keywordsLimit ? Math.round((count / keywordsLimit) * 100) : 0;
  const nearLimit = keywordsLimit > 0 && count >= Math.max(1, keywordsLimit - 2);

  function removeChip(original: string) {
    const norm = normalizeKeyword(original);
    const next = parseKeywords(value).filter((k) => normalizeKeyword(k) !== norm);
    onChange(next.join(", "));
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        <div className="font-semibold text-slate-900">Como funciona</div>
        <div className="mt-1 text-slate-700">
          Keywords ativam a campanha em buscas. Segmentos são herdados do cliente na criação (snapshot).
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="mb-1 block text-xs font-medium text-slate-600">Keywords (opcional)</label>
        <textarea
          className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none shadow-sm focus:border-slate-300 focus:ring-4 focus:ring-slate-900/5"
          rows={3}
          placeholder="Separe por vírgula ou quebra de linha (ex: dentista, clínica, ortodontia)"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />

        <div className="mt-3">
          <ProgressBar value={pct} />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="text-slate-600">
              Normalizadas/sem duplicados: <span className="font-semibold text-slate-900">{count}</span> /{" "}
              <span className="font-semibold text-slate-900">{keywordsLimit}</span>
            </div>

            {nearLimit ? (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-amber-900">
                Próximo do limite do plano
              </span>
            ) : null}
          </div>
        </div>

        {keywordsParsed.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {keywordsParsed.map((k) => (
              <Chip key={normalizeKeyword(k)} onRemove={() => removeChip(k)}>
                {k}
              </Chip>
            ))}
          </div>
        ) : (
          <div className="mt-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            Nenhuma keyword definida.
          </div>
        )}
      </div>
    </div>
  );
}
