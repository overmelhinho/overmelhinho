import { useNavigate } from "react-router-dom";
import { Users, UserPlus, TrendingUp, Briefcase, Calendar, ChevronRight, RefreshCw, AlertCircle } from "lucide-react";
import DailyQuote from "@/components/dashboard/DailyQuote";
import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";

export default function DashboardComercial({ user }: { user: any }) {
  const navigate = useNavigate();

  const { data: renewalsData, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ["clientes", "expiring", "v4"],
    queryFn: async () => {
      // Busca clientes PAGANTES ordenados pelos que vencem mais cedo (backend já filtra os que possuem autorização ativa)
      const res = await api.get("/v1/clientes", {
        params: { tipo_cliente: 'pagante', sort: 'expiring', per_page: 5, lite: true }
      });
      return res.data.data || res.data;
    }
  });

  const renewals = Array.isArray(renewalsData?.data) ? renewalsData.data : (Array.isArray(renewalsData) ? renewalsData : []);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <header className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-sm font-bold uppercase tracking-widest text-red-600">Comercial</h1>
          <p className="text-xl font-bold text-slate-900">Olá, {user?.name?.split(' ')[0] || "Vendedor"}!</p>
        </div>
        
        {dataUpdatedAt > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50/80 border border-green-100 rounded-full shadow-sm" title="Última sincronização com o banco de dados">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider">
              Atualizado às {new Date(dataUpdatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}
      </header>

      <DailyQuote />

      <div className="grid grid-cols-1 gap-4 mt-8 md:grid-cols-2 lg:grid-cols-4 max-w-4xl mx-auto">
        {/* Ação 1: Renovação e Autorização */}
        <button
          onClick={() => navigate("/clientes")}
          className="animate-fade-in-up group relative flex flex-col items-center justify-center gap-4 overflow-hidden rounded-[2rem] bg-gradient-to-br from-red-600 to-red-800 p-8 text-center text-white shadow-xl transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl active:scale-[0.97]"
        >
          {/* Efeito Shimmer */}
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_3s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          
          <div className="relative rounded-full bg-white/20 p-5 ring-4 ring-white/10 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
            <Users className="h-10 w-10 text-white" />
          </div>
          <div className="relative">
            <h2 className="text-xl font-black tracking-tight">Autorização &<br/>Renovação</h2>
            <p className="mt-2 text-sm text-red-100 font-medium">Visitar clientes da carteira</p>
          </div>
          {/* Accent decoration */}
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        </button>

        {/* Ação 2: Novo Cliente */}
        <button
          onClick={() => navigate("/clientes/express")}
          className="animate-fade-in-up group relative flex flex-col items-center justify-center gap-4 overflow-hidden rounded-[2rem] bg-white p-8 text-center shadow-lg border border-slate-100 transition-all duration-300 hover:scale-[1.03] hover:shadow-xl active:scale-[0.97]"
        >
          <div className="rounded-full bg-slate-50 p-5 ring-4 ring-slate-100 transition-transform duration-300 group-hover:scale-110">
            <UserPlus className="h-10 w-10 text-red-600" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-900">Novo Lead</h2>
            <p className="mt-2 text-sm text-slate-500 font-medium">Cadastrar uma loja ou prospecto rápido</p>
          </div>
        </button>

      </div>

      {/* Próximas Renovações */}
      <div className="mt-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <RefreshCw className="text-[#B70F0A] w-5 h-5" />
            Próximas Renovações
          </h2>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(n => (
              <div key={n} className="h-20 bg-white rounded-2xl border border-slate-100 shadow-sm animate-pulse"></div>
            ))}
          </div>
        ) : renewals.length > 0 ? (
          <div className="space-y-3">
            {renewals.slice(0, 5).map((cliente: any) => (
              <div 
                key={cliente.id} 
                onClick={() => navigate(`/clientes/${cliente.id}/venda`)}
                className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center shrink-0">
                    <Calendar className="text-red-600 w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 leading-tight">{cliente.nome_fantasia || "Cliente"}</h3>
                    <p className="text-xs font-semibold text-slate-500 flex items-center gap-1 mt-0.5">
                      {cliente.computed_expiration_date 
                        ? `Vence em: ${new Date(cliente.computed_expiration_date + 'T12:00:00').toLocaleDateString('pt-BR')}` 
                        : cliente.contract_ends_at
                          ? `Vence em: ${new Date(cliente.contract_ends_at + 'T12:00:00').toLocaleDateString('pt-BR')}`
                          : "Sem vencimento"
                      }
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="hidden md:inline-flex items-center gap-1 py-1 px-2.5 rounded-full text-[10px] font-black uppercase bg-green-100 text-green-700">
                    Ativo
                  </span>
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                    <ChevronRight className="text-slate-400 w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
            
            {renewals.length > 5 && (
              <button 
                onClick={() => navigate("/clientes")}
                className="w-full py-4 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
              >
                Ver todos os clientes...
              </button>
            )}
          </div>
        ) : (
          <div className="p-8 bg-white rounded-3xl border border-slate-100 text-center shadow-sm">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-bold">Nenhuma renovação próxima encontrada.</p>
          </div>
        )}
      </div>
    </div>
  );
}
