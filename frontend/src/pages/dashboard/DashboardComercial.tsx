import { useNavigate } from "react-router-dom";
import { Users, UserPlus, TrendingUp, Briefcase } from "lucide-react";
import DailyQuote from "@/components/dashboard/DailyQuote";

export default function DashboardComercial({ user }: { user: any }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <header className="mb-6">
        <h1 className="text-sm font-bold uppercase tracking-widest text-red-600">Comercial</h1>
        <p className="text-xl font-bold text-slate-900">Olá, {user?.name?.split(' ')[0] || "Vendedor"}!</p>
      </header>

      <DailyQuote />

      <div className="grid grid-cols-1 gap-4 mt-8 md:grid-cols-2 lg:grid-cols-4 max-w-4xl mx-auto">
        {/* Ação 1: Renovação e Autorização */}
        <button
          onClick={() => navigate("/clientes")}
          className="group relative flex flex-col items-center justify-center gap-4 overflow-hidden rounded-[2rem] bg-gradient-to-br from-red-600 to-red-800 p-8 text-center text-white shadow-xl transition-all hover:scale-[1.02] hover:shadow-2xl active:scale-95"
        >
          <div className="rounded-full bg-white/20 p-5 ring-4 ring-white/10 backdrop-blur-sm transition-transform group-hover:scale-110">
            <Users className="h-10 w-10 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight">Autorização &<br/>Renovação</h2>
            <p className="mt-2 text-sm text-red-100 font-medium">Visitar clientes da carteira</p>
          </div>
          {/* Accent decoration */}
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        </button>

        {/* Ação 2: Novo Cliente */}
        <button
          onClick={() => navigate("/clientes/express")}
          className="group relative flex flex-col items-center justify-center gap-4 overflow-hidden rounded-[2rem] bg-white p-8 text-center shadow-lg border border-slate-100 transition-all hover:scale-[1.02] hover:shadow-xl active:scale-95"
        >
          <div className="rounded-full bg-slate-50 p-5 ring-4 ring-slate-100 transition-transform group-hover:scale-110">
            <UserPlus className="h-10 w-10 text-red-600" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-900">Novo Cliente</h2>
            <p className="mt-2 text-sm text-slate-500 font-medium">Cadastrar empresa pagante ou gratuita</p>
          </div>
        </button>

        {/* Info Card (Optional) */}
        <div className="rounded-[2rem] bg-white p-6 shadow-sm border border-slate-100 flex flex-col justify-center">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-50 text-green-600 rounded-xl">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sua Meta</p>
              <p className="text-xl font-black text-slate-900">Em andamento</p>
            </div>
          </div>
        </div>

        {/* Ferramentas Card */}
        <button
          onClick={() => navigate("/tickets")}
          className="group flex flex-col items-start justify-between rounded-[2rem] bg-slate-900 p-6 text-white shadow-lg transition-all hover:bg-slate-800"
        >
          <div className="p-3 bg-white/10 rounded-xl">
            <Briefcase size={24} />
          </div>
          <div className="text-left mt-4">
            <h3 className="font-bold">Tickets & Suporte</h3>
            <p className="text-xs text-slate-400 mt-1">Acionar equipe interna</p>
          </div>
        </button>
      </div>
    </div>
  );
}
