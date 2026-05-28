import DailyQuote from "@/components/dashboard/DailyQuote";
import { Sparkles, Calendar, BookOpen, Clock, Heart, Shield } from "lucide-react";

export default function DashboardDefault({ user }) {
  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return "Bom dia";
    if (hr < 18) return "Boa tarde";
    return "Boa noite";
  };

  const getFormattedDate = () => {
    return new Date().toLocaleDateString("pt-BR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-[#F2F2F2] p-4 md:p-8">
      {/* Header */}
      <header className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-sm font-bold uppercase tracking-widest text-[#B70F0A]">Espaço do Colaborador</h1>
          <p className="text-2xl font-black text-gray-900 mt-1">
            {getGreeting()}, {user?.name || "usuária"}!
          </p>
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
            <Calendar size={12} className="text-gray-400" />
            {getFormattedDate()}
          </p>
        </div>
      </header>

      {/* Daily Quote Card */}
      <DailyQuote user={user} />

      {/* Bento Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Card 1 - Boas Vindas */}
        <div className="relative overflow-hidden rounded-[2rem] border border-gray-200 bg-white p-8 shadow-sm transition-all hover:shadow-md">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-[#B70F0A]">
            <Heart size={24} />
          </div>
          <h3 className="mt-6 text-lg font-black text-gray-900">Seu Espaço de Trabalho</h3>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            Navegue pelo menu lateral para acessar suas ferramentas de trabalho, acompanhar leads, criar campanhas e interagir com clientes.
          </p>
          <div className="pointer-events-none absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-red-500/5 blur-2xl" />
        </div>

        {/* Card 2 - Produtividade e Foco */}
        <div className="relative overflow-hidden rounded-[2rem] border border-gray-200 bg-white p-8 shadow-sm transition-all hover:shadow-md">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <Sparkles size={24} />
          </div>
          <h3 className="mt-6 text-lg font-black text-gray-900">Foco & Organização</h3>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            Mantenha suas tarefas sob controle. Utilize a Fila de Foco no menu para resolver seus pendentes de forma ágil e sem estresse.
          </p>
          <div className="pointer-events-none absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-amber-500/5 blur-2xl" />
        </div>

        {/* Card 3 - Suporte & Ajuda */}
        <div className="relative overflow-hidden rounded-[2rem] border border-gray-200 bg-white p-8 shadow-sm transition-all hover:shadow-md md:col-span-2 lg:col-span-1">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Shield size={24} />
          </div>
          <h3 className="mt-6 text-lg font-black text-gray-900">Segurança & Suporte</h3>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            Precisa de auxílio ou encontrou alguma inconsistência? Clique em "Ajude-me" no topo do painel para abrir um chamado com o time de suporte.
          </p>
          <div className="pointer-events-none absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-blue-500/5 blur-2xl" />
        </div>
      </div>
    </div>
  );
}
