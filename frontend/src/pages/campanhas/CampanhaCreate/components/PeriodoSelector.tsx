// /var/www/frontend/src/pages/campanhas/CampanhaCreate/components/PeriodoSelector.tsx
export default function PeriodoSelector({
  data_inicio,
  data_fim,
  onChangeInicio,
  onChangeFim,
}: {
  data_inicio: string;
  data_fim: string;
  onChangeInicio: (v: string) => void;
  onChangeFim: (v: string) => void;
}) {
  const invalidRange = !!data_inicio && !!data_fim && data_fim < data_inicio;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
        <div className="md:col-span-6">
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Data início <span className="text-[#B70F0A]">*</span>
          </label>
          <input
            type="date"
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none shadow-sm focus:border-slate-300 focus:ring-4 focus:ring-slate-900/5"
            value={data_inicio}
            onChange={(e) => onChangeInicio(e.target.value)}
          />
        </div>

        <div className="md:col-span-6">
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Data fim <span className="text-[#B70F0A]">*</span>
          </label>
          <input
            type="date"
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none shadow-sm focus:border-slate-300 focus:ring-4 focus:ring-slate-900/5"
            value={data_fim}
            onChange={(e) => onChangeFim(e.target.value)}
          />
        </div>

        {invalidRange ? (
          <div className="md:col-span-12">
            <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              O fim do período não pode ser anterior ao início.
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
