import React, { useEffect, useState, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import api from "@/services/api";
import { Loader, Zap, Search, AlertTriangle, TrendingUp, CheckCircle, XCircle, Sparkles, Filter, CheckSquare, Info, ChevronDown, ChevronUp, Calendar, Clock } from "lucide-react";
import toast from "react-hot-toast";

interface PaginationData {
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

export default function SeoInsightsPage() {
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationData | null>(null);

  // Filtros
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [insightType, setInsightType] = useState("");
  const [status, setStatus] = useState("pending");
  const [sortBy, setSortBy] = useState("impressions");
  const [sortOrder, setSortOrder] = useState("desc");

  // Ações em lote
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Estado para IA (linha individual e modal)
  const [loadingAiId, setLoadingAiId] = useState<number | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<Record<number, any[]>>({});
  const [selectedInsightForAi, setSelectedInsightForAi] = useState<any | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  
  // Linhas expandidas
  const [expandedRows, setExpandedRows] = useState<number[]>([]);

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        search,
        insight_type: insightType,
        status,
        sort_by: sortBy,
        sort_order: sortOrder,
        per_page: "20"
      });

      const { data } = await api.get(`/v1/seo-insights?${params.toString()}`);
      setInsights(data.data || []);
      setPagination({
        current_page: data.current_page,
        last_page: data.last_page,
        total: data.total,
        per_page: data.per_page,
      });
    } catch (error) {
      console.error("Erro ao buscar SEO insights:", error);
      toast.error("Falha ao carregar oportunidades de SEO.");
    } finally {
      setLoading(false);
    }
  }, [page, search, insightType, status, sortBy, sortOrder]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(insights.map((i) => i.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkAction = async (status: 'applied' | 'ignored') => {
    if (selectedIds.length === 0) return;
    
    setBulkActionLoading(true);
    try {
      await api.post(`/v1/seo-insights/bulk-action`, { 
        ids: selectedIds, 
        status 
      });
      toast.success(`${selectedIds.length} oportunidades marcadas como ${status === 'applied' ? 'aplicadas' : 'ignoradas'}.`);
      setSelectedIds([]);
      fetchInsights();
    } catch (error) {
      console.error("Erro em lote:", error);
      toast.error("Erro ao processar ações em lote.");
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleGenerateAi = async (insight: any) => {
    setSelectedInsightForAi(insight);
    setLoadingAiId(insight.id);
    try {
      const { data } = await api.post(`/v1/seo-insights/${insight.id}/generate-ai`);
      setAiSuggestions(prev => ({
        ...prev,
        [insight.id]: data.suggestions || []
      }));
    } catch (error) {
      console.error("Erro ao gerar IA:", error);
      toast.error("Falha ao gerar sugestões com a IA.");
      setSelectedInsightForAi(null);
    } finally {
      setLoadingAiId(null);
    }
  };

  const handleAction = async (id: number, actionStatus: 'applied' | 'ignored') => {
    try {
      await api.post(`/v1/seo-insights/${id}/action`, { status: actionStatus });
      toast.success("Ação registrada com sucesso!");
      fetchInsights();
    } catch (error) {
      toast.error("Erro ao registrar ação.");
    }
  };

  const renderPagination = () => {
    if (!pagination || pagination.last_page <= 1) return null;
    return (
      <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Mostrando <span className="font-medium">{(pagination.current_page - 1) * pagination.per_page + 1}</span> a <span className="font-medium">{Math.min(pagination.current_page * pagination.per_page, pagination.total)}</span> de <span className="font-medium">{pagination.total}</span> resultados
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage(p => Math.min(pagination.last_page, p + 1))}
                disabled={page === pagination.last_page}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                Próxima
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Zap className="text-yellow-500 w-6 h-6" />
              Oportunidades SEO Proativas
              <button onClick={() => setShowInfoModal(true)} className="text-gray-400 hover:text-purple-600 transition-colors ml-2" title="Entenda as Regras de IA">
                <Info className="w-5 h-5" />
              </button>
            </h1>
            <p className="text-gray-500 mt-1">
              Gerencie e otimize os alertas detectados pelo motor do Vermelhinho em larga escala.
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-4 flex-1">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar cliente, URL ou keyword..."
                className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <select
              className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 outline-none"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">Todos</option>
              <option value="pending">Pendentes</option>
              <option value="applied">Aplicados (Manuais)</option>
              <option value="auto_applied">Auto-Aplicados (Zero-Touch)</option>
              <option value="ignored">Ignorados</option>
            </select>
            
            <select
              className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 outline-none"
              value={insightType}
              onChange={(e) => {
                setInsightType(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Todos os Alertas</option>
              <option value="low_ctr">Baixo CTR</option>
              <option value="page_2">Preso na Página 2</option>
              <option value="drop">Queda Brusca</option>
            </select>

            <select
              className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 outline-none"
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sort, order] = e.target.value.split('-');
                setSortBy(sort);
                setSortOrder(order);
                setPage(1);
              }}
            >
              <option value="impressions-desc">Maiores Impressões</option>
              <option value="ctr-asc">Piores CTRs</option>
              <option value="position-desc">Piores Posições</option>
              <option value="created_at-desc">Mais Recentes</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions Toolbar */}
        {selectedIds.length > 0 && (
          <div className="bg-purple-50 border border-purple-200 p-3 rounded-lg mb-4 flex items-center justify-between animate-fade-in">
            <span className="text-purple-800 font-semibold text-sm flex items-center gap-2">
              <CheckSquare className="w-4 h-4" />
              {selectedIds.length} itens selecionados
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => handleBulkAction('ignored')}
                disabled={bulkActionLoading}
                className="text-xs bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded hover:bg-gray-50 flex items-center gap-1 font-semibold disabled:opacity-50"
              >
                <XCircle className="w-3 h-3" /> Ignorar Lote
              </button>
              <button 
                onClick={() => handleBulkAction('applied')}
                disabled={bulkActionLoading}
                className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded hover:bg-purple-700 flex items-center gap-1 font-semibold disabled:opacity-50"
              >
                <CheckCircle className="w-3 h-3" /> Marcar Lote como Aplicado
              </button>
            </div>
          </div>
        )}

        {/* Tabela */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left w-12">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                      onChange={handleSelectAll}
                      checked={insights.length > 0 && selectedIds.length === insights.length}
                    />
                  </th>
                  <th scope="col" className="px-6 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">
                    Cliente / URL
                  </th>
                  <th scope="col" className="px-6 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">
                    Keyword
                  </th>
                  <th scope="col" className="px-6 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">
                    Problema
                  </th>
                  <th scope="col" className="px-6 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">
                    Métricas
                  </th>
                  <th scope="col" className="px-6 py-3 text-right font-semibold text-gray-500 uppercase tracking-wider">
                    Ação (IA)
                  </th>
                  <th scope="col" className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <Loader className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
                      <p className="text-gray-500">Carregando oportunidades...</p>
                    </td>
                  </tr>
                ) : insights.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <Search className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500 font-medium">Nenhum resultado encontrado.</p>
                    </td>
                  </tr>
                ) : (
                  insights.map((insight) => {
                    const isLowCtr = insight.insight_type === 'low_ctr';
                    const hasAi = !!aiSuggestions[insight.id];
                    const isExpanded = expandedRows.includes(insight.id);
                    const suggestedChanges = typeof insight.suggested_changes === 'string' 
                                            ? JSON.parse(insight.suggested_changes) 
                                            : insight.suggested_changes;

                    return (
                      <React.Fragment key={insight.id}>
                        <tr className={`hover:bg-gray-50 transition-colors ${selectedIds.includes(insight.id) ? 'bg-purple-50/50' : ''}`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                              checked={selectedIds.includes(insight.id)}
                              onChange={() => handleSelectRow(insight.id)}
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-gray-900">{insight.cliente?.nome_fantasia || 'Cliente Removido'}</div>
                            <a href={insight.url} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline truncate max-w-[200px] block" title={insight.url}>
                              {insight.url}
                            </a>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="bg-blue-100 text-blue-800 font-medium px-2.5 py-0.5 rounded text-xs border border-blue-200">
                              {insight.keyword}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {isLowCtr ? (
                              <span className="flex items-center gap-1 text-red-600 text-xs font-semibold">
                                <AlertTriangle className="w-3 h-3" /> CTR Baixo
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-orange-600 text-xs font-semibold">
                                <TrendingUp className="w-3 h-3" /> Quase na Pg 1
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex gap-4">
                              <div>
                                <p className="text-[10px] text-gray-400 uppercase font-bold">Posição</p>
                                <p className="font-semibold text-gray-900">#{insight.position}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-gray-400 uppercase font-bold">CTR</p>
                                <p className={`font-semibold ${isLowCtr ? 'text-red-600' : 'text-gray-900'}`}>{insight.ctr}%</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-gray-400 uppercase font-bold">Impr.</p>
                                <p className="font-semibold text-gray-900">{insight.impressions}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex flex-col items-end gap-2">
                              {insight.status === 'auto_applied' ? (
                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded font-semibold border border-purple-200 flex items-center gap-1">
                                  <Sparkles className="w-3 h-3" /> Auto-Apply
                                </span>
                              ) : insight.status === 'applied' ? (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-semibold border border-green-200">
                                  Aplicado (Manual)
                                </span>
                              ) : hasAi ? (
                                <div className="flex gap-2">
                                  <button onClick={() => handleAction(insight.id, 'applied')} className="text-xs bg-green-100 text-green-700 hover:bg-green-200 px-2 py-1 rounded font-semibold border border-green-200">Aplicar</button>
                                  <button onClick={() => handleAction(insight.id, 'ignored')} className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 px-2 py-1 rounded font-semibold border border-gray-200">Ignorar</button>
                                  <button onClick={() => setSelectedInsightForAi(insight)} className="text-xs bg-purple-100 text-purple-700 hover:bg-purple-200 px-2 py-1 rounded font-semibold border border-purple-200">Ver IA</button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleGenerateAi(insight)}
                                  disabled={loadingAiId === insight.id}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded text-xs font-semibold hover:from-purple-700 hover:to-indigo-700 transition-colors disabled:opacity-50"
                                >
                                  {loadingAiId === insight.id ? <Loader className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                  Gerar IA
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-right">
                            <button
                              onClick={() => setExpandedRows(prev => prev.includes(insight.id) ? prev.filter(id => id !== insight.id) : [...prev, insight.id])}
                              className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                              title="Ver Detalhes e Linha do Tempo"
                            >
                              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                            </button>
                          </td>
                        </tr>
                        
                        {/* Linha Expandida (Detalhes) */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={7} className="p-0 border-b border-gray-200 bg-gray-50/50">
                              <div className="p-6 animate-fade-in">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                  
                                  {/* Linha do Tempo */}
                                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                    <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                                      <Clock className="w-4 h-4 text-gray-500" /> Linha do Tempo
                                    </h4>
                                    <div className="space-y-4">
                                      <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                                          <Search className="w-4 h-4" />
                                        </div>
                                        <div>
                                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Varredura</p>
                                          <p className="text-sm font-medium text-gray-900">{new Date(insight.created_at).toLocaleDateString('pt-BR')}</p>
                                        </div>
                                      </div>
                                      
                                      {(insight.status === 'auto_applied' || insight.status === 'applied') && (
                                        <div className="flex items-start gap-3">
                                          <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                                            <CheckCircle className="w-4 h-4" />
                                          </div>
                                          <div>
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Implementado em</p>
                                            <p className="text-sm font-medium text-gray-900">{new Date(insight.updated_at).toLocaleDateString('pt-BR')}</p>
                                          </div>
                                        </div>
                                      )}

                                      <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                                          <Calendar className="w-4 h-4" />
                                        </div>
                                        <div>
                                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Próxima Varredura</p>
                                          <p className="text-sm font-medium text-gray-900">
                                            {(insight.status === 'auto_applied' || insight.status === 'applied')
                                              ? new Date(new Date(insight.updated_at).setDate(new Date(insight.updated_at).getDate() + 30)).toLocaleDateString('pt-BR')
                                              : 'Diária'}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* O que foi alterado */}
                                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm lg:col-span-1">
                                    <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                                      <Sparkles className="w-4 h-4 text-purple-500" /> Alterações Sugeridas (IA)
                                    </h4>
                                    {suggestedChanges ? (
                                      <div className="space-y-3">
                                        <div>
                                          <span className="text-[10px] font-bold text-gray-400 uppercase">Novo Título SEO</span>
                                          <p className="text-sm text-gray-900 font-medium leading-tight mt-0.5">{suggestedChanges.title}</p>
                                        </div>
                                        <div>
                                          <span className="text-[10px] font-bold text-gray-400 uppercase">Nova Descrição SEO</span>
                                          <p className="text-xs text-gray-600 leading-snug mt-0.5">{suggestedChanges.description}</p>
                                        </div>
                                      </div>
                                    ) : (
                                      <p className="text-sm text-gray-500 italic py-4">As alterações não foram geradas ou registradas ainda.</p>
                                    )}
                                  </div>

                                  {/* O que é esperado */}
                                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm lg:col-span-1">
                                    <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                                      <Zap className="w-4 h-4 text-yellow-500" /> Expectativa de Resultado
                                    </h4>
                                    {isLowCtr ? (
                                      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                                        <p className="text-sm text-blue-800 leading-relaxed">
                                          <strong>Aumento de Cliques:</strong> Esperamos um aumento imediato de acessos (Tráfego) e melhoria na taxa de CTR, 
                                          utilizando técnicas de Copywriting para roubar cliques dos concorrentes que já estão posicionados próximos.
                                        </p>
                                      </div>
                                    ) : (
                                      <div className="bg-orange-50 border border-orange-100 rounded-lg p-3">
                                        <p className="text-sm text-orange-800 leading-relaxed">
                                          <strong>Sair da Página 2:</strong> Esperamos um aumento de posições no ranking do Google (da Pg 2 para a Pg 1). 
                                          A alteração injetou alta densidade de palavras-chave e autoridade local na tag para forçar a subida.
                                        </p>
                                      </div>
                                    )}
                                  </div>

                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {renderPagination()}
        </div>
      </div>

      {/* Modal / Drawer de IA */}
      {selectedInsightForAi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-slide-up">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white relative">
              <button 
                onClick={() => setSelectedInsightForAi(null)}
                className="absolute top-4 right-4 text-white/70 hover:text-white"
              >
                <XCircle className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                  <Sparkles className="w-6 h-6 text-purple-100" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Otimização Inteligente</h2>
                  <p className="text-purple-100 text-sm mt-1">{selectedInsightForAi.url}</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Palavra-Chave Alvo</h3>
                <div className="inline-block bg-purple-50 text-purple-800 border border-purple-200 px-3 py-1.5 rounded-lg font-medium">
                  {selectedInsightForAi.keyword}
                </div>
              </div>

              {loadingAiId === selectedInsightForAi.id ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <Loader className="w-10 h-10 text-purple-600 animate-spin mb-4" />
                  <h3 className="text-lg font-bold text-gray-900">A IA está analisando a página...</h3>
                  <p className="text-gray-500 mt-2 max-w-sm">Estamos cruzando dados do Google com o conteúdo atual para gerar as melhores recomendações de SEO.</p>
                </div>
              ) : aiSuggestions[selectedInsightForAi.id]?.length > 0 ? (
                <div>
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Sugestões Geradas</h3>
                  <div className="space-y-3">
                    {aiSuggestions[selectedInsightForAi.id].map((sug: any, i: number) => (
                      <div key={i} className="border border-gray-200 rounded-xl p-4 hover:border-purple-300 transition-colors bg-gray-50/50">
                        <div className="font-bold text-gray-900 text-base mb-1">{sug.title}</div>
                        <div className="text-gray-600 text-sm leading-relaxed">{sug.description}</div>
                        <div className="mt-3 flex justify-end">
                          <button 
                            className="text-xs bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 font-semibold px-3 py-1.5 rounded-lg shadow-sm"
                            onClick={() => {
                              navigator.clipboard.writeText(`${sug.title}\n${sug.description}`);
                              toast.success("Copiado para a área de transferência!");
                            }}
                          >
                            Copiar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100">
                     <button 
                      onClick={() => {
                        handleAction(selectedInsightForAi.id, 'ignored');
                        setSelectedInsightForAi(null);
                      }} 
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                    >
                      Ignorar Alerta
                    </button>
                    <button 
                      onClick={() => {
                        handleAction(selectedInsightForAi.id, 'applied');
                        setSelectedInsightForAi(null);
                      }} 
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors"
                    >
                      Marcar como Aplicado
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-gray-500">
                  Nenhuma sugestão encontrada. Tente gerar novamente.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Informação */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up">
            <div className="bg-gray-50 border-b border-gray-200 p-5 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Info className="w-5 h-5 text-purple-600" />
                Como o Robô Pensa? (Regras)
              </h2>
              <button onClick={() => setShowInfoModal(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-sm text-gray-700">
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                <h3 className="font-bold text-blue-800 flex items-center gap-1 text-base mb-1"><AlertTriangle className="w-4 h-4"/> 1. CTR Baixo (Auto-Apply)</h3>
                <p className="text-blue-700 leading-relaxed">A página tem visualizações, mas poucos cliques (&lt; 2%). A IA espiona os 5 primeiros do Google e cria um Título matador para roubar os cliques deles.</p>
              </div>
              
              <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl">
                <h3 className="font-bold text-orange-800 flex items-center gap-1 text-base mb-1"><TrendingUp className="w-4 h-4"/> 2. Quase na Pg 1 (Auto-Apply)</h3>
                <p className="text-orange-700 leading-relaxed">O cliente está travado entre a 11ª e 30ª posição. A IA reescreve a tag injetando palavras de autoridade local para empurrar o link para a primeira página.</p>
              </div>

              <div className="bg-red-50 border border-red-100 p-4 rounded-xl">
                <h3 className="font-bold text-red-800 flex items-center gap-1 text-base mb-1"><AlertTriangle className="w-4 h-4"/> 3. Queda Brusca (Incidente)</h3>
                <p className="text-red-700 leading-relaxed">O cliente perdeu 3 ou mais posições de uma vez. <strong>A IA não age sozinha.</strong> O sistema abre um Ticket Urgente para a equipe de Marketing investigar.</p>
              </div>

              <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-500 border border-gray-200">
                <strong className="text-gray-700">Período de Quarentena:</strong> Após aplicar a regra 1 ou 2, a IA entra em cooldown de 30 dias para aquele cliente/palavra, dando tempo para o Google reindexar e trazer resultados reais.
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 flex justify-end">
              <button onClick={() => setShowInfoModal(false)} className="px-5 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-colors">
                Entendi, fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
