// /var/www/frontend/src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import router from "./routes";
import "./index.css";
import { AuthProvider } from "@/contexts/AuthContext";
import ReactQueryProvider from "@/contexts/ReactQueryProvider";
import { Toaster } from "react-hot-toast";
import { Toaster as SonnerToaster } from "sonner";
import { initGA } from "@/lib/analytics";
import { AppUpdateBanner } from "@/components/AppUpdateBanner";

// 🔍 Debug global para capturar o erro real mesmo no build minificado
window.onerror = function (message, source, lineno, colno, error) {
  console.group("🚨 React Error Captured");
  console.log("🧾 Mensagem:", message);
  console.log("📂 Arquivo:", source);
  console.log("📍 Linha:", lineno, "Coluna:", colno);
  console.log("🧠 Stack:", (error as any)?.stack);
  console.groupEnd();
  return false;
};

// Inicializa o Google Analytics 4 com segurança
try {
  initGA();
} catch (e) {
  console.error("Falha ao inicializar GA4:", e);
}
// 🔍 Captura também erros em Promises e React internamente
window.addEventListener("unhandledrejection", (event) => {

  console.group("🚨 Unhandled Promise Rejection");
  console.error("💥 Motivo:", (event as any).reason);
  console.error("🧠 Stack:", (event as any).reason?.stack);
  console.groupEnd();
});

// Build trigger: 2026-03-11 13:10
console.log("🚀 React Bootstrapping dashboard...");
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ReactQueryProvider>
      <AuthProvider>
        <RouterProvider router={router} />

        {/* ✅ Banner de atualização do PWA — aparece apenas após novo deploy */}
        <AppUpdateBanner />

        {/* ✅ Toaster global (necessário para aparecer toast.success/toast.error) */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 2000,
            style: {
              zIndex: 9999, // ✅ acima de Dialog/overlay
            },
          }}
        />
        <SonnerToaster richColors position="top-right" />
      </AuthProvider>
    </ReactQueryProvider>
  </React.StrictMode>
);
