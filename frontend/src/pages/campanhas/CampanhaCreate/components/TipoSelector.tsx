// /var/www/frontend/src/pages/campanhas/CampanhaCreate/components/TipoSelector.tsx
import type { CampanhaTipo } from "@/hooks/useCampanhas";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export default function TipoSelector({
  value,
  onChange,
}: {
  value: CampanhaTipo;
  onChange: (v: CampanhaTipo) => void;
}) {
  const opts: Array<{ v: CampanhaTipo; label: string; desc: string }> = [
    { v: "banner", label: "Banner", desc: "Formato padrão (desktop/mobile)." },
    { v: "popup", label: "Pop-up", desc: "Aparece em destaque no site." },
    { v: "destaque", label: "Destaque", desc: "Prioridade visual em listagens." },
    { v: "combo", label: "Combo", desc: "Mais de um posicionamento." },
  ];

  return (
    <div>
      <label className="mb-3 block text-xs font-medium text-gray-600">
        Tipo <span className="text-[#B70F0A]">*</span>
      </label>

      {/* ✅ no layout atual (lg:col-span-8) 4 colunas ficam apertadas.
          Usamos 2 colunas até telas bem largas e só depois 4. */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {opts.map((opt) => {
          const active = value === opt.v;

          return (
            <button
              key={opt.v}
              type="button"
              onClick={() => onChange(opt.v)}
              className={cx(
                "group relative h-full rounded-3xl border p-5 text-left transition-all duration-200 shadow-sm",
                active
                  ? "border-[#B70F0A]/30 bg-[#B70F0A]/5 ring-4 ring-[#B70F0A]/10"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900">{opt.label}</div>
                  <div className="mt-1 text-xs text-gray-600">{opt.desc}</div>
                </div>

                <div
                  className={cx(
                    "shrink-0 flex h-7 w-7 items-center justify-center rounded-xl border text-xs font-bold transition",
                    active
                      ? "border-[#B70F0A] bg-[#B70F0A] text-white"
                      : "border-gray-200 text-gray-400 group-hover:border-gray-300"
                  )}
                >
                  ✓
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
