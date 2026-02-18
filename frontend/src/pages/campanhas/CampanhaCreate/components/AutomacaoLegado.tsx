// /var/www/frontend/src/pages/campanhas/CampanhaCreate/components/AutomacaoLegado.tsx
export default function AutomacaoLegado({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-2 text-sm font-semibold text-slate-900">Automação (legado)</div>

      <label className="flex items-center gap-3 text-sm text-slate-800">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="font-medium">Gerar tickets automaticamente</span>
      </label>

      <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
        Mantido por compatibilidade com o backend atual. Pela doc oficial, o financeiro é sempre criado.
      </div>
    </div>
  );
}
