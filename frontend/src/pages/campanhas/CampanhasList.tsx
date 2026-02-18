// /var/www/frontend/src/pages/campanhas/CampanhasList.tsx
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Filter, ExternalLink } from "lucide-react";
import Skeleton from "@/components/ui/skeleton";
import { useCampanhas, Campanha, CampanhaStatus, CampanhaTipo } from "@/hooks/useCampanhas";

/**
 * A listagem do backend traz campos adicionais via join/select:
 * - cliente_nome
 * - financeiro_status/valor/vencimento
 * Mantemos compatível sem exigir alteração no hook.
 */
type CampanhaRow = Campanha & {
  cliente_nome?: string | null;

  // legado (join)
  financeiro_status?: string | null;
  financeiro_valor?: number | null;
  financeiro_vencimento?: string | null;
};

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
      : "border-slate-200 bg-white text-slate-700";

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${cls}`}>
      {children}
    </span>
  );
}

function statusTone(s: string): "neutral" | "info" | "warn" | "danger" | "success" {
  const v = (s || "").toLowerCase();
  if (v === "rascunho") return "neutral";
  if (v === "ativa") return "info";
  if (v === "encerrada") return "success";
  if (v === "cancelada") return "danger";
  return "neutral";
}

function statusLabelPt(s: string) {
  const v = (s || "").toLowerCase();
  const map: Record<string, string> = {
    rascunho: "Rascunho",
    ativa: "Ativa",
    encerrada: "Encerrada",
    cancelada: "Cancelada",
  };
  return map[v] ?? s;
}

function tipoLabelPt(t: string) {
  const v = (t || "").toLowerCase();
  const map: Record<string, string> = {
    banner: "Banner",
    popup: "Pop-up",
    destaque: "Destaque",
    combo: "Combo",
  };
  return map[v] ?? t;
}

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("pt-BR");
  } catch {
    return iso;
  }
}

function fmtMoney(v?: number | null) {
  if (v === null || v === undefined) return "—";
  try {
    return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  } catch {
    return String(v);
  }
}

function financeiroLabelPt(s?: string | null) {
  const v = String(s || "").toUpperCase();
  const map: Record<string, string> = {
    AGUARDANDO_PAGAMENTO: "Aguardando pagamento",
    PAGO: "Pago",
    CORTESIA: "Cortesia",
    PENDENTE: "Aguardando pagamento", // compat
  };
  return map[v] ?? (s || "—");
}

function financeiroTone(s?: string | null) {
  const v = String(s || "").toUpperCase();
  if (v === "PAGO" || v === "CORTESIA") return "success";
  if (v === "AGUARDANDO_PAGAMENTO" || v === "PENDENTE") return "warn";
  return "neutral";
}

/**
 * Derivação conservadora (não substitui backend):
 * Exibe se:
 * - status campanha == ativa
 * - financeiro em {PAGO, CORTESIA}
 */
function canShowOnSite(c: CampanhaRow) {
  const campStatus = String(c.status || "").toLowerCase();
  const fin = (c as any)?.financeiro?.status ?? (c as any)?.financeiro_status ?? null;
  const finUp = String(fin || "").toUpperCase();
  const finOk = finUp === "PAGO" || finUp === "CORTESIA";
  return campStatus === "ativa" && finOk;
}

export default function CampanhasList() {
  const [filters, setFilters] = useState<{
    search: string;
    status: "" | CampanhaStatus;
    tipo: "" | CampanhaTipo;
    cliente_id: string;
    page: number;
    per_page: number;
  }>({
    search: "",
    status: "",
    tipo: "",
    cliente_id: "",
    page: 1,
    per_page: 20,
  });

  const queryParams = useMemo(() => {
    return {
      page: filters.page,
      per_page: filters.per_page,
      status: filters.status || undefined,
      tipo: filters.tipo || undefined,
      cliente_id: filters.cliente_id ? filters.cliente_id : undefined,
    };
  }, [filters.page, filters.per_page, filters.status, filters.tipo, filters.cliente_id]);

  const { data, isLoading, isError } = useCampanhas(queryParams);
  const rows: CampanhaRow[] = (data?.data ?? []) as any;

  const filteredRows = useMemo(() => {
    const s = filters.search.trim().toLowerCase();
    if (!s) return rows;

    return rows.filter((c) => {
      const idStr = String(c.id);
      const nome = (c.nome || "").toLowerCase();
      const tipo = (c.tipo || "").toLowerCase();
      const status = (c.status || "").toLowerCase();
      const clienteNome = ((c as any)?.cliente_nome || (c as any)?.cliente?.nome_fantasia || "").toLowerCase();
      return idStr.includes(s) || nome.includes(s) || tipo.includes(s) || status.includes(s) || clienteNome.includes(s);
    });
  }, [rows, filters.search]);

  const total = data?.total ?? 0;

  if (isLoading) return <Skeleton className="h-32 w-full" />;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-sm text-slate-500">Campanhas</div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Campanhas</h1>
          <p className="mt-1 text-sm text-slate-600">
            Gestão de campanhas por cliente (mídias, período, financeiro e status).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/campanhas/nova"
            className="rounded-2xl bg-[#B70F0A] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95"
          >
            + Nova campanha
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
          <div className="md:col-span-5">
            <label className="mb-1 block text-xs font-medium text-slate-600">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-black/5"
                placeholder="ID, nome, cliente, tipo, status…"
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-600">Status</label>
            <select
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/5"
              value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value as any, page: 1 }))}
            >
              <option value="">Todos</option>
              <option value="rascunho">Rascunho</option>
              <option value="ativa">Ativa</option>
              <option value="encerrada">Encerrada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-600">Tipo</label>
            <select
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/5"
              value={filters.tipo}
              onChange={(e) => setFilters((f) => ({ ...f, tipo: e.target.value as any, page: 1 }))}
            >
              <option value="">Todos</option>
              <option value="banner">Banner</option>
              <option value="popup">Pop-up</option>
              <option value="destaque">Destaque</option>
              <option value="combo">Combo</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-600">Cliente ID</label>
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/5"
              placeholder="ex: 12"
              value={filters.cliente_id}
              onChange={(e) => {
                const v = e.target.value.replace(/[^\d]/g, "");
                setFilters((f) => ({ ...f, cliente_id: v, page: 1 }));
              }}
            />
          </div>

          <div className="md:col-span-1">
            <label className="mb-1 block text-xs font-medium text-slate-600">Itens</label>
            <div className="inline-flex w-full items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm">
              <Filter className="h-4 w-4 text-slate-500" />
              <select
                className="w-full bg-transparent outline-none"
                value={filters.per_page}
                onChange={(e) => setFilters((f) => ({ ...f, per_page: Number(e.target.value), page: 1 }))}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs text-slate-500">
            {isError
              ? "Erro ao carregar."
              : `Total: ${total}${filters.search.trim() ? ` (filtrado: ${filteredRows.length})` : ""}`}
          </div>

          <div className="flex items-center gap-2">
            <Badge tone="neutral">Dica: “Exibe?” é conservador (ativa + pago/cortesia)</Badge>
          </div>
        </div>
      </div>

      {/* Lista */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {isError && (
          <div className="p-6 text-sm text-red-600">
            Erro ao carregar campanhas. Verifique token/permissões e a rota <b>/v1/campanhas</b>.
          </div>
        )}

        {!isError && filteredRows.length === 0 && (
          <div className="p-10 text-center">
            <div className="mx-auto mb-2 text-sm font-semibold text-slate-900">Nenhuma campanha encontrada</div>
            <div className="mx-auto max-w-lg text-sm text-slate-600">
              Ajuste os filtros ou crie uma nova campanha.
            </div>
            <div className="mt-5">
              <Link
                to="/campanhas/nova"
                className="inline-flex rounded-2xl bg-[#B70F0A] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95"
              >
                + Nova campanha
              </Link>
            </div>
          </div>
        )}

        {!isError && filteredRows.length > 0 && (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[1200px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-600">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Campanha</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Período</th>
                  <th className="px-4 py-3">Financeiro</th>
                  <th className="px-4 py-3">Exibe?</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredRows.map((c) => {
                  const clienteNome =
                    c.cliente_nome ||
                    (c as any)?.cliente?.nome_fantasia ||
                    (c as any)?.cliente?.razao_social ||
                    `Cliente #${c.cliente_id}`;

                  const finStatus = (c as any)?.financeiro?.status ?? (c as any)?.financeiro_status ?? null;
                  const finValor = (c as any)?.financeiro?.valor ?? (c as any)?.financeiro_valor ?? null;
                  const finVenc = (c as any)?.financeiro?.vencimento ?? (c as any)?.financeiro_vencimento ?? null;

                  const show = canShowOnSite(c);

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-4 align-top font-semibold text-slate-900">#{c.id}</td>

                      <td className="px-4 py-4">
                        <div className="font-semibold text-slate-900">{c.nome}</div>
                        <div className="mt-0.5 text-xs text-slate-500">Criado em {fmtDate(c.created_at || null)}</div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="font-semibold text-slate-900">{clienteNome}</div>
                        <div className="mt-0.5 text-xs text-slate-500">ID: {c.cliente_id}</div>
                      </td>

                      <td className="px-4 py-4">
                        <Badge tone="info">{tipoLabelPt(c.tipo)}</Badge>
                      </td>

                      <td className="px-4 py-4">
                        <Badge tone={statusTone(c.status)}>{statusLabelPt(c.status)}</Badge>
                      </td>

                      <td className="px-4 py-4">
                        <div className="text-slate-900">
                          {fmtDate(c.data_inicio)} → {fmtDate(c.data_fim)}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="font-semibold text-slate-900">{fmtMoney(finValor)}</div>
                          <div className="text-xs text-slate-500">
                            {finStatus ? (
                              <>
                                <span>Status: </span>
                                <span className="font-semibold">{financeiroLabelPt(finStatus)}</span>
                              </>
                            ) : (
                              "—"
                            )}
                            {finVenc ? ` • Venc: ${fmtDate(finVenc)}` : ""}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-1">
                          <Badge tone={show ? "success" : "warn"}>{show ? "Sim" : "Não"}</Badge>
                          {finStatus ? <Badge tone={financeiroTone(finStatus)}>{financeiroLabelPt(finStatus)}</Badge> : null}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/campanhas/${c.id}/editar`}
                            className="rounded-2xl bg-[#B70F0A] px-3 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-95"
                          >
                            Abrir
                          </Link>

                          <button
                            type="button"
                            onClick={() => window.open(`/campanhas/${c.id}/editar`, "_blank", "noreferrer")}
                            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-sm hover:bg-slate-50"
                            title="Abrir em nova aba"
                          >
                            <ExternalLink className="inline h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!isError && data && data.last_page > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3">
            <div className="text-sm text-slate-600">
              Página {data.current_page} de {data.last_page}
            </div>

            <div className="flex items-center gap-2">
              <button
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-50"
                disabled={filters.page <= 1}
                onClick={() => setFilters((f) => ({ ...f, page: Math.max(1, f.page - 1) }))}
              >
                Anterior
              </button>

              <button
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-50"
                disabled={filters.page >= data.last_page}
                onClick={() => setFilters((f) => ({ ...f, page: Math.min(data.last_page, f.page + 1) }))}
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
