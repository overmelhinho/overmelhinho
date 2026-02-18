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

export default function FinanceiroCard({
  financeiroStatus,
  financeiroForma,
  financeiroValor,
  financeiroVenc,
  financeiroPagoEm,
  financeiroObs,

  fmtMoney,
  fmtDateOnly,
  fmtDate,
  financeiroTone,
  financeiroLabelPt,
}: {
  financeiroStatus?: string | null;
  financeiroForma?: string | null;
  financeiroValor?: number | null;
  financeiroVenc?: string | null;
  financeiroPagoEm?: string | null;
  financeiroObs?: string | null;

  fmtMoney: (v?: number | null) => string;
  fmtDateOnly: (iso?: string | null) => string;
  fmtDate: (iso?: string | null) => string;
  financeiroTone: (s?: string | null) => BadgeTone;
  financeiroLabelPt: (s?: string | null) => string;
}) {
  const isAguardando =
    !!financeiroStatus &&
    String(financeiroStatus).toUpperCase() === "AGUARDANDO_PAGAMENTO";

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-3 text-sm font-semibold text-gray-900">Financeiro</div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Status</span>
          <span className="font-semibold text-gray-900">
            {financeiroStatus ? (
              <Badge tone={financeiroTone(financeiroStatus)}>
                {financeiroLabelPt(financeiroStatus)}
              </Badge>
            ) : (
              "—"
            )}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-600">Forma</span>
          <span className="font-semibold text-gray-900">
            {financeiroForma ? String(financeiroForma) : "—"}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-600">Valor</span>
          <span className="font-semibold text-gray-900">
            {fmtMoney(financeiroValor ?? null)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-600">Vencimento</span>
          <span className="font-semibold text-gray-900">
            {fmtDateOnly(financeiroVenc ?? null)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-600">Pago em</span>
          <span className="font-semibold text-gray-900">
            {fmtDate(financeiroPagoEm ?? null)}
          </span>
        </div>

        {financeiroObs ? (
          <div className="mt-3 whitespace-pre-line rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700">
            {String(financeiroObs)}
          </div>
        ) : null}
      </div>

      {isAguardando ? (
        <div className="mt-4 rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-800">
          Pela regra oficial: campanha fica <b>PENDENTE</b> e não concorre no
          algoritmo até virar <b>PAGO</b> ou <b>CORTESIA</b>.
        </div>
      ) : null}
    </div>
  );
}
