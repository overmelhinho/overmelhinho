import { NavLink } from "react-router-dom";
import { LayoutDashboard, Users, Target, Menu, Ticket, UserPlus } from "lucide-react";

type BottomNavProps = {
  onOpenMenu: () => void;
};

export default function BottomNav({ onOpenMenu }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-[68px] items-center justify-around border-t border-slate-200 bg-white/90 px-2 pb-safe pt-1 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] backdrop-blur-lg lg:hidden">
      <NavLink
        to="/dashboard"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center w-16 gap-1 rounded-xl p-1 transition-colors ${
            isActive ? "text-red-600" : "text-slate-400 hover:text-slate-600"
          }`
        }
      >
        {({ isActive }) => (
          <>
            <div className={`p-1 rounded-full ${isActive ? 'bg-red-50' : ''}`}>
              <LayoutDashboard size={22} className={isActive ? "fill-red-100" : ""} />
            </div>
            <span className="text-[10px] font-semibold">Início</span>
          </>
        )}
      </NavLink>

      <NavLink
        to="/clientes"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center w-16 gap-1 rounded-xl p-1 transition-colors ${
            isActive ? "text-red-600" : "text-slate-400 hover:text-slate-600"
          }`
        }
      >
        {({ isActive }) => (
          <>
            <div className={`p-1 rounded-full ${isActive ? 'bg-red-50' : ''}`}>
              <Users size={22} className={isActive ? "fill-red-100" : ""} />
            </div>
            <span className="text-[10px] font-semibold">Clientes</span>
          </>
        )}
      </NavLink>

      {/* Botão de Ação Central (+ Lead) */}
      <NavLink
        to="/clientes/express"
        className={({ isActive }) =>
          `relative -top-5 flex flex-col items-center justify-center w-16 gap-1 transition-transform active:scale-95`
        }
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-lg shadow-red-600/30 ring-4 ring-slate-50">
          <UserPlus size={26} />
        </div>
        <span className="text-[10px] font-bold text-slate-700">+ Lead</span>
      </NavLink>

      <button
        onClick={onOpenMenu}
        className="flex flex-col items-center justify-center w-16 gap-1 rounded-xl p-1 text-slate-400 transition-colors hover:text-slate-600 active:scale-95"
      >
        <div className="p-1 rounded-full">
          <Menu size={22} />
        </div>
        <span className="text-[10px] font-semibold">Menu</span>
      </button>
    </nav>
  );
}
