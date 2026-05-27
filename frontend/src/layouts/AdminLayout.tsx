import { useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import HelpCenter from "@/components/HelpCenter";
import GlobalWarnings from "@/components/GlobalWarnings";

type AppNotification = {
  id: string;
  title: string;
  action: string;
  ticket_title: string;
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [activeToast, setActiveToast] = useState<AppNotification | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  useEffect(() => {
    const handleNotification = (e: any) => {
      const payload = e.detail;
      if (payload) {
        setActiveToast({
          id: Math.random().toString(36).substring(7),
          title: payload.title || "Nova Notificação",
          action: payload.action,
          ticket_title: payload.ticket_title || "",
        });

        // Auto dismiss após 6 segundos
        setTimeout(() => setActiveToast(null), 6000);
      }
    };

    window.addEventListener("app-notification", handleNotification);
    return () => window.removeEventListener("app-notification", handleNotification);
  }, []);

  return (
    <div className="flex h-screen bg-gray-100 relative">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <GlobalWarnings />
        <Header onToggleHelp={() => setIsHelpOpen(!isHelpOpen)} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>

      {/* TOAST GLOBAL DE NOTIFICAÇÃO (REALTIME) */}
      {activeToast && (
        <div className="fixed bottom-6 right-6 z-[9999] w-80 translate-y-0 transform transition-all duration-300">
          <div className="rounded-2xl border border-blue-200 bg-white p-4 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h4 className="text-sm font-bold text-gray-900">{activeToast.title}</h4>
                {activeToast.ticket_title && (
                  <p className="mt-1 text-xs text-gray-600 line-clamp-2">
                    {activeToast.ticket_title}
                  </p>
                )}
              </div>
              <button
                onClick={() => setActiveToast(null)}
                className="text-gray-400 hover:text-gray-600 rounded-lg p-1"
              >
                ✕
              </button>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                className="flex-1 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                onClick={() => {
                  setActiveToast(null);
                }}
              >
                Ver depois
              </button>
            </div>
          </div>
        </div>
      )}
      <HelpCenter isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
}
