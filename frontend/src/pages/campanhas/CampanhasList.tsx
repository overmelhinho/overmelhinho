import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Filter, ExternalLink, Info, ChevronDown, CheckCircle, Calendar, AlertCircle, Plus, Settings } from "lucide-react";
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
      ? "border-red-300 bg-red-50 text-red-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]"
      : tone === "warn"
        ? "border-orange-300 bg-orange-50 text-orange-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]"
        : tone === "success"
          ? "border-green-300 bg-green-50 text-green-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]"
          : tone === "info"
            ? "border-blue-300 bg-blue-50 text-blue-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]"
            : "border-slate-300 bg-white text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]";

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${cls} shadow-sm`}>
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
  const navigate = useNavigate();
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
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

  const totalCount = data?.total ?? 0;

  const kpis = useMemo(() => {
    const activeData = rows.filter(r => r.status === 'ativa').length;
    const waitingData = rows.filter(r => {
      const fin = (r as any)?.financeiro?.status ?? (r as any)?.financeiro_status ?? null;
      return fin === 'AGUARDANDO_PAGAMENTO' || fin === 'PENDENTE';
    }).length;

    const now = new Date();
    const in7Days = new Date();
    in7Days.setDate(now.getDate() + 7);

    const expiringData = rows.filter(r => {
      if (!r.data_fim) return false;
      const d = new Date(r.data_fim);
      return d >= now && d <= in7Days;
    }).length;

    return { active: activeData, waiting: waitingData, expiring: expiringData };
  }, [rows]);

  if (isLoading) return <Skeleton className="h-[400px] w-full rounded-[32px]" />;

  return (
    <div className="space-y-6">
      {/* Header com Tooltip de Progressive Disclosure */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 group">
            <h1 className="text-3xl font-black tracking-tight text-slate-900 font-serif">Campanhas</h1>
            <div className="relative group/tooltip">
              <Info size={18} className="text-slate-400 cursor-help transition-colors group-hover/tooltip:text-slate-600" />
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 w-72 p-4 bg-slate-900 text-white text-[11px] rounded-2xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all shadow-2xl z-50 leading-relaxed font-semibold">
                Gestão tátil de ativos digitais. Utilize os filtros avançados para métricas específicas. O status unificado combina ativação de sistema e validação financeira.
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900"></div>
              </div>
            </div>
          </div>
          <p className="mt-0.5 text-sm font-bold text-slate-400 uppercase tracking-widest">
            Painel Central de Exposição
          </p>
        </div>

        <Link
          to="/campanhas/nova"
          className="inline-flex items-center gap-2 rounded-2xl bg-[#C00000] px-6 py-3.5 text-sm font-black text-white shadow-xl shadow-red-900/20 hover:bg-[#A30D09] active:scale-[0.95] transition-all transform hover:-translate-y-0.5"
        >
          <Plus size={18} /> NOVA CAMPANHA
        </Link>
      </div>

      {/* KPI Dashboard - Bento Grid com Skeuomorphism */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-[28px] p-6 shadow-sm border border-slate-100 hover:-translate-y-1 hover:shadow-md transition-all duration-300 group border-b-4 border-b-green-500/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-green-50 text-green-600">
              <CheckCircle size={20} />
            </div>
            <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 group-hover:text-green-600 transition-colors">Total Ativas</span>
          </div>
          <div className="text-4xl font-black text-slate-900 tracking-tighter">{kpis.active}</div>
        </div>

        <div className="bg-white rounded-[28px] p-6 shadow-sm border border-slate-100 hover:-translate-y-1 hover:shadow-md transition-all duration-300 group border-b-4 border-b-orange-500/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-orange-50 text-orange-500">
              <AlertCircle size={20} />
            </div>
            <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 group-hover:text-orange-500 transition-colors">Aguardando Pagamento</span>
          </div>
          <div className="text-4xl font-black text-slate-900 tracking-tighter">{kpis.waiting}</div>
        </div>

        <div className="bg-white rounded-[28px] p-6 shadow-sm border border-slate-100 hover:-translate-y-1 hover:shadow-md transition-all duration-300 group border-b-4 border-b-red-500/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-red-50 text-red-600">
              <Calendar size={20} />
            </div>
            <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 group-hover:text-red-600 transition-colors">Vencendo nos 7 Dias</span>
          </div>
          <div className="text-4xl font-black text-slate-900 tracking-tighter">{kpis.expiring}</div>
        </div>
      </div>

      {/* Busca e Filtros Avançados (Progressive Disclosure) */}
      <div className="bg-white rounded-[28px] border border-slate-100 p-4 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 group w-full">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors" />
          <input
            className="w-full h-14 rounded-2xl border border-slate-50 bg-slate-50/30 pl-12 pr-4 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-slate-100 focus:border-slate-200 focus:bg-white transition-all shadow-inner"
            placeholder="Pesquisar por Campanha, ID ou Cliente..."
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          />
        </div>

        <div className="relative w-full md:w-auto">
          <button
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className={`h-14 w-full md:w-auto px-8 rounded-2xl border font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${isFiltersOpen ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
              }`}
          >
            <Settings size={18} />
            ⚙️ Filtros Avançados
            <ChevronDown size={14} className={`transition-transform duration-500 ${isFiltersOpen ? 'rotate-180' : ''}`} />
          </button>

          {isFiltersOpen && (
            <div className="absolute right-0 top-full mt-3 w-80 bg-white rounded-[32px] shadow-2xl border border-slate-100 p-7 z-40 animate-in fade-in slide-in-from-top-3 duration-300">
              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-[10px] font-black text-slate-400 uppercase tracking-widest">Status da Campanha</label>
                  <select
                    className="w-full h-11 rounded-xl border border-slate-100 bg-slate-50 px-4 text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-slate-200"
                    value={filters.status}
                    onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value as any, page: 1 }))}
                  >
                    <option value="">Status: Todos</option>
                    <option value="rascunho">Rascunho</option>
                    <option value="ativa">Ativa</option>
                    <option value="encerrada">Encerrada</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo de Formato</label>
                  <select
                    className="w-full h-11 rounded-xl border border-slate-100 bg-slate-50 px-4 text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-slate-200"
                    value={filters.tipo}
                    onChange={(e) => setFilters((f) => ({ ...f, tipo: e.target.value as any, page: 1 }))}
                  >
                    <option value="">Tipo: Todos</option>
                    <option value="banner">Banner</option>
                    <option value="popup">Pop-up</option>
                    <option value="destaque">Destaque</option>
                    <option value="combo">Combo</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-black text-slate-400 uppercase tracking-widest">ID do Cliente</label>
                  <input
                    className="w-full h-11 rounded-xl border border-slate-100 bg-slate-50 px-4 text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-slate-200"
                    placeholder="Somente números..."
                    value={filters.cliente_id}
                    onChange={(e) => setFilters((f) => ({ ...f, cliente_id: e.target.value.replace(/[^\d]/g, ""), page: 1 }))}
                  />
                </div>

                <button
                  onClick={() => setIsFiltersOpen(false)}
                  className="w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-95 active:scale-95 transition-all shadow-lg shadow-slate-900/10"
                >
                  Confirmar e Fechar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabela Bento com Efeito Gimme Gummy */}
      <div className="bg-white rounded-[36px] border border-slate-100 shadow-sm overflow-hidden">
        {isError && (
          <div className="p-10 text-center bg-red-50/30">
            <p className="text-sm font-bold text-red-600">Erro ao sincronizar com o servidor.</p>
          </div>
        )}

        {!isError && filteredRows.length === 0 && (
          <div className="p-20 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-200 mb-6">
              <Search size={32} />
            </div>
            <div className="text-slate-900 text-lg font-black tracking-tight mb-2">Sem resultados</div>
            <p className="text-sm font-medium text-slate-400 mx-auto max-w-xs">Refine sua busca ou crie um novo registro de campanha agora mesmo.</p>
          </div>
        )}

        {!isError && filteredRows.length > 0 && (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[1000px] border-collapse">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-20">ID</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Campanha & Cliente</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Periodo de Exibição</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Status Unificado</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredRows.map((c) => {
                  const clienteNome = c.cliente_nome || (c as any)?.cliente?.nome_fantasia || "—";
                  const finStatus = (c as any)?.financeiro?.status ?? (c as any)?.financeiro_status ?? null;
                  const show = canShowOnSite(c);

                  return (
                    <tr
                      key={c.id}
                      onClick={() => navigate(`/campanhas/${c.id}/editar`)}
                      className="group cursor-pointer hover:bg-slate-50/50 active:scale-[0.99] transition-all duration-300"
                    >
                      <td className="px-8 py-6 text-center">
                        <span className="text-xs font-black text-slate-200 group-hover:text-slate-400 transition-colors">#{c.id}</span>
                      </td>

                      <td className="px-8 py-6">
                        <div className="font-bold text-slate-900 text-sm group-hover:text-slate-900 transition-colors">{c.nome}</div>
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">{clienteNome}</div>
                      </td>

                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar size={12} className="text-slate-300" />
                          <span className="text-xs font-bold text-slate-700">
                            {fmtDate(c.data_inicio)}
                            <span className="mx-2 text-slate-200">→</span>
                            {fmtDate(c.data_fim)}
                          </span>
                        </div>
                        <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{tipoLabelPt(c.tipo)}</div>
                      </td>

                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <Badge tone={statusTone(c.status)}>{statusLabelPt(c.status)}</Badge>
                          {finStatus && (
                            <Badge tone={financeiroTone(finStatus)}>
                              {financeiroLabelPt(finStatus)}
                            </Badge>
                          )}
                          {show && (
                            <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center shadow-md animate-in zoom-in duration-500">
                              <CheckCircle size={14} />
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-8 py-6 text-right">
                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-slate-50 text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-all transform group-hover:rotate-12">
                          <ExternalLink size={18} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer de Paginação Tátil */}
        {!isError && data && data.last_page > 1 && (
          <div className="flex items-center justify-between p-8 bg-slate-50/20 border-t border-slate-50">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Registros Totais: {totalCount}
            </div>

            <div className="flex gap-3">
              <button
                className="px-6 py-3 rounded-2xl bg-white border border-slate-100 shadow-sm text-xs font-black text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90"
                disabled={filters.page <= 1}
                onClick={(e) => {
                  e.stopPropagation();
                  setFilters((f) => ({ ...f, page: Math.max(1, f.page - 1) }));
                }}
              >
                ANTERIOR
              </button>
              <button
                className="px-6 py-3 rounded-2xl bg-white border border-slate-100 shadow-sm text-xs font-black text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90"
                disabled={filters.page >= data.last_page}
                onClick={(e) => {
                  e.stopPropagation();
                  setFilters((f) => ({ ...f, page: Math.min(data.last_page, f.page + 1) }));
                }}
              >
                PRÓXIMA
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
