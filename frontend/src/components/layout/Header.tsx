import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { LogOut, User, ChevronDown, Bell, Check, ExternalLink } from "lucide-react";
import { useNotifications, useMarkNotificationAsRead, useMarkAllNotificationsAsRead } from "@/hooks/useNotifications";

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [openNotif, setOpenNotif] = useState(false);

  const { data, refetch } = useNotifications();
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  const unreadCount = data?.unread_count || 0;
  const notifications = data?.data || [];

  const ref = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleNewNotif() {
      // Atualiza a lista via query client stale invalidate já lidado, mas podemos forçar:
      refetch();
    }
    window.addEventListener("app-notification", handleNewNotif);
    return () => window.removeEventListener("app-notification", handleNewNotif);
  }, [refetch]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setOpenNotif(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  function handleMinhaConta() {
    navigate("/minha-conta");
  }

  function fmtDate(iso: string) {
    if (!iso) return "";
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit"
    });
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
            Plataforma administrativa <span className="ml-2 inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">v1.0.1 (DEV)</span>
          </div>
          <div className="truncate text-lg font-semibold text-slate-900">
            O Vermelhinho
          </div>
        </div>

        <div className="flex items-center gap-4">

          {/* Menu de Notificações */}
          <div className="relative" ref={notifRef}>
            <button
              className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100 transition-colors"
              title="Notificações"
              onClick={() => { setOpenNotif(!openNotif); setOpen(false); }}
            >
              <Bell size={20} className={openNotif ? "text-blue-600" : ""} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {openNotif && (
              <div className="absolute right-0 top-full mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <h3 className="text-sm font-semibold text-slate-900">Notificações</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllAsRead.mutate()}
                      className="text-xs font-medium text-blue-600 hover:text-blue-800"
                    >
                      Marcar todas como lidas
                    </button>
                  )}
                </div>

                <div className="max-h-[350px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-sm text-slate-500">
                      Nenhuma notificação no momento.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {notifications.map((n: any) => (
                        <div
                          key={n.id}
                          className={`group relative p-4 hover:bg-slate-50 ${n.read_at === null ? 'bg-blue-50/50' : ''}`}
                        >
                          <div className="flex gap-3">
                            <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                              <Bell size={14} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-900">
                                {n.data.title}
                              </p>
                              <p className="mt-0.5 text-xs text-slate-600 line-clamp-2">
                                {n.data.ticket_title}
                              </p>
                              <div className="mt-2 flex items-center justify-between">
                                <span className="text-[10px] text-slate-400">
                                  {fmtDate(n.created_at)}
                                </span>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      setOpenNotif(false);
                                      navigate(`/tickets/${n.data.ticket_id}`);
                                      if (!n.read_at) markAsRead.mutate(n.id);
                                    }}
                                    className="flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600 hover:bg-slate-200"
                                  >
                                    <ExternalLink size={10} /> Ver Ticket
                                  </button>
                                  {!n.read_at && (
                                    <button
                                      onClick={() => markAsRead.mutate(n.id)}
                                      title="Marcar como lida"
                                      className="rounded p-1 text-slate-400 hover:bg-blue-100 hover:text-blue-600"
                                    >
                                      <Check size={14} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          {!n.read_at && (
                            <div className="absolute left-0 top-1/2 -mt-1 h-2 w-1 rounded-r-md bg-blue-500" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Menu do Usuário */}
          <div className="relative" ref={ref}>
            <button
              onClick={() => { setOpen(!open); setOpenNotif(false); }}
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
              <div className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
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
      </div>
    </header>
  );
}
