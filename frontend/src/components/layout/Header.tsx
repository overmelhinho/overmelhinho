// /var/www/frontend/src/components/layout/Header.tsx
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { LogOut, User, ChevronDown } from "lucide-react";

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  function handleMinhaConta() {
    navigate("/minha-conta");
  }

  const userName = user?.name || "Usuário";
  const firstName = userName.split(" ")[0] || "Usuário";
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="min-w-0">
          <div className="text-xs font-medium text-slate-500">
            Plataforma administrativa
          </div>
          <div className="truncate text-lg font-semibold text-slate-900">
            O Vermelhinho
          </div>
        </div>

        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen((o) => !o)}
            className="group inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm hover:bg-slate-50"
          >
            <div className="hidden text-left sm:block">
              <div className="text-xs text-slate-500">Olá,</div>
              <div className="text-sm font-semibold text-slate-900 -mt-0.5">
                {firstName}
              </div>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-900">
              {initials}
            </div>

            <ChevronDown
              size={16}
              className={`text-slate-500 transition ${open ? "rotate-180" : ""}`}
            />
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
              <div className="px-4 py-3">
                <div className="text-xs text-slate-500">Logado como</div>
                <div className="truncate text-sm font-semibold text-slate-900">
                  {userName}
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              <button
                onClick={handleMinhaConta}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                <User size={16} /> Minha Conta
              </button>

              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut size={16} /> Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
