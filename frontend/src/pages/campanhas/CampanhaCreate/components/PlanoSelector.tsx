// /var/www/frontend/src/pages/campanhas/CampanhaCreate/components/PlanoSelector.tsx
import type { PlanoCampanha } from "@/hooks/useCampanhas";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export default function PlanoSelector({
  value,
  onChange,
  keywordsLimit,
}: {
  value: PlanoCampanha;
  onChange: (v: PlanoCampanha) => void;
  keywordsLimit: number;
}) {
  const planos: Array<{
    v: PlanoCampanha;
    label: string;
    desc: string;
    highlight?: boolean;
  }> = [
    { v: "premium", label: "Premium", desc: "Máxima prioridade e visibilidade.", highlight: true },
    { v: "intermediario", label: "Intermediário", desc: "Equilíbrio custo/benefício." },
    { v: "basico", label: "Básico", desc: "Plano essencial." },
  ];

  return (
    <div>
      <label className="mb-3 block text-xs font-medium text-gray-600">
        Plano <span className="text-[#B70F0A]">*</span>
      </label>

      {/* ✅ em col-span-8, 3 colunas no lg pode ficar apertado;
          vamos de 1→2 e 3 só em telas bem largas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
        {planos.map((p) => {
          const active = value === p.v;

          return (
            <button
              key={p.v}
              type="button"
              onClick={() => onChange(p.v)}
              className={cx(
                "relative rounded-3xl border p-6 text-left transition-all duration-200 shadow-sm",
                active
                  ? "border-[#B70F0A]/30 bg-[#B70F0A]/5 ring-4 ring-[#B70F0A]/10"
                  : "border-gray-200 bg-white hover:shadow-md"
              )}
            >
              {p.highlight ? (
                <span className="absolute right-4 top-4 rounded-full bg-[#B70F0A] px-3 py-1 text-[10px] font-semibold text-white">
                  Recomendado
                </span>
              ) : null}

              <div className="text-base font-semibold text-gray-900">{p.label}</div>
              <div className="mt-1 text-sm text-gray-600">{p.desc}</div>

              <div className="mt-4 text-sm text-gray-700">
                Limite de keywords:
                <span className="ml-1 font-semibold text-gray-900">{keywordsLimit}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
