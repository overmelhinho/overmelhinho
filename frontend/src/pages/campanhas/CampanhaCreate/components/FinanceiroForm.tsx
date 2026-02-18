// /var/www/frontend/src/pages/campanhas/CampanhaCreate/components/FinanceiroForm.tsx
function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export default function FinanceiroForm({
  status,
  forma,
  valor,
  vencimento,
  pago_em,
  observacao,
  due_at,
  onChange,
}: {
  status: string;
  forma: string;
  valor: string;
  vencimento: string;
  pago_em: string;
  observacao: string;
  due_at: string;
  onChange: (patch: Partial<{
    financeiro_status: string;
    financeiro_forma: string;
    financeiro_valor: string;
    financeiro_vencimento: string;
    financeiro_pago_em: string;
    financeiro_observacao: string;
    due_at: string;
  }>) => void;
}) {
  const isAguardando = status === "AGUARDANDO_PAGAMENTO";
  const isOk = status === "PAGO" || status === "CORTESIA";

  const inputBase =
    "w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none shadow-sm focus:border-slate-300 focus:ring-4 focus:ring-slate-900/5";

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">Financeiro</div>
          <div className="mt-1 text-sm text-slate-600">
            Obrigatório pela regra oficial. Campanhas aguardando pagamento ficam pendentes.
          </div>
        </div>

        {isOk ? (
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-900">
            Status OK
          </span>
        ) : isAguardando ? (
          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">
            Vai ficar pendente
          </span>
        ) : status ? (
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
            Revisar status
          </span>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
        <div className="md:col-span-4">
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Status <span className="text-[#B70F0A]">*</span>
          </label>
          <select
            className={cx(inputBase)}
            value={status}
            onChange={(e) => onChange({ financeiro_status: e.target.value })}
          >
            <option value="">Selecione…</option>
            <option value="AGUARDANDO_PAGAMENTO">AGUARDANDO_PAGAMENTO</option>
            <option value="PAGO">PAGO</option>
            <option value="CORTESIA">CORTESIA</option>
          </select>

          {isAguardando ? (
            <div className="mt-3 rounded-3xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
              Campanha ficará <b>PENDENTE</b> e não concorre até ser <b>PAGO</b> ou <b>CORTESIA</b>.
            </div>
          ) : isOk ? (
            <div className="mt-3 rounded-3xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-950">
              Campanha ficará <b>ATIVA</b> e poderá concorrer (respeitando período e demais regras).
            </div>
          ) : null}
        </div>

        <div className="md:col-span-4">
          <label className="mb-1 block text-xs font-medium text-slate-600">Forma</label>
          <input
            className={inputBase}
            placeholder="ex: boleto"
            value={forma}
            onChange={(e) => onChange({ financeiro_forma: e.target.value })}
          />
        </div>

        <div className="md:col-span-4">
          <label className="mb-1 block text-xs font-medium text-slate-600">Valor</label>
          <input
            className={inputBase}
            placeholder="ex: 199.90"
            value={valor}
            onChange={(e) => onChange({ financeiro_valor: e.target.value.replace(/[^\d.]/g, "") })}
          />
        </div>

        <div className="md:col-span-4">
          <label className="mb-1 block text-xs font-medium text-slate-600">Vencimento</label>
          <input
            type="date"
            className={inputBase}
            value={vencimento}
            onChange={(e) => onChange({ financeiro_vencimento: e.target.value })}
          />
        </div>

        <div className="md:col-span-4">
          <label className="mb-1 block text-xs font-medium text-slate-600">Pago em</label>
          <input
            type="date"
            className={inputBase}
            value={pago_em}
            onChange={(e) => onChange({ financeiro_pago_em: e.target.value })}
          />
        </div>

        <div className="md:col-span-4">
          <label className="mb-1 block text-xs font-medium text-slate-600">Prazo (tickets - legado)</label>
          <input
            type="date"
            className={inputBase}
            value={due_at}
            onChange={(e) => onChange({ due_at: e.target.value })}
          />
        </div>

        <div className="md:col-span-12">
          <label className="mb-1 block text-xs font-medium text-slate-600">Observação</label>
          <textarea
            className={inputBase}
            rows={3}
            value={observacao}
            onChange={(e) => onChange({ financeiro_observacao: e.target.value })}
            placeholder="Opcional: detalhes de negociação, observações do pagamento, etc."
          />
        </div>
      </div>
    </div>
  );
}
