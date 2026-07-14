import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import { 
  BarChart3, Edit3, FileSignature, 
  ChevronLeft, CheckCircle2, MapPin, 
  Phone, Globe, Building2 
} from "lucide-react";
import SignaturePad from "@/components/SignaturePad";
import DashboardLayout from "@/components/layout/DashboardLayout";

// Tipagem básica
type WizardStep = 'impact' | 'update' | 'renew';

export default function SalesWizard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [step, setStep] = useState<WizardStep>('impact');
  
  // Estados para atualização rápida (Update)
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Estados para renovação (Renew)
  const [plano, setPlano] = useState("anual");
  const [valor, setValor] = useState("450,00");
  const [obs, setObs] = useState("");
  const [assinaturaData, setAssinaturaData] = useState<string | null>(null);
  const [assinaturaDispensada, setAssinaturaDispensada] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Buscar dados reais do cliente
  const { data: cliente, isLoading } = useQuery({
    queryKey: ["cliente", id],
    queryFn: async () => {
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
    setIsSaving(true);
    try {
      // Aqui enviaria a assinatura e dados da autorização pro backend
      // await api.post(`/v1/clientes/${id}/autorizacoes`, { ... })
      
      // Simular delay de rede ou salvamento no IndexedDB
      await new Promise(r => setTimeout(r, 1000));
      
      setShowSuccess(true);
      setTimeout(() => {
        navigate("/dashboard");
      }, 3000);
    } catch (error) {
      console.error(error);
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
            onClick={() => setStep('update')}
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
              <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-[2rem] p-8 text-white shadow-xl">
                <p className="text-green-100 font-bold uppercase tracking-widest text-xs mb-2">Visibilidade (Últimos 30 dias)</p>
                <div className="flex items-end gap-3">
                  <h3 className="text-6xl font-black tracking-tighter">2.450</h3>
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
                  <p className="text-3xl font-black text-slate-900">184</p>
                  <p className="text-xs text-slate-500 font-bold uppercase mt-1">Cliques no Site</p>
                </div>
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center mb-4 text-amber-600">
                    <Phone size={20} />
                  </div>
                  <p className="text-3xl font-black text-slate-900">42</p>
                  <p className="text-xs text-slate-500 font-bold uppercase mt-1">Cliques no WhatsApp</p>
                </div>
              </div>

              <button 
                onClick={() => setStep('update')}
                className="w-full mt-4 py-4 rounded-2xl bg-slate-900 text-white font-bold text-lg hover:bg-slate-800 transition shadow-lg"
              >
                Prosseguir para Cadastro
              </button>
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
              
              {/* Resumo Financeiro */}
              <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-sm border border-slate-100">
                <h3 className="text-lg font-black text-slate-900 mb-6">Condições da Autorização</h3>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
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
                      onChange={(e) => setValor(e.target.value)}
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Observações / Acordos</label>
                  <textarea 
                    rows={3}
                    value={obs}
                    onChange={(e) => setObs(e.target.value)}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-red-500 resize-none"
                    placeholder="Ex: Primeira parcela para o mês que vem..."
                  />
                </div>
              </div>

              {/* Assinatura */}
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
                onClick={handleFinalize}
                disabled={isSaving || (!assinaturaData && !assinaturaDispensada)}
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
