type BadgeTone = "neutral" | "info" | "warn" | "danger" | "success";

function Badge({
  children,
  tone = "neutral",
}: {
  children: any;
  tone?: BadgeTone;
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

export default function ResumoCard({
  clienteNome,
  clienteId,
  valorTotal,
  createdAt,

  placements,
  globalPlacements,

  keywords,
  cidades,
  isGlobal,

  fmtMoney,
  fmtDate,
}: {
  clienteNome: string;
  clienteId?: number | string | null;
  valorTotal?: number | null;
  createdAt?: string | null;

  placements?: any[] | null;
  globalPlacements: string[];

  keywords?: any[] | string | null;
  cidades?: any[] | null;
  isGlobal: boolean;

  fmtMoney: (v?: number | null) => string;
  fmtDate: (iso?: string | null) => string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-2">
      <div className="mb-3 text-sm font-semibold text-gray-900">Resumo</div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="text-xs font-medium text-gray-600">Cliente</div>
          <div className="mt-1 font-semibold text-gray-900">{clienteNome}</div>
          <div className="mt-1 text-xs text-gray-500">
            cliente_id: {clienteId ?? "—"}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="text-xs font-medium text-gray-600">Valor total</div>
          <div className="mt-1 font-semibold text-gray-900">
            {fmtMoney(valorTotal ?? null)}
          </div>
          <div className="mt-1 text-xs text-gray-500">
            Criada em {fmtDate(createdAt ?? null)}
          </div>
        </div>

        {/* Placements */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 md:col-span-2">
          <div className="text-xs font-medium text-gray-600">Placements</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {Array.isArray(placements) && placements.length ? (
              placements.map((p: any) => (
                <Badge
                  key={String(p)}
                  tone={globalPlacements.includes(String(p)) ? "warn" : "info"}
                >
                  {String(p)}
                </Badge>
              ))
            ) : (
              <div className="text-sm text-gray-800">—</div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 md:col-span-2">
          <div className="text-xs font-medium text-gray-600">Keywords</div>
          <div className="mt-2 text-sm text-gray-800">
            {Array.isArray(keywords) && keywords.length
              ? keywords.join(", ")
              : typeof keywords === "string" && keywords.trim()
              ? keywords
              : "—"}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 md:col-span-2">
          <div className="text-xs font-medium text-gray-600">Cidades</div>
          <div className="mt-2 text-sm text-gray-800">
            {isGlobal ? (
              <span className="text-gray-700">N/A (global)</span>
            ) : Array.isArray(cidades) && cidades.length ? (
              cidades
                .map((x: any) =>
                  x?.nome ? `${x.nome}${x?.uf ? `-${x.uf}` : ""}` : String(x?.id ?? x)
                )
                .join(", ")
            ) : (
              "—"
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
