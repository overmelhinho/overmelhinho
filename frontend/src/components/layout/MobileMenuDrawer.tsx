import { NavLink } from "react-router-dom";
import { X, LogOut, User, Target, Sparkles, RefreshCw, Database } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function MobileMenuDrawer({
  isOpen,
  onClose,
  itemsTop,
  itemsBottom,
  renderItem,
}: {
  isOpen: boolean;
  onClose: () => void;
  itemsTop: any[];
  itemsBottom: any[];
  renderItem: (it: any, onClick?: () => void) => React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [offlineStats, setOfflineStats] = useState({ count: 0, lastSync: 'Nunca', size: '0 MB' });

  // Bloqueia scroll do body quando aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      
      // Carrega estatísticas offline
      import('idb-keyval').then(async ({ get }) => {
        try {
          const dbKey = 'offline_clientes_db';
          const existingDb = (await get<any[]>(dbKey)) || [];
          const lastSyncRaw = localStorage.getItem('last_sync_clientes');
          
          let lastSync = 'Nunca';
          if (lastSyncRaw) {
            lastSync = new Date(lastSyncRaw).toLocaleString('pt-BR', {
              day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
            });
          }

          const sizeBytes = new Blob([JSON.stringify(existingDb)]).size;
          const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(2) + ' MB';

          setOfflineStats({ count: existingDb.length, lastSync, size: sizeMB });
        } catch(e) {}
      });
      
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  function handleMinhaConta() {
    onClose();
    navigate("/minha-conta");
  }

  const userRoles = Array.isArray(user?.roles) ? user!.roles : [];
  const isComercial = userRoles.includes("comercial") && !userRoles.includes("admin") && !userRoles.includes("diretoria");

  return (
    <>
      {/* Overlay Backdrop */}
      <div
        className={`fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed inset-x-0 bottom-0 z-[110] flex h-[85vh] flex-col rounded-t-3xl bg-slate-50 transition-transform duration-300 ease-out lg:hidden ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Puxador (Drag Handle) estético */}
        <div className="flex shrink-0 items-center justify-center pt-3 pb-1" onClick={onClose}>
          <div className="h-1.5 w-12 rounded-full bg-slate-300" />
        </div>

        {/* Header do Drawer */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 pb-4 pt-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-white font-bold shadow-sm">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div>
              <div className="font-bold text-slate-900">{user?.name || "Usuário"}</div>
              <div className="text-xs text-slate-500">Menu Principal</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 bg-slate-100 text-slate-500 hover:bg-slate-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="mb-2 px-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Navegação
          </div>
          <div className="space-y-1">
            {renderItem({ to: "/dashboard", label: "Início", icon: <Target size={18} /> }, onClose)}
            {renderItem({ to: "/clientes", label: "Clientes", icon: <Sparkles size={18} /> }, onClose)}
            {renderItem({ to: "/leads-kanban", label: "Leads", icon: <User size={18} /> }, onClose)}
          </div>

          <div className="mt-8 mb-2 px-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Sistema Offline
          </div>
          <div className="mb-3 rounded-xl bg-white p-3 shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
              <Database size={16} className="text-emerald-600" />
              <span className="text-sm font-semibold text-slate-800">Cofre de Dados (PWA)</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Última Sincronização</span>
                <span className="font-medium text-slate-700">{offlineStats.lastSync}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Clientes Baixados</span>
                <span className="font-medium text-slate-700">{offlineStats.count} contatos</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Tamanho Ocupado</span>
                <span className="font-medium text-slate-700">{offlineStats.size}</span>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <button
              onClick={async () => { 
                const { processOutbox, syncOfflineDatabase } = await import('@/services/SyncEngine');
                await processOutbox();
                
                // Limpa o lastSync para forçar um download visual com porcentagem
                localStorage.removeItem('last_sync_clientes');
                await syncOfflineDatabase();
                
                onClose(); 
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-blue-700 hover:bg-blue-50"
            >
              <span className="shrink-0 rounded-lg p-1.5 bg-blue-50">
                <RefreshCw size={18} />
              </span>
              Forçar Sincronização Total
            </button>
          </div>

          <div className="my-8 border-t border-slate-200"></div>

          <div className="space-y-1">
            <button
              onClick={handleMinhaConta}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              <span className="shrink-0 rounded-lg p-1.5 bg-slate-100">
                <User size={18} />
              </span>
              Minha Conta
            </button>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <span className="shrink-0 rounded-lg p-1.5 bg-red-50">
                <LogOut size={18} />
              </span>
              Sair
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
