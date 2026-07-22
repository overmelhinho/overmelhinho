import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { 
  BarChart3, Edit3, FileSignature, 
  ChevronLeft, CheckCircle2, Phone, 
  Globe, Building2, Calendar, Receipt, FileText
} from "lucide-react";
import SignaturePad from "@/components/SignaturePad";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/useIsMobile";
import toast from "react-hot-toast";
import { format, addMonths } from "date-fns";

// Tipagem básica
type WizardStep = 'impact' | 'update' | 'renew';

export default function SalesWizard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [step, setStep] = useState<WizardStep>('impact');
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  
  // Estados para atualização rápida (Update)
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Estados para Autorização (Aba 3)
  const [tipoPublicidade, setTipoPublicidade] = useState('WEB');
  const [tituloAnuncio, setTituloAnuncio] = useState('');
  const [plano, setPlano] = useState('anual');
  const [valor, setValor] = useState('450,00');
  const [modoPagamento, setModoPagamento] = useState('pix');
  const [numParcelas, setNumParcelas] = useState(1);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [dataPrimeiraParcela, setDataPrimeiraParcela] = useState('');
  const [obsAnuncio, setObsAnuncio] = useState('');
  const [obs, setObs] = useState('');
  const [assinaturaData, setAssinaturaData] = useState<string | null>(null);
  const [assinaturaDispensada, setAssinaturaDispensada] = useState(false);
  const [showDiscount, setShowDiscount] = useState(false);
  const [descontoTipo, setDescontoTipo] = useState('fixed');
  const [descontoValor, setDescontoValor] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [parcelasPreview, setParcelasPreview] = useState<any[]>([]);

  useEffect(() => {
    if (!valor || !dataPrimeiraParcela) {
      setParcelasPreview([]);
      return;
    }
    
    const digits = valor.replace(/\D/g, "");
    const basePrice = parseFloat(digits) / 100;
    
    if (isNaN(basePrice) || basePrice <= 0) {
      setParcelasPreview([]);
      return;
    }

    const num = numParcelas || 1;
    const [y, m, d] = dataPrimeiraParcela.split("-").map(Number);
    if (!y || !m || !d) return;

    // Calculo do desconto
    const discountValNum = parseFloat(descontoValor.replace(/\./g, "").replace(",", ".")) || 0;
    const discountAmount = descontoTipo === "fixed" 
      ? discountValNum 
      : (basePrice * discountValNum) / 100;
    
    const finalPayable = Math.max(0, basePrice - discountAmount);
    
    const start = new Date(y, m - 1, d);
    const baseVal = Math.floor((finalPayable / num) * 100) / 100;
    const diff = finalPayable - (baseVal * num);

    const newParcelas = Array.from({ length: num }).map((_, i) => {
        const date = addMonths(start, i);
        return {
            numero: i + 1,
            vencimento: format(date, "yyyy-MM-dd"), // para o input date
            label: format(date, "dd/MM/yyyy"), // display
            valor: (i === num - 1 ? (baseVal + diff) : baseVal).toLocaleString("pt-BR", { minimumFractionDigits: 2 })
        };
    });

    setParcelasPreview(newParcelas);
  }, [valor, numParcelas, dataPrimeiraParcela, descontoTipo, descontoValor]);

  const handleParcelaDateChange = (index: number, newDate: string) => {
    const updated = [...parcelasPreview];
    const [y, m, d] = newDate.split("-").map(Number);
    if(y && m && d) {
      const date = new Date(y, m - 1, d);
      updated[index].vencimento = newDate;
      updated[index].label = format(date, "dd/MM/yyyy");
      setParcelasPreview(updated);
    }
  };

  const handleParcelaValorChange = (index: number, val: string) => {
    const updated = [...parcelasPreview];
    updated[index].valor = formatCurrency(val);
    updated[index].isEdited = true;

    // Calcula o Total Devido
    const discountValNum = parseFloat(descontoValor.replace(/\./g, "").replace(",", ".")) || 0;
    const basePrice = parseFloat(valor.replace(/\D/g, "")) / 100 || 0;
    const discountAmount = descontoTipo === "fixed" ? discountValNum : (basePrice * discountValNum) / 100;
    const finalPayable = Math.max(0, basePrice - discountAmount);

    let totalEdited = 0;
    let uneditedCount = 0;

    updated.forEach(p => {
      if (p.isEdited) {
        totalEdited += parseFloat(p.valor.replace(/\./g, "").replace(",", ".")) || 0;
      } else {
        uneditedCount++;
      }
    });

    if (uneditedCount > 0) {
      const remainingBalance = Math.max(0, finalPayable - totalEdited);
      const baseVal = Math.floor((remainingBalance / uneditedCount) * 100) / 100;
      const diff = remainingBalance - (baseVal * uneditedCount);

      // Distribuir o restante nas parcelas não editadas
      let uneditedSeen = 0;
      updated.forEach(p => {
        if (!p.isEdited) {
          uneditedSeen++;
          const valToApply = uneditedSeen === uneditedCount ? (baseVal + diff) : baseVal;
          p.valor = valToApply.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
      });
    }

    setParcelasPreview(updated);
  };

  // Buscar dados reais do cliente
  const { data: cliente, isLoading } = useQuery({
    queryKey: ["cliente", id],
    queryFn: async () => {
      if (!navigator.onLine) {
        try {
          const { get } = await import('idb-keyval');
          const offlineDb: any[] = (await get('offline_clientes_db')) || [];
          const localClient = offlineDb.find(c => c.id.toString() === id?.toString());
          if (localClient) return { data: localClient };
        } catch (e) {
          console.error("Erro ao ler cliente offline", e);
        }
      }
      const res = await api.get(`/v1/clientes/${id}`);
      return res.data;
    },
    onSuccess: (data) => {
      if (data) {
        setTelefone(data.telefone || "");
        setEndereco(data.endereco || "");
      }
    }
  });

  // Buscar métricas de impacto (Tenta puxar relatório salvo, senão cai pro preview)
  const { data: analyticsData, isLoading: isLoadingAnalytics } = useQuery({
    queryKey: ["cliente-analytics", id],
    queryFn: async () => {
      try {
        const reportsRes = await api.get(`/v1/clients/${id}/reports`);
        if (reportsRes.data && reportsRes.data.length > 0) {
          const lastReport = reportsRes.data[0];
          return {
            source: 'report',
            period_label: lastReport.period_label,
            views: lastReport.data.custom_metrics?.views_geral || 0,
            clicks_site: lastReport.data.custom_metrics?.clicks_waze || 0,
            clicks_whatsapp: lastReport.data.custom_metrics?.clicks_whats || 0,
            token: lastReport.token,
            all_reports: reportsRes.data,
          };
        }
      } catch (e) {
        console.warn("Sem relatório salvo ou erro.", e);
      }

      // Fallback para GA4 Preview
      const previewRes = await api.get(`/v1/clients/${id}/reports/preview?period=30d`);
      const data = previewRes.data;
      const rawGa4Views = data?.ga4?.total_views || 0;
      return {
        source: 'preview',
        period_label: 'Últimos 30 Dias (GA4)',
        views: rawGa4Views + (data?.conversions?.db_views || 0),
        clicks_site: data?.conversions?.waze || 0,
        clicks_whatsapp: data?.conversions?.whatsapp || 0,
      };
    },
    enabled: !!id && navigator.onLine,
  });

  const handleDataInicioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setDataInicio(newDate);
    
    if (newDate) {
      const parts = newDate.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        
        // Ano seguinte
        const nextYear = year + 1;
        // Último dia do mês no ano seguinte
        const lastDay = new Date(nextYear, month, 0).getDate();
        
        const newFim = `${nextYear}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        setDataFim(newFim);
      }
    }
  };

  const formatCurrency = (val: string) => {
    const digits = val.replace(/\D/g, "");
    const amount = parseFloat(digits) / 100;
    if (isNaN(amount)) return "";
    return amount.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleUpdateData = async () => {
    setIsUpdating(true);
    try {
      await api.put(`/v1/clientes/${id}`, {
        telefone,
        endereco,
      });
      // Avança para o próximo passo após salvar rápido
      setStep('renew');
    } catch (error) {
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFinalize = async () => {
    // Validação
    if (!assinaturaData && !assinaturaDispensada) {
      toast.error("Você precisa coletar ou dispensar a assinatura do cliente!");
      return;
    }
    if (!tipoPublicidade) {
      toast.error("O campo 'Tipo de Publicidade' é obrigatório.");
      return;
    }
    if (!tituloAnuncio) {
      toast.error("O campo 'Título do Anúncio' é obrigatório.");
      return;
    }
    if (!dataInicio || !dataFim) {
      toast.error("As datas de Início e Fim são obrigatórias.");
      return;
    }
    if (!valor) {
      toast.error("O Valor Base é obrigatório.");
      return;
    }

    // Validação da soma das parcelas
    const discountValNum = parseFloat(descontoValor.replace(/\./g, "").replace(",", ".")) || 0;
    const basePrice = parseFloat(valor.replace(/\D/g, "")) / 100 || 0;
    const discountAmount = descontoTipo === "fixed" ? discountValNum : (basePrice * discountValNum) / 100;
    const finalPayable = Math.max(0, basePrice - discountAmount);

    const valParcelasSum = parcelasPreview.reduce((acc, p) => {
        const num = parseFloat(p.valor.replace(/\./g, "").replace(",", ".")) || 0;
        return acc + num;
    }, 0);

    if (finalPayable > 0 && Math.abs(valParcelasSum - finalPayable) > 0.05) {
        toast.error(`A soma das parcelas (R$ ${valParcelasSum.toLocaleString('pt-BR', {minimumFractionDigits: 2})}) difere do valor a pagar (R$ ${finalPayable.toLocaleString('pt-BR', {minimumFractionDigits: 2})}). Ajuste os valores.`);
        return;
    }

    setIsSaving(true);
    try {
      const discountValNum = parseFloat(descontoValor.replace(/\./g, "").replace(",", ".")) || 0;
      const basePrice = parseFloat(valor.replace(/\D/g, "")) / 100 || 0;
      const discountAmount = descontoTipo === "fixed" ? discountValNum : (basePrice * discountValNum) / 100;
      const finalPayable = Math.max(0, basePrice - discountAmount);

      const payload = {
        cliente_id: id,
        tipo_publicidade: tipoPublicidade,
        titulo_anuncio: tituloAnuncio,
        descricao_anuncio: obsAnuncio,
        valor_total: finalPayable,
        taxa_cadastro: 0,
        data_inicio: dataInicio,
        data_fim: dataFim,
        modo_pagamento: "parcelado",
        payment_method: modoPagamento,
        num_parcelas: numParcelas,
        data_primeira_parcela: dataPrimeiraParcela,
        observacoes_anuncio: obsAnuncio,
        observacoes_financeiro: obs,
        plan_id: null,
        desconto_tipo: descontoTipo,
        desconto_valor: discountValNum,
        is_permuta: false,
        permuta_amount: 0,
        permuta_description: "",
        parcelas: parcelasPreview.map(p => ({
            vencimento: p.vencimento,
            valor: parseFloat(p.valor.replace(/\./g, "").replace(",", ".")) || 0 
        }))
      };

      const res = await api.post(`/v1/autorizacoes`, payload);
      const authId = res.data.data.id;

      if (assinaturaData && !assinaturaDispensada) {
        await api.post(`/v1/autorizacoes/${authId}/assinatura/base64`, {
          assinatura_base64: assinaturaData
        });
      } else if (assinaturaDispensada) {
        await api.post(`/v1/autorizacoes/${authId}/justify`, {
          justificativa: "Assinatura dispensada / Acordo presencial"
        });
      }
      
      setShowSuccess(true);
      setTimeout(() => {
        navigate("/clientes");
      }, 3000);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar a autorização no sistema.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <DashboardLayout><div className="p-8 text-center">Carregando...</div></DashboardLayout>;

  // Tela de Sucesso Gigante (Offline First)
  if (showSuccess) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 animate-in fade-in zoom-in duration-500">
          <div className="bg-green-100 p-8 rounded-full mb-6 ring-8 ring-green-50">
            <CheckCircle2 size={80} className="text-green-600" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-4">Sucesso!</h2>
          <p className="text-lg text-slate-600 max-w-md">
            A renovação de <strong>{cliente?.nome_fantasia}</strong> foi concluída e salva com segurança.
          </p>
          <div className="mt-8 text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-4 py-2 rounded-full flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Sincronização em fila...
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto pb-24">
        {/* Header do Assistente */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 bg-white rounded-full shadow-sm hover:bg-slate-50 transition"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-sm font-bold uppercase tracking-widest text-slate-400">Modo Venda</h1>
            <h2 className="text-xl font-black text-slate-900 line-clamp-1">{cliente?.nome_fantasia}</h2>
          </div>
        </div>

        {/* Tab Navigation (Pílulas) */}
        <div className="flex bg-white rounded-2xl p-1.5 shadow-sm mb-8 overflow-x-auto hide-scrollbar">
          <button
            onClick={() => setStep('impact')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-colors whitespace-nowrap ${
              step === 'impact' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <BarChart3 size={16} /> <span className="hidden sm:inline">Impacto</span>
          </button>
          <button
            onClick={() => {
              if (isMobile) {
                navigate(`/clientes/${id}/editar`);
              } else {
                setStep('update');
              }
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-colors whitespace-nowrap ${
              step === 'update' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Edit3 size={16} /> <span className="hidden sm:inline">Cadastro</span>
          </button>
          <button
            onClick={() => setStep('renew')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-colors whitespace-nowrap ${
              step === 'renew' ? 'bg-red-600 text-white' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <FileSignature size={16} /> <span className="hidden sm:inline">Renovar</span>
          </button>
        </div>

        {/* Conteúdo das Abas */}
        <div className="animate-in slide-in-from-bottom-4 fade-in duration-300">
          
          {/* ABA 1: IMPACTO (ANALYTICS) */}
          {step === 'impact' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden">
                <p className="text-green-100 font-bold uppercase tracking-widest text-xs mb-2">Visibilidade {analyticsData?.period_label ? `(${analyticsData.period_label})` : '(Carregando...)'}</p>
                <div className="flex items-end gap-3">
                  <h3 className="text-6xl font-black tracking-tighter">
                    {isLoadingAnalytics ? '...' : (analyticsData?.views?.toLocaleString('pt-BR') || '0')}
                  </h3>
                  <span className="text-green-100 font-medium mb-2">visualizações</span>
                </div>
                <p className="mt-4 text-green-50">
                  O perfil de <strong>{cliente?.nome_fantasia}</strong> atraiu muita atenção este mês!
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-4 text-blue-600">
                    <Globe size={20} />
                  </div>
                  <p className="text-3xl font-black text-slate-900">
                    {isLoadingAnalytics ? '...' : (analyticsData?.clicks_site || 0)}
                  </p>
                  <p className="text-xs text-slate-500 font-bold uppercase mt-1">Cliques no Waze</p>
                </div>
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center mb-4 text-amber-600">
                    <Phone size={20} />
                  </div>
                  <p className="text-3xl font-black text-slate-900">
                    {isLoadingAnalytics ? '...' : (analyticsData?.clicks_whatsapp || 0)}
                  </p>
                  <p className="text-xs text-slate-500 font-bold uppercase mt-1">Cliques no WhatsApp</p>
                </div>
              </div>

              <div className="pt-4 flex flex-col gap-3">
                {analyticsData?.all_reports && analyticsData.all_reports.length > 1 ? (
                  <>
                    <button
                      onClick={() => setIsReportsModalOpen(true)}
                      className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-lg hover:from-blue-700 hover:to-indigo-700 transition shadow-xl shadow-blue-200 flex items-center justify-center gap-2"
                    >
                      <FileText size={20} /> Histórico de Relatórios
                    </button>

                    <Dialog open={isReportsModalOpen} onOpenChange={setIsReportsModalOpen}>
                      <DialogContent className="max-w-md w-[90vw] rounded-3xl p-6 bg-gray-50 border-gray-200 shadow-2xl">
                        <DialogHeader>
                          <DialogTitle className="text-xl font-black text-gray-900 flex items-center gap-2 mb-4">
                            <FileText size={24} className="text-blue-600" /> Relatórios Disponíveis
                          </DialogTitle>
                        </DialogHeader>
                        <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-2">
                          {analyticsData.all_reports.map((rep: any) => (
                            <a 
                              key={rep.id}
                              href={`/relatorio/${rep.token}`}
                              target="_blank"
                              rel="noreferrer"
                              className="w-full py-4 px-4 rounded-2xl bg-white border border-gray-200 text-slate-800 font-bold text-base hover:bg-gray-50 transition shadow-sm flex flex-col gap-1"
                            >
                              <div className="flex items-center gap-2">
                                <FileText size={18} className="text-blue-500" />
                                {rep.period_label || 'Relatório Gerado'}
                              </div>
                              {rep.created_at && (
                                <span className="text-xs text-slate-400 font-medium ml-6">
                                  Gerado em: {format(new Date(rep.created_at), 'dd/MM/yyyy HH:mm')}
                                </span>
                              )}
                            </a>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </>
                ) : analyticsData?.token ? (
                  <a 
                    href={`/relatorio/${analyticsData.token}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-lg hover:from-blue-700 hover:to-indigo-700 transition shadow-xl shadow-blue-200 flex items-center justify-center gap-2"
                  >
                    <FileText size={20} /> Apresentar Relatório Oficial
                  </a>
                ) : null}

                <button 
                  onClick={() => setStep('update')}
                  className={`w-full py-4 rounded-2xl font-bold text-lg transition shadow-lg flex items-center justify-center gap-2 ${analyticsData?.token ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 shadow-none' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                >
                  Prosseguir para Cadastro {analyticsData?.token ? '➔' : ''}
                </button>
              </div>
            </div>
          )}

          {/* ABA 2: ATUALIZAÇÃO RÁPIDA */}
          {step === 'update' && (
            <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-sm border border-slate-100">
              <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                <Building2 className="text-red-600" /> Dados Essenciais
              </h3>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">WhatsApp / Telefone</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-red-500 outline-none transition"
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Endereço Principal</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      value={endereco}
                      onChange={(e) => setEndereco(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-red-500 outline-none transition"
                      placeholder="Rua, Número, Bairro"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex gap-4">
                  <button 
                    onClick={() => setStep('renew')}
                    className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition"
                  >
                    Pular
                  </button>
                  <button 
                    onClick={handleUpdateData}
                    disabled={isUpdating}
                    className="flex-[2] py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition disabled:opacity-70"
                  >
                    {isUpdating ? "Salvando..." : "Salvar & Avançar"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ABA 3: RENOVAÇÃO & ASSINATURA */}
          {step === 'renew' && (
            <div className="space-y-6">
              
              {/* Card 1: Publicidade */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                  <Globe className="text-[#B70F0A] w-5 h-5" /> Dados da Publicidade
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Tipo de Publicidade</label>
                    <select 
                      value={tipoPublicidade}
                      onChange={(e) => setTipoPublicidade(e.target.value)}
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="WEB">Portal O Vermelhinho (WEB)</option>
                      <option value="APP">Aplicativo (Mobile)</option>
                      <option value="FISICO">Mídia Física (Outdoor/Totem)</option>
                      <option value="REDES">Redes Sociais (Instagram/FB)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Título do Anúncio <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      value={tituloAnuncio}
                      onChange={(e) => setTituloAnuncio(e.target.value)}
                      placeholder="Título principal"
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Financeiro */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                  <BarChart3 className="text-[#B70F0A] w-5 h-5" /> Financeiro e Valores
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Plano (Ciclo)</label>
                    <select 
                      value={plano}
                      onChange={(e) => setPlano(e.target.value)}
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="anual">Anual</option>
                      <option value="semestral">Semestral</option>
                      <option value="mensal">Mensal</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Valor Base (R$)</label>
                    <input 
                      type="text" 
                      value={valor}
                      onChange={(e) => setValor(formatCurrency(e.target.value))}
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>

                {/* Área de Desconto */}
                <div className="mb-6">
                  <button
                      type="button"
                      onClick={() => setShowDiscount(!showDiscount)}
                      className="flex items-center gap-2 text-[10px] font-black text-red-600 uppercase tracking-widest mb-2 hover:opacity-80 transition-all"
                  >
                      {showDiscount ? "Remover Desconto" : "Aplicar Desconto?"}
                  </button>

                  {showDiscount && (
                      <div className="flex gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200 animate-in slide-in-from-top-2 duration-200">
                          <div className="flex-1">
                              <input
                                  type="text"
                                  value={descontoValor}
                                  onChange={(e) => setDescontoValor(formatCurrency(e.target.value))}
                                  placeholder="Valor"
                                  className="w-full h-12 px-3 border border-slate-200 bg-white rounded-xl font-bold focus:ring-2 focus:ring-red-500 outline-none"
                              />
                          </div>
                          <div className="flex bg-white rounded-xl border border-slate-200 p-1">
                              <button
                                  type="button"
                                  onClick={() => setDescontoTipo('fixed')}
                                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                                      descontoTipo === "fixed" ? "bg-red-600 text-white shadow-md" : "text-slate-400 bg-transparent"
                                  }`}
                              >
                                  R$
                              </button>
                              <button
                                  type="button"
                                  onClick={() => setDescontoTipo('percent')}
                                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                                      descontoTipo === "percent" ? "bg-red-600 text-white shadow-md" : "text-slate-400 bg-transparent"
                                  }`}
                              >
                                  %
                              </button>
                          </div>
                      </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Modo de Pagamento</label>
                    <select value={modoPagamento} onChange={(e) => setModoPagamento(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-red-500">
                      <option value="pix">PIX (Recomendado)</option>
                      <option value="boleto">Boleto Bancário</option>
                      <option value="cartao">Cartão de Crédito</option>
                      <option value="dinheiro">Dinheiro / Outro</option>
                    </select>
                  </div>
                  <div>
                     <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Número de Parcelas</label>
                     <input type="number" value={numParcelas} onChange={(e) => setNumParcelas(parseInt(e.target.value))} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none" />
                  </div>
                </div>
              </div>

              {/* Card 3: Datas */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                  <Calendar className="text-[#B70F0A] w-5 h-5" /> Vigência e Cobrança
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Início</label>
                    <input type="date" value={dataInicio} onChange={handleDataInicioChange} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Fim</label>
                    <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">1ª Parcela</label>
                    <input type="date" value={dataPrimeiraParcela} onChange={(e) => setDataPrimeiraParcela(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none" />
                  </div>
                </div>

                {parcelasPreview.length > 0 && (
                  <div className="mt-6 border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
                    <div className="bg-slate-100 p-3 text-xs font-black uppercase text-slate-500 tracking-wider flex justify-between items-center">
                      <span>Faturas e Vencimentos</span>
                      <span className="text-[10px] text-slate-400 font-bold bg-white px-2 py-1 rounded-full border border-slate-200">Campos Editáveis</span>
                    </div>
                    <div className="p-3 space-y-3 max-h-60 overflow-y-auto">
                      {parcelasPreview.map((p, index) => (
                        <div key={p.numero} className="flex flex-col gap-2 p-4 bg-white rounded-xl shadow-sm border border-slate-100">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.numero}ª Parcela</span>
                          </div>
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <input 
                                type="date" 
                                value={p.vencimento}
                                onChange={(e) => handleParcelaDateChange(index, e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-red-500"
                              />
                            </div>
                            <div className="flex-1 relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">R$</span>
                              <input 
                                type="text" 
                                value={p.valor}
                                onChange={(e) => handleParcelaValorChange(index, e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 pl-8 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-red-500"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Card 4: Observações */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                  <Receipt className="text-[#B70F0A] w-5 h-5" /> Observações
                </h3>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Observações / Acordos</label>
                  <textarea 
                    rows={2}
                    value={obsAnuncio}
                    onChange={(e) => setObsAnuncio(e.target.value)}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-red-500 resize-none mb-4"
                    placeholder="Obs sobre o anúncio/arte..."
                  />
                </div>
                <div>
                  <textarea 
                    rows={2}
                    value={obs}
                    onChange={(e) => setObs(e.target.value)}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-red-500 resize-none"
                    placeholder="Obs financeiras (Acordos, permuta...)"
                  />
                </div>
              </div>

              {/* Card 5: Assinatura */}
              <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-sm border border-slate-100">
                {!assinaturaData && !assinaturaDispensada ? (
                  <>
                    <SignaturePad 
                      onSave={(dataUrl) => setAssinaturaData(dataUrl)}
                      onCancel={() => {}} 
                    />
                    <div className="mt-6 pt-6 border-t border-slate-100">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative flex items-center justify-center">
                          <input 
                            type="checkbox" 
                            checked={assinaturaDispensada}
                            onChange={(e) => setAssinaturaDispensada(e.target.checked)}
                            className="w-6 h-6 rounded-lg border-2 border-slate-300 appearance-none checked:bg-red-600 checked:border-red-600 transition-colors"
                          />
                          <CheckCircle2 size={16} className={`absolute text-white pointer-events-none transition-opacity ${assinaturaDispensada ? 'opacity-100' : 'opacity-0'}`} />
                        </div>
                        <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition">
                          Dispensar assinatura (Acordo via WhatsApp, etc)
                        </span>
                      </label>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
                      <FileSignature size={32} />
                    </div>
                    <h4 className="text-lg font-black text-slate-900 mb-2">
                      {assinaturaDispensada ? "Assinatura Dispensada" : "Assinatura Coletada!"}
                    </h4>
                    {assinaturaData && (
                      <div className="border border-slate-200 rounded-xl p-2 bg-slate-50 w-64 mx-auto mb-4">
                        <img src={assinaturaData} alt="Assinatura" className="w-full h-auto" />
                      </div>
                    )}
                    <button 
                      onClick={() => { setAssinaturaData(null); setAssinaturaDispensada(false); }}
                      className="text-sm font-bold text-slate-500 hover:text-red-600 underline"
                    >
                      Refazer assinatura
                    </button>
                  </div>
                )}
              </div>

              {/* Finalizar */}
              <button 
                type="button"
                onClick={handleFinalize}
                disabled={isSaving}
                className="w-full py-5 rounded-2xl bg-red-600 text-white font-black text-xl hover:bg-red-700 transition shadow-xl disabled:opacity-50 disabled:grayscale"
              >
                {isSaving ? "Finalizando..." : "Concluir Renovação"}
              </button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
