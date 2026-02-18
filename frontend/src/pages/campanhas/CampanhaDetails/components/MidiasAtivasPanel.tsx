import type { CampanhaMidiasAtivas } from "@/hooks/useCampanhaMidias";

function Badge({
  children,
  tone = "neutral",
}: {
  children: any;
  tone?: "neutral" | "info" | "warn" | "danger" | "success";
}) {
  const cls =
    tone === "danger"
      ? "border-red-200 bg-red-50 text-red-700"
      : tone === "warn"
      ? "border-yellow-200 bg-yellow-50 text-yellow-800"
      : tone === "success"
      ? "border-green-200 bg-green-50 text-green-700"
      : tone === "info"
      ? "border-blue-200 bg-blue-50 text-blue-700"
      : "border-gray-200 bg-white text-gray-700";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${cls}`}
    >
      {children}
    </span>
  );
}

export default function MidiasAtivasPanel({
  ativas,
  loading,
}: {
  ativas?: CampanhaMidiasAtivas | null;
  loading?: boolean;
}) {
  return (
    <div className="mb-5 rounded-2xl border border-gray-200 bg-gray-50 p-4">
      <div className="mb-2 text-xs font-semibold text-gray-700">
        Ativas (derivadas)
      </div>

      {!ativas || Object.keys(ativas).length === 0 ? (
        <div className="text-sm text-gray-600">
          {loading ? "Carregando ativas…" : "Nenhuma mídia ativa publicada ainda."}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {Object.entries(ativas).map(([tipo, slots]) => (
            <div
              key={tipo}
              className="rounded-2xl border border-gray-200 bg-white p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-semibold text-gray-900">{tipo}</div>
                <Badge tone="info">publicado</Badge>
              </div>

              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-gray-600">Desktop</span>
                  {slots.desktop?.desktop_url ? (
                    <a
                      href={slots.desktop.desktop_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#B70F0A] underline"
                    >
                      abrir ↗
                    </a>
                  ) : (
                    <span className="text-gray-500">—</span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-gray-600">Mobile</span>
                  {slots.mobile?.mobile_url ? (
                    <a
                      href={slots.mobile.mobile_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#B70F0A] underline"
                    >
                      abrir ↗
                    </a>
                  ) : (
                    <span className="text-gray-500">—</span>
                  )}
                </div>
              </div>

              <div className="mt-3 text-xs text-gray-500">
                Dica: use “Ativa (D/M)” na lista abaixo para escolher qual versão
                vira ativa.
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
