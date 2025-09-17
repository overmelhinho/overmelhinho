import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { LogOut, User } from "lucide-react";

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Fecha o menu ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  function handleMinhaConta() {
    navigate("/minha-conta");
  }

  // Pega nome e iniciais
  const userName = user?.name || "Usuário";
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <header className="flex justify-between items-center px-6 py-4 bg-white border-b shadow-sm">
      <h1 className="text-2xl font-semibold text-red-700">Dashboard</h1>

      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 px-3 py-2 bg-red-700 text-white rounded-full hover:bg-red-800 transition-colors"
        >
          <span className="text-sm">Olá, {userName.split(" ")[0]}</span>
          <div className="w-8 h-8 flex items-center justify-center bg-red-600 text-white rounded-full font-bold">
            {initials}
          </div>
        </button>
        {open && (
          <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-lg py-2 z-20 border">
            <button
              onClick={handleMinhaConta}
              className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-100 text-gray-800"
            >
              <User size={16} /> Minha Conta
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-100 text-red-600"
            >
              <LogOut size={16} /> Sair
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
